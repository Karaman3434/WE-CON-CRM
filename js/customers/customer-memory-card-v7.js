/* WEICON ASIST — Müşteri Hafızası V7: olay bazlı, polling yok */
(function(global){
  'use strict';
  if(global.__WEICON_MEMORY_V7__) return;
  global.__WEICON_MEMORY_V7__=true;
  var PANEL_ID='weicon-customer-memory-card-v7';
  var TYPES=['numune','teklif','proforma','siparis'];
  var LABELS={numune:'NUMUNE',teklif:'TEKLİF',proforma:'PROFORMA',siparis:'SİPARİŞ'};
  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\"/g,'&quot;').replace(/'/g,'&#39;');}
  function num(v){var n=Number(v);return isFinite(n)?n:0;}
  function money(v){return num(v).toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
  function archive(){try{if(global.arsivData&&typeof global.arsivData==='object')return global.arsivData;return typeof global.lsGet==='function'?global.lsGet('weicon_arsiv',{})||{}:{};}catch(e){return {};}}
  function customer(){try{return Array.isArray(global.musteriListesi)&&global.musteriListesi[global.musteriKartIdx]||null;}catch(e){return null;}}
  function same(k,m){if(!k||!m)return false;if(m.id&&k.musteriId)return String(m.id)===String(k.musteriId);return String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');}
  function ts(k){var n=Number(k&&k.ts)||0;return n||((k&&k.tarih)?(Date.parse(k.tarih)||0):0);}
  function records(m){var a=archive(),out=[];TYPES.forEach(function(type){(a[type]||[]).forEach(function(k,idx){if(same(k,m))out.push({type:type,idx:idx,kayit:k,ts:ts(k)});});});out.sort(function(a,b){return b.ts-a.ts;});return out;}
  function amount(r){var t=0;(r&&r.kayit&&r.kayit.urunler||[]).forEach(function(u){t+=num(u.toplamEuro!=null?u.toplamEuro:num(u.iskBirim)*num(u.adet));});return t;}
  function render(){
    var modal=document.getElementById('musteriGecmisIslemlerModal');if(!modal)return;
    if(global.getComputedStyle(modal).display==='none')return;
    var m=customer();if(!m)return;
    var all=records(m),last=all[0],order=null;
    for(var i=0;i<all.length;i++)if(all[i].type==='siparis'){order=all[i];break;}
    var lk=last&&last.kayit,ok=order&&order.kayit,lu=lk&&lk.urunler&&lk.urunler[0],ou=ok&&ok.urunler&&ok.urunler[0],total=0,products={};
    all.forEach(function(r){total+=amount(r);(r.kayit.urunler||[]).forEach(function(u){if(u.name)products[String(u.name).trim()]=1;});});
    var p=document.getElementById(PANEL_ID);
    if(!p){p=document.createElement('section');p.id=PANEL_ID;p.style.cssText='margin:6px 0 14px;border:2px solid #3569b8;border-radius:13px;overflow:hidden;background:#fff';var a=document.getElementById('surecListesiDiv'),l=document.getElementById('gecmisIslemlerListesi');if(a&&a.parentNode)a.parentNode.insertBefore(p,a);else if(l&&l.parentNode)l.parentNode.insertBefore(p,l);}
    p.innerHTML='<div style="background:#003a70;color:#fff;padding:9px 13px;font-size:19px;font-weight:900">🧠 MÜŞTERİ HAFIZASI</div><div style="padding:10px 13px"><div style="font-size:10px;font-weight:900;color:#7b8794">SON HAREKET</div><div style="font-size:15px;font-weight:900;color:#003a70;margin-bottom:8px">'+esc(lk&&lk.tarih||'-')+' · '+esc(last?(LABELS[last.type]||last.type.toUpperCase()):'-')+'</div><div style="display:grid;grid-template-columns:1fr 1fr;gap:6px"><div style="background:#eef4fe;border-radius:7px;padding:7px"><small>SON ÜRÜN</small><br><b>'+esc(lu&&lu.name||'Kayıt yok')+'</b></div><div style="background:#eefaf1;border-radius:7px;padding:7px"><small>SON FİYAT</small><br><b>'+esc(lu?money(lu.iskBirim!=null?lu.iskBirim:lu.listeFiyat):'-')+'</b></div><div style="background:#fff8e8;border-radius:7px;padding:7px"><small>İSKONTO</small><br><b>'+esc(lu?('%'+(lu.iskonto!=null?lu.iskonto:0)):'-')+'</b></div><div style="background:#f3f4f6;border-radius:7px;padding:7px"><small>ADET · SON HAREKET</small><br><b>'+esc(lu&&lu.adet!=null?lu.adet:'-')+' · '+esc(lu?money(lu.toplamEuro!=null?lu.toplamEuro:num(lu.iskBirim)*num(lu.adet)):'-')+'</b></div><div style="background:#f4efff;border-radius:7px;padding:7px"><small>SON SİPARİŞ</small><br><b>'+esc(ok&&ok.tarih||'-')+' · '+esc(ou&&ou.name||'Kayıt yok')+'</b></div><div style="background:#eefaf8;border-radius:7px;padding:7px"><small>SON SİPARİŞ TUTARI</small><br><b>'+esc(order?money(amount(order)):'-')+'</b></div></div><div style="margin-top:7px;padding-top:6px;border-top:1px solid #dbe5f2;font-size:10px;color:#718096;font-weight:800">'+all.length+' işlem · '+Object.keys(products).length+' farklı ürün · Toplam işlem tutarı '+money(total)+'</div></div>';
  }
  global.addEventListener('weicon:customer-history-open',function(){global.requestAnimationFrame(render);});
  global.addEventListener('weicon:customer-history-refresh',function(){global.requestAnimationFrame(render);});
})(window);
