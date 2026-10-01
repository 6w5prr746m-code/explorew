import { readFileSync } from "node:fs";
import { test, expect } from "./fixtures.mjs";
import { openApp } from "./helpers.mjs";

// « Vérifié le… » sur chaque fiche : date de vérification, source et étiquette « À vérifier ».
const MODULES = JSON.parse(readFileSync(new URL("../public/data/modules.json", import.meta.url), "utf8"));
const mod = code => MODULES.find(m => m.code === code);
const [y, mo, d] = mod("AV-J1").verifieLe.split("-").map(Number);
const DATE_LONGUE = new Date(y, mo - 1, d).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
const DATE_COURTE = new Date(y, mo - 1, d).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });

const ouvrir = (page, code) => page.evaluate(c => window.__PEI.openModule(c), code);

test.describe("Vérifié le", () => {
  test("la fiche AV-J1 affiche la date de vérification et « Source à venir »", async ({ page }) => {
    const { errors } = await openApp(page);
    expect(mod("AV-J1").source).toBeNull();
    await ouvrir(page, "AV-J1");
    const verif = page.locator("#sheet .verif");
    await expect(verif).toContainText(`Vérifié le ${DATE_LONGUE}`);
    await expect(verif).toContainText("Source à venir");
    await expect(verif.locator("a")).toHaveCount(0);
    expect(errors).toEqual([]);
  });

  test("une source URL donne un lien externe vers son domaine", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => { window.__PEI.BY["AV-J1"].src = "https://www.reunion.fr/decouvrir/piton-de-la-fournaise"; });
    await ouvrir(page, "AV-J1");
    const lien = page.locator("#sheet .verif a");
    await expect(lien).toHaveText("reunion.fr");
    await expect(lien).toHaveAttribute("href", "https://www.reunion.fr/decouvrir/piton-de-la-fournaise");
    await expect(lien).toHaveAttribute("target", "_blank");
    await expect(lien).toHaveAttribute("rel", "noopener");
    await expect(page.locator("#sheet .verif")).not.toContainText("Source à venir");
    expect((await lien.boundingBox()).height).toBeGreaterThanOrEqual(40);
  });

  test("une source qui n'est pas une URL web reste « Source à venir »", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => { window.__PEI.BY["AV-J1"].src = "javascript:alert(1)"; });
    await ouvrir(page, "AV-J1");
    await expect(page.locator("#sheet .verif")).toContainText("Source à venir");
    await expect(page.locator("#sheet .verif a")).toHaveCount(0);
  });

  test("étiquette « À vérifier » sur les champs concernés, sans toucher au texte", async ({ page }) => {
    await openApp(page);
    // AV-J7 : durée à vérifier (docs/A-VERIFIER.md)
    await ouvrir(page, "AV-J7");
    const duree = page.locator("#sheet .fact", { hasText: "Durée" });
    await expect(duree.locator(".averif")).toHaveText("À vérifier");
    await expect(duree.locator(".averif")).toHaveAttribute("aria-label", "Durée : information à vérifier avant de partir");
    await expect(duree.locator("b")).toHaveText(mod("AV-J7").duree);
    await expect(page.locator("#sheet .averif")).toHaveCount(1);
    // FA-11 : essentiel à vérifier
    await ouvrir(page, "FA-11");
    await expect(page.locator("#sheet .averif")).toHaveCount(1);
    await expect(page.locator("#sheet .averif")).toHaveAttribute("aria-label", /^Essentiel/);
    // AV-J1 : rien à vérifier
    await ouvrir(page, "AV-J1");
    await expect(page.locator("#sheet .averif")).toHaveCount(0);
  });

  test("la fiche imprimée du Book porte la date de vérification", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => window.__printBook());
    const fiche = page.locator("#printout article.bf", { has: page.locator(".bc", { hasText: /^AV-J1$/ }) });
    await expect(fiche.locator(".bv")).toHaveText(`vérifié le ${DATE_COURTE}`);
    expect(await page.locator("#printout article.bf .bv").count()).toBe(MODULES.filter(m => m.verifieLe).length);
  });
});
