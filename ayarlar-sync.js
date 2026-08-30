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
  var KUR_TAZELIK_MS = 24 * 60 * 60 * 1000;

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      firebase.database().ref("ayarlar").on("value", function(snap){
        var v = snap.val() || {};
        if(v.kur!=null){
          localStorage.setItem("weicon_kur", v.kur);
          // Yeni sürümde merkezi kur zamanı da tutuluyor. Eski kayıtlarda
          // zaman yoksa mevcut yerel zaman damgasını ezmeyiz.
          if(v.kurZaman!=null) localStorage.setItem("weicon_kur_zaman", v.kurZaman);
        }
        if(v.kdv!=null) localStorage.setItem("weicon_kdv_orani", v.kdv);
        dinleyiciler.forEach(function(fn){
          try{ fn(); }catch(e){ console.error("Ayar senkron dinleyicisi hatası:", e); }
        });
      }, function(err){
        console.error("Ayarlar Firebase okuma hatası:", err);
      });
    }catch(e){ console.error("Ayarlar senkronu başlatılamadı:", e); }
  }

  function degistiginde(fn){
    if(typeof fn === "function" && dinleyiciler.indexOf(fn)===-1) dinleyiciler.push(fn);
  }

  function kurBayatMi(){
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    if(!isFinite(kur) || kur <= 0) return true;
    var zaman = parseInt(localStorage.getItem("weicon_kur_zaman")||"0", 10);
    // Eski sürümlerde zaman damgası yoksa mevcut kuru kullanmaya devam et.
    // Böylece geçerli kur yüzünden kayıt akışı gereksiz yere kilitlenmez.
    if(!zaman || !isFinite(zaman)) return false;
    return (Date.now() - zaman) > KUR_TAZELIK_MS;
  }

  // "Otomatik kur" burada internetten rastgele bir kur servisi çekmez.
  // CRM'nin merkez kurunu Firebase'den tazeler. Böylece tüm cihazlar aynı
  // ticari kuru kullanır ve CORS/harici API kaynaklı kayıt kesintisi olmaz.
  function otomatikKurGetir(force, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      if(typeof firebase === "undefined" || !firebase.database){ cb(false); return; }
      var ref = firebase.database().ref("ayarlar");
      ref.once("value").then(function(snap){
        var v = snap.val() || {};
        var kur = parseFloat(v.kur);
        if(!isFinite(kur) || kur <= 0){ cb(false); return; }
        // Merkezi kur başarıyla okunduğu anda bu cihazdaki kur taze kabul edilir.
        // Firebase'deki kurZaman eski bir sürümden kalmış olsa bile yerel kayıt
        // akışını gereksiz yere tekrar tekrar kilitlemez.
        localStorage.setItem("weicon_kur", kur);
        localStorage.setItem("weicon_kur_zaman", Date.now());
        if(v.kdv!=null) localStorage.setItem("weicon_kdv_orani", v.kdv);
        cb(true, kur);
      }).catch(function(err){
        console.error("Merkezi kur alınamadı:", err);
        cb(false, err);
      });
    }catch(e){
      console.error("Otomatik kur hatası:", e);
      cb(false, e);
    }
  }

  function kurKaydet(v){
    var kur = parseFloat(v);
    if(!isFinite(kur) || kur <= 0) throw new Error("Geçerli bir EUR/TL kuru girin.");
    var zaman = Date.now();
    localStorage.setItem("weicon_kur", kur);
    localStorage.setItem("weicon_kur_zaman", zaman);
    try{
      var db = firebase.database();
      db.ref("ayarlar/kur").set(kur);
      db.ref("ayarlar/kurZaman").set(zaman);
    }catch(e){ console.error("Kur Firebase'e yazılamadı:", e); }
  }

  function kdvKaydet(v){
    var kdv = parseFloat(v);
    if(!isFinite(kdv) || kdv < 0) throw new Error("Geçerli bir KDV oranı girin.");
    localStorage.setItem("weicon_kdv_orani", kdv);
    try{ firebase.database().ref("ayarlar/kdv").set(kdv); }catch(e){ console.error("KDV Firebase'e yazılamadı:", e); }
  }

  return {
    baslat: baslat,
    degistiginde: degistiginde,
    kurBayatMi: kurBayatMi,
    otomatikKurGetir: otomatikKurGetir,
    kurKaydet: kurKaydet,
    kdvKaydet: kdvKaydet
  };

})();

AyarlarSync.baslat();
