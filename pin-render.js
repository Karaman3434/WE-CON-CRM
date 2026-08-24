/*
  pin-render.js
  =============
  4 haneli tuş takımı + gizli input ile PIN toplar, pinDogrula() ile
  kontrol eder, doğruysa aktivite zamanını güncelleyip home.html'e döner.
*/

var girilenPin = "";

function noktalariGuncelle(){
  var noktalar = document.querySelectorAll(".pin-nokta");
  noktalar.forEach(function(n, i){
    n.classList.toggle("dolu", i < girilenPin.length);
  });
}

function rakamEkle(r){
  if(girilenPin.length >= 4) return;
  girilenPin += r;
  noktalariGuncelle();
  if(girilenPin.length === 4) pinKontrolEt();
}

function rakamSil(){
  girilenPin = girilenPin.slice(0, -1);
  noktalariGuncelle();
  document.getElementById("pinHata").hidden = true;
}

function pinKontrolEt(){
  pinDogrula(girilenPin).then(function(dogruMu){
    if(dogruMu){
      try{ localStorage.setItem("weicon_son_aktivite", Date.now().toString()); }catch(e){}
      window.location.href = "home.html";
    } else {
      document.getElementById("pinHata").hidden = false;
      girilenPin = "";
      noktalariGuncelle();
    }
  });
}

function tusTakiminiOlustur(){
  var tuslar = ["1","2","3","4","5","6","7","8","9","","0","⌫"];
  var grid = document.getElementById("pinTusGrid");
  grid.innerHTML = tuslar.map(function(t){
    if(t === "") return "<button class='pin-tus pin-tus--bos'></button>";
    if(t === "⌫") return "<button class='pin-tus pin-tus--sil' data-sil='1'>⌫</button>";
    return "<button class='pin-tus' data-rakam='" + t + "'>" + t + "</button>";
  }).join("");

  grid.querySelectorAll("[data-rakam]").forEach(function(btn){
    btn.onclick = function(){ rakamEkle(this.getAttribute("data-rakam")); };
  });
  grid.querySelector("[data-sil]").onclick = rakamSil;
}

document.addEventListener("DOMContentLoaded", function(){
  tusTakiminiOlustur();

  document.getElementById("btnTamGiris").onclick = function(){
    if(!confirm("E-posta ve şifre ile giriş yapmak istediğinize emin misiniz?")) return;
    firebase.auth().signOut().then(function(){
      window.location.href = "login.html";
    });
  };

  // Fiziksel/mobil klavye desteği için gizli input da dinleniyor
  var gizliInput = document.getElementById("pinGizliInput");
  document.querySelector(".giris-kutu").addEventListener("click", function(){ gizliInput.focus(); });
  gizliInput.addEventListener("input", function(){
    var v = gizliInput.value.replace(/[^0-9]/g, "").slice(0,4);
    gizliInput.value = "";
    for(var i=0;i<v.length;i++) rakamEkle(v[i]);
  });
});
