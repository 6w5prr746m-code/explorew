import { test, expect } from "@playwright/test";
import { openApp, tab } from "./helpers.mjs";

// La destination (data/destinations/reunion.json) ne change rien de visible pour le voyageur.
test.describe("Destination", () => {
  test("les textes visibles restent identiques : Book, partage, carte, zones", async ({ page }) => {
    // navigator.share n'existe pas dans Chromium headless : on l'imite pour lire le titre envoyé.
    await page.addInitScript(() => { navigator.share = o => { window.__shared = o; return Promise.resolve(); }; });
    const { errors } = await openApp(page);

    const zones = ["Toutes zones", "Ouest", "Hauts", "Sud", "Sud sauvage", "Volcan", "Est", "Nord", "Cilaos", "Salazie", "Mafate", "Cirques", "Toute l'île"];
    await expect(page.locator("#zone option")).toHaveText(zones);

    await page.locator("#segMap").click();
    const svg = page.locator("#map svg");
    await expect(svg).toHaveAttribute("aria-label", "Carte de La Réunion avec 200 modules");
    await expect(page.locator("#map circle.pin")).toHaveCount(200);
    await expect(page.locator("#map text.ml")).toHaveText(["Mafate", "Salazie", "Cilaos", "Volcan"]);
    await expect(page.locator("#map text.city")).toHaveText(["Saint-Denis", "Saint-Pierre", "St-Gilles", "St-Benoît"]);

    await tab(page, "trip");
    await page.locator("#share").click();
    await page.locator("#nshare").click();
    expect(await page.evaluate(() => window.__shared.title)).toBe("Mon voyage à La Réunion");
    await page.locator("#sclose").click();

    await page.evaluate(() => window.__printBook());
    await expect(page.locator("#printout .bcover h1")).toHaveText("1001 façons de découvrir La Réunion");
    await expect(page.locator("#printout .bcover .bsrc")).toContainText("Source principale : reunion.fr (Île de la Réunion Tourisme).");
    await expect(page.locator("#printout")).toContainText("Urgences : 112, 15, 18.");
    expect(errors).toEqual([]);
  });

  test("un ancien état sans destination est conservé et rattaché à La Réunion", async ({ page }) => {
    const old = { fmt: 10, start: "2026-10-03", example: false, days: Array.from({ length: 10 }, (_, i) => ({ slots: { m: i === 0 ? ["AV-D1"] : [], a: [], s: [] }, heb: i === 0 ? "Gîte" : "", bud: "", coeur: "", notes: i === 0 ? "Arrivée" : "" })), stamps: {}, words: ["mot"], back: "", checks: { 0: true } };
    await page.addInitScript(o => { if (!sessionStorage.getItem("seeded")) { sessionStorage.setItem("seeded", "1"); localStorage.setItem("carnetpei.v1", JSON.stringify(o)); } }, old);
    const stored = () => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1")));
    const { errors } = await openApp(page);

    expect(await page.evaluate(() => window.__PEI.S.dest)).toBe("reunion");
    // Migration silencieuse : rien n'est réécrit tant que le voyageur ne modifie rien.
    await page.waitForTimeout(400);
    expect(await stored()).toEqual(old);

    await tab(page, "trip");
    await expect(page.locator("#days .day")).toHaveCount(10);
    await expect(page.locator("#fmt")).toHaveValue("10");
    await page.evaluate(() => { window.__PEI.S.checks[1] = true; window.__PEI.save(); });
    await expect.poll(async () => (await stored()).dest).toBe("reunion");
    const after = await stored();
    expect(after.days).toEqual(old.days);
    expect(after.start).toBe(old.start);
    expect(after.words).toEqual(old.words);

    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    expect(await page.evaluate(() => window.__PEI.S.days.length)).toBe(10);
    expect(errors).toEqual([]);
  });

  test("sans fichier de destination, le message d'erreur habituel s'affiche", async ({ page }) => {
    await page.route("**/data/destinations/reunion.json", r => r.fulfill({ status: 404, body: "" }));
    await page.goto("/");
    await expect(page.getByText("Impossible de charger les modules. Vérifiez la connexion puis rechargez la page.")).toBeVisible();
    await expect(page.locator("#list .card")).toHaveCount(0);
  });
});
