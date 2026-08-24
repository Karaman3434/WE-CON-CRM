const CACHE_ADI = "weicon-asist-cache-v16-render-safe";
const BUILD = "CG 1508261515-017";
const SALES_V3_SRC = '<script src="js/sales/sales-v3.js?v=' + BUILD + '"></script>';

// Ana arayüzdeki boş/üst üste binmiş görüntü problemini iki ayrı kök nedenden
// birlikte ele alırız:
// 1) .phone-container üzerindeki translateZ(0), içindeki position:fixed
//    modal/popup elemanları için yeni bir fixed containing block (sabit
//    konumlandırma referans alanı) oluşturur.
// 2) Bu transform (dönüşüm) kaldırıldığında modal'ların fixed olması bu kez
//    viewport'a (ekran görünüm alanına) kaçar. Bu yüzden uygulamanın kendi
//    container'ı içinde kalan fixed katmanları absolute (mutlak konumlu)
//    hale getiriyoruz. phone-container zaten position:fixed olduğundan aynı
//    ekran koordinat sistemini koruyoruz; dosya yapısına dokunmuyoruz.
const UI_RENDER_SAFE_STYLE = '<style id="weicon-ui-render-safe">' +
  '.phone-container{' +
    'transform:none!important;' +
    '-webkit-backface-visibility:visible!important;' +
    'backface-visibility:visible!important;' +
  '}' +
  '.phone-container .content-page{' +
    'min-height:0!important;' +
  '}' +
  '.phone-container .content-page.active{' +
    'visibility:visible!important;' +
    'opacity:1!important;' +
  '}' +
  '</style>';

// app-part5.js içindeki "toplamTutar is not defined" hatası için güvenli
// geriye dönük uyumluluk (backward compatibility / geriye dönük uyumluluk).
// Burada sabit bir değer yazmıyoruz; değer her çağrıda mevcut arşivden
// yeniden hesaplanıyor. Böylece kayıt verisi değiştirilmez ve kaybolmaz.
const RUNTIME_SAFE_SCRIPT = '<script id="weicon-runtime-safe">' +
  '(function(){' +
    'try{' +
      'if(!Object.prototype.hasOwnProperty.call(window,"toplamTutar")){' +
        'Object.defineProperty(window,"toplamTutar",{' +
          'configurable:true,' +
          'get:function(){' +
            'try{' +
              'var arsiv=(typeof lsGet==="function")?lsGet("weicon_arsiv",{}):(window.arsivData||{});' +
              'var liste=(arsiv&&arsiv.teklif)||[];' +
              'var now=new Date();' +
              'var aylar=["Oca","Şub","Mar","Nis","May","Haz","Tem","Ağu","Eyl","Eki","Kas","Ara"];' +
              'var ay=aylar[now.getMonth()], yil=String(now.getFullYear());' +
              'var toplam=0;' +
              'for(var i=0;i<liste.length;i++){' +
                'var k=liste[i]||{};' +
                'if(k.durum!=="kacan" || !k.tarih) continue;' +
                'var p=String(k.tarih).split(" ");' +
                'if((p[1]||"")!==ay || (p[2]||"")!==yil) continue;' +
                'var urunler=k.urunler||[];' +
                'for(var j=0;j<urunler.length;j++) toplam += Number(urunler[j].toplamEuro)||0;' +
              '}' +
              'return toplam;' +
            '}catch(e){return 0;}' +
          '}' +
        '});' +
      '}' +
    '}catch(e){}' +

    // Ana uygulama görünürlük değişiminde .phone-container'ı display:none
    // yaparak zorla yeniden çiziyordu. Bu yöntem mevcut modal/scroll katmanları
    // ile çakışabildiği için burada etkisiz bırakıyoruz; tarayıcı doğal layout
    // (yerleşim) akışını kullanacak.
    'window._zorlaYenidenCiz=function(){' +
      'try{' +
        'if(typeof activeCurrentPage!=="undefined" && activeCurrentPage===8 && typeof anaSayfaRenderEt==="function") anaSayfaRenderEt();' +
      '}catch(e){}' +
    '};' +

    'function _weiconFixFixedDescendants(root){' +
      'var list=[];' +
      'try{' +
        'if(!root) return;' +
        'if(root.nodeType===1 && root.querySelectorAll) list.push(root);' +
        'if(root.querySelectorAll){var els=root.querySelectorAll("*");for(var i=0;i<els.length;i++) list.push(els[i]);}' +
        'for(var j=0;j<list.length;j++){' +
          'var el=list[j];' +
          'if(el===document.querySelector(".phone-container")) continue;' +
          'var cs=window.getComputedStyle(el);' +
          'if(cs && cs.position==="fixed") el.style.position="absolute";' +
        '}' +
      '}catch(e){}' +
    '}' +

    'function _weiconApplyLayoutFix(){' +
      'try{' +
        'var shell=document.querySelector(".phone-container");' +
        'if(!shell) return;' +
        'shell.style.transform="none";' +
        'shell.style.webkitBackfaceVisibility="visible";' +
        'shell.style.backfaceVisibility="visible";' +
        '_weiconFixFixedDescendants(shell);' +
        'var active=document.querySelector(".content-page.active");' +
        'if(active){active.style.visibility="visible";active.style.opacity="1";}' +
      '}catch(e){}' +
    '}' +

    'if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",_weiconApplyLayoutFix,{once:true});' +
    'else _weiconApplyLayoutFix();' +
  '})();' +
  '</script>';

function modularHtmlResponse(response) {
  if (!response || !response.ok) return response;
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;
  return response.text().then(function (html) {
    var hasSalesV3 = html.indexOf("js/sales/sales-v3.js") !== -1;
    if (hasSalesV3) html = html.replace(/js\/sales\/sales-v3\.js(?:\?[^\"']*)?/g, "js/sales/sales-v3.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, SALES_V3_SRC + "\n</body>");
    html = html.replace(/WE[İI]CON AS[İI]ST V[0-9A-Za-z._ -]+/g, "WEİCON ASİST " + BUILD);
    if (html.indexOf('id="weicon-ui-render-safe"') === -1) {
      html = html.replace(/<\/head>/i, UI_RENDER_SAFE_STYLE + "\n</head>");
    }
    if (html.indexOf('id="weicon-runtime-safe"') === -1) {
      html = html.replace(/<\/body>/i, RUNTIME_SAFE_SCRIPT + "\n</body>");
    }
    return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
  });
}

self.addEventListener("install", function(event){event.waitUntil(self.skipWaiting());});
self.addEventListener("activate", function(event){event.waitUntil(caches.keys().then(function(names){return Promise.all(names.filter(function(n){return n!==CACHE_ADI;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener("fetch", function(event){event.respondWith(fetch(event.request).then(function(response){var copy=response.clone();caches.open(CACHE_ADI).then(function(cache){cache.put(event.request,copy);}).catch(function(){});return modularHtmlResponse(response);}).catch(function(){return caches.match(event.request).then(function(cached){return modularHtmlResponse(cached);});}));});
