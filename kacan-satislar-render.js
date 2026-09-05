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

var siralamaYonu = "yeni"; // yeni | eski

// v3 — tarih gruplu tasarım (05.09.2026). Bu sabitler gecmis-render.js,
// son-islemler-render.js, satis-listesi-render.js ve reports-render.js'de
// birebir aynı tutulmalı. Bu listedeki her kayıt zaten "kaçan" olduğu için
// serit/rozet her zaman KACAN_META (kırmızı) — tip sadece kod rengini belirler.
var TIP_ETIKET_KS = {numune:"Numune", teklif:"Teklif", proforma:"Proforma", siparis:"Sipariş"};
var TIP_META = {
  siparis:  {rozet:"SİP",   kodRenk:"#003a70"},
  teklif:   {rozet:"F.TEK", kodRenk:"#1a7431"},
  proforma: {rozet:"P.FAT", kodRenk:"#5c1680"},
  numune:   {rozet:"NUM",   kodRenk:"#7a4008"}
};
var KACAN_META = {rozet:"KAÇTI", rozetBg:"#fdecea", rozetRenk:"#a32d2d", serit:"#c0392b"};
var GUNLER_UZUN = ["Pazar","Pazartesi","Salı","Çarşamba","Perşembe","Cuma","Cumartesi"];
var AYLAR_UZUN = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
var OK_SVG = "<svg width='8' height='12' viewBox='0 0 20 32' fill='none'><path d='M4 4 L16 16 L4 28' stroke='#e24b4a' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>";
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
  var meta = TIP_META[k.tip] || TIP_META.siparis;
  var kod = k.kod || meta.rozet;
  return "<div class='tl-kart' data-i='" + k._i + "'>"
    + "<div class='tl-serit' style='background:" + KACAN_META.serit + ";'></div>"
    + "<div class='tl-govde'>"
    + "<div class='tl-ust'>" + cariSatirHTML(k.musteriId, k.musteri, k.sehir) + "</div>"
    + "<div class='tl-alt'>"
    + "<span class='tl-kod' style='color:" + meta.kodRenk + ";'>" + htmlEsc(kod) + "</span>"
    + "<span class='tl-sag'><span class='tl-tutar'>" + fmt(k.tutar) + " €</span><span class='tl-divider'></span><button class='tl-ok' aria-label='Belgeyi aç'>" + OK_SVG + "</button></span>"
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

function listeyiCiz(){
  try{
    var liste = ReportsData.tumKacanlar(siralamaYonu);
    var kapsayici = document.getElementById("ksListe");
    var bos = document.getElementById("ksBos");
    if(!liste.length){ kapsayici.innerHTML = ""; bos.hidden = false; return; }
    bos.hidden = true;

    var gruplar = tlGrupla(liste);
    kapsayici.innerHTML = gruplar.map(function(g){
      var toplamGun = g.kayitlar.reduce(function(s,k){ return s + (k.tutar||0); }, 0);
      var kartlar = g.kayitlar.map(tlKartHTML).join("<div class='tl-arasi'></div>");
      return "<div class='tl-grup-baslik'><span>" + gunBasligi(g.ts) + "</span><span>" + g.kayitlar.length + " işlem&nbsp;&nbsp;|&nbsp;&nbsp;" + fmt(toplamGun) + " €</span></div>"
        + "<div class='tl-liste-kutu'>" + kartlar + "</div>";
    }).join("");

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

  document.getElementById("btnSiralama").onclick = function(){
    siralamaYonu = siralamaYonu === "yeni" ? "eski" : "yeni";
    this.textContent = siralamaYonu === "yeni" ? "Yeni → Eski ⇅" : "Eski → Yeni ⇅";
    listeyiCiz();
  };

  ReportsData.arsivDegistiginde(listeyiCiz);
});
