/*
  avans-takibi-render.js
  ========================
  Özel Avans / İş Avansı / İş Avansı Harcamaları listelerini yönetir.
  Dönem artık ‹ › okları (veya kaydırarak) tek tek ay adımıyla değişir
  (27.09.2026) — kapatılmamış herhangi bir aya (geçmiş dahil) gidip orada
  da giriş yapılabilir. Her ekleme/silme ANINDA AvansKayitData.taslakGuncelle()
  ile seçili dönemin taslağına yazılır.
*/

var AY_ADLARI_AV = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];

var avOzelListe = [];
var avIsListe = [];
var avHarcamaListe = [];
var avSeciliAy = null;
var avSeciliYil = null;

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

// Dönem seçiciyi doldurur: AÇIK DÖNEM'in doğal başlangıç noktasından
// (hiç kayıt yokken "bir önceki ay") itibaren 18 ay ileriye kadar — geçmiş
// yıllar listelenmez. ZATEN KAPATILMIŞ aylar da listelenmez (onlar Kayıt
// Geçmişi'nde; yanlışlıkla kapatıldıysa oradan silinip buraya geri gelir).
function avBaslangicNoktasi(){
  var simdi = new Date();
  var ay = simdi.getMonth(); // 0-index = zaten "bir önceki ay"ın 1-index karşılığı
  var yil = simdi.getFullYear();
  if(ay < 1){ ay = 12; yil -= 1; }
  return {ay:ay, yil:yil};
}

// AY ADIMLAMA (27.09.2026, Abdullah'ın isteğiyle yeniden tasarım) — dönem
// artık uzun bir listeden değil, ‹ › okları (veya kaydırarak) tek tek ay
// adımıyla değişiyor. Zaten KAPATILMIŞ aylar atlanır (onlar Kayıt
// Geçmişi'nde), tıpkı eskiden listeden de çıkarıldıkları gibi.
function avSonrakiAy(ay, yil){ ay++; if(ay>12){ ay=1; yil++; } return {ay:ay, yil:yil}; }
function avOncekiAy(ay, yil){ ay--; if(ay<1){ ay=12; yil--; } return {ay:ay, yil:yil}; }

// TEK KAYNAK (27.09.2026 senkron düzeltmesi) — "bu ay kapalı mı?" sorusunun
// cevabı artık AvansKayitData'nın KENDİ (bağımsız, şaşabilen) zincirinden
// değil, doğrudan MaasKayitData'dan gelir: bir ay ancak Maaş Hesaplama
// sayfasında GEÇERLİ AYIN HESABI KAPANDI ile kapatıldığında "kapalı"
// sayılır — Avans Takibi ve Maaş Hesaplama böylece HER ZAMAN aynı ayı
// "açık dönem" kabul eder.
function avMaasKapaliMi(ay, yil){
  var kayitlar = MaasKayitData.tumKayitlar();
  for(var i=0; i<kayitlar.length; i++){
    if(kayitlar[i].ay === ay && kayitlar[i].yil === yil) return true;
  }
  return false;
}
function avOncekiAcikAy(ay, yil){
  var g = avOncekiAy(ay, yil), guvenlik = 0;
  while(avMaasKapaliMi(g.ay, g.yil) && guvenlik < 240){ g = avOncekiAy(g.ay, g.yil); guvenlik++; }
  return g;
}
function avSonrakiAcikAy(ay, yil){
  var g = avSonrakiAy(ay, yil), guvenlik = 0;
  while(avMaasKapaliMi(g.ay, g.yil) && guvenlik < 240){ g = avSonrakiAy(g.ay, g.yil); guvenlik++; }
  return g;
}

// Dönem barını çizer: ay/yıl etiketi + sağdaki "›" / "+ Yeni Ay" geçişi.
// Doğal referans noktasına (avBaslangicNoktasi — "bugün"e göre bir önceki
// ay) ULAŞMIŞ veya GEÇMİŞSEK sağda artık "+ Yeni Ay" gösterilir — ileri
// gitmek burada yeni bir dönem AÇMAK demektir; hâlâ gerisindeysek normal
// "›" ile var olan (henüz kapatılmamış) sonraki aya geçilir.
function avDonemBariCiz(){
  var etiket = document.getElementById("avDonemBtnMetin");
  if(etiket && avSeciliAy && avSeciliYil) etiket.textContent = AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil;
  var b = avBaslangicNoktasi();
  var referansaUlasildiMi = (avSeciliYil > b.yil) || (avSeciliYil === b.yil && avSeciliAy >= b.ay);
  var btnSonraki = document.getElementById("avDonemSonrakiBtn");
  var btnYeniAy = document.getElementById("avDonemYeniAyBtn");
  if(btnSonraki) btnSonraki.hidden = referansaUlasildiMi;
  if(btnYeniAy) btnYeniAy.hidden = !referansaUlasildiMi;
}

function avDonemeGec(ay, yil){
  avSeciliAy = ay; avSeciliYil = yil;
  var taslak = AvansKayitData.taslakOku(ay, yil);
  avOzelListe = taslak.ozelAvansGirisleri || [];
  avIsListe = taslak.isAvansiGirisleri || [];
  avHarcamaListe = taslak.isAvansiHarcamalar || [];
  avDonemBariCiz();
  avCiz();
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

function avGecmisSeciciDoldur(){
  var kayitlar = AvansKayitData.tumKayitlar();
  var sel = document.getElementById("avGecmisAySecici");
  document.getElementById("avGecmisBos").hidden = kayitlar.length > 0;
  sel.innerHTML = "<option value=''>Ay seç…</option>" + kayitlar.map(function(k){
    return "<option value='" + k.anahtar + "'>" + AY_ADLARI_AV[k.ay] + " " + k.yil + "</option>";
  }).join("");
}

function avGecmisDetayGoster(anahtar){
  var detay = document.getElementById("avGecmisDetay");
  if(!anahtar){ detay.innerHTML = ""; return; }
  var kayitlar = AvansKayitData.tumKayitlar();
  var k = kayitlar.filter(function(x){ return x.anahtar===anahtar; })[0];
  if(!k){ detay.innerHTML = ""; return; }
  var t = avToplamlariHesapla(k);
  detay.innerHTML = "<div class='mh-sonuc-satir'><span>Özel Avans</span><b>" + fmtTL_AV(t.ozelToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>İş Avansı Alınan</span><b>" + fmtTL_AV(t.isToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>Belgelenen</span><b>" + fmtTL_AV(t.belgelenenToplam) + "</b></div>"
    + "<div class='mh-sonuc-satir'><span>Kalan İş Avansı</span><b>" + fmtTL_AV(t.isKesilecek) + "</b></div>"
    + "<div class='mh-sonuc-satir mh-sonuc-satir--toplam'><span>TOPLAM KESİNTİ</span><b>" + fmtTL_AV(t.toplamKesinti) + "</b></div>"
    + "<button type='button' id='btnAvGecmisSil' class='mh-gecmis-sil-btn'>🗑 Bu Kaydı Sil (ayı yeniden açar)</button>";
  document.getElementById("btnAvGecmisSil").onclick = function(){
    if(!confirm(AY_ADLARI_AV[k.ay] + " " + k.yil + " avans kaydını silmek istediğine emin misin? Bu ay tekrar Dönem listesinde açık olarak görünecek.")) return;
    AvansKayitData.kaydiSil(k.anahtar, function(basarili, err){
      if(!basarili){ alert("Silinemedi: " + (err && err.message)); return; }
      detay.innerHTML = "";
      document.getElementById("avGecmisAySecici").value = "";
      avGecmisSeciciDoldur();
      avDonemBariCiz();
    });
  };
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_AV();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

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
    avGecmisSeciciDoldur();
    avYuklemeKilidiniAc();
  }
  avIlkGecisiDeneVeYap();

  // DÖNEM BARI (27.09.2026) — ‹ › okları + kaydırma (swipe). "+ Yeni Ay"
  // her zaman İLERİ gitmenin karşılığı, sadece etiketi farklı (bkz.
  // avDonemBariCiz — hangisinin görüneceğine o karar verir).
  document.getElementById("avDonemOncekiBtn").onclick = function(){
    var g = avOncekiAcikAy(avSeciliAy, avSeciliYil);
    avDonemeGec(g.ay, g.yil);
  };
  function avSonrakiAyaGec(){
    var g = avSonrakiAcikAy(avSeciliAy, avSeciliYil);
    avDonemeGec(g.ay, g.yil);
  }
  document.getElementById("avDonemSonrakiBtn").onclick = avSonrakiAyaGec;
  document.getElementById("avDonemYeniAyBtn").onclick = avSonrakiAyaGec;

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

  document.getElementById("avGecmisAySecici").onchange = function(){ avGecmisDetayGoster(this.value); };

  AvansKayitData.degistiginde(function(){
    avGecmisSeciciDoldur();
    avDonemBariCiz();
    avIlkGecisiDeneVeYap();
    // KRİTİK HATA DÜZELTMESİ (24.09.2026): Firebase'den her yeni veri
    // paketi geldiğinde (özellikle SAYFA AÇILDIKTAN SONRA gelen İLK
    // paket), seçili dönemin listelerini taze veriyle YENİDEN oku ve
    // çiz — eskiden bu satır yoktu, ekran ilk boş çizdiği haliyle
    // kalıyor, kayıtlar Firebase'de dururken sayfada "silinmiş" gibi
    // görünüyordu.
    if(avSeciliAy && avSeciliYil){
      var taze = AvansKayitData.taslakOku(avSeciliAy, avSeciliYil);
      avOzelListe = taze.ozelAvansGirisleri || [];
      avIsListe = taze.isAvansiGirisleri || [];
      avHarcamaListe = taze.isAvansiHarcamalar || [];
      avCiz();
    }
    if(AvansKayitData.taslakYuklendiMi()) avYuklemeKilidiniAc();
  });

  // MaasKayitData artık açık/kapalı dönem belirlemede TEK KAYNAK — o
  // yüklenince (veya bir dönem Maaş Hesaplama'dan kapatılınca) burada da
  // ilk geçiş denenir ve dönem barı (‹ › oklarının görünürlüğü) yeniden
  // çizilir, böylece iki sayfa hep aynı ayı "açık" görür.
  try{
    MaasKayitData.degistiginde(function(){
      avIlkGecisiDeneVeYap();
      if(avSeciliAy && avSeciliYil) avDonemBariCiz();
    });
  }catch(e){}
});
