// Propose des coordonnées GPS (champ geo) pour les modules, sans rien inventer.
// Seule source utilisée : docs/geo/geonames-reunion.json (GeoNames, CC BY 4.0).
// Un point n'est proposé que si le « lieu » du module désigne exactement une localité GeoNames
// (éventuellement précédé de « Départ »). Tout le reste reste à null avec un statut explicite.
// Usage : npm run geo:proposer   → docs/geo/proposition.json + docs/geo/PROPOSITION.md
import { readFileSync, writeFileSync } from "node:fs";
const url = p => new URL(p, import.meta.url);
const mods = JSON.parse(readFileSync(url("../public/data/modules.json")));
const ref = JSON.parse(readFileSync(url("../docs/geo/geonames-reunion.json")));
const norm = s => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/^(la |le |les |l')/, "").replace(/[-\s]+/g, " ").trim();
const LOC = new Map(ref.localites.map(l => [norm(l.nom), l]));

const entries = mods.map(m => {
  const base = { code: m.code, titre: m.titre, lieu: m.lieu, zone: m.zone };
  if (m.geo) return { ...base, geo: m.geo, statut: "deja-renseigne" };
  const lieu = m.lieu.trim();
  if (/→|↔|\/|,| ou |^(Au choix|Selon|Toute l'île|Côte|Plages|Marchés|Réseaux|Campings|Rivières|Nord|Sud|Est|Hauts de l'île|Lagon)/.test(lieu))
    return { ...base, geo: null, statut: "sans-point-unique", note: "Itinéraire, plusieurs lieux ou lieu variable : pas de point unique." };
  const cle = norm(lieu.replace(/^Départ /, ""));
  const l = LOC.get(cle);
  if (l) return { ...base, geo: { lat: l.lat, lng: l.lng }, precision: "localite", base: l.nom, source: "GeoNames (CC BY 4.0)", statut: "a-relire",
    note: "Point central de la localité, pas le site exact de l'activité." };
  return { ...base, geo: null, statut: "a-geocoder", note: "Site précis absent de la source : à relever sur une carte officielle (IGN Géoportail) ou OpenStreetMap." };
});

writeFileSync(url("../docs/geo/proposition.json"), JSON.stringify({
  genereLe: new Date().toISOString().slice(0, 10), source: ref.source, licence: ref.licence,
  modeEmploi: "Relire chaque entrée « a-relire ». Pour l'accepter, passer statut à « valide » (et corriger geo si besoin). Pour une entrée « a-geocoder », saisir geo et passer statut à « valide ». Puis : npm run geo:fusionner.",
  modules: entries,
}, null, 1) + "\n");

const by = s => entries.filter(e => e.statut === s);
const tbl = (rows, cols) => ["| " + cols.join(" | ") + " |", "|" + cols.map(() => " --- ").join("|") + "|", ...rows.map(r => "| " + r.join(" | ") + " |")].join("\n");
const md = `# Proposition de coordonnées GPS

Généré par \`npm run geo:proposer\` le ${new Date().toISOString().slice(0, 10)}. **Rien n'est fusionné dans \`modules.json\` tant que vous n'avez pas passé une entrée à \`"statut": "valide"\` dans \`proposition.json\`, puis lancé \`npm run geo:fusionner\`.**

Source unique : ${ref.source}, licence ${ref.licence}. Aucune coordonnée n'a été estimée ou inventée.

| Statut | Modules | Signification |
| --- | --- | --- |
| a-relire | ${by("a-relire").length} | Point central de la localité nommée dans « lieu ». Suffisant pour la carte schématique, pas pour guider sur place. |
| a-geocoder | ${by("a-geocoder").length} | Site précis (belvédère, gîte, sentier…) absent de la source : à relever sur IGN Géoportail ou OpenStreetMap. |
| sans-point-unique | ${by("sans-point-unique").length} | Itinéraire, plusieurs lieux ou lieu variable : laisser \`geo\` à null (la carte place le module au centre de sa zone). |

## À relire (${by("a-relire").length})

${tbl(by("a-relire").map(e => [e.code, e.titre, e.lieu, `${e.geo.lat}, ${e.geo.lng}`]), ["Code", "Titre", "Lieu", "lat, lng"])}

## À géocoder (${by("a-geocoder").length})

Regroupés par lieu : un seul relevé sert à plusieurs modules.

${tbl(Object.entries(by("a-geocoder").reduce((a, e) => ((a[e.lieu] ||= []).push(e.code), a), {})).sort((a, b) => b[1].length - a[1].length).map(([l, c]) => [l, c.join(", ")]), ["Lieu", "Modules"])}

## Sans point unique (${by("sans-point-unique").length})

${by("sans-point-unique").map(e => `\`${e.code}\` ${e.lieu}`).join(" · ")}
`;
writeFileSync(url("../docs/geo/PROPOSITION.md"), md);
console.log(`Proposition : ${by("a-relire").length} à relire · ${by("a-geocoder").length} à géocoder · ${by("sans-point-unique").length} sans point unique`);
