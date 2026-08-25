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

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
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
    adresSecimleriniDoldur(musteri);

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

    var adresler = seciliAdresleriTopla(musteri);
    SendData.kaydet(secilenTip, musteri, sepet, kur, kdv, adresler, function(basarili, sonuc, revizeMi){
      if(basarili){
        sonKaydedilenBelge = {kayit: sonuc, musteri: musteri};
        try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
        try{ localStorage.removeItem("weicon_secili_musteri"); }catch(e){}
        if(revizeMi){
          document.getElementById("gonderBaslikYazi").textContent = "🔄 Aynı ürünlerle mevcut kayıt bulundu — REVİZE olarak güncellendi.";
        }
        // İlerletme akışıysa (Numune→Teklif gibi), eski aşamanın kaydını sil —
        // artık iki ayrı kayıt değil, tek kayıt yeni türe dönüşmüş olsun.
        var kaynak = ilerletKaynagiOku();
        if(kaynak){
          SendData.kaynakSil(kaynak.tip, kaynak.ts, function(){});
          localStorage.removeItem("weiconv2_ilerlet_kaynak");
        }
        gonderKutusunuGoster(musteri, sepet, secilenTip, kur, kdv);
      } else {
        btn.disabled = false;
        btn.textContent = "✓ Kaydet";
        hataGoster("Kaydetme başarısız: " + (sonuc && sonuc.message ? sonuc.message : "bilinmeyen hata"));
      }
    });
  }catch(e){ hataGoster("Kaydet işlemi başarısız: " + e.message); }
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

// Eski uygulamanın buildEmailBody()/buildWhatsAppBody() ile AYNI mantık:
// kısa bir "kapak notu" — ürün detayları artık METİNDE değil, PAYLAŞILAN
// GÖRSELDE (PNG belge) olduğu için mesaj metni kısa tutuluyor.
function mesajMetniOlustur(musteri, sepet, tip, kanal){
  var sablon = kanal ? sablonOku(kanal) : "";
  if(sablon){
    var urunKelimesi = sepet.length===1 ? "ürün" : "ürünler";
    var TIP_ETIKET2 = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
    return "Merhaba,\n" + sablonUygula(sablon, urunKelimesi, TIP_ETIKET2[tip], musteri.ad) + "\n";
  }
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
  return govde;
}

var gonderBaglam = null;
var sonKaydedilenBelge = null; // {kayit, musteri} — görsel oluşturmak için

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

    document.getElementById("gonderKutu").hidden = false;
    document.getElementById("btnKaydet").hidden = true;
    document.getElementById("tipSecim").querySelectorAll(".tip-btn").forEach(function(b){ b.disabled = true; });
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

// ---- Belgeyi PNG görsele çevirme (eski uygulamanın siparisResmiCanvasOlustur
// mantığıyla aynı: belge-style.css sınıflarını kullanan bir HTML üretir,
// html2canvas ile PNG'ye çevirir). ----
var TIP_ETIKET_BELGE_G = {numune:"NUMUNE", teklif:"FİYAT TEKLİFİ", proforma:"PROFORMA FATURA", siparis:"SİPARİŞ"};

function fmtG2(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function belgeGorselHtmlOlustur(musteri, sepet, tip, kur, kdv, kod){
  var satirlarHtml = "";
  var netEuro = 0;
  sepet.forEach(function(u, i){
    var h = CartData.hesapla(u, kur, kdv);
    netEuro += h.toplamEuro;
    satirlarHtml += "<tr>"
      + "<td class='belge-td-sira'>" + (i+1) + "</td>"
      + "<td class='belge-td-urun'><div class='belge-td-urun-kod'><span class='kb'>Berta:</span> " + htmlEsc(u.berta||"-") + " <span class='ka'>Abas:</span> " + htmlEsc(u.abas||"-") + "</div><div class='belge-td-urun-ad'>" + htmlEsc(u.ad) + "</div></td>"
      + "<td>" + (u.adet||0) + "</td>"
      + "<td>" + fmtG2(u.listeFiyat||0) + " €</td>"
      + "<td>%" + (u.iskonto||0) + "</td>"
      + "<td>" + fmtG2(h.iskontoluFiyat) + " €</td>"
      + "<td class='belge-td-toplam'>" + fmtG2(h.toplamEuro) + " €</td>"
      + "</tr>";
  });

  var simdi = new Date();
  var gunler = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
  var aylar = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
  var tarihStr = simdi.getDate() + " " + aylar[simdi.getMonth()] + " " + simdi.getFullYear() + " " + ("0"+simdi.getHours()).slice(-2) + ":" + ("0"+simdi.getMinutes()).slice(-2);

  return "<div class='belge-kutu' style='margin:0;'>"
    + "<div class='belge-ust-baslik'>"
    + "<div class='belge-logo-satir'><span class='belge-logo-mini'>WEICON</span><span class='belge-tur-baslik'>" + (TIP_ETIKET_BELGE_G[tip]||"SİPARİŞ") + " FORMU</span></div>"
    + "<table class='belge-tarih-tablo'><tr><td class='bt-etiket'>TARİH</td><td class='bt-deger'>" + tarihStr + "</td></tr></table>"
    + "</div>"
    + "<div class='belge-musteri-baslik'>MÜŞTERİ BİLGİLERİ</div>"
    + "<div class='belge-musteri-govde'><div class='belge-musteri-ad'>" + htmlEsc(musteri.ad) + "</div>"
    + (musteri.sehir ? "<div style='font-size:12px;color:#556170;'>" + htmlEsc(musteri.sehir) + "</div>" : "")
    + "</div>"
    + "<div class='belge-belge-baslik-serit'>" + (TIP_ETIKET_BELGE_G[tip]||"SİPARİŞ") + (kod ? " · " + kod : "") + "</div>"
    + "<div class='data-table-container'><table class='belge-urun-tablo'>"
    + "<thead><tr><th style='width:6%;'>SIRA</th><th style='width:25%;'>ÜRÜN BİLGİSİ</th><th>ADET</th><th>LİSTE</th><th>İSK</th><th>NET</th><th>TOPLAM</th></tr></thead>"
    + "<tbody>" + satirlarHtml + "</tbody>"
    + "</table></div>"
    + "<div class='belge-genel-toplam-serit'><span class='belge-gt-etiket'>GENEL TOPLAM</span><span class='belge-gt-ayrac'></span><span class='belge-gt-deger'>" + fmtG2(netEuro) + " €</span></div>"
    + "</div>";
}

function belgeGorseliniOlustur(callback){
  try{
    if(typeof html2canvas === "undefined"){ callback(null); return; }
    var g = gonderBaglam;
    var alan = document.getElementById("belgeGorselAlani");
    alan.innerHTML = belgeGorselHtmlOlustur(g.musteri, g.sepet, g.tip, g.kur, g.kdv, (sonKaydedilenBelge&&sonKaydedilenBelge.kayit)?sonKaydedilenBelge.kayit.kod:"");
    setTimeout(function(){
      html2canvas(alan, {backgroundColor:"#ffffff", scale:2}).then(function(canvas){
        callback(canvas);
      }).catch(function(){ callback(null); });
    }, 60);
  }catch(e){ callback(null); }
}

function gonderTiklandi(kanal){
  try{
    var metin = document.getElementById("gonderMetin").value;
    var g = gonderBaglam;
    var toplamEuro = CartData.genelToplam(g.kur, g.kdv).toplamEuro;
    var TIP_ETIKET4 = {numune:"NUMUNE", teklif:"TEKLİF", proforma:"PROFORMA", siparis:"SİPARİŞ"};
    var ozetMesaj = (kanal==="whatsapp" ? "💬 WhatsApp" : "📧 Mail") + " ile gönderilecek:\n\n"
      + "Müşteri: " + g.musteri.ad + "\n"
      + "Tür: " + TIP_ETIKET4[g.tip] + "\n"
      + g.sepet.length + " kalem, " + CartData.fmt(toplamEuro) + " € toplam\n\n"
      + "Devam edilsin mi?";
    if(!confirm(ozetMesaj)) return;

    var dosyaAdi = TIP_ETIKET4[g.tip] + "_" + g.musteri.ad.replace(/[^a-zA-Z0-9]+/g,"_") + ".png";
    var konuMetni = "*** " + TIP_ETIKET4[g.tip] + " *** " + g.musteri.ad;

    belgeGorseliniOlustur(function(canvas){
      if(!canvas){
        // Görsel oluşturulamadıysa, en son çare: eski metin-tabanlı yöntem.
        metinTabanliGonder(kanal);
        return;
      }
      canvas.toBlob(function(blob){
        if(!blob){ metinTabanliGonder(kanal); return; }
        var dosya = new File([blob], dosyaAdi, {type:"image/png"});
        var paylasimMetni = kanal==="whatsapp" ? metin : (konuMetni + "\n\n" + metin);

        if(navigator.canShare && navigator.canShare({files:[dosya]})){
          navigator.share({files:[dosya], title:konuMetni, text:paylasimMetni}).catch(function(err){
            if(err && err.name!=="AbortError") hataGoster("Paylaşım penceresi kapatıldı.");
          });
        } else {
          // Native paylaşım desteklenmiyor: PNG'yi indir + metin linkini aç.
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

function metinTabanliGonder(kanal){
  var metin = document.getElementById("gonderMetin").value;
  if(kanal === "whatsapp"){
    var telefon = document.getElementById("gonderTelefon").value.replace(/[^0-9]/g,"");
    var url = telefon ? ("https://wa.me/"+telefon+"?text="+encodeURIComponent(metin)) : ("https://api.whatsapp.com/send?text="+encodeURIComponent(metin));
    window.open(url, "_blank");
  } else {
    var eposta = document.getElementById("gonderEposta").value.trim();
    var url2 = "mailto:"+encodeURIComponent(eposta)+"?subject="+encodeURIComponent("WEICON")+"&body="+encodeURIComponent(metin);
    window.open(url2, "_blank");
  }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

function adresSecimleriniDoldur(musteri){
  try{
    var faturaListe = musteri.faturaAdresleri || [];
    var teslimatListe = musteri.teslimatAdresleri || [];
    var grid = document.getElementById("adresSecimGrid");

    if(faturaListe.length === 0 && teslimatListe.length === 0){
      grid.hidden = true;
      return;
    }
    grid.hidden = false;

    var faturaSel = document.getElementById("faturaAdresSecim");
    faturaSel.innerHTML = "<option value=''>Seçilmedi</option>" + faturaListe.map(function(a, i){
      return "<option value='" + i + "'>" + htmlEsc(a.etiket) + "</option>";
    }).join("");

    var teslimatSel = document.getElementById("teslimatAdresSecim");
    teslimatSel.innerHTML = "<option value=''>Seçilmedi</option>" + teslimatListe.map(function(a, i){
      return "<option value='" + i + "'>" + htmlEsc(a.etiket) + "</option>";
    }).join("");

    // Tek adres varsa otomatik seçili gelsin (kullanıcı her seferinde seçmek zorunda kalmasın)
    if(faturaListe.length === 1) faturaSel.value = "0";
    if(teslimatListe.length === 1) teslimatSel.value = "0";
  }catch(e){ hataGoster("Adres seçimleri doldurulamadı: " + e.message); }
}

function seciliAdresleriTopla(musteri){
  var faturaIdx = document.getElementById("faturaAdresSecim").value;
  var teslimatIdx = document.getElementById("teslimatAdresSecim").value;
  var sonuc = {};
  if(faturaIdx !== "" && musteri.faturaAdresleri) sonuc.faturaAdresi = musteri.faturaAdresleri[parseInt(faturaIdx,10)];
  if(teslimatIdx !== "" && musteri.teslimatAdresleri) sonuc.teslimatAdresi = musteri.teslimatAdresleri[parseInt(teslimatIdx,10)];
  return sonuc;
}

function ilerletKaynagiOku(){
  try{
    var v = localStorage.getItem("weiconv2_ilerlet_kaynak");
    return v ? JSON.parse(v) : null;
  }catch(e){ return null; }
}

function ilerletKaynagiVarsaSekmeAyarla(){
  var kaynak = ilerletKaynagiOku();
  if(!kaynak || !kaynak.sonrakiAsama) return;
  secilenTip = kaynak.sonrakiAsama;
  document.querySelectorAll(".tip-btn").forEach(function(b){
    b.classList.toggle("tip-btn--secili", b.getAttribute("data-tip")===secilenTip);
  });
  var uyari = document.createElement("div");
  uyari.className = "ilerlet-bilgi-kutu";
  uyari.textContent = "▶️ İlerletiliyor — kayıt tamamlanınca önceki aşamanın belgesi otomatik silinecek.";
  document.getElementById("tipSecim").insertAdjacentElement("beforebegin", uyari);
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  tipSecimBagla();
  ilerletKaynagiVarsaSekmeAyarla();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnKaydet").onclick = kaydetTiklandi;
  document.getElementById("btnWhatsapp").onclick = function(){ gonderTiklandi("whatsapp"); };
  document.getElementById("btnEposta").onclick = function(){ gonderTiklandi("mail"); };
  document.getElementById("btnWhatsappSablon").onclick = function(){ sablonuUygulaTiklandi("whatsapp"); };
  document.getElementById("btnEpostaSablon").onclick = function(){ sablonuUygulaTiklandi("mail"); };
  document.getElementById("btnGonderBitir").onclick = function(){ window.location.href = "home.html"; };
  ozetiCiz();
});
