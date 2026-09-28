import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";
import { openApp, tab } from "./helpers.mjs";

test.describe("Mes données", () => {
  test("exporter produit un fichier JSON complet", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    await page.locator('#stamps [data-s="cilaos"]').click();
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#backup-export").click()]);
    expect(dl.suggestedFilename()).toMatch(/^carnet-pei-\d{4}-\d{2}-\d{2}\.json$/);
    const data = JSON.parse(await readFile(await dl.path(), "utf8"));
    expect(data.format).toBe("carnet-pei");
    expect(data.version).toBe(1);
    expect(data.etat.days).toHaveLength(7);
    expect(data.etat.stamps.cilaos).toBe(true);
  });

  test("restaurer remplace le voyage et le carnet, et survit au rechargement", async ({ page }) => {
    await openApp(page);
    const etat = { fmt: 10, start: "2027-03-01", days: Array.from({ length: 10 }, (_, i) => ({ slots: { m: i === 0 ? ["RA-D1", "CODE-INEXISTANT"] : [], a: [], s: [] }, heb: i === 0 ? "Gîte restauré" : "", bud: "", coeur: "", notes: "" })), stamps: { mafate: true }, words: ["Kaz = maison"], back: "Le Piton des Neiges", checks: { 3: true } };
    await tab(page, "carnet");
    page.once("dialog", d => d.accept());
    await page.locator("#backup-file").setInputFiles({ name: "sauvegarde.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "carnet-pei", version: 1, etat })) });
    await expect(page.locator(".toast")).toContainText("Données restaurées");
    await expect(page.locator('#stamps [data-s="mafate"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#words")).toContainText("Kaz = maison");
    await expect(page.locator("#back")).toHaveValue("Le Piton des Neiges");
    await page.waitForTimeout(400);
    await page.reload();
    await tab(page, "trip");
    await expect(page.locator("#fmt")).toHaveValue("10");
    await expect(page.locator("#k-mod")).toHaveText("1"); // le code inexistant est écarté
    await expect(page.locator("#heb0")).toHaveValue("Gîte restauré");
    await expect(page.locator("#exnote")).toBeEmpty();
    await tab(page, "prat");
    await expect(page.locator("#ck3")).toBeChecked();
  });

  test("un fichier illisible est refusé sans rien modifier", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    await page.locator("#backup-file").setInputFiles({ name: "x.json", mimeType: "application/json", buffer: Buffer.from("{pas du json") });
    await expect(page.locator(".toast")).toContainText("Fichier illisible");
    await tab(page, "trip");
    await expect(page.locator("#days details")).toHaveCount(7);
  });

  test("annuler la confirmation conserve les données actuelles", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    page.once("dialog", d => d.dismiss());
    await page.locator("#backup-file").setInputFiles({ name: "s.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ days: [{ slots: { m: [], a: [], s: [] } }] })) });
    await tab(page, "trip");
    await expect(page.locator("#days details")).toHaveCount(7);
  });
});
