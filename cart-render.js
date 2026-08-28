/*
  cart-render.js
  ==============
  Sepeti HESAPLANACAK (sarı) / HESAPLANDI (yeşil) belge-tablosu gruplarıyla
  çizer (bkz. hareket-tablo.js). Bekleyen bir ürün satırına dokununca TEK
  hesaplama ekranı olan calc.html'e gidilir (düzenleme modu); hesaplanmış
  bir ürüne dokununca da aynı ekrana, mevcut değerlerle önceden dolu
  şekilde geri dönülüp düzeltme yapılabilir. Tüm ürünler hesaplanmadan
  Kaydet/Gönder pasif kalır.
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

function urunuHesaplamayaGonder(idx){
  localStorage.setItem("weiconv2_hesapla_duzenle_idx", idx);
  window.location.href = "calc.html";
}

function sayfayiCiz(){
  try{
    var liste = CartData.liste();
    var bosMesaj = document.getElementById("sepetBosMesaj");
    var altButonSatiri = document.getElementById("sepetAltButonSatiri");
    var devamUyari = document.getElementById("devamUyari");
    var grupSariAlani = document.getElementById("grupSariAlani");
    var grupYesilAlani = document.getElementById("grupYesilAlani");

    if(liste.length === 0){
      grupSariAlani.innerHTML = "";
      grupYesilAlani.innerHTML = "";
      bosMesaj.hidden = false;
      altButonSatiri.hidden = true;
      document.getElementById("btnSepetIptal").hidden = true;
      devamUyari.hidden = true;
      return;
    }
    bosMesaj.hidden = true;
    altButonSatiri.hidden = false;
    document.getElementById("btnSepetIptal").hidden = false;

    var kur = CartData.kurOku();
    var kdv = CartData.kdvOku();
    var hesapla = function(u){ return CartData.hesapla(u, kur, kdv); };

    var bekleyenler = liste.filter(function(u){ return !u.hesaplandi; });
    var hesaplananlar = liste.filter(function(u){ return u.hesaplandi; });

    grupSariAlani.innerHTML = bekleyenler.length === 0 ? "" : HareketTablo.grupHtml({
      etiket: "🟡 HESAPLANACAK",
      urunler: bekleyenler,
      hesapla: function(){ return null; },
      zeminSinifi: "hareket-satir--sari"
    });

    var hesaplananToplam = 0;
    hesaplananlar.forEach(function(u){ hesaplananToplam += hesapla(u).toplamEuro; });
    grupYesilAlani.innerHTML = hesaplananlar.length === 0 ? "" : HareketTablo.grupHtml({
      etiket: "🟢 HESAPLANDI",
      urunler: hesaplananlar,
      hesapla: hesapla,
      zeminSinifi: "hareket-satir--yesil",
      genelToplam: hesaplananToplam
    });

    // Her iki gruptaki ürün satırlarına dokununca hesaplama ekranına git
    // (bekleyen: ilk kez hesapla; hesaplanmış: değerleri düzeltmek için).
    // Silme işlevi artık PRİM sütununda değil, SIRA sütununda: numaraya
    // dokununca aynı hücrede küçük bir 🗑️ butonu belirir, ona basınca
    // (onay sonrası) ürün sepetten kaldırılır. Böylece ÜRÜN BİLGİSİ
    // sütununa (Berta/Abas + ad) daha fazla yer kalıyor.
    function siraHucresineSilTiklamasiEkle(tr, urun){
      var siraHucre = tr.querySelector("td.belge-td-sira");
      if(!siraHucre) return;
      var orijinalSira = siraHucre.textContent;
      function numaraHalineGetir(){
        siraHucre.innerHTML = "<span class='sepet-sira-numara'>" + orijinalSira + "</span>";
        siraHucre.querySelector(".sepet-sira-numara").onclick = function(e){
          e.stopPropagation();
          silButonuHalineGetir();
        };
      }
      function silButonuHalineGetir(){
        siraHucre.innerHTML = "<button class='sepet-sira-sil-btn' title='Sil'>🗑️</button>";
        siraHucre.querySelector("button").onclick = function(e){
          e.stopPropagation();
          if(!confirm(urun.ad + " sepetten kaldırılsın mı?")){ numaraHalineGetir(); return; }
          CartData.sil(urun.idx);
          sayfayiCiz();
        };
      }
      numaraHalineGetir();
    }
    grupSariAlani.querySelectorAll("tbody tr").forEach(function(tr, i){
      tr.style.cursor = "pointer";
      var urun = bekleyenler[i];
      tr.onclick = function(){ urunuHesaplamayaGonder(urun.idx); };
      siraHucresineSilTiklamasiEkle(tr, urun);
    });
    grupYesilAlani.querySelectorAll("tbody tr").forEach(function(tr, i){
      tr.style.cursor = "pointer";
      var urun = hesaplananlar[i];
      tr.onclick = function(){ urunuHesaplamayaGonder(urun.idx); };
      siraHucresineSilTiklamasiEkle(tr, urun);
    });

    var tamamMi = CartData.tamamHesaplandiMi();
    document.getElementById("btnSepetKaydet").disabled = !tamamMi;
    document.getElementById("btnSepetGonder").disabled = !tamamMi;
    devamUyari.hidden = tamamMi;
  }catch(e){ hataGoster("Sepet çizilemedi: " + e.message); }
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

  function devamEt(intent){
    if(!CartData.tamamHesaplandiMi()) return;
    localStorage.setItem("weiconv2_sepet_intent", intent);
    var onceSecilmisMi = false;
    try{ onceSecilmisMi = !!JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null"); }catch(e){}
    window.location.href = onceSecilmisMi ? "send.html" : "customer.html";
  }
  document.getElementById("btnSepetKaydet").onclick = function(){ devamEt("kaydet"); };
  document.getElementById("btnSepetGonder").onclick = function(){ devamEt("gonder"); };
  document.getElementById("btnSepetIptal").onclick = function(){
    if(!confirm("Bu işlemi iptal edip sepetteki TÜM ürünleri kaldırmak istediğinden emin misin? Bu geri alınamaz.")) return;
    localStorage.setItem("weiconv2_sepet", "[]");
    window.location.href = "home.html";
  };

  sayfayiCiz();
});
