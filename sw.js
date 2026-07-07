/* CellMapper Forensic — Service Worker
   by.MerCy-TKM
   กลยุทธ์: precache app shell, runtime cache สำหรับ CDN + tile แผนที่
   เพื่อให้ใช้งานภาคสนามแบบออฟไลน์ได้ */

const VERSION      = 'v1.1.0';
const CACHE_SHELL  = 'cmf-shell-' + VERSION;
const CACHE_CDN    = 'cmf-cdn-'   + VERSION;
const CACHE_TILES  = 'cmf-tiles-' + VERSION;
const TILE_LIMIT   = 900;   // จำกัดจำนวน tile ที่ cache กันเต็มเครื่อง

// ไฟล์ในโปรเจกต์ (same-origin) — ใช้ path สัมพัทธ์เพื่อรองรับ subpath ของ GitHub Pages
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './icon-maskable-512.png',
  './apple-touch-icon.png',
  './favicon.png'
];

// โฮสต์ CDN ที่ควร cache (Leaflet + Google Fonts)
const CDN_HOSTS = ['unpkg.com', 'fonts.googleapis.com', 'fonts.gstatic.com'];
// โฮสต์ tile แผนที่ (cache ตามที่เปิดดู)
const TILE_HOSTS = ['tile.openstreetmap.org', 'basemaps.cartocdn.com', 'server.arcgisonline.com'];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_SHELL)
      .then(c => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch(err => console.warn('[SW] precache partial', err))
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.filter(k => ![CACHE_SHELL, CACHE_CDN, CACHE_TILES].includes(k))
          .map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

// จำกัดขนาด cache tile
async function trimCache(name, max) {
  const cache = await caches.open(name);
  const keys = await cache.keys();
  if (keys.length > max) {
    for (let i = 0; i < keys.length - max; i++) await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // 1) tile แผนที่ → cache-first (เก็บไว้ดูออฟไลน์)
  if (TILE_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.open(CACHE_TILES).then(async cache => {
        const hit = await cache.match(req);
        if (hit) return hit;
        try {
          const res = await fetch(req);
          if (res && res.status === 200) { cache.put(req, res.clone()); trimCache(CACHE_TILES, TILE_LIMIT); }
          return res;
        } catch (_) {
          return hit || Response.error();
        }
      })
    );
    return;
  }

  // 2) CDN (Leaflet/fonts) → stale-while-revalidate
  if (CDN_HOSTS.some(h => url.hostname.includes(h))) {
    e.respondWith(
      caches.open(CACHE_CDN).then(async cache => {
        const hit = await cache.match(req);
        const net = fetch(req).then(res => {
          if (res && res.status === 200) cache.put(req, res.clone());
          return res;
        }).catch(() => hit);
        return hit || net;
      })
    );
    return;
  }

  // 3) navigation → network-first, fallback index.html (ทำงานออฟไลน์)
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).catch(() => caches.match('./index.html'))
    );
    return;
  }

  // 4) same-origin อื่นๆ → cache-first
  if (url.origin === self.location.origin) {
    e.respondWith(
      caches.match(req).then(hit => hit || fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE_SHELL).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => caches.match('./index.html')))
    );
  }
});

// ให้หน้าเว็บสั่งอัปเดตทันที
self.addEventListener('message', e => {
  if (e.data === 'skipWaiting') self.skipWaiting();
});
