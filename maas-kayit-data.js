/*
  maas-kayit-data.js
  ====================
  "Maaş + Prim Hesaplama" ekranındaki kapatılmış (kayıt edilmiş) ay
  kayıtlarını Firebase'de tutar. Her kayıt, o dönemde kullanılan
  brütPrim'i VE o an Ödenebilir Komisyon toplamının ne olduğunu
  (komisyonReferansToplam) saklar — bir SONRAKİ dönemin brüt primi,
  güncel komisyon toplamından bu referans çıkarılarak otomatik bulunur.
*/

var MaasKayitData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var kayitlar = {}; // anahtar: "YYYY-AA" -> kayıt
  var dinleyiciler = [];

  function baslat(){
    try{
      if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }
      firebase.database().ref("maasKayitlari").on("value", function(snap){
        kayitlar = snap.val() || {};
        dinleyiciler.forEach(function(fn){
          try{ fn(); }catch(e){ console.error("Maaş kayıt dinleyici hatası:", e); }
        });
      }, function(err){
        console.error("Maaş kayıtları okunamadı:", err);
      });
    }catch(e){ console.error("MaasKayitData başlatılamadı:", e); }
  }

  function degistiginde(fn){
    if(typeof fn === "function" && dinleyiciler.indexOf(fn)===-1) dinleyiciler.push(fn);
  }

  // Kayıtları YENİDEN ESKİYE sıralı döndürür (anahtar "YYYY-AA" formatında
  // olduğu için string sort = kronolojik sort).
  function tumKayitlar(){
    return Object.keys(kayitlar)
      .sort()
      .reverse()
      .map(function(k){ var o = Object.assign({anahtar:k}, kayitlar[k]); return o; });
  }

  // Henüz kayıt edilmemiş, şu an üzerinde çalışılan "açık dönem"i bulur:
  // en son kayıtlı ayın bir sonrası (hiç kayıt yoksa bugünün ayı).
  function acikDonem(){
    var liste = tumKayitlar();
    var simdi = new Date();
    if(!liste.length) return {ay: simdi.getMonth()+1, yil: simdi.getFullYear()};
    var son = liste[0];
    var ay = (son.ay||simdi.getMonth()+1) + 1, yil = son.yil||simdi.getFullYear();
    if(ay > 12){ ay = 1; yil += 1; }
    return {ay: ay, yil: yil};
  }

  // Bir sonraki dönemin brüt primini bulmak için referans noktası: en son
  // kayıtta o an geçerli olan Ödenebilir Komisyon TOPLAMI. Hiç kayıt yoksa 0
  // (yani ilk dönemde brüt prim = güncel komisyon toplamının tamamı).
  function sonReferansKomisyonToplami(){
    var liste = tumKayitlar();
    return liste.length ? (liste[0].komisyonReferansToplam || 0) : 0;
  }

  function kaydet(kayitObj, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      if(!kayitObj || !kayitObj.ay || !kayitObj.yil) throw new Error("Ay/yıl eksik.");
      var anahtar = kayitObj.yil + "-" + ("0"+kayitObj.ay).slice(-2);
      firebase.database().ref("maasKayitlari/" + anahtar).set(kayitObj)
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  function kaydiSil(anahtar, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      firebase.database().ref("maasKayitlari/" + anahtar).remove()
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err); });
    }catch(e){ cb(false, e); }
  }

  baslat();

  return {
    degistiginde: degistiginde,
    tumKayitlar: tumKayitlar,
    acikDonem: acikDonem,
    sonReferansKomisyonToplami: sonReferansKomisyonToplami,
    kaydet: kaydet,
    kaydiSil: kaydiSil
  };

})();
