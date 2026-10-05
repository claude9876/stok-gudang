// Service worker Stok Gudang. Naikkan VERSI setiap file statis (ikon/manifest) berubah.
const VERSI = 'stok-staf-v2';
const CDN = 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js';
const SHELL = ['./', 'index.html', 'manifest.json', 'icon-192.png'];

self.addEventListener('install', e => e.waitUntil(
  caches.open(VERSI).then(c => Promise.all([c.addAll(SHELL), c.add(CDN)])).then(() => self.skipWaiting())));

self.addEventListener('activate', e => e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k !== VERSI).map(k => caches.delete(k)))).then(() => self.clients.claim())));

// Jaringan dulu (maks. 3 dtk) agar versi baru cepat sampai; jatuh ke cache bila offline/lambat.
const jaringan = (req, ms) => new Promise((ok, gagal) => {
  const t = setTimeout(gagal, ms);
  fetch(req).then(res => { clearTimeout(t); const c = res.clone(); caches.open(VERSI).then(ca => ca.put(req, c)); ok(res); },
                  err => { clearTimeout(t); gagal(err); });
});

self.addEventListener('fetch', e => {
  const req = e.request, u = new URL(req.url);
  if (req.method !== 'GET') return;
  if (u.hostname.endsWith('.supabase.co')) return;            // API, auth, realtime, foto: selalu lewat jaringan
  if (req.mode === 'navigate') {
    e.respondWith(jaringan(req, 3000).catch(() => caches.match(req).then(r => r || caches.match('index.html'))));
    return;
  }
  if (u.origin === location.origin || u.href === CDN)           // file statis: cache dulu
    e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
      const c = res.clone(); caches.open(VERSI).then(ca => ca.put(req, c)); return res; })));
});
