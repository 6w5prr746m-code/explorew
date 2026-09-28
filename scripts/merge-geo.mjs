// Fusionne dans modules.json les coordonnées marquées « valide » dans docs/geo/proposition.json.
// Usage : npm run geo:fusionner   (puis npm run validate)
import { readFileSync, writeFileSync } from "node:fs";
const url = p => new URL(p, import.meta.url);
const path = url("../public/data/modules.json");
const raw = readFileSync(path, "utf8");
const mods = JSON.parse(raw);
const prop = JSON.parse(readFileSync(url("../docs/geo/proposition.json")));
const ok = new Map(prop.modules.filter(e => e.statut === "valide").map(e => [e.code, e.geo]));
let n = 0;
for (const m of mods) {
  const g = ok.get(m.code); if (!g) continue;
  if (typeof g.lat !== "number" || typeof g.lng !== "number" || g.lat < -21.42 || g.lat > -20.85 || g.lng < 55.2 || g.lng > 55.85)
    throw new Error(`${m.code} : coordonnées hors de La Réunion ou mal formées`);
  m.geo = { lat: g.lat, lng: g.lng }; n++;
}
writeFileSync(path, JSON.stringify(mods, null, 1) + (raw.endsWith("\n") ? "\n" : ""));
console.log(`${n} module(s) mis à jour. Pensez à incrémenter VERSION dans sw.js.`);
