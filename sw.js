const CACHE_VERSION = 'v20';
const CACHE_NAME = `libreta-campo-qc-cache-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
  './',
  'index.html',
  'styles.css',
  'script.js',
  'db.js',
  'manifest.json',
  'jszip.min.js',
  'RAC-FOT.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css',
  'https://cdnjs.cloudflare.com/ajax/libs/exif-js/2.3.0/exif.min.js'
];

// A fallback page to show when the user is offline and the requested page isn't cached.
const FALLBACK_URL = 'index.html';

self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log(`[SW] Caching app shell for version ${CACHE_VERSION}`);
      // Add fallback URL to cache first.
      return cache.add(FALLBACK_URL).then(() => {
        // Then add the rest of the app shell.
        // addAll is atomic, if one fails, all fail.
        return cache.addAll(APP_SHELL_URLS);
      }).catch(error => {
        console.error('[SW] Failed to cache app shell:', error);
      });
    })
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            console.log(`[SW] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      console.log('[SW] New service worker activated');
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    // Try to get the response from the cache.
    caches.match(event.request)
      .then(cachedResponse => {
        // If it's in the cache, return it.
        if (cachedResponse) {
          return cachedResponse;
        }
        // For navigation requests (HTML pages), serve fallback when offline
        if (event.request.mode === 'navigate') {
          return fetch(event.request).catch(() => {
            console.log('[SW] Fetch failed; returning offline fallback.');
            return caches.match(FALLBACK_URL);
          });
        }
        // For other requests, try to fetch from network, then fallback to cache
        return fetch(event.request).then(response => {
          // If request succeeded, cache a copy for future use
          if (response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return response;
        }).catch(() => {
          // If network fails and it's not in cache, return offline fallback
          if (event.request.destination === 'document') {
            return caches.match(FALLBACK_URL);
          }
          // For other resources that are not in cache, return error
          return new Response('', {
            status: 408,
            statusText: 'Request timeout'
          });
        });
      })
  );
});
