/*
  reports-render.js
  =================
  İstatistik kartlarını, aylık özet tablosunu ve Ay Detayı panelini yönetir.
  Son İşlemler listesi artık ayrı bir sayfada (son-islemler-render.js).
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

var TIP_ETIKET = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};

function ilerletTiklandi(k){
  try{
    var secenekler = ReportsData.SONRAKI_ASAMALAR[k.tip];
    if(!secenekler) return;
    var etiketler = secenekler.map(function(s){ return TIP_ETIKET[s]; }).join(" veya ");
    if(!confirm(k.musteri + " için " + (k.urunler||[]).length + " ürün düzenlenmek üzere Sepet'e yüklenecek" + (secenekler.length>1 ? " (Gönder'de " + etiketler + " seçebileceksin)." : (" ve " + etiketler + " olarak ilerletilecek.")) + " Devam edilsin mi?")) return;
    ReportsData.revizeBaslat(k);
  }catch(e){ hataGoster("İlerletilemedi: " + e.message); }
}

function ayDetayiniAc(ayVerisi){
  try{
    if(!ayVerisi) return;
    // Sadece SİPARİŞ'ler sayılır ve listelenir — Numune/Fiyat Teklifi/
    // Proforma bu ekranda gösterilmez (hepsi zaten "Son İşlemler"de
    // ayrıca görünüyor). "AY TOPLAMI" gerçek satış hacmini yansıtsın diye.
    var kayitlarBuAy = ReportsData.sonIslemler().filter(function(k){
      if(!k.tarih) return false;
      if(k.tip !== "siparis") return false;
      var parca = k.tarih.split(" ");
      return (parca[1]||"")===ayVerisi.ayAd && (parca[2]||"")===ayVerisi.yil;
    });
    if(kayitlarBuAy.length === 0){
      alert("Bu ayda sipariş kaydı yok.");
      return;
    }

    var ayToplamEuro = kayitlarBuAy.reduce(function(s,k){
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+(u.toplamEuro||0); }, 0);
    }, 0);
    var ayToplamTl = kayitlarBuAy.reduce(function(s,k){
      var kKuru = k.kur || (parseFloat(localStorage.getItem("weicon_kur"))||0);
      return s + (k.urunler||[]).reduce(function(ss,u){ return ss+((u.toplamEuro||0)*kKuru); }, 0);
    }, 0);

    document.getElementById("ayDetayBaslik").textContent = "📅 " + ayVerisi.ayAd + " " + ayVerisi.yil + " Kayıtları";
    document.getElementById("ayDetayToplamEtiket").textContent = "🧮 SİPARİŞ TOPLAMI (" + kayitlarBuAy.length + " kayıt)";
    document.getElementById("ayDetayToplamDeger").textContent = fmt(ayToplamEuro) + " € · ≈ " + fmt(ayToplamTl) + " TL";

    kayitlarBuAy.forEach(function(k){
      k._tutar = (k.urunler||[]).reduce(function(s,u){ return s+(u.toplamEuro||0); }, 0);
    });
    var gruplar = tlGrupla(kayitlarBuAy);
    document.getElementById("ayDetayListesi").innerHTML = tlListeHTML(gruplar, true);

    document.getElementById("ayDetayListesi").querySelectorAll(".tl-kart").forEach(function(el){
      el.onclick = function(){
        var k = kayitlarBuAy[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });

    document.getElementById("ayDetayBolumu").hidden = false;
    document.getElementById("ayDetayBolumu").scrollIntoView({behavior:"smooth", block:"start"});
  }catch(e){ hataGoster("Ay detayı açılamadı: " + e.message); }
}

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

function istatistikleriCiz(){
  try{
    var buAy = ReportsData.ayToplami(0);
    var gecenAy = ReportsData.ayToplami(1);
    document.getElementById("istBuAyToplam").textContent = fmt(buAy.toplam) + " EUR";
    document.getElementById("istBuAySiparisSayisi").textContent = buAy.sayi + " sipariş";
    document.getElementById("istGecenAyToplam").textContent = fmt(gecenAy.toplam) + " EUR";
    document.getElementById("istGecenAySiparisSayisi").textContent = gecenAy.sayi + " sipariş";

    var ozet = ReportsData.aylikPrimOzeti12();
    var genelToplam=0, genelToplamTl=0, genelPrim=0, genelPrimTl=0;
    document.getElementById("istAylikListe").innerHTML = ozet.aylar.map(function(a, i){
      genelToplam += a.toplam; genelToplamTl += a.toplamTl; genelPrim += a.prim; genelPrimTl += a.primTl;
      var mevcutAySinifi = i===0 ? " aylik-ozet-satir--mevcut-ay" : "";
      return "<tr class='" + mevcutAySinifi.trim() + "'>"
        + "<td class='aylik-ozet-ay-hucre'>" + a.ayAd + " " + a.yil + "</td>"
        + "<td>" + fmt(a.toplam) + " €</td>"
        + "<td class='aylik-ozet-satirtl-hucre'>" + fmt(a.toplamTl) + " ₺</td>"
        + "<td class='aylik-ozet-prim-hucre'>" + fmt(a.prim) + " €</td>"
        + "<td class='aylik-ozet-primtl-hucre'>" + fmt(a.primTl) + " ₺</td>"
        + "</tr>";
    }).join("");
    document.getElementById("istAylikGenelToplam").textContent = fmt(genelToplam) + " €";
    document.getElementById("istAylikGenelPrim").textContent = fmt(genelPrim) + " €";
    document.getElementById("istAylikGenelPrimTl").textContent = fmt(genelPrimTl) + " ₺";
    var kurNotuEl = document.getElementById("istAylikKurNotu");
    if(ozet.kur){
      kurNotuEl.className = "aylik-ozet-kur-notu";
      kurNotuEl.textContent = "Kur: 1 € = " + fmt(ozet.kur) + " ₺ üzerinden hesaplandı";
    } else {
      kurNotuEl.className = "aylik-ozet-kur-notu aylik-ozet-kur-notu--hata";
      kurNotuEl.textContent = "⚠️ Güncel kur bulunamadı, TL Prim hesaplanamadı";
    }

    document.getElementById("istAylikListe").querySelectorAll("tr").forEach(function(tr, i){
      tr.onclick = function(){ ayDetayiniAc(ozet.aylar[i]); };
    });
  }catch(e){ hataGoster("İstatistikler çizilemedi: " + e.message); }
}

// v3 — tarih gruplu tasarım (05.09.2026). Bu sabitler gecmis-render.js,
// son-islemler-render.js, satis-listesi-render.js ve
// kacan-satislar-render.js'de birebir aynı tutulmalı.
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
var OK_SVG = "<svg width='16' height='24' viewBox='0 0 20 32' fill='none'><path d='M4 4 L16 16 L4 28' stroke='#e24b4a' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
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
function tlKartHTML(k, gosterIsim){
  var kacanMi = k.durum === "kacan";
  var revizeMi = !!k.revizeZamani;
  var meta = TIP_META[k.tip] || TIP_META.siparis;
  var rozetMeta = kacanMi ? KACAN_META : (revizeMi ? RVZ_META : meta);
  var kod = k.kod || meta.rozet;
  return "<div class='tl-kart' data-i='" + k._i + "'>"
    + "<div class='tl-serit' style='background:" + rozetMeta.serit + ";'></div>"
    + "<div class='tl-govde'>"
    + (gosterIsim ? "<div class='tl-ust'><span class='tl-isim'>" + htmlEsc(k.musteri) + "</span>" + (k.sehir?" <span class='tl-sehir'>- "+htmlEsc(k.sehir)+"</span>":"") + "</div>" : "")
    + "<div class='tl-alt'>"
    + "<span class='tl-rozet' style='background:" + rozetMeta.rozetBg + ";color:" + rozetMeta.rozetRenk + ";'>" + rozetMeta.rozet + "</span>"
    + "<span class='tl-kod' style='color:" + meta.kodRenk + ";'>" + kanalHarfHTML(k.kanal) + htmlEsc(kod) + "</span>"
    + "<span class='tl-sag'><span class='tl-tutar'>" + fmt(k._tutar) + " €</span><span class='tl-divider'></span><button class='tl-ok' aria-label='Belgeyi aç'>" + OK_SVG + "</button></span>"
    + "</div>"
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
function tlListeHTML(gruplar, gosterIsim){
  return gruplar.map(function(g){
    var toplamGun = g.kayitlar.reduce(function(s,k){ return s + k._tutar; }, 0);
    var kartlar = g.kayitlar.map(function(k){ return tlKartHTML(k, gosterIsim); }).join("<div class='tl-arasi'></div>");
    return "<div class='tl-grup-baslik'><span>" + gunBasligi(g.ts) + "</span><span>" + g.kayitlar.length + " işlem&nbsp;&nbsp;|&nbsp;&nbsp;" + fmt(toplamGun) + " €</span></div>"
      + "<div class='tl-liste-kutu'>" + kartlar + "</div>";
  }).join("");
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  // Akıllı Geri: Raporlar (raporlar.html) üzerinden gerçekten buraya
  // gelindiyse tarayıcı geçmişinde bir adım geri gider; geçmiş yoksa
  // (doğrudan bağlantıyla açıldıysa) Raporlar'a düşer.
  (function(){
    var btn = document.getElementById("btnGeriAkilli");
    if(btn) btn.onclick = function(){
      if(window.history.length > 1) window.history.back();
      else window.location.href = "raporlar.html";
    };
  })();

  document.getElementById("btnAyDetayKapat").onclick = function(){ document.getElementById("ayDetayBolumu").hidden = true; };
  ReportsData.arsivDegistiginde(function(){ istatistikleriCiz(); });
  // Firebase verisi sayfa tam yüklenmeden önce gelmiş olabilir (dinleyici
  // kaçırmış olabilir) — bu yüzden ilk anda da bir kez elle çiziyoruz.
  istatistikleriCiz();
});
