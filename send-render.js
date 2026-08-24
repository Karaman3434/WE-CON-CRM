/*
  send-render.js
  ==============
  Müşteri/sepet özetini gösterir, belge türü seçimini yönetir, "Kaydet"
  butonuna basılınca SendData.kaydet() çağırır, başarılıysa sepeti
  boşaltıp Ana Sayfa'ya döner.
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

var secilenTip = "siparis";

function ozetiCiz(){
  try{
    var musteri = CustomerData.seciliyiOku();
    if(!musteri){
      hataGoster("Önce bir müşteri seçmelisiniz.");
      document.getElementById("btnKaydet").disabled = true;
      return;
    }
    document.getElementById("ozetMusteriAd").textContent = musteri.ad;
    document.getElementById("ozetMusteriSehir").textContent = musteri.sehir || "";

    var sepet = CartData.liste();
    if(sepet.length === 0){
      hataGoster("Sepetiniz boş, önce Ürün Bul'dan ürün seçin.");
      document.getElementById("btnKaydet").disabled = true;
      return;
    }

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    var t = CartData.genelToplam(kur, kdv);

    document.getElementById("ozetUrunSayisi").textContent = sepet.length;
    document.getElementById("ozetToplamEuro").textContent = CartData.fmt(t.toplamEuro) + " EUR";
    document.getElementById("ozetToplamPrim").textContent = CartData.fmt(t.toplamPrim) + " EUR";
  }catch(e){ hataGoster("Özet çizilemedi: " + e.message); }
}

function tipSecimBagla(){
  document.querySelectorAll(".tip-btn").forEach(function(btn){
    btn.onclick = function(){
      document.querySelectorAll(".tip-btn").forEach(function(b){ b.classList.remove("tip-btn--secili"); });
      this.classList.add("tip-btn--secili");
      secilenTip = this.getAttribute("data-tip");
    };
  });
}

function kaydetTiklandi(){
  try{
    var musteri = CustomerData.seciliyiOku();
    var sepet = CartData.liste();
    if(!musteri || sepet.length === 0) return;

    var btn = document.getElementById("btnKaydet");
    btn.disabled = true;
    btn.textContent = "Kaydediliyor...";

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();

    SendData.kaydet(secilenTip, musteri, sepet, kur, kdv, function(basarili, sonuc){
      if(basarili){
        try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
        gonderKutusunuGoster(musteri, sepet, secilenTip, kur, kdv);
      } else {
        btn.disabled = false;
        btn.textContent = "✓ Kaydet";
        hataGoster("Kaydetme başarısız: " + (sonuc && sonuc.message ? sonuc.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
}

function mesajMetniOlustur(musteri, sepet, tip, kur, kdv){
  var TIP_ETIKET = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
  var satirlar = [];
  satirlar.push("WEICON " + TIP_ETIKET[tip]);
  satirlar.push("Sayın " + musteri.ad + ",");
  satirlar.push("");
  sepet.forEach(function(u){
    var h = CartData.hesapla(u, kur, kdv);
    satirlar.push("• " + u.ad + " — " + u.adet + " adet x " + CartData.fmt(h.iskontoluFiyat) + " EUR = " + CartData.fmt(h.toplamEuro) + " EUR");
  });
  satirlar.push("");
  var t = CartData.genelToplam(kur, kdv);
  satirlar.push("Toplam: " + CartData.fmt(t.toplamEuro) + " EUR");
  satirlar.push("");
  satirlar.push("İyi çalışmalar dileriz.");
  return satirlar.join("\n");
}

function gonderKutusunuGoster(musteri, sepet, tip, kur, kdv){
  try{
    document.getElementById("gonderMetin").value = mesajMetniOlustur(musteri, sepet, tip, kur, kdv);
    var ilkKisi = (musteri.iletisimler && musteri.iletisimler[0]) ? musteri.iletisimler[0] : {};
    document.getElementById("gonderTelefon").value = ilkKisi.telefon || "";
    document.getElementById("gonderEposta").value = ilkKisi.eposta || "";
    document.getElementById("gonderKutu").hidden = false;
    document.getElementById("btnKaydet").hidden = true;
    document.getElementById("tipSecim").querySelectorAll(".tip-btn").forEach(function(b){ b.disabled = true; });
  }catch(e){ hataGoster("Gönderim alanı hazırlanamadı: " + e.message); }
}

function whatsappGonder(){
  var metin = document.getElementById("gonderMetin").value;
  var telefon = document.getElementById("gonderTelefon").value.replace(/[^0-9]/g,"");
  var url = telefon ? ("https://wa.me/"+telefon+"?text="+encodeURIComponent(metin)) : ("https://api.whatsapp.com/send?text="+encodeURIComponent(metin));
  window.open(url, "_blank");
}

function epostaGonder(){
  var metin = document.getElementById("gonderMetin").value;
  var eposta = document.getElementById("gonderEposta").value.trim();
  var url = "mailto:"+encodeURIComponent(eposta)+"?subject="+encodeURIComponent("WEICON")+"&body="+encodeURIComponent(metin);
  window.open(url, "_blank");
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  tipSecimBagla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnKaydet").onclick = kaydetTiklandi;
  document.getElementById("btnWhatsapp").onclick = whatsappGonder;
  document.getElementById("btnEposta").onclick = epostaGonder;
  document.getElementById("btnGonderBitir").onclick = function(){ window.location.href = "home.html"; };
  ozetiCiz();
});
