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
  if(musteri.faturaAdresleri && musteri.faturaAdresleri.length){
    seciliAdresler.faturaAdresi = musteri.faturaAdresleri[0];
  } else if(musteri.acikAdres && musteri.acikAdres.trim()){
    // Geriye dönük kural: ayrı bir fatura adresi hiç girilmemişse, müşteri
    // eklenirken girilen Açık Adres fatura adresi olarak kullanılır — eski
    // müşteri kayıtları için de "Girilmemiş" görünmesin diye.
    seciliAdresler.faturaAdresi = {etiket:"Fatura Adresi", adres: musteri.acikAdres.trim()};
  }
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
      else govde += tekUrunMu ? "İstediğiniz ürün için fiyat bilgisi ektedir.\n" : "İstediğiniz ürünler için fiyat bilgileri ektedir.\n";
    } else {
      if(tip === "siparis") govde += "Bilgilerini paylaştığım Firma için SİPARİŞİ\nişleme almanızı rica ederim.\n";
      else if(tip === "proforma") govde += "Bilgilerini paylaştığım Firma için PROFORMAYI göndermenizi rica ederim.\n";
      else if(tip === "numune") govde += "Bilgilerini paylaştığım Firma için NUMUNEYİ göndermenizi rica ederim.\n";
      else govde += "Bilgilerini paylaştığım Firma için FİYAT TEKLİFİNİ göndermenizi rica ederim.\n";
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

function tamOnizlemeHtmlOlustur(musteri, sepet, tip, kur, kdv, kanal){
  var basit = kanal === "whatsapp";
  var vade = musteri.vade || "";
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  var yetkililer = musteri.iletisimler || [];
  var yetkiliBilgiHtml = yetkililer.map(function(k){ return HareketTablo.yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");
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
      + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + HareketTablo.kosulKutusuHtml("📅","VADE",vade) + HareketTablo.kosulKutusuHtml("📄","FATURA",faturaTuru) + HareketTablo.kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
      + "<div class='belge-adres-blok'><b class='belge-adres-etiket-fatura'>🧾 FATURA ADRESİ</b>" + (faturaAdr ? htmlEsc(faturaAdr) : "<span class='belge-adres-bos'>Girilmemiş</span>") + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>"
      + (teslimatAdr ? "<div class='belge-adres-blok-teslimat'><b class='belge-adres-etiket-teslimat'>🚚 TESLİMAT ADRESİ</b>" + htmlEsc(teslimatAdr) + (musteri.sehir?", "+htmlEsc(musteri.sehir):"") + "</div>" : "")
      + (yetkiliBilgiHtml ? "<div class='belge-yetkili-blok'><b class='belge-adres-etiket-yetkili'>👤 YETKİLİ BİLGİSİ</b>" + yetkiliBilgiHtml + "</div>" : "");
  }

  var html = "<div class='belge-kart'><div class='belge-musteri-baslik belge-musteri-baslik--logolu'><span>CARİ BİLGİ</span><span class='belge-logo-mini'>WEICON</span></div>"
    + "<div class='belge-musteri-govde'>"
    + musteriBlokHtml
    + "</div></div><div class='belge-kart-ayrac'></div><div class='belge-kart'>";

  html += HareketTablo.grupHtml({
    etiket: (TIP_ETIKET_ROZET[tip]||""),
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

function belgeGorselHtmlOlustur(musteri, sepet, tip, kur, kdv, kod, kanal, orijinalTarih){
  var basit = kanal === "whatsapp"; // WhatsApp'a giden görsel: ürün tablosunda LİSTE/İSK/SIRA yok (Cari Bilgi her iki kanalda da TAM gösterilir)
  var satirlarHtml = "";
  var netEuro = 0;
  sepet.forEach(function(u, i){
    var h = CartData.hesapla(u, kur, kdv);
    netEuro += h.toplamEuro;
    var urunHucre = "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kod-harf kod-harf--b'>B</span> " + htmlEsc(u.berta||"-") + " - <span class='kod-harf kod-harf--a'>A</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>";
    if(basit){
      satirlarHtml += "<tr>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--net'><div class='belge-td-sayi'>" + fmtG2(h.iskontoluFiyat) + "</div><div class='belge-td-birim'>EURO</div></td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--toplam'><div class='belge-td-sayi'>" + fmtG2(h.toplamEuro) + "</div><div class='belge-td-birim'>EURO</div></td>"
        + "</tr>";
    } else {
      satirlarHtml += "<tr>"
        + "<td class='belge-td-sira'>" + (i+1) + "</td>"
        + urunHucre
        + "<td>" + (u.adet||0) + "</td>"
        + "<td class='belge-td-fiyat'><div class='belge-td-sayi'>" + fmtG2(u.listeFiyat||0) + "</div><div class='belge-td-birim'>EURO</div></td>"
        + "<td><span class='rozet-isk'>%" + (u.iskonto||0) + "</span></td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--net'><div class='belge-td-sayi'>" + fmtG2(h.iskontoluFiyat) + "</div><div class='belge-td-birim'>EURO</div></td>"
        + "<td class='belge-td-fiyat belge-td-fiyat--toplam'><div class='belge-td-sayi'>" + fmtG2(h.toplamEuro) + "</div><div class='belge-td-birim'>EURO</div></td>"
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

  var vade = musteri.vade || "";
  var faturaTuru = musteri.fatura || "";
  var kargo = musteri.kargo || "";
  var faturaAdr = seciliAdresler.faturaAdresi ? (seciliAdresler.faturaAdresi.adres||"") : "";
  var teslimatAdr = seciliAdresler.teslimatAdresi ? (seciliAdresler.teslimatAdresi.adres||"") : "";
  var yetkililer = musteri.iletisimler || [];
  var yetkiliBilgiHtml = yetkililer.map(function(k){ return HareketTablo.yetkiliSatiriHtml(k.isim, k.telefon, k.eposta); }).join("");

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
      "<div class='belge-musteri-baslik belge-musteri-baslik--logolu'><span>CARİ BİLGİ</span><span class='belge-logo-mini'>WEICON</span></div>"
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad belge-musteri-ad--sade'>" + htmlEsc(musteri.ad) + "</div>"
      + (musteri.sehir ? "<div class='belge-musteri-sehir'>" + htmlEsc(musteri.sehir) + "</div>" : "")
      + "</div>";
  } else {
    cariBilgiHtml =
      "<div class='belge-musteri-baslik belge-musteri-baslik--logolu'><span>CARİ BİLGİ</span><span class='belge-logo-mini'>WEICON</span></div>"
      + "<div class='belge-musteri-govde'>"
      + "<div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
      + ((vade||faturaTuru||kargo) ? "<div class='belge-kosul-grid'>" + HareketTablo.kosulKutusuHtml("📅","VADE",vade) + HareketTablo.kosulKutusuHtml("📄","FATURA",faturaTuru) + HareketTablo.kosulKutusuHtml("🚚","KARGO",kargo) + "</div>" : "")
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
        ? "<th style='width:48%;'>ÜRÜN BİLGİSİ</th><th style='width:14%;'>AD</th><th style='width:19%;'>NET</th><th style='width:19%;'>TOPLAM</th>"
        : "<th style='width:4%;'>#</th><th style='width:36%;'>ÜRÜN BİLGİSİ</th><th style='width:7%;'>AD</th><th style='width:13%;'>LİST</th><th style='width:12%;'>İSK</th><th style='width:14%;'>NET</th><th style='width:14%;'>TOPLAM</th>") + "</tr></thead>"
    + "<tbody>" + satirlarHtml + "</tbody>"
    + "</table></div>"
    + "<div class='belge-genel-toplam-serit'>"
    + "<span class='belge-gt-etiket'>GENEL TOPLAM</span>"
    + "<span class='belge-gt-deger'>" + fmtG2(netEuro) + " €</span></div>"
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
    setTimeout(function(){
      html2canvas(alan, {backgroundColor:"#ffffff", scale:1.4}).then(function(canvas){
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
        setTimeout(eskiHaleDon, 2200);
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
    document.getElementById("mailOnizlemeAlici").value = document.getElementById("gonderEposta").value.trim();
    document.getElementById("mailOnizlemeMetin").textContent = document.getElementById("gonderMetin").value;
    document.getElementById("mailOnizlemeTablo").innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, null);
    document.getElementById("mailOnizlemeOverlay").hidden = false;
  }catch(e){ hataGoster("Mail önizleme açılamadı: " + e.message); }
}

function whatsappOnizlemeAc(){
  try{
    var g = gonderBaglam;
    document.getElementById("whatsappOnizlemeAlici").value = document.getElementById("gonderTelefon").value.trim() || "(telefon girilmemiş)";
    document.getElementById("whatsappOnizlemeMetin").value = mesajMetniOlustur(g.musteri, g.sepet, g.tip, "whatsapp");
    document.getElementById("whatsappOnizlemeTablo").innerHTML = tamOnizlemeHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, "whatsapp");
    document.getElementById("whatsappOnizlemeOverlay").hidden = false;
  }catch(e){ hataGoster("WhatsApp önizleme açılamadı: " + e.message); }
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
    // (bkz. btnGonderBitir ve yarim-kalan-uyari.js).
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
  adresleriBelirle(kayitliBaglam.musteri);
  if(kayitliBaglam.revizeMi){
    document.getElementById("gonderBaslikYazi").textContent = "🔄 Aynı ürünlerle mevcut kayıt bulundu — REVİZE olarak güncellendi.";
  }
  gonderKutusunuGoster(kayitliBaglam.musteri, kayitliBaglam.sepet, kayitliBaglam.tip, kayitliBaglam.kur, kayitliBaglam.kdv);

  document.getElementById("btnWhatsapp").onclick = function(){ whatsappOnizlemeAc(); };
  document.getElementById("btnEposta").onclick = function(){ mailOnizlemeAc(); };
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
