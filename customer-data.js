/*
  customer-data.js
  ================
  TEK görevi: müşteri listesini Firebase'in "musteriler" yolundan çekmek
  (eski uygulamayla AYNI yol) ve seçilen müşteriyi (bir sonraki sayfaya
  geçirmek üzere) localStorage'a yazmak.
*/

var CustomerData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist"
  };

  var SECILI_MUSTERI_KEY = "weicon_secili_musteri"; // eski uygulamayla PAYLAŞILAN anahtar

  var liste = [];
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("musteriler").on("value", function(snap){
        var data = snap.val();
        liste = data ? (Array.isArray(data) ? data.filter(Boolean) : Object.values(data)) : [];
        dinleyiciler.forEach(function(fn){ fn(); });
      }, function(err){
        console.error("Müşteri okuma hatası:", err);
      });
    }catch(e){
      console.error("Firebase başlatma hatası:", e);
    }
  }

  function listeDegistiginde(fn){ dinleyiciler.push(fn); }

  function ara(sorgu){
    var q = (sorgu||"").trim().toLocaleLowerCase("tr-TR");
    if(!q) return liste;
    return liste.filter(function(m){
      var ad = (m.ad||"").toLocaleLowerCase("tr-TR");
      var sehir = (m.sehir||"").toLocaleLowerCase("tr-TR");
      return ad.indexOf(q)>=0 || sehir.indexOf(q)>=0;
    });
  }

  function sec(musteri){
    try{ localStorage.setItem(SECILI_MUSTERI_KEY, JSON.stringify(musteri)); }catch(e){}
  }

  function seciliyiOku(){
    try{
      var v = localStorage.getItem(SECILI_MUSTERI_KEY);
      return v ? JSON.parse(v) : null;
    }catch(e){ return null; }
  }

  return {
    baslat: baslat,
    listeDegistiginde: listeDegistiginde,
    ara: ara,
    sec: sec,
    seciliyiOku: seciliyiOku,
    uzunluk: function(){ return liste.length; }
  };

})();

CustomerData.baslat();
