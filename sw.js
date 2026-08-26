/*
  sw.js — KENDİNİ KALDIRAN SERVICE WORKER
  =========================================
  Eski v1 (tek dosyalı) uygulamadan kalma service worker, bazı cihazlarda
  hâlâ arka planda çalışıp eski dosyaları önbellekten sunuyor ve HTML
  içeriğini (versiyon yazısı dahil) değiştiriyordu — bu da cihazlar arası
  tutarsız görünüme (Samsung'da güncel, iPad'de eski) yol açıyordu.
  Bu dosya artık HİÇBİR ŞEYİ önbelleklemez, hiçbir isteği değiştirmez;
  sadece kendini kaydeden tüm eski kayıtları siler ve tüm eski
  önbellekleri temizler ki cihaz saf ağ isteklerine (her zaman en güncel
  dosya) dönsün.
*/
self.addEventListener("install", function(event){
  self.skipWaiting();
});
self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys()
      .then(function(names){ return Promise.all(names.map(function(n){ return caches.delete(n); })); })
      .then(function(){ return self.registration.unregister(); })
      .then(function(){ return self.clients.matchAll(); })
      .then(function(clientList){
        clientList.forEach(function(client){ client.navigate(client.url); });
      })
  );
});
