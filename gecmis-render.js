/*
  gecmis-render.js
  ================
  Müşteriye özel İşlem Geçmişi sayfası. ReportsData.sonIslemler() zaten
  en yeniden en eskiye sıralı geliyor (bkz. reports-data.js); burada
  sadece seçili müşteriye ait kayıtlar filtrelenir, sonra aktif tip
  filtresi uygulanır. Renk/kod mantığı reports-render.js'deki
  kodRozetVeRenkGetir ile birebir aynı tutulur (KOD_RENK).
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
function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

var seciliMusteriAdi = null;
var aktifTip = "";

function ayniMusteriKaydiMi(kayitMusteriAdi, kayitMusteriId, seciliAd, seciliId){
  if(seciliId && kayitMusteriId) return kayitMusteriId === seciliId;
  var a = (kayitMusteriAdi||"").toLocaleLowerCase("tr-TR").trim();
  var b = (seciliAd||"").toLocaleLowerCase("tr-TR").trim();
  if(!a || !b) return false;
  if(a === b) return true;
  return a.indexOf(b) === 0 || b.indexOf(a) === 0;
}

// reports-render.js'deki KOD_RENK ile birebir aynı — iki dosyada da
// aynı tutulmalı (bkz. belge-render.js TIP_RENK_BELGE de aynı paletten).
var TIP_KOD_YEDEK = {numune:"NUM", teklif:"F.TEK", proforma:"P.FAT", siparis:"SİP"};
var KOD_RENK = {"SİP":"#003a70", "F.TEK":"#28a745", "P.FAT":"#8e44ad", "NUM":"#b7601f"};
// Metin (rozet değil, düz yazı) olarak kod üzerinde kullanılacak koyu tonlar —
// beyaz zeminde okunabilirlik için KOD_RENK'ten daha koyu.
var KOD_RENK_METIN = {"SİP":"#003a70", "F.TEK":"#1a7431", "P.FAT":"#5c1680", "NUM":"#7a4008"};
// Gönderim kanalı harfi + rengi — kod ile birlikte gösterilir (belge hangi
// yolla gönderildiyse: Mail veya WhatsApp).
var KANAL_HARF = {mail:"M", whatsapp:"W"};
var KANAL_RENK = {mail:"#185fa5", whatsapp:"#128C7E"};
function kodOnekiAyikla(kod){
  if(!kod) return null;
  var parcalar = kod.split(".");
  if(parcalar.length < 3) return kod;
  return parcalar.slice(0, parcalar.length-2).join(".");
}
function kodRozetVeRenkGetir(k){
  var kod = k.kod || TIP_KOD_YEDEK[k.tip] || "?";
  var onek = kodOnekiAyikla(k.kod) || TIP_KOD_YEDEK[k.tip] || "?";
  var renk = (k.durum === "kacan") ? "#c0392b" : (KOD_RENK[onek] || "#3569b8");
  var renkMetin = (k.durum === "kacan") ? "#c0392b" : (KOD_RENK_METIN[onek] || "#1c2530");
  return {kod: kod, renk: renk, renkMetin: renkMetin};
}
function kanalHarfHTML(kanal){
  if(!kanal || !KANAL_HARF[kanal]) return "";
  return "<span class='ik2-kanal-harf' style='color:" + KANAL_RENK[kanal] + ";'>" + KANAL_HARF[kanal] + "</span>";
}

function listeyiCiz(){
  try{
    var seciliMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    var seciliId = seciliMusteri ? seciliMusteri.id : null;
    var tumu = ReportsData.sonIslemler();
    var bunaAit = tumu.filter(function(k){ return ayniMusteriKaydiMi(k.musteri, k.musteriId, seciliMusteriAdi, seciliId); });

    document.getElementById("gecmisMusteriSayac").textContent = bunaAit.length + " kayıtlı işlem";

    var farkliIsimliKayit = bunaAit.find(function(k){
      return (k.musteri||"").trim() !== (seciliMusteriAdi||"").trim();
    });
    var uyusmazlikKutu = document.getElementById("isimUyusmazlikKutu");
    if(farkliIsimliKayit){
      uyusmazlikKutu.hidden = false;
      document.getElementById("isimUyusmazlikMetin").textContent =
        "⚠️ Bazı eski kayıtlarda farklı bir isim var: \"" + farkliIsimliKayit.musteri + "\". "
        + "Bu kayıtlar gösteriliyor ama isimleri güncel Cari Bilgi (\"" + seciliMusteriAdi + "\") ile eşleşmiyor.";
      document.getElementById("btnIsimUyusmazlikDuzelt").onclick = isimleriEsitleTiklandi;
    } else {
      uyusmazlikKutu.hidden = true;
    }

    var filtreli = aktifTip ? bunaAit.filter(function(k){ return k.tip === aktifTip; }) : bunaAit;

    var kapsayici = document.getElementById("gecmisListesi");
    var bos = document.getElementById("gecmisBos");
    if(filtreli.length === 0){
      kapsayici.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    kapsayici.innerHTML = filtreli.map(function(k, i){
      var kacanMi = k.durum === "kacan";
      var kodBilgi = kodRozetVeRenkGetir(k);
      var kod = kodBilgi.kod, renkMetin = kodBilgi.renkMetin;
      var toplam = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
      var durumEk = kacanMi ? ("❌ KAÇTI" + (k.kacanRakip?" → "+htmlEsc(k.kacanRakip):"")) : "";

      return "<div class='ik2-kart" + (kacanMi?" islem-karti--kacan":"") + "' data-i='" + i + "'>"
        + "<div class='ik2-alt'>"
        + "<span class='ik2-tarih'>" + htmlEsc(k.tarih) + "</span>"
        + "<span class='ik2-kod' style='color:" + renkMetin + ";'>" + kanalHarfHTML(k.kanal) + htmlEsc(kod) + "</span>"
        + "<span class='ik2-tutar'>" + fmt(toplam) + " €</span>"
        + (k.revizeZamani ? "<span class='ik2-rvz'>RVZ</span>" : "")
        + "</div>"
        + (durumEk ? "<div class='ik2-durum-ek'>" + durumEk + "</div>" : "")
        + "</div>";
    }).join("");

    kapsayici.querySelectorAll(".ik2-kart").forEach(function(el){
      el.onclick = function(){
        var k = filtreli[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });
  }catch(e){ hataGoster("İşlem geçmişi çizilemedi: " + e.message); }
}

function isimleriEsitleTiklandi(){
  try{
    var tumu = ReportsData.sonIslemler();
    var seciliMusteri = CustomerData.musteriBul(seciliMusteriAdi);
    var seciliId = seciliMusteri ? seciliMusteri.id : null;
    var bunaAit = tumu.filter(function(k){ return ayniMusteriKaydiMi(k.musteri, k.musteriId, seciliMusteriAdi, seciliId); });
    var farkliIsimler = [];
    bunaAit.forEach(function(k){
      var isim = (k.musteri||"").trim();
      if(isim && isim !== (seciliMusteriAdi||"").trim() && farkliIsimler.indexOf(isim)===-1) farkliIsimler.push(isim);
    });
    if(!farkliIsimler.length) return;
    if(!confirm("Şu eski isim varyant(lar)ı bulundu:\n\n" + farkliIsimler.join("\n") + "\n\nBunlara ait TÜM kayıtlar (sipariş/teklif/görev), güncel isim \"" + seciliMusteriAdi + "\" ile eşitlenecek. Devam edilsin mi?")) return;
    var kalanSayi = farkliIsimler.length;
    for(var i=0;i<farkliIsimler.length;i++){
      ReportsData.kayitlariBirlestir(farkliIsimler[i], null, seciliMusteriAdi, seciliId, function(basarili, err){
        kalanSayi--;
        if(!basarili) hataGoster("İsim eşitleme hatası: " + (err && err.message ? err.message : "bilinmeyen hata"));
        if(kalanSayi<=0) listeyiCiz();
      });
    }
  }catch(e){ hataGoster("İsimler eşitlenemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var secili = CustomerData.seciliyiOku();
  if(!secili){
    hataGoster("Müşteri seçilmemiş, listeye dönülüyor.");
    setTimeout(function(){ window.location.href = "customer.html"; }, 1500);
    return;
  }
  seciliMusteriAdi = secili.ad;
  document.getElementById("gecmisMusteriAd").textContent = secili.ad;

  document.getElementById("gecmisFiltreSatiri").querySelectorAll(".gecmis-filtre-cip").forEach(function(btn){
    btn.onclick = function(){
      document.querySelectorAll(".gecmis-filtre-cip").forEach(function(b){ b.classList.remove("gecmis-filtre-cip--aktif"); });
      this.classList.add("gecmis-filtre-cip--aktif");
      aktifTip = this.getAttribute("data-tip");
      listeyiCiz();
    };
  });

  listeyiCiz();
  ReportsData.arsivDegistiginde(listeyiCiz);
});
