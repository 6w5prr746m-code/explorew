// Vérifie data/modules.json : codes uniques, renvois valides, zones et filtres connus.
// Usage : npm run validate   (échoue en CI si une erreur est trouvée)
import { readFileSync } from "node:fs";
const mods = JSON.parse(readFileSync(new URL("../public/data/modules.json", import.meta.url)));
const ZONES = ["Ouest","Hauts","Sud","Sud sauvage","Volcan","Est","Nord","Cilaos","Salazie","Mafate","Cirques","Toute l'île"];
const FILTRES = ["FAM","BUS","€","PLUIE","AUBE","LOCAL"];
const PROFILS = {AV:"aventurier",LA:"lagon",RA:"randonneur",EP:"epicurien",FA:"famille",SL:"slow",PB:"plan-b-pluie",NE:"nuit-etoiles"};
const errors = []; const codes = new Set();
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
