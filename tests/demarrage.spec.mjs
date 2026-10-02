import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";
import AxeBuilder from "@axe-core/playwright";
import { readFileSync } from "node:fs";

// Encart « Par où commencer ? » (js/demarrage.js) : onglet Explorer, tant que la trame d'exemple est affichée.
const DATA = JSON.parse(readFileSync(new URL("../public/data/modules.json", import.meta.url), "utf8"));
const MODULES = Array.isArray(DATA) ? DATA : DATA.modules;
const BY = Object.fromEntries(MODULES.map(m => [m.code, m]));
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1") || "{}"));
const encart = page => page.locator("#demarrage");
const proposes = page => page.locator("#demarrage [data-dem]").evaluateAll(els => els.map(e => e.dataset.dem));

// Règle attendue, recalculée ici depuis les données brutes (indépendamment du code de l'app).
function regle() {
  const ok = MODULES.filter(m => m.fiche === "complete" && (m.niveau === 1 || m.niveau == null) && ["Gratuit", "€"].includes(m.budget) && !(m.securite || []).length)
    .sort((a, b) => (a.code < b.code ? -1 : a.code > b.code ? 1 : 0));
  const vus = new Set(), choix = [];
  for (const m of ok) { if (choix.length >= 3) break; if (vus.has(m.profil)) continue; vus.add(m.profil); choix.push(m.code); }
  return choix;
}

test.describe("Par où commencer ?", () => {
  test("visible avec le voyage d'exemple, trois modules conformes à la règle", async ({ page }) => {
    const { errors } = await openApp(page);
    await expect(encart(page)).toBeVisible();
    await expect(encart(page).locator("h2")).toHaveText("Par où commencer ?");
    await expect(encart(page).locator(".dem-etapes li")).toHaveCount(3);
    const codes = await proposes(page);
    expect(codes).toEqual(regle());
    expect(codes).toHaveLength(3);
    for (const c of codes) {
      const m = BY[c];
      expect(m.fiche).toBe("complete");
      expect([1, null]).toContain(m.niveau ?? null);
      expect(["Gratuit", "€"]).toContain(m.budget);
      expect(m.securite || []).toEqual([]);
    }
    expect(new Set(codes.map(c => BY[c].profil)).size).toBe(3);
    // Zones tactiles de 40 px minimum
    for (const b of await encart(page).locator("button").all()) {
      const r = await b.boundingBox();
      expect(r.height).toBeGreaterThanOrEqual(40);
      expect(r.width).toBeGreaterThanOrEqual(40);
    }
    expect(errors).toEqual([]);
  });

  test("« Voir la fiche » ouvre la fiche existante", async ({ page }) => {
    await openApp(page);
    const [c] = await proposes(page);
    await encart(page).locator(`[data-dem-voir="${c}"]`).click();
    await expect(page.locator("#dlg #padd")).toBeVisible();
    await expect(page.locator("#sheet .code").first()).toContainText(c);
  });

  test("« Ajouter au jour 1 » place le module au jour 1, sort de l'exemple et retire l'encart", async ({ page }) => {
    await openApp(page);
    const [c] = await proposes(page);
    await encart(page).locator(`[data-dem-add="${c}"]`).click();
    await expect(page.locator(".toast")).toContainText("Ajouté au jour 1");
    await expect(encart(page)).toBeHidden();
    const s = await page.evaluate(() => ({ ex: window.__PEI.S.example, j1: window.__PEI.S.days[0].slots }));
    expect(s.ex).toBe(false);
    // Le matin du jour 1 de l'exemple est libre : le module y est placé.
    expect(s.j1.m).toEqual([c]);
    await tab(page, "trip");
    await expect(page.locator('#days details[data-i="0"] .pill .code', { hasText: c })).toBeVisible();
    await page.waitForTimeout(400);
    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    await expect(encart(page)).toBeHidden();
  });

  test("fermeture mémorisée après rechargement", async ({ page }) => {
    await openApp(page);
    await encart(page).locator("#dem-fermer").click();
    await expect(encart(page)).toBeHidden();
    await expect(page.locator("#profiles button").first()).toBeFocused();
    // Le voyage d'exemple reste en place
    expect(await page.evaluate(() => window.__PEI.S.example)).toBe(true);
    await page.waitForTimeout(400);
    expect(await stored(page)).toMatchObject({ example: true, demarrageFini: true });
    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    await expect(encart(page)).toBeHidden();
  });

  test("absent quand un voyage personnel existe", async ({ page }) => {
    await page.addInitScript(() => {
      if (sessionStorage.getItem("init")) return;
      sessionStorage.setItem("init", "1");
      const jour = () => ({ slots: { m: [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "" });
      const days = Array.from({ length: 7 }, jour);
      days[0].slots.m = ["LA-D1"];
      localStorage.setItem("carnetpei.v1", JSON.stringify({ dest: "reunion", fmt: 7, start: "", example: false, days, stamps: {}, done: {}, words: [], back: "", back2: [], checks: {} }));
    });
    await openApp(page);
    await expect(encart(page)).toBeHidden();
    await expect(encart(page)).toBeEmpty();
  });

  for (const skin of ["epure", "desert"]) {
    for (const mode of ["light", "dark"]) {
      test(`contraste et accessibilité (axe) : ${skin} ${mode === "light" ? "clair" : "sombre"}`, async ({ page }) => {
        await openApp(page);
        await tab(page, "prat");
        await page.locator(`[data-set-skin="${skin}"]`).click();
        await page.locator(`[data-set-mode="${mode}"]`).click();
        await tab(page, "explore");
        await expect(encart(page)).toBeVisible();
        const { violations } = await new AxeBuilder({ page }).include("#demarrage").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        expect(violations.map(v => `${v.id} : ${v.nodes.map(n => n.target.join(" ")).join(", ")}`)).toEqual([]);
      });
    }
  }
});
