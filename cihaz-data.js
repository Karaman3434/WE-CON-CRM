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

  GÜVENLİK NOTU: "Samsung S22" adı (KORUMALI_AD), Cihazlar ve Kullanıcılar
  yönetim panelinin SADECE o adı taşıyan cihazdan açılabilmesi için hâlâ
  kullanılıyor (bkz. cihaz-kullanici-render.js → ckErisimKontrolEt). AMA
  06.10.2026'dan itibaren (Abdullah'ın isteğiyle) bu ad artık "engellenemez"
  anlamına GELMİYOR — istisnasız her cihaz (bu ad dahil, başka bir cihazdan)
  engellenebilir; tek istisna, üzerinde bulunduğun cihazı kendi kendine
  engelleyememen (aşağıdaki id === benimIdim() kontrolü).
*/

var CihazData = (function(){

  var KORUMALI_AD = "samsung s22"; // küçük harfe çevrilip karşılaştırılır

  function baslat(){
    try{ if(!firebase.apps.length){ firebase.initializeApp(WEICON_FIREBASE_CONFIG); } }catch(e){}
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

  /* ---------- KULLANICI ADI (03.10.2026, Abdullah'ın isteğiyle) ----------
     Cihazın kendi adından (ad — Abdullah'ın S22'den verdiği "iPhone 13" gibi
     bir etiket) AYRI bir alan: bu cihazı o an KULLANAN kişinin kendi
     tanımladığı isim (örn. "ANKARA BOLGE 19"). İlk kullanımda zorunlu
     girilir (bkz. home.html/home-render.js), sonradan drawer'daki "Hesabım"
     kartından istenildiği zaman değiştirilebilir. Hiçbir şifre/giriş
     hesabıyla İLGİSİ YOKTUR — sadece kendini tanıtan bir etikettir.
     Her değişiklik "cihazlar/{id}/kullaniciAdiGecmisi" altına da (silinmeden,
     tarih damgasıyla) eklenir — Abdullah S22'den "Cihazlar ve Kullanıcılar"
     sayfasında hangi cihazın/kişinin adını ne zaman değiştirdiğini görebilsin
     diye. */
  function benimKullaniciAdim(){
    try{ return localStorage.getItem("weicon_kullanici_adi") || ""; }catch(e){ return ""; }
  }

  function kullaniciAdiKaydet(adi, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      adi = String(adi||"").trim();
      if(!adi){ cb(false); return; }
      localStorage.setItem("weicon_kullanici_adi", adi);
      // Yerel kayıt bu satırda tamamlandı — ekranı Firebase'in sunucudan
      // onay dönmesini bekleterek kilitleme (zayıf/kesik mobil bağlantıda
      // bu onay uzun süre gelmeyebilir, hatta hiç gelmeyebilir). Kullanıcıyı
      // hemen serbest bırak, Firebase senkronunu arka planda sürdür.
      cb(true);
      try{
        baslat();
        var id = benimIdim();
        var db = firebase.database();
        db.ref("cihazlar/" + id).update({ kullaniciAdi: adi, sonGorulme: Date.now() })
          .then(function(){ return db.ref("cihazlar/" + id + "/kullaniciAdiGecmisi").push({adi: adi, zaman: Date.now()}); })
          .catch(function(){});
      }catch(e){}
    }catch(e){ cb(false); }
  }

  /* ---------- ADMİN DÜZENLEMESİ (06.10.2026, Abdullah'ın isteğiyle) ----------
     kullaniciAdiKaydet() SADECE cihazın kendisi (benimIdim()) için çalışır.
     Aşağıdaki ikisi ise "Cihazlar ve Kullanıcılar" panelinden, Abdullah'ın
     BAŞKA bir cihazın adını/PIN'ini kendi S22'sinden değiştirebilmesi için —
     id parametresiyle, cihazın üzerinde olmaya gerek kalmadan çalışır. */
  function adiniDegistir(id, yeniAd, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      yeniAd = String(yeniAd||"").trim();
      if(!id || !yeniAd){ cb(false, "İsim boş olamaz."); return; }
      baslat();
      var db = firebase.database();
      db.ref("cihazlar/" + id).update({ kullaniciAdi: yeniAd })
        .then(function(){ return db.ref("cihazlar/" + id + "/kullaniciAdiGecmisi").push({adi: yeniAd, zaman: Date.now()}); })
        .then(function(){ cb(true); })
        .catch(function(err){ cb(false, err.message); });
    }catch(e){ cb(false, e.message); }
  }

  // pinHashDegeri: pin-utils.js'teki pinHashHesapla(pin) ile üretilmiş
  // SHA-256 hash'i — düz metin PIN hiçbir yerde saklanmaz/gönderilmez.
  function pinKaydet(id, pinHashDegeri, geriBildir){
    var cb = typeof geriBildir === "function" ? geriBildir : function(){};
    try{
      if(!id || !pinHashDegeri){ cb(false, "PIN kaydedilemedi."); return; }
      baslat();
      firebase.database().ref("cihazlar/" + id).update({ pinHash: pinHashDegeri, pinZaman: Date.now() })
        .then(function(){ cb(true); }).catch(function(err){ cb(false, err.message); });
    }catch(e){ cb(false, e.message); }
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
    benimKullaniciAdim: benimKullaniciAdim,
    kullaniciAdiKaydet: kullaniciAdiKaydet,
    adiniDegistir: adiniDegistir,
    pinKaydet: pinKaydet,
    tumCihazlariDinle: tumCihazlariDinle,
    engelle: engelle,
    engeliKaldir: engeliKaldir,
    benEngelliMiyim: benEngelliMiyim
  };

})();
