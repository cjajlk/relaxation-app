/* zenus v0.2 : installation hors connexion, ressources audio et images comprises. */
const CACHE = 'zenus-static-v2';
const ASSETS = [
  './', './index.html', './zenus.css', './zenus.js', './zenus-icon.svg',
  './manifest.webmanifest', './exercice.html', './exercice.js',
  './progress.html', './progress.js', './styles.css', './script.js', './ancienne-version.html',
  './assets/backgrounds/foret.png', './assets/backgrounds/ocean.pg.png',
  './assets/backgrounds/pluie.png', './assets/backgrounds/chemin%C3%A9e.png',
  './assets/scenes/forest.webp', './assets/scenes/ocean.webp', './assets/scenes/rain.webp', './assets/scenes/fire.webp',
  './assets/scenes/forest-nuit.webp', './assets/scenes/ocean-nuit.webp', './assets/scenes/rain-nuit.webp', './assets/scenes/fire-nuit.webp',
  './sounds/pluie-douce.ogg', './sounds/vagues-calmes.ogg', './sounds/feu-doux.ogg',
  './sounds/brise.ogg', './sounds/musique-ambient.ogg'
];
self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('zenus-static-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET' || new URL(event.request.url).origin !== self.location.origin) return;
  // Les fichiers statiques sont mis en cache : son sans connexion et peu de trafic.
  const pathname = new URL(event.request.url).pathname;
  const asset = /\.(?:ogg|webp|png|svg|js|css|webmanifest)$/.test(pathname);
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (asset) {
      const cached = await cache.match(event.request);
      if (cached) {
        // Les lecteurs audio peuvent demander une plage d'octets ; servir un 206 valide,
        // y compris lorsque le téléphone est déconnecté.
        const range = event.request.headers.get('range');
        if (range && /\.ogg$/i.test(pathname)) {
          const file = await cached.arrayBuffer();
          const match = /^bytes=(\d+)-(\d*)$/.exec(range);
          if (match) {
            const start = Number(match[1]);
            const end = match[2] ? Math.min(Number(match[2]), file.byteLength-1) : file.byteLength-1;
            if (start >= file.byteLength || end < start) {
              return new Response(null, {status:416,headers:{'Content-Range':'bytes */'+file.byteLength}});
            }
            return new Response(file.slice(start,end+1), {status:206,headers:{
              'Content-Type':'audio/ogg', 'Accept-Ranges':'bytes',
              'Content-Range':'bytes '+start+'-'+end+'/'+file.byteLength,
              'Content-Length':String(end-start+1)
            }});
          }
        }
        return cached;
      }
    }
    try {
      const response = await fetch(event.request);
      if (response.ok && response.type === 'basic') await cache.put(event.request, response.clone());
      return response;
    } catch (_) {
      return (await cache.match(event.request)) || (await caches.match('./index.html')) || Response.error();
    }
  })());
});
