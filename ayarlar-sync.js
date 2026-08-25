/*
  ayarlar-sync.js
  ===============
  Kur ve KDV oranı artık SADECE localStorage'da tutulmuyor — Firebase'in
  "ayarlar/" yoluna da yazılıyor ki bir cihazda (örn. Samsung S22) girilen
  kur, diğer cihazlarda (iPhone 13, iPad) de otomatik görünsün. Diğer tüm
  dosyalar (cart-data.js, reports-data.js, calc-render.js, veri-render.js)
  hâlâ aynı localStorage anahtarlarını ("weicon_kur", "weicon_kdv_orani")
  okuyor — bu dosya sadece o anahtarları Firebase ile canlı senkron tutar.
  Firebase'e önce yazan cihaz kazanır kuralı yok; en son yazan değer geçerli
  olur (basit "son yazan kazanır" senkronizasyonu, kur/kdv gibi tek kişinin
  girdiği ayarlar için yeterli).
*/

var AyarlarSync = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      firebase.database().ref("ayarlar").on("value", function(snap){
        var v = snap.val() || {};
        if(v.kur!=null) localStorage.setItem("weicon_kur", v.kur);
        if(v.kdv!=null) localStorage.setItem("weicon_kdv_orani", v.kdv);
        dinleyiciler.forEach(function(fn){ fn(); });
      });
    }catch(e){ console.error("Ayarlar senkronu başlatılamadı:", e); }
  }

  function degistiginde(fn){ dinleyiciler.push(fn); }

  function kurKaydet(v){
    localStorage.setItem("weicon_kur", v);
    localStorage.setItem("weicon_kur_zaman", Date.now());
    try{ firebase.database().ref("ayarlar/kur").set(v); }catch(e){}
  }

  function kdvKaydet(v){
    localStorage.setItem("weicon_kdv_orani", v);
    try{ firebase.database().ref("ayarlar/kdv").set(v); }catch(e){}
  }

  return {
    baslat: baslat,
    degistiginde: degistiginde,
    kurKaydet: kurKaydet,
    kdvKaydet: kdvKaydet
  };

})();

AyarlarSync.baslat();
