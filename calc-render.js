/*
  calc-render.js
  ==============
  Ürün arama + hesaplama alanlarını dinler, CartData.hesapla() ile anlık
  sonucu gösterir. Kaydetme yok — sadece hesaplama aracı.
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

function aramaSonuclariniCiz(){
  try{
    var q = document.getElementById("searchInput").value;
    var liste = document.getElementById("sonucListesi");
    if(q.trim().length === 0){ liste.innerHTML = ""; return; }

    var sonuclar = ProductData.ara(q).slice(0, 15);
    liste.innerHTML = sonuclar.map(function(s){
      var bilgi = ProductData.urunBilgisi(s.item);
      return "<div class='urun-karti' data-idx='" + s.idx + "' style='cursor:pointer;'>"
        + "<div class='urun-bilgi'><div class='urun-kod'>Berta: " + htmlEsc(bilgi.berta||"-") + "</div><div class='urun-ad'>" + htmlEsc(bilgi.ad) + "</div></div>"
        + "<div class='urun-fiyat'>" + bilgi.fiyat.toFixed(2) + " EUR</div>"
        + "</div>";
    }).join("");

    liste.querySelectorAll(".urun-karti").forEach(function(kart, i){
      kart.onclick = function(){
        var bilgi = ProductData.urunBilgisi(sonuclar[i].item);
        urunSec(bilgi);
      };
    });
  }catch(e){ hataGoster("Arama sonuçları çizilemedi: " + e.message); }
}

var seciliUrunBilgi = null;

function urunSec(bilgi){
  seciliUrunBilgi = bilgi;
  document.getElementById("seciliUrunAd").textContent = bilgi.ad;
  document.getElementById("seciliUrunKutu").hidden = false;
  document.getElementById("hesListeFiyat").value = bilgi.fiyat;
  document.getElementById("searchInput").value = "";
  document.getElementById("sonucListesi").innerHTML = "";
  hesaplaVeGoster();
}

function hesaplaVeGoster(){
  try{
    var listeFiyat = parseFloat(document.getElementById("hesListeFiyat").value)||0;
    var urun = {
      listeFiyat: listeFiyat,
      dipFiyat: parseFloat(document.getElementById("hesDipFiyat").value)||0,
      iskonto: parseFloat(document.getElementById("hesIskonto").value)||0,
      adet: parseFloat(document.getElementById("hesAdet").value)||1
    };
    var kur = parseFloat(document.getElementById("kurInput").value)||0;
    var kdv = CartData.kdvOku();
    var h = CartData.hesapla(urun, kur, kdv);

    document.getElementById("hesapSonuc").innerHTML =
        "<div class='satir'><span class='lbl'>İskontolu Fiyat</span><span class='val'>" + CartData.fmt(h.iskontoluFiyat) + " EUR</span></div>"
      + "<div class='satir'><span class='lbl'>TL Birim Fiyat</span><span class='val'>" + CartData.fmt(h.tlBirimFiyat) + " TL</span></div>"
      + "<div class='satir'><span class='lbl'>Toplam</span><span class='val'>" + CartData.fmt(h.toplamEuro) + " EUR</span></div>"
      + "<div class='satir'><span class='lbl'>Fatura Toplam (KDV dahil)</span><span class='val'>" + CartData.fmt(h.faturaToplam) + " TL</span></div>"
      + "<div class='satir'><span class='lbl'>Prim</span><span class='val'>" + (h.mudurPrim<0 ? "Prim yok" : CartData.fmt(h.mudurPrim)+" EUR") + "</span></div>"
      + "<div class='satir'><span class='lbl'>Birim Kâr</span><span class='val'>" + CartData.fmt(h.maliyetKar) + " EUR</span></div>";

    document.getElementById("btnHesapSepeteEkle").hidden = listeFiyat <= 0;
  }catch(e){ hataGoster("Hesaplama yapılamadı: " + e.message); }
}

function sepeteEkleTiklandi(){
  try{
    var ad = seciliUrunBilgi ? seciliUrunBilgi.ad : prompt("Ürün adı girin:", "");
    if(!ad) return;
    var yeniUrun = {
      idx: "manuel_" + Date.now(),
      ad: ad,
      berta: seciliUrunBilgi ? seciliUrunBilgi.berta : "",
      abas: seciliUrunBilgi ? seciliUrunBilgi.abas : "",
      listeFiyat: parseFloat(document.getElementById("hesListeFiyat").value)||0,
      dipFiyat: parseFloat(document.getElementById("hesDipFiyat").value)||0,
      iskonto: parseFloat(document.getElementById("hesIskonto").value)||0,
      adet: parseFloat(document.getElementById("hesAdet").value)||1
    };
    var mevcutSepet = [];
    try{ mevcutSepet = JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]"); }catch(e){}
    mevcutSepet.push(yeniUrun);
    localStorage.setItem("weiconv2_sepet", JSON.stringify(mevcutSepet));
    if(confirm("✓ Sepete eklendi. Sepete gidip devam etmek ister misin?")){
      window.location.href = "cart.html";
    }
  }catch(e){ hataGoster("Sepete eklenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("kurInput").value = CartData.kurOku() || "";
  document.getElementById("searchInput").addEventListener("input", aramaSonuclariniCiz);
  document.getElementById("btnUrunTemizle").onclick = function(){
    document.getElementById("seciliUrunKutu").hidden = true;
    seciliUrunBilgi = null;
  };
  document.getElementById("btnHesapSepeteEkle").onclick = sepeteEkleTiklandi;
  ["hesListeFiyat","hesDipFiyat","hesIskonto","hesAdet","kurInput"].forEach(function(id){
    document.getElementById(id).addEventListener("input", function(){
      if(id==="kurInput") CartData.kurKaydet(parseFloat(this.value)||0);
      hesaplaVeGoster();
    });
  });
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  ProductData.katalogDegistiginde(function(){});
  hesaplaVeGoster();
});
