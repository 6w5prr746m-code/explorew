import { test, expect } from "@playwright/test";
import { spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Outil de fusion des sources (scripts/merge-sources.mjs) et contrôle du format dans validate-data.
// Aucun navigateur : le script est lancé sur des copies temporaires des fichiers.
const racine = fileURLToPath(new URL("..", import.meta.url));
const MODULES_RAW = readFileSync(join(racine, "public/data/modules.json"), "utf8");
const MODULES = JSON.parse(MODULES_RAW);
const avant = code => MODULES.find(m => m.code === code);
const CODE = "AV-J1", AUTRE = "RA-D9";

const entree = (o = {}) => ({
  code: CODE, titre: avant(CODE).titre,
  source: "https://www.reunion.fr/offres/exemple-fr-1/",
  extraits: [{ champ: "duree", texte: "Phrase exacte de la page." }],
  consulteLe: "2026-09-30", statut: "valide", note: "", ...o,
});
const proposition = modules => ({ genereLe: "2026-10-01", modeEmploi: "Test.", modules });

let dir;
test.beforeEach(() => { dir = mkdtempSync(join(tmpdir(), "carnetpei-sources-")); });
test.afterEach(() => { rmSync(dir, { recursive: true, force: true }); });

function preparer(modules) {
  const prop = join(dir, "proposition.json"), mods = join(dir, "modules.json");
  writeFileSync(prop, JSON.stringify(proposition(modules), null, 2) + "\n");
  writeFileSync(mods, MODULES_RAW);
  return { prop, mods };
}
const lancer = (f, ...extra) => spawnSync(process.execPath,
  [join(racine, "scripts/merge-sources.mjs"), "--proposition", f.prop, "--modules", f.mods, ...extra], { encoding: "utf8" });
const lire = p => JSON.parse(readFileSync(p, "utf8"));

test.describe("Fusion des sources", () => {
  test("une entrée valide ne change que source et verifieLe, puis passe à « fusionne »", () => {
    const f = preparer([entree()]);
    const r = lancer(f);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("1 module(s) mis à jour");
    const apres = lire(f.mods);
    expect(apres).toHaveLength(MODULES.length);
    for (const [i, m] of apres.entries()) {
      if (m.code !== CODE) { expect(m).toEqual(MODULES[i]); continue; }
      expect(m).toEqual({ ...avant(CODE), source: "https://www.reunion.fr/offres/exemple-fr-1/", verifieLe: "2026-09-30" });
      expect(Object.keys(m)).toEqual(Object.keys(avant(CODE)));
    }
    expect(lire(f.prop).modules[0].statut).toBe("fusionne");
    // Même indentation que l'original : seules les deux lignes du module changent.
    const diff = readFileSync(f.mods, "utf8").split("\n").filter((l, i) => l !== MODULES_RAW.split("\n")[i]);
    expect(diff).toHaveLength(2);
  });

  test("les entrées « a-relire » et « rejete » sont ignorées", () => {
    const f = preparer([entree({ statut: "a-relire" }), entree({ code: AUTRE, titre: avant(AUTRE).titre, statut: "rejete" })]);
    const r = lancer(f);
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("0 module(s)");
    expect(readFileSync(f.mods, "utf8")).toBe(MODULES_RAW);
    expect(lire(f.prop).modules.map(e => e.statut)).toEqual(["a-relire", "rejete"]);
  });

  const refus = [
    ["un domaine hors liste officielle", { source: "https://www.tripadvisor.fr/x" }, "hors liste officielle"],
    ["un faux sous-domaine", { source: "https://reunion.fr.example.com/x" }, "hors liste officielle"],
    ["une URL non https", { source: "http://www.reunion.fr/x" }, "URL https attendue"],
    ["aucun extrait", { extraits: [] }, "aucun extrait"],
    ["un extrait vide", { extraits: [{ champ: "duree", texte: "  " }] }, "texte vide"],
    ["un code inconnu", { code: "ZZ-99" }, "code inconnu"],
    ["une date invalide", { consulteLe: "2026-02-30" }, "date AAAA-MM-JJ attendue"],
    ["une date dans le futur", { consulteLe: "2999-01-01" }, "dans le futur"],
  ];
  for (const [nom, o, motif] of refus) {
    test(`refus pour ${nom} : sortie en erreur, rien n'est écrit`, () => {
      // Une entrée correcte accompagne l'entrée fautive : le refus est global.
      const f = preparer([entree({ code: AUTRE, titre: avant(AUTRE).titre }), entree(o)]);
      const propRaw = readFileSync(f.prop, "utf8");
      const r = lancer(f);
      expect(r.status).toBe(1);
      expect(r.stderr).toContain("Fusion refusée");
      expect(r.stderr).toContain(motif);
      expect(readFileSync(f.mods, "utf8")).toBe(MODULES_RAW);
      expect(readFileSync(f.prop, "utf8")).toBe(propRaw);
    });
  }

  test("--dry-run annonce la fusion sans rien écrire", () => {
    const f = preparer([entree()]);
    const propRaw = readFileSync(f.prop, "utf8");
    const r = lancer(f, "--dry-run");
    expect(r.status, r.stderr).toBe(0);
    expect(r.stdout).toContain("rien n'est écrit");
    expect(r.stdout).toContain(`${CODE} : source`);
    expect(readFileSync(f.mods, "utf8")).toBe(MODULES_RAW);
    expect(readFileSync(f.prop, "utf8")).toBe(propRaw);
  });
});

test.describe("Contrôle du format par npm run validate", () => {
  const valider = p => spawnSync(process.execPath, [join(racine, "scripts/validate-data.mjs"), "--sources", p], { encoding: "utf8" });

  test("un fichier conforme passe, un fichier absent est ignoré", () => {
    const f = preparer([entree({ statut: "a-relire" }), entree({ statut: "fusionne" })]);
    expect(valider(f.prop).status).toBe(0);
    expect(valider(join(dir, "absent.json")).status).toBe(0);
  });

  test("statut inconnu, code inconnu, URL non https et champ manquant sont signalés", () => {
    const sansDate = entree(); delete sansDate.consulteLe;
    const f = preparer([entree({ statut: "ok" }), entree({ code: "ZZ-99" }), entree({ source: "http://www.reunion.fr/" }), sansDate]);
    const r = valider(f.prop);
    expect(r.status).toBe(1);
    expect(r.stderr).toContain("statut inconnu « ok »");
    expect(r.stderr).toContain("ZZ-99 : code inconnu");
    expect(r.stderr).toContain("source doit être une URL https");
    expect(r.stderr).toContain("consulteLe : date AAAA-MM-JJ attendue");
  });
});
