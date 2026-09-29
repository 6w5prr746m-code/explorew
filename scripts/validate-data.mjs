// Vérifie data/modules.json (codes uniques, renvois valides, zones et filtres connus)
// et data/destinations/reunion.json (champs attendus par l'app).
// Usage : npm run validate   (échoue en CI si une erreur est trouvée)
import { readFileSync } from "node:fs";
const mods = JSON.parse(readFileSync(new URL("../public/data/modules.json", import.meta.url)));
const dest = JSON.parse(readFileSync(new URL("../public/data/destinations/reunion.json", import.meta.url)));
const FILTRES = ["FAM","BUS","€","PLUIE","AUBE","LOCAL"];
const PROFILS = {AV:"aventurier",LA:"lagon",RA:"randonneur",EP:"epicurien",FA:"famille",SL:"slow",PB:"plan-b-pluie",NE:"nuit-etoiles"};
const errors = []; const codes = new Set();

// Destination : champs lus par boot.js, data.js, map.js, print.js et share.js
const str = v => typeof v === "string" && v.length > 0;
const num = v => typeof v === "number" && Number.isFinite(v);
const pt = v => Array.isArray(v) && v.length === 2 && v.every(num);
const D = (ok, msg) => { if (!ok) errors.push(`destination : ${msg}`); };
D(dest.id === "reunion", "id doit valoir « reunion » (nom du fichier)");
D(str(dest.nom), "nom manquant");
for (const k of ["titreBook","partage","carte","sourcePrincipale"]) D(str(dest.libelles?.[k]), `libelles.${k} manquant`);
D(str(dest.fuseau) && /^[A-Za-z_]+\/[A-Za-z_]+/.test(dest.fuseau), "fuseau IANA manquant");
D(Array.isArray(dest.zones) && dest.zones.length > 0 && dest.zones.every(str) && new Set(dest.zones).size === dest.zones.length, "zones : liste de noms uniques attendue");
const c = dest.carte || {};
for (const k of ["largeur","hauteur","echelle","ratio","marge"]) D(num(c[k]), `carte.${k} manquant`);
D(pt(c.origine), "carte.origine : [lng, lat] attendu");
D(Array.isArray(c.contour) && c.contour.length >= 3 && c.contour.every(pt), "carte.contour : au moins 3 points [lng, lat]");
D(Array.isArray(c.localites) && c.localites.every(l => Array.isArray(l) && l.length === 3 && str(l[0]) && num(l[1]) && num(l[2])), "carte.localites : [nom, lng, lat] attendus");
D(c.centresZones && typeof c.centresZones === "object" && Object.values(c.centresZones).every(pt), "carte.centresZones : { zone: [lng, lat] } attendu");
for (const z of dest.zones || []) D(pt(c.centresZones?.[z]), `carte.centresZones : centre manquant pour « ${z} »`);
D(str(c.zoneParDefaut) && (dest.zones || []).includes(c.zoneParDefaut), "carte.zoneParDefaut doit être une zone connue");
D(Array.isArray(c.cirques) && c.cirques.every(x => pt(x.centre) && num(x.rayon) && str(x.nom) && num(x.dy)), "carte.cirques : {centre, rayon, nom, dy} attendus");
D(Array.isArray(c.villes) && c.villes.every(x => pt(x.pos) && str(x.nom) && num(x.dx) && num(x.dy) && (x.ancre === undefined || ["start","end"].includes(x.ancre))), "carte.villes : {pos, nom, dx, dy, ancre?} attendus");
D(Array.isArray(dest.urgences) && dest.urgences.length > 0 && dest.urgences.every(u => /^\d+$/.test(u.numero) && str(u.libelle)), "urgences : {numero, libelle} attendus");
D(Array.isArray(dest.sourcesSecurite) && dest.sourcesSecurite.every(str), "sourcesSecurite : liste de libellés attendue");
const ZONES = Array.isArray(dest.zones) ? dest.zones : [];
for (const m of mods) {
  if (!/^(AV|LA|RA|EP)-[DJ]\d{1,2}$|^(FA|SL|PB|NE)-\d{2}$/.test(m.code)) errors.push(`${m.code} : code mal formé`);
  if (codes.has(m.code)) errors.push(`${m.code} : code en double`); codes.add(m.code);
  if (PROFILS[m.code.slice(0,2)] !== m.profil) errors.push(`${m.code} : profil incohérent (${m.profil})`);
  if (!ZONES.includes(m.zone)) errors.push(`${m.code} : zone inconnue « ${m.zone} »`);
  for (const f of m.filtres) if (!FILTRES.includes(f)) errors.push(`${m.code} : filtre inconnu « ${f} »`);
  if (!m.titre || !m.essentiel) errors.push(`${m.code} : titre ou essentiel manquant`);
  if (m.niveau !== null && ![1,2,3].includes(m.niveau)) errors.push(`${m.code} : niveau invalide`);
  if (m.geo && (typeof m.geo.lat !== "number" || typeof m.geo.lng !== "number")) errors.push(`${m.code} : geo invalide`);
}
for (const m of mods) for (const k of ["planB","combo"]) {
  const v = m[k]; if (v && /^[A-Z]{2}-[DJ0-9]/.test(v) && !codes.has(v)) errors.push(`${m.code} : ${k} renvoie vers ${v} qui n'existe pas`);
}
const aVerifier = mods.filter(m => JSON.stringify(m).includes("vérifier")).length;
const sansGeo = mods.filter(m => !m.geo).length;
console.log(`${mods.length} modules · ${aVerifier} contiennent « à vérifier » · ${sansGeo} sans coordonnées GPS`);
if (errors.length) { console.error(errors.join("\n")); process.exit(1); }
console.log("Données valides.");
