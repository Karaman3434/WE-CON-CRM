// WEICON ASİST — UI RENDER / NAVIGATION SAFETY LAYER
// W230826.0824.01
// Bu katman veri kaydetmez; yalnızca navigasyonun DOM tarafındaki güvenliğini sağlar.
// Amaç: geçersiz sayfa çağrıları, eksik DOM elemanları ve aynı anda gelen geçişlerin
// uygulamanın UI katmanını yarım durumda bırakmasını önlemek.
(function(){
  "use strict";
  function kur(){
    if(typeof window.switchTab !== "function" || window.__weiconSwitchTabGuarded) return;
    var original = window.switchTab;
    window.__weiconOriginalSwitchTab = original;

    window.switchTab = function(n){
      n = Number(n);
      if(!Number.isInteger(n)) return;
      var page = document.getElementById("page"+n);
      if(!page){
        console.warn("WEICON UI: olmayan sayfaya geçiş engellendi:", n);
        return;
      }

      // Orijinal fonksiyonun beklediği DOM elemanları yoksa sessizce çökmesini önle.
      // Kritik olmayan render fonksiyonları yine kendi kontrollerini yapar.
      try {
        return original.call(this, n);
      } catch(err) {
        console.error("WEICON UI switchTab hatası:", n, err);
        // UI'ı güvenli biçimde hedef sayfaya getir.
        try{
          document.querySelectorAll(".content-page").forEach(function(el){
            el.classList.remove("active");
          });
          page.classList.add("active");
          window.activeCurrentPage = n;
          if(typeof window.navTabsGuncelle === "function") window.navTabsGuncelle();
        }catch(recoverErr){
          console.error("WEICON UI kurtarma hatası:", recoverErr);
        }
      }
    };

    window.__weiconSwitchTabGuarded = true;
  }

  if(document.readyState === "loading"){
    document.addEventListener("DOMContentLoaded", kur, {once:true});
  } else {
    kur();
  }
  window.addEventListener("load", kur, {once:true});
})();
