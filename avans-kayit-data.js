/*
  avans-kayit-data.js
  =====================
  "Avans Takibi" sayfasının verisini tutar — Maaş Hesaplama sayfasından
  AYRI, kendi açık dönem/kapatma döngüsüne sahiptir.

  İKİ KATMAN:
   - TASLAK (avansTaslak/{ay}-{yil}): açık (henüz kapatılmamış) dönemin
     satırları. Her ekleme/silmede ANINDA Firebase'e yazılır — "el ile
     manuel giriş" dedikleri şey, kaydet demeden kalıcı olsun diye.
     Maaş Hesaplama sayfası, dönem henüz kapatılmamışsa bu taslağı okuyup
     "(henüz kapatılmadı)" notuyla gösterir.
   - KAPALI KAYIT (avansKayitlari/{ay}-{yil}): "Kapat ve Kayıt Et" dendiğinde
     taslak buraya resmi olarak kopyalanır, taslak silinir.

  Maaş Hesaplama'nın "Kapat ve Kayıt Et" butonu, aynı ay için Avans Takibi
  hâlâ açıksa onu da otomatik kapatır (ikisi hep senkron kalsın diye) —
  bkz. maas-hesaplama-render.js.
*/

var AvansKayitData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var kayitlar = {};   // avansKayitlari — kapalı kayıtlar
  var taslaklar = {};  // avansTaslak — açık dönem taslağı (normalde tek kayıt)
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      var db = firebase.database();
      db.ref("avansKayitlari").on("value", function(snap){
        kayitlar = snap.val() || {};
        bildir();
      }, function(err){ console.error("Avans kayıtları okunamadı:", err); });
      db.ref("avansTaslak").on("value", function(snap){
        taslaklar = snap.val() || {};
        bildir();
      }, function(err){ console.error("Avans taslağı okunamadı:", err); });
    }catch(e){ console.error("AvansKayitData başlatılamadı:", e); }
  }

  function bildir(){
    dinleyiciler.forEach(function(fn){
      try{ fn(); }catch(e){ console.error("Avans kayıt dinleyici hatası:", e); }
    });
  }

  function degistiginde(fn){
    if(typeof fn === "function" && dinleyiciler.indexOf(fn)===-1) dinleyiciler.push(fn);
  }

  function tumKayitlar(){
    return Object.keys(kayitlar)
      .sort()
      .reverse()
      .map(function(k){ return Object.assign({anahtar:k}, kayitlar[k]); });
  }

  // Maaş Hesaplama ile AYNI mantık: hiç kayıt yoksa bir önceki ay açık
  // dönem sayılır (bir ay ancak bittikten sonra kapatılır).
  function acikDonem(){
    var liste = tumKayitlar();
    var simdi = new Date();
    if(!liste.length){
      var ay = simdi.getMonth();
      var yil = simdi.getFullYear();
      if(ay < 1){ ay = 12; yil -= 1; }
      return {ay: ay, yil: yil};
    }
    var son = liste[0];
    var ay2 = (son.ay||simdi.getMonth()+1) + 1, yil2 = son.yil||simdi.getFullYear();
    if(ay2 > 12){ ay2 = 1; yil2 += 1; }
    return {ay: ay2, yil: yil2};
  }

  function anahtarOlustur(ay, yil){ return yil + "-" + ("0"+ay).slice(-2); }

  // Verilen (veya belirtilmemişse açık dönemin) taslağını okur — hiç
  // girilmemişse boş bir taslak döner.
  function taslakOku(ay, yil){
    var hedefAy = ay, hedefYil = yil;
    if(!hedefAy || !hedefYil){ var acik = acikDonem(); hedefAy = acik.ay; hedefYil = acik.yil; }
    var anahtar = anahtarOlustur(hedefAy, hedefYil);
    var t = taslaklar[anahtar];
    return t || {ay: hedefAy, yil: hedefYil, ozelAvansGirisleri: [], isAvansiGirisleri: [], isAvansiHarcamalar: []};
  }

  // Kapatılmış bir kayıt var mı diye bakar (verilen ay/yıl için).
  function kapaliKaydiBul(ay, yil){
    var anahtar = anahtarOlustur(ay, yil);
    return kayitlar[anahtar] ? Object.assign({anahtar:anahtar}, kayitlar[anahtar]) : null;
  }

  // Her ekleme/silmede çağrılır — DÜZENLENEN dönemin taslağını ANINDA
  // Firebase'e yazar (ay/yıl artık kullanıcı tarafından seçilebilir, açık
  // dönemle aynı olmak zorunda değil).
  function taslakGuncelle(ay, yil, veriObj, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      var anahtar = anahtarOlustur(ay, yil);
      var yazilacak = Object.assign({ay: ay, yil: yil}, veriObj);
      firebase.database().ref("avansTaslak/" + anahtar).set(yazilacak)
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  // Taslağı resmi kayda çevirir (kapatır) ve taslağı temizler.
  function kaydet(kayitObj, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      if(!kayitObj || !kayitObj.ay || !kayitObj.yil) throw new Error("Ay/yıl eksik.");
      var anahtar = anahtarOlustur(kayitObj.ay, kayitObj.yil);
      var db = firebase.database();
      db.ref("avansKayitlari/" + anahtar).set(kayitObj)
        .then(function(){ return db.ref("avansTaslak/" + anahtar).remove(); })
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  function kaydiSil(anahtar, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      firebase.database().ref("avansKayitlari/" + anahtar).remove()
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  baslat();

  return {
    degistiginde: degistiginde,
    tumKayitlar: tumKayitlar,
    acikDonem: acikDonem,
    taslakOku: taslakOku,
    taslakGuncelle: taslakGuncelle,
    kapaliKaydiBul: kapaliKaydiBul,
    kaydet: kaydet,
    kaydiSil: kaydiSil
  };

})();
