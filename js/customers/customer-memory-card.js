/* WEICON ASIST — Müşteri Hafızası / İşlem Geçmişi entegrasyonu */
(function(global){
  'use strict';
  if(global.__WEICON_MEMORY_V4__) return;
  global.__WEICON_MEMORY_V4__ = true;

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
  function records(m,type){var a=archive(),out=[];(a[type]||[]).forEach(function(k,idx){if(same(k,m))out.push({type:type,idx:idx,kayit:k,ts:ts(k)});});return out;}
  function allRecords(m){var out=[];TYPES.forEach(function(type){out=out.concat(records(m,type));});return out.sort(function(a,b){return b.ts-a.ts;});}
  function latest(m){return allRecords(m)[0]||null;}
  function latestOrder(m){var r=records(m,'siparis').sort(function(a,b){return b.ts-a.ts;});return r[0]||null;}
  function allAmount(m){var total=0;allRecords(m).forEach(function(r){(r.kayit.urunler||[]).forEach(function(u){total+=num(u.toplamEuro!=null?u.toplamEuro:num(u.iskBirim)*num(u.adet));});});return total;}
  function productCount(m){var set={};allRecords(m).forEach(function(r){(r.kayit.urunler||[]).forEach(function(u){var n=String(u.name||'').trim();if(n)set[n]=true;});});return Object.keys(set).length;}
  function orderAmount(r){if(!r)return 0;var total=0;(r.kayit.urunler||[]).forEach(function(u){total+=num(u.toplamEuro!=null?u.toplamEuro:num(u.iskBirim)*num(u.adet));});return total;}
  function firstProduct(r){var u=r&&r.kayit&&r.kayit.urunler&&r.kayit.urunler.length?r.kayit.urunler[0]:null;return u||null;}
  function formatDate(v){if(!v)return '-';var d=new Date(v);return isNaN(d.getTime())?String(v):d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});}
  function daysSince(r){if(!r||!r.ts)return '-';var days=Math.max(0,Math.floor((Date.now()-r.ts)/86400000));return days===0?'Bugün':days+' gün önce';}

  function styles(){
    if(document.getElementById('weicon-memory-style'))return;
    var s=document.createElement('style');s.id='weicon-memory-style';
    s.textContent='#'+PANEL_ID+'{margin:4px 0 18px;border:2px solid #3569b8;border-radius:13px;overflow:hidden;background:#fff;box-shadow:0 3px 12px rgba(0,58,112,.12)}#'+PANEL_ID+' .wm-head{background:#003a70;color:#fff;padding:10px 14px;font-size:21px;font-weight:900}#'+PANEL_ID+' .wm-body{padding:11px 14px}#'+PANEL_ID+' .wm-sub{font-size:11px;font-weight:900;color:#7b8794;margin-bottom:3px;letter-spacing:.4px}#'+PANEL_ID+' .wm-last{font-size:16px;font-weight:900;color:#003a70;margin-bottom:9px}#'+PANEL_ID+' .wm-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px}#'+PANEL_ID+' .wm-item{background:#eef4fe;border-radius:8px;padding:8px}#'+PANEL_ID+' .wm-item:nth-child(2){background:#eefaf1}#'+PANEL_ID+' .wm-item:nth-child(3){background:#fff8e8}#'+PANEL_ID+' .wm-item:nth-child(4){background:#f3f4f6}#'+PANEL_ID+' .wm-item:nth-child(5){background:#f4efff}#'+PANEL_ID+' .wm-item:nth-child(6){background:#eefaf8}#'+PANEL_ID+' .wm-label{font-size:10px;font-weight:900;color:#718096}#'+PANEL_ID+' .wm-value{font-size:14px;font-weight:900;color:#003a70;margin-top:2px;line-height:1.18;word-break:break-word}#'+PANEL_ID+' .wm-foot{margin-top:8px;padding-top:7px;border-top:1px solid #dbe5f2;font-size:11px;color:#718096;font-weight:800;line-height:1.35}';
    document.head.appendChild(s);
  }

  function removeFromCustomerCard(){
    var old=document.getElementById(PANEL_ID);
    if(old) old.remove();
  }

  function render(){
    var modal=document.getElementById('musteriGecmisIslemlerModal');
    if(!modal)return;
    var display=global.getComputedStyle?global.getComputedStyle(modal).display:modal.style.display;
    if(display==='none')return;
    var m=customer();if(!m)return;
    styles();

    var panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('section');panel.id=PANEL_ID;panel.setAttribute('aria-label','Müşteri Hafızası');
      var anchor=document.getElementById('surecListesiDiv');
      if(anchor&&anchor.parentNode)anchor.parentNode.insertBefore(panel,anchor);
      else{var list=document.getElementById('gecmisIslemlerListesi');if(list&&list.parentNode)list.parentNode.insertBefore(panel,list);}
    }

    var last=latest(m), order=latestOrder(m), k=last&&last.kayit, u=firstProduct(last), ou=firstProduct(order);
    var product=u?(u.name||'-'):'Kayıt yok';
    var price=u?money(u.iskBirim!=null?u.iskBirim:u.listeFiyat):'-';
    var discount=u?('%'+(u.iskonto!=null?u.iskonto:0)):'-';
    var qty=u?(u.adet!=null?u.adet:'-'):'-';
    var total=u?money(u.toplamEuro!=null?u.toplamEuro:num(u.iskBirim)*num(u.adet)):'-';
    var totalAmount=allAmount(m);
    var count=allRecords(m).length;
    var orderDate=order?formatDate(order.kayit.tarih):'-';
    var orderProduct=ou?(ou.name||'-'):'Kayıt yok';
    var orderTotal=order?money(orderAmount(order)):'-';
    var days=daysSince(last);

    panel.innerHTML='<div class="wm-head">🧠 MÜŞTERİ HAFIZASI</div><div class="wm-body">'+
      '<div class="wm-sub">SON HAREKET</div><div class="wm-last">'+esc(k&&k.tarih||'-')+' · '+esc(last?LABELS[last.type]||last.type.toUpperCase():'-')+'</div>'+ 
      '<div class="wm-grid">'+
      '<div class="wm-item"><div class="wm-label">SON ÜRÜN</div><div class="wm-value">'+esc(product)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON FİYAT</div><div class="wm-value">'+esc(price)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">İSKONTO</div><div class="wm-value">'+esc(discount)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">ADET · SON HAREKET</div><div class="wm-value">'+esc(qty)+' · '+esc(total)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON SİPARİŞ</div><div class="wm-value">'+esc(orderDate)+' · '+esc(orderProduct)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON SİPARİŞ TUTARI</div><div class="wm-value">'+esc(orderTotal)+'</div></div>'+ 
      '</div><div class="wm-foot">'+esc(count)+' işlem · '+esc(productCount(m))+' farklı ürün · Toplam işlem tutarı '+esc(money(totalAmount))+' · Son hareket '+esc(days)+'</div></div>';
  }

  function hook(){
    removeFromCustomerCard();
    if(typeof global.musteriGecmisIslemleriAc!=='function')return false;
    if(global.musteriGecmisIslemleriAc.__weiconMemoryWrapped)return true;
    var original=global.musteriGecmisIslemleriAc;
    function wrapped(){var r=original.apply(this,arguments);setTimeout(render,0);setTimeout(render,100);return r;}
    wrapped.__weiconMemoryWrapped=true;global.musteriGecmisIslemleriAc=wrapped;return true;
  }

  var tries=0;
  var timer=setInterval(function(){hook();render();if(++tries>40)clearInterval(timer);},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){hook();render();},{once:true});else setTimeout(function(){hook();render();},0);
})(window);
