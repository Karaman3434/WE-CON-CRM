const CACHE_ADI = "weicon-asist-cache-v3";
const MODULAR_RUNTIME_SRC = '<script src="js/modular-runtime.js"></script>';
const CUSTOMER_MEMORY_CARD_SRC = '<script src="js/customers/customer-memory-card.js"></script>';

function modularHtmlResponse(response) {
  if (!response || !response.ok) return response;
  var contentType = response.headers.get("content-type") || "";
  if (contentType.indexOf("text/html") === -1) return response;

  return response.text().then(function (html) {
    var hasRuntime = html.indexOf("js/modular-runtime.js") !== -1;
    var hasMemoryCard = html.indexOf("js/customers/customer-memory-card.js") !== -1;
    if (hasRuntime && hasMemoryCard) return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    var marker = "</body>";
    var index = html.toLowerCase().lastIndexOf(marker);
    if (index === -1) return new Response(html, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });

    var injection = "";
    if (!hasRuntime) injection += MODULAR_RUNTIME_SRC + "\n";
    if (!hasMemoryCard) injection += CUSTOMER_MEMORY_CARD_SRC + "\n";
    var updated = html.slice(0, index) + injection + html.slice(index);
    return new Response(updated, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    });
  });
}

self.addEventListener("install", function (event) {
  self.skipWaiting();
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (isimler) {
      return Promise.all(
        isimler
          .filter(function (isim) { return isim !== CACHE_ADI; })
          .map(function (isim) { return caches.delete(isim); })
      );
    }).then(function () {
      return self.clients.claim();
    })
  );
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (yanit) {
        var kopya = yanit.clone();
        caches.open(CACHE_ADI).then(function (cache) {
          cache.put(event.request, kopya);
        }).catch(function () {});
        return modularHtmlResponse(yanit);
      })
      .catch(function () {
        return caches.match(event.request).then(function (cached) {
          return modularHtmlResponse(cached);
        });
      })
  );
});
