/*
  send-render.js
  ==============
  ARTIK SADECE gönderme paneli — kaydetme işi cart.html'e taşındı. Sayfa
  açılışında "weiconv2_son_kaydedilen_belge" localStorage anahtarını okur
  (cart.html'in az önce yazdığı kayıt bağlamı); bu yoksa cart.html'e geri
  yönlendirir. "Formu Görüntüle" ile tam önizleme + "Geri" ile Sepet'e
  dönüp düzeltme imkânı sunar (aynı gün+müşteri+ürün seti eşleştiğinde
  SendData.kaydet zaten revize eder, yeni kayıt açmaz).
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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

var TIP_ETIKET_ROZET = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var seciliAdresler = {};
var gonderBaglam = null;
var sonKaydedilenBelge = null;

function adresleriBelirle(musteri){
  seciliAdresler = {};
  if(musteri.faturaAdresleri && musteri.faturaAdresleri.length) seciliAdresler.faturaAdresi = musteri.faturaAdresleri[0];
  if(musteri.teslimatAdresleri && musteri.teslimatAdresleri.length) seciliAdresler.teslimatAdresi = musteri.teslimatAdresleri[0];
}

function sablonOku(kanal){
  try{
    var s = JSON.parse(localStorage.getItem("weicon_mesaj_sablonlari")||"{}");
    return (s && s[kanal]) ? s[kanal].trim() : "";
  }catch(e){ return ""; }
}

function sablonUygula(sablon, urunKelimesi, belgeAdi, firmaAdi){
  return sablon.split("{URUN}").join(urunKelimesi).split("{BELGE}").join(belgeAdi).split("{FIRMA}").join(firmaAdi||"");
}

function mesajMetniOlustur(musteri, sepet, tip, kanal){
  var sablon = kanal ? sablonOku(kanal) : "";
  var metin;
  if(sablon){
    var urunKelimesi = sepet.length===1 ? "ürün" : "ürünler";
    var TIP_ETIKET2 = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
    metin = "Merhaba,\n" + sablonUygula(sablon, urunKelimesi, TIP_ETIKET2[tip], musteri.ad) + "\n";
  } else {
    var tekUrunMu = sepet.length === 1;
    var govde = "Merhaba,\n";
    if(kanal === "whatsapp"){
      if(tip === "numune") govde += tekUrunMu ? "Sizinle paylaştığım ürün ekte, NUMUNE olarak gönderilecektir.\n" : "Sizinle paylaştığım ürünler ekte, NUMUNE olarak gönderilecektir.\n";
      else govde += tekUrunMu ? "İstediğiniz ürün için ürün bilgi ve fiyatını ekte paylaştım.\n" : "İstediğiniz ürünler için ürün bilgi ve fiyatını ekte paylaştım.\n";
    } else {
      if(tip === "siparis") govde += "Bilgilerini paylaştığım Firma için SİPARİŞİN\nişleme alınmasını rica ederim.\n";
      else if(tip === "proforma") govde += "Bilgilerini paylaştığım Firma için PROFORMA FATURA göndermenizi rica ederim.\n";
      else if(tip === "numune") govde += "Bilgilerini paylaştığım Firma için NUMUNE göndermenizi rica ederim.\n";
      else govde += "Bilgilerini paylaştığım Firma için FİYAT TEKLİFİ göndermenizi rica ederim.\n";
      var TIP_ETIKET3 = {numune:"Numune", teklif:"Fiyat Teklifi", proforma:"Proforma Fatura", siparis:"Sipariş"};
      govde += TIP_ETIKET3[tip] + " bilgi formu ektedir. BİLGİNİZE.\n";
    }
    metin = govde;
  }
  if(musteri.not && musteri.not.trim()){
    metin += "\nNOT: " + musteri.not.trim() + "\n";
  }
  return metin;
}

function tamOnizlemeHtmlOlustur(musteri, sepet, tip, kur, kdv){
  var vade = musteri.vade || "";
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  var yetkililer = musteri.iletisimler || [];
  var yetkiliBilgiHtml = yetkililer.map(function(k){ return HareketTablo.yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");
  var t = CartData.genelToplam(kur, kdv);

  var html = "<div class='belge-musteri-baslik'>CARİ BİLGİ</div>"
    + "<div class='belge-musteri-govde'>"
    + "<div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
    + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + HareketTablo.kosulKutusuHtml("📅","VADE",vade) + HareketTablo.kosulKutusuHtml("📄","FATURA",faturaTuru) + HareketTablo.kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
    + "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + (faturaAdr ? htmlEsc(faturaAdr) : "<span class='belge-adres-bos'>Girilmemiş</span>") + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>"
    + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>" : "")
    + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "")
    + "</div>";

  html += HareketTablo.grupHtml({
    etiket: (TIP_ETIKET_ROZET[tip]||""),
    urunler: sepet,
    hesapla: function(u){ return CartData.hesapla(u, kur, kdv); },
    zeminSinifi: "hareket-satir--yesil",
    genelToplam: t.toplamEuro,
    kur: kur
  });
  return html;
}

function gonderKutusunuGoster(musteri, sepet, tip, kur, kdv){
  try{
    gonderBaglam = {musteri:musteri, sepet:sepet, tip:tip, kur:kur, kdv:kdv};
    document.getElementById("gonderMetin").value = mesajMetniOlustur(musteri, sepet, tip, null);

    var kisiler = musteri.iletisimler || [];
    var secim = document.getElementById("gonderKisiSecim");
    if(kisiler.length > 1){
      secim.hidden = false;
      secim.innerHTML = kisiler.map(function(k, i){
        return "<option value='" + i + "'>" + htmlEsc(k.isim) + (k.gorev?" ("+htmlEsc(k.gorev)+")":"") + "</option>";
      }).join("");
      secim.onchange = function(){ kisiAlanlariniDoldur(kisiler[parseInt(this.value,10)]); };
      kisiAlanlariniDoldur(kisiler[0]);
    } else {
      secim.hidden = true;
      kisiAlanlariniDoldur(kisiler[0] || {});
    }
  }catch(e){ hataGoster("Gönderim alanı hazırlanamadı: " + e.message); }
}

function kisiAlanlariniDoldur(kisi){
  document.getElementById("gonderTelefon").value = (kisi && kisi.telefon) || "";
  document.getElementById("gonderEposta").value = (kisi && kisi.eposta) || "";
}

function sablonuUygulaTiklandi(kanal){
  if(!gonderBaglam) return;
  var g = gonderBaglam;
  document.getElementById("gonderMetin").value = mesajMetniOlustur(g.musteri, g.sepet, g.tip, kanal);
}

var TIP_ETIKET_BELGE_G = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};

function fmtG2(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function belgeGorselHtmlOlustur(musteri, sepet, tip, kur, kdv, kod, kanal){
  var basit = kanal === "whatsapp"; // WhatsApp'a giden görsel: Cari Bilgi yok, LİSTE/İSK/SIRA/PRİM yok
  var satirlarHtml = "";
  var netEuro = 0;
  sepet.forEach(function(u, i){
    var h = CartData.hesapla(u, kur, kdv);
    netEuro += h.toplamEuro;
    var urunHucre = "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>";
    if(basit){
      satirlarHtml += "<tr>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td>" + fmtG2(h.iskontoluFiyat) + " €</td>"
        + "<td class='belge-td-toplam'>" + fmtG2(h.toplamEuro) + " €</td>"
        + "</tr>";
    } else {
      satirlarHtml += "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td>" + fmtG2(u.listeFiyat||0) + " €</td>"
        + "<td class='belge-td-isk'>%" + (u.iskonto||0) + "</td>"
        + "<td>" + fmtG2(h.iskontoluFiyat) + " €</td>"
        + "<td class='belge-td-toplam'>" + fmtG2(h.toplamEuro) + " €</td>"
        + "</tr>";
    }
  });

  var simdi = new Date();
  var aylarKisa = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
  var tarihStr = simdi.getDate() + " " + aylarKisa[simdi.getMonth()] + " " + simdi.getFullYear() + " " + ("0"+simdi.getHours()).slice(-2) + ":" + ("0"+simdi.getMinutes()).slice(-2);

  var vade = musteri.vade || "";
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  var yetkililer = musteri.iletisimler || [];
  var yetkiliBilgiHtml = yetkililer.map(function(k){ return HareketTablo.yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");

  var tabloBasligi = (TIP_ETIKET_BELGE_G[tip]||"SİPARİŞ") + " · " + tarihStr;

  var cariBilgiHtml = basit ? "" :
    "<div class='belge-musteri-baslik'>CARİ BİLGİ</div>"
    + "<div class='belge-musteri-govde'>"
    + "<div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
    + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + HareketTablo.kosulKutusuHtml("📅","VADE",vade) + HareketTablo.kosulKutusuHtml("📄","FATURA",faturaTuru) + HareketTablo.kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
    + "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + (faturaAdr ? htmlEsc(faturaAdr) : "<span class='belge-adres-bos'>Girilmemiş</span>") + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>"
    + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>" : "")
    + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "")
    + "</div>";

  return "<div class='belge-kutu' style='margin:0;'>"
    + "<div class='belge-ust-baslik belge-ust-baslik--logo-tek'><span class='belge-logo-mini'>WEICON</span></div>"
    + cariBilgiHtml
    + "<div class='belge-belge-baslik-serit'>" + tabloBasligi + "</div>"
    + "<div class='data-table-container'><table class='belge-urun-tablo'>"
    + "<thead><tr>" + (basit
        ? "<th style='width:52%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>NET</th><th>TOPLAM</th>"
        : "<th style='width:6%;'>SIRA</th><th style='width:34%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th>") + "</tr></thead>"
    + "<tbody>" + satirlarHtml + "</tbody>"
    + "</table></div>"
    + "<div class='belge-genel-toplam-serit'>"
    + (kur ? "<span class='belge-gt-kur'>Günün Döviz Kuru<br>" + fmtG2(kur) + " Euro</span>" : "")
    + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
    + "<span class='belge-gt-deger'>" + fmtG2(netEuro) + " €</span></div>"
    + "</div>";
}

function belgeGorseliniOlustur(kanal, callback){
  try{
    if(typeof html2canvas === "undefined"){ callback(null); return; }
    var g = gonderBaglam;
    var alan = document.getElementById("belgeGorselAlani");
    alan.innerHTML = belgeGorselHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, (sonKaydedilenBelge&&sonKaydedilenBelge.kayit)?sonKaydedilenBelge.kayit.kod:"", kanal);
    setTimeout(function(){
      html2canvas(alan, {backgroundColor:"#ffffff", scale:1.4}).then(function(canvas){
        callback(canvas);
      }).catch(function(){ callback(null); });
    }, 60);
  }catch(e){ callback(null); }
}

function mailOnizlemeAc(){
  try{
    var g = gonderBaglam;
    var TIP_ETIKET5 = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
    var konu = "*** " + TIP_ETIKET5[g.tip] + " *** " + g.musteri.ad;
    document.getElementById("mailOnizlemeKonu").value = konu;
    document.getElementById("mailOnizlemeAlici").value = document.getElementById("gonderEposta").value.trim();
    document.getElementById("mailOnizlemeMetin").textContent = document.getElementById("gonderMetin").value;
    document.getElementById("mailOnizlemeTablo").innerHTML = HareketTablo.grupHtml({
      etiket: (TIP_ETIKET_ROZET[g.tip]||""),
      urunler: g.sepet,
      hesapla: function(u){ return CartData.hesapla(u, g.kur, g.kdv); },
      zeminSinifi: "hareket-satir--yesil",
      genelToplam: CartData.genelToplam(g.kur, g.kdv).toplamEuro,
      kur: g.kur
    });
    document.getElementById("mailOnizlemeOverlay").hidden = false;
  }catch(e){ hataGoster("Mail önizleme açılamadı: " + e.message); }
}

function whatsappOnizlemeAc(){
  try{
    var g = gonderBaglam;
    document.getElementById("whatsappOnizlemeAlici").value = document.getElementById("gonderTelefon").value.trim() || "(telefon girilmemiş)";
    document.getElementById("whatsappOnizlemeMetin").value = mesajMetniOlustur(g.musteri, g.sepet, g.tip, "whatsapp");
    document.getElementById("whatsappOnizlemeTablo").innerHTML = HareketTablo.grupHtml({
      etiket: (TIP_ETIKET_ROZET[g.tip]||""),
      urunler: g.sepet,
      hesapla: function(u){ return CartData.hesapla(u, g.kur, g.kdv); },
      zeminSinifi: "hareket-satir--yesil",
      genelToplam: CartData.genelToplam(g.kur, g.kdv).toplamEuro,
      kur: g.kur,
      kanal: "whatsapp"
    });
    document.getElementById("whatsappOnizlemeOverlay").hidden = false;
  }catch(e){ hataGoster("WhatsApp önizleme açılamadı: " + e.message); }
}

function gonderTiklandi(kanal, ozelKonu){
  try{
    var metin = document.getElementById("gonderMetin").value;
    var g = gonderBaglam;
    var TIP_ETIKET4 = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};

    var dosyaAdi = TIP_ETIKET4[g.tip].replace(/\s/g,"_") + "_" + g.musteri.ad.replace(/[^a-zA-Z0-9]+/g,"_") + ".png";
    var konuMetni = ozelKonu || ("*** " + TIP_ETIKET4[g.tip] + " *** " + g.musteri.ad);

    belgeGorseliniOlustur(kanal, function(canvas){
      if(!canvas){
        metinTabanliGonder(kanal, konuMetni);
        return;
      }
      canvas.toBlob(function(blob){
        if(!blob){ metinTabanliGonder(kanal, konuMetni); return; }
        var dosya = new File([blob], dosyaAdi, {type:"image/png"});
        var paylasimMetni = kanal==="whatsapp" ? metin : (konuMetni + "\n\n" + metin);

        if(navigator.canShare && navigator.canShare({files:[dosya]})){
          navigator.share({files:[dosya], title:konuMetni, text:paylasimMetni}).catch(function(err){
            if(err && err.name!=="AbortError") hataGoster("Paylaşım penceresi kapatıldı.");
          });
        } else {
          var url = URL.createObjectURL(blob);
          var a = document.createElement("a");
          a.href = url; a.download = dosyaAdi;
          document.body.appendChild(a); a.click(); document.body.removeChild(a);
          URL.revokeObjectURL(url);
          alert("Bu cihazda direkt paylaşım desteklenmiyor — belge görseli indirildi. Şimdi " + (kanal==="whatsapp"?"WhatsApp":"Mail") + " açılacak, resmi elle ekleyebilirsin.");
          metinTabanliGonder(kanal);
        }
      }, "image/png");
    });
  }catch(e){ hataGoster("Gönderim başlatılamadı: " + e.message); }
}

function metinTabanliGonder(kanal, ozelKonu){
  var metin = document.getElementById("gonderMetin").value;
  if(kanal === "whatsapp"){
    var telefon = document.getElementById("gonderTelefon").value.replace(/[^0-9]/g,"");
    var url = telefon ? ("https://wa.me/"+telefon+"?text="+encodeURIComponent(metin)) : ("https://api.whatsapp.com/send?text="+encodeURIComponent(metin));
    window.open(url, "_blank");
  } else {
    var eposta = document.getElementById("gonderEposta").value.trim();
    var konu = ozelKonu || "WEICON";
    var url2 = "mailto:"+encodeURIComponent(eposta)+"?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(metin);
    window.open(url2, "_blank");
  }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  // cart.html'in az önce yazdığı kayıt bağlamını oku — yoksa (örn. sayfaya
  // doğrudan URL ile girildiyse) Sepet'e geri gönder.
  var kayitliBaglam = null;
  try{ kayitliBaglam = JSON.parse(localStorage.getItem("weiconv2_son_kaydedilen_belge")||"null"); }catch(e){}
  if(!kayitliBaglam || !kayitliBaglam.musteri || !kayitliBaglam.sepet){
    window.location.href = "cart.html";
    return;
  }
  sonKaydedilenBelge = {kayit: kayitliBaglam.kayit, musteri: kayitliBaglam.musteri};
  adresleriBelirle(kayitliBaglam.musteri);
  if(kayitliBaglam.revizeMi){
    document.getElementById("gonderBaslikYazi").textContent = "🔄 Aynı ürünlerle mevcut kayıt bulundu — REVİZE olarak güncellendi.";
  }
  gonderKutusunuGoster(kayitliBaglam.musteri, kayitliBaglam.sepet, kayitliBaglam.tip, kayitliBaglam.kur, kayitliBaglam.kdv);

  document.getElementById("btnWhatsapp").onclick = function(){ whatsappOnizlemeAc(); };
  document.getElementById("btnEposta").onclick = function(){ mailOnizlemeAc(); };
  document.getElementById("mailOnizlemeVazgecBtn").onclick = function(){ document.getElementById("mailOnizlemeOverlay").hidden = true; };
  document.getElementById("mailOnizlemeGonderBtn").onclick = function(){
    var konu = document.getElementById("mailOnizlemeKonu").value.trim() || "WEICON";
    document.getElementById("mailOnizlemeOverlay").hidden = true;
    gonderTiklandi("mail", konu);
  };
  document.getElementById("mailOnizlemeOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });
  document.getElementById("whatsappOnizlemeVazgecBtn").onclick = function(){ document.getElementById("whatsappOnizlemeOverlay").hidden = true; };
  document.getElementById("whatsappOnizlemeGonderBtn").onclick = function(){
    document.getElementById("gonderMetin").value = document.getElementById("whatsappOnizlemeMetin").value;
    document.getElementById("whatsappOnizlemeOverlay").hidden = true;
    gonderTiklandi("whatsapp");
  };
  document.getElementById("whatsappOnizlemeOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });
  document.getElementById("btnWhatsappSablon").onclick = function(){ sablonuUygulaTiklandi("whatsapp"); };
  document.getElementById("btnEpostaSablon").onclick = function(){ sablonuUygulaTiklandi("mail"); };
  document.getElementById("btnFormuGoruntule").onclick = function(){
    var alan = document.getElementById("tamOnizlemeAlani");
    var geriBtn = document.getElementById("btnGeriDuzelt");
    var acikMi = !alan.hidden;
    if(acikMi){
      alan.hidden = true;
      this.textContent = "👁 Formu Görüntüle";
    } else {
      var g = gonderBaglam;
      alan.innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv);
      alan.hidden = false;
      this.textContent = "👁 Formu Gizle";
    }
  };
  document.getElementById("btnGeriDuzelt").onclick = function(){
    window.location.href = "cart.html";
  };
  document.getElementById("btnGonderBitir").onclick = function(){
    try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
    try{ localStorage.removeItem("weicon_secili_musteri"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_onceden_secilen_tip"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_son_kaydedilen_belge"); }catch(e){}
    window.location.href = "home.html";
  };
});
