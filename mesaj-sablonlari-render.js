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

// Bu iki varsayılan metin, send-render.js'teki mesajMetniOlustur() içinde
// hiç şablon kaydedilmemişken kullanılan sabit (hardcoded) metinlerin
// {BELGE}/{URUN} yer tutuculu genel halidir — kullanıcı ekranı ilk
// açtığında "şu an gerçekten gönderilen metni" görsün diye buraya
// önceden dolduruluyor (WG.080926.194).
var VARSAYILAN_MAIL_SABLONU = "Bilgilerini paylaştığım {FIRMA} için {BELGE} göndermenizi rica ederim.\n{BELGE} bilgi formu ektedir. BİLGİNİZE.";
var VARSAYILAN_WHATSAPP_SABLONU = "İstediğiniz {URUN} için fiyat bilgilerini paylaşıyorum.";

function sablonlariDoldur(){
  try{
    var s = {};
    try{ s = JSON.parse(localStorage.getItem("weicon_mesaj_sablonlari")||"{}"); }catch(e){}
    document.getElementById("sablonMailMetni").value = s.mail || VARSAYILAN_MAIL_SABLONU;
    document.getElementById("sablonWhatsappMetni").value = s.whatsapp || VARSAYILAN_WHATSAPP_SABLONU;
  }catch(e){ hataGoster("Şablonlar okunamadı: " + e.message); }
}

function sablonuOkuHam(){
  try{ return JSON.parse(localStorage.getItem("weicon_mesaj_sablonlari")||"{}"); }catch(e){ return {}; }
}
function sablonuKaydet(s){
  localStorage.setItem("weicon_mesaj_sablonlari", JSON.stringify(s));
  try{ firebase.database().ref("mesajSablonlari").set(s); }catch(e){}
}

function mailSablonunuGuncelle(){
  try{
    var s = sablonuOkuHam();
    s.mail = document.getElementById("sablonMailMetni").value.trim();
    sablonuKaydet(s);
    alert("✓ E-posta şablonu güncellendi.");
  }catch(e){ hataGoster("E-posta şablonu kaydedilemedi: " + e.message); }
}
function whatsappSablonunuGuncelle(){
  try{
    var s = sablonuOkuHam();
    s.whatsapp = document.getElementById("sablonWhatsappMetni").value.trim();
    sablonuKaydet(s);
    alert("✓ WhatsApp şablonu güncellendi.");
  }catch(e){ hataGoster("WhatsApp şablonu kaydedilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  sablonlariDoldur();
  document.getElementById("btnMailSablonGuncelle").onclick = mailSablonunuGuncelle;
  document.getElementById("btnWhatsappSablonGuncelle").onclick = whatsappSablonunuGuncelle;
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
});
