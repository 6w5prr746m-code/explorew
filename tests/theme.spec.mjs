import { test, expect } from "@playwright/test";
import { openApp, tab } from "./helpers.mjs";

// Thèmes Épure (défaut) et Désert, en clair et en sombre (docs/design/THEMES.md).
test.use({ colorScheme: "light" });

const token = (page, name) => page.evaluate(n => getComputedStyle(document.documentElement).getPropertyValue(n).trim(), name);
const attrs = page => page.evaluate(() => ({ skin: document.documentElement.dataset.skin ?? null, theme: document.documentElement.dataset.theme ?? null }));
const themeColor = page => page.locator('meta[name="theme-color"]').getAttribute("content");
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1") || "{}"));

test.describe("Thèmes", () => {
  test("Épure est le thème par défaut, en mode automatique", async ({ page }) => {
    const { errors } = await openApp(page);
    expect(await attrs(page)).toEqual({ skin: "epure", theme: null });
    expect(await token(page, "--ground")).toBe("#F5F5F7");
    expect(await themeColor(page)).toBe("#F5F5F7");
    await tab(page, "prat");
    await expect(page.locator('[data-set-skin="epure"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-set-skin="desert"]')).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator('[data-set-mode="auto"]')).toHaveAttribute("aria-pressed", "true");
    for (const b of await page.locator("#appearance .opt").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);
    expect(errors).toEqual([]);
  });

  test("bascule vers Désert puis Sombre, conservée après rechargement", async ({ page }) => {
    await openApp(page);
    await tab(page, "prat");
    await page.locator('[data-set-skin="desert"]').click();
    expect(await attrs(page)).toEqual({ skin: "desert", theme: null });
    expect(await token(page, "--ground")).toBe("#EEE2CD");
    await expect(page.locator('[data-set-skin="desert"]')).toHaveAttribute("aria-pressed", "true");
    await page.locator('[data-set-mode="dark"]').click();
    expect(await attrs(page)).toEqual({ skin: "desert", theme: "dark" });
    expect(await token(page, "--ground")).toBe("#17110C");
    expect(await themeColor(page)).toBe("#17110C");
    await page.waitForTimeout(400);
    expect(await stored(page)).toMatchObject({ skin: "desert", mode: "dark" });

    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    expect(await attrs(page)).toEqual({ skin: "desert", theme: "dark" });
    await tab(page, "prat");
    await expect(page.locator('[data-set-mode="dark"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator('[data-set-skin="desert"]')).toHaveAttribute("aria-pressed", "true");

    // Retour à Épure clair, puis automatique
    await page.locator('[data-set-skin="epure"]').click();
    expect(await token(page, "--ground")).toBe("#161618");
    await page.locator('[data-set-mode="light"]').click();
    expect(await attrs(page)).toEqual({ skin: "epure", theme: "light" });
    expect(await token(page, "--ground")).toBe("#F5F5F7");
    await page.locator('[data-set-mode="auto"]').click();
    expect(await attrs(page)).toEqual({ skin: "epure", theme: null });
  });

  test("en automatique, suit le réglage sombre du téléphone ; Clair l'emporte", async ({ page }) => {
    await page.emulateMedia({ colorScheme: "dark" });
    await openApp(page);
    expect(await token(page, "--ground")).toBe("#161618");
    expect(await themeColor(page)).toBe("#161618");
    await tab(page, "prat");
    await page.locator('[data-set-skin="desert"]').click();
    expect(await token(page, "--ground")).toBe("#17110C");
    await page.locator('[data-set-mode="light"]').click();
    expect(await token(page, "--ground")).toBe("#EEE2CD");
  });

  test("data-skin et data-theme sont posés avant le rendu de la liste", async ({ page }) => {
    await openApp(page);
    await tab(page, "prat");
    await page.locator('[data-set-skin="desert"]').click();
    await page.locator('[data-set-mode="dark"]').click();
    await page.waitForTimeout(400);
    await page.addInitScript(() => {
      new MutationObserver((_, obs) => {
        const list = document.getElementById("list");
        if (list && list.firstElementChild) {
          const r = document.documentElement;
          window.__atFirstRender = { skin: r.dataset.skin ?? null, theme: r.dataset.theme ?? null, ground: getComputedStyle(r).getPropertyValue("--ground").trim() };
          obs.disconnect();
        }
      }).observe(document, { childList: true, subtree: true });
    });
    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    expect(await page.evaluate(() => window.__atFirstRender)).toEqual({ skin: "desert", theme: "dark", ground: "#17110C" });
  });

  test("le Carnet propose une seule fois le carnet de terrain", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    const offer = page.locator("#skin-offer");
    await expect(offer).toHaveCount(0);
    await page.locator('#stamps [data-s="cilaos"]').click();
    await expect(offer).toBeVisible();
    await expect(offer).toContainText("Passer en carnet de terrain ?");
    for (const b of await offer.locator("button").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);
    await offer.getByRole("button", { name: "Non merci" }).click();
    await expect(offer).toHaveCount(0);
    expect(await attrs(page)).toEqual({ skin: "epure", theme: null });

    await page.locator('#stamps [data-s="salazie"]').click();
    await expect(page.locator('#stamps [data-s="salazie"]')).toHaveAttribute("aria-pressed", "true");
    await expect(offer).toHaveCount(0);
    await page.waitForTimeout(400);
    expect(await stored(page)).toMatchObject({ deserOffered: true });
    await page.reload();
    await tab(page, "carnet");
    await page.locator('#stamps [data-s="mafate"]').click();
    await expect(page.locator('#stamps [data-s="mafate"]')).toHaveAttribute("aria-pressed", "true");
    await expect(offer).toHaveCount(0);
  });

  test("« Oui » dans le Carnet passe en Désert", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    await page.locator('#stamps [data-s="lagon"]').click();
    await page.locator("#skin-offer").getByRole("button", { name: "Oui" }).click();
    await expect(page.locator("#skin-offer")).toHaveCount(0);
    expect(await attrs(page)).toEqual({ skin: "desert", theme: null });
    await tab(page, "prat");
    await expect(page.locator('[data-set-skin="desert"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("restaurer une sauvegarde garde l'apparence choisie", async ({ page }) => {
    await openApp(page);
    await tab(page, "prat");
    await page.locator('[data-set-skin="desert"]').click();
    await tab(page, "carnet");
    const etat = { fmt: 7, start: "", days: Array.from({ length: 7 }, () => ({ slots: { m: [], a: [], s: [] } })), stamps: {}, words: [], back: "", checks: {} };
    page.once("dialog", d => d.accept());
    await page.locator("#backup-file").setInputFiles({ name: "sauvegarde.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "carnet-pei", version: 1, etat })) });
    await expect(page.locator(".toast")).toContainText("Données restaurées");
    await page.waitForTimeout(400);
    expect(await stored(page)).toMatchObject({ skin: "desert" });
  });

  test("l'impression garde les couleurs du Book, quel que soit le thème", async ({ page }) => {
    await openApp(page);
    await tab(page, "prat");
    await page.locator('[data-set-skin="desert"]').click();
    await page.locator('[data-set-mode="dark"]').click();
    await page.emulateMedia({ media: "print" });
    expect(await token(page, "--AV")).toBe("#C8452B");
    expect(await token(page, "--ink")).toBe("#16231F");
    expect(await page.evaluate(() => getComputedStyle(document.body).backgroundImage)).toBe("none");
  });
});
