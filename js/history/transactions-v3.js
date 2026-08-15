/* WE-CON-CRM — İşlemler V3
 * Bağımsız İşlemler ekranı. Eski geçmiş modalını kullanmaz.
 * Müşteri Hafızası korunur; bu modül yalnızca okur.
 */
(function(global){
  'use strict';
  if(global.__WEICON_TRANSACTIONS_V3__) return;
  global.__WEICON_TRANSACTIONS_V3__=true;

  var TYPES=['siparis','teklif','proforma','numune'];
  var LABEL={siparis:'SİPARİŞ',teklif:'FİYAT TEKLİFİ',proforma:'PROFORMA',numune:'NUMUNE'};
  var COLOR={siparis:'#16a085',teklif:'#f2994a',proforma:'#8e44ad',numune:'#3498db'};
  var state={rows:[],page:0,pageSize:15,filter:'all',query:'',customer:null};
  var MODAL='weicon-transactions-v3-modal';

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function money(v){var n=Number(v);return isFinite(n)?n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €':'0,00 €';}
  function customer(){
    var list=Array.isArray(global.musteriListesi)?global.musteriListesi:[];
    var idx=global.musteriKartIdx;
    return idx!==null&&idx!==undefined?list[idx]:null;
  }
  function archive(){return global.arsivData&&typeof global.arsivData==='object'?global.arsivData:null;}
  function same(k,m){
    if(!k||!m)return false;
    if(m.id&&k.musteriId)return String(m.id)===String(k.musteriId);
    return String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');
  }
  function timestamp(k){return Number(k&&k.ts)||Date.parse(k&&k.tarih||'')||0;}
  function rowsFor(m){
    var a=archive(),out=[];
    if(!a)return out;
    for(var t=0;t<TYPES.length;t++){
      var type=TYPES[t],list=Array.isArray(a[type])?a[type]:[];
      for(var i=0;i<list.length;i++){
        var k=list[i];
        if(same(k,m))out.push({type:type,index:i,k:k,ts:timestamp(k)});
      }
    }
    out.sort(function(a,b){return b.ts-a.ts;});
    return out;
  }
  function total(k){
    var u=Array.isArray(k&&k.urunler)?k.urunler:0,t=0;
    for(var i=0;i<u.length;i++)t+=Number(u[i].toplamEuro)||0;
    return t;
  }
  function getModal(){return document.getElementById(MODAL);}
  function ensureModal(){
    var old=getModal();if(old)return old;
    var m=document.createElement('div');m.id=MODAL;
    m.style.cssText='position:fixed;inset:0;background:rgba(0,0,0,.58);z-index:2147483001;display:none;align-items:flex-start;justify-content:center;padding:12px;box-sizing:border-box;overflow:auto';
    m.innerHTML='<div style="width:min(760px,100%);margin-top:12px;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 20px 60px rgba(0,0,0,.28)">'+
      '<div style="background:#003a70;color:#fff;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px"><div><div style="font-size:23px;font-weight:900">İŞLEMLER</div><div id="weiconTxCustomer" style="font-size:14px;opacity:.9"></div></div><button id="weiconTxClose" type="button" style="border:0;background:transparent;color:#fff;font-size:30px;font-weight:900;padding:0 4px">×</button></div>'+
      '<div style="padding:12px 14px"><div style="display:flex;gap:8px;flex-wrap:wrap"><select id="weiconTxFilter" style="flex:1;min-width:160px;padding:11px;border:1px solid #ccd5df;border-radius:8px;font-size:15px"><option value="all">TÜMÜ</option><option value="siparis">SİPARİŞ</option><option value="teklif">FİYAT TEKLİFİ</option><option value="proforma">PROFORMA</option><option value="numune">NUMUNE</option></select><input id="weiconTxSearch" placeholder="Kod / ürün ara" style="flex:2;min-width:180px;padding:11px;border:1px solid #ccd5df;border-radius:8px;font-size:15px"></div><div id="weiconTxSummary" style="padding:10px 0;font-size:13px;color:#667085;font-weight:800"></div><div id="weiconTxList"></div><div id="weiconTxPager" style="display:flex;gap:8px;justify-content:center;padding-top:10px"></div></div></div>';
    document.body.appendChild(m);
    m.querySelector('#weiconTxClose').onclick=close;
    m.addEventListener('click',function(e){if(e.target===m)close();});
    m.querySelector('#weiconTxFilter').onchange=function(){state.filter=this.value;state.page=0;render();};
    m.querySelector('#weiconTxSearch').oninput=function(){state.query=this.value.trim().toLocaleLowerCase('tr-TR');state.page=0;render();};
    return m;
  }
  function filtered(){
    var q=state.query, f=state.filter;
    return state.rows.filter(function(r){
      if(f!=='all'&&r.type!==f)return false;
      if(!q)return true;
      var k=r.k,u=Array.isArray(k.urunler)?k.urunler:[];
      var hay=String(k.kod||k.kodNo||'')+' '+u.map(function(x){return x.name||x.ad||'';}).join(' ');
      return hay.toLocaleLowerCase('tr-TR').indexOf(q)!==-1;
    });
  }
  function render(){
    var m=getModal();if(!m)return;
    var list=filtered(),start=state.page*state.pageSize,end=Math.min(start+state.pageSize,list.length),pageRows=list.slice(start,end);
    var totalPages=Math.max(1,Math.ceil(list.length/state.pageSize));if(state.page>=totalPages)state.page=totalPages-1;
    var sum=document.getElementById('weiconTxSummary');if(sum)sum.textContent=list.length+' işlem · Sayfa '+(state.page+1)+' / '+totalPages;
    var el=document.getElementById('weiconTxList');if(!el)return;
    if(!pageRows.length){el.innerHTML='<div style="padding:28px 8px;text-align:center;color:#7b8794;font-size:16px">Bu müşteri için işlem bulunamadı.</div>';}
    else{
      var html='';
      for(var i=0;i<pageRows.length;i++){
        var r=pageRows[i],k=r.k,u=Array.isArray(k.urunler)?k.urunler:[];
        var products=u.slice(0,3).map(function(x){return esc(x.name||x.ad||'Ürün')+(x.adet!=null?' × '+esc(x.adet):'');}).join(' · ');
        html+='<article style="border:1px solid #d9e1ea;border-left:5px solid '+COLOR[r.type]+';border-radius:10px;padding:12px;margin-bottom:9px;background:#fff">'+
          '<div style="display:flex;justify-content:space-between;gap:8px;align-items:center"><b style="color:'+COLOR[r.type]+'">'+LABEL[r.type]+'</b><span style="font-size:13px;color:#667085">'+esc(k.tarih||'-')+'</span></div>'+ 
          '<div style="margin-top:7px;font-weight:900;color:#003a70">'+esc(k.kod||k.kodNo||'Kayıt')+'</div>'+ 
          '<div style="margin-top:5px;font-size:14px;color:#344054">'+(products||'Ürün bilgisi yok')+'</div>'+ 
          '<div style="margin-top:7px;font-weight:900">'+money(total(k))+'</div></article>';
      }
      el.innerHTML=html;
    }
    var p=document.getElementById('weiconTxPager');
    if(p){p.innerHTML='';if(totalPages>1){var prev=document.createElement('button');prev.textContent='‹ Önceki';prev.disabled=state.page===0;prev.onclick=function(){state.page--;render();};var next=document.createElement('button');next.textContent='Sonraki ›';next.disabled=state.page>=totalPages-1;next.onclick=function(){state.page++;render();};[prev,next].forEach(function(b){b.style.cssText='padding:9px 14px;border:1px solid #cbd5e1;border-radius:8px;background:#f8fafc;font-weight:800';p.appendChild(b);});}}
  }
  function open(){
    var m=customer();if(!m)return;
    var modal=ensureModal();state.customer=m;state.rows=rowsFor(m);state.page=0;state.filter='all';state.query='';
    document.getElementById('weiconTxCustomer').textContent=m.ad||'';
    document.getElementById('weiconTxFilter').value='all';document.getElementById('weiconTxSearch').value='';
    modal.style.display='flex';
    render();
    if(typeof global.CustomEvent==='function')global.dispatchEvent(new global.CustomEvent('weicon:customer-history-open',{detail:{customer:m,rows:state.rows}}));
  }
  function close(){var m=getModal();if(m)m.style.display='none';}
  function intercept(e){
    var node=e.target;
    while(node&&node!==document.body){
      var text=String(node.innerText||node.textContent||'').trim().toLocaleLowerCase('tr-TR');
      if((node.tagName==='BUTTON'||node.tagName==='A'||node.getAttribute&&node.getAttribute('role')==='button') && /işlemler|işlem geçmişi/.test(text)){
        e.preventDefault();e.stopPropagation();if(e.stopImmediatePropagation)e.stopImmediatePropagation();open();return false;
      }
      node=node.parentElement;
    }
  }
  function boot(){document.addEventListener('click',intercept,true);}
  global.WEICONTransactionsV3=Object.freeze({open:open,close:close,refresh:function(){if(getModal()&&getModal().style.display!=='none'){var m=customer();if(m){state.rows=rowsFor(m);render();}}}});
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
