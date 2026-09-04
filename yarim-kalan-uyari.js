/*
  yarim-kalan-uyari.js
  =====================
  Eski uygulamanın anaMenuPopupAc()/yarimKalanIslemUyariGoster() mantığıyla
  AYNI: sepette ürün VE seçili müşteri varken "Ana Sayfa" veya "Menü"ye
  basılırsa, sepeti kaybetmeden önce uyarır. product.html, cart.html,
  calc.html, send.html'e eklenir — bağımsız çalışır, başka bir dosyaya
  ihtiyaç duymaz. Sayfanın kendi btnMenu.onclick'i varsa (script sırası
  bu dosyadan önceyse) burada üzerine yazılır — bu kasıtlı, tek koruma
  noktası burası olsun diye.
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
  function korumaGerekliMi(){
    return sepetDoluMu() && !!seciliMusteriAdiniAl();
  }
  // true dönerse sepet temizlenmiş ve gidilebilir demektir; false ise
  // kullanıcı sayfada kalmayı seçti.
  function uyariGosterVeKararVer(){
    var musteriAdi = seciliMusteriAdiniAl();
    var devamEt = confirm(
      "⚠️ Yarım Kalan İşlem\n\n\"" + musteriAdi + "\" için sepette ürün var.\n\n" +
      "Tamam: İşleme devam et (bu sayfada kal)\n" +
      "İptal: Sepeti boşalt ve devam et"
    );
    if(devamEt) return false;
    localStorage.setItem("weiconv2_sepet", "[]");
    localStorage.removeItem("weicon_secili_musteri");
    return true;
  }

  document.addEventListener("DOMContentLoaded", function(){
    var anaLink = document.querySelector(".nav-btn--ana");
    if(anaLink){
      anaLink.addEventListener("click", function(ev){
        if(!korumaGerekliMi()) return; // sepet boşsa veya müşteri seçili değilse normal git
        ev.preventDefault();
        if(uyariGosterVeKararVer()) window.location.href = "home.html";
      });
    }

    var menuBtn = document.getElementById("btnMenu");
    if(menuBtn){
      menuBtn.onclick = function(){
        if(!korumaGerekliMi()){ window.location.href = "menu.html"; return; }
        if(uyariGosterVeKararVer()) window.location.href = "menu.html";
      };
    }
  });
})();
