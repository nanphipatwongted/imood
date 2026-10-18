// Service worker: makes repeat visits fast and lets the app open offline.
// Registered from src/layouts/Layout.astro in production builds only (it would
// fight Vite's hot reload in dev).
//
// - Page: network first (so updates show up), cached copy when offline.
// - /_astro/* (hashed build files): cache first — the hash changes when content does.
// - Other same-origin files (sounds, icons, posters): stale-while-revalidate, so
//   a replaced sound file with the same name is picked up on the next visit.
// - Videos and anything cross-origin (YouTube, Google Fonts): not handled.
//   Videos use range requests, which don't cache cleanly.

const CACHE = 'imood-v1'; // bump to drop everything cached by older versions
const SHELL = ['/', '/manifest.webmanifest', '/favicon.svg', '/icon-192.png', '/icon-512.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

function cachePut(request, response) {
  if (response.ok && response.status === 200) {
    const copy = response.clone();
    caches.open(CACHE).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (request.headers.has('range') || /\.(mp4|webm)$/.test(url.pathname)) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => cachePut('/', response))
        .catch(() => caches.match('/')),
    );
    return;
  }

  if (url.pathname.startsWith('/_astro/')) {
    event.respondWith(
      caches.match(request).then((hit) => hit || fetch(request).then((r) => cachePut(request, r))),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((hit) => {
      const network = fetch(request)
        .then((r) => cachePut(request, r))
        .catch(() => hit);
      return hit || network;
    }),
  );
});
