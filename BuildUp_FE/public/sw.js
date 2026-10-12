// BuildUp Service Worker (PWA & PWABuilder App Packager 지원)
const CACHE_NAME = 'buildup-pwa-v1';

self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // POST/PUT 등 비GET 요청이나 백엔드 API 요청은 네트워크로 직접 통과
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  // 네트워크 우선 응답 (최신 데이터 보장), 오프라인 시 캐시 폴백
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        return response;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
