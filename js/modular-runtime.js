/* WE-CON-CRM Modular Runtime
 * Loads modular architecture after legacy page initialization.
 * History screen has an isolated lightweight renderer to prevent main-thread freezes.
 */
(function(global){
  'use strict';
  const MODULES=['js/core/app-state.js','js/core/event-bus.js','js/core/module-registry.js','js/firebase/firebase-gateway.js','js/firebase/storage-policy.js','js/firebase/legacy-read-adapter.js','js/customers/customer-model.js','js/customers/customer-repository.js','js/customers/customer-service.js','js/customers/customer-memory.js','js/customers/customer-read-bridge.js','js/customers/customer-memory-read-service.js','js/customers/customer-memory-ui-bridge.js','js/customers/customer-memory-ui-controller.js','js/customers/customer-memory-live-panel.js','js/customers/customer-selection-bridge.js','js/visits/activity-model.js','js/visits/activity-repository.js','js/visits/customer-activity-adapter.js','js/products/product-model.js','js/products/product-repository.js','js/pricelist/price-service.js','js/reports/report-model.js'];
  const state=global.WEICONModularRuntime={status:'loading',loaded:[],failed:[],startedAt:Date.now()};
  function load(src){return new Promise(function(resolve,reject){var s=document.createElement('script');s.src=src;s.async=false;s.onload=resolve;s.onerror=function(){reject(new Error('Module load failed: '+src));};document.head.appendChild(s);});}
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}
  function money(v){var n=Number(v);return isFinite(n)?n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':'0,00 €';}
  function archive(){try{return global.arsivData&&typeof global.arsivData==='object'?global.arsivData:{};}catch(e){return {};}}
  function fixCustomerCardFreeze(){if(typeof global.musteriKartAc!=='function'||global.__WEICON_CUSTOMER_CARD_FREEZE_FIX__)return;var source=global.musteriKartAc.toString(),re=/\n[ \t]*musteriListesiniKaydet\(\);/;if(!re.test(source))return;try{global.musteriKartAc=(new Function('return ('+source.replace(re,'')+')'))();global.__WEICON_CUSTOMER_CARD_FREEZE_FIX__=true;}catch(e){console.error(e);}}

  function renderHistorySafe(){
    var el=document.getElementById('gecmisIslemlerListesi');if(!el)return;
    var idx=global.musteriKartIdx,m=Array.isArray(global.musteriListesi)?global.musteriListesi[idx]:null;
    if(!m){el.innerHTML='<div style="padding:20px;color:#888;font-size:24px">Müşteri bulunamadı.</div>';return;}
    var a=archive(),types=['numune','teklif','proforma','siparis'],labels={numune:'NUMUNE',teklif:'FİYAT TEKLİFİ',proforma:'PROFORMA',siparis:'SİPARİŞ'},colors={numune:'#3498db',teklif:'#f39c12',proforma:'#8e44ad',siparis:'#16a085'},rows=[];
    for(var t=0;t<types.length;t++){var list=Array.isArray(a[types[t]])?a[types[t]]:[];for(var i=0;i<list.length;i++){var k=list[i],same=(m.id&&k.musteriId)?String(k.musteriId)===String(m.id):String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');if(same)rows.push({type:types[t],idx:i,kayit:k,ts:Number(k.ts)||0});}}
    rows.sort(function(x,y){return y.ts-x.ts;});
    global.__WEICON_HISTORY_ROWS__={customerKey:String(m.id||m.ad||''),rows:rows};
    var html='<div style="font-size:18px;font-weight:900;color:#003a70;margin-bottom:10px">'+rows.length+' işlem bulundu</div>';
    if(!rows.length){html+='<div style="color:#888;font-size:24px;padding:20px 0">Bu müşteri için kayıtlı işlem geçmişi yok.</div>';el.innerHTML=html;return;}
    var max=rows.length>100?100:rows.length;
    for(var r=0;r<max;r++){var x=rows[r],k=x.kayit,u=Array.isArray(k.urunler)?k.urunler:[],total=0;for(var q=0;q<u.length;q++)total+=Number(u[q].toplamEuro)||0;var names=[];for(var z=0;z<u.length;z++)names.push((u[z].name||u[z].ad||'Ürün')+(u[z].adet!=null?' × '+u[z].adet:''));html+='<div style="border:2px solid '+colors[x.type]+';border-radius:10px;padding:11px 12px;margin:0 0 9px;background:#fff"><div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><span style="background:'+colors[x.type]+';color:#fff;border-radius:14px;padding:4px 9px;font-size:12px;font-weight:900">'+labels[x.type]+'</span><span style="font-size:13px;color:#666;font-weight:800">'+esc(k.tarih||'')+'</span></div><div style="margin-top:7px;font-size:15px;font-weight:900;color:#003a70">'+esc(k.kod||k.kodNo||'-')+'</div><div style="margin-top:5px;font-size:14px;color:#333">'+(names.length?esc(names.join(' · ')):'Ürün bilgisi yok')+'</div><div style="margin-top:6px;font-size:15px;font-weight:900;color:#222">Toplam: '+money(total)+'</div></div>';}
    if(rows.length>max)html+='<div style="padding:10px;text-align:center;color:#777;font-weight:800">İlk '+max+' kayıt gösterildi.</div>';
    el.innerHTML=html;var rb=document.getElementById('gecmisRevizeBtn');if(rb)rb.style.display='none';
  }

  function openHistorySafe(){
    if(global.musteriKartIdx===null||global.musteriKartIdx===undefined)return;var m=global.musteriListesi&&global.musteriListesi[global.musteriKartIdx];if(!m)return;
    var title=document.getElementById('gecmisIslemlerBaslik');if(title)title.textContent='🕘 İşlem Geçmişi';var name=document.getElementById('gecmisIslemlerMusteriAd');if(name)name.textContent=m.ad||'';var card=document.getElementById('musteriKartModal');if(card)card.style.display='none';var modal=document.getElementById('musteriGecmisIslemlerModal');if(modal)modal.style.display='flex';var process=document.getElementById('surecListesiDiv');if(process)process.innerHTML='';var el=document.getElementById('gecmisIslemlerListesi');if(el)el.innerHTML='<div style="padding:18px;color:#777;font-size:20px">İşlem geçmişi yükleniyor…</div>';
    global.requestAnimationFrame(function(){try{renderHistorySafe();global.setTimeout(function(){if(typeof global.dispatchEvent==='function')global.dispatchEvent(new Event('weicon:customer-history-open'));},120);}catch(e){console.error('[WE-CON-CRM] History:',e);if(el)el.innerHTML='<div style="padding:20px;color:#c0392b;font-size:20px">İşlem geçmişi yüklenemedi.</div>';}});
  }

  async function boot(){for(const src of MODULES){try{await load(src);state.loaded.push(src);}catch(e){state.failed.push({src:src,message:e.message});}}fixCustomerCardFreeze();global.musteriGecmisRenderEt=renderHistorySafe;global.musteriGecmisIslemleriAc=openHistorySafe;global.__WEICON_HISTORY_SAFE_MODE__=true;state.status=state.failed.length?'degraded':'ready';state.finishedAt=Date.now();var registry=global.WEICONCRM&&global.WEICONCRM.modules;if(registry&&typeof registry.register==='function'&&!registry.has('modular-runtime'))registry.register('modular-runtime',{status:state.status,loaded:state.loaded.length,failed:state.failed.length});if(typeof global.CustomEvent==='function')global.dispatchEvent(new global.CustomEvent('weicon:modular-ready',{detail:state}));console.info('[WE-CON-CRM] Modular runtime:',state.status,state.loaded.length+'/'+MODULES.length,'history-safe-mode');}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
