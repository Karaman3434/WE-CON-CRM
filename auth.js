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

  var buSayfaLogin = window.location.pathname.indexOf("login.html") >= 0;

  firebase.auth().onAuthStateChanged(function(user){
    if(user){
      // Oturum açık — login sayfasındaysak ana sayfaya gönder, değilsek içeriği göster.
      if(buSayfaLogin){
        window.location.href = "home.html";
      } else {
        document.documentElement.style.visibility = "visible";
        window.dispatchEvent(new CustomEvent("weiconAuthHazir", {detail:{user:user}}));
      }
    } else {
      // Oturum yok — login sayfasında değilsek oraya gönder.
      if(!buSayfaLogin){
        window.location.href = "login.html";
      } else {
        document.documentElement.style.visibility = "visible";
      }
    }
  });

})();
