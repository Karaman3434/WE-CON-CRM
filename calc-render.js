/*
  calc-render.js
  ==============
  Ürün arama + hesaplama alanlarını dinler, CartData.hesapla() ile anlık
  sonucu gösterir. Kaydetme yok — sadece hesaplama aracı.
*/

function kurIkonuGuncelle(){
  var ikon = document.getElementById("headerKurIkon");
  if(ikon) ikon.textContent = (kurOverride!=null) ? "✏️" : "🔄";
}

function kurSecimiGoster(){
  var gunlukKur = CartData.kurOku();
  document.getElementById("kurGunlukDeger").textContent = CartData.fmt(gunlukKur);
  var manuelAlan = document.getElementById("kurManuelAlan");
  manuelAlan.hidden = true;
  document.getElementById("kurManuelInput").value = (kurOverride!=null) ? kurOverride : "";
  document.getElementById("btnKurGunluk").className = "kur-secenek-btn" + (kurOverride==null ? " kur-secenek-btn--secili" : "");
  document.getElementById("btnKurManuelAc").className = "kur-secenek-btn" + (kurOverride!=null ? " kur-secenek-btn--secili" : "");
  document.getElementById("kurSecimOverlay").hidden = false;
}

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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function aramaSonuclariniCiz(){
  try{
    var q = document.getElementById("searchInput").value;
    var liste = document.getElementById("sonucListesi");
    if(q.trim().length === 0){ liste.innerHTML = ""; return; }

    var sonuclar = ProductData.ara(q).slice(0, 15);
    liste.innerHTML = sonuclar.map(function(s){
      var bilgi = ProductData.urunBilgisi(s.item);
      return "<div class='hesapla-arama-karti' data-idx='" + s.idx + "'>"
        + "<div class='hesapla-arama-bilgi'><div class='hesapla-arama-kod'>Berta: " + htmlEsc(bilgi.berta||"-") + "</div><div class='hesapla-arama-ad'>" + htmlEsc(bilgi.ad) + "</div></div>"
        + "<div class='hesapla-arama-fiyat'>" + bilgi.fiyat.toFixed(2) + " EUR</div>"
        + "</div>";
    }).join("");

    liste.querySelectorAll(".hesapla-arama-karti").forEach(function(kart, i){
      kart.onclick = function(){
        var bilgi = ProductData.urunBilgisi(sonuclar[i].item);
        urunSec(bilgi);
      };
    });
  }catch(e){ hataGoster("Arama sonuçları çizilemedi: " + e.message); }
}

var seciliUrunBilgi = null;
var duzenlenenSepetIdx = null; // Sepet'ten "düzenle" ile gelindiyse dolu olur

function duzenlemeModunuKontrolEt(){
  try{
    var idx = localStorage.getItem("weiconv2_hesapla_duzenle_idx");
    if(!idx) return;
    localStorage.removeItem("weiconv2_hesapla_duzenle_idx");
    var sepet = [];
    try{ sepet = JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]"); }catch(e){}
    var u = sepet.find(function(x){ return String(x.idx)===String(idx); });
    if(!u) return;
    duzenlenenSepetIdx = u.idx;
    seciliUrunBilgi = {ad:u.ad, berta:u.berta, abas:u.abas, fiyat:u.listeFiyat};
    document.getElementById("seciliUrunAd").textContent = u.ad;
    document.getElementById("seciliUrunKutu").hidden = false;
    document.getElementById("hesListeFiyat").value = u.listeFiyat || 0;
    // Sepetten "düzenle" ile gelindiğinde, ürün Ürün Bul'dan eklenmiş ve
    // henüz hiç hesaplanmamışsa dipFiyat 0 olarak gelir — bunu olduğu gibi
    // göstermek yerine (Dip=0 → Marj=Net Fiyat'ın tamamı → prim çok
    // şişer), aynı urunSec()'teki gibi otomatik öneriyi uygula.
    if(u.dipFiyat){
      document.getElementById("hesDipFiyat").value = u.dipFiyat;
    } else {
      dipFiyatiOner();
    }
    document.getElementById("hesIskonto").value = u.iskonto || 0;
    document.getElementById("hesAdet").value = u.adet || 1;
    document.getElementById("btnHesapSepeteEkle").textContent = "➕ LİSTEYE EKLE";
    hesaplaVeGoster();
  }catch(e){ hataGoster("Düzenleme modu açılamadı: " + e.message); }
}

function dipFiyatiOner(){
  var liste = parseFloat(document.getElementById("hesListeFiyat").value)||0;
  document.getElementById("hesDipFiyat").value = CartData.dipFiyatOner(liste);
}

// Döviz Kuru geçici override (WG.100926.196) — sadece o an ekranda olan
// hesaplama için geçerli, kalıcı DEĞİL. Yeni bir ürün seçilince (yeni
// "işlem" başladığında) otomatik sıfırlanır, günlük kura dönülür.
var kurOverride = null;

function urunSec(bilgi){
  kurOverride = null;
  kurIkonuGuncelle();
  seciliUrunBilgi = bilgi;
  document.getElementById("seciliUrunAd").textContent = bilgi.ad;
  document.getElementById("seciliUrunKutu").hidden = false;
  document.getElementById("hesListeFiyat").value = bilgi.fiyat;
  dipFiyatiOner();
  document.getElementById("searchInput").value = "";
  document.getElementById("sonucListesi").innerHTML = "";
  hesaplaVeGoster();
}

function hesaplaVeGoster(){
  try{
    var listeFiyat = parseFloat(document.getElementById("hesListeFiyat").value)||0;
    var urun = {
      listeFiyat: listeFiyat,
      dipFiyat: parseFloat(document.getElementById("hesDipFiyat").value)||0,
      iskonto: parseFloat(document.getElementById("hesIskonto").value)||0,
      adet: parseFloat(document.getElementById("hesAdet").value)||1
    };
    var kur = (kurOverride!=null) ? kurOverride : CartData.kurOku();
    var kdv = CartData.kdvOku();
    var h = CartData.hesapla(urun, kur, kdv);

    document.getElementById("rIskontoluFiyat").innerHTML = CartData.fmt(h.iskontoluFiyat) + "<span class='hc-turuncu-birim'>EURO</span>";
    document.getElementById("rTlBirimFiyat").innerHTML = CartData.fmt(h.tlBirimFiyat) + "<span class='hc-turuncu-birim'> TL</span>";
    document.getElementById("rToplamEuro").textContent = CartData.fmt(h.toplamEuro) + " EURO";
    document.getElementById("rFaturaToplam").textContent = CartData.fmt(h.faturaToplam) + " TL";
    var kur2 = kur||0;
    document.getElementById("rPrimTL").textContent = (h.mudurPrim===0 && urun.iskonto>60) ? "ÖZEL FİYAT" : (h.mudurPrim<0 ? "Yok" : CartData.fmt(h.mudurPrim*kur2)+" TL");
  }catch(e){ hataGoster("Hesaplama yapılamadı: " + e.message); }
}

function sepeteEkleTiklandi(){
  try{
    var ad = seciliUrunBilgi ? seciliUrunBilgi.ad : prompt("Ürün adı girin:", "");
    if(!ad) return;
    var listeFiyat = parseFloat(document.getElementById("hesListeFiyat").value)||0;
    var dipFiyat = parseFloat(document.getElementById("hesDipFiyat").value)||0;
    var iskonto = parseFloat(document.getElementById("hesIskonto").value)||0;
    var adet = parseFloat(document.getElementById("hesAdet").value)||1;

    if(duzenlenenSepetIdx !== null){
      // Sepet'ten bir ürünü düzenlemek için geldik — yeni satır AÇMA,
      // mevcut satırı güncelleyip hesaplandı say ve sepete geri dön.
      CartData.hesaplandiIsaretle(duzenlenenSepetIdx, listeFiyat, dipFiyat, iskonto, adet);
      if(kurOverride!=null) localStorage.setItem("weiconv2_sepet_kur_override", kurOverride);
      window.location.href = "cart.html";
      return;
    }

    var yeniUrun = {
      idx: "manuel_" + Date.now(),
      ad: ad,
      berta: seciliUrunBilgi ? seciliUrunBilgi.berta : "",
      abas: seciliUrunBilgi ? seciliUrunBilgi.abas : "",
      listeFiyat: listeFiyat,
      dipFiyat: dipFiyat,
      iskonto: iskonto,
      adet: adet,
      hesaplandi: true
    };
    var mevcutSepet = [];
    try{ mevcutSepet = JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]"); }catch(e){}
    mevcutSepet.push(yeniUrun);
    if(kurOverride!=null) localStorage.setItem("weiconv2_sepet_kur_override", kurOverride);
    localStorage.setItem("weiconv2_sepet", JSON.stringify(mevcutSepet));
    if(confirm("✓ Sepete eklendi. Sepete gidip devam etmek ister misin?")){
      window.location.href = "cart.html";
    }
  }catch(e){ hataGoster("Sepete eklenemedi: " + e.message); }
}

function sepetDoluMu(){
  try{ return JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]").length > 0; }
  catch(e){ return false; }
}
function musteriSeciliMi(){
  try{ return !!JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null"); }
  catch(e){ return false; }
}
// Bu sayfada "kaybedilecek" bir şey var mı: bulunup seçilmiş bir ürün,
// sepete zaten eklenmiş ürünler, veya seçili bir müşteri.
function kaybedilecekBirSeyVarMi(){
  return !!seciliUrunBilgi || sepetDoluMu() || musteriSeciliMi();
}
function herSeyiSifirlaVeGit(hedefUrl){
  try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
  try{ localStorage.removeItem("weiconv2_sepet_kur_override"); }catch(e){}
  try{ if(typeof CustomerData !== "undefined") CustomerData.secimiKaldir(); }catch(e){}
  try{
    localStorage.removeItem("weiconv2_onceden_secilen_tip");
    localStorage.removeItem("weiconv2_hesapla_duzenle_idx");
    localStorage.removeItem("weiconv2_ilerlet_kaynak");
    localStorage.removeItem("weiconv2_islem_yap_akisi");
  }catch(e){}
  window.location.href = hedefUrl;
}
var iptalOnayHedefUrl = null;
function iptalOnayGoster(hedefUrl){
  iptalOnayHedefUrl = hedefUrl;
  document.getElementById("iptalOnayOverlay").hidden = false;
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("searchInput").addEventListener("input", aramaSonuclariniCiz);
  document.getElementById("btnUrunTemizle").onclick = function(){
    document.getElementById("seciliUrunKutu").hidden = true;
    seciliUrunBilgi = null;
  };
  document.getElementById("btnHesapSepeteEkle").onclick = sepeteEkleTiklandi;
  ["hesListeFiyat","hesDipFiyat","hesIskonto","hesAdet"].forEach(function(id){
    document.getElementById(id).addEventListener("input", function(){
      if(id==="hesListeFiyat") dipFiyatiOner();
      hesaplaVeGoster();
    });
  });
  document.getElementById("btnHesapKapat").onclick = function(ev){
    if(!kaybedilecekBirSeyVarMi()) return; // kaybedilecek bir şey yoksa direkt git, sormaya gerek yok
    ev.preventDefault();
    iptalOnayGoster("home.html");
  };
  var geriLink = document.querySelector(".nav-btn--geri");
  if(geriLink){
    geriLink.addEventListener("click", function(ev){
      if(!kaybedilecekBirSeyVarMi()) return;
      ev.preventDefault();
      iptalOnayGoster(geriLink.getAttribute("href") || "home.html");
    });
  }
  document.getElementById("btnIptalOnayEvet").onclick = function(){
    var hedef = iptalOnayHedefUrl || "home.html";
    document.getElementById("iptalOnayOverlay").hidden = true;
    herSeyiSifirlaVeGit(hedef);
  };
  document.getElementById("btnIptalOnayVazgec").onclick = function(){
    document.getElementById("iptalOnayOverlay").hidden = true;
    iptalOnayHedefUrl = null;
  };

  // Üst header'daki döviz kuru alanına dokununca (sadece bu sayfada) normal
  // "günlük kuru yenile" davranışı yerine Günlük/Manuel seçim popup'ı açılır.
  var headerKurBtn = document.getElementById("headerKurYenileBtn");
  if(headerKurBtn){
    headerKurBtn.onclick = function(ev){
      ev.preventDefault();
      kurSecimiGoster();
    };
  }
  document.getElementById("btnKurGunluk").onclick = function(){
    kurOverride = null;
    kurIkonuGuncelle();
    document.getElementById("kurSecimOverlay").hidden = true;
    hesaplaVeGoster();
  };
  document.getElementById("btnKurManuelAc").onclick = function(){
    document.getElementById("kurManuelAlan").hidden = false;
    document.getElementById("kurManuelInput").focus();
  };
  document.getElementById("btnKurManuelKaydet").onclick = function(){
    var deger = parseFloat(document.getElementById("kurManuelInput").value);
    if(!deger || deger <= 0){ hataGoster("Geçerli bir kur girin."); return; }
    kurOverride = deger;
    kurIkonuGuncelle();
    document.getElementById("kurSecimOverlay").hidden = true;
    hesaplaVeGoster();
  };
  document.getElementById("btnKurSecimVazgec").onclick = function(){
    document.getElementById("kurSecimOverlay").hidden = true;
  };

  // Menü butonu artık yarim-kalan-uyari.js tarafından yönetiliyor (sepette
  // ürün + seçili müşteri varsa uyarıp sonra temizleyip gidiyor).
  ProductData.katalogDegistiginde(function(){});
  hesaplaVeGoster();
  duzenlemeModunuKontrolEt();
});
