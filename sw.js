const CACHE_ADI = "weicon-asist-cache-v1";

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
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", function (event) {
  event.respondWith(
    fetch(event.request)
      .then(function (yanit) {
        var kopya = yanit.clone();
        caches.open(CACHE_ADI).then(function (cache) {
          cache.put(event.request, kopya);
        });
        return yanit;
      })
      .catch(function () {
        return caches.match(event.request);
      })
  );
});
