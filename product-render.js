/*
  product-render.js
  =================
  TEK görevi: arama kutusunu dinlemek, ProductData.ara()'dan sonuç almak ve
  ekrana kart olarak basmak. Hesaplama/Firebase mantığı içermez.
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

function sonuclariCiz(){
  try{
    var q = document.getElementById("searchInput").value;
    var liste = document.getElementById("sonucListesi");
    var bos = document.getElementById("bosMesaj");
    var yukleniyor = document.getElementById("yukleniyorMesaj");

    if(ProductData.katalogUzunluk() === 0){
      liste.innerHTML = "";
      bos.hidden = true;
      yukleniyor.hidden = false;
      return;
    }
    yukleniyor.hidden = true;

    var sonuclar = ProductData.ara(q);
    // Arama kutusu boşken sonuç listesini şişirmemek için sınırla
    if(q.trim().length === 0) sonuclar = sonuclar.slice(0, 30);

    if(sonuclar.length === 0){
      liste.innerHTML = "";
      bos.hidden = false;
      return;
    }
    bos.hidden = true;

    var html = "";
    for(var i=0;i<sonuclar.length;i++){
      var idx = sonuclar[i].idx;
      var bilgi = ProductData.urunBilgisi(sonuclar[i].item);
      var eklendi = ProductData.sepetteMi(idx);
      html += "<div class='urun-karti'>"
        + "<div class='urun-bilgi'>"
        + "<div class='urun-kod'>Berta: " + htmlEsc(bilgi.berta||"-") + " · Abas: " + htmlEsc(bilgi.abas||"-") + "</div>"
        + "<div class='urun-ad'>" + htmlEsc(bilgi.ad) + "</div>"
        + "</div>"
        + "<div class='urun-fiyat'>" + bilgi.fiyat.toFixed(2) + " EUR</div>"
        + "<button class='urun-ekle-btn" + (eklendi?" eklendi":"") + "' data-idx='" + idx + "'>" + (eklendi?"Eklendi":"Seç") + "</button>"
        + "</div>";
    }
    liste.innerHTML = html;

    // Buton olayları — HTML string'e onclick gömmek yerine burada bağlanıyor
    var butonlar = liste.querySelectorAll(".urun-ekle-btn");
    butonlar.forEach(function(btn){
      btn.onclick = function(){
        var idx = parseInt(this.getAttribute("data-idx"), 10);
        var eklendiMi = ProductData.sepeteEkleCikar(idx);
        sepetSatiriniGuncelle();
        sonuclariCiz(); // buton durumunu tazele
        if(eklendiMi){
          document.getElementById("searchInput").value = "";
          document.getElementById("searchInput").focus();
          sonuclariCiz();
        }
      };
    });
  }catch(e){ hataGoster("Sonuçlar çizilemedi: " + e.message); }
}

function sepetSatiriniGuncelle(){
  try{
    var sayi = ProductData.sepetSayisi();
    document.getElementById("sepetSayisi").textContent = sayi + " ürün seçili";
    var btn = document.getElementById("btnSepeteDevam");
    btn.hidden = sayi === 0;
  }catch(e){ hataGoster("Sepet satırı güncellenemedi: " + e.message); }
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("searchInput").addEventListener("input", sonuclariCiz);
  document.getElementById("btnMenu").onclick = function(){ window.location.href = "menu.html"; };
  document.getElementById("btnSepeteDevam").onclick = function(){ window.location.href = "cart.html"; };
  ProductData.katalogDegistiginde(sonuclariCiz);
  sepetSatiriniGuncelle();
  sonuclariCiz();
});
