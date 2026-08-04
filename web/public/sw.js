const CACHE_NAME = 'agrorent-cache-v1';
const OFFLINE_URLS = ['/', '/dashboard/marketplace'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(OFFLINE_URLS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const resClone = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return response;
      })
      .catch(() => {
        return caches.match(event.request).then((response) => {
          if (response) {
            return response;
          }
          // Optional offline fallback page
          return new Response('Offline mode. Please check your internet connection.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' }
          });
        });
      })
  );
});
