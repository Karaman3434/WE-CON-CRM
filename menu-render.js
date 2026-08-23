/*
  menu-render.js
  ==============
  Kur/KDV ayarlarını eski uygulamayla PAYLAŞILAN localStorage anahtarlarından
  okur/yazar, kullanıcı e-postasını gösterir, çıkış yapar.
*/

function hataGoster(mesaj){
  console.error(mesaj);
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

function ayarlariDoldur(){
  try{
    var kur = parseFloat(localStorage.getItem("weicon_kur"));
    var kdv = parseFloat(localStorage.getItem("weicon_kdv_orani"));
    document.getElementById("kurInput").value = isNaN(kur) ? "" : kur;
    document.getElementById("kdvInput").value = isNaN(kdv) ? 20 : kdv;
  }catch(e){ hataGoster("Ayarlar okunamadı: " + e.message); }
}

function ayarlariKaydet(){
  try{
    var kur = parseFloat(document.getElementById("kurInput").value) || 0;
    var kdv = parseFloat(document.getElementById("kdvInput").value) || 20;
    localStorage.setItem("weicon_kur", kur);
    localStorage.setItem("weicon_kur_zaman", Date.now());
    localStorage.setItem("weicon_kdv_orani", kdv);
    alert("✓ Ayarlar kaydedildi.");
  }catch(e){ hataGoster("Ayarlar kaydedilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  ayarlariDoldur();
  document.getElementById("btnAyarKaydet").onclick = ayarlariKaydet;
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
