/*
  ay-detay-render.js
  ===================
  Aylık Özet tablosunda bir aya dokununca açılan, o ayın sipariş
  kayıtlarını gün gün listeleyen AYRI sayfa. Hangi ay gösterilecek,
  localStorage'daki "weiconv2_goruntulenen_ay" anahtarından okunur
  (reports-render.js buraya yönlendirmeden önce yazar).
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

// v3 — tarih gruplu tasarım. Bu sabitler gecmis-render.js,
// son-islemler-render.js, satis-listesi-render.js, kacan-satislar-render.js
// ile birebir aynı tutulmalı.
var TIP_META = {
  siparis:  {rozet:"SİP",   rozetBg:"#e6f1fb", rozetRenk:"#0c447c", serit:"#185fa5", kodRenk:"#003a70"},
  teklif:   {rozet:"F.TEK", rozetBg:"#e1f5ee", rozetRenk:"#0e6b58", serit:"#28a745", kodRenk:"#1a7431"},
  proforma: {rozet:"P.FAT", rozetBg:"#f3e8fb", rozetRenk:"#6a1b9a", serit:"#8e44ad", kodRenk:"#5c1680"},
  numune:   {rozet:"NUM",   rozetBg:"#faeeda", rozetRenk:"#854f0b", serit:"#b7601f", kodRenk:"#7a4008"}
};
var RVZ_META = {rozet:"RVZ", rozetBg:"#faeeda", rozetRenk:"#854f0b", serit:"#b7601f"};
var KACAN_META = {rozet:"KAÇTI", rozetBg:"#fdecea", rozetRenk:"#a32d2d", serit:"#c0392b"};
var KANAL_HARF = {mail:"M", whatsapp:"W"};
var KANAL_RENK = {mail:"#185fa5", whatsapp:"#128C7E"};
var GUNLER_UZUN = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR_UZUN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var OK_SVG = "<svg width='8' height='12' viewBox='0 0 20 32' fill='none'><path d='M4 4 L16 16 L4 28' stroke='#e24b4a' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
function kanalHarfHTML(kanal){
  if(!kanal || !KANAL_HARF[kanal]) return "";
  return "<span class='tl-kanal-harf' style='color:" + KANAL_RENK[kanal] + ";'>" + KANAL_HARF[kanal] + "</span>";
}
function gunAnahtari(ts){
  var d = new Date(ts);
  return d.getFullYear() + "-" + d.getMonth() + "-" + d.getDate();
}
function gunBasligi(ts){
  var d = new Date(ts);
  return d.getDate() + " " + AYLAR_UZUN[d.getMonth()] + " " + d.getFullYear() + " • " + GUNLER_UZUN[d.getDay()];
}
function cariSatirHTML(kod, isim, sehir){
  return "<span class='cari-kod'>" + htmlEsc(kod||"—") + "</span>"
    + "<span class='cari-ayrac'> - </span>"
    + "<span class='cari-isim'>" + htmlEsc(isim||"") + "</span>"
    + (sehir ? "<span class='cari-ayrac'> - </span><span class='cari-sehir'>" + htmlEsc(sehir) + "</span>" : "");
}
function tlKartHTML(k){
  var kacanMi = k.durum === "kacan";
  var revizeMi = !!k.revizeZamani;
  var meta = TIP_META[k.tip] || TIP_META.siparis;
  var rozetMeta = kacanMi ? KACAN_META : (revizeMi ? RVZ_META : meta);
  var kod = k.kod || meta.rozet;
  return "<div class='tl-kart' data-i='" + k._i + "'>"
    + "<div class='tl-serit' style='background:" + rozetMeta.serit + ";'></div>"
    + "<div class='tl-govde'>"
    + "<div class='tl-ust'>" + cariSatirHTML(k.musteriId, k.musteri, k.sehir) + "</div>"
    + "<div class='tl-alt'>"
    + "<span class='tl-kod' style='color:" + meta.kodRenk + ";'>" + kanalHarfHTML(k.kanal) + htmlEsc(kod) + "</span>"
    + "<span class='tl-sag'><span class='tl-tutar'>" + fmt(k._tutar) + " EURO</span><span class='tl-divider'></span><button class='tl-ok' aria-label='Belgeyi aç'>" + OK_SVG + "</button></span>"
    + "</div>"
    + (k.durum==="beklemede" ? "<div class='tl-durum-ek tl-durum-ek--beklemede'>⏳ Beklemede" + (k.beklemedeNot ? ": " + htmlEsc(k.beklemedeNot) : "") + "</div>" : "")
    + "</div>"
    + "</div>";
}
function tlGrupla(liste){
  var gruplar = [], harita = {};
  liste.forEach(function(k, i){
    k._i = i;
    var anahtar = gunAnahtari(k.ts);
    if(!harita[anahtar]){ harita[anahtar] = {ts:k.ts, kayitlar:[]}; gruplar.push(harita[anahtar]); }
    harita[anahtar].kayitlar.push(k);
  });
  return gruplar;
}
function tlListeHTML(gruplar){
  return gruplar.map(function(g){
    var toplamGun = g.kayitlar.reduce(function(s,k){ return s + k._tutar; }, 0);
    var kartlar = g.kayitlar.map(function(k){ return tlKartHTML(k); }).join("<div class='tl-arasi'></div>");
    return "<div class='tl-grup-baslik'><span>" + gunBasligi(g.ts) + "</span><span>" + g.kayitlar.length + " işlem&nbsp;&nbsp;|&nbsp;&nbsp;" + fmt(toplamGun) + " EURO</span></div>"
      + "<div class='tl-liste-kutu'>" + kartlar + "</div>";
  }).join("");
}

var BEKLEMEDE_DAHIL_ANAHTAR = "weiconv2_beklemede_dahil_et";
var ayVerisi = null;

function ayVerisiniOku(){
  try{
    return JSON.parse(localStorage.getItem("weiconv2_goruntulenen_ay") || "null");
  }catch(e){ return null; }
}

function ayDetayiniCiz(){
  try{
    if(!ayVerisi) return;
    var beklemedeDahil = localStorage.getItem(BEKLEMEDE_DAHIL_ANAHTAR) === "1";
    // Sadece SİPARİŞ'ler sayılır ve listelenir — Numune/Fiyat Teklifi/
    // Proforma bu ekranda gösterilmez (hepsi zaten "Son İşlemler"de
    // ayrıca görünüyor). "AY TOPLAMI" gerçek satış hacmini yansıtsın diye.
    // "beklemede" siparişler gerçek satış değildir, varsayılan olarak
    // hiçbir toplama dahil edilmez (permanent kural). "Beklemede dahil
    // et" anahtarı açıksa, sadece bu ekranda geçici olarak gösterilir.
    var kayitlarBuAy = ReportsData.sonIslemler().filter(function(k){
      if(!k.tarih) return false;
      if(k.tip !== "siparis") return false;
      if(k.durum === "beklemede" && !beklemedeDahil) return false;
      var parca = k.tarih.split(" ");
      return (parca[1]||"")===ayVerisi.ayAd && (parca[2]||"")===ayVerisi.yil;
    });

    document.getElementById("ayDetayBaslik").textContent = "📅 " + ayVerisi.ayAd + " " + ayVerisi.yil + " Kayıtları";
    document.getElementById("rotaAyEtiketi").textContent = ayVerisi.ayAd + " " + ayVerisi.yil;

    if(kayitlarBuAy.length === 0){
      document.getElementById("ayDetayToplamEtiket").textContent = "🧮 SİPARİŞ TOPLAMI (0 kayıt)";
      document.getElementById("ayDetayToplamDeger").textContent = "0,00 EURO";
      document.getElementById("ayDetayListesi").innerHTML = "<p class='bos-mesaj'>Bu ayda sipariş kaydı yok.</p>";
      return;
    }

    var ayToplamEuro = kayitlarBuAy.reduce(function(s,k){
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+(u.toplamEuro||0); }, 0);
    }, 0);
    var ayToplamTl = kayitlarBuAy.reduce(function(s,k){
      var kKuru = k.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+((u.toplamEuro||0)*kKuru); }, 0);
    }, 0);

    document.getElementById("ayDetayToplamEtiket").textContent = "🧮 SİPARİŞ TOPLAMI (" + kayitlarBuAy.length + " kayıt)";
    document.getElementById("ayDetayToplamDeger").textContent = fmt(ayToplamEuro) + " EURO · ≈ " + fmt(ayToplamTl) + " TL";

    kayitlarBuAy.forEach(function(k){
      k._tutar = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
    });
    var gruplar = tlGrupla(kayitlarBuAy);
    document.getElementById("ayDetayListesi").innerHTML = tlListeHTML(gruplar);

    document.getElementById("ayDetayListesi").querySelectorAll(".tl-kart").forEach(function(el){
      el.onclick = function(){
        var k = kayitlarBuAy[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });
  }catch(e){ hataGoster("Ay detayı çizilemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  (function(){
    var btn = document.getElementById("btnGeriAkilli");
    if(btn) btn.onclick = function(){
      if(window.history.length > 1) window.history.back();
      else window.location.href = "reports.html";
    };
  })();

  ayVerisi = ayVerisiniOku();
  if(!ayVerisi){
    hataGoster("Gösterilecek ay bulunamadı, İstatistikler sayfasına dönülüyor.");
    window.location.href = "reports.html";
    return;
  }

  var toggle = document.getElementById("ayDetayBeklemedeToggle");
  toggle.checked = localStorage.getItem(BEKLEMEDE_DAHIL_ANAHTAR) === "1";
  toggle.onchange = function(){
    localStorage.setItem(BEKLEMEDE_DAHIL_ANAHTAR, this.checked ? "1" : "0");
    ayDetayiniCiz();
  };

  ReportsData.arsivDegistiginde(function(){ ayDetayiniCiz(); });
  ayDetayiniCiz();
});
