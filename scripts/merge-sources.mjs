// Fusionne dans modules.json les sources marquées « valide » dans docs/sources/proposition.json.
// Seuls `source` (URL) et `verifieLe` (= consulteLe) du module changent ; les entrées fusionnées
// passent à « fusionne ». Tout ou rien : à la moindre entrée « valide » refusée, rien n'est écrit.
// Usage : node scripts/merge-sources.mjs [--dry-run] [--proposition <fichier>] [--modules <fichier>]
// Puis : npm run validate, npm run a-verifier, et incrémenter VERSION dans public/sw.js.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { controlerFusion } from "./sources-format.mjs";

const args = process.argv.slice(2);
const opt = nom => { const i = args.indexOf(nom); return i >= 0 ? args[i + 1] : undefined; };
const dryRun = args.includes("--dry-run");
const defaut = p => fileURLToPath(new URL(p, import.meta.url));
const cheminProp = resolve(opt("--proposition") ?? defaut("../docs/sources/proposition.json"));
const cheminMods = resolve(opt("--modules") ?? defaut("../public/data/modules.json"));

const echec = msg => { console.error(msg); process.exit(1); };
const lire = p => { try { const raw = readFileSync(p, "utf8"); return { raw, json: JSON.parse(raw) }; } catch (e) { echec(`Lecture impossible de ${p} : ${e.message}`); } };

const P = lire(cheminProp), M = lire(cheminMods);
const prop = P.json, mods = M.json;
if (!Array.isArray(prop.modules)) echec("proposition.json : « modules » doit être un tableau.");
const parCode = new Map(mods.map(m => [m.code, m]));
const codes = new Set(parCode.keys());

const valides = prop.modules.filter(e => e && e.statut === "valide");
const refus = [], vus = new Set();
for (const e of valides) {
  const motifs = controlerFusion(e, codes);
  if (vus.has(e.code)) motifs.push("code présent plusieurs fois en « valide »");
  vus.add(e.code);
  if (motifs.length) refus.push(`${e.code ?? "(sans code)"} : ${motifs.join(" ; ")}`);
}
if (refus.length) echec(`Fusion refusée, rien n'a été écrit :\n- ${refus.join("\n- ")}`);

const compte = s => prop.modules.filter(e => e && e.statut === s).length;
const bilan = `a-relire : ${compte("a-relire")}, rejete : ${compte("rejete")}, déjà fusionnées : ${compte("fusionne")}`;
const lignes = [];
for (const e of valides) {
  const m = parCode.get(e.code);
  lignes.push(`${e.code} : source ${m.source ?? "null"} → ${e.source} · verifieLe ${m.verifieLe} → ${e.consulteLe}`);
  m.source = e.source;
  m.verifieLe = e.consulteLe;
  e.statut = "fusionne";
}

const ignores = prop.modules.length - valides.length;
console.log(`${dryRun ? "[essai, rien n'est écrit] " : ""}${valides.length} module(s) ${dryRun ? "à mettre à jour" : "mis à jour"} · ${ignores} entrée(s) ignorée(s) (${bilan})`);
for (const l of lignes) console.log(`  ${l}`);
if (dryRun || valides.length === 0) process.exit(0);

// Réécrit chaque fichier avec son indentation d'origine, pour un diff limité aux lignes changées.
const ecrire = (p, f, json) => {
  const retrait = (f.raw.match(/\n( +|\t+)\S/) || [, " "])[1];
  writeFileSync(p, JSON.stringify(json, null, retrait) + (f.raw.endsWith("\n") ? "\n" : ""));
};
ecrire(cheminMods, M, mods);
ecrire(cheminProp, P, prop);
console.log("Pensez à lancer npm run validate et npm run a-verifier, et à incrémenter VERSION dans public/sw.js.");
