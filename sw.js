const CACHE_ADI = "weicon-asist-cache-v7";
const BUILD = "CG 1508261125-009";
const MODULAR_RUNTIME_SRC = '<script src="js/modular-runtime.js?v=' + BUILD + '"></script>';
const CUSTOMER_MEMORY_CARD_SRC = '<script src="js/customers/customer-memory-card.js?v=' + BUILD + '"></script>';

function modularHtmlResponse(response) {
  if (!response || !response.ok) return response;
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;

  return response.text().then(function (html) {
    var hasRuntime = html.indexOf("js/modular-runtime.js") !== -1;
    var hasMemoryCard = html.indexOf("js/customers/customer-memory-card.js") !== -1;

    if (hasRuntime) html = html.replace(/js\/modular-runtime\.js(?:\?[^\"']*)?/g, "js/modular-runtime.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, MODULAR_RUNTIME_SRC + "\n</body>");

    if (hasMemoryCard) html = html.replace(/js\/customers\/customer-memory-card\.js(?:\?[^\"']*)?/g, "js/customers/customer-memory-card.js?v=" + BUILD);
    else html = html.replace(/<\/body>/i, CUSTOMER_MEMORY_CARD_SRC + "\n</body>");

    html = html.replace(/WE[İI]CON AS[İI]ST V[0-9A-Za-z._ -]+/g, "WEİCON ASİST " + BUILD);

    return new Response(html, {status: response.status, statusText: response.statusText, headers: response.headers});
  });
}

self.addEventListener("install", function (event) { self.skipWaiting(); });

self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (isimler) {
    return Promise.all(isimler.filter(function (isim) { return isim !== CACHE_ADI; }).map(function (isim) { return caches.delete(isim); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request).then(function (yanit) {
    var kopya = yanit.clone();
    caches.open(CACHE_ADI).then(function (cache) { cache.put(event.request, kopya); }).catch(function () {});
    return modularHtmlResponse(yanit);
  }).catch(function () {
    return caches.match(event.request).then(function (cached) { return modularHtmlResponse(cached); });
  }));
});
