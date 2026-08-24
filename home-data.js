/*
  home-data.js
  ============
  Bu dosyanın TEK görevi: Firebase'e bağlanmak, arşiv verisini çekmek, ve
  "bu ay / bugün satış-prim toplamı" hesaplamalarını yapmak. DOM'a hiçbir
  şekilde dokunmaz — sadece veri üretir. Ekrana yazma işi home-render.js'te.

  Hesaplama mantığı, eski app-part4.js dosyasındaki buAyinSiparisVerisi() ve
  buGuneAitSiparisVerisi() fonksiyonlarından birebir taşındı — iş mantığı
  DEĞİŞMEDİ, sadece dosya/sorumluluk ayrımı yapıldı.
*/

var WeiconData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var AYLAR = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var arsivData = {siparis:[], proforma:[], teklif:[], numune:[]};
  var hazir = false;
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("arsiv").on("value", function(snap){
        var data = snap.val();
        if(data){
          arsivData = data;
          if(!arsivData.siparis) arsivData.siparis = [];
        }
        hazir = true;
        dinleyiciler.forEach(function(fn){ fn(); });
      }, function(err){
        console.error("Firebase okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function veriDegistiginde(fn){
    dinleyiciler.push(fn);
  }

  // "İş günü" penceresi: 09:00'da sıfırlanır, ertesi gün 06:00'a kadar aynı
  // günün verisini gösterir. 06:00-09:00 geçiş aralığında aktif gün yoktur.
  function buGununIsGunuTarihi(){
    var simdi = new Date();
    var saat = simdi.getHours();
    if(saat >= 6 && saat < 9) return null;
    var gun = new Date(simdi);
    if(saat < 6) gun.setDate(gun.getDate()-1);
    gun.setHours(0,0,0,0);
    return gun;
  }

  function buAyinVerisi(){
    var now = new Date();
    var buAyAd = AYLAR[now.getMonth()];
    var buYil = now.getFullYear().toString();
    var siparisler = arsivData.siparis || [];
    var toplamEuro = 0, toplamPrim = 0;
    for(var i=0;i<siparisler.length;i++){
      var k = siparisler[i];
      if(!k.tarih) continue;
      var parca = k.tarih.split(" ");
      var ayAd = parca[1]||"", yil = parca[2]||"";
      if(ayAd!==buAyAd || yil!==buYil) continue;
      if(k.urunler) for(var j=0;j<k.urunler.length;j++){
        var u = k.urunler[j];
        toplamEuro += u.toplamEuro||0;
        var mk = (u.iskBirim||0)-(u.dipFiyat||0);
        var satirPrimi = mk*(u.adet||1)*0.22;
        if(satirPrimi>0) toplamPrim += satirPrimi;
      }
    }
    return {ayAd:buAyAd, yil:buYil, toplamEuro:toplamEuro, toplamPrim:toplamPrim};
  }

  function bugununVerisi(){
    var isGunu = buGununIsGunuTarihi();
    if(!isGunu) return {toplamEuro:0, toplamPrim:0, aktifMi:false};
    var gunNo = isGunu.getDate().toString();
    var ayAd = AYLAR[isGunu.getMonth()];
    var yil = isGunu.getFullYear().toString();
    var siparisler = arsivData.siparis || [];
    var toplamEuro = 0, toplamPrim = 0;
    for(var i=0;i<siparisler.length;i++){
      var k = siparisler[i];
      if(!k.tarih) continue;
      var parca = k.tarih.split(" ");
      if((parca[0]||"")!==gunNo || (parca[1]||"")!==ayAd || (parca[2]||"")!==yil) continue;
      if(k.urunler) for(var j=0;j<k.urunler.length;j++){
        var u = k.urunler[j];
        toplamEuro += u.toplamEuro||0;
        var mk = (u.iskBirim||0)-(u.dipFiyat||0);
        var satirPrimi = mk*(u.adet||1)*0.22;
        if(satirPrimi>0) toplamPrim += satirPrimi;
      }
    }
    return {toplamEuro:toplamEuro, toplamPrim:toplamPrim, aktifMi:true};
  }

  function fmt(n){
    return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
  }

  // --- Bildirim Banner: 15+ gündür ilerlemeyen açık süreçler + gecikmiş görevler ---
  var arsivHamData = {numune:[], teklif:[], proforma:[], siparis:[]};
  var gorevHamData = [];
  var bildirimDinleyicileri = [];

  function bildirimVerisiDinlemeyeBasla(){
    try{
      var db = firebase.database();
      db.ref("arsiv").on("value", function(snap){
        var data = snap.val() || {};
        ["numune","teklif","proforma"].forEach(function(t){
          var liste = data[t];
          arsivHamData[t] = liste ? (Array.isArray(liste) ? liste.filter(Boolean) : Object.values(liste)) : [];
        });
        bildirimDinleyicileri.forEach(function(fn){ fn(); });
      });
      db.ref("gorevler").on("value", function(snap){
        var data = snap.val();
        gorevHamData = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        bildirimDinleyicileri.forEach(function(fn){ fn(); });
      });
    }catch(e){ console.error("Bildirim verisi dinlenemedi:", e); }
  }

  function bildirimOzetiHesapla(){
    var bugun = Date.now();
    var acikSurecSayisi = 0;
    ["numune","teklif","proforma"].forEach(function(t){
      arsivHamData[t].forEach(function(k){
        if(!k.ts) return;
        var gunFarki = Math.floor((bugun - (k.revizeZamani||k.ts)) / 86400000);
        if(gunFarki >= 15) acikSurecSayisi++;
      });
    });
    var gecikmisGorevSayisi = 0;
    var bugunTarihStr = new Date().toISOString().slice(0,10);
    gorevHamData.forEach(function(g){
      if(g.tamamlandi) return;
      if(g.tarih && g.tarih < bugunTarihStr) gecikmisGorevSayisi++;
    });
    return {acikSurecSayisi:acikSurecSayisi, gecikmisGorevSayisi:gecikmisGorevSayisi, toplam:acikSurecSayisi+gecikmisGorevSayisi};
  }

  function bildirimDegistiginde(fn){ bildirimDinleyicileri.push(fn); }

  return {
    baslat: baslat,
    veriDegistiginde: veriDegistiginde,
    buAyinVerisi: buAyinVerisi,
    bugununVerisi: bugununVerisi,
    fmt: fmt,
    hazirMi: function(){ return hazir; },
    bildirimVerisiDinlemeyeBasla: bildirimVerisiDinlemeyeBasla,
    bildirimOzetiHesapla: bildirimOzetiHesapla,
    bildirimDegistiginde: bildirimDegistiginde
  };

})();

WeiconData.baslat();
