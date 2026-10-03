/* Service worker : pré-cache de l'app, réseau d'abord puis cache (hors ligne à Mafate).
   Incrémenter VERSION à chaque déploiement qui modifie les fichiers de l'app. */
const VERSION="carnetpei-v30";
const CORE=["./","index.html","styles.css","boot.js","data/modules.json","data/destinations/reunion.json","manifest.webmanifest","icons/icon.svg","icons/icon-192.png","icons/icon-512.png",
  "fonts/fonts.css","fonts/figtree-latin.woff2","fonts/instrument-serif-latin.woff2","fonts/instrument-serif-italic-latin.woff2","fonts/jetbrains-mono-500-latin.woff2","vendor/qrcode.min.js",
  "js/agenda.js","js/backup.js","js/bilan.js","js/carnet.js","js/carte-postale.js","js/data.js","js/demarrage.js","js/envies.js","js/explorer.js","js/hors-ligne.js","js/main.js","js/map.js","js/migrations.js","js/module-sheet.js","js/nav.js","js/passeport.js","js/pratique.js","js/print.js","js/render.js","js/share.js","js/souvenir.js","js/state.js","js/theme.js","js/today.js","js/trip.js","js/util.js","js/visuals.js"];
self.addEventListener("install",e=>{e.waitUntil(caches.open(VERSION).then(c=>c.addAll(CORE)));self.skipWaiting()});
/* La page (js/hors-ligne.js) demande VERSION et CORE par message, pour vérifier le cache sans dupliquer la liste. */
self.addEventListener("message",e=>{if(e.data==="carnetpei:core"&&e.ports[0])e.ports[0].postMessage({version:VERSION,core:CORE})});
self.addEventListener("activate",e=>{e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==VERSION).map(x=>caches.delete(x)))));self.clients.claim()});
/* Délai maximal d'attente du réseau, en millisecondes. Au-delà, la copie en cache est servie si elle existe (réseau faible
   au démarrage : l'app s'ouvre au lieu de rester blanche) ; la requête réseau continue et met le cache à jour pour la fois suivante.
   Sans copie en cache, le réseau garde la main : on continue de l'attendre. */
const DELAI_RESEAU_MS=4000;
/* Après un dépassement du délai, le réseau est jugé lent pendant cette durée (ms) : les requêtes suivantes du démarrage
   (styles, scripts, données) reçoivent tout de suite leur copie en cache, sinon l'ouverture cumulerait un délai par fichier.
   Le réseau est toujours interrogé en parallèle pour mettre le cache à jour. */
const RESEAU_LENT_MS=30000;
let reseauLentJusqua=0;
self.addEventListener("fetch",e=>{
  if(e.request.method!=="GET")return;
  const enCache=()=>caches.match(e.request,{ignoreSearch:true});
  let repondu=false; // le réseau a déjà répondu : le délai ne doit plus rien changer
  const reseau=fetch(e.request).then(r=>{repondu=true;const cp=r.clone();caches.open(VERSION).then(c=>c.put(e.request,cp)).catch(()=>{});return r});
  const attente=Date.now()<reseauLentJusqua?0:DELAI_RESEAU_MS;
  const delai=new Promise(ok=>setTimeout(ok,attente)).then(()=>repondu?reseau:enCache().then(r=>{if(!r||repondu)return reseau;if(attente)reseauLentJusqua=Date.now()+RESEAU_LENT_MS;return r}));
  e.waitUntil(reseau.catch(()=>{}));
  e.respondWith(Promise.race([reseau.catch(enCache),delai]));
});
