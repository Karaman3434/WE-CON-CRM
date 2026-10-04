/*
  calc-render.js — WG.041026.0905.724
  ====================================
  04.10.2026 (Abdullah'ın isteğiyle, İKİNCİ büyük değişiklik) — bu sayfanın
  KENDİ hesaplama kopyası (eski hesaplaVeGoster/kur seçimi/geçmiş alım
  ipucu/bedelsiz-özel fiyat/sepete ekle mantığı, ~230 satır) tamamen
  kaldırıldı. Artık TEK görevi: arama kutusu + sonuç listesi + "işlemi
  iptal et" onayı. Hesaplamanın kendisi cart.html ile PAYLAŞILAN
  hesapla-popup.js'in #hpOverlay popup'ında yapılıyor (bkz. calc.html).

  Bu sayfada müşteri/CustomerData/ReportsData/MusteriSeridi YOK — hiç
  yüklenmiyor bile (bkz. calc.html script listesi) — "hesapla" izni olan
  bir çalışan bu sayfada müşteriyle ilgili hiçbir şey göremez.
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

function aramaSonuclariniCiz(){
  try{
    var q = document.getElementById("searchInput").value;
    var liste = document.getElementById("sonucListesi");
    if(q.trim().length === 0){ liste.innerHTML = ""; return; }

    var sonuclar = ProductData.ara(q).slice(0, 15);
    liste.innerHTML = sonuclar.map(function(s){
      var bilgi = ProductData.urunBilgisi(s.item);
      return "<div class='hesapla-arama-karti' data-idx='" + s.idx + "'>"
        + "<div class='hesapla-arama-bilgi'><div class='hesapla-arama-kod'>Berta: " + htmlEsc(bilgi.berta||"-") + "</div><div class='hesapla-arama-ad'>" + htmlEsc(bilgi.ad) + "</div></div>"
        + "<div class='hesapla-arama-fiyat'>" + bilgi.fiyat.toFixed(2) + " EUR</div>"
        + "</div>";
    }).join("");

    liste.querySelectorAll(".hesapla-arama-karti").forEach(function(kart, i){
      kart.onclick = function(){
        var bilgi = ProductData.urunBilgisi(sonuclar[i].item);
        HesaplaPopup.ac({ad:bilgi.ad, berta:bilgi.berta, abas:bilgi.abas, fiyat:bilgi.fiyat}, null);
        document.getElementById("searchInput").value = "";
        liste.innerHTML = "";
      };
    });
  }catch(e){ hataGoster("Arama sonuçları çizilemedi: " + e.message); }
}

function sepetDoluMu(){
  try{ return JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]").length > 0; }
  catch(e){ return false; }
}
function herSeyiSifirlaVeGit(hedefUrl){
  try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
  try{ localStorage.removeItem("weiconv2_sepet_kur_override"); }catch(e){}
  window.location.href = hedefUrl;
}
var iptalOnayHedefUrl = null;
function iptalOnayGoster(hedefUrl){
  iptalOnayHedefUrl = hedefUrl;
  document.getElementById("iptalOnayOverlay").hidden = false;
}

window.addEventListener("error", function(ev){
  hataGoster("HATA: " + ev.message + " (" + (ev.filename||"").split("/").pop() + ":" + ev.lineno + ")");
});

document.addEventListener("DOMContentLoaded", function(){
  tarihiGuncelle();
  document.getElementById("searchInput").addEventListener("input", aramaSonuclariniCiz);

  // "Listeye Ekle" tamamlanınca (04.10.2026): bu sayfa bağımsız/müşterisiz
  // bir hızlı hesaplama aracı olduğu için, eklenen ürünü görüp devam etmek
  // isteyip istemediği sorulur — evetse paylaşılan sepete (cart.html)
  // gidilir (eskiden calc-render.js'in kendi sepeteEkleyiTamamla'sı bunu
  // yapıyordu, artık ortak hesapla-popup.js tamamlayıp bu kancayı çağırıyor).
  HesaplaPopup.onEklendi(function(){
    if(confirm("✓ Listeye eklendi. Sepete gidip devam etmek ister misin?")){
      window.location.href = "cart.html";
    }
  });

  // Sepet sızıntısı düzeltmesi (22.09.2026'dan beri korunan davranış):
  // Hesaplama sayfasından Geri, Ana Sayfa veya Kapat ile ayrılınca sepet
  // SESSİZCE (sormadan) sıfırlanır — bir sonraki kullanımda eski ürünler
  // "hayalet" olarak kalmasın diye.
  function sepetiSessizceTemizle(){
    try{ localStorage.setItem("weiconv2_sepet", "[]"); }catch(e){}
    try{ localStorage.removeItem("weiconv2_sepet_kur_override"); }catch(e){}
  }
  var geriLink = document.querySelector(".nav-btn--geri");
  if(geriLink) geriLink.addEventListener("click", sepetiSessizceTemizle);
  var anaLink = document.querySelector(".nav-btn--ana");
  if(anaLink) anaLink.addEventListener("click", sepetiSessizceTemizle);

  document.getElementById("btnIptalOnayEvet").onclick = function(){
    var hedef = iptalOnayHedefUrl || "home.html";
    document.getElementById("iptalOnayOverlay").hidden = true;
    herSeyiSifirlaVeGit(hedef);
  };
  document.getElementById("btnIptalOnayVazgec").onclick = function(){
    document.getElementById("iptalOnayOverlay").hidden = true;
    iptalOnayHedefUrl = null;
  };
});
