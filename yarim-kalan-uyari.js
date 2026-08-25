/*
  yarim-kalan-uyari.js
  =====================
  Eski uygulamanın anaMenuPopupAc()/yarimKalanIslemUyariGoster() mantığıyla
  AYNI: sepette ürün VE seçili müşteri varken "Ana Sayfa" linkine basılırsa,
  sepeti kaybetmeden önce uyarır. product.html, cart.html, calc.html'e
  eklenir — bağımsız çalışır, başka bir dosyaya ihtiyaç duymaz.
*/
(function(){
  function sepetDoluMu(){
    try{ return JSON.parse(localStorage.getItem("weiconv2_sepet")||"[]").length > 0; }
    catch(e){ return false; }
  }
  function seciliMusteriAdiniAl(){
    try{
      var m = JSON.parse(localStorage.getItem("weicon_secili_musteri")||"null");
      return m && m.ad ? m.ad : null;
    }catch(e){ return null; }
  }

  document.addEventListener("DOMContentLoaded", function(){
    var anaLink = document.querySelector(".nav-btn--ana");
    if(!anaLink) return;
    anaLink.addEventListener("click", function(ev){
      var musteriAdi = seciliMusteriAdiniAl();
      if(!sepetDoluMu() || !musteriAdi) return; // sepet boşsa veya müşteri seçili değilse normal git

      ev.preventDefault();
      var devamEt = confirm(
        "⚠️ Yarım Kalan İşlem\n\n\"" + musteriAdi + "\" için sepette ürün var.\n\n" +
        "Tamam: İşleme devam et (bu sayfada kal)\n" +
        "İptal: Sepeti boşalt ve Ana Sayfa'ya git"
      );
      if(devamEt) return; // sayfada kal, hiçbir şey yapma

      localStorage.setItem("weiconv2_sepet", "[]");
      localStorage.removeItem("weicon_secili_musteri");
      window.location.href = "home.html";
    });
  });
})();
