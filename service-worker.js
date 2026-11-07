/* zenus : mise en cache des ressources locales pour l'utilisation sans connexion. */
const CACHE = 'zenus-static-v1';
const ASSETS = [
  './', './index.html', './zenus.css', './zenus.js', './zenus-icon.svg',
  './manifest.webmanifest', './exercice.html', './exercice.js',
  './progress.html', './progress.js', './styles.css', './script.js', './ancienne-version.html',
  './assets/backgrounds/foret.png', './assets/backgrounds/ocean.pg.png',
  './assets/backgrounds/pluie.png', './assets/backgrounds/chemin%C3%A9e.png'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(event.request, copy)).catch(() => {});
    }
    return response;
  }).catch(async () => (await caches.match(event.request)) || Response.error()));
});
