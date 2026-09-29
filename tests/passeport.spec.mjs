import { test, expect } from "./fixtures.mjs";
import { readFile } from "node:fs/promises";
import { openApp, tab } from "./helpers.mjs";

// Passeport étendu : bouton « Fait » (tampon daté dans le fuseau de la destination) et section « Mes tampons ».
// Navigateur en UTC : à 21 h UTC, il est déjà le lendemain à La Réunion (UTC+4).
test.use({ timezoneId: "UTC", colorScheme: "light" });

const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1")));
async function openSheet(page, code) {
  await page.locator(`#list .card[data-c="${code}"]`).click();
  await expect(page.locator("#dlg")).toBeVisible();
  await expect(page.locator("#sheet .code").first()).toContainText(code);
}
async function seed(page, done) {
  await page.addInitScript(e => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("carnetpei.v1", e); sessionStorage.setItem("seeded", "1"); } },
    JSON.stringify({ dest: "reunion", fmt: 7, start: "", example: false, days: Array.from({ length: 7 }, () => ({ slots: { m: [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "" })), stamps: {}, done, words: [], back: "", checks: {} }));
}

test.describe("Passeport étendu", () => {
  test("poser puis retirer un tampon depuis une fiche, daté dans le fuseau de la destination", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-13T21:00:00Z")); // 14 octobre, 1 h à La Réunion
    const { errors } = await openApp(page);
    await openSheet(page, "AV-J1");
    const btn = page.locator('#sheet [data-done="AV-J1"]');
    await expect(btn).toHaveText("Fait");
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    expect((await btn.boundingBox()).height).toBeGreaterThanOrEqual(40);

    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(btn).toBeFocused();
    await expect(page.locator("#sheet .done-date")).toHaveText("Tampon du 14 oct. 2026");
    await page.waitForTimeout(400);
    expect((await stored(page)).done).toEqual({ "AV-J1": "2026-10-14" });

    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "false");
    await expect(page.locator("#sheet .done-date")).toHaveCount(0);
    await page.waitForTimeout(400);
    expect((await stored(page)).done).toEqual({});
    expect(errors).toEqual([]);
  });

  test("rappel de sécurité repris mot pour mot de Pratique sur AV-J1, absent sur LA-D16", async ({ page }) => {
    await openApp(page);
    const walk = (await page.locator("#reflexes .check", { hasText: "Avant de marcher" }).textContent()).trim();
    await openSheet(page, "AV-J1");
    const safe = page.locator('#sheet [data-done-box="AV-J1"] .done-safe .check');
    await expect(safe).toHaveCount(1);
    expect((await safe.textContent()).trim()).toBe(walk);
    await page.locator("#pclose").click();

    await openSheet(page, "LA-D16");
    await expect(page.locator('#sheet [data-done="LA-D16"]')).toBeVisible();
    await expect(page.locator("#sheet .done-safe")).toHaveCount(0);
  });

  test("le bouton « Fait » existe aussi dans la vue « Aujourd'hui », avec son rappel", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-14T08:00:00+04:00"));
    await page.addInitScript(e => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("carnetpei.v1", e); sessionStorage.setItem("seeded", "1"); } },
      JSON.stringify({ dest: "reunion", fmt: 7, start: "2026-10-12", example: false, days: Array.from({ length: 7 }, (_, i) => ({ slots: i === 2 ? { m: ["AV-J1"], a: ["LA-D16"], s: [] } : { m: [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "" })), stamps: {}, words: [], back: "", checks: {} }));
    await page.goto("/");
    await expect(page.locator("#today")).toBeVisible();
    const btn = page.locator('#today [data-done="AV-J1"]');
    await expect(page.locator('#today [data-done-box="AV-J1"] .done-safe')).toContainText("Avant de marcher");
    await expect(page.locator('#today [data-done-box="LA-D16"] .done-safe')).toHaveCount(0);
    await btn.click();
    await expect(btn).toHaveAttribute("aria-pressed", "true");
    await expect(btn).toBeFocused();
    await tab(page, "carnet");
    await expect(page.locator('#tampons [data-open="AV-J1"]')).toContainText("14 oct. 2026");
  });

  test("Mes tampons : groupés par zone, dans l'ordre chronologique, sans score ; un tampon ouvre la fiche", async ({ page }) => {
    await seed(page, { "LA-D16": "2026-10-16", "AV-J1": "2026-10-14", "AV-D1": "2026-10-15", "LA-D1": "2026-10-13" });
    await openApp(page);
    await tab(page, "carnet");
    await expect(page.locator("#stamps .stamp")).toHaveCount(6); // passeport des cirques inchangé, au-dessus
    const zones = await page.locator("#tampons .tzone").evaluateAll(s => s.map(z => [z.querySelector("h4").textContent, [...z.querySelectorAll("[data-open]")].map(b => b.dataset.open)]));
    const zoneOf = await page.evaluate(() => Object.fromEntries(["LA-D16", "AV-J1", "AV-D1", "LA-D1"].map(c => [c, __PEI.BY[c].z])));
    // Chaque groupe ne contient que des modules de sa zone, et les dates y sont croissantes
    for (const [z, codes] of zones) for (const c of codes) expect(zoneOf[c]).toBe(z);
    expect(zones.flatMap(([, c]) => c).sort()).toEqual(["AV-D1", "AV-J1", "LA-D1", "LA-D16"]);
    const ouest = zones.find(([z]) => z === "Ouest");
    expect(ouest[1]).toEqual(["LA-D1", "AV-D1", "LA-D16"]); // 13, 15 puis 16 octobre
    await expect(page.locator('#tampons [data-open="AV-J1"]')).toContainText("AV-J1");
    await expect(page.locator('#tampons [data-open="AV-J1"]')).toContainText("Piton de la Fournaise");
    await expect(page.locator('#tampons [data-open="AV-J1"]')).toContainText("14 oct. 2026");
    const texte = await page.locator("#tampons-panel").textContent();
    expect(texte).not.toMatch(/%|score|série|reste|badge|niveau|\d+\s*h\b/i);
    for (const b of await page.locator("#tampons button").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);

    await page.locator('#tampons [data-open="AV-J1"]').click();
    await expect(page.locator("#sheet h2")).toContainText("Fournaise");
    await expect(page.locator('#sheet [data-done="AV-J1"]')).toHaveAttribute("aria-pressed", "true");
  });

  test("sans tampon, une phrase d'invitation", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    await expect(page.locator("#tampons")).toHaveText("Touchez « Fait » sur une fiche quand vous l'avez vécue.");
  });

  test("export et restauration conservent les tampons et écartent un code inconnu", async ({ page }) => {
    await seed(page, { "AV-J1": "2026-10-14" });
    await openApp(page);
    await tab(page, "carnet");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#backup-export").click()]);
    const data = JSON.parse(await readFile(await dl.path(), "utf8"));
    expect(data.etat.done).toEqual({ "AV-J1": "2026-10-14" });

    data.etat.done = { "RA-D1": "2026-10-20", "CODE-INEXISTANT": "2026-10-21", "AV-D1": "pas une date", "LA-D1": "2026-02-31" };
    page.once("dialog", d => d.accept());
    await page.locator("#backup-file").setInputFiles({ name: "s.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify(data)) });
    await expect(page.locator(".toast", { hasText: "Données restaurées" })).toBeVisible();
    await expect(page.locator("#tampons [data-open]")).toHaveCount(1);
    await expect(page.locator('#tampons [data-open="RA-D1"]')).toContainText("20 oct. 2026");
    await page.waitForTimeout(400);
    expect((await stored(page)).done).toEqual({ "RA-D1": "2026-10-20" });
  });

  test("le lien de partage ne contient pas les tampons", async ({ page }) => {
    await seed(page, { "AV-J1": "2026-10-14" });
    await openApp(page);
    await tab(page, "trip");
    await page.locator("#share").click();
    const link = await page.locator("#sharelink").inputValue();
    const code = link.split("#t=")[1];
    const json = Buffer.from(code.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    expect(json).not.toContain("AV-J1");
    expect(json).not.toContain("2026-10-14");
    expect(Object.keys(JSON.parse(json)).sort()).toEqual(["d", "f", "s", "v"]);
  });
});
