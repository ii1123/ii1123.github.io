/* ========== Lojain SW — offline + safe caching ========== */

const CACHE_NAME = 'lojain-cache-v2';

/* عدّل هذه القائمة حسب ملفاتك الفعلية */
const CORE_ASSETS = [
  './index.html',
  './style.css?v=3',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  // أزل السطرين التاليين إذا ما عندك هالملفات
  './script.js',
  './settings.json',
];

/* صفحة Offline مبسطة */
const OFFLINE_HTML = `
<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title>
<style>
  html,body{height:100%;margin:0;background:#0f1020;color:#f7f7ff;
  font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;display:grid;place-items:center}
  .card{max-width:540px;padding:24px;border-radius:16px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
  h1{margin:0 0 8px}p{margin:8px 0;color:#cfd3ff}
  button{margin-top:12px;padding:10px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:transparent;color:#fff;font-weight:700;cursor:pointer}
</style>
<div class="card">
  <h1>You’re offline</h1>
  <p>ما فيه اتصال حاليًا. جرّب تعيد التحميل لما يرجع النت.</p>
  <button onclick="location.reload()">Retry</button>
</div>`;

/* ===== Helpers ===== */
const isSameOrigin = (url) => {
  try { return new URL(url, self.location.href).origin === self.location.origin; }
  catch { return false; }
};
const okToCache = (res) => res && res.status === 200 && res.type !== 'opaque';

/* ===== Install ===== */
self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);

    // إضافة آمنة: ما تفشل حتى لو ملف ناقص
    await Promise.allSettled(
      CORE_ASSETS.map((url) =>
        fetch(url, { cache: 'no-cache' }).then((res) => okToCache(res) && cache.put(url, res.clone()))
      )
    );
  })());
  self.skipWaiting();
});

/* ===== Activate ===== */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((k) => (k === CACHE_NAME ? null : caches.delete(k))))
    )
  );
  self.clients.claim();
});

/* ===== Fetch ===== */
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // لا نتعامل مع غير GET (POST/PUT…)
  if (req.method !== 'GET') return;

  // 1) تنقّل الصفحات: Network-first → Cache → Offline HTML
  if (req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html')) {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache: 'no-store' });
        const cache = await caches.open(CACHE_NAME);
        if (okToCache(fresh)) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req) || await caches.match('./index.html');
        return cached || new Response(OFFLINE_HTML, { headers: { 'Content-Type': 'text/html; charset=utf-8' } });
      }
    })());
    return;
  }

  // 2) أصول ثابتة من نفس الدومين: Cache-first + تحديث بالخلفية
  if (isSameOrigin(req.url) && /\.(css|js|png|jpg|jpeg|gif|svg|webp|ico|json|woff2?)$/i.test(req.url)) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(req);
      const networkPromise = fetch(req).then((res) => {
        if (okToCache(res)) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || networkPromise || fetch(req);
    })());
    return;
  }

  // 3) باقي الطلبات: Stale-While-Revalidate خفيف
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(req);
    const network = fetch(req).then((res) => {
      if (okToCache(res)) cache.put(req, res.clone());
      return res;
    }).catch(() => null);
    return cached || network || new Response('Offline', { status: 503, statusText: 'Offline' });
  })());
});
