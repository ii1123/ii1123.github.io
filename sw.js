/* ============================================================
   sw.js — Lojain Service Worker
   ============================================================ */

const CACHE = 'lojain-v3';
const CORE  = [
  './index.html',
  './style.css',
  './script.js',
  './settings.json',
  './manifest.json',
];

const OFFLINE_PAGE = `<!doctype html><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Offline</title>
<style>
  html,body{height:100%;margin:0;background:#080a18;color:#f0f0ff;
  font-family:system-ui,sans-serif;display:grid;place-items:center}
  .box{max-width:480px;padding:28px;border-radius:20px;
  background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.1);text-align:center}
  h2{margin:0 0 10px}p{color:#b8bcee;margin:8px 0;font-size:14px}
  button{margin-top:14px;padding:10px 20px;border-radius:40px;
  border:1px solid rgba(255,255,255,.2);background:rgba(255,77,109,.3);
  color:#fff;font-weight:700;cursor:pointer;font-size:14px}
</style>
<div class="box">
  <h2>📴 You're offline</h2>
  <p>No connection right now. The page will reload when you're back.</p>
  <button onclick="location.reload()">Retry</button>
</div>`;

const ok = (r) => r && r.status === 200 && r.type !== 'opaque';

self.addEventListener('install', e => {
  e.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await Promise.allSettled(CORE.map(url =>
      fetch(url, { cache:'no-cache' }).then(r => ok(r) && cache.put(url, r))
    ));
  })());
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(k => k !== CACHE && caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;

  // HTML pages → Network first
  if (req.mode === 'navigate') {
    e.respondWith((async () => {
      try {
        const fresh = await fetch(req, { cache:'no-store' });
        const cache = await caches.open(CACHE);
        if (ok(fresh)) cache.put(req, fresh.clone());
        return fresh;
      } catch {
        const cached = await caches.match(req) || await caches.match('./index.html');
        return cached || new Response(OFFLINE_PAGE, { headers:{'Content-Type':'text/html;charset=utf-8'} });
      }
    })());
    return;
  }

  // Static assets → Cache first + background update
  if (/\.(css|js|json|png|jpg|webp|svg|ico|woff2?)$/i.test(req.url)) {
    e.respondWith((async () => {
      const cache  = await caches.open(CACHE);
      const cached = await cache.match(req);
      const net    = fetch(req).then(r => { if (ok(r)) cache.put(req, r.clone()); return r; }).catch(()=>null);
      return cached || net || fetch(req);
    })());
  }
});
