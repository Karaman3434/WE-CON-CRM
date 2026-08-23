/*
  login-render.js
  ===============
  Giriş formunun onclick mantığı. Firebase'in kendi auth.js'i (paylaşılan
  dosya) zaten oturum durumunu izliyor ve başarılı girişte otomatik olarak
  home.html'e yönlendiriyor — bu dosya sadece formu Firebase'e bağlıyor.
*/

document.addEventListener("DOMContentLoaded", function(){
  var btn = document.getElementById("girisBtn");
  var hataEl = document.getElementById("girisHata");

  function girisYap(){
    var email = document.getElementById("girisEmail").value.trim();
    var sifre = document.getElementById("girisSifre").value;
    hataEl.hidden = true;
    if(!email || !sifre){
      hataEl.textContent = "E-posta ve şifre girin.";
      hataEl.hidden = false;
      return;
    }
    btn.disabled = true;
    btn.textContent = "Giriş yapılıyor...";
    firebase.auth().signInWithEmailAndPassword(email, sifre).catch(function(e){
      hataEl.textContent = "Giriş başarısız: e-posta veya şifre hatalı.";
      hataEl.hidden = false;
    }).finally(function(){
      btn.disabled = false;
      btn.textContent = "Giriş Yap";
    });
  }

  btn.onclick = girisYap;
  document.getElementById("girisSifre").addEventListener("keydown", function(e){
    if(e.key === "Enter") girisYap();
  });
});
