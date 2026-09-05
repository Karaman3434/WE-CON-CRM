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
  }catch(e){}
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

function fmt(n){
  return (n||0).toLocaleString("tr-TR",{minimumFractionDigits:2,maximumFractionDigits:2});
}

// v3 — tarih gruplu tasarım (05.09.2026). Bu sabitler gecmis-render.js,
// son-islemler-render.js, reports-render.js ve
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

function listeyiCiz(kapsam){
  try{
    var liste = ReportsData.satislarListele(kapsam);
    var kapsayici = document.getElementById("slListe");
    var bos = document.getElementById("slBos");
    if(!liste.length){ kapsayici.innerHTML = ""; bos.hidden = false; return; }
    bos.hidden = true;

    liste.forEach(function(k){ k._tutar = k.toplam || 0; if(!k.tip) k.tip = "siparis"; });
    var gruplar = tlGrupla(liste);
    kapsayici.innerHTML = tlListeHTML(gruplar, true);

    kapsayici.querySelectorAll(".tl-kart").forEach(function(el){
      el.onclick = function(){
        var k = liste[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:k.tip, ts:k.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };

  var params = new URLSearchParams(window.location.search);
  var kapsam = params.get("kapsam") === "ay" ? "ay" : "bugun";
  var baslikMetni = kapsam === "ay" ? "📅 Bu Ayın Satışları" : "📅 Bugünün Satışları";
  document.getElementById("slBaslik").textContent = baslikMetni;
  document.getElementById("rotaBaslik").textContent = kapsam === "ay" ? "Bu Ayın Satışları" : "Bugünün Satışları";

  ReportsData.arsivDegistiginde(function(){ listeyiCiz(kapsam); });
});
