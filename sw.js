// --- Service Worker for Libreta de Campo QC ---

// 1. Set the cache version.
// To update the app, you MUST increment this version number.
const CACHE_VERSION = 'v1'; // e.g., 'v2', 'v3', etc.
const CACHE_NAME = `libreta-campo-qc-cache-${CACHE_VERSION}`;

// 2. List all the files and assets your app needs to work offline.
const urlsToCache = [
  './', // This caches the root URL of your app
  './index.html',
  './styles.css',
  './script.js',
  './jszip.min.js',
  './RAC-FOT.jpg',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// --- SERVICE WORKER LOGIC (No need to edit below this line) ---

// Installation: Caches all the specified files.
self.addEventListener('install', event => {
  self.skipWaiting(); // Force the new service worker to activate immediately
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`[Service Worker] Caching files for version: ${CACHE_VERSION}`);
        return cache.addAll(urlsToCache);
      })
      .catch(err => {
        console.error('[Service Worker] Failed to cache files:', err);
      })
  );
});

// Activation: Cleans up old caches.
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // If the cache name is not the current one, delete it.
          if (cacheName !== CACHE_NAME) {
            console.log(`[Service Worker] Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch: Serves cached content when offline.
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // If the request is in the cache, return the cached response.
        if (response) {
          return response;
        }
        // Otherwise, fetch the request from the network.
        return fetch(event.request);
      })
  );
});