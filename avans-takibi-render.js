/*
  avans-takibi-render.js — VERSİYON: WG.021026.1910.713
  ========================
  Özel Avans / İş Avansı / İş Avansı Harcamaları listelerini yönetir.
  Dönem artık ‹ › okları (veya kaydırarak) tek tek ay adımıyla değişir
  (27.09.2026) — kapatılmamış herhangi bir aya (geçmiş dahil) gidip orada
  da giriş yapılabilir. Her ekleme/silme ANINDA AvansKayitData.taslakGuncelle()
  ile seçili dönemin taslağına yazılır.

  02.10.2026 (Abdullah'ın isteğiyle) — bu sayfa artık kendi başına yeni
  bir dönem AÇAMAZ. "+ Yeni Ay" düğmesi kaldırıldı; "›" oku, Maaş
  Hesaplama'nın resmi açık dönemine (MaasKayitData.acikDonem()) gelince
  otomatik gizlenir — daha ileri gidilemez. Tek kontrol noktası Maaş
  Hesaplama'daki "GEÇERLİ AYIN HESABI KAPANDI" düğmesidir: o basılınca
  MaasKayitData'nın açık dönemi ilerler ve bu sayfa, EĞER o an canlı/açık
  dönemi izliyorsa (avCanliMi), otomatik olarak yeni açık döneme geçer
  (bkz. avCanliMi, avDonemBariCiz, MaasKayitData.degistiginde altındaki
  dinleyici). Geçmiş bir ayı inceliyorsan (avCanliMi=false), bir dönem
  kapanması seni oradan koparmaz.

  02.10.2026 (Abdullah'ın isteğiyle, ikinci ek) — avGecmisAvanlarCiz():
  kapanmış TÜM avans dönemlerini (AvansKayitData.tumKayitlar()), tutar ve
  "bekliyor / hangi aya dahil edildi" durumuyla tek tabloda gösterir (bkz.
  #avGecmisSection — avans-takibi.html). Hiçbir yeni veri yazmaz, sadece
  var olan kayıtları (toplamKesinti, ozelAvansToplam, isAvansiBelgesizKalan,
  maasaDahilEdildigiDonem) okuyup raporlar. AvansKayitData.degistiginde
  dinleyicisinde çağrılır, avSeciliAy/avSeciliYil'den BAĞIMSIZDIR (hangi
  dönem görüntüleniyor olursa olsun hep TÜM geçmişi gösterir).
*/

var AY_ADLARI_AV = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

var avOzelListe = [];
var avIsListe = [];
var avHarcamaListe = [];
var avSeciliAy = null;
var avSeciliYil = null;
// CANLI TAKİP (02.10.2026) — true: şu an görüntülenen ay, Maaş
// Hesaplama'nın resmi açık/canlı dönemiyle aynı (yani bu sayfa, bir ay
// kapandığında otomatik olarak yeni açık döneme geçmeli). false: geçmiş,
// kapanmış bir ay geriye gidilerek inceleniyor — bu durumda bir dönem
// kapanması bu sayfadaki görünümü DEĞİŞTİRMEMELİ.
var avCanliMi = true;

function fmtTL_AV(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}
function htmlEsc_AV(s){
  return (s==null?"":String(s)).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c];
  });
}
function fmtTarihKisa_AV(iso){
  if(!iso) return "-";
  var p = iso.split("-");
  if(p.length!==3) return iso;
  return p[2] + "." + p[1] + "." + p[0].slice(2);
}
// Türkçe tutar biçimi: binlik ayraç "." , ondalık ayraç ",". "20.000" -> 20000.
function tutarParse_AV(s){
  s = (s||"").toString().trim();
  if(!s) return 0;
  s = s.replace(/\./g, "").replace(",", ".");
  var v = parseFloat(s);
  return isNaN(v) ? 0 : v;
}

function tarihiGuncelle_AV(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI_AV[d.getMonth()+1] + " " + d.getFullYear();
  }catch(e){}
}

function avToplamHesapla(liste){
  return liste.reduce(function(s,x){ return s + (x.tutar||0); }, 0);
}

function avToplamlariHesapla(veri){
  var ozelToplam = avToplamHesapla(veri.ozelAvansGirisleri||[]);
  var isToplam = avToplamHesapla(veri.isAvansiGirisleri||[]);
  var belgelenenToplam = avToplamHesapla(veri.isAvansiHarcamalar||[]);
  var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
  var toplamKesinti = ozelToplam + isKesilecek;
  return {ozelToplam:ozelToplam, isToplam:isToplam, belgelenenToplam:belgelenenToplam, isKesilecek:isKesilecek, toplamKesinti:toplamKesinti};
}

function avTabloCiz(govdeId, bosId, liste, kolonEtiket){
  var govde = document.getElementById(govdeId);
  govde.innerHTML = liste.map(function(h, idx){
    return "<tr><td>" + fmtTarihKisa_AV(h.tarih) + "</td>"
      + "<td>" + (kolonEtiket==="etiket" ? "<span class='mh-harcama-etiket-rozet'>"+htmlEsc_AV(h.cesit||h.aciklama)+"</span>" : htmlEsc_AV(h.aciklama||h.cesit)) + "</td>"
      + "<td>" + fmtTL_AV(h.tutar) + "</td>"
      + "<td><button type='button' class='mh-harcama-sil-btn' data-idx='" + idx + "'>🗑</button></td></tr>";
  }).join("");
  document.getElementById(bosId).hidden = liste.length > 0;
  return govde;
}

// BİRLEŞİK AVANS LİSTESİ (24.09.2026) — İş ve Özel avans artık TEK
// listede, tarihe göre sıralı, her satırın başında İŞ/ÖZEL etiketiyle
// gösteriliyor. Veri modeli değişmedi (avIsListe/avOzelListe hâlâ AYRI
// diziler — Maaş Hesaplama'nın toplam hesapları buna göre kurulu),
// sadece EKRANDA birleştirilip çiziliyor. Silme, satırın hangi tip/
// index'ten geldiğini data-tip/data-idx ile takip eder.
function avListeCiz(){
  var birlesik = avIsListe.map(function(x, i){ return Object.assign({tip:"is", idx:i}, x); })
    .concat(avOzelListe.map(function(x, i){ return Object.assign({tip:"ozel", idx:i}, x); }));
  birlesik.sort(function(a, b){ return (b.tarih||"").localeCompare(a.tarih||""); });
  var govde = document.getElementById("avListeGovde");
  govde.innerHTML = birlesik.map(function(h){
    var etiket = h.tip==="is"
      ? "<span class='av-satir-etiket av-satir-etiket--is'>İŞ</span>"
      : "<span class='av-satir-etiket av-satir-etiket--ozel'>ÖZEL</span>";
    return "<tr><td>" + etiket + "</td><td>" + fmtTarihKisa_AV(h.tarih) + "</td>"
      + "<td>" + htmlEsc_AV(h.aciklama) + "</td><td>" + fmtTL_AV(h.tutar) + "</td>"
      + "<td><button type='button' class='mh-harcama-sil-btn' data-tip='" + h.tip + "' data-idx='" + h.idx + "'>🗑</button></td></tr>";
  }).join("");
  document.getElementById("avListeBos").hidden = birlesik.length > 0;
  govde.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){
      var tip = this.getAttribute("data-tip");
      var idx = parseInt(this.getAttribute("data-idx"), 10);
      if(tip === "is") avIsListe.splice(idx, 1); else avOzelListe.splice(idx, 1);
      avTaslagiKaydet(); avCiz(); avKaydedildiGoster();
    };
  });
}

// KAYDEDİLDİ ROZETİ (24.09.2026) — her ekleme/silmeden sonra 2 saniye
// görünüp kendiliğinden kaybolur; Abdullah'ın "kaydettiğimi bilmiyorum,
// geri çıkmaya korkuyorum" geri bildirimine karşılık.
var avKaydedildiZamanlayici = null;
function avKaydedildiGoster(){
  var el = document.getElementById("avKaydedildiRozeti");
  if(!el) return;
  el.hidden = false;
  if(avKaydedildiZamanlayici) clearTimeout(avKaydedildiZamanlayici);
  avKaydedildiZamanlayici = setTimeout(function(){ el.hidden = true; }, 2000);
}

function avTaslagiKaydet(){
  AvansKayitData.taslakGuncelle(avSeciliAy, avSeciliYil, {
    ozelAvansGirisleri: avOzelListe,
    isAvansiGirisleri: avIsListe,
    isAvansiHarcamalar: avHarcamaListe
  }, function(basarili, err){
    if(!basarili) console.error("Taslak kaydedilemedi:", err);
  });
}

// AY ADIMLAMA (27.09.2026, Abdullah'ın isteğiyle yeniden tasarım) — dönem
// artık uzun bir listeden değil, ‹ › okları (veya kaydırarak) tek tek ay
// adımıyla değişiyor. KAPATILMIŞ aylar artık ATLANMAZ — salt okunur olarak
// gösterilir (bkz. avDonemeGec/avKapaliGoster); ayrı bir "Kayıt Geçmişi"
// listesine bu yüzden gerek kalmadı, aynı ‹ › ile geriye gidilerek görülür.
function avSonrakiAy(ay, yil){ ay++; if(ay>12){ ay=1; yil++; } return {ay:ay, yil:yil}; }
function avOncekiAy(ay, yil){ ay--; if(ay<1){ ay=12; yil--; } return {ay:ay, yil:yil}; }

// Dönem barını çizer: ay/yıl etiketi + "›" oku görünürlüğü. 02.10.2026
// (Abdullah'ın isteğiyle) — "+ Yeni Ay" düğmesi kaldırıldı; bu sayfa artık
// kendi başına yeni bir dönem AÇAMAZ. "›" oku, Maaş Hesaplama'nın resmi
// açık dönemine (MaasKayitData.acikDonem()) ULAŞILINCA gizlenir — daha
// ileri gidip henüz resmi olarak açılmamış bir ayın taslağını doldurmak
// artık mümkün değil. Yeni dönem sadece Maaş Hesaplama'dan kapatılarak
// açılır (bkz. dosya başı not + MaasKayitData.degistiginde dinleyicisi).
function avDonemBariCiz(){
  var etiket = document.getElementById("avDonemBtnMetin");
  if(etiket && avSeciliAy && avSeciliYil) etiket.textContent = AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil;
  var acik = MaasKayitData.acikDonem();
  var acikDonemdeMiyiz = (avSeciliAy === acik.ay && avSeciliYil === acik.yil);
  var btnSonraki = document.getElementById("avDonemSonrakiBtn");
  if(btnSonraki) btnSonraki.hidden = acikDonemdeMiyiz;
}

// DÜZENLEME/SALT-OKUNUR GÖRÜNÜRLÜK (27.09.2026) — kapalı bir döneme
// gelindiğinde giriş bölümleri (AVANS EKLE / HARCAMALAR) ve alt not
// gizlenir, yerine kapalı-dönem şeridi (silme düğmesiyle) gösterilir.
function avDuzenlemeGorunurlugunuAyarla(gorunurMu){
  document.getElementById("avEkleSection").hidden = !gorunurMu;
  document.getElementById("avHarcamaSection").hidden = !gorunurMu;
  document.getElementById("avKapaliSerit").hidden = gorunurMu;
  document.getElementById("btnAvKapaliKaydiSil").hidden = gorunurMu;
}

function avKapaliGoster(k){
  avDuzenlemeGorunurlugunuAyarla(false);
  document.getElementById("avToplamOzel").textContent = fmtTL_AV(k.ozelAvansToplam||0);
  document.getElementById("avToplamIs").textContent = fmtTL_AV(k.isAvansiBelgesizKalan||0);
  document.getElementById("avToplamGenel").textContent = fmtTL_AV(k.toplamKesinti||0);
  document.getElementById("btnAvKapaliKaydiSil").setAttribute("data-anahtar", k.anahtar);
}

function avDonemeGec(ay, yil){
  avSeciliAy = ay; avSeciliYil = yil;
  var acik = MaasKayitData.acikDonem();
  avCanliMi = (ay === acik.ay && yil === acik.yil);
  avDonemBariCiz();
  var kapali = AvansKayitData.kapaliKaydiBul(ay, yil);
  if(kapali){
    avKapaliGoster(kapali);
  } else {
    avDuzenlemeGorunurlugunuAyarla(true);
    var taslak = AvansKayitData.taslakOku(ay, yil);
    avOzelListe = taslak.ozelAvansGirisleri || [];
    avIsListe = taslak.isAvansiGirisleri || [];
    avHarcamaListe = taslak.isAvansiHarcamalar || [];
    avCiz();
  }
  avBaskaDonemdeTaslakGoster();
}

// GÜVENLİK BANDI (27.09.2026) — dönem senkron düzeltmesinden sonra
// eklendi: hangi ay "resmi açık dönem" sayılırsa sayılsın, kullanıcının
// daha önce (eski/şaşan mantıkla) başka bir ay'a girdiği ve HÂLÂ Firebase'de
// duran ama şu an ekranda görünmeyen bir taslak varsa, bunu asla sessizce
// kaybettirmeyip açıkça bildiriyoruz.
function avTaslakDoluMu(t){
  if(!t) return false;
  return (t.ozelAvansGirisleri||[]).length>0 || (t.isAvansiGirisleri||[]).length>0 || (t.isAvansiHarcamalar||[]).length>0;
}
function avBaskaDonemdeTaslakGoster(){
  var banner = document.getElementById("avBaskaTaslakBanner");
  var alt = document.getElementById("avBaskaTaslakBannerAlt");
  if(!banner || !alt) return;
  if(!AvansKayitData.taslakYuklendiMi() || !avSeciliAy || !avSeciliYil){ banner.hidden = true; return; }
  var buraya = avSeciliYil + "-" + ("0"+avSeciliAy).slice(-2);
  var bulunanlar = AvansKayitData.tumTaslaklar().filter(function(t){
    return t.anahtar !== buraya && avTaslakDoluMu(t);
  });
  if(!bulunanlar.length){ banner.hidden = true; return; }
  banner.hidden = false;
  alt.textContent = bulunanlar.map(function(t){ return AY_ADLARI_AV[t.ay] + " " + t.yil; }).join(", ") + " — dokun ve gör";
  banner.onclick = function(){ avDonemeGec(bulunanlar[0].ay, bulunanlar[0].yil); };
}

function avCiz(){
  avListeCiz();
  var govdeHarcama = avTabloCiz("avHarcamaTabloGovde", "avHarcamaBos", avHarcamaListe, "etiket");
  govdeHarcama.querySelectorAll(".mh-harcama-sil-btn").forEach(function(btn){
    btn.onclick = function(){ avHarcamaListe.splice(parseInt(this.getAttribute("data-idx"),10),1); avTaslagiKaydet(); avCiz(); avKaydedildiGoster(); };
  });

  var t = avToplamlariHesapla({ozelAvansGirisleri:avOzelListe, isAvansiGirisleri:avIsListe, isAvansiHarcamalar:avHarcamaListe});
  document.getElementById("avBelgelenenToplam").textContent = fmtTL_AV(t.belgelenenToplam);
  document.getElementById("avIsKesilecek2").textContent = fmtTL_AV(t.isKesilecek);
  document.getElementById("avIsToplam2").textContent = fmtTL_AV(t.isToplam);
  document.getElementById("avOzelToplam2").textContent = fmtTL_AV(t.ozelToplam);
  document.getElementById("avToplamOzel").textContent = fmtTL_AV(t.ozelToplam);
  document.getElementById("avToplamIs").textContent = fmtTL_AV(t.isKesilecek);
  document.getElementById("avToplamGenel").textContent = fmtTL_AV(t.toplamKesinti);
}

// GEÇMİŞ AVANSLAR (02.10.2026, Abdullah'ın isteğiyle) — bkz. dosya başı
// not. avSeciliAy/avSeciliYil'den bağımsız: hep TÜM kapanmış dönemleri
// gösterir, hangi ay o an görüntüleniyor olursa olsun.
function avGecmisAvanlarCiz(){
  var govde = document.getElementById("avGecmisTabloGovde");
  var section = document.getElementById("avGecmisSection");
  var ozet = document.getElementById("avGecmisOzet");
  if(!govde || !section || !ozet || typeof AvansKayitData === "undefined") return;

  var liste = AvansKayitData.tumKayitlar().filter(function(k){ return (k.toplamKesinti||0) > 0; });
  if(!liste.length){ section.hidden = true; return; }
  section.hidden = false;

  var bekleyenToplam = 0, bekleyenSayisi = 0;
  govde.innerHTML = liste.map(function(k){
    var ozelTutar = k.ozelAvansToplam || 0;
    var isBelgesizTutar = k.isAvansiBelgesizKalan || 0;
    var durumHtml;
    if(k.maasaDahilEdildigiDonem){
      var p = (k.maasaDahilEdildigiDonem||"").split("-");
      var hedefAy = parseInt(p[1], 10), hedefYil = p[0] || "";
      var hedefAyKisa = AY_ADLARI_AV[hedefAy] ? AY_ADLARI_AV[hedefAy].slice(0,3) : "?";
      durumHtml = "<span class='av-gecmis-durum av-gecmis-durum--tamam'>✓ " + hedefAyKisa + " " + hedefYil + "</span>";
    } else {
      bekleyenToplam += (k.toplamKesinti||0);
      bekleyenSayisi++;
      durumHtml = "<span class='av-gecmis-durum av-gecmis-durum--bekliyor'>⏳ Bekliyor</span>";
    }
    return "<tr><td>" + AY_ADLARI_AV[k.ay] + " " + k.yil
      + "<span class='av-gecmis-ay-alt'>Özel " + fmtTL_AV(ozelTutar) + " · İş (belgesiz) " + fmtTL_AV(isBelgesizTutar) + "</span></td>"
      + "<td>" + fmtTL_AV(k.toplamKesinti) + "</td>"
      + "<td>" + durumHtml + "</td></tr>";
  }).join("");

  ozet.textContent = bekleyenSayisi > 0
    ? "Toplam " + fmtTL_AV(bekleyenToplam) + " kesilmeyi bekliyor (" + bekleyenSayisi + " dönem)."
    : "Tüm geçmiş avanslar bir maaş hesabına dahil edilmiş.";
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_AV();
  var btnMenuEl = document.getElementById("btnMenu");
  if(btnMenuEl) btnMenuEl.onclick = function(){ window.location.href = "menu.html"; };
  // KRİTİK HATA DÜZELTMESİ (24.09.2026): Firebase'den ilk veri paketi
  // gelene kadar ekleme/silme butonlarını KİLİTLE — aksi halde kullanıcı
  // veri daha gelmeden bir şey eklerse, boş listeyi Firebase'e YAZIP
  // gerçek (henüz görünmeyen) kayıtları SİLEBİLİRDİ. Veri gelince
  // avYuklemeKilidiniAc() kilidi kaldırır.
  var avButonlar = ["btnAvEkle","btnHarcamaEkle"];
  function avYuklemeKilidiniKapat(){
    avButonlar.forEach(function(id){ document.getElementById(id).disabled = true; });
  }
  function avYuklemeKilidiniAc(){
    avButonlar.forEach(function(id){ document.getElementById(id).disabled = false; });
  }
  avYuklemeKilidiniKapat();

  // İKİNCİ KRİTİK HATA DÜZELTMESİ (24.09.2026): İLK dönem geçişini artık
  // burada SENKRON yapmıyoruz — kayitlar (kapalı aylar) gelmeden acikDonem()
  // yanlış ay hesaplayabiliyordu (bkz. avans-kayit-data.js). Hem kayıtlar
  // hem taslak gelene kadar bekleriz; gelince aşağıdaki degistiginde
  // dinleyicisi ilk (ve sadece ilk) geçişi yapar.
  var avIlkGecisYapildiMi = false;
  function avIlkGecisiDeneVeYap(){
    if(avIlkGecisYapildiMi) return;
    // TEK KAYNAK (27.09.2026): açık dönem artık MaasKayitData'dan okunur —
    // Maaş Hesaplama hangi ayı açık görüyorsa Avans Takibi de aynısını görür.
    if(!MaasKayitData.kayitlarYuklendiMi() || !AvansKayitData.taslakYuklendiMi()) return;
    avIlkGecisYapildiMi = true;
    var acik = MaasKayitData.acikDonem();
    avDonemeGec(acik.ay, acik.yil);
    avYuklemeKilidiniAc();
  }
  avIlkGecisiDeneVeYap();
  avGecmisAvanlarCiz();

  // DÖNEM BARI (27.09.2026 tasarım, 02.10.2026 revize) — ‹ › okları +
  // kaydırma (swipe). KAPATILMIŞ aylar atlanmadan tek tek gösterilir (salt
  // okunur). "›" artık Maaş Hesaplama'nın resmi açık dönemini GEÇEMEZ —
  // avDonemBariCiz o noktada "›"yı zaten gizliyor, ama avSonrakiAyaGec de
  // ek bir güvenlik olarak aynı sınırı uygular.
  document.getElementById("avDonemOncekiBtn").onclick = function(){
    var g = avOncekiAy(avSeciliAy, avSeciliYil);
    avDonemeGec(g.ay, g.yil);
  };
  function avSonrakiAyaGec(){
    var acik = MaasKayitData.acikDonem();
    if(avSeciliAy === acik.ay && avSeciliYil === acik.yil) return; // zaten açık dönemde, daha ileri gidilemez
    var g = avSonrakiAy(avSeciliAy, avSeciliYil);
    avDonemeGec(g.ay, g.yil);
  }
  document.getElementById("avDonemSonrakiBtn").onclick = avSonrakiAyaGec;

  (function(){
    var bar = document.getElementById("avDonemBar");
    var baslangicX = null, baslangicY = null;
    bar.addEventListener("touchstart", function(ev){
      var t = ev.touches[0];
      baslangicX = t.clientX; baslangicY = t.clientY;
    }, {passive:true});
    bar.addEventListener("touchend", function(ev){
      if(baslangicX == null) return;
      var t = ev.changedTouches[0];
      var dx = t.clientX - baslangicX, dy = t.clientY - baslangicY;
      baslangicX = null; baslangicY = null;
      if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)*1.5) return; // yatay kaydırma değilse yoksay
      if(dx > 0){ document.getElementById("avDonemOncekiBtn").onclick(); }
      else { avSonrakiAyaGec(); }
    }, {passive:true});
  })();

  // TİP DÜĞMESİ (24.09.2026) — ayrı bir "İş/Özel" satırı yerine, giriş
  // satırının başındaki tek düğmeye dokununca küçük bir seçim popup'ı
  // açılıyor (Abdullah'ın isteği: "Ekle tuşu gibi tek bir tuş").
  var avSeciliTip = "is";
  var avTipBtn = document.getElementById("avTipBtn");
  var avTipPopup = document.getElementById("avTipPopup");
  avTipBtn.onclick = function(){ avTipPopup.hidden = !avTipPopup.hidden; };
  avTipPopup.querySelectorAll(".av-tip-secenek").forEach(function(btn){
    btn.onclick = function(){
      avSeciliTip = this.getAttribute("data-tip");
      avTipBtn.setAttribute("data-tip", avSeciliTip);
      avTipBtn.innerHTML = (avSeciliTip==="is" ? "İŞ" : "ÖZEL") + "<span class='av-tip-ok'>▾</span>";
      avTipPopup.hidden = true;
    };
  });

  // MANUEL KAYDET (24.09.2026) — sistem zaten her satırda otomatik
  // kaydediyor, ama Abdullah'a ek güven vermesi için elle basılabilen bir
  // düğme de eklendi; bastığında aynı taslağı tekrar yazar ve büyük/net
  // bir "✓ Kaydedildi" onayı gösterir.
  // HARCAMALAR bölümünün altına da aynı "Bilgileri Kaydet" düğmesi
  // eklendi (27.09.2026, Abdullah'ın isteğiyle) — ikisi de aynı taslağı
  // kaydeder, hangisine basılırsa basılsın davranış birebir aynı.
  function avManuelKaydetTiklandi(){
    var btn = this;
    var eskiMetin = btn.textContent;
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";
    avTaslagiKaydet();
    setTimeout(function(){
      btn.disabled = false;
      btn.textContent = eskiMetin;
      avKaydedildiGoster();
    }, 400);
  }
  document.getElementById("btnAvManuelKaydet").onclick = avManuelKaydetTiklandi;
  document.getElementById("btnAvManuelKaydet2").onclick = avManuelKaydetTiklandi;

  document.getElementById("btnAvEkle").onclick = function(){
    var tarih = document.getElementById("avTarih").value;
    var aciklama = document.getElementById("avAciklama").value.trim();
    var tutar = tutarParse_AV(document.getElementById("avTutar").value);
    if(!tarih || !aciklama || tutar<=0){ alert("Tarih, açıklama ve tutar (0'dan büyük) gerekli."); return; }
    if(avSeciliTip === "is"){ avIsListe.push({tarih:tarih, aciklama:aciklama, tutar:tutar}); }
    else { avOzelListe.push({tarih:tarih, aciklama:aciklama, tutar:tutar}); }
    document.getElementById("avTarih").value = "";
    document.getElementById("avAciklama").value = "";
    document.getElementById("avTutar").value = "";
    avTaslagiKaydet(); avCiz(); avKaydedildiGoster();
  };

  document.getElementById("btnHarcamaEkle").onclick = function(){
    var tarih = document.getElementById("avHarcamaTarih").value;
    var cesit = document.getElementById("avHarcamaCesit").value.trim();
    var tutar = tutarParse_AV(document.getElementById("avHarcamaTutar").value);
    if(!tarih || !cesit || tutar<=0){ alert("Tarih, çeşit ve tutar (0'dan büyük) gerekli."); return; }
    avHarcamaListe.push({tarih:tarih, cesit:cesit, tutar:tutar});
    document.getElementById("avHarcamaTarih").value = "";
    document.getElementById("avHarcamaCesit").value = "";
    document.getElementById("avHarcamaTutar").value = "";
    avTaslagiKaydet(); avCiz(); avKaydedildiGoster();
  };

  // KAPALI KAYDI SİL (27.09.2026) — sadece kapalı bir dönem görüntülenirken
  // görünür; sildiğinde ay tekrar açık (düzenlenebilir/taslak) hale gelir.
  document.getElementById("btnAvKapaliKaydiSil").onclick = function(){
    var anahtar = this.getAttribute("data-anahtar");
    if(!anahtar) return;
    if(!confirm("Bu kaydı silmek istediğine emin misin? Bu ay tekrar açık (düzenlenebilir) hale gelecek.")) return;
    AvansKayitData.kaydiSil(anahtar, function(basarili, err){
      if(!basarili){ alert("Silinemedi: " + (err && err.message)); return; }
      avDonemeGec(avSeciliAy, avSeciliYil);
    });
  };

  AvansKayitData.degistiginde(function(){
    avDonemBariCiz();
    avIlkGecisiDeneVeYap();
    avGecmisAvanlarCiz();
    // KRİTİK HATA DÜZELTMESİ (24.09.2026): Firebase'den her yeni veri
    // paketi geldiğinde (özellikle SAYFA AÇILDIKTAN SONRA gelen İLK
    // paket), seçili dönemi TAZE veriyle yeniden değerlendir (açık mı
    // kapalı mı olduğu da değişmiş olabilir) — eskiden bu satır yoktu,
    // ekran ilk boş çizdiği haliyle kalıyor, kayıtlar Firebase'de
    // dururken sayfada "silinmiş" gibi görünüyordu.
    if(avSeciliAy && avSeciliYil) avDonemeGec(avSeciliAy, avSeciliYil);
    if(AvansKayitData.taslakYuklendiMi()) avYuklemeKilidiniAc();
  });

  // MaasKayitData artık açık/kapalı dönem belirlemede TEK KAYNAK — o
  // yüklenince (veya bir dönem Maaş Hesaplama'dan kapatılınca) burada da
  // ilk geçiş denenir. 02.10.2026 (Abdullah'ın isteğiyle): eğer o an canlı/
  // açık dönemi izliyorsak (avCanliMi), bir dönem kapanması bu sayfayı
  // OTOMATİK olarak yeni açık döneme geçirir — elle "›"ye basmaya gerek
  // kalmaz. Geçmiş bir ayı inceliyorsak (avCanliMi=false), sadece dönem
  // barının ok görünürlüğü tazelenir, görünümden koparılmayız.
  try{
    MaasKayitData.degistiginde(function(){
      avIlkGecisiDeneVeYap();
      if(avSeciliAy && avSeciliYil){
        if(avCanliMi){
          var acik = MaasKayitData.acikDonem();
          if(avSeciliAy !== acik.ay || avSeciliYil !== acik.yil){ avDonemeGec(acik.ay, acik.yil); return; }
        }
        avDonemBariCiz();
      }
    });
  }catch(e){}
});
