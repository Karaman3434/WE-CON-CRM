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
  document.getElementById("mhDonemSerit").textContent = "Açık Dönem: " + AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("mhKartBaslikAy").textContent = AY_ADLARI_MH[acik.ay] + " " + acik.yil;
  document.getElementById("btnAyiKayitEt").textContent = "✓ " + AY_ADLARI_MH[acik.ay] + "'ı Kapat ve Kayıt Et";
  return acik;
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

function mhGecmisiCiz(){
  var kayitlar = MaasKayitData.tumKayitlar();
  var kutu = document.getElementById("mhGecmisListesi");
  document.getElementById("mhGecmisBos").hidden = kayitlar.length > 0;
  kutu.innerHTML = kayitlar.map(function(k){
    return "<div class='mh-gecmis-karti'>"
      + "<div class='mh-gecmis-ust'>"
      + "<span class='mh-gecmis-ay'>" + AY_ADLARI_MH[k.ay] + " " + k.yil + "</span>"
      + "<span class='mh-gecmis-tutar'>" + fmtTL_MH(k.hesabaYatacak) + "</span>"
      + "</div>"
      + "<div class='mh-gecmis-detay' hidden>"
      + "<div class='mh-sonuc-satir'><span>Net Maaş (Brüt: " + fmtTL_MH(k.brutSabitAylik) + ")</span><b>" + fmtTL_MH(k.netSabitMaas) + fmtOran_MH(k.brutSabitAylik, k.netSabitMaas) + "</b></div>"
      + "<div class='mh-sonuc-satir'><span>Net Prim (Brüt: " + fmtTL_MH(k.brutPrim) + ")</span><b>" + fmtTL_MH(k.netPrim) + fmtOran_MH(k.brutPrim, k.netPrim) + "</b></div>"
      + "<div class='mh-sonuc-satir'><span>Toplam Kesinti</span><b>" + fmtTL_MH(k.toplamKesinti) + "</b></div>"
      + "<div class='mh-sonuc-satir mh-sonuc-satir--toplam'><span>Hesaba Yatan</span><b>" + fmtTL_MH(k.hesabaYatacak) + "</b></div>"
      + "<button type='button' class='mh-gecmis-sil-btn' data-anahtar='" + k.anahtar + "'>🗑 Bu Kaydı Sil</button>"
      + "</div></div>";
  }).join("");
  kutu.querySelectorAll(".mh-gecmis-ust").forEach(function(el){
    el.onclick = function(){
      var detay = this.parentElement.querySelector(".mh-gecmis-detay");
      detay.hidden = !detay.hidden;
    };
  });
  kutu.querySelectorAll(".mh-gecmis-sil-btn").forEach(function(btn){
    btn.onclick = function(ev){
      ev.stopPropagation();
      if(!confirm("Bu kaydı silmek istediğine emin misin? Bu, sonraki dönemin referans noktasını da etkileyebilir.")) return;
      MaasKayitData.kaydiSil(this.getAttribute("data-anahtar"), function(basarili, err){
        if(!basarili) alert("Silinemedi: " + (err && err.message));
      });
    };
  });
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle_MH();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  mhHesaplaVeCiz();
  mhGecmisiCiz();

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
    if(!mhGuncelHesap) return;
    var h = mhGuncelHesap;
    var avansUyari = h.avans.kapaliVarMi ? "" : "\n\nNot: Avans Takibi bu dönem için henüz kapatılmadı — onu da otomatik kapatacağım.";
    if(!confirm(AY_ADLARI_MH[h.acik.ay] + " " + h.acik.yil + " dönemini kapatıp kayıt etmek istediğine emin misin?\n\nHesaba Yatacak: " + fmtTL_MH(h.hesabaYatacak) + avansUyari + "\n\nKayıt edildikten sonra sistem otomatik bir sonraki aya geçer.")) return;

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
        // MaasKayitData.degistiginde dinleyicisi mhHesaplaVeCiz + mhGecmisiCiz'i tetikleyecek.
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

  try{ KomisyonData.degistiginde(function(){ mhHesaplaVeCiz(); }); }catch(e){}
  try{ MaasKayitData.degistiginde(function(){ mhHesaplaVeCiz(); mhGecmisiCiz(); }); }catch(e){}
  try{ AvansKayitData.degistiginde(function(){ mhHesaplaVeCiz(); }); }catch(e){}
});
