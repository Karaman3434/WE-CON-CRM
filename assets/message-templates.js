// --- Mesaj Şablonları (kullanıcı özelleştirebilir) -------------------------
var VARSAYILAN_MAIL_SABLON = "Bilgilerini paylaştığım Firma için {BELGE} göndermenizi rica ederim. {BELGE} bilgi formu ektedir. BİLGİNİZE.";
var VARSAYILAN_WHATSAPP_SABLON = "İstediğiniz {URUN} için ürün bilgi ve fiyatını ekte tabloda paylaştım.";

function mesajSablonlariniYukle(){
  var s = lsGet("weicon_mesaj_sablonlari", {mail:"", whatsapp:""});
  return s;
}
function mesajSablonuUygula(sablon, urunKelimesi, belgeAdi, firmaAdi){
  return sablon
    .split("{URUN}").join(urunKelimesi)
    .split("{BELGE}").join(belgeAdi)
    .split("{FIRMA}").join(firmaAdi||"");
}
function mesajSablonlariAc(){
  var s = mesajSablonlariniYukle();
  document.getElementById("sablonMailMetni").value = s.mail || "";
  document.getElementById("sablonWhatsappMetni").value = s.whatsapp || "";
  document.getElementById("mesajSablonlariModal").style.display = "flex";
}
function mesajSablonlariKaydet(){
  var s = {
    mail: document.getElementById("sablonMailMetni").value.trim(),
    whatsapp: document.getElementById("sablonWhatsappMetni").value.trim()
  };
  lsSet("weicon_mesaj_sablonlari", s);
  if(window.fbSet) window.fbSet("mesajSablonlari", s).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  showToast("✓ Mesaj şablonları kaydedildi.");
  document.getElementById("mesajSablonlariModal").style.display = "none";
}
function mesajSablonlariVarsayilanaDondur(){
  document.getElementById("sablonMailMetni").value = "";
  document.getElementById("sablonWhatsappMetni").value = "";
  lsSet("weicon_mesaj_sablonlari", {mail:"", whatsapp:""});
  if(window.fbSet) window.fbSet("mesajSablonlari", {mail:"", whatsapp:""}).catch(function(e){ console.error("Firebase yazma hatası:", e); });
  showToast("↺ Varsayılan metinlere döndürüldü.");
}
if(window.fbDinle){
  window.fbDinle("mesajSablonlari", function(data){
    if(data) lsSet("weicon_mesaj_sablonlari", data);
  });
}
// -----------------------------------------------------------------------

