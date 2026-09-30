import { test, expect } from "./fixtures.mjs";
import { readFile, mkdir } from "node:fs/promises";
import { openApp, tab } from "./helpers.mjs";

// Carnet souvenir imprimable et « Je reviens pour… » en liste de modules (S.back2).
test.use({ timezoneId: "Indian/Reunion", colorScheme: "light" });

const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1")));
const day = (o = {}) => ({ slots: { m: [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "", ...o });
const base = (o = {}) => ({ dest: "reunion", fmt: 7, start: "", example: false, days: Array.from({ length: 7 }, () => day()), stamps: {}, done: {}, words: [], back: "", checks: {}, ...o });
async function seed(page, etat) {
  await page.addInitScript(e => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("carnetpei.v1", e); sessionStorage.setItem("seeded", "1"); } }, JSON.stringify(etat));
}
async function openSheet(page, code) {
  await page.locator(`#list .card[data-c="${code}"]`).click();
  await expect(page.locator("#dlg")).toBeVisible();
  await expect(page.locator("#sheet .code").first()).toContainText(code);
}

test.describe("Carnet souvenir", () => {
  test("récit imprimable : couverture, jours non vides, tampons, mots, coups de cœur, « Je reviens pour… »", async ({ page }) => {
    const days = Array.from({ length: 7 }, () => day());
    days[0] = day({ slots: { m: ["RA-D1"], a: ["LA-D1"], s: [] }, heb: "Gîte du test", coeur: "Le lever de soleil", notes: "Ligne 1\nLigne 2" });
    days[3] = day({ coeur: "Rougail partagé" }); // jour sans module mais avec un coup de cœur : gardé
    await seed(page, base({ start: "2027-03-01", days, done: { "RA-D1": "2027-03-01", "AV-J1": "2027-03-05" }, words: ["Kaz = maison", "Ti lampé = doucement"], back: "Le Piton des Neiges", back2: ["EP-D4"] }));
    await page.addInitScript(() => { window.__printed = 0; window.print = () => { window.__printed++; }; });
    const { errors } = await openApp(page);
    await tab(page, "carnet");
    const btn = page.locator("#printsouvenir");
    await expect(btn).toHaveText("Imprimer mon carnet souvenir");
    expect((await btn.boundingBox()).height).toBeGreaterThanOrEqual(40);
    await btn.click();
    expect(await page.evaluate(() => window.__printed)).toBe(1);
    await expect(page.locator("body")).toHaveClass(/souvenir/);

    const out = page.locator("#printout");
    await expect(out.locator(".sv-cover h1")).toHaveText("Mon voyage à La Réunion");
    await expect(out.locator(".sv-cover")).toContainText("Du 1 mars 2027 au 7 mars 2027");
    await expect(out.locator(".sv-cover")).toContainText("7 jours");
    // Jours 1, 4 et 5 (tampon du 5 mars) ; les jours vides sont omis.
    await expect(out.locator(".sv-day")).toHaveCount(3);
    expect(await out.locator(".sv-day").evaluateAll(n => n.map(x => x.dataset.day))).toEqual(["1", "4", "5"]);
    const j1 = out.locator('.sv-day[data-day="1"]');
    await expect(j1.locator("h2")).toHaveText("lundi 1 mars");
    await expect(j1).toContainText("RA-D1");
    await expect(j1).toContainText("LA-D1");
    await expect(j1).toContainText("Le lever de soleil");
    await expect(j1).toContainText("Gîte du test");
    await expect(j1.locator(".sv-seal")).toHaveText(["RA-D1"]);
    await expect(out.locator('.sv-day[data-day="4"]')).toContainText("Rougail partagé");
    await expect(out.locator('.sv-day[data-day="5"] .sv-seal')).toHaveText(["AV-J1"]);
    await expect(out.locator(".sv-tampons .sv-seal")).toHaveCount(2);
    await expect(out.locator(".sv-tampons")).toContainText("Tampon du 1 mars 2027");
    await expect(out.locator(".sv-mots li")).toHaveText(["Kaz = maison", "Ti lampé = doucement"]);
    await expect(out.locator(".sv-back")).toContainText("EP-D4");
    await expect(out.locator(".sv-back")).toContainText("Le Piton des Neiges");
    expect(errors).toEqual([]);
  });

  test("sans date d'arrivée ni contenu : couverture seule, via la fonction de génération", async ({ page }) => {
    await seed(page, base({ fmt: 10, days: Array.from({ length: 10 }, () => day()) }));
    await openApp(page);
    await page.evaluate(() => window.__buildSouvenir());
    const out = page.locator("#printout");
    await expect(out.locator(".sv-cover h1")).toHaveText("Mon voyage à La Réunion");
    await expect(out.locator(".sv-dates")).toHaveCount(0);
    await expect(out.locator(".sv-cover")).toContainText("10 jours");
    await expect(out.locator(".sv-page")).toHaveCount(0);
  });
});

test.describe("Je reviens pour…", () => {
  test("bascule sur la fiche, liste dans le Carnet, ouverture et retrait", async ({ page }) => {
    await seed(page, base({ back: "Texte libre conservé" }));
    await openApp(page);
    await openSheet(page, "AV-J1");
    const t = page.locator('#sheet [data-back2="AV-J1"]');
    await expect(t).toHaveText("Je reviens pour ça");
    await expect(t).toHaveAttribute("aria-pressed", "false");
    expect((await t.boundingBox()).height).toBeGreaterThanOrEqual(40);
    await t.click();
    await expect(t).toHaveAttribute("aria-pressed", "true");
    await expect(t).toBeFocused();
    await page.keyboard.press("Escape");
    await openSheet(page, "LA-D1");
    await page.locator('#sheet [data-back2="LA-D1"]').click();
    await page.keyboard.press("Escape");
    await page.waitForTimeout(400);
    expect((await stored(page)).back2).toEqual(["AV-J1", "LA-D1"]);

    await tab(page, "carnet");
    const items = page.locator("#back2 .b2");
    await expect(items).toHaveCount(2);
    await expect(items.first()).toContainText("AV-J1");
    await expect(page.locator("#back")).toHaveValue("Texte libre conservé");
    await expect(page.locator("#nexttrip")).toBeVisible();
    for (const b of await page.locator("#back2 button").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);

    await items.first().locator("[data-open]").click();
    await expect(page.locator("#sheet .code").first()).toContainText("AV-J1");
    await expect(page.locator('#sheet [data-back2="AV-J1"]')).toHaveAttribute("aria-pressed", "true");
    await page.keyboard.press("Escape");

    await page.locator('#back2 [data-back2-rm="AV-J1"]').click();
    await expect(items).toHaveCount(1);
    await expect(items.first()).toContainText("LA-D1");
    await page.locator('#back2 [data-back2-rm="LA-D1"]').click();
    await expect(page.locator("#back2")).toContainText("Je reviens pour ça");
    await expect(page.locator("#nexttrip")).toBeHidden();
    await page.waitForTimeout(400);
    const s = await stored(page);
    expect(s.back2).toEqual([]);
    expect(s.back).toBe("Texte libre conservé");
  });

  test("préparer le prochain voyage : refusé ne change rien, accepté remplace le voyage", async ({ page }) => {
    const codes = ["RA-D1", "LA-D1", "EP-D4", "AV-J1", "AV-D1", "AV-D2", "LA-D15", "EP-D18", "FA-03", "NE-16", "RA-D15", "LA-J1", "EP-D1", "AV-D3", "AV-D4"];
    const days = Array.from({ length: 7 }, () => day());
    days[0] = day({ slots: { m: ["FA-03"], a: [], s: [] }, coeur: "Ancien cœur" });
    await seed(page, base({ start: "2026-08-01", days, done: { "RA-D1": "2026-08-01" }, stamps: { cilaos: true }, words: ["Kaz = maison"], back: "Notes gardées", back2: codes, skin: "desert", mode: "dark" }));
    await openApp(page);
    await tab(page, "carnet");

    let msg = "";
    page.once("dialog", d => { msg = d.message(); d.dismiss(); });
    await page.locator("#nexttrip").click();
    expect(msg).toContain("Votre voyage actuel sera remplacé. Pensez à exporter vos données avant.");
    await expect(page.locator("#v-carnet")).toBeVisible();
    await page.waitForTimeout(400);
    let s = await stored(page);
    expect(s.back2).toEqual(codes);
    expect(s.days[0].slots.m).toEqual(["FA-03"]);

    page.once("dialog", d => d.accept());
    await page.locator("#nexttrip").click();
    await expect(page.locator("#v-trip")).toBeVisible();
    await expect(page.locator("#fmt")).toHaveValue("10"); // 15 modules : 8 jours nécessaires, format 10 jours
    await expect(page.locator("#start")).toHaveValue("");
    await expect(page.locator("#k-mod")).toHaveText("15");
    await page.waitForTimeout(400);
    s = await stored(page);
    expect(s.fmt).toBe(10);
    expect(s.days).toHaveLength(10);
    expect(s.start).toBe("");
    expect(s.days[0].slots).toEqual({ m: ["RA-D1"], a: ["LA-D1"], s: [] });
    expect(s.days[1].slots).toEqual({ m: ["EP-D4"], a: ["AV-J1"], s: [] });
    expect(s.days[7].slots).toEqual({ m: ["AV-D4"], a: [], s: [] });
    expect(s.days[8].slots).toEqual({ m: [], a: [], s: [] });
    expect(s.back2).toEqual([]);
    expect(s.done).toEqual({ "RA-D1": "2026-08-01" });
    expect(s.stamps).toEqual({ cilaos: true });
    expect(s.words).toEqual(["Kaz = maison"]);
    expect(s.back).toBe("Notes gardées");
    expect([s.skin, s.mode]).toEqual(["desert", "dark"]);
    expect(s.example).toBe(false);
    await expect(page.locator("html")).toHaveAttribute("data-skin", "desert");
  });

  test("export et restauration de S.back2 (codes existants seulement)", async ({ page }) => {
    await seed(page, base({ back2: ["AV-J1", "LA-D1"] }));
    await openApp(page);
    await tab(page, "carnet");
    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#backup-export").click()]);
    const data = JSON.parse(await readFile(await dl.path(), "utf8"));
    expect(data.etat.back2).toEqual(["AV-J1", "LA-D1"]);

    const etat = { ...base(), back2: ["EP-D4", "CODE-INEXISTANT", 42, "EP-D4", "RA-D1"] };
    page.once("dialog", d => d.accept());
    await page.locator("#backup-file").setInputFiles({ name: "s.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ format: "carnet-pei", version: 1, etat })) });
    await expect(page.locator(".toast").last()).toContainText("Données restaurées");
    await expect(page.locator("#back2 .b2")).toHaveCount(2);
    await page.waitForTimeout(400);
    expect((await stored(page)).back2).toEqual(["EP-D4", "RA-D1"]);
  });

  test("un ancien état sans S.back2 est conservé", async ({ page }) => {
    const days = Array.from({ length: 7 }, () => day());
    days[2] = day({ slots: { m: ["RA-D1"], a: [], s: [] }, heb: "Gîte ancien" });
    const old = base({ days, back: "Mafate à pied", words: ["Kaz = maison"] });
    await seed(page, old);
    const { errors } = await openApp(page);
    await tab(page, "carnet");
    await expect(page.locator("#back")).toHaveValue("Mafate à pied");
    await expect(page.locator("#back2")).toContainText("Je reviens pour ça");
    await expect(page.locator("#nexttrip")).toBeHidden();
    await tab(page, "trip");
    await expect(page.locator("#k-mod")).toHaveText("1");
    await expect(page.locator("#heb2")).toHaveValue("Gîte ancien");
    await tab(page, "explore");
    await openSheet(page, "LA-D1");
    await page.locator('#sheet [data-back2="LA-D1"]').click();
    await page.waitForTimeout(400);
    const s = await stored(page);
    expect(s.back2).toEqual(["LA-D1"]);
    expect(s.back).toBe("Mafate à pied");
    expect(s.days[2].heb).toBe("Gîte ancien");
    expect(errors).toEqual([]);
  });
});

// Captures de contrôle (400 px) : panneau « Je reviens pour… » dans les quatre thèmes et rendu d'impression.
const SHOTS = process.env.SOUVENIR_SHOTS;
test.describe("captures", () => {
  test.skip(!SHOTS, "captures seulement avec SOUVENIR_SHOTS=<dossier>");
  for (const [skin, mode] of [["epure", "light"], ["epure", "dark"], ["desert", "light"], ["desert", "dark"]]) {
    test(`panneau ${skin} ${mode}`, async ({ page }) => {
      await seed(page, base({ skin, mode, back: "Revenir en saison des baleines", back2: ["AV-J1", "LA-D1", "EP-D4"] }));
      await openApp(page);
      await tab(page, "carnet");
      await mkdir(SHOTS, { recursive: true });
      await page.locator("#back-panel").screenshot({ path: `${SHOTS}/panneau-${skin}-${mode}.png` });
      await tab(page, "explore");
      await openSheet(page, "AV-J1");
      await page.locator('#sheet [data-back2="AV-J1"]').scrollIntoViewIfNeeded();
      await page.screenshot({ path: `${SHOTS}/fiche-${skin}-${mode}.png` });
    });
  }
  test("impression", async ({ page }) => {
    const days = Array.from({ length: 7 }, () => day());
    days[0] = day({ slots: { m: ["RA-D1"], a: ["LA-D1"], s: ["NE-16"] }, heb: "Gîte à Cilaos", coeur: "Le lever de soleil", notes: "Rencontre au marché\nPremier cari" });
    await seed(page, base({ skin: "desert", mode: "dark", start: "2027-03-01", days, done: { "RA-D1": "2027-03-01", "LA-D1": "2027-03-01" }, words: ["Kaz = maison"], back: "Le Piton des Neiges", back2: ["EP-D4"] }));
    await openApp(page);
    await page.evaluate(() => window.__buildSouvenir());
    await page.emulateMedia({ media: "print" });
    await mkdir(SHOTS, { recursive: true });
    await page.screenshot({ path: `${SHOTS}/impression.png`, fullPage: true });
    await page.pdf({ path: `${SHOTS}/carnet-souvenir.pdf`, format: "A5", printBackground: true });
  });
});
