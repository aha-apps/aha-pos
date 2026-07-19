var CACHE_NAME = 'aha-pos-v1';
var PRECACHE_URLS = [
  '/',
  '/index.html',
  '/core/db.js',
  '/core/crypto.js',
  '/core/app.js',
  '/core/ui.js',
  '/core/theme.js',
  '/core/main.js',
  '/core/env.js',
  '/core/file-store.js',
  '/core/sync.js',
  '/core/network.js',
  '/core/search-palette.js',
  '/core/license.js',
  '/manifest.json'
];

self.addEventListener('install', function(event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRECACHE_URLS);
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

self.addEventListener('activate', function(event) {
  event.waitUntil(
    caches.keys().then(function(cacheNames) {
      return Promise.all(
        cacheNames.map(function(name) {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', function(event) {
  var requestUrl = new URL(event.request.url);

  if (requestUrl.hostname !== self.location.hostname && requestUrl.hostname !== 'localhost') {
    event.respondWith(networkFirst(event.request));
    return;
  }

  var isStatic = PRECACHE_URLS.some(function(url) {
    return requestUrl.pathname === url || requestUrl.pathname.endsWith(url);
  });
  if (isStatic) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  if (requestUrl.pathname.startsWith('/modules/')) {
    event.respondWith(cacheFirst(event.request));
    return;
  }

  event.respondWith(networkFirst(event.request));
});

function cacheFirst(request) {
  return caches.match(request).then(function(cached) {
    return cached || fetch(request).then(function(response) {
      return caches.open(CACHE_NAME).then(function(cache) {
        if (response && response.status === 200) {
          var clone = response.clone();
          cache.put(request, clone);
        }
        return response;
      });
    });
  });
}

function networkFirst(request) {
  return fetch(request).then(function(response) {
    if (response && response.status === 200) {
      var clone = response.clone();
      caches.open(CACHE_NAME).then(function(cache) {
        cache.put(request, clone);
      });
    }
    return response;
  }).catch(function() {
    return caches.match(request);
  });
}
