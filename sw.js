const CACHE_ADI = "weicon-asist-cache-v2";

self.addEventListener("install", function (event) { self.skipWaiting(); });
self.addEventListener("activate", function (event) {
  event.waitUntil(caches.keys().then(function (isimler) {
    return Promise.all(isimler.filter(function (isim) { return isim !== CACHE_ADI; }).map(function (isim) { return caches.delete(isim); }));
  }));
  self.clients.claim();
});

function cssDisaAktar(yanit) {
  return yanit.text().then(function (html) {
    html = html.replace(/<style>[\\s\\S]*?<\\/style>/gi, "");
    html = html.replace(/<\\/head>/i, '<link rel="stylesheet" href="assets/styles.css">\\n</head>');
    return new Response(html, {status: yanit.status, statusText: yanit.statusText, headers: yanit.headers});
  });
}

self.addEventListener("fetch", function (event) {
  event.respondWith(fetch(event.request).then(function (yanit) {
    var isHtml = event.request.method === "GET" && (event.request.mode === "navigate" || (event.request.headers.get("accept") || "").indexOf("text/html") !== -1);
    if (isHtml && yanit.ok) {
      return cssDisaAktar(yanit).then(function (donus) {
        var kopya = donus.clone();
        caches.open(CACHE_ADI).then(function (cache) { cache.put(event.request, kopya); });
        return donus;
      });
    }
    var kopya = yanit.clone();
    caches.open(CACHE_ADI).then(function (cache) { cache.put(event.request, kopya); });
    return yanit;
  }).catch(function () { return caches.match(event.request); }));
});
