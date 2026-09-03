/*
  auth.js
  =======
  TÜM sayfalar tarafından paylaşılan tek görevi: Firebase oturumunun açık
  olup olmadığını kontrol etmek. Oturum yoksa login.html'e yönlendirir.
  Oturum varsa sayfa içeriğini gösterir (body başta gizli tutulur — kısa
  bir an için "giriş yapılmamış" hâlinin görünmesini engellemek için).

  Her sayfanın <head> içine şu satır eklenmeli (diğer script'lerden ÖNCE):
    <script>document.documentElement.style.visibility='hidden';</script>
  ve body sonuna:
    <script src="auth.js"></script>
*/

(function(){

  var firebaseConfig = {
    apiKey: "AIzaSyC08Oe1LE7TdQl8gG2H9raZQek211Dxd60",
    authDomain: "weicon-asist.firebaseapp.com",
    databaseURL: "https://weicon-asist-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "weicon-asist",
    storageBucket: "weicon-asist.firebasestorage.app",
    messagingSenderId: "673730415323",
    appId: "1:673730415323:web:29c817e05a281261a61afe"
  };

  if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }

  var PIN_KILIT_ESIK_MS = 30*60*1000;   // 30 dakika hareketsizlik -> PIN ekranı
  var TAM_GIRIS_ESIK_MS = 3*60*60*1000; // 3 saat hareketsizlik -> tam e-posta/şifre girişi

  // ---- CİHAZ ENGELLEME (bkz. cihaz-data.js / cihazlar.html) ----
  // Bu bölüm KASITLI OLARAK cihaz-data.js'e bağımlı değil — auth.js zaten
  // TÜM sayfalarda yükleniyor, 28 ayrı HTML dosyasına yeni bir <script>
  // eklemek yerine gereken minimum mantık burada kendi başına duruyor.
  function cihazIdOku(){
    try{
      var id = localStorage.getItem("weicon_cihaz_id");
      if(!id){
        id = "c" + Date.now().toString(36) + Math.random().toString(36).slice(2,8);
        localStorage.setItem("weicon_cihaz_id", id);
      }
      return id;
    }catch(e){ return "bilinmeyen"; }
  }
  function cihazKaydiGuncelle(){
    try{
      var veri = { sonGorulme: Date.now() };
      var yerelAd = localStorage.getItem("weicon_cihaz_adi");
      if(yerelAd) veri.ad = yerelAd;
      firebase.database().ref("cihazlar/" + cihazIdOku()).update(veri).catch(function(){});
    }catch(e){}
  }
  // Çevrimdışıyken veya okuma başarısız olduğunda erişimi ENGELLEME —
  // sadece Firebase açıkça "engelli:true" derse kilitle.
  function cihazEngelliMi(geriBildir){
    try{
      firebase.database().ref("cihazlar/" + cihazIdOku() + "/engelli").once("value")
        .then(function(snap){ geriBildir(snap.val() === true); })
        .catch(function(){ geriBildir(false); });
    }catch(e){ geriBildir(false); }
  }

  // ---- ERİŞİM KODU (bağlantı sonu ?k=XXX) ----
  // Abdullah, Menü > Cihazlarım > Erişim Kodu'ndan istediği an yeni bir kod
  // belirleyebilir (SADECE Samsung S22'den). Kod belirlenmişse, bir tarayıcı
  // ancak DOĞRU koddaki bir bağlantıyla EN AZ BİR KEZ açılmışsa erişebilir —
  // bu kanıt localStorage'a yazılır, sonraki normal iç-uygulama gezinmelerinde
  // (linkte ?k= olmasa da) tekrar istenmez. Kod değişince eski kanıt geçersiz
  // kalır ve o tarayıcı yeni linkle tekrar açılana kadar erişemez.
  // Firebase okuma başarısız olursa (çevrimdışı, kural izin vermiyor vb.)
  // erişimi ENGELLEMEYİZ — bu bir "fail-open" güvenlik katmanıdır, tek
  // koruma katmanı DEĞİLDİR (PIN + cihaz engelleme ile birlikte çalışır).
  function erisimKoduGecerliMi(){
    return new Promise(function(resolve){
      try{
        firebase.database().ref("erisimKodu/kod").once("value").then(function(snap){
          var mevcutKod = snap.val();
          if(!mevcutKod){ resolve(true); return; }
          mevcutKod = String(mevcutKod);
          var urlKod = new URLSearchParams(window.location.search).get("k");
          if(urlKod && urlKod === mevcutKod){
            try{ localStorage.setItem("weicon_erisim_kodu_dogrulandi", mevcutKod); }catch(e){}
            try{ window.history.replaceState({}, "", window.location.pathname); }catch(e){}
            resolve(true);
            return;
          }
          var yerel = null;
          try{ yerel = localStorage.getItem("weicon_erisim_kodu_dogrulandi"); }catch(e){}
          resolve(yerel === mevcutKod);
        }).catch(function(){ resolve(true); });
      }catch(e){ resolve(true); }
    });
  }

  var yol = window.location.pathname;
  var buSayfaLogin = yol.indexOf("login.html") >= 0;
  var buSayfaPin = yol.indexOf("pin.html") >= 0;
  var buSayfaCihazEngelli = yol.indexOf("cihaz-engelli.html") >= 0;
  var buSayfaErisimReddedildi = yol.indexOf("erisim-reddedildi.html") >= 0;

  function aktiviteZamaniniGuncelle(){
    try{ localStorage.setItem("weicon_son_aktivite", Date.now().toString()); }catch(e){}
  }

  function gecenSureDurumu(){
    try{
      var son = parseInt(localStorage.getItem("weicon_son_aktivite")||"0", 10);
      if(!son) return 0;
      var fark = Date.now() - son;
      if(fark > TAM_GIRIS_ESIK_MS) return 2;
      if(fark > PIN_KILIT_ESIK_MS) return 1;
      return 0;
    }catch(e){ return 0; }
  }

  // ÇEVRİMDIŞI FARKINDALIK BANNER'I — Firebase Realtime Database yazma
  // işlemlerini bağlantı kesikken de otomatik kuyruğa alıp bağlantı gelince
  // gönderir (SDK'nın kendi varsayılan davranışı), ama kullanıcı bunun
  // farkında olmalı — aksi hâlde "kaydettim ama gitti mi gitmedi mi" belirsizliği
  // yaşanır. Bu yüzden basit bir banner ile durumu her sayfada gösteriyoruz.
  function cevrimdisiBannerOlustur(){
    if(document.getElementById("cevrimdisiBanner")) return;
    var b = document.createElement("div");
    b.id = "cevrimdisiBanner";
    b.textContent = "📴 Çevrimdışısın — kayıtların bağlantı gelince otomatik gönderilecek.";
    b.style.cssText = "display:none;position:fixed;top:0;left:0;right:0;background:#f2994a;color:#fff;text-align:center;padding:8px 12px;font-size:12px;font-weight:800;z-index:99998;";
    document.body.insertBefore(b, document.body.firstChild);
  }

  function cevrimdisiDurumGuncelle(){
    cevrimdisiBannerOlustur();
    var b = document.getElementById("cevrimdisiBanner");
    if(b) b.style.display = navigator.onLine ? "none" : "block";
  }

  window.addEventListener("online", cevrimdisiDurumGuncelle);
  window.addEventListener("offline", cevrimdisiDurumGuncelle);
  document.addEventListener("DOMContentLoaded", cevrimdisiDurumGuncelle);

  function normalAkisiIsle(user){
    if(user){
      // Giriş sayfasındaysak (yeni tamamlanmış bir giriş demektir), bayat
      // "son aktivite" zaman damgası yüzünden yanlışlıkla anında çıkışa
      // zorlamayı önlemek için aktiviteyi HEMEN tazeleyip durum kontrolünü
      // hiç uygulamadan doğrudan Ana Sayfa'ya geç.
      if(buSayfaLogin){
        aktiviteZamaniniGuncelle();
        window.location.href = "home.html";
        return;
      }
      var durum = gecenSureDurumu();
      if(durum === 2){
        firebase.auth().signOut();
        return; // signOut tekrar tetikleyecek (user=null dalı çalışacak)
      }
      if(durum === 1 && !buSayfaPin){
        window.location.href = "pin.html";
        return;
      }
      if(!buSayfaCihazEngelli){
        cihazEngelliMi(function(engelli){
          if(engelli){
            firebase.auth().signOut().then(function(){
              window.location.href = "cihaz-engelli.html";
            });
            return;
          }
          document.documentElement.style.visibility = "visible";
          if(!buSayfaPin) aktiviteZamaniniGuncelle();
          cihazKaydiGuncelle();
          window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
        });
        return;
      }
      document.documentElement.style.visibility = "visible";
      if(!buSayfaPin) aktiviteZamaniniGuncelle();
      window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
    } else {
      if(buSayfaCihazEngelli){
        document.documentElement.style.visibility = "visible";
      } else if(!buSayfaLogin){
        window.location.href = "login.html";
      } else {
        document.documentElement.style.visibility = "visible";
      }
    }
  }

  firebase.auth().onAuthStateChanged(function(user){
    // ERİŞİM KODU KONTROLÜ HER ŞEYDEN ÖNCE — login.html DAHİL. Böylece
    // yanlış/eski bir bağlantıyla gelen biri giriş formunu bile görmez.
    if(buSayfaErisimReddedildi){
      document.documentElement.style.visibility = "visible";
      return;
    }
    erisimKoduGecerliMi().then(function(gecerli){
      if(!gecerli){
        if(user){
          firebase.auth().signOut().then(function(){ window.location.href = "erisim-reddedildi.html"; });
        } else {
          window.location.href = "erisim-reddedildi.html";
        }
        return;
      }
      normalAkisiIsle(user);
    });
  });

})();
