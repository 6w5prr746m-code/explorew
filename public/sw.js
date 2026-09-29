/* Service worker : pré-cache de l'app, réseau d'abord puis cache (hors ligne à Mafate).
   Incrémenter VERSION à chaque déploiement qui modifie les fichiers de l'app. */
const VERSION="carnetpei-v9";
const CORE=["./","index.html","styles.css","boot.js","data/modules.json","data/destinations/reunion.json","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png",
  "fonts/fonts.css","fonts/figtree-latin.woff2","fonts/instrument-serif-latin.woff2","fonts/instrument-serif-italic-latin.woff2","fonts/jetbrains-mono-500-latin.woff2","vendor/qrcode.min.js",
  "js/backup.js","js/carnet.js","js/data.js","js/explorer.js","js/main.js","js/map.js","js/module-sheet.js","js/nav.js","js/pratique.js","js/print.js","js/render.js","js/share.js","js/state.js","js/theme.js","js/today.js","js/trip.js","js/util.js","js/visuals.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)));self.skipWaiting()});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))));self.clients.claim()});
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  e.respondWith(fetch(e.request).then(r=>{const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp)).catch(()=>{});return r}).catch(()=>caches.match(e.request,{ignoreSearch:true})));
});
