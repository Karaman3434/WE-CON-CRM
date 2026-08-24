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

function sablonlariDoldur(){
  try{
    var s = {};
    try{ s = JSON.parse(localStorage.getItem("weicon_mesaj_sablonlari")||"{}"); }catch(e){}
    document.getElementById("sablonMailMetni").value = s.mail || "";
    document.getElementById("sablonWhatsappMetni").value = s.whatsapp || "";
  }catch(e){ hataGoster("Şablonlar okunamadı: " + e.message); }
}

function sablonlariKaydet(){
  try{
    var s = {
      mail: document.getElementById("sablonMailMetni").value.trim(),
      whatsapp: document.getElementById("sablonWhatsappMetni").value.trim()
    };
    localStorage.setItem("weicon_mesaj_sablonlari", JSON.stringify(s));
    try{ firebase.database().ref("mesajSablonlari").set(s); }catch(e){}
    alert("✓ Şablonlar kaydedildi.");
  }catch(e){ hataGoster("Şablonlar kaydedilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  sablonlariDoldur();
  document.getElementById("btnSablonKaydet").onclick = sablonlariKaydet;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
});
