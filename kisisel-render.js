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
  }catch(e){}
}

// Hesaba Yatacak — Maaş + Prim Hesaplama sayfasındaki açık dönem
// kartıyla aynı canlı rakamı gösterir (eskiden Ana Sayfa'daydı,
// bkz. kisisel.html başındaki not).
function hesabaYatacakGuncelle(){
  try{
    var el = document.getElementById("kisiselYatacakDeger");
    if(!el || typeof MaasOzetVeri === "undefined") return;
    var ozet = MaasOzetVeri.acikDonemHesapla();
    el.textContent = ozet.hesabaYatacak.toLocaleString("tr-TR", {minimumFractionDigits:2, maximumFractionDigits:2}) + " TL";
  }catch(e){ hataGoster("Hesaba yatacak güncellenemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  hesabaYatacakGuncelle();
  try{ KomisyonData.degistiginde(hesabaYatacakGuncelle); }catch(e){}
  try{ AvansKayitData.degistiginde(hesabaYatacakGuncelle); }catch(e){}
  try{ MaasKayitData.degistiginde(hesabaYatacakGuncelle); }catch(e){}
});
