document.addEventListener("DOMContentLoaded", function(){
  var bilgi = {};
  try{ bilgi = JSON.parse(localStorage.getItem("weiconv2_gonderim_kanali")||"{}"); }catch(e){}

  var kanalEtiket = bilgi.kanal === "whatsapp" ? "WhatsApp mesajı gönderiliyor"
    : bilgi.kanal === "panoya" ? "📷 Panoya kopyalandı"
    : "Mail gönderiliyor";
  document.getElementById("gbKanalRozeti").textContent = kanalEtiket;

  var altMetin = bilgi.kanal === "panoya"
    ? "Görsel panoya kopyalandı — mail veya sohbete yapıştırabilirsin."
    : (bilgi.musteriAd
      ? (bilgi.musteriAd + " için sipariş/teklif formu paylaşım uygulamasına gönderildi.")
      : "Form paylaşım uygulamasına gönderildi.");
  document.getElementById("gbAltMetin").textContent = altMetin;

  document.getElementById("btnGbAnaSayfa").onclick = function(){
    try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_sepet_kur_override"); }catch(e){}
    try{ localStorage.removeItem("weicon_secili_musteri"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_secili_iletisim"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_onceden_secilen_tip"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_son_kaydedilen_belge"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_gonderim_kanali"); }catch(e){}
    window.location.href = "home.html";
  };
});
