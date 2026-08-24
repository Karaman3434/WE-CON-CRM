const CACHE_ADI = "weicon-asist-cache-v19-runtime-fix";
const BUILD = "CG 240826-2200-019";
const SALES_V3_SRC = '<script src="js/sales/sales-v3.js?v=' + BUILD + '"></script>';
const UI_FIX_SRC = '<script src="ui-render-fix.js?v=' + BUILD + '"></script>';
const PAINT_FIX_STYLE = '<style id="weicon-main-paint-fix">html,body{width:100%!important;max-width:100%!important;overflow-x:hidden!important;} .phone-container{width:100%!important;max-width:100vw!important;min-width:0!important;margin-left:auto!important;margin-right:auto!important;transform:none!important;-webkit-backface-visibility:visible!important;backface-visibility:visible!important;}</style>';
function modularHtmlResponse(response) {
  if (!response || !response.ok) return response;
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;
  return response.text().then(function (html) {
    var hasSalesV3 = html.indexOf("js/sales/sales-v3.js") !== -1;
    var hasUiFix = html.indexOf("ui-render-fix.js") !== -1;
    if (hasSalesV3) html = html.replace(/js\/sales\/sales-v3\.js(?:\?[^\"']*)?/g, "js/sales/sales-v3.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, SALES_V3_SRC + "\n</body>");
    if (!hasUiFix) html = html.replace(/<\/body>/i, UI_FIX_SRC + "\n</body>");
    html = html.replace(/WE[İI]CON AS[İI]ST V[0-9A-Za-z._ -]+/g, "WEİCON ASİST " + BUILD);
    html = html.replace(/<\/head>/i, PAINT_FIX_STYLE + "\n</head>");
    return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
  });
}
self.addEventListener("install", function(event){event.waitUntil(self.skipWaiting());});
self.addEventListener("activate", function(event){event.waitUntil(caches.keys().then(function(names){return Promise.all(names.filter(function(n){return n!==CACHE_ADI;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener("fetch", function(event){event.respondWith(fetch(event.request).then(function(response){var copy=response.clone();caches.open(CACHE_ADI).then(function(cache){cache.put(event.request,copy);}).catch(function(){});return modularHtmlResponse(response);}).catch(function(){return caches.match(event.request).then(function(cached){return modularHtmlResponse(cached);});}));});
