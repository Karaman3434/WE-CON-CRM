/* WEİCON ASİST — UI RENDER FIX
 * Amaç: mevcut dosya mimarisini değiştirmeden, ana ekranın üst üste binmesi,
 * yatay taşma ve birden fazla content-page'in aynı anda görünmesi sorunlarını
 * güvenli biçimde normalize etmek.
 */
(function () {
  "use strict";

  var STYLE_ID = "weicon-safe-ui-render-fix-v1";

  function installStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = [
      "html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;}",
      "html,body{width:100%!important;height:100%!important;max-width:100%!important;overflow:hidden!important;}",
      ".phone-container{width:100%!important;max-width:100vw!important;min-width:0!important;height:100vh!important;height:100dvh!important;min-height:0!important;margin-left:auto!important;margin-right:auto!important;transform:none!important;}",
      "#ustBaslikSatiri,#ustNavGrid{flex:0 0 auto!important;position:relative!important;z-index:1200!important;}",
      "#ustBaslikSatiri{min-height:0!important;}",
      "#ustNavGrid{min-height:0!important;}",
      ".content-page{width:100%!important;max-width:100%!important;min-width:0!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;position:relative!important;z-index:1!important;flex:1 1 0!important;}",
      ".content-page>*{box-sizing:border-box;min-width:0;max-width:100%;}",
      ".content-page:not(.active){display:none!important;}",
      ".content-page.active{display:flex!important;visibility:visible!important;position:relative!important;z-index:1!important;min-height:0!important;}",
      ".content-page.active .content-page{display:none!important;}",
      "#page8.active{overflow-x:hidden!important;}",
      "#page8.active .dashboard-grid,#page8.active .home-grid,#page8.active .stats-grid{width:100%!important;max-width:100%!important;min-width:0!important;box-sizing:border-box!important;}",
      "#page8.active .dashboard-grid>*,#page8.active .home-grid>*,#page8.active .stats-grid>*{min-width:0!important;max-width:100%!important;box-sizing:border-box!important;}",
      ".toast-notification{z-index:15000!important;}",
      "#ustMenuPopup{z-index:20000!important;}"
    ].join("");
    (document.head || document.documentElement).appendChild(style);
  }

  function ustPanelYuksekligiOlc() {
    var header = document.getElementById("ustBaslikSatiri");
    var nav = document.getElementById("ustNavGrid");
    var bottom = 0;
    if(header) bottom = Math.max(bottom, Math.ceil(header.getBoundingClientRect().bottom));
    if(nav) bottom = Math.max(bottom, Math.ceil(nav.getBoundingClientRect().bottom));
    if(bottom > 0) document.documentElement.style.setProperty("--ust-panel-h", bottom + "px");
  }
  window.ustPanelYuksekligiOlc = ustPanelYuksekligiOlc;

  function normalizePages() {
    var pages = Array.prototype.slice.call(document.querySelectorAll(".content-page"));
    if (!pages.length) return;

    var active = pages.filter(function (p) {
      return p.classList.contains("active");
    });

    if (active.length > 1) {
      // Aynı anda iki ekranın üst üste binmesini engelle.
      active.slice(1).forEach(function (p) {
        p.classList.remove("active");
      });
      active = active.slice(0, 1);
    }

    if (!active.length) {
      var home = document.getElementById("page8");
      if (home) home.classList.add("active");
    }
  }

  function start() {
    installStyle();
    normalizePages();
    ustPanelYuksekligiOlc();

    if (document.body && window.MutationObserver) {
      var pending = false;
      var observer = new MutationObserver(function () {
        if (pending) return;
        pending = true;
        window.requestAnimationFrame(function () {
          pending = false;
          normalizePages();
        });
      });
      observer.observe(document.body, {
        subtree: true,
        attributes: true,
        attributeFilter: ["class", "style"]
      });
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start, { once: true });
  } else {
    start();
  }
})();
