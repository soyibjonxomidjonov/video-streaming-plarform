const CACHE_NAME = 'video-stream-cache-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  
  // Intercept stream requests
  if (url.pathname.includes('/stream/')) {
    event.respondWith(handleStreamRequest(event.request, event));
  }
});

async function handleStreamRequest(request, event) {
  const cache = await caches.open(CACHE_NAME);
  
  // Create a cache key that includes the Range header
  const rangeHeader = request.headers.get('Range') || 'bytes=0-';
  const cacheKey = request.url + '|' + rangeHeader;
  
  const cachedResponse = await cache.match(cacheKey);
  if (cachedResponse) {
    // If the original response was a 206, we stored it as 200 to bypass Cache API limits.
    // We must return it as 206 to the browser so the video player doesn't break.
    if (cachedResponse.headers.has('Content-Range')) {
      const headers = new Headers(cachedResponse.headers);
      return new Response(cachedResponse.body, {
        status: 206,
        statusText: 'Partial Content',
        headers: headers
      });
    }
    return cachedResponse;
  }
  
  try {
    const fetchRequest = new Request(request.url, {
      method: request.method,
      headers: request.headers,
      mode: 'cors',
      credentials: 'omit',
      redirect: 'follow'
    });
    
    const networkResponse = await fetch(fetchRequest);
    
    // Only cache 206 Partial Content or 200 OK
    if (networkResponse.status === 200 || networkResponse.status === 206) {
      const responseToCache = networkResponse.clone();
      
      // We can only cache responses that are not opaque
      if (responseToCache.type !== 'opaque') {
        const newHeaders = new Headers(responseToCache.headers);
        newHeaders.set('Cache-Control', 'public, max-age=31536000, immutable');
        
        // The Cache API does not allow caching 206 responses directly.
        // We trick it by storing the response with a 200 status code.
        const cacheStatus = responseToCache.status === 206 ? 200 : responseToCache.status;
        const cacheStatusText = responseToCache.status === 206 ? 'OK' : responseToCache.statusText;
        
        const cachedResp = new Response(responseToCache.body, {
          status: cacheStatus,
          statusText: cacheStatusText,
          headers: newHeaders
        });
        
        event.waitUntil(cache.put(cacheKey, cachedResp.clone()).catch(err => console.error("Cache put error:", err)));
      }
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Service Worker stream fetch failed:', error);
    throw error;
  }
}
