/* AI-Qazaq Sign · Service Worker
   • Өз файлдары (index.html, dataset.json): алдымен желіден (жаңа нұсқа бірден келеді), желі болмаса — кэштен.
   • MediaPipe кітапханасы, модельдер, қаріптер: алдымен кэштен (бір рет жүктелген соң интернетсіз жұмыс істейді). */
const VER = 'qs-v1.5';
const ASSETS = 'qs-assets';
const CORE = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './privacy.html'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(VER).then(c => Promise.all(CORE.map(u => c.add(u).catch(() => null)))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.startsWith('qs-v') && k !== VER).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
const HEAVY = /cdn\.jsdelivr\.net\/npm\/@mediapipe|storage\.googleapis\.com\/mediapipe-models|fonts\.(googleapis|gstatic)\.com/;
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (HEAVY.test(url.href)) {
    e.respondWith(caches.open(ASSETS).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      try { const r = await fetch(req); if (r && (r.ok || r.type === 'opaque')) c.put(req, r.clone()); return r; }
      catch (err) { return Response.error(); }
    }));
    return;
  }
  if (url.origin === self.location.origin) {
    e.respondWith(fetch(req).then(r => {
      if (r && r.ok) { const cl = r.clone(); caches.open(VER).then(c => c.put(req, cl)); }
      return r;
    }).catch(async () => (await caches.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? caches.match('./index.html') : Response.error())));
  }
});
