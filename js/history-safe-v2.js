/* WE-CON-CRM — İşlem Geçmişi güvenli sürüm V2
 * Eski geçmiş açılış/render zincirini tamamen bypass eder.
 * Müşteri Hafızası silinmez; ortak sonuç kümesini kullanır.
 */
(function(global){
  'use strict';
  if(global.__WEICON_HISTORY_SAFE_V2__) return;
  global.__WEICON_HISTORY_SAFE_V2__ = true;

  var TYPES = ['numune','teklif','proforma','siparis'];
  var LABELS = {numune:'NUMUNE',teklif:'FİYAT TEKLİFİ',proforma:'PROFORMA',siparis:'SİPARİŞ'};
  var COLORS = {numune:'#3498db',teklif:'#f39c12',proforma:'#8e44ad',siparis:'#16a085'};
  var activeJob = 0;

  function esc(v){return String(v==null?'':v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  function euro(v){var n=Number(v);if(!isFinite(n))n=0;return n.toLocaleString('tr-TR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €';}
  function archive(){return global.arsivData&&typeof global.arsivData==='object'?global.arsivData:{};}
  function customer(){return Array.isArray(global.musteriListesi)?global.musteriListesi[global.musteriKartIdx]:null;}
  function sameCustomer(k,m){
    if(!k||!m)return false;
    if(m.id && k.musteriId)return String(m.id)===String(k.musteriId);
    return String(k.musteri||'').trim().toLocaleLowerCase('tr-TR')===String(m.ad||'').trim().toLocaleLowerCase('tr-TR');
  }
  function amount(k){
    var total=0, u=Array.isArray(k&&k.urunler)?k.urunler:[];
    for(var i=0;i<u.length;i++) total += Number(u[i].toplamEuro)||0;
    return total;
  }
  function showModal(){
    var card=document.getElementById('musteriKartModal');if(card)card.style.display='none';
    var modal=document.getElementById('musteriGecmisIslemlerModal');if(modal)modal.style.display='flex';
    var process=document.getElementById('surecListesiDiv');if(process)process.innerHTML='';
    var list=document.getElementById('gecmisIslemlerListesi');
    if(list)list.innerHTML='<div style="padding:20px;text-align:center;color:#777;font-size:22px">İşlem geçmişi hazırlanıyor…</div>';
    return list;
  }
  function openSafe(){
    if(global.musteriKartIdx===null||global.musteriKartIdx===undefined)return;
    var m=customer();if(!m)return;
    var title=document.getElementById('gecmisIslemlerBaslik');if(title)title.textContent='🕘 İşlem Geçmişi';
    var name=document.getElementById('gecmisIslemlerMusteriAd');if(name)name.textContent=m.ad||'';
    var list=showModal();
    var job=++activeJob;
    var rows=[], typeIndex=0, itemIndex=0;

    function step(){
      if(job!==activeJob)return;
      var start=Date.now();
      var a=archive();
      while(typeIndex<TYPES.length && Date.now()-start<12){
        var type=TYPES[typeIndex], arr=Array.isArray(a[type])?a[type]:[];
        while(itemIndex<arr.length && Date.now()-start<12){
          var k=arr[itemIndex], idx=itemIndex;
          if(sameCustomer(k,m))rows.push({tip:type,idx:idx,k:k,ts:Number(k&&k.ts)||0});
          itemIndex++;
        }
        if(itemIndex>=arr.length){typeIndex++;itemIndex=0;}
      }
      if(typeIndex<TYPES.length){setTimeout(step,0);return;}
      rows.sort(function(x,y){return y.ts-x.ts;});
      global.__WEICON_HISTORY_ROWS__={customerId:String(m.id||m.ad||''),rows:rows};
      render(rows,m,list);
    }
    setTimeout(step,0);
  }
  function render(rows,m,list){
    if(!list)return;
    var html='<div style="font-size:18px;font-weight:900;color:#003a70;margin-bottom:10px">'+rows.length+' işlem bulundu</div>';
    if(!rows.length){
      html+='<div style="color:#888;font-size:24px;padding:20px 0">Bu müşteri için kayıtlı işlem geçmişi yok.</div>';
      list.innerHTML=html;
      var rb=document.getElementById('gecmisRevizeBtn');if(rb)rb.style.display='none';
      return;
    }
    for(var i=0;i<rows.length;i++){
      var r=rows[i],k=r.k,products=Array.isArray(k.urunler)?k.urunler:[];
      var names=[];
      for(var p=0;p<products.length && p<8;p++)names.push((products[p].name||products[p].ad||'Ürün')+(products[p].adet!=null?' × '+products[p].adet:''));
      html+='<div onclick="if(typeof faturaOnizlemePopupGoster===\'function\'){faturaOnizlemePopupGoster(\''+esc(k.musteri||m.ad||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',\'\',\''+esc(k.tarih||'').replace(/\\/g,'\\\\').replace(/'/g,"\\'")+'\',window.arsivData[\''+r.tip+'\']['+r.idx+'].urunler||[],\''+LABELS[r.tip]+'\',\''+r.tip+'\','+r.idx+');}" style="border:2px solid '+COLORS[r.tip]+';border-radius:10px;padding:12px;margin-bottom:9px;background:#fff;cursor:pointer">'+
        '<div style="display:flex;justify-content:space-between;align-items:center;gap:8px"><span style="background:'+COLORS[r.tip]+';color:#fff;border-radius:14px;padding:5px 9px;font-size:12px;font-weight:900">'+LABELS[r.tip]+'</span><span style="font-size:13px;color:#666;font-weight:800">'+esc(k.tarih||'')+'</span></div>'+ 
        '<div style="margin-top:7px;font-size:15px;font-weight:900;color:#003a70">'+esc(k.kod||k.kodNo||'-')+'</div>'+ 
        '<div style="margin-top:5px;font-size:14px;color:#333">'+esc(names.length?names.join(' · '):'Ürün bilgisi yok')+(products.length>8?' · …':'')+'</div>'+ 
        '<div style="margin-top:6px;font-size:15px;font-weight:900;color:#222">Toplam: '+euro(amount(k))+'</div></div>';
    }
    list.innerHTML=html;
    var rb=document.getElementById('gecmisRevizeBtn');if(rb)rb.style.display='none';
    if(typeof global.dispatchEvent==='function')global.dispatchEvent(new global.Event('weicon:customer-history-open'));
  }

  /* Eski inline onclick'i capture aşamasında durduruyoruz. Böylece eski ağır
     fonksiyonun bir milisaniye bile çalışmasına izin vermiyoruz. */
  document.addEventListener('click',function(ev){
    var el=ev.target&&ev.target.closest?ev.target.closest('[onclick]'):null;
    if(!el)return;
    var code=el.getAttribute('onclick')||'';
    if(code.indexOf('musteriGecmisIslemleriAc')===-1)return;
    ev.preventDefault();
    ev.stopImmediatePropagation();
    openSafe();
  },true);

  global.musteriGecmisIslemleriAc=openSafe;
  global.musteriGecmisRenderEt=function(){
    var m=customer();if(!m)return;
    var cached=global.__WEICON_HISTORY_ROWS__;
    if(cached&&cached.customerId===String(m.id||m.ad||''))render(cached.rows,m,document.getElementById('gecmisIslemlerListesi'));
    else openSafe();
  };
  global.__WEICON_HISTORY_SAFE_OPEN__=openSafe;
})(window);
