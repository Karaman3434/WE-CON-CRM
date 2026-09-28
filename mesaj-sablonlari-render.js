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

// Mesaj Ayarları — tamamen manuel: yazılan metin olduğu gibi kaydedilir,
// hiçbir yer tutucu/şart yok (bkz. mesaj-data.js).
var KUTULAR = {
  mail:     {alan: "sablonMailMetni",     btn: "btnMailKaydet",     durum: "mailDurum"},
  whatsapp: {alan: "sablonWhatsappMetni", btn: "btnWhatsappKaydet", durum: "whatsappDurum"}
};
var kullaniciDuzenledi = {mail: false, whatsapp: false};

function metinleriDoldur(){
  Object.keys(KUTULAR).forEach(function(k){
    var el = document.getElementById(KUTULAR[k].alan);
    if(el && !kullaniciDuzenledi[k]) el.value = MesajData.oku(k);
  });
}

function metniKaydet(kanal){
  try{
    var k = KUTULAR[kanal];
    var durum = document.getElementById(k.durum);
    durum.style.color = "#556170";
    durum.textContent = "Kaydediliyor…";
    MesajData.kaydet(kanal, document.getElementById(k.alan).value, function(fbTamam){
      kullaniciDuzenledi[kanal] = false;
      if(fbTamam){
        durum.style.color = "#16803c";
        durum.textContent = "✓ Kaydedildi — tüm cihazlarda geçerli";
      } else {
        durum.style.color = "#b7601f";
        durum.textContent = "✓ Bu cihazda kaydedildi — diğer cihazlara ulaşmadı, internet gelince tekrar Kaydet'e bas";
      }
    });
  }catch(e){ hataGoster("Metin kaydedilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  metinleriDoldur();
  Object.keys(KUTULAR).forEach(function(k){
    document.getElementById(KUTULAR[k].alan).addEventListener("input", function(){
      kullaniciDuzenledi[k] = true;
      document.getElementById(KUTULAR[k].durum).textContent = "";
    });
    document.getElementById(KUTULAR[k].btn).onclick = function(){ metniKaydet(k); };
  });
  // Başka cihazda yapılan son kayıt varsa getir (yazmaya başlanmamış kutulara)
  MesajData.tazele(metinleriDoldur);
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
});
