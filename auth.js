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
    projectId: "weicon-asist"
  };

  if(!firebase.apps.length){ firebase.initializeApp(firebaseConfig); }

  var PIN_KILIT_ESIK_MS = 30*60*1000;   // 30 dakika hareketsizlik -> PIN ekranı
  var TAM_GIRIS_ESIK_MS = 3*60*60*1000; // 3 saat hareketsizlik -> tam e-posta/şifre girişi

  var yol = window.location.pathname;
  var buSayfaLogin = yol.indexOf("login.html") >= 0;
  var buSayfaPin = yol.indexOf("pin.html") >= 0;

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

  firebase.auth().onAuthStateChanged(function(user){
    if(user){
      var durum = gecenSureDurumu();
      if(durum === 2){
        firebase.auth().signOut();
        return; // signOut tekrar tetikleyecek (user=null dalı çalışacak)
      }
      if(durum === 1 && !buSayfaPin){
        window.location.href = "pin.html";
        return;
      }
      if(buSayfaLogin){
        window.location.href = "home.html";
      } else {
        document.documentElement.style.visibility = "visible";
        if(!buSayfaPin) aktiviteZamaniniGuncelle();
        window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
      }
    } else {
      if(!buSayfaLogin){
        window.location.href = "login.html";
      } else {
        document.documentElement.style.visibility = "visible";
      }
    }
  });

})();
