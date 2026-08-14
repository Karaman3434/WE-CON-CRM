/* WEICON ASIST — Müşteri Hafızası / legacy index.html entegrasyonu */
(function(global){
  'use strict';
  if(global.__WEICON_MEMORY_V2__) return;
  global.__WEICON_MEMORY_V2__ = true;

  var PANEL_ID='weicon-customer-memory-card';
  var TYPES=['numune','teklif','proforma','siparis'];
  var LABELS={numune:'NUMUNE',teklif:'TEKLİF',proforma:'PROFORMA',siparis:'SİPARİŞ'};

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function money(v){var n=Number(v)||0;return n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
  function archive(){try{if(typeof global.lsGet==='function')return global.lsGet('weicon_arsiv',{})||{};return JSON.parse(localStorage.getItem('weicon_arsiv')||'{}');}catch(e){return {};}}
  function customer(){try{if(typeof global.musteriKartIdx!=='undefined'&&Array.isArray(global.musteriListesi)&&global.musteriListesi[global.musteriKartIdx])return global.musteriListesi[global.musteriKartIdx];}catch(e){}return null;}
  function same(k,m){if(!k||!m)return false;if(m.id&&k.musteriId)return String(m.id)===String(k.musteriId);return String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');}
  function ts(k){var n=Number(k&&k.ts)||0;if(n)return n;var d=Date.parse(k&&k.tarih||'');return isNaN(d)?0:d;}
  function lastRecord(m){var a=archive(),best=null;TYPES.forEach(function(type){(a[type]||[]).forEach(function(k,idx){if(!same(k,m))return;var t=ts(k);if(!best||t>best.ts)best={type:type,idx:idx,kayit:k,ts:t};});});return best;}
  function formatDate(v){if(!v)return 'Kayıt yok';var d=new Date(v);return isNaN(d.getTime())?String(v):d.toLocaleDateString('tr-TR',{day:'2-digit',month:'2-digit',year:'numeric'});}

  function styles(){
    if(document.getElementById('weicon-memory-style'))return;
    var s=document.createElement('style');s.id='weicon-memory-style';
    s.textContent='#'+PANEL_ID+'{margin:18px 0 20px;border:3px solid #3569b8;border-radius:14px;overflow:hidden;background:#fff;box-shadow:0 3px 12px rgba(0,58,112,.14)}#'+PANEL_ID+' .wm-head{background:#003a70;color:#fff;padding:14px 18px;font-size:24px;font-weight:900}#'+PANEL_ID+' .wm-body{padding:15px 18px}#'+PANEL_ID+' .wm-sub{font-size:14px;font-weight:900;color:#8a94a3;margin-bottom:6px;letter-spacing:.4px}#'+PANEL_ID+' .wm-last{font-size:21px;font-weight:900;color:#003a70;margin-bottom:14px}#'+PANEL_ID+' .wm-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}#'+PANEL_ID+' .wm-item{background:#eef4fe;border-radius:10px;padding:11px}#'+PANEL_ID+' .wm-item:nth-child(2){background:#eefaf1}#'+PANEL_ID+' .wm-item:nth-child(3){background:#fff8e8}#'+PANEL_ID+' .wm-item:nth-child(4){background:#f3f4f6}#'+PANEL_ID+' .wm-label{font-size:12px;font-weight:900;color:#718096}#'+PANEL_ID+' .wm-value{font-size:18px;font-weight:900;color:#003a70;margin-top:4px;line-height:1.25}';
    document.head.appendChild(s);
  }

  function render(){
    var modal=document.getElementById('musteriCariKartModal');
    if(!modal)return;
    var display=global.getComputedStyle?global.getComputedStyle(modal).display:modal.style.display;
    if(display==='none')return;
    var m=customer();if(!m)return;
    styles();
    var panel=document.getElementById(PANEL_ID);
    if(!panel){
      panel=document.createElement('section');panel.id=PANEL_ID;panel.setAttribute('aria-label','Müşteri Hafızası');
      var anchor=document.getElementById('cariKartSonTemas');
      if(anchor&&anchor.parentNode)anchor.parentNode.parentNode.insertBefore(panel,anchor.parentNode.nextSibling);
      else{var content=modal.firstElementChild;if(content)content.appendChild(panel);}
    }
    var last=lastRecord(m),k=last&&last.kayit,u=k&&k.urunler&&k.urunler.length?k.urunler[0]:null;
    var product=u?(u.name||'-'):'Kayıt yok';
    var price=u?money(u.iskBirim!=null?u.iskBirim:u.listeFiyat):'-';
    var discount=u?('%'+(u.iskonto!=null?u.iskonto:0)):'-';
    var qty=u?(u.adet!=null?u.adet:'-'):'-';
    var total=u?money(u.toplamEuro!=null?u.toplamEuro:(Number(u.iskBirim)||0)*(Number(u.adet)||0)):'-';
    panel.innerHTML='<div class="wm-head">🧠 MÜŞTERİ HAFIZASI</div><div class="wm-body">'+
      '<div class="wm-sub">SON HAREKET</div><div class="wm-last">'+esc(k&&k.tarih||'-')+' · '+esc(last?LABELS[last.type]||last.type.toUpperCase():'-')+'</div>'+ 
      '<div class="wm-grid">'+
      '<div class="wm-item"><div class="wm-label">SON ÜRÜN</div><div class="wm-value">'+esc(product)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">SON FİYAT</div><div class="wm-value">'+esc(price)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">İSKONTO</div><div class="wm-value">'+esc(discount)+'</div></div>'+ 
      '<div class="wm-item"><div class="wm-label">ADET · TOPLAM</div><div class="wm-value">'+esc(qty)+' · '+esc(total)+'</div></div>'+ 
      '</div></div>';
  }

  function hook(){
    if(typeof global.musteriCariKartAc!=='function')return false;
    if(global.musteriCariKartAc.__weiconMemoryWrapped)return true;
    var original=global.musteriCariKartAc;
    function wrapped(){var r=original.apply(this,arguments);setTimeout(render,0);setTimeout(render,100);return r;}
    wrapped.__weiconMemoryWrapped=true;global.musteriCariKartAc=wrapped;return true;
  }

  var tries=0;
  var timer=setInterval(function(){hook();render();if(++tries>40)clearInterval(timer);},250);
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){hook();render();},{once:true});else setTimeout(function(){hook();render();},0);
})(window);
