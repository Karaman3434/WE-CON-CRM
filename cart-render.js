/*
  cart-render.js
  ==============
  Sepeti iki gruba ayırarak çizer: HESAPLANACAK (sarı kart listesi, ürün
  adına dokununca Hesapla popup'ı açılır) ve HESAPLANDI (yeşil tablo,
  Adet/Liste/İsk/Net/Toplam/Prim sütunlarıyla). Tüm ürünler hesaplanmadan
  Devam Et butonu pasif kalır.
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

var acikUrunIdx = null;

function hesaplaPopupAc(u){
  acikUrunIdx = u.idx;
  document.getElementById("hesaplaUrunAdi").textContent = u.ad;
  document.getElementById("hesaplaUrunKod").textContent = "Berta: " + (u.berta||"-") + " · Abas: " + (u.abas||"-");
  document.getElementById("hpListeFiyat").value = u.listeFiyat || 0;
  document.getElementById("hpDipFiyat").value = u.dipFiyat || 0;
  document.getElementById("hpIskonto").value = u.iskonto || 0;
  document.getElementById("hpAdet").value = u.adet || 1;
  hesaplaPopupSonucGuncelle();
  document.getElementById("hesaplaOverlay").hidden = false;
}

function hesaplaPopupSonucGuncelle(){
  var gecici = {
    listeFiyat: parseFloat(document.getElementById("hpListeFiyat").value)||0,
    dipFiyat: parseFloat(document.getElementById("hpDipFiyat").value)||0,
    iskonto: parseFloat(document.getElementById("hpIskonto").value)||0,
    adet: parseFloat(document.getElementById("hpAdet").value)||1
  };
  var h = CartData.hesapla(gecici, CartData.kurOku(), CartData.kdvOku());
  document.getElementById("hpNet").textContent = CartData.fmt(h.iskontoluFiyat);
  document.getElementById("hpToplam").textContent = CartData.fmt(h.toplamEuro);
  document.getElementById("hpPrim").textContent = CartData.fmt(h.mudurPrim);
}

function bekleyenKartHtml(u){
  return "<div class='sepet-bekleyen-kart' data-idx='" + u.idx + "'>"
    + "<div>"
    + "<div class='sepet-bekleyen-ad'>" + htmlEsc(u.ad) + "</div>"
    + "<div class='sepet-bekleyen-kod'>Berta: " + htmlEsc(u.berta||"-") + " · Abas: " + htmlEsc(u.abas||"-") + "</div>"
    + "</div>"
    + "<span class='sepet-bekleyen-ok'>›</span>"
    + "</div>";
}

function hesaplananSatirHtml(u, kur, kdv){
  var h = CartData.hesapla(u, kur, kdv);
  return "<tr data-idx='" + u.idx + "'>"
    + "<td class='sepet-urun-hucre'>"
    + "<div class='sepet-urun-ad-tikla' data-idx='" + u.idx + "'>" + htmlEsc(u.ad) + "</div>"
    + "<div class='sepet-urun-kod'>Berta: " + htmlEsc(u.berta||"-") + " · Abas: " + htmlEsc(u.abas||"-") + "</div>"
    + "</td>"
    + "<td>" + (u.adet||1) + "</td>"
    + "<td>" + CartData.fmt(u.listeFiyat) + "</td>"
    + "<td>%" + (u.iskonto||0) + "</td>"
    + "<td>" + CartData.fmt(h.iskontoluFiyat) + "</td>"
    + "<td class='sepet-toplam-deger'>" + CartData.fmt(h.toplamEuro) + "</td>"
    + "<td>" + CartData.fmt(h.mudurPrim) + "</td>"
    + "<td><button class='sepet-sil-btn' data-sil='" + u.idx + "'>🗑️</button></td>"
    + "</tr>";
}

function sayfayiCiz(){
  try{
    var liste = CartData.liste();
    var bosMesaj = document.getElementById("sepetBosMesaj");
    var toplamKutu = document.getElementById("toplamKutu");
    var devamBtn = document.getElementById("btnDevamEt");
    var devamUyari = document.getElementById("devamUyari");

    var grupSariBaslik = document.getElementById("grupSariBaslik");
    var grupSariListe = document.getElementById("grupSariListe");
    var grupYesilBaslik = document.getElementById("grupYesilBaslik");
    var grupYesilTabloAlani = document.getElementById("grupYesilTabloAlani");
    var grupYesilTabloGovde = document.getElementById("grupYesilTabloGovde");

    if(liste.length === 0){
      grupSariBaslik.hidden = true;
      grupSariListe.innerHTML = "";
      grupYesilBaslik.hidden = true;
      grupYesilTabloAlani.hidden = true;
      bosMesaj.hidden = false;
      toplamKutu.hidden = true;
      devamBtn.hidden = true;
      devamUyari.hidden = true;
      return;
    }
    bosMesaj.hidden = true;
    toplamKutu.hidden = false;
    devamBtn.hidden = false;

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    var bekleyenler = liste.filter(function(u){ return !u.hesaplandi; });
    var hesaplananlar = liste.filter(function(u){ return u.hesaplandi; });

    grupSariBaslik.hidden = bekleyenler.length === 0;
    grupSariListe.innerHTML = bekleyenler.map(bekleyenKartHtml).join("");
    grupSariListe.querySelectorAll(".sepet-bekleyen-kart").forEach(function(kart){
      kart.onclick = function(){
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var u = CartData.liste().find(function(x){ return x.idx===idx; });
        if(u) hesaplaPopupAc(u);
      };
    });

    grupYesilBaslik.hidden = hesaplananlar.length === 0;
    grupYesilTabloAlani.hidden = hesaplananlar.length === 0;
    grupYesilTabloGovde.innerHTML = hesaplananlar.map(function(u){ return hesaplananSatirHtml(u, kur, kdv); }).join("");
    grupYesilTabloGovde.querySelectorAll(".sepet-urun-ad-tikla").forEach(function(el){
      el.onclick = function(){
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var u = CartData.liste().find(function(x){ return x.idx===idx; });
        if(u) hesaplaPopupAc(u);
      };
    });
    grupYesilTabloGovde.querySelectorAll("[data-sil]").forEach(function(btn){
      btn.onclick = function(){
        var idx = parseInt(this.getAttribute("data-sil"), 10);
        CartData.sil(idx);
        sayfayiCiz();
      };
    });

    var tamamMi = CartData.tamamHesaplandiMi();
    devamBtn.disabled = !tamamMi;
    devamUyari.hidden = tamamMi;

    genelToplamiGuncelle();
  }catch(e){ hataGoster("Sepet çizilemedi: " + e.message); }
}

function genelToplamiGuncelle(){
  try{
    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    var t = CartData.genelToplam(kur, kdv);
    document.getElementById("genelToplamEuro").textContent = CartData.fmt(t.toplamEuro) + " EUR";
    document.getElementById("genelToplamPrim").textContent = CartData.fmt(t.toplamPrim) + " EUR";
  }catch(e){ hataGoster("Genel toplam güncellenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  var kurInput = document.getElementById("kurInput");
  kurInput.value = CartData.kurOku() || "";
  kurInput.addEventListener("input", function(){
    CartData.kurKaydet(parseFloat(this.value)||0);
    sayfayiCiz();
  });
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnDevamEt").onclick = function(){
    if(document.getElementById("btnDevamEt").disabled) return;
    var onceSecilmisMi = false;
    try{ onceSecilmisMi = !!JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null"); }catch(e){}
    window.location.href = onceSecilmisMi ? "send.html" : "customer.html";
  };

  ["hpListeFiyat","hpDipFiyat","hpIskonto","hpAdet"].forEach(function(id){
    document.getElementById(id).addEventListener("input", hesaplaPopupSonucGuncelle);
  });
  document.getElementById("btnHesaplaVazgec").onclick = function(){
    document.getElementById("hesaplaOverlay").hidden = true;
    acikUrunIdx = null;
  };
  document.getElementById("btnHesaplaListeyeEkle").onclick = function(){
    if(acikUrunIdx === null) return;
    var listeFiyat = parseFloat(document.getElementById("hpListeFiyat").value)||0;
    var dipFiyat = parseFloat(document.getElementById("hpDipFiyat").value)||0;
    var iskonto = parseFloat(document.getElementById("hpIskonto").value)||0;
    var adet = parseFloat(document.getElementById("hpAdet").value)||1;
    CartData.hesaplandiIsaretle(acikUrunIdx, listeFiyat, dipFiyat, iskonto, adet);
    document.getElementById("hesaplaOverlay").hidden = true;
    acikUrunIdx = null;
    sayfayiCiz();
  };

  sayfayiCiz();
});
