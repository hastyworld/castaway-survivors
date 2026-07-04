// ============================================================
// sw.js — 서비스워커: 오프라인 지원 + 자동 업데이트
// HTML은 네트워크 우선(새 배포 즉시 반영), 나머지 에셋은 캐시 우선(오프라인).
// 캐시 이름의 버전을 올리면 옛 캐시가 정리됩니다.
// ============================================================
const CACHE = 'castaway-v1';

self.addEventListener('install', () => {
  self.skipWaiting(); // 새 워커를 곧바로 활성화
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // 외부(CDN 등)는 그대로 통과

  const accept = req.headers.get('accept') || '';

  // 1) HTML 문서: 네트워크 우선 → 최신 배포를 바로 반영, 오프라인이면 캐시
  if (req.mode === 'navigate' || accept.includes('text/html')) {
    e.respondWith(
      (async () => {
        try {
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE);
          cache.put(req, fresh.clone());
          return fresh;
        } catch {
          return (await caches.match(req)) || (await caches.match('./index.html')) || Response.error();
        }
      })()
    );
    return;
  }

  // 2) 그 외(해시된 JS/이미지/폰트 등): 캐시 우선 + 백그라운드 갱신
  e.respondWith(
    (async () => {
      const cache = await caches.open(CACHE);
      const cached = await cache.match(req);
      const network = fetch(req)
        .then((res) => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })()
  );
});
