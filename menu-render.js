/*
  menu-render.js
  ==============
  Menü artık sadece liste + 2 doğrudan aksiyon (PIN Değiştir, Yedekle,
  Çıkış Yap). Ayarlar/Şablonlar/Veri kendi sayfalarında.
*/

function hataGoster(mesaj){
  console.error(mesaj);
  if(typeof HataLog !== "undefined") HataLog.kaydet(mesaj);
  var kutu = document.createElement("div");
  kutu.textContent = "⚠️ " + mesaj;
  kutu.style.cssText = "position:fixed;top:8px;left:8px;right:8px;background:#c0392b;color:#fff;padding:10px;border-radius:8px;font-size:13px;z-index:99999;";
  document.body.appendChild(kutu);
  setTimeout(function(){ kutu.remove(); }, 8000);
}

function tarihiGuncelle(){
  try{
    var el = document.getElementById("gunTarihi");
    if(!el) return;
    var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
    var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
    var d = new Date();
    el.textContent = gunler[d.getDay()] + ", " + d.getDate() + " " + aylar[d.getMonth()] + " " + d.getFullYear();
  }catch(e){ hataGoster("Tarih güncellenemedi: " + e.message); }
}

function pinDegistirTiklandi(){
  var mevcut = prompt("Mevcut PIN'i girin (ilk kez ayarlıyorsan varsayılan: 1234):");
  if(mevcut === null) return;
  pinDogrula(mevcut.trim()).then(function(dogruMu){
    if(!dogruMu){ alert("Mevcut PIN hatalı."); return; }
    var yeni = prompt("Yeni 4 haneli PIN girin:");
    if(yeni === null) return;
    yeni = yeni.trim();
    if(!/^[0-9]{4}$/.test(yeni)){ alert("PIN 4 haneli rakamlardan oluşmalı."); return; }
    var tekrar = prompt("Yeni PIN'i tekrar girin:");
    if(tekrar === null) return;
    if(tekrar.trim() !== yeni){ alert("PIN'ler eşleşmiyor."); return; }
    pinHashHesapla(yeni).then(function(yeniHash){
      pinYeniHashKaydet(yeniHash);
      alert("✓ PIN güncellendi.");
    });
  });
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnPinDegistir").onclick = pinDegistirTiklandi;
  document.getElementById("btnMenuAktif").onclick = function(){};
  document.getElementById("btnCikis").onclick = function(){
    if(!confirm("Çıkış yapmak istediğinize emin misiniz?")) return;
    firebase.auth().signOut().then(function(){
      window.location.href = "login.html";
    });
  };

  window.addEventListener("weiconAuthHazir", function(ev){
    var el = document.getElementById("kullaniciBilgi");
    if(el && ev.detail && ev.detail.user) el.textContent = ev.detail.user.email;
  });
});
