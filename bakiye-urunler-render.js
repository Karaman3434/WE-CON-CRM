/*
  bakiye-urunler-render.js — WG.071026.1645.746
  ================================================
  "Bakiyedeki Ürünler" ekranı (07.10.2026, Abdullah'ın isteğiyle) — stokta
  tam olmayıp müşteride bakiyede bırakılan ürün SATIRLARINI (ReportsData.
  bakiyedekiUrunler(), reports-data.js) tek bir listede gösterir.

  KURAL (Abdullah'ın isteğiyle, aynı gün): listede ÜRÜN ADEDİ KESİNLİKLE
  YAZILMAZ — sadece müşteri/işlem bilgisi ve ürün adı + not gösterilir.
  Bir satıra dokunulunca o siparişin TAM tablosu açılır (satış listesindeki
  "Belgeyi Aç" ile birebir aynı localStorage devri + yönlendirme) — adet
  orada, tabloda zaten görünüyor (bkz. hareket-tablo.js bakiye rozeti).
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
  }catch(e){}
}

function htmlEsc(s){
  return String(s==null?"":s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

var HARF_RENK = {siparis:"#003a70", teklif:"#28a745", proforma:"#8e44ad", numune:"#b7601f"};
var OK_SVG = "<svg width='8' height='12' viewBox='0 0 20 32' fill='none'><path d='M4 4 L16 16 L4 28' stroke='#e24b4a' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/></svg>";

function cariSatirHTML(kod, isim, sehir){
  return "<span class='cari-kod'>" + htmlEsc(kod||"—") + "</span>"
    + "<span class='cari-ayrac'> - </span>"
    + "<span class='cari-isim'>" + htmlEsc(isim||"") + "</span>"
    + (sehir ? "<span class='cari-ayrac'> - </span><span class='cari-sehir'>" + htmlEsc(sehir) + "</span>" : "");
}
function kodHTML(kod, tip){
  kod = String(kod == null ? "" : kod);
  var i = kod.indexOf(".");
  var harf = i > 0 ? kod.slice(0, i) : kod;
  var kalan = i > 0 ? kod.slice(i) : "";
  return "<span style='color:" + (HARF_RENK[tip] || HARF_RENK.siparis) + ";'>" + htmlEsc(harf) + "</span>" + htmlEsc(kalan);
}

// ADET YAZILMAZ — sadece ürün adı + (varsa) rep'in kendi notu.
function bakiyeKartHTML(s){
  return "<div class='tl-kart tl-kart--bekleyen' data-i='" + s._i + "'>"
    + "<div class='tl-serit' style='background:#faeeda;'></div>"
    + "<div class='tl-govde'>"
    + "<div class='tl-satir'>" + "<div class='tl-ust'>" + cariSatirHTML(s.musteriId, s.musteri, s.sehir) + "</div>"
    + "<div class='tl-sagblok'><div class='tl-kod-satir'>"
    + "<span class='tl-kod'>" + kodHTML(s.kod, s.tip) + "</span></div></div>"
    + "<button class='tl-ok' aria-label='Siparişin tam tablosunu aç'>" + OK_SVG + "</button>"
    + "</div>"
    + "<div class='bekleyen-not'>📦 " + htmlEsc(s.urunAd) + (s.bakiyeNot ? " — " + htmlEsc(s.bakiyeNot) : "") + "</div>"
    + "</div>"
    + "</div>";
}

function listeyiCiz(){
  try{
    var satirlar = ReportsData.bakiyedekiUrunler();
    var kapsayici = document.getElementById("buListe");
    var bos = document.getElementById("buBos");
    var baslik = document.getElementById("buBaslik");
    if(!satirlar.length){ kapsayici.innerHTML = ""; baslik.hidden = true; bos.hidden = false; return; }
    bos.hidden = true;
    baslik.hidden = false;
    baslik.textContent = "📦 BAKİYEDE BEKLEYEN ÜRÜNLER — " + satirlar.length + " kayıt";

    satirlar.forEach(function(s, i){ s._i = i; });
    kapsayici.innerHTML = "<div class='tl-liste-kutu'>" + satirlar.map(bakiyeKartHTML).join("<div class='tl-arasi'></div>") + "</div>";

    kapsayici.querySelectorAll(".tl-kart[data-i]").forEach(function(el){
      el.onclick = function(){
        var s = satirlar[parseInt(this.getAttribute("data-i"), 10)];
        localStorage.setItem("weiconv2_goruntulenen_belge", JSON.stringify({tip:s.tip, ts:s.ts}));
        window.location.href = "belge-onizleme.html";
      };
    });
  }catch(e){ hataGoster("Liste çizilemedi: " + e.message); }
}

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  var btnMenuEl = document.getElementById("btnMenu");
  if(btnMenuEl) btnMenuEl.onclick = function(){ window.location.href = "menu.html"; };
  ReportsData.arsivDegistiginde(listeyiCiz);
});
