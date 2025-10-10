const CACHE_VERSION = 'v3';
const CACHE_NAME = `libreta-campo-qc-cache-${CACHE_VERSION}`;
const APP_SHELL_URLS = [
  'index.html',
  'styles.css',
  'script.js',
  'jszip.min.js',
  'RAC-FOT.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
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
        // If it's not in the cache, try to fetch it from the network.
        return fetch(event.request);
      })
      .catch(error => {
        // If the fetch fails (e.g., user is offline), and it's a navigation request,
        // serve the fallback page from the cache.
        console.log('[SW] Fetch failed; returning offline fallback.', error);
        if (event.request.mode === 'navigate') {
          return caches.match(FALLBACK_URL);
        }
      })
  );
});
