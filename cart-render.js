/*
  cart-render.js
  ==============
  TEK görevi: sepet verisini ekrana kart olarak basmak, alan değişikliklerini
  dinlemek, anlık hesaplamayı göstermek.
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

function urunKartiHtml(u){
  return "<div class='sepet-urun' data-idx='" + u.idx + "'>"
    + "<div class='sepet-urun-baslik'>"
    + "<div>"
    + "<div class='sepet-urun-ad'>" + htmlEsc(u.ad) + "</div>"
    + "<div class='sepet-urun-kod'>Berta: " + htmlEsc(u.berta||"-") + " · Abas: " + htmlEsc(u.abas||"-") + "</div>"
    + "</div>"
    + "<button class='sepet-sil-btn' data-sil='" + u.idx + "'>Sil</button>"
    + "</div>"
    + "<div class='hesap-alan-grid'>"
    + "<div class='hesap-alan'><label>Liste Fiyat (EUR)</label><input type='number' step='0.01' data-alan='listeFiyat' data-idx='" + u.idx + "' value='" + (u.listeFiyat||0) + "'></div>"
    + "<div class='hesap-alan'><label>Dip Fiyat (EUR)</label><input type='number' step='0.01' data-alan='dipFiyat' data-idx='" + u.idx + "' value='" + (u.dipFiyat||0) + "'></div>"
    + "<div class='hesap-alan'><label>İskonto (%)</label><input type='number' step='0.1' data-alan='iskonto' data-idx='" + u.idx + "' value='" + (u.iskonto||0) + "'></div>"
    + "<div class='hesap-alan'><label>Adet</label><div class='adet-stepper'>"
    + "<button class='adet-azalt-btn' data-adet-azalt='" + u.idx + "'>−</button>"
    + "<input type='number' step='1' min='1' data-alan='adet' data-idx='" + u.idx + "' value='" + (u.adet||1) + "'>"
    + "<button class='adet-artir-btn' data-adet-artir='" + u.idx + "'>+</button>"
    + "</div></div>"
    + "</div>"
    + "<div class='hesap-sonuc' id='sonuc-" + u.idx + "'></div>"
    + "</div>";
}

function sonucKutusuGuncelle(u, kur, kdv){
  var h = CartData.hesapla(u, kur, kdv);
  var el = document.getElementById("sonuc-" + u.idx);
  if(!el) return;
  el.innerHTML =
      "<div class='hesap-sonuc-satir'><span class='lbl'>İskontolu Fiyat</span><span class='val'>" + CartData.fmt(h.iskontoluFiyat) + " EUR</span></div>"
    + "<div class='hesap-sonuc-satir'><span class='lbl'>TL Birim Fiyat</span><span class='val'>" + CartData.fmt(h.tlBirimFiyat) + " TL</span></div>"
    + "<div class='hesap-sonuc-satir'><span class='lbl'>Satır Toplamı</span><span class='val'>" + CartData.fmt(h.toplamEuro) + " EUR</span></div>"
    + "<div class='hesap-sonuc-satir'><span class='lbl'>Prim</span><span class='val'>" + (h.mudurPrim<0 ? "Prim yok" : CartData.fmt(h.mudurPrim)+" EUR") + "</span></div>";
}

function sayfayiCiz(){
  try{
    var liste = CartData.liste();
    var kapsayici = document.getElementById("sepetListesi");
    var bosMesaj = document.getElementById("sepetBosMesaj");
    var toplamKutu = document.getElementById("toplamKutu");
    var devamBtn = document.getElementById("btnDevamEt");

    if(liste.length === 0){
      kapsayici.innerHTML = "";
      bosMesaj.hidden = false;
      toplamKutu.hidden = true;
      devamBtn.hidden = true;
      return;
    }
    bosMesaj.hidden = true;
    toplamKutu.hidden = false;
    devamBtn.hidden = false;

    kapsayici.innerHTML = liste.map(urunKartiHtml).join("");

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    liste.forEach(function(u){ sonucKutusuGuncelle(u, kur, kdv); });
    genelToplamiGuncelle();

    // Alan değişikliklerini dinle
    kapsayici.querySelectorAll("input[data-alan]").forEach(function(input){
      input.addEventListener("input", function(){
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var alan = this.getAttribute("data-alan");
        var deger = parseFloat(this.value) || 0;
        CartData.alaniGuncelle(idx, alan, deger);
        var u = CartData.liste().find(function(x){ return x.idx===idx; });
        if(u) sonucKutusuGuncelle(u, CartData.kurOku(), CartData.kdvOku());
        genelToplamiGuncelle();
      });
    });

    // Sil butonları
    kapsayici.querySelectorAll("[data-sil]").forEach(function(btn){
      btn.onclick = function(){
        var idx = parseInt(this.getAttribute("data-sil"), 10);
        CartData.sil(idx);
        sayfayiCiz();
      };
    });

    // Adet +/- hızlı butonları
    function adetiDegistir(idx, fark){
      var input = kapsayici.querySelector("input[data-alan='adet'][data-idx='" + idx + "']");
      if(!input) return;
      var yeni = Math.max(1, (parseInt(input.value,10)||1) + fark);
      input.value = yeni;
      CartData.alaniGuncelle(idx, "adet", yeni);
      var u = CartData.liste().find(function(x){ return x.idx===idx; });
      if(u) sonucKutusuGuncelle(u, CartData.kurOku(), CartData.kdvOku());
      genelToplamiGuncelle();
    }
    kapsayici.querySelectorAll("[data-adet-artir]").forEach(function(btn){
      btn.onclick = function(){ adetiDegistir(parseInt(this.getAttribute("data-adet-artir"),10), 1); };
    });
    kapsayici.querySelectorAll("[data-adet-azalt]").forEach(function(btn){
      btn.onclick = function(){ adetiDegistir(parseInt(this.getAttribute("data-adet-azalt"),10), -1); };
    });
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
    // Müşteri Kartı'ndan "Satış Yap" ile gelindiyse müşteri zaten seçili —
    // tekrar seçtirmeye gerek yok, doğrudan Kaydet ekranına geç.
    var onceSecilmisMi = false;
    try{ onceSecilmisMi = !!JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null"); }catch(e){}
    window.location.href = onceSecilmisMi ? "send.html" : "customer.html";
  };
  sayfayiCiz();
});
