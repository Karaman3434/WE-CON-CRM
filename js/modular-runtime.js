/* WE-CON-CRM Modular Runtime
 * Loads the new architecture after the legacy page has initialized.
 * Performance fixes are applied after legacy initialization without deleting legacy features.
 */
(function (global) {
  'use strict';

  const MODULES = [
    'js/core/app-state.js','js/core/event-bus.js','js/core/module-registry.js',
    'js/firebase/firebase-gateway.js','js/firebase/storage-policy.js','js/firebase/legacy-read-adapter.js',
    'js/customers/customer-model.js','js/customers/customer-repository.js','js/customers/customer-service.js',
    'js/customers/customer-memory.js','js/customers/customer-read-bridge.js','js/customers/customer-memory-read-service.js',
    'js/customers/customer-memory-ui-bridge.js','js/customers/customer-memory-ui-controller.js','js/customers/customer-memory-live-panel.js',
    'js/customers/customer-selection-bridge.js','js/visits/activity-model.js','js/visits/activity-repository.js',
    'js/visits/customer-activity-adapter.js','js/products/product-model.js','js/products/product-repository.js',
    'js/pricelist/price-service.js','js/reports/report-model.js'
  ];

  const state = global.WEICONModularRuntime = {status:'loading',loaded:[],failed:[],startedAt:Date.now()};

  function load(src){return new Promise(function(resolve,reject){var script=document.createElement('script');script.src=src;script.async=false;script.onload=resolve;script.onerror=function(){reject(new Error('Module load failed: '+src));};document.head.appendChild(script);});}

  function fixCustomerCardFreeze(){
    if(global.__WEICON_CUSTOMER_CARD_FREEZE_FIX__) return;
    if(typeof global.musteriKartAc!=='function') return;
    var source=global.musteriKartAc.toString();
    var oldCall=/\n[ \t]*musteriListesiniKaydet\(\);/;
    if(!oldCall.test(source)) return;
    try{global.musteriKartAc=(new Function('return ('+source.replace(oldCall,'')+')'))();global.__WEICON_CUSTOMER_CARD_FREEZE_FIX__=true;}catch(e){console.error('[WE-CON-CRM] Müşteri kartı düzeltmesi uygulanamadı:',e);}
  }

  // İşlem Geçmişi'nin kritik yolu: legacy kod her açılışta localStorage'dan
  // bütün arşivi tekrar JSON.parse ediyordu. Uygulama zaten arsivData'yı RAM'de
  // tutuyor; bu yüzden geçmiş ekranında aynı veriyi tekrar parse etmiyoruz.
  function fixHistoryArchiveReads(){
    if(global.__WEICON_HISTORY_ARCHIVE_READ_FIX__) return;
    ['musteriGecmisRenderEt','surecListesiRenderEt'].forEach(function(name){
      if(typeof global[name]!=='function') return;
      var source=global[name].toString();
      var old='lsGet("weicon_arsiv",{})';
      if(source.indexOf(old)===-1) return;
      var patched=source.replace(new RegExp(old.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'g'), '(global.arsivData && typeof global.arsivData === "object" ? global.arsivData : lsGet("weicon_arsiv",{}))');
      try{global[name]=(new Function('global','return ('+patched+')'))(global);}catch(e){console.error('[WE-CON-CRM] '+name+' performans düzeltmesi uygulanamadı:',e);}
    });
    global.__WEICON_HISTORY_ARCHIVE_READ_FIX__=true;
  }

  // Modalı önce görünür yap, ağır liste oluşturmayı bir sonraki frame'e bırak.
  // Böylece Android/Chrome dokunuşa anında cevap verir.
  function fixHistoryOpen(){
    if(global.__WEICON_HISTORY_OPEN_FIX__) return;
    if(typeof global.musteriGecmisIslemleriAc!=='function') return;
    var source=global.musteriGecmisIslemleriAc.toString();
    if(source.indexOf('musteriGecmisRenderEt();')===-1) return;
    var replacement='document.getElementById("musteriKartModal").style.display="none"; document.getElementById("musteriGecmisIslemlerModal").style.display="flex"; global.requestAnimationFrame(function(){ try { musteriGecmisRenderEt(); global.dispatchEvent(new Event("weicon:customer-history-open")); } catch(e) { console.error("[WE-CON-CRM] İşlem Geçmişi render hatası:",e); } }); return;';
    var patched=source.replace('musteriGecmisRenderEt();',replacement);
    try{global.musteriGecmisIslemleriAc=(new Function('global','return ('+patched+')'))(global);global.__WEICON_HISTORY_OPEN_FIX__=true;}catch(e){console.error('[WE-CON-CRM] İşlem Geçmişi açılış düzeltmesi uygulanamadı:',e);}
  }

  function fixHistoryRefreshes(){
    if(global.__WEICON_HISTORY_REFRESH_FIX__) return;
    var old=global.musteriGecmisRenderEt;
    if(typeof old!=='function') return;
    var wrapped=function(){return old.apply(this,arguments);};
    global.musteriGecmisRenderEt=wrapped;
    global.__WEICON_HISTORY_REFRESH_FIX__=true;
  }

  async function boot(){
    for(const src of MODULES){try{await load(src);state.loaded.push(src);}catch(error){state.failed.push({src:src,message:error.message});}}
    fixCustomerCardFreeze();
    fixHistoryArchiveReads();
    fixHistoryOpen();
    fixHistoryRefreshes();
    state.status=state.failed.length?'degraded':'ready';
    state.finishedAt=Date.now();
    const registry=global.WEICONCRM&&global.WEICONCRM.modules;
    if(registry&&typeof registry.register==='function'&&!registry.has('modular-runtime')) registry.register('modular-runtime',{status:state.status,loaded:state.loaded.length,failed:state.failed.length});
    if(typeof global.CustomEvent==='function') global.dispatchEvent(new global.CustomEvent('weicon:modular-ready',{detail:state}));
    console.info('[WE-CON-CRM] Modular runtime:',state.status,state.loaded.length+'/'+MODULES.length);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
