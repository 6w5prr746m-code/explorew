// Dit si une PR de l'équipe peut être fusionnée automatiquement (règles de docs/EQUIPE.md).
// Usage : node scripts/check-auto-merge.mjs [base]   (base par défaut : origin/main)
// Sortie 0 : fusion automatique autorisée. Sortie 1 : la PR doit passer par le CEO (raisons affichées).
import { execFileSync } from "node:child_process";
const base = process.argv[2] || "origin/main";
const git = (...a) => execFileSync("git", a, { encoding: "utf8", maxBuffer: 64 << 20 });
const files = git("diff", "--name-status", `${base}...HEAD`).trim().split("\n").filter(Boolean).map(l => { const [s, ...p] = l.split("\t"); return { s, f: p[p.length - 1] }; });
const reasons = [];
const touched = re => files.filter(x => re.test(x.f)).map(x => x.f);

// 1. Contenu : modules.json, et validation de coordonnées (statut « valide »)
if (touched(/^public\/data\//).length) reasons.push(`Contenu modifié : ${touched(/^public\/data\//).join(", ")}`);
if (touched(/^docs\/geo\/proposition\.json$/).length && /^\+.*"statut":\s*"valide"/m.test(git("diff", `${base}...HEAD`, "--", "docs/geo/proposition.json")))
  reasons.push("Des coordonnées passent au statut « valide » dans docs/geo/proposition.json");

// 2. Nouvelles dépendances : paquets, fichiers tiers embarqués, ressources externes
if (touched(/^package(-lock)?\.json$/).length) reasons.push("package.json ou package-lock.json modifié (dépendances)");
const vendored = files.filter(x => x.s !== "D" && /^public\/(vendor|fonts)\//.test(x.f)).map(x => x.f);
if (vendored.length) reasons.push(`Fichiers tiers ajoutés ou modifiés : ${vendored.join(", ")}`);
const pubDiff = git("diff", "-U0", `${base}...HEAD`, "--", "public/");
const ext = [...pubDiff.matchAll(/^\+(?!\+\+).*?(https?:\/\/[^\s"'`)<>]+)/gm)].map(m => m[1]).filter(u => !/^https?:\/\/(localhost|127\.0\.0\.1|www\.w3\.org)/.test(u));
if (ext.length) reasons.push(`Nouvelle(s) URL externe(s) dans public/ : ${[...new Set(ext)].join(", ")}`);

// 3. Consignes de sécurité : toute ligne ajoutée ou retirée qui en parle, dans l'app
const SECU = /baignade|se baigner|zone surveillée|zones surveillées|crue|rivi[eè]re|volcan|OVPF|éruption|eruption|sentier|onf\.fr|Météo-France|vigilance|cyclone|urgence|SAMU|pompiers|\b112\b/i;
const secuLines = pubDiff.split("\n").filter(l => /^[+-](?![+-])/.test(l) && SECU.test(l));
if (secuLines.length) reasons.push(`Consignes de sécurité possiblement touchées (${secuLines.length} ligne(s) dans public/)`);

// 4. Gouvernance : règles de l'équipe, CI, instructions
const gov = touched(/^(CLAUDE\.md|docs\/EQUIPE\.md|\.claude\/|\.github\/|scripts\/check-auto-merge\.mjs|LICENSE)/);
if (gov.length) reasons.push(`Règles, CI ou licences modifiées : ${gov.join(", ")}`);

if (reasons.length) { console.log("À faire valider par le CEO :\n- " + reasons.join("\n- ")); process.exit(1); }
console.log(`Fusion automatique autorisée (${files.length} fichier(s)).`);
