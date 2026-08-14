// Extracted from original index.html utility block 1
/* R003.1 Security/Utility Patch */
function safeText(v){
  return String(v??"").replace(/[<>&"'`]/g,function(c){
    return {"<":"&lt;",">":"&gt;","&":"&amp;",'"':"&quot;","'":"&#39;","`":"&#96;"}[c];
  });
}
function lsGet(key,def){
  try{return JSON.parse(localStorage.getItem(key))??def;}catch(e){return def;}
}
function lsSet(key,val){
  try{localStorage.setItem(key,JSON.stringify(val));return true;}catch(e){console.error(e);return false;}
}
window.addEventListener("error",e=>console.error("APP ERROR:",e.message));

// "Ana Ekrana Ekle" kısayolunun gerçek bir standalone uygulama (adres
// çubuksuz) olarak açılabilmesi için Service Worker kaydı gerekiyor —
// bu olmadan Chrome kısayolu sadece bir "yer imi" olarak oluşturuyordu.
if("serviceWorker" in navigator){
  window.addEventListener("load", function(){
    navigator.serviceWorker.register("sw.js").catch(function(e){
      console.error("Service Worker kayıt hatası:", e);
    });
  });
}

// Extracted from original index.html utility block 2
/* R003.4 DOM Optimization */
const qs=(s)=>document.querySelector(s);
const qsa=(s)=>document.querySelectorAll(s);

function setText(id,value){
  const el=document.getElementById(id);
  if(el && el.textContent!==String(value)){
    el.textContent=String(value);
  }
}

function safeNumber(v,def=0){
  const n=parseFloat(v);
  return Number.isFinite(n)?n:def;
}

// Extracted from original index.html utility block 3
/* R003.5 Render Cache */
const RenderCache={
  productFilter:"",
  lastHTML:"",
  basketVersion:0
};
function equalsHTML(a,b){return a===b;}

// Extracted from original index.html utility block 4
/* R003.6 Event & Memory Optimizations */
const EventRegistry = [];
function bindEvent(id,event,handler){
  const el=document.getElementById(id);
  if(!el) return;
  el.addEventListener(event,handler,{passive:event.startsWith("touch")});
  EventRegistry.push({id,event});
}
function clearNode(node){
  if(!node) return;
  while(node.firstChild){
    node.removeChild(node.firstChild);
  }
}
function rafUpdate(fn){
  requestAnimationFrame(fn);
}
