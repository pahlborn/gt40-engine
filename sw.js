var CACHE_NAME = 'boss302-v55';
var urlsToCache = [
  '/gt40-engine/',
  '/gt40-engine/index.html',
  '/gt40-engine/build-log.html',
  '/gt40-engine/specs.html',
  '/gt40-engine/field-sync.js',
  '/gt40-engine/version.js',
  '/gt40-engine/gallery.js',
  '/gt40-engine/gallery.css',
  '/gt40-engine/findings.js',
  '/gt40-engine/changelog.js',
  '/gt40-engine/search.js',
  '/gt40-engine/glossar.js',
  '/gt40-engine/icon-192.png',
  '/gt40-engine/icon-512.png'
];

self.addEventListener('install', function(event) {
  self.skipWaiting(); // Activate immediately, don't wait
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(urlsToCache);
    })
  );
});

self.addEventListener('activate', function(event) {
  // Delete ALL old caches
  event.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim(); // Take control of all pages immediately
});

self.addEventListener('fetch', function(event) {
  // Network-first: always try network, fall back to cache for offline
  event.respondWith(
    fetch(event.request).then(function(response) {
      if (response && response.status === 200) {
        var clone = response.clone();
        caches.open(CACHE_NAME).then(function(cache) {
          cache.put(event.request, clone);
        });
      }
      return response;
    }).catch(function() {
      return caches.match(event.request);
    })
  );
});
