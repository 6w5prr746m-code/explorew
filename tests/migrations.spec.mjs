import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";
import AxeBuilder from "@axe-core/playwright";

// Mise à jour sûre des données : codes disparus de modules.json, codes renommés, sauvegarde impossible, stockage persistant.

// Écrit un état dans localStorage puis recharge l'app (l'état est lu au chargement).
async function chargerEtat(page, etat) {
  await page.evaluate(e => localStorage.setItem("carnetpei.v1", JSON.stringify(e)), etat);
  await page.reload();
  await expect(page.locator("#list .card").first()).toBeVisible();
  await page.waitForFunction(() => !!window.__PEI);
}
const lireEtat = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1")));
const jourVide = () => ({ slots: { m: [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "" });

test("un code disparu libère son créneau, est retiré des listes et signalé une fois", async ({ page }) => {
  const { errors } = await openApp(page);
  const days = Array.from({ length: 7 }, jourVide);
  days[0].slots.m = ["ZZ-99"];
  days[0].slots.a = ["AV-D1"];
  days[1].slots.s = ["ZZ-98", "ZZ-99"];
  await chargerEtat(page, {
    dest: "reunion", fmt: 7, start: "", example: false, days, stamps: {}, words: [], back: "", checks: {},
    done: { "ZZ-99": "2026-09-10", "AV-D1": "2026-09-11" }, back2: ["ZZ-98", "AV-D1"],
  });

  await tab(page, "trip");
  await expect(page.locator("#k-mod")).toHaveText("1");
  await expect(page.locator("#k-free")).toHaveText("20");
  const S = await page.evaluate(() => window.__PEI.S);
  expect(S.days[0].slots.m).toEqual([]);
  expect(S.days[1].slots.s).toEqual([]);
  expect(S.done).toEqual({ "AV-D1": "2026-09-11" });
  expect(S.back2).toEqual(["AV-D1"]);

  const msg = page.locator("#avis-retires");
  await expect(msg).toHaveCount(1);
  await expect(msg).toContainText("ZZ-98, ZZ-99");
  await expect(msg).toContainText("leurs créneaux sont libérés");
  // L'état nettoyé est enregistré.
  await expect.poll(async () => JSON.stringify((await lireEtat(page)).days)).not.toContain("ZZ-9");

  // Tant qu'il n'est pas fermé, le message revient au chargement suivant (une seule fois à l'écran).
  await page.reload();
  await expect(page.locator("#avis-retires")).toHaveCount(1);
  const fermer = page.locator("#avis-retires .avis-x");
  const box = await fermer.boundingBox();
  expect(box.height).toBeGreaterThanOrEqual(40);
  expect(box.width).toBeGreaterThanOrEqual(40);
  await fermer.click();
  await expect(page.locator("#avis-retires")).toHaveCount(0);
  await expect.poll(async () => (await lireEtat(page)).modulesRetires).toBeUndefined();

  await page.reload();
  await expect(page.locator("#list .card").first()).toBeVisible();
  await page.waitForFunction(() => !!window.__PEI);
  await expect(page.locator("#avis .avis")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("la table de renommage remplace les anciens codes avant le nettoyage", async ({ page }) => {
  await openApp(page);
  const r = await page.evaluate(async () => {
    const m = await import("/js/migrations.js");
    const existe = c => ["AV-D1", "LA-D1", "RA-D1"].includes(c);
    const table = { "AV-X1": "AV-D1", "LA-X1": "LA-D1", "NE-X1": "NE-X2", "RA-D1": "AV-D1" };
    const etat = {
      days: [{ slots: { m: ["AV-X1"], a: ["NE-X1"], s: ["RA-D1"] } }, { slots: { m: ["ZZ-01"], a: [], s: ["LA-X1"] } }],
      done: { "AV-X1": "2026-09-10", "LA-D1": "2026-09-12", "LA-X1": "2026-09-01" },
      back2: ["LA-X1", "LA-D1", "ZZ-01"],
    };
    const res = m.migrerCodes(etat, existe, table);
    return { res, etat, vide: Object.keys(m.CODES_RENOMMES).length, gele: Object.isFrozen(m.CODES_RENOMMES) };
  });
  expect(r.vide).toBe(0);
  expect(r.gele).toBe(true);
  expect(r.etat.days[0].slots).toEqual({ m: ["AV-D1"], a: [], s: ["RA-D1"] }); // RA-D1 existe : jamais renommé
  expect(r.etat.days[1].slots).toEqual({ m: [], a: [], s: ["LA-D1"] });
  expect(r.etat.done).toEqual({ "AV-D1": "2026-09-10", "LA-D1": "2026-09-12" }); // le tampon existant du nouveau code est gardé
  expect(r.etat.back2).toEqual(["LA-D1"]);
  expect(r.res.renommes.sort()).toEqual(["AV-X1→AV-D1", "LA-X1→LA-D1"]);
  // Une cible absente des données : l'ancien code est traité comme retiré, aucun remplacement inventé.
  expect(r.res.retires).toEqual(["NE-X1", "ZZ-01"]);
});

test("pas de message quand toutes les données sont à jour", async ({ page }) => {
  const { errors } = await openApp(page);
  await tab(page, "trip");
  await page.locator("#days [data-rm]").first().click();
  await page.waitForTimeout(400);
  await page.reload();
  await expect(page.locator("#list .card").first()).toBeVisible();
  await page.waitForFunction(() => !!window.__PEI);
  await expect(page.locator("#avis .avis")).toHaveCount(0);
  expect((await lireEtat(page)).modulesRetires).toBeUndefined();
  expect(errors).toEqual([]);
});

test("une sauvegarde impossible est signalée une seule fois, sans bloquer", async ({ page }) => {
  await page.addInitScript(() => {
    const set = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (this === window.localStorage && k === "carnetpei.v1") throw new DOMException("Quota dépassé", "QuotaExceededError");
      return set.call(this, k, v);
    };
  });
  const { errors } = await openApp(page);
  await tab(page, "carnet");
  await page.locator("#stamps [data-s]").first().click();
  const msg = page.locator("#avis-sauvegarde");
  await expect(msg).toHaveCount(1);
  await expect(msg).toContainText("ne peuvent pas être enregistrées");
  // L'app reste utilisable et le message n'est pas répété.
  await page.locator("#stamps [data-s]").nth(1).click();
  await expect(page.locator("#stamps [data-s]").nth(1)).toHaveAttribute("aria-pressed", "true");
  await page.waitForTimeout(400);
  await expect(page.locator("#avis .avis")).toHaveCount(1);
  await msg.locator(".avis-x").click();
  await expect(msg).toHaveCount(0);
  await page.locator("#stamps [data-s]").nth(2).click();
  await page.waitForTimeout(400);
  await expect(page.locator("#avis .avis")).toHaveCount(0);
  // Même session (rechargement) : pas de nouveau message.
  await page.reload();
  await page.waitForFunction(() => !!window.__PEI);
  await tab(page, "carnet");
  await page.locator("#stamps [data-s]").first().click();
  await page.waitForTimeout(400);
  await expect(page.locator("#avis .avis")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("le stockage persistant est demandé sans rien afficher", async ({ page }) => {
  await page.addInitScript(() => {
    window.__persist = 0;
    Object.defineProperty(navigator, "storage", { configurable: true, value: {
      persisted: () => Promise.resolve(false),
      persist: () => { window.__persist++; return Promise.resolve(true); },
    } });
  });
  const { errors } = await openApp(page);
  await expect.poll(() => page.evaluate(() => window.__persist)).toBe(1);
  await expect(page.locator("#avis .avis")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("sans navigator.storage, l'app démarre normalement", async ({ page }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, "storage", { configurable: true, value: undefined }));
  const { errors } = await openApp(page);
  await page.waitForFunction(() => !!window.__PEI);
  expect(errors).toEqual([]);
});

// Les deux messages, dans les quatre thèmes : aucune violation axe grave (contrastes AA compris).
// MIGRATIONS_SHOTS=<dossier> enregistre en plus une capture à 400 px de chaque thème.
const SHOTS = process.env.MIGRATIONS_SHOTS;
for (const skin of ["epure", "desert"]) {
  for (const mode of ["light", "dark"]) {
    test(`messages accessibles : ${skin} ${mode === "light" ? "clair" : "sombre"}`, async ({ page }) => {
      await page.addInitScript(() => {
        const set = Storage.prototype.setItem;
        Storage.prototype.setItem = function (k, v) { if (window.__bloque && k === "carnetpei.v1") throw new DOMException("Quota", "QuotaExceededError"); return set.call(this, k, v); };
      });
      await openApp(page);
      const days = Array.from({ length: 7 }, jourVide);
      days[0].slots.m = ["ZZ-99"];
      await chargerEtat(page, { dest: "reunion", fmt: 7, start: "", example: false, days, stamps: {}, words: [], back: "", checks: {}, done: {}, back2: ["ZZ-98"], skin, mode });
      await expect(page.locator("#avis-retires")).toBeVisible();
      await page.evaluate(() => { window.__bloque = true; window.__PEI.save(); });
      await expect(page.locator("#avis-sauvegarde")).toBeVisible();
      expect(await page.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.theme])).toEqual([skin, mode]);
      const { violations } = await new AxeBuilder({ page }).include("#avis").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.filter(v => ["serious", "critical"].includes(v.impact)).map(v => v.id)).toEqual([]);
      if (SHOTS) await page.screenshot({ path: `${SHOTS}/avis-${skin}-${mode}.png` });
    });
  }
}
