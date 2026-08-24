/* WEİCON ASİST — DEEP UI + DATA INTEGRITY FIX */
(function(){
  "use strict";
  var STYLE_ID="weicon-deep-ui-data-integrity-v2";

  function meaningfulArchive(a){
    if(!a||typeof a!=="object") return false;
    return ["siparis","teklif","proforma","numune"].some(function(k){return Array.isArray(a[k])&&a[k].length>0;});
  }
  function normalizeArchive(a){
    a=(a&&typeof a==="object")?a:{};
    ["siparis","teklif","proforma","numune"].forEach(function(k){if(!Array.isArray(a[k]))a[k]=[];});
    return a;
  }
  function meaningfulCustomers(a){
    if(Array.isArray(a)) return a.length>0;
    return !!(a&&typeof a==="object"&&Object.keys(a).length);
  }
  function asCustomerArray(a){
    if(Array.isArray(a)) return a;
    if(a&&typeof a==="object") return Object.keys(a).map(function(k){return a[k];}).filter(Boolean);
    return [];
  }
  function rerender(){
    try{
      if(typeof sonIslemleriRenderEt==="function")sonIslemleriRenderEt();
      if(typeof istatistikHesapla==="function")istatistikHesapla();
      if(typeof bildirimBannerGuncelle==="function")bildirimBannerGuncelle();
      if(typeof anaSayfaRenderEt==="function")anaSayfaRenderEt();
      if(typeof activeCurrentPage!=="undefined"&&activeCurrentPage===7&&typeof musteriListesiniRenderEt==="function")musteriListesiniRenderEt();
      if(typeof musteriGecmisRenderEt==="function"&&typeof musteriKartIdx!=="undefined"&&musteriKartIdx!==null)musteriGecmisRenderEt();
    }catch(e){console.error("WEİCON deep rerender",e);}
  }
  function hydrate(path){
    if(!window.fbGet)return Promise.reject(new Error("Firebase okuma API hazır değil"));
    return window.fbGet(path).then(function(data){
      if(typeof weiconSunucuVerisiniGuvenliUygula==="function"){
        weiconSunucuVerisiniGuvenliUygula(path,data);
      }else if(path==="arsiv"){
        var server=normalizeArchive(data), local=normalizeArchive(lsGet("weicon_arsiv",{}));
        if(meaningfulArchive(server)||!meaningfulArchive(local)){
          arsivData=server; lsSet("weicon_arsiv",server);
        }else{
          arsivData=local; lsSet("weicon_arsiv",local);
          console.warn("WEİCON: boş Firebase arşivi nedeniyle yerel arşiv korunuyor.");
        }
      }else if(path==="musteriler"){
        var serverM=asCustomerArray(data), localM=asCustomerArray(lsGet("weicon_musteriler",[]));
        if(meaningfulCustomers(serverM)||!meaningfulCustomers(localM)){
          musteriListesi=serverM;
          if(typeof musteriIdEksikleriTamamla==="function")musteriIdEksikleriTamamla();
          lsSet("weicon_musteriler",musteriListesi);
        }else{
          musteriListesi=localM; lsSet("weicon_musteriler",localM);
          console.warn("WEİCON: boş Firebase müşteri verisi nedeniyle yerel liste korunuyor.");
        }
      }
      rerender();
      return data;
    });
  }
  var busy=false;
  function deepHydrate(){
    if(busy||!window.fbGet)return;
    busy=true;
    Promise.allSettled([hydrate("musteriler"),hydrate("arsiv")]).finally(function(){
      busy=false; rerender();
    });
  }
  function installRecovery(){
    if(window.firebaseHazir)deepHydrate();
    else window.addEventListener("firebaseHazir",function(){setTimeout(deepHydrate,150);},{once:true});
    [1200,3000,7000].forEach(function(ms){setTimeout(function(){if(window.firebaseHazir)deepHydrate();},ms);});
    window.addEventListener("online",function(){setTimeout(deepHydrate,250);});
    document.addEventListener("visibilitychange",function(){if(document.visibilityState==="visible")setTimeout(deepHydrate,250);});
  }
  function installNavigation(){
    var style=document.getElementById(STYLE_ID)||document.createElement("style");
    style.id=STYLE_ID;
    style.textContent=[
      "html,body{width:100%!important;max-width:100%!important;height:100%!important;overflow:hidden!important;}",
      ".phone-container{width:100%!important;max-width:100vw!important;min-width:0!important;height:100dvh!important;min-height:0!important;overflow:hidden!important;transform:none!important;display:grid!important;grid-template-rows:auto auto minmax(0,1fr)!important;align-content:stretch!important;}",
      "#ustBaslikSatiri,#ustNavGrid{flex:none!important;position:relative!important;z-index:50000!important;isolation:isolate!important;background:#fff!important;overflow:visible!important;min-height:0!important;}",
      ".content-page{width:100%!important;max-width:100%!important;min-width:0!important;height:100%!important;min-height:0!important;max-height:none!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;position:relative!important;z-index:1!important;flex:initial!important;overscroll-behavior:contain!important;grid-row:3!important;}",
      ".content-page:not(.active){display:none!important;}",
      ".content-page.active{display:flex!important;visibility:visible!important;position:relative!important;z-index:1!important;min-height:0!important;}",
      ".content-page.active .content-page{display:none!important;}",
      "#bildirimBanner{position:relative!important;z-index:2!important;}",
      ".toast-notification{z-index:60000!important;}",
      "#undoToast{z-index:60001!important;}",
      "#ustMenuPopup{z-index:65000!important;}",
      "body{overscroll-behavior:none!important;}",
      "@media(max-width:600px){.content-page{scrollbar-width:none!important}.content-page::-webkit-scrollbar{width:0!important;height:0!important}}"
    ].join("");
    (document.head||document.documentElement).appendChild(style);
    var refresh=function(){try{if(typeof ustPanelYuksekligiOlc==="function")ustPanelYuksekligiOlc();}catch(e){}};
    window.addEventListener("resize",refresh,{passive:true});
    window.addEventListener("orientationchange",function(){setTimeout(refresh,100);},{passive:true});
    if(window.ResizeObserver){
      ["ustBaslikSatiri","ustNavGrid"].forEach(function(id){
        var el=document.getElementById(id); if(el)new ResizeObserver(refresh).observe(el);
      });
    }
  }
  function installCustomerVisibility(){
    if(typeof musteriPanelAc!=="function")return;
    var original=window.musteriPanelAc;
    if(original.__deepWrapped)return;
    var wrapped=function(){
      try{if(typeof tumMusterilerModuAktif!=="undefined")tumMusterilerModuAktif=true;}catch(e){}
      return original.apply(this,arguments);
    };
    wrapped.__deepWrapped=true;
    window.musteriPanelAc=wrapped;
  }
  function installCacheGuard(){
    if(!navigator.serviceWorker)return;
    navigator.serviceWorker.getRegistration().then(function(reg){
      if(reg&&reg.update)reg.update().catch(function(){});
    }).catch(function(){});
  }
  function normalizePages(){
    var pages=[].slice.call(document.querySelectorAll(".content-page"));
    var active=pages.filter(function(p){return p.classList.contains("active");});
    if(active.length>1)active.slice(1).forEach(function(p){p.classList.remove("active");});
    if(!active.length){var home=document.getElementById("page8");if(home)home.classList.add("active");}
  }
  function start(){
    installNavigation(); installCustomerVisibility(); installRecovery(); installCacheGuard(); normalizePages();
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",start,{once:true});else start();
})();
