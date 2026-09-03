/*
  cihaz-data.js
  ==============
  Cihaz kimliği ve "Cihazlarım" engelleme mekanizmasının veri katmanı.
  DOM'a dokunmaz. Firebase'de "cihazlar/{cihazId}" altında saklanır:
    { ad: "iPhone 13", sonGorulme: <ms>, engelli: true/false }

  Cihaz kimliği (cihazId) cihaza ÖZGÜDÜR — tarayıcının localStorage'ında
  saklanır, cihazlar arasında senkronize OLMAZ (bilerek — her cihaz kendini
  tanımlamalı). İlk kullanımda "Adsız Cihaz" olarak kaydolur; Abdullah
  "Cihazlarım" ekranından her cihaza kendi üzerindeyken bir ad verir.

  GÜVENLİK NOTU: "Samsung S22" adını taşıyan cihaz (ana/yetkili cihaz,
  daha önce kritik bir GPU render hatası yaşamıştı) hiçbir zaman
  engellenemez — bu koruma hem burada (engelle fonksiyonu) hem de
  cihazlar-render.js'teki arayüzde (buton hiç gösterilmez) uygulanır.
*/

var CihazData = (function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  var KORUMALI_AD = "samsung s22"; // küçük harfe çevrilip karşılaştırılır

  function baslat(){
    try{ if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); } }catch(e){}
  }

  function benimIdim(){
    try{
      var id = localStorage.getItem("weicon_cihaz_id");
      if(!id){
        id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
        localStorage.setItem("weicon_cihaz_id", id);
      }
      return id;
    }catch(e){ return "bilinmeyen"; }
  }

  function benimAdim(){
    try{ return localStorage.getItem("weicon_cihaz_adi") || "Adsız Cihaz"; }catch(e){ return "Adsız Cihaz"; }
  }

  function korumaliMi(ad){
    return String(ad||"").trim().toLowerCase() === KORUMALI_AD;
  }

  // Bu cihazı Firebase'e kaydeder / "son görülme"sini tazeler. Ad alanını
  // SADECE cihazın kendi yerel adı varsa gönderir (update — üzerine
  // yazmaz), böylece başka bir cihazdan yapılan yeniden adlandırma
  // kaybolmaz.
  function kaydiGuncelle(){
    try{
      baslat();
      var id = benimIdim();
      var veri = { sonGorulme: Date.now() };
      try{
        var yerelAd = localStorage.getItem("weicon_cihaz_adi");
        if(yerelAd) veri.ad = yerelAd;
      }catch(e){}
      firebase.database().ref("cihazlar/" + id).update(veri).catch(function(){});
    }catch(e){}
  }

  // Bu cihazı bir isimle etiketler — hem yerelde hem Firebase'de.
  function adiKaydet(ad, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      ad = String(ad||"").trim();
      if(!ad){ cb(false); return; }
      localStorage.setItem("weicon_cihaz_adi", ad);
      baslat();
      firebase.database().ref("cihazlar/" + benimIdim()).update({ad: ad, sonGorulme: Date.now()})
        .then(function(){ cb(true); }).catch(function(){ cb(true); }); // yerel kayıt zaten oldu
    }catch(e){ cb(false); }
  }

  function tumCihazlariDinle(fn){
    try{
      baslat();
      firebase.database().ref("cihazlar").on("value", function(snap){
        var veri = snap.val() || {};
        var liste = Object.keys(veri).map(function(id){
          return Object.assign({id:id}, veri[id]);
        }).sort(function(a,b){ return (b.sonGorulme||0) - (a.sonGorulme||0); });
        fn(liste);
      });
    }catch(e){}
  }

  function engelle(id, ad, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    if(korumaliMi(ad)){ cb(false, "Bu cihaz korumalı, engellenemez."); return; }
    if(id === benimIdim()){ cb(false, "Şu an üzerinde olduğun cihazı engelleyemezsin."); return; }
    try{
      baslat();
      firebase.database().ref("cihazlar/" + id).update({engelli: true})
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err.message); });
    }catch(e){ cb(false, e.message); }
  }

  function engeliKaldir(id, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      baslat();
      firebase.database().ref("cihazlar/" + id).update({engelli: false})
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err.message); });
    }catch(e){ cb(false, e.message); }
  }

  // TEK SEFERLİK kontrol — auth.js her sayfa açılışında bunu çağırır.
  // Bu cihaz engellenmişse geriBildir(true) döner.
  function benEngelliMiyim(geriBildir){
    try{
      baslat();
      firebase.database().ref("cihazlar/" + benimIdim() + "/engelli").once("value")
        .then(function(snap){ geriBildir(snap.val() === true); })
        .catch(function(){ geriBildir(false); }); // okunamazsa erişimi ENGELLEME — çevrimdışı kilitlenmeyi önle
    }catch(e){ geriBildir(false); }
  }

  return {
    benimIdim: benimIdim,
    benimAdim: benimAdim,
    korumaliMi: korumaliMi,
    kaydiGuncelle: kaydiGuncelle,
    adiKaydet: adiKaydet,
    tumCihazlariDinle: tumCihazlariDinle,
    engelle: engelle,
    engeliKaldir: engeliKaldir,
    benEngelliMiyim: benEngelliMiyim
  };

})();
