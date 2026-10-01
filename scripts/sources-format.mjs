// Format de docs/sources/proposition.json (sources proposées avec extrait cité), partagé par
// scripts/merge-sources.mjs (fusion) et scripts/validate-data.mjs (contrôle de structure).
// Le format est décrit dans docs/sources/LISEZMOI.md.

// Statuts : l'agent propose (« a-relire »), le CEO tranche (« valide » ou « rejete »),
// le script de fusion marque ce qu'il a reporté dans modules.json (« fusionne »).
export const STATUTS = ["a-relire", "valide", "rejete", "fusionne"];

// Domaines officiels acceptés pour `source` (le domaine lui-même et tous ses sous-domaines,
// par ex. www.reunion.fr, randopitons.reunion.fr).
// LISTE PROVISOIRE : la liste définitive est à fixer par le CEO (voir ROADMAP, « Tableau de santé du contenu »).
// Les offices de tourisme ne sont pas inclus : leurs domaines n'ont pas de format commun sûr
// (ex. .re, .com, .fr selon l'office). À ajouter un par un, après décision du CEO.
export const DOMAINES_OFFICIELS = [
  "reunion.fr",               // IRT, site officiel de la destination
  "onf.fr",                   // Office national des forêts (état des sentiers)
  "cinor.re",                 // Communauté intercommunale du Nord
  "reunion-parcnational.fr",  // Parc national de La Réunion
  "reunion.gouv.fr",          // Préfecture de La Réunion
];

export const domaineOfficiel = host => {
  const h = String(host).toLowerCase().replace(/\.$/, "");
  return DOMAINES_OFFICIELS.some(d => h === d || h.endsWith("." + d));
};

const str = v => typeof v === "string" && v.trim().length > 0;

// URL https valide, ou null.
export const urlHttps = v => {
  if (typeof v !== "string") return null;
  try { const u = new URL(v); return u.protocol === "https:" && u.hostname ? u : null; } catch { return null; }
};

// Date ISO AAAA-MM-JJ réelle (pas de 2026-02-30).
export const dateIso = v => {
  if (typeof v !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return false;
  const d = new Date(v + "T00:00:00Z");
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === v;
};

// Date du jour à La Réunion (UTC+4), au format AAAA-MM-JJ.
export const aujourdhui = () => new Date().toLocaleDateString("sv-SE", { timeZone: "Indian/Reunion" });

// Contrôle de structure (npm run validate) : renvoie une liste de messages d'erreur.
export function controlerStructure(prop, codes) {
  const errs = [];
  const E = msg => errs.push(`sources : ${msg}`);
  if (!prop || typeof prop !== "object" || Array.isArray(prop)) return [`sources : objet JSON attendu`];
  if (!dateIso(prop.genereLe)) E("genereLe : date AAAA-MM-JJ attendue");
  if (typeof prop.modeEmploi !== "string") E("modeEmploi : texte attendu");
  if (!Array.isArray(prop.modules)) { E("modules : tableau attendu"); return errs; }
  prop.modules.forEach((e, i) => {
    const id = e && str(e.code) ? e.code : `modules[${i}]`;
    if (!e || typeof e !== "object") return E(`${id} : objet attendu`);
    if (!str(e.code)) E(`${id} : code manquant`);
    else if (!codes.has(e.code)) E(`${id} : code inconnu dans modules.json`);
    if (typeof e.titre !== "string") E(`${id} : titre manquant`);
    if (!urlHttps(e.source)) E(`${id} : source doit être une URL https`);
    if (!Array.isArray(e.extraits)) E(`${id} : extraits : tableau attendu`);
    else e.extraits.forEach((x, j) => {
      if (!x || typeof x !== "object" || typeof x.champ !== "string" || typeof x.texte !== "string")
        E(`${id} : extraits[${j}] : { champ, texte } attendu`);
    });
    if (!dateIso(e.consulteLe)) E(`${id} : consulteLe : date AAAA-MM-JJ attendue`);
    if (!STATUTS.includes(e.statut)) E(`${id} : statut inconnu « ${e.statut} » (${STATUTS.join(", ")})`);
    if (e.note !== undefined && typeof e.note !== "string") E(`${id} : note : texte attendu`);
  });
  return errs;
}

// Contrôles stricts d'une entrée « valide » avant fusion : renvoie une liste de motifs de refus.
export function controlerFusion(e, codes, jour = aujourdhui()) {
  const errs = [];
  if (!codes.has(e.code)) errs.push("code inconnu dans modules.json");
  const u = urlHttps(e.source);
  if (!u) errs.push(`source « ${e.source} » : URL https attendue`);
  else if (!domaineOfficiel(u.hostname)) errs.push(`domaine « ${u.hostname} » hors liste officielle`);
  if (!Array.isArray(e.extraits) || e.extraits.length === 0) errs.push("aucun extrait cité");
  else e.extraits.forEach((x, j) => {
    if (!x || !str(x.texte)) errs.push(`extraits[${j}] : texte vide`);
    if (!x || !str(x.champ)) errs.push(`extraits[${j}] : champ vide`);
  });
  if (!dateIso(e.consulteLe)) errs.push(`consulteLe « ${e.consulteLe} » : date AAAA-MM-JJ attendue`);
  else if (e.consulteLe > jour) errs.push(`consulteLe ${e.consulteLe} est dans le futur`);
  return errs;
}
