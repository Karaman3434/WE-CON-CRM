/* WEICON ASIST — Müşteri Hafızası / İşlem Geçmişi entegrasyonu */
(function(global){
  'use strict';
  if(global.__WEICON_MEMORY_V6__) return;
  global.__WEICON_MEMORY_V6__ = true;

  var PANEL_ID='weicon-customer-memory-card';
  var TYPES=['numune','teklif','proforma','siparis'];
  var LABELS={numune:'NUMUNE',teklif:'TEKLİF',proforma:'PROFORMA',siparis:'SİPARİŞ'};

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function num(v){var n=Number(v);return isFinite(n)?n:0;}
  function money(v){return num(v).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
  function archive(){try{if(typeof global.lsGet==='function')return global.lsGet('weicon_arsiv',{})||{};return JSON.parse(localStorage.getItem('weicon_arsiv')||'{}');}catch(e){return {};}}
  function customer(){try{if(typeof global.musteriKartIdx!=='undefined'&&Array.isArray(global.musteriListesi)&&global.musteriListesi[global.musteriKartIdx])return global.musteriListesi[global.musteriKartIdx];}catch(e){}return null;}
  function same(k,m){if(!k||!m)return false;if(m.id&&k.musteriId)return String(m.id)===String(k.musteriId);return String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');}
  function ts(k){var n=Number(k&&k.ts)||0;if(n)return n;var d=Date.parse(k&&k.tarih||'');return isNaN(d)?0:d;}
  function allRecords(m){var a=archive(),out=[];TYPES.forEach(function(type){(a[type]||[]).forEach(function(k,idx){if(same(k,m))out.push({type:type,idx:idx,kayit:k,ts:ts(k)});});});return out.sort(function(a,b){return b.ts-a.ts;});}
  function orderAmount(r){if(!r)return 0;var total=0;(r.kayit.urunler||[]).forEach(function(u){total+=num(u.toplamEuro!=null?u.toplamEuro:num(u.iskBirim)*num(u.adet));});return total;}
  function productCount(all){var set={};all.forEach(function(r){(r.kayit.urunler||[]).forEach(function(u){var n=String(u.name||'').trim();if(n)set[n]=true;});});return Object.keys(set).length;}
  function allAmount(all){var t=0;all.forEach(function(r){t+=orderAmount(r);});return t;}
  function formatDate(v){if(!v)return '-';var d=new Date(v);return isNaN(d.getTime())?String(v):d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});}

  function styles(){
    if(document.getElementById('weicon-memory-style'))return;
    var s=document.createElement('style');s.id='weicon-memory-style';
    s.textContent='#'+PANEL_ID+'{margin:6px 0 14px;border:2px solid #3569b8;border-radius:13px;overflow:hidden;background:#fff;box-shadow:0 3px 12px rgba(0,58,112,.12)}#'+PANEL_ID+' .wm-head{background:#003a70;color:#fff;padding:9px 13px;font-size:19px;font-weight:900}#'+PANEL_ID+' .wm-body{padding:10px 13px}#'+PANEL_ID+' .wm-sub{font-size:10px;font-weight:900;color:#7b8794;margin-bottom:2px}#'+PANEL_ID+' .wm-last{font-size:15px;font-weight:900;color:#003a70;margin-bottom:8px}#'+PANEL_ID+' .wm-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px}#'+PANEL_ID+' .wm-item{background:#eef4fe;border-radius:7px;padding:7px}#'+PANEL_ID+' .wm-item:nth-child(2){background:#eefaf1}#'+PANEL_ID+' .wm-item:nth-child(3){background:#fff8e8}#'+PANEL_ID+' .wm-item:nth-child(4){background:#f3f4f6}#'+PANEL_ID+' .wm-item:nth-child(5){background:#f4efff}#'+PANEL_ID+' .wm-item:nth-child(6){background:#eefaf8}#'+PANEL_ID+' .wm-label{font-size:9px;font-weight:900;color:#718096}#'+PANEL_ID+' .wm-value{font-size:13px;font-weight:900;color:#003a70;margin-top:2px;line-height:1.18;word-break:break-word}#'+PANEL_ID+' .wm-foot{margin-top:7px;padding-top:6px;border-top:1px solid #dbe5f2;font-size:10px;color:#718096;font-weight:800;line-height:1.3}';
    document.head.appendChild(s);
  }

  function render(){
    var modal=document.getElementById('musteriGecmisIslemlerModal');
    if(!modal)return;
    var visible=global.getComputedStyle?global.getComputedStyle(modal).display!=='none':modal.style.display!=='none';
    if(!visible)return;
    var m=customer();if(!m)return;
    styles();
    var panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('section');panel.id=PANEL_ID;panel.setAttribute('aria-label','Müşteri Hafızası');
      var anchor=document.getElementById('surecListesiDiv');
      var list=document.getElementById('gecmisIslemlerListesi');
      if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor);
      else if(list&&list.parentNode)list.parentNode.insertBefore(panel,list);
      else modal.querySelector('div')&&modal.querySelector('div').appendChild(panel);
    }
    var all=allRecords(m),last=all[0]||null,order=null;
    for(var i=0;i<all.length;i++){if(all[i].type==='siparis'){order=all[i];break;}}
    var lk=last&&last.kayit, ok=order&&order.kayit;
    var lu=lk&&lk.urunler&&lk.urunler[0], ou=ok&&ok.urunler&&ok.urunler[0];
    var total=0;all.forEach(function(r){total+=orderAmount(r);});
    panel.innerHTML='<div class="wm-head">🧠 MÜŞTERİ HAFIZASI</div><div class="wm-body">'+
      '<div class="wm-sub">SON HAREKET</div><div class="wm-last">'+esc(lk&&lk.tarih||'-')+' · '+esc(last?LABELS[last.type]||last.type.toUpperCase():'-')+'</div>'+ 
      '<div class="wm-grid">'+
      '<div class="wm-item"><div class="wm-label">SON ÜRÜN</div><div class="wm-value">'+esc(lu&&lu.name||'Kayıt yok')+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON FİYAT</div><div class="wm-value">'+esc(lu?money(lu.iskBirim!=null?lu.iskBirim:lu.listeFiyat):'-')+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">İSKONTO</div><div class="wm-value">'+esc(lu?('%'+(lu.iskonto!=null?lu.iskonto:0)):'-')+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">ADET · SON HAREKET</div><div class="wm-value">'+esc(lu&&lu.adet!=null?lu.adet:'-')+' · '+esc(lu?money(lu.toplamEuro!=null?lu.toplamEuro:num(lu.iskBirim)*num(lu.adet)):'-')+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON SİPARİŞ</div><div class="wm-value">'+esc(ok&&ok.tarih?formatDate(ok.tarih):'-')+' · '+esc(ou&&ou.name||'Kayıt yok')+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON SİPARİŞ TUTARI</div><div class="wm-value">'+esc(order?money(orderAmount(order)):'-')+'</div></div>'+ 
      '</div><div class="wm-foot">'+esc(all.length)+' işlem · '+esc(productCount(all))+' farklı ürün · Toplam işlem tutarı '+esc(money(total))+'</div></div>';
  }

  function observe(){
    var modal=document.getElementById('musteriGecmisIslemlerModal');
    if(!modal||modal.__weiconMemoryObserved)return;
    modal.__weiconMemoryObserved=true;
    var observer=new MutationObserver(function(mutations){
      var changed=false;mutations.forEach(function(m){if(m.type==='attributes'&&m.attributeName==='style')changed=true;});
      if(changed)global.requestAnimationFrame(render);
    });
    observer.observe(modal,{attributes:true,attributeFilter:['style']});
  }
  function init(){observe();render();}
  var tries=0,timer=setInterval(function(){init();if(++tries>40)clearInterval(timer);},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})(window);
