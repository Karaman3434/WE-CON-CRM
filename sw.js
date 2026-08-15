const CACHE_ADI = "weicon-asist-cache-v9";
const BUILD = "CG 1508261125-011";
const MODULAR_RUNTIME_SRC = '<script src="js/modular-runtime.js?v=' + BUILD + '"></script>';
const CUSTOMER_MEMORY_CARD_SRC = '<script src="js/customers/customer-memory-card-v7.js?v=' + BUILD + '"></script>';
function modularHtmlResponse(response) {
  if (!response || !response.ok) return response;
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;
  return response.text().then(function (html) {
    var hasRuntime = html.indexOf("js/modular-runtime.js") !== -1;
    var hasMemoryCard = html.indexOf("customer-memory-card-v7.js") !== -1;
    if (hasRuntime) html = html.replace(/js\/modular-runtime\.js(?:\?[^\"']*)?/g, "js/modular-runtime.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, MODULAR_RUNTIME_SRC + "\n</body>");
    if (hasMemoryCard) html = html.replace(/js\/customers\/customer-memory-card-v7\.js(?:\?[^\"']*)?/g, "js/customers/customer-memory-card-v7.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, CUSTOMER_MEMORY_CARD_SRC + "\n</body>");
    html = html.replace(/WE[İI]CON AS[İI]ST V[0-9A-Za-z._ -]+/g, "WEİCON ASİST " + BUILD);
    return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
  });
}
self.addEventListener("install", function(event){event.waitUntil(self.skipWaiting());});
self.addEventListener("activate", function(event){event.waitUntil(caches.keys().then(function(names){return Promise.all(names.filter(function(n){return n!==CACHE_ADI;}).map(function(n){return caches.delete(n);}));}).then(function(){return self.clients.claim();}));});
self.addEventListener("fetch", function(event){event.respondWith(fetch(event.request).then(function(response){var copy=response.clone();caches.open(CACHE_ADI).then(function(cache){cache.put(event.request,copy);}).catch(function(){});return modularHtmlResponse(response);}).catch(function(){return caches.match(event.request).then(function(cached){return modularHtmlResponse(cached);});}));});
