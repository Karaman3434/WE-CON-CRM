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

var TIP_ETIKET_ROZET = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
var seciliAdresler = {};
var gonderBaglam = null;
var sonKaydedilenBelge = null;

function adresleriBelirle(musteri){
  seciliAdresler = {};
  // İŞLEM İÇİN SEÇİM (WG.090926.196): Cari Kart'ta işaretlenen fatura/
  // teslimat adresi indeksi varsa onu kullan; yoksa (kart üzerinden
  // gelinmediyse) ilk kayda düş — eski davranış.
  var secim = {};
  try{ secim = JSON.parse(localStorage.getItem("weiconv2_secili_iletisim")||"{}"); }catch(e){}
  if(musteri.faturaAdresleri && musteri.faturaAdresleri.length){
    var fi = (secim.fatura!=null && musteri.faturaAdresleri[secim.fatura]) ? secim.fatura : 0;
    seciliAdresler.faturaAdresi = musteri.faturaAdresleri[fi];
  } else if(musteri.acikAdres && musteri.acikAdres.trim()){
    // Geriye dönük kural: ayrı bir fatura adresi hiç girilmemişse, müşteri
    // eklenirken girilen Açık Adres fatura adresi olarak kullanılır — eski
    // müşteri kayıtları için de "Girilmemiş" görünmesin diye.
    seciliAdresler.faturaAdresi = {etiket:"Fatura Adresi", adres: musteri.acikAdres.trim()};
  }
  if(musteri.teslimatAdresleri && musteri.teslimatAdresleri.length){
    var ti = (secim.teslimat!=null && musteri.teslimatAdresleri[secim.teslimat]) ? secim.teslimat : 0;
    seciliAdresler.teslimatAdresi = musteri.teslimatAdresleri[ti];
  }
}

// Mesaj metni TAMAMEN MANUEL (WG.210926.1531.584): Mesaj Ayarları'nda
// yazılan metin olduğu gibi döner — otomatik "Merhaba,", müşteri notu ekleme
// yok. TEK İSTİSNA (WG.210926.1603.585): metindeki HAREKET kelimesi işleme
// göre SİPARİŞ/FİYAT TEKLİFİ/PROFORMA FATURA/NUMUNE olur (bkz. mesaj-data.js).
function mesajMetniOlustur(musteri, sepet, tip, kanal){
  return MesajData.uygula(MesajData.oku(kanal === "whatsapp" ? "whatsapp" : "mail"), tip);
}

// Gönder ekranı yeniden düzeni (WG.210926.1512.583): 1) Cari Bilgi üst şeridi
// artık SİPARİŞ/WEICON etiketi yerine ortalanmış "<TÜR> FORMU" başlığı;
// 2) VADE/FATURA/KARGO üç kutu yerine tek satır (etiket değerin başında).
// Yeni sınıflar SADECE bu dosyada kullanılır — belge-render.js (Belge
// Önizleme) eski .belge-kosul-grid / .belge-musteri-baslik yapısını korur.
var FORM_BASLIK = {numune:"NUMUNE FORMU", teklif:"FİYAT TEKLİFİ FORMU", proforma:"PROFORMA FORMU", siparis:"SİPARİŞ FORMU"};
function formBaslikHtml(tip){
  return "<div class='belge-form-baslik'>" + (FORM_BASLIK[tip]||"SİPARİŞ FORMU") + "</div>";
}
// VADE artık Müşteri Kartı'nda SAYI (gün) olarak tutuluyor (21.09.2026);
// burada okunaklı gösterim için "45" -> "45 gün" biçimine çevrilir. Eski
// serbest metin kayıtlarda (henüz sayıya çevrilmemiş müşteriler) olduğu
// gibi gösterilir.
function vadeGosterimMetni(v){
  var s = String(v||"").trim();
  if(s === "") return "";
  var n = parseInt(s, 10);
  return (!isNaN(n) && n >= 0 && String(n) === s) ? (n + " gün") : s;
}

function kosulSatiriHtml(vade, faturaTuru, kargo){
  return "<div class='belge-kosul-satir'>"
    + "<span class='kl'>VADE :</span> " + htmlEsc(vade||"-")
    + " <span class='ks'>-</span> <span class='kl'>FATURA :</span> " + htmlEsc(faturaTuru||"-")
    + " <span class='ks'>-</span> <span class='kl'>KARGO :</span> " + htmlEsc(kargo||"-")
    + "</div>";
}
// Tek satıra sığmazsa yazı satır atlamaz, küçülür (en fazla 7px'e kadar).
function kosulSatirlariniSigdir(kok){
  try{
    var satirlar = (kok||document).querySelectorAll(".belge-kosul-satir");
    for(var i=0;i<satirlar.length;i++){
      var el = satirlar[i]; el.style.fontSize = "";
      var boyut = 11;
      while(el.scrollWidth > el.clientWidth + 1 && boyut > 7){ boyut -= 0.5; el.style.fontSize = boyut + "px"; }
    }
  }catch(e){}
}

function tamOnizlemeHtmlOlustur(musteri, sepet, tip, kur, kdv, kanal){
  var basit = kanal === "whatsapp";
  var vade = vadeGosterimMetni(musteri.vade);
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  // İŞLEM İÇİN SEÇİM (WG.090926.196): tabloda/mailde artık TÜM yetkililer
  // değil, Cari Kart'ta işaretlenen TEK yetkili gösterilir.
  var yetkililer = musteri.iletisimler || [];
  var yetkiliSecim = {};
  try{ yetkiliSecim = JSON.parse(localStorage.getItem("weiconv2_secili_iletisim")||"{}"); }catch(e){}
  var yki = (yetkiliSecim.yetkili!=null && yetkililer[yetkiliSecim.yetkili]) ? yetkiliSecim.yetkili : 0;
  var seciliYetkili = yetkililer[yki];
  var yetkiliBilgiHtml = seciliYetkili ? HareketTablo.yetkiliSatiriHtml(seciliYetkili.isim, seciliYetkili.telefon, seciliYetkili.eposta) : "";
  var tToplamEuro = 0;
  (sepet||[]).forEach(function(u){ var h = CartData.hesapla(u, kur, kdv); if(h && h.toplamEuro!=null) tToplamEuro += h.toplamEuro; });

  var musteriBlokHtml;
  if(basit){
    musteriBlokHtml =
      "<div class='belge-musteri-ad belge-musteri-ad--sade'>" + htmlEsc(musteri.ad) + "</div>"
      + (musteri.sehir ? "<div class='belge-musteri-sehir'>" + htmlEsc(musteri.sehir) + "</div>" : "");
  } else {
    musteriBlokHtml =
      "<div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
      + ((vade||faturaTuru||kargo) ? kosulSatiriHtml(vade,faturaTuru,kargo) : "")
      + "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + (faturaAdr ? htmlEsc(faturaAdr) : "<span class='belge-adres-bos'>Girilmemiş</span>") + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>"
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>" : "")
      + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "");
  }

  var html = "<div class='belge-kart'>" + formBaslikHtml(tip)
    + "<div class='belge-musteri-govde'>"
    + musteriBlokHtml
    + "</div></div><div class='belge-kart-ayrac'></div><div class='belge-kart'>";

  html += HareketTablo.grupHtml({
    etiket: (TIP_ETIKET_ROZET[tip]||""),
    etiketRozet: "WEICON",
    urunler: sepet,
    hesapla: function(u){ return CartData.hesapla(u, kur, kdv); },
    zeminSinifi: "hareket-satir--yesil",
    genelToplam: tToplamEuro,
    kanal: kanal,
    primGizli: true
  });
  html += "</div>";
  return html;
}

function gonderKutusunuGoster(musteri, sepet, tip, kur, kdv){
  try{
    gonderBaglam = {musteri:musteri, sepet:sepet, tip:tip, kur:kur, kdv:kdv};
    var metinKutusu = document.getElementById("gonderMetin");
    metinKutusu.value = mesajMetniOlustur(musteri, sepet, tip, null);
    // Başka cihazda (S22/iPhone/iPad) Mesaj Ayarları'nda yapılan son kayıt
    // varsa getir — ama bu ekranda elle yazmaya başlanmışsa metne dokunma.
    var elleDegisti = false;
    metinKutusu.addEventListener("input", function(){ elleDegisti = true; });
    MesajData.tazele(function(){
      if(!elleDegisti) metinKutusu.value = mesajMetniOlustur(musteri, sepet, tip, null);
    });

    // İŞLEM İÇİN SEÇİM (WG.090926.196): Yetkili kişi artık burada
    // seçilmiyor — Cari Kart ekranında işaretlenen kişi kullanılır.
    // Kart üzerinden gelinmediyse (seçim kaydı yoksa) ilk kayda düşülür.
    var kisiler = musteri.iletisimler || [];
    var secim = {};
    try{ secim = JSON.parse(localStorage.getItem("weiconv2_secili_iletisim")||"{}"); }catch(e){}
    var ki = (secim.yetkili!=null && kisiler[secim.yetkili]) ? secim.yetkili : 0;
    kisiAlanlariniDoldur(kisiler[ki] || {});
  }catch(e){ hataGoster("Gönderim alanı hazırlanamadı: " + e.message); }
}

function kisiAlanlariniDoldur(kisi){
  document.getElementById("gonderTelefon").value = (kisi && kisi.telefon) || "";
  document.getElementById("gonderEposta").value = (kisi && kisi.eposta) || "";
}


var TIP_ETIKET_BELGE_G = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};

function fmtG2(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}
// KURAL (23.09.2026): 1000 ve üzeri sayılarda (Türkçe binler ayracı "."
// olduğu için sayının içinde "." varsa) otomatik olarak biraz küçük
// yazılır — büyük tutarlar sütun çizgisine yapışmasın/taşmasın diye.
function sayiDivHtml(sayiStr, birim){
  var buyukMu = String(sayiStr).indexOf(".") > -1;
  return "<div class='belge-td-sayi" + (buyukMu ? " belge-td-sayi--buyuk" : "") + "'>" + sayiStr + "</div><div class='belge-td-birim'>" + birim + "</div>";
}

function belgeGorselHtmlOlustur(musteri, sepet, tip, kur, kdv, kod, kanal, orijinalTarih){
  var basit = kanal === "whatsapp"; // WhatsApp'a giden görsel: ürün tablosunda LİSTE/İSK/SIRA yok (Cari Bilgi her iki kanalda da TAM gösterilir)
  var satirlarHtml = "";
  var netEuro = 0;
  sepet.forEach(function(u, i){
    var h = CartData.hesapla(u, kur, kdv);
    netEuro += h.toplamEuro;
    var urunHucre = "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-blok kod-blok--b'><span class='kod-harf'>B</span> " + htmlEsc(u.berta||"-") + "</span> - <span class='kod-blok kod-blok--a'><span class='kod-harf'>A</span> " + htmlEsc(u.abas||"-") + "</span>" + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>";
    if(basit){
      satirlarHtml += "<tr>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--net'>" + sayiDivHtml(fmtG2(h.iskontoluFiyat), "EURO") + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--toplam'>" + sayiDivHtml(fmtG2(h.toplamEuro), "EURO") + "</td>"
        + "</tr>";
    } else {
      satirlarHtml += "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td class='belge-td-fiyat'>" + sayiDivHtml(fmtG2(u.listeFiyat||0), "EURO") + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--isk'>" + sayiDivHtml((u.iskonto||0), "%") + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--net'>" + sayiDivHtml(fmtG2(h.iskontoluFiyat), "EURO") + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--toplam'>" + sayiDivHtml(fmtG2(h.toplamEuro), "EURO") + "</td>"
        + "</tr>";
    }
  });

  // Yeni kaydedilen bir belge gönderiliyorsa "şu an" doğrudur (kayıt az
  // önce oluşturuldu). Ama Geçmişten "Gönder" ile tekrar paylaşılıyorsa,
  // orijinalTarih (kaydın kendi tarihi) gönderilir — görsel her seferinde
  // "şu an" göstermez, kaydın GERÇEK tarih/saatini gösterir.
  var tarihStr;
  if(orijinalTarih){
    tarihStr = orijinalTarih;
  } else {
    var simdi = new Date();
    var aylarKisa = ["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];
    tarihStr = simdi.getDate() + " " + aylarKisa[simdi.getMonth()] + " " + simdi.getFullYear() + " " + ("0"+simdi.getHours()).slice(-2) + ":" + ("0"+simdi.getMinutes()).slice(-2);
  }

  var vade = vadeGosterimMetni(musteri.vade);
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  // İŞLEM İÇİN SEÇİM (WG.090926.196): tabloda/mailde artık TÜM yetkililer
  // değil, Cari Kart'ta işaretlenen TEK yetkili gösterilir.
  var yetkililer = musteri.iletisimler || [];
  var yetkiliSecim = {};
  try{ yetkiliSecim = JSON.parse(localStorage.getItem("weiconv2_secili_iletisim")||"{}"); }catch(e){}
  var yki = (yetkiliSecim.yetkili!=null && yetkililer[yetkiliSecim.yetkili]) ? yetkiliSecim.yetkili : 0;
  var seciliYetkili = yetkililer[yki];
  var yetkiliBilgiHtml = seciliYetkili ? HareketTablo.yetkiliSatiriHtml(seciliYetkili.isim, seciliYetkili.telefon, seciliYetkili.eposta) : "";

  // Giden görselde dahili belge kodu (F.TEK.../SİP...) GÖSTERİLMEZ — sadece
  // belge türü + tarih. (Sistem içi görünümde — belge-onizleme.html — kod
  // hâlâ gösterilir, o ayrı bir fonksiyon/dosyadır.)
  var tabloBasligi = (TIP_ETIKET_BELGE_G[tip]||"SİPARİŞ") + " · " + tarihStr;

  // Cari Bilgi bloğu — WhatsApp'ta SADECE müşteri adı ve şehir gösterilir
  // (vade, fatura, kargo, adresler, yetkili bilgisi YOK). Mail'de hâlâ TAM
  // gösterilir. Ürün tablosunun sütun sayısı ("basit" modda LİSTE/İSK
  // olmadan) ayrı bir tercih, aynı "basit" bayrağını paylaşıyor.
  var cariBilgiHtml;
  if(basit){
    cariBilgiHtml =
      formBaslikHtml(tip)
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad belge-musteri-ad--sade'>" + htmlEsc(musteri.ad) + "</div>"
      + (musteri.sehir ? "<div class='belge-musteri-sehir'>" + htmlEsc(musteri.sehir) + "</div>" : "")
      + "</div>";
  } else {
    cariBilgiHtml =
      formBaslikHtml(tip)
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
      + ((vade||faturaTuru||kargo) ? kosulSatiriHtml(vade,faturaTuru,kargo) : "")
      + "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + (faturaAdr ? htmlEsc(faturaAdr) : "<span class='belge-adres-bos'>Girilmemiş</span>") + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>"
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>" : "")
      + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "")
      + "</div>";
  }

  return "<div class='belge-kart' style='margin:0;'>"
    + cariBilgiHtml
    + "</div>"
    + "<div class='belge-kart-ayrac'></div>"
    + "<div class='belge-kart' style='margin:0;'>"
    + "<div class='belge-belge-baslik-serit'>" + tabloBasligi + "</div>"
    + "<div class='data-table-container'><table class='belge-urun-tablo belge-urun-tablo--giden'>"
    + "<thead><tr>" + (basit
        ? "<th style='width:38%;'>ÜRÜN BİLGİSİ</th><th style='width:14%;'>AD</th><th style='width:24%;'>NET</th><th style='width:24%;'>TOPLAM</th>"
        : "<th style='width:4%;'>#</th><th style='width:28%;'>ÜRÜN BİLGİSİ</th><th style='width:7%;'>AD</th><th style='width:11%;'>LİST</th><th style='width:10%;'>İSK</th><th style='width:18%;'>NET</th><th style='width:22%;'>TOPLAM</th>") + "</tr></thead>"
    + "<tbody>" + satirlarHtml + "</tbody>"
    + "</table></div>"
    + "<div class='belge-genel-toplam-serit'>"
    + "<span class='belge-gt-etiket-deger-grup'>"
    + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
    + "<span class='belge-gt-deger'>" + fmtG2(netEuro) + " EURO</span>"
    + "</span></div>"
    + "</div>";
}

function belgeGorseliniOlustur(kanal, callback){
  try{
    if(typeof html2canvas === "undefined"){ callback(null); return; }
    var g = gonderBaglam;
    var alan = document.getElementById("belgeGorselAlani");
    var kayitliKod = (sonKaydedilenBelge&&sonKaydedilenBelge.kayit) ? sonKaydedilenBelge.kayit.kod : "";
    var kayitliTarih = (sonKaydedilenBelge&&sonKaydedilenBelge.kayit) ? sonKaydedilenBelge.kayit.tarih : "";
    alan.innerHTML = belgeGorselHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, kayitliKod, kanal, kayitliTarih);
    kosulSatirlariniSigdir(alan);
    setTimeout(function(){
      html2canvas(alan, {backgroundColor:"#ffffff", scale:2}).then(function(canvas){
        callback(canvas);
      }).catch(function(){ callback(null); });
    }, 60);
  }catch(e){ callback(null); }
}

// "Tabloyu Resim Olarak Kopyala" — devam eden bir mail/WhatsApp sohbetine
// yapıştırılabilsin diye görseli doğrudan SİSTEM PANOSUNA kopyalar (yeni bir
// paylaşım/gönderim açmaz, sadece kopyalar).
function tabloyuPanoyaKopyala(kanal, btnEl){
  var eskiMetin = btnEl.textContent;
  btnEl.textContent = "⏳ Hazırlanıyor...";
  btnEl.disabled = true;
  function eskiHaleDon(){ btnEl.textContent = eskiMetin; btnEl.disabled = false; }
  belgeGorseliniOlustur(kanal, function(canvas){
    if(!canvas){ eskiHaleDon(); alert("Görsel oluşturulamadı."); return; }
    if(!navigator.clipboard || typeof window.ClipboardItem === "undefined"){
      eskiHaleDon();
      alert("Bu tarayıcı doğrudan panoya kopyalamayı desteklemiyor. Bunun yerine aşağıdaki Gönder butonuyla paylaşabilirsin.");
      return;
    }
    canvas.toBlob(function(blob){
      if(!blob){ eskiHaleDon(); alert("Görsel oluşturulamadı."); return; }
      navigator.clipboard.write([new ClipboardItem({"image/png": blob})]).then(function(){
        btnEl.textContent = "✓ Kopyalandı! Mail/Sohbete yapıştırabilirsin";
        // KÖK NEDEN DÜZELTMESİ (16.09.2026): buton "Kopyala VE Kaydet" diyordu
        // ama sadece kopyalıyordu — sepet/müşteri seçimi hiç temizlenmiyordu,
        // bu yüzden az sonra Ana Sayfa/Menü'ye basınca "Yarım Kalan İşlem"
        // uyarısı çıkıyordu. Artık kopyalama bittiğinde işlem de bitmiş
        // sayılıyor — aynı "gönderiliyor" ekranına geçiliyor.
        setTimeout(function(){ basariEkraninaGit("panoya"); }, 900);
      }).catch(function(err){
        eskiHaleDon();
        alert("Kopyalanamadı: " + (err && err.message ? err.message : "izin verilmedi"));
      });
    }, "image/png");
  });
}

function mailOnizlemeAc(){
  try{
    var g = gonderBaglam;
    var TIP_ETIKET5 = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};
    var konu = "*** " + TIP_ETIKET5[g.tip] + " *** " + g.musteri.ad;
    document.getElementById("mailOnizlemeKonu").value = konu;
    document.getElementById("mailOnizlemeMetin").textContent = document.getElementById("gonderMetin").value;
    document.getElementById("mailOnizlemeTablo").innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, null);
    document.getElementById("mailOnizlemeOverlay").hidden = false;
    kosulSatirlariniSigdir(document.getElementById("mailOnizlemeTablo"));
  }catch(e){ hataGoster("Mail önizleme açılamadı: " + e.message); }
}

function whatsappOnizlemeAc(){
  try{
    var g = gonderBaglam;
    document.getElementById("whatsappOnizlemeAlici").value = document.getElementById("gonderTelefon").value.trim() || "(telefon girilmemiş)";
    document.getElementById("whatsappOnizlemeMetin").value = mesajMetniOlustur(g.musteri, g.sepet, g.tip, "whatsapp");
    document.getElementById("whatsappOnizlemeTablo").innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, "whatsapp");
    document.getElementById("whatsappOnizlemeOverlay").hidden = false;
    kosulSatirlariniSigdir(document.getElementById("whatsappOnizlemeTablo"));
  }catch(e){ hataGoster("WhatsApp önizleme açılamadı: " + e.message); }
}

// "Sadece Tablo" önizlemesi (14.09.2026) — cari bilgi/mesaj metni OLMADAN,
// SADECE ürün tablosu (adet/liste/isk/net/toplam) + genel toplam. Devam eden
// bir mail zincirine yapıştırmak için — gönderim değil, salt kopyalama.
function tabloSadeceOnizlemeAc(){
  try{
    var g = gonderBaglam;
    var hesapla = function(u){ return CartData.hesapla(u, g.kur, g.kdv); };
    var toplam = 0;
    (g.sepet||[]).forEach(function(u){ var h = hesapla(u); if(h && h.toplamEuro!=null) toplam += h.toplamEuro; });
    document.getElementById("tabloSadeceAlan").innerHTML = HareketTablo.grupHtml({
      urunler: g.sepet, hesapla: hesapla, genelToplam: toplam, kur: g.kur
    });
    document.getElementById("tabloSadeceOverlay").hidden = false;
  }catch(e){ hataGoster("Tablo önizleme açılamadı: " + e.message); }
}
function tabloSadeceKopyala(btnEl){
  var eskiMetin = btnEl.textContent;
  btnEl.textContent = "⏳ Hazırlanıyor...";
  btnEl.disabled = true;
  function eskiHaleDon(){ btnEl.textContent = eskiMetin; btnEl.disabled = false; }
  if(typeof html2canvas === "undefined"){ eskiHaleDon(); alert("Görsel oluşturulamadı."); return; }
  html2canvas(document.getElementById("tabloSadeceAlan"), {backgroundColor:"#ffffff", scale:2}).then(function(canvas){
    canvas.toBlob(function(blob){
      if(!blob || !navigator.clipboard || typeof window.ClipboardItem === "undefined"){
        eskiHaleDon(); alert("Bu tarayıcı doğrudan panoya kopyalamayı desteklemiyor.");
        return;
      }
      navigator.clipboard.write([new ClipboardItem({"image/png": blob})]).then(function(){
        btnEl.textContent = "✓ Kopyalandı! Mail/Sohbete yapıştırabilirsin";
        setTimeout(eskiHaleDon, 2200);
      }).catch(function(err){
        eskiHaleDon();
        alert("Kopyalanamadı: " + (err && err.message ? err.message : "izin verilmedi"));
      });
    }, "image/png");
  }).catch(function(){ eskiHaleDon(); alert("Görsel oluşturulamadı."); });
}

function gonderimKanaliniKaydet(kanal){
  try{
    if(!sonKaydedilenBelge || !sonKaydedilenBelge.kayit || !gonderBaglam) return;
    ReportsData.kaydiAlanGuncelle(gonderBaglam.tip, sonKaydedilenBelge.kayit.ts, {kanal: kanal}, function(basarili, err){
      if(!basarili) console.error("Gönderim kanalı kaydedilemedi:", err);
    });
  }catch(e){ console.error("Gönderim kanalı kaydedilemedi:", e); }
}

function gonderTiklandi(kanal, ozelKonu){
  try{
    gonderimKanaliniKaydet(kanal);
    // Gönderim tetiklenince artık HİÇBİR ŞEY silinmiyor — mail/WhatsApp
    // uygulaması açılırken veya sonrasında kullanıcı geri gelip
    // düzeltme yapmak isteyebilir. Sepet/müşteri sadece "✓ Gönderimi
    // Bitir"e basılınca veya Ana Sayfa/Menü'ye gidilince temizlenir
    // (bkz. İletişim - Gönder popup'ındaki "Kaydet çık" ve yarim-kalan-uyari.js).
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
        // Madde 1 (22.09.2026): mail'e konu (title) zaten ayrı alanla
        // gidiyor — gövdeye (text) bir daha eklenmiyordu ama burada ikinci
        // kez ekleniyordu, mail gövdesinde konu satırı tekrar çıkıyordu.
        // Artık gövde SADECE metin, kanal ne olursa olsun.
        // Madde 7: mail gövdesindeki \n'leri Mail.app'in paragraf aralığı
        // eklemesini önlemek için U+2028 ile değiştiriyoruz (WhatsApp'ta
        // gerek yok, orada normal \n doğru görünüyor).
        var paylasimMetni = kanal === "whatsapp" ? metin : metin.replace(/\n/g, "\u2028");

        if(navigator.canShare && navigator.canShare({files:[dosya]})){
          navigator.share({files:[dosya], title:konuMetni, text:paylasimMetni}).then(function(){
            basariEkraninaGit(kanal);
          }).catch(function(err){
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

function basariEkraninaGit(kanal){
  try{
    localStorage.setItem("weiconv2_gonderim_kanali", JSON.stringify({
      kanal: kanal,
      musteriAd: (gonderBaglam && gonderBaglam.musteri && gonderBaglam.musteri.ad) || ""
    }));
  }catch(e){}
  window.location.href = "gonderim-basarili.html";
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
    // Madde 7 (22.09.2026): iOS/iPadOS Mail, mailto: gövdesindeki her \n'i
    // ayrı bir paragraf gibi işleyip aralarına fazladan boşluk ekliyor.
    // Unicode Line Separator (U+2028) bunu önlüyor — aynı görünür satır
    // sonu, paragraf boşluğu olmadan.
    var govde = metin.replace(/\n/g, "\u2028");
    var url2 = "mailto:"+encodeURIComponent(eposta)+"?subject="+encodeURIComponent(konu)+"&body="+encodeURIComponent(govde);
    window.open(url2, "_blank");
  }
  // Gönderim tetiklendikten sonra artık aynı önizleme/paylaşım ekranları
  // tekrar tekrar açık kalmıyor — sade bir "gönderiliyor" ekranına geçiliyor
  // (14.09.2026, Abdullah'ın onayladığı tasarım).
  basariEkraninaGit(kanal);
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  // Menü butonu artık yarim-kalan-uyari.js tarafından yönetiliyor (sepette
  // ürün + seçili müşteri varsa uyarıp sonra temizleyip gidiyor).

  // cart.html'in az önce yazdığı kayıt bağlamını oku — yoksa (örn. sayfaya
  // doğrudan URL ile girildiyse) Sepet'e geri gönder.
  var kayitliBaglam = null;
  try{ kayitliBaglam = JSON.parse(localStorage.getItem("weiconv2_son_kaydedilen_belge")||"null"); }catch(e){}
  if(!kayitliBaglam || !kayitliBaglam.musteri || !kayitliBaglam.sepet){
    window.location.href = "cart.html";
    return;
  }
  sonKaydedilenBelge = {kayit: kayitliBaglam.kayit, musteri: kayitliBaglam.musteri};

  // GÜNCEL MÜŞTERİ VERİSİ (WG.090926.196): sipariş kaydedildikten SONRA
  // Cari Kart'a eklenen/değiştirilen yetkili kişi, fatura/teslimat adresi
  // vb. bilgiler burada eski (kayıt anındaki) görünmesin diye, müşteri
  // kaydı ID'siyle Firebase'den bir kez tazelenir. Tek seferlik — sonradan
  // kullanıcının MESAJ kutusuna yazdıklarını ezmez.
  var musteriTazelendiMi = false;
  function musteriyleDevamEt(musteri){
    sonKaydedilenBelge.musteri = musteri;
    adresleriBelirle(musteri);
    if(kayitliBaglam.revizeMi){
      document.getElementById("gonderBaslikYazi").textContent = "🔄 Aynı ürünlerle mevcut kayıt bulundu — REVİZE olarak güncellendi.";
    }
    gonderKutusunuGoster(musteri, kayitliBaglam.sepet, kayitliBaglam.tip, kayitliBaglam.kur, kayitliBaglam.kdv);
  }
  if(kayitliBaglam.musteri.id && typeof CustomerData !== "undefined"){
    CustomerData.listeDegistiginde(function(){
      if(musteriTazelendiMi) return;
      var taze = CustomerData.musteriIdIleBul(kayitliBaglam.musteri.id);
      if(!taze) return;
      musteriTazelendiMi = true;
      kayitliBaglam.musteri = taze;
      musteriyleDevamEt(taze);
    });
  }
  // Taze veri gelene kadar (veya hiç gelmezse) eldeki bilgiyle göster —
  // taze veri gelince yukarıdaki dinleyici tekrar çizer.
  musteriyleDevamEt(kayitliBaglam.musteri);

  // Form artık HER ZAMAN açık — ayrı bir "Formu Görüntüle/Gizle" adımı,
  // MAIL GÖNDER/WHATSAPP GÖNDER kutucukları ve "Ana Sayfa'ya Dön" butonu
  // kaldırıldı (14.09.2026, Abdullah'ın onayladığı sade tasarım). Tüm
  // gönderme/çıkış eylemleri artık tek yerde: "📧💬 İletişim - Gönder" popup'ı.
  (function(){
    var g = gonderBaglam;
    document.getElementById("tamOnizlemeAlani").innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv);
    kosulSatirlariniSigdir(document.getElementById("tamOnizlemeAlani"));
  })();

  document.getElementById("mailOnizlemeVazgecBtn").onclick = function(){ document.getElementById("mailOnizlemeOverlay").hidden = true; };
  document.getElementById("mailTabloKopyalaBtn").onclick = function(){ tabloyuPanoyaKopyala("mail", this); };
  document.getElementById("mailOnizlemeGonderBtn").onclick = function(){
    var konu = document.getElementById("mailOnizlemeKonu").value.trim() || "WEICON";
    document.getElementById("mailOnizlemeOverlay").hidden = true;
    gonderTiklandi("mail", konu);
  };
  document.getElementById("mailOnizlemeOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });
  document.getElementById("whatsappOnizlemeVazgecBtn").onclick = function(){ document.getElementById("whatsappOnizlemeOverlay").hidden = true; };
  document.getElementById("whatsappTabloKopyalaBtn").onclick = function(){ tabloyuPanoyaKopyala("whatsapp", this); };
  document.getElementById("whatsappOnizlemeGonderBtn").onclick = function(){
    document.getElementById("gonderMetin").value = document.getElementById("whatsappOnizlemeMetin").value;
    document.getElementById("whatsappOnizlemeOverlay").hidden = true;
    gonderTiklandi("whatsapp");
  };
  document.getElementById("whatsappOnizlemeOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });
  document.getElementById("btnGeriDuzelt").onclick = function(){
    window.location.href = "cart.html";
  };

  function anaSayfayaDonVeTemizle(){
    try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_sepet_kur_override"); }catch(e){}
    try{ localStorage.removeItem("weicon_secili_musteri"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_secili_iletisim"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_onceden_secilen_tip"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_son_kaydedilen_belge"); }catch(e){}
    window.location.href = "home.html";
  }

  // Formun ÜSTÜNDEKİ 3 buton — Mail / WhatsApp / Tablo (14.09.2026,
  // Abdullah'ın onayladığı akış). Ayrı bir "İletişim - Gönder" popup'ı
  // artık yok — bu 3 buton doğrudan formun üstünde duruyor.
  document.getElementById("btnUstMail").onclick = mailOnizlemeAc;
  document.getElementById("btnUstWhatsapp").onclick = whatsappOnizlemeAc;
  document.getElementById("btnUstTablo").onclick = tabloSadeceOnizlemeAc;

  document.getElementById("tabloSadeceKopyalaBtn").onclick = function(){ tabloSadeceKopyala(this); };
  document.getElementById("tabloSadeceAnaSayfaBtn").onclick = anaSayfayaDonVeTemizle;
  document.getElementById("tabloSadeceKapatBtn").onclick = function(){ document.getElementById("tabloSadeceOverlay").hidden = true; };
  document.getElementById("tabloSadeceOverlay").addEventListener("click", function(ev){
    if(ev.target === this) this.hidden = true;
  });
});
