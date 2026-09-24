/*
  avans-takibi-render.js
  ========================
  Özel Avans / İş Avansı / İş Avansı Harcamaları listelerini yönetir.
  Dönem artık ELLE SEÇİLEBİLİR (avDonemSecici) — otomatik hesaplanan açık
  dönem sadece başlangıç önerisi ve "kapat"tan sonraki öneridir, kapatılmamış
  herhangi bir aya geçip orada da giriş yapılabilir. Her ekleme/silme ANINDA
  AvansKayitData.taslakGuncelle() ile seçili dönemin taslağına yazılır.
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

function avDonemSeciciDoldur(){
  var sel = document.getElementById("avDonemSecici");
  var baslangic = avBaslangicNoktasi();
  var secenekler = [];
  var ay = baslangic.ay, yil = baslangic.yil;
  for(var i=0; i<18; i++){
    if(!AvansKayitData.kapaliKaydiBul(ay, yil)) secenekler.push({ay:ay, yil:yil});
    ay++; if(ay>12){ ay=1; yil++; }
  }
  // Gizli <select> hâlâ duruyor (JS içinde değer okuma alışkanlığı için),
  // ama görünen arayüz artık DÖNEM SEÇ alttan açılan liste (24.09.2026 —
  // sistemin çirkin varsayılan menüsü yerine).
  sel.innerHTML = secenekler.map(function(s){
    return "<option value='" + s.ay + "-" + s.yil + "'" + (s.ay===avSeciliAy && s.yil===avSeciliYil ? " selected" : "") + ">" + AY_ADLARI_AV[s.ay] + " " + s.yil + "</option>";
  }).join("");

  var buton = document.getElementById("avDonemBtnMetin");
  if(buton && avSeciliAy && avSeciliYil) buton.textContent = AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil;

  var liste = document.getElementById("avDonemListe");
  var soncekiYil = null;
  liste.innerHTML = secenekler.map(function(s){
    var yilBasligi = "";
    if(s.yil !== soncekiYil){ yilBasligi = "<div class='av-donem-yil-baslik'>" + s.yil + "</div>"; soncekiYil = s.yil; }
    var secili = (s.ay===avSeciliAy && s.yil===avSeciliYil);
    return yilBasligi + "<button type='button' class='av-donem-satir" + (secili ? " av-donem-satir--secili" : "") + "' data-ay='" + s.ay + "' data-yil='" + s.yil + "'>"
      + AY_ADLARI_AV[s.ay] + " " + s.yil + (secili ? " <span>✓</span>" : "") + "</button>";
  }).join("");
  liste.querySelectorAll(".av-donem-satir").forEach(function(btn){
    btn.onclick = function(){
      document.getElementById("avDonemOverlay").hidden = true;
      avDonemeGec(parseInt(this.getAttribute("data-ay"),10), parseInt(this.getAttribute("data-yil"),10));
    };
  });

  // Doğal başlangıç ayı (bugün için Ağustos) hâlâ kapalıysa, sessizce
  // atlamak yerine NEDENİNİ göster — kafa karıştırmasın. Bu uyarı artık
  // ℹ️ bilgi popup'unun içinde (24.09.2026 — sayfa yer kaplamasın diye).
  var uyari = document.getElementById("avBilgiUyariMetin");
  var kapaliKayit = AvansKayitData.kapaliKaydiBul(baslangic.ay, baslangic.yil);
  if(kapaliKayit){
    uyari.hidden = false;
    uyari.innerHTML = "⚠️ " + AY_ADLARI_AV[baslangic.ay] + " " + baslangic.yil + " zaten kapatılmış (bu yüzden listede yok). Yeniden açmak için <a href='#' id='avBaslangicKapaliGit'>aşağıdan Kayıt Geçmişi'nden sil</a>.";
    var link = document.getElementById("avBaslangicKapaliGit");
    if(link) link.onclick = function(ev){
      ev.preventDefault();
      document.getElementById("avBilgiOverlay").hidden = true;
      document.getElementById("avGecmisAySecici").value = kapaliKayit.anahtar;
      avGecmisDetayGoster(kapaliKayit.anahtar);
      document.getElementById("avGecmisAySecici").scrollIntoView({behavior:"smooth", block:"center"});
    };
  } else {
    uyari.hidden = true;
    uyari.innerHTML = "";
  }
}

function avDonemeGec(ay, yil){
  avSeciliAy = ay; avSeciliYil = yil;
  var taslak = AvansKayitData.taslakOku(ay, yil);
  avOzelListe = taslak.ozelAvansGirisleri || [];
  avIsListe = taslak.isAvansiGirisleri || [];
  avHarcamaListe = taslak.isAvansiHarcamalar || [];
  avDonemSeciciDoldur();
  avCiz();
}

function avCiz(){
  document.getElementById("btnAviKapatKayitEt").textContent = "✓ " + AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil + "'ı Kapat ve Kayıt Et";

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

  // AY ÖZETİ ROZETİ (24.09.2026) — başlığın yanında kısa özet.
  var rozet = document.getElementById("avAyOzetRozeti");
  if(rozet && avSeciliAy){
    rozet.textContent = AY_ADLARI_AV[avSeciliAy].slice(0,3).toUpperCase()
      + " · İş " + Math.round(t.isToplam).toLocaleString("tr-TR")
      + " · Özel " + Math.round(t.ozelToplam).toLocaleString("tr-TR");
  }
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
      avDonemSeciciDoldur();
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
  var avButonlar = ["btnAvEkle","btnHarcamaEkle","btnAviKapatKayitEt"];
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
    if(!AvansKayitData.kayitlarYuklendiMi() || !AvansKayitData.taslakYuklendiMi()) return;
    avIlkGecisYapildiMi = true;
    var acik = AvansKayitData.acikDonem();
    avDonemeGec(acik.ay, acik.yil);
    avGecmisSeciciDoldur();
    avYuklemeKilidiniAc();
  }
  avIlkGecisiDeneVeYap();

  document.getElementById("avDonemBtn").onclick = function(){
    document.getElementById("avDonemOverlay").hidden = false;
  };
  document.getElementById("btnAvDonemVazgec").onclick = function(){
    document.getElementById("avDonemOverlay").hidden = true;
  };

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
  document.getElementById("btnAvManuelKaydet").onclick = function(){
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
  };

  // BİLGİ POPUP (24.09.2026) — açıklama + "ay zaten kapatılmış" uyarısı
  // artık kalıcı yer kaplamıyor, ℹ️ düğmesiyle açılıp kapanıyor.
  document.getElementById("btnAvBilgi").onclick = function(){
    document.getElementById("avBilgiOverlay").hidden = false;
  };
  document.getElementById("btnAvBilgiKapat").onclick = function(){
    document.getElementById("avBilgiOverlay").hidden = true;
  };

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

  document.getElementById("btnAviKapatKayitEt").onclick = function(){
    var t = avToplamlariHesapla({ozelAvansGirisleri:avOzelListe, isAvansiGirisleri:avIsListe, isAvansiHarcamalar:avHarcamaListe});
    if(!confirm(AY_ADLARI_AV[avSeciliAy] + " " + avSeciliYil + " avans dönemini kapatıp kayıt etmek istediğine emin misin?\n\nToplam Kesinti: " + fmtTL_AV(t.toplamKesinti))) return;
    var kayitObj = {
      ay: avSeciliAy, yil: avSeciliYil,
      ozelAvansGirisleri: avOzelListe, isAvansiGirisleri: avIsListe, isAvansiHarcamalar: avHarcamaListe,
      ozelAvansToplam: t.ozelToplam, isAvansiToplam: t.isToplam, isAvansiBelgelenenToplam: t.belgelenenToplam,
      isAvansiBelgesizKalan: t.isKesilecek, toplamKesinti: t.toplamKesinti, kayitZamani: Date.now()
    };
    document.getElementById("btnAviKapatKayitEt").disabled = true;
    var kapatilanAy = avSeciliAy, kapatilanYil = avSeciliYil;
    AvansKayitData.kaydet(kayitObj, function(basarili, err){
      document.getElementById("btnAviKapatKayitEt").disabled = false;
      if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
      var sonrakiAy = kapatilanAy+1, sonrakiYil = kapatilanYil;
      if(sonrakiAy>12){ sonrakiAy=1; sonrakiYil+=1; }
      avDonemeGec(sonrakiAy, sonrakiYil);
      avGecmisSeciciDoldur();
    });
  };

  document.getElementById("avGecmisAySecici").onchange = function(){ avGecmisDetayGoster(this.value); };

  AvansKayitData.degistiginde(function(){
    avGecmisSeciciDoldur();
    avDonemSeciciDoldur();
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
});
