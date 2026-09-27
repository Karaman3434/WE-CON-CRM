/*
  maas-hesaplama-render.js — VERSİYON: WG.020926.2330.95
  ==========================
  Açık dönemi (MaasKayitData.acikDonem) gösterir, Brüt Prim'i Ödenebilir
  Komisyon'un güncel toplamı ile referans nokta arasındaki farktan otomatik
  hesaplar. Avans/Kesinti artık BU sayfada girilmiyor — Avans Takibi
  sayfasından (kapalı kayıt varsa onu, yoksa açık taslağı) otomatik okunur.
  "Kapat ve Kayıt Et" hem Maaş kaydını hem — hâlâ açıksa — aynı ayın Avans
  Takibi'ni senkron kapatır.
*/

var AY_ADLARI_MH = ["","Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var mhGuncelHesap = null; // en son mhHesaplaVeCiz() çıktısı — Kayıt Et bunu kullanır

function fmtTL_MH(n){
  return (n||0).toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
}
// Türkçe tutar biçimi: binlik ayraç "." , ondalık ayraç ",". "35.560" -> 35560.
function tutarParse_MH(s){
  s = (s||"").toString().trim();
  if(!s) return 0;
  s = s.replace(/\./g, "").replace(",", ".");
  var v = parseFloat(s);
  return isNaN(v) ? 0 : v;
}

// Kalibrasyon: gerçek bordrodan alınan "Önceki Ay Matrah" rakamı, hangi
// ayın SONU itibariyle geçerli olduğuyla birlikte saklanır. Sadece açık
// dönemin TAM BİR ÖNCESİ ayla eşleştiğinde kullanılır — eşleşmezse (örn.
// kapatılmadan araya ay girdiyse) eski tahmini yönteme dönülür.
function mhMatrahBazOku(){
  try{ return JSON.parse(localStorage.getItem("weicon_matrah_baz")||"null"); }catch(e){ return null; }
}
function mhOncekiAyHesapla(ay, yil){
  var oncekiAy = ay - 1, oncekiYil = yil;
  if(oncekiAy < 1){ oncekiAy = 12; oncekiYil -= 1; }
  return {ay:oncekiAy, yil:oncekiYil};
}
function mhMatrahOnceOverride(acikAy, acikYil){
  var baz = mhMatrahBazOku();
  if(!baz) return null;
  var onceki = mhOncekiAyHesapla(acikAy, acikYil);
  if(baz.ay === onceki.ay && baz.yil === onceki.yil) return baz.matrah;
  return null;
}

function fmtOran_MH(brut, net){
  if(!brut) return "";
  var oran = (brut-net)/brut*100;
  return " (%" + oran.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " kesinti)";
}
// Kesinti yüzdesini TEK BAŞINA (parantezsiz) döndürür — brüt/net kartlarındaki
// ayrı "kesinti oranı" satırı için.
function fmtOranSadece_MH(brut, net){
  if(!brut) return "%0,00 kesinti";
  var oran = (brut-net)/brut*100;
  return "%" + oran.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " kesinti";
}
function tarihiGuncelle_MH(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + AY_ADLARI_MH[d.getMonth()+1] + " " + d.getFullYear();
  }catch(e){}
}

function mhAylarToplamiHesapla(aylar){
  var toplam = 0;
  for(var ay=1; ay<=12; ay++) toplam += parseFloat(aylar && aylar[ay]) || 0;
  return toplam;
}

// Ödenebilir Komisyon'un EN GÜNCEL kaydındaki 12 ayın toplamı.
function mhGuncelKomisyonToplami(){
  try{
    var kayitlar = KomisyonData.tumKayitlar();
    if(!kayitlar || !kayitlar.length) return 0;
    return mhAylarToplamiHesapla(kayitlar[0].aylar);
  }catch(e){ return 0; }
}

// Brüt Prim'in referans noktası: son kapatılan maaş döneminde geçerli olan
// komisyon toplamı. Hiç maaş kaydı yoksa (ilk kullanım), en güncel Ödenebilir
// Komisyon kaydından BİR ÖNCEKİ kaydın toplamı referans alınır.
function mhReferansKomisyonToplamiHesapla(){
  try{
    var maasKayitlari = MaasKayitData.tumKayitlar();
    if(maasKayitlari.length) return maasKayitlari[0].komisyonReferansToplam || 0;
    var komisyonKayitlari = KomisyonData.tumKayitlar();
    if(komisyonKayitlari.length > 1) return mhAylarToplamiHesapla(komisyonKayitlari[1].aylar);
    return 0;
  }catch(e){ return 0; }
}

function mhBrutPrimDizisiOlustur(acikAy, acikYil, acikBrutPrim){
  var dizi = {};
  try{
    MaasKayitData.tumKayitlar().forEach(function(k){
      if(k.yil === acikYil) dizi[k.ay] = k.brutPrim || 0;
    });
  }catch(e){}
  dizi[acikAy] = acikBrutPrim;
  return dizi;
}

function mhAcikDonemEtiketiGuncelle(){
  var acik = MaasKayitData.acikDonem();
  var etiket = document.getElementById("mhDonemBtnMetin");
  if(etiket) etiket.textContent = AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("mhKartBaslikAy").textContent = AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("btnAyiKayitEt").textContent = "✓ GEÇERLİ AYIN HESABI KAPANDI";
  return acik;
}

// DÖNEM BARI (27.09.2026) — 0 = açık/canlı dönem (mhHesaplaVeCiz ile canlı
// hesaplanır, düzenlenebilir), 1+ = MaasKayitData.tumKayitlar()[ofset-1]
// (kapanmış kayıt, salt okunur). Alttaki "Kayıt Geçmişi" listesi bu barla
// değiştirildi.
var mhGezinmeOfset = 0;

function mhDuzenlemeGorunurlugunuAyarla(gorunurMu){
  document.getElementById("btnBrutSabitGuncelle").hidden = !gorunurMu;
  document.getElementById("btnMatrahKalibreEt").hidden = !gorunurMu;
  document.getElementById("btnAyiKayitEt").hidden = !gorunurMu;
  document.getElementById("btnMhKapaliKaydiSil").hidden = gorunurMu;
  document.getElementById("mhKapaliSerit").hidden = gorunurMu;
}

function mhKapaliKaydiGoster(k){
  mhDuzenlemeGorunurlugunuAyarla(false);
  var etiket = document.getElementById("mhDonemBtnMetin");
  if(etiket) etiket.textContent = AY_ADLARI_MH[k.ay] + " " + k.yil;
  document.getElementById("mhKartBaslikAy").textContent = AY_ADLARI_MH[k.ay] + " " + k.yil;
  document.getElementById("mhBrutSabitDeger").textContent = fmtTL_MH(k.brutSabitAylik);
  document.getElementById("mhPrimDeger").textContent = fmtTL_MH(k.brutPrim);
  document.getElementById("mhPrimKaynak").textContent = "Kapanmış kayıt — o dönemde geçerli olan rakam.";
  document.getElementById("mhMatrahDurum").textContent = "Kapanmış kayıt — kalibrasyon bu görünümde değiştirilemez.";
  document.getElementById("mhMaasKesintiOran").textContent = fmtOranSadece_MH(k.brutSabitAylik, k.netSabitMaas);
  document.getElementById("mhKartNetMaas").textContent = fmtTL_MH(k.netSabitMaas);
  document.getElementById("mhPrimKesintiOran").textContent = fmtOranSadece_MH(k.brutPrim, k.netPrim);
  document.getElementById("mhKartNetPrim").textContent = fmtTL_MH(k.netPrim);
  document.getElementById("mhKartNetToplam").textContent = fmtTL_MH(k.netToplam);
  document.getElementById("mhKartHesabaYatacak").textContent = fmtTL_MH(k.hesabaYatacak);
  var av = mhAvansToplamlariniOku(k.ay, k.yil);
  document.getElementById("mhAvansToplamOzel").textContent = fmtTL_MH(av.ozelToplam);
  document.getElementById("mhAvansToplamIs").textContent = fmtTL_MH(av.isKesilecek);
  document.getElementById("mhAvansToplamGenel").textContent = fmtTL_MH(av.toplamKesinti);
  document.getElementById("mhAvansDurum").textContent = av.kapaliVarMi
    ? "✓ Avans Takibi bu dönem için kapatıldı."
    : "Avans Takibi'nde bu dönem için kayıt yok.";
  document.getElementById("btnMhKapaliKaydiSil").setAttribute("data-anahtar", k.anahtar);
}

function mhGorunumCiz(){
  var kayitlar = MaasKayitData.tumKayitlar();
  if(mhGezinmeOfset > kayitlar.length) mhGezinmeOfset = kayitlar.length;
  if(mhGezinmeOfset < 0) mhGezinmeOfset = 0;

  var btnOnceki = document.getElementById("mhDonemOncekiBtn");
  var btnSonraki = document.getElementById("mhDonemSonrakiBtn");
  if(btnOnceki) btnOnceki.hidden = (mhGezinmeOfset >= kayitlar.length);
  if(btnSonraki) btnSonraki.hidden = (mhGezinmeOfset === 0);

  if(mhGezinmeOfset === 0){
    mhDuzenlemeGorunurlugunuAyarla(true);
    mhHesaplaVeCiz();
  } else {
    mhKapaliKaydiGoster(kayitlar[mhGezinmeOfset - 1]);
  }
}

function mhBrutSabitGoster(){
  var v = parseFloat(localStorage.getItem("weicon_brut_sabit_maas")) || 0;
  document.getElementById("mhBrutSabitDeger").textContent = fmtTL_MH(v);
  return v;
}

// Avans Takibi'nden bu ay/yıl için toplamları okur: önce KAPALI kayda bakar
// (kesin), yoksa AÇIK TASLAĞA (henüz kapatılmadı notuyla).
function mhAvansToplamlariniOku(ay, yil){
  var kapali = null, taslakMi = false;
  try{ kapali = AvansKayitData.kapaliKaydiBul(ay, yil); }catch(e){}
  var veri;
  if(kapali){
    veri = kapali;
  } else {
    taslakMi = true;
    try{ veri = AvansKayitData.taslakOku(ay, yil); }catch(e){ veri = {ozelAvansGirisleri:[], isAvansiGirisleri:[], isAvansiHarcamalar:[]}; }
  }
  var ozelToplam = (veri.ozelAvansGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isToplam = (veri.isAvansiGirisleri||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var belgelenenToplam = (veri.isAvansiHarcamalar||[]).reduce(function(s,x){ return s+(x.tutar||0); }, 0);
  var isKesilecek = Math.max(0, isToplam - belgelenenToplam);
  var toplamKesinti = ozelToplam + isKesilecek;
  return {ozelToplam:ozelToplam, isKesilecek:isKesilecek, toplamKesinti:toplamKesinti, taslakMi:taslakMi, kapaliVarMi: !!kapali};
}

function mhHesaplaVeCiz(){
  var acik = mhAcikDonemEtiketiGuncelle();
  var brutSabit = mhBrutSabitGoster();

  var komisyonToplam = mhGuncelKomisyonToplami();
  var referans = mhReferansKomisyonToplamiHesapla();
  var brutPrim = Math.max(0, komisyonToplam - referans);

  document.getElementById("mhPrimDeger").textContent = fmtTL_MH(brutPrim);
  document.getElementById("mhPrimKaynak").textContent =
    "Komisyon toplamı " + fmtTL_MH(komisyonToplam) + " − referans " + fmtTL_MH(referans);

  var primDizisi = mhBrutPrimDizisiOlustur(acik.ay, acik.yil, brutPrim);
  var matrahOverride = mhMatrahOnceOverride(acik.ay, acik.yil);
  var sonuc = MaasHesaplamaData.ayHesapla(acik.ay, brutSabit, primDizisi, matrahOverride);

  var oncekiAy = mhOncekiAyHesapla(acik.ay, acik.yil);
  document.getElementById("mhMatrahDurum").textContent = matrahOverride!=null
    ? "✓ Kalibre edildi (" + AY_ADLARI_MH[oncekiAy.ay] + " " + oncekiAy.yil + " sonu itibariyle: " + fmtTL_MH(matrahOverride) + ")"
    : "Kalibrasyon yok — Ocak'tan tahmini hesaplanıyor. Bordrondaki \"Önceki Ay Matrah\" rakamını girerek doğruluğu artırabilirsin.";

  var av = mhAvansToplamlariniOku(acik.ay, acik.yil);
  document.getElementById("mhAvansToplamOzel").textContent = fmtTL_MH(av.ozelToplam);
  document.getElementById("mhAvansToplamIs").textContent = fmtTL_MH(av.isKesilecek);
  document.getElementById("mhAvansToplamGenel").textContent = fmtTL_MH(av.toplamKesinti);
  document.getElementById("mhAvansDurum").textContent = av.kapaliVarMi
    ? "✓ Avans Takibi bu dönem için kapatıldı."
    : (av.taslakMi && (av.ozelToplam||av.isKesilecek) ? "⏳ Avans Takibi'nde taslak var, henüz kapatılmadı." : "Avans Takibi'nde bu dönem için henüz kayıt yok.");

  var hesabaYatacak = sonuc.netToplam - av.toplamKesinti;

  document.getElementById("mhMaasKesintiOran").textContent = fmtOranSadece_MH(sonuc.brutSabitAylik, sonuc.netSabitMaas);
  document.getElementById("mhKartNetMaas").textContent = fmtTL_MH(sonuc.netSabitMaas);
  document.getElementById("mhPrimKesintiOran").textContent = fmtOranSadece_MH(sonuc.brutPrim, sonuc.netPrim);
  document.getElementById("mhKartNetPrim").textContent = fmtTL_MH(sonuc.netPrim);
  document.getElementById("mhKartNetToplam").textContent = fmtTL_MH(sonuc.netToplam);
  document.getElementById("mhKartHesabaYatacak").textContent = fmtTL_MH(hesabaYatacak);

  mhGuncelHesap = {
    acik: acik, brutSabit: brutSabit, komisyonToplam: komisyonToplam, brutPrim: brutPrim,
    sonuc: sonuc, avans: av, hesabaYatacak: hesabaYatacak
  };
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  mhGorunumCiz();

  document.getElementById("mhDonemOncekiBtn").onclick = function(){ mhGezinmeOfset++; mhGorunumCiz(); };
  document.getElementById("mhDonemSonrakiBtn").onclick = function(){ mhGezinmeOfset--; mhGorunumCiz(); };
  (function(){
    var bar = document.getElementById("mhDonemBar");
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
      if(Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy)*1.5) return;
      if(dx > 0){ mhGezinmeOfset++; } else { mhGezinmeOfset--; }
      mhGorunumCiz();
    }, {passive:true});
  })();

  document.getElementById("btnMhKapaliKaydiSil").onclick = function(){
    var anahtar = this.getAttribute("data-anahtar");
    if(!anahtar) return;
    if(!confirm("Bu kaydı silmek istediğine emin misin? Bu, sonraki dönemin referans noktasını da etkileyebilir.")) return;
    MaasKayitData.kaydiSil(anahtar, function(basarili, err){
      if(!basarili){ alert("Silinemedi: " + (err && err.message)); return; }
      mhGezinmeOfset = 0;
      mhGorunumCiz();
    });
  };

  document.getElementById("btnBrutSabitGuncelle").onclick = function(){
    var mevcut = parseFloat(localStorage.getItem("weicon_brut_sabit_maas")) || 0;
    var girilen = prompt("Yeni brüt sabit maaşı gir:", mevcut ? mevcut.toString().replace(".", ",") : "");
    if(girilen == null) return;
    var v = tutarParse_MH(girilen);
    if(v <= 0){ alert("Geçerli bir tutar gir."); return; }
    try{ AyarlarSync.brutSabitMaasKaydet(v); }catch(e){}
    localStorage.setItem("weicon_brut_sabit_maas", v);
    mhHesaplaVeCiz();
  };

  document.getElementById("btnMatrahKalibreEt").onclick = function(){
    if(!mhGuncelHesap) return;
    var onceki = mhOncekiAyHesapla(mhGuncelHesap.acik.ay, mhGuncelHesap.acik.yil);
    var mevcut = mhMatrahBazOku();
    var girilen = prompt(
      "Gerçek bordrondaki \"" + AY_ADLARI_MH[onceki.ay] + " " + onceki.yil + "\" dönemine ait \"Önceki Ay Matrah\" + o ayın kendi vergi matrahı toplamını (bordroda \"Yıl İçi Toplam\" olarak da geçebilir) gir — yani " + AY_ADLARI_MH[onceki.ay] + " " + onceki.yil + " SONU itibariyle kümülatif vergi matrahı:",
      mevcut && mevcut.matrah ? mevcut.matrah.toString().replace(".", ",") : ""
    );
    if(girilen == null) return;
    var v = tutarParse_MH(girilen);
    if(v <= 0){ alert("Geçerli bir tutar gir."); return; }
    var baz = {matrah: v, ay: onceki.ay, yil: onceki.yil};
    try{ AyarlarSync.matrahBazKaydet(baz); }catch(e){}
    localStorage.setItem("weicon_matrah_baz", JSON.stringify(baz));
    mhHesaplaVeCiz();
  };

  document.getElementById("btnAyiKayitEt").onclick = function(){
    if(mhGezinmeOfset !== 0) return; // sadece açık/canlı dönem kapatılabilir
    if(!mhGuncelHesap) return;
    var h = mhGuncelHesap;
    var avansUyari = h.avans.kapaliVarMi ? "" : "\n\nNot: Avans Takibi bu dönem için henüz kapatılmadı — onu da otomatik kapatacağım.";
    if(!confirm(AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kapatmak istediğine emin misin?\n\nHesaba Yatacak: " + fmtTL_MH(h.hesabaYatacak) + avansUyari)) return;
    if(!confirm("Kesin olarak kapatılsın mı? Bu işlem geri alınamaz.\n\nKayıt edildikten sonra sistem otomatik bir sonraki aya geçer.")) return;

    document.getElementById("btnAyiKayitEt").disabled = true;

    function maasiKaydet(){
      var kayitObj = {
        ay: h.acik.ay, yil: h.acik.yil,
        brutSabitAylik: h.brutSabit,
        brutPrim: h.brutPrim,
        komisyonReferansToplam: h.komisyonToplam,
        toplamKesinti: h.avans.toplamKesinti,
        netSabitMaas: h.sonuc.netSabitMaas,
        netPrim: h.sonuc.netPrim,
        netToplam: h.sonuc.netToplam,
        hesabaYatacak: h.hesabaYatacak,
        kayitZamani: Date.now()
      };
      MaasKayitData.kaydet(kayitObj, function(basarili, err){
        document.getElementById("btnAyiKayitEt").disabled = false;
        if(!basarili){ alert("Kaydedilemedi: " + (err && err.message)); return; }
        // Kalibrasyonu otomatik ilerlet: artık bu ayın sonu itibariyle
        // kümülatif matrah biliniyor — bir dahaki sefere elle girmesin.
        var yeniBaz = {matrah: h.sonuc.kumulatifMatrahSimdi, ay: h.acik.ay, yil: h.acik.yil};
        try{ AyarlarSync.matrahBazKaydet(yeniBaz); }catch(e){}
        localStorage.setItem("weicon_matrah_baz", JSON.stringify(yeniBaz));
        mhGezinmeOfset = 0;
        // MaasKayitData.degistiginde dinleyicisi mhGorunumCiz'i tetikleyecek.
      });
    }

    // Avans Takibi aynı ay için hâlâ açıksa (kapalı kaydı yoksa), önce onu
    // senkron kapatıp SONRA Maaş kaydını yazıyoruz.
    if(!h.avans.kapaliVarMi){
      var taslak = AvansKayitData.taslakOku(h.acik.ay, h.acik.yil);
      var avansKayitObj = {
        ay: h.acik.ay, yil: h.acik.yil,
        ozelAvansGirisleri: taslak.ozelAvansGirisleri||[],
        isAvansiGirisleri: taslak.isAvansiGirisleri||[],
        isAvansiHarcamalar: taslak.isAvansiHarcamalar||[],
        ozelAvansToplam: h.avans.ozelToplam,
        isAvansiBelgesizKalan: h.avans.isKesilecek,
        toplamKesinti: h.avans.toplamKesinti,
        kayitZamani: Date.now()
      };
      AvansKayitData.kaydet(avansKayitObj, function(basariliAv, errAv){
        if(!basariliAv){ document.getElementById("btnAyiKayitEt").disabled=false; alert("Avans Takibi kapatılamadı: " + (errAv && errAv.message)); return; }
        maasiKaydet();
      });
    } else {
      maasiKaydet();
    }
  };

  try{ KomisyonData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ MaasKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
  try{ AvansKayitData.degistiginde(function(){ mhGorunumCiz(); }); }catch(e){}
});
