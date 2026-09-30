import { test, expect } from "./fixtures.mjs";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { openApp, tab, emptyTrip } from "./helpers.mjs";

// Carte postale : image de partage PNG (1080 × 1350) sans données personnelles.
test.use({ colorScheme: "light" });

const OUT = process.env.CARTE_POSTALE_DIR || "";
const pngSize = buf => ({ sig: buf.subarray(1, 4).toString("ascii"), w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) });
// Part du voyage d'exemple (état par défaut) et y ajoute des champs, puis recharge l'app.
async function openWith(page, etat) {
  const r = await openApp(page);
  await page.waitForFunction(() => !!window.__PEI);
  await page.evaluate(e => localStorage.setItem("carnetpei.v1", JSON.stringify({ ...window.__PEI.S, ...e })), etat);
  await page.reload();
  await expect(page.locator("#list .card").first()).toBeVisible();
  return r;
}
// Espionne fillText pour savoir exactement ce qui est écrit sur l'image.
async function spyText(page) {
  await page.addInitScript(() => {
    window.__texts = [];
    const f = CanvasRenderingContext2D.prototype.fillText;
    CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { window.__texts.push(String(t)); return f.call(this, t, ...r); };
  });
}
async function openPostcard(page) {
  await tab(page, "carnet");
  await page.locator("#postcard").click();
  await expect(page.locator("#dlg")).toBeVisible();
  await expect(page.locator("#pcimg")).toBeVisible();
}

test.describe("Carte postale", () => {
  test("sans voyage, le bouton explique qu'il faut d'abord composer son voyage", async ({ page }) => {
    const { errors } = await openApp(page);
    await emptyTrip(page);
    await tab(page, "carnet");
    const b = page.locator("#postcard");
    await expect(b).toHaveText("Créer ma carte postale");
    await expect(b).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#postcard-hint")).toBeVisible();
    await expect(page.locator("#postcard-hint")).toContainText("Composez d'abord votre voyage");
    expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);
    await b.click({ force: true }); // aria-disabled : Playwright attend sinon un bouton « activé »
    await expect(page.locator(".toast", { hasText: "Composez d'abord votre voyage" })).toBeVisible();
    await expect(page.locator("#dlg")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("avec le voyage d'exemple : PNG 1080 × 1350, aperçu décrit, téléchargement", async ({ page }) => {
    const { errors, external } = await openWith(page, { done: { "RA-D1": "2026-09-10", "LA-D1": "2026-09-11" } });
    await tab(page, "carnet");
    await expect(page.locator("#postcard")).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#postcard-hint")).toBeHidden();
    await openPostcard(page);
    const img = page.locator("#pcimg");
    await expect(img).toHaveAttribute("alt", /Carte postale Carnet Péï : La Réunion, 7 jours/);
    await expect(img).toHaveAttribute("alt", /les tampons « Fait » : LA-D1, RA-D1/);
    await expect(img).not.toHaveAttribute("alt", /\d+ tampons?/); // garde-fou : aucun compteur
    expect(await img.evaluate(i => [i.naturalWidth, i.naturalHeight])).toEqual([1080, 1350]);
    for (const b of await page.locator("#sheet .pc-row .btn").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);

    const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#pcsave").click()]);
    expect(dl.suggestedFilename()).toBe("carnet-pei-carte-postale.png");
    const buf = await readFile(await dl.path());
    expect(buf.length).toBeGreaterThan(20000);
    expect(pngSize(buf)).toEqual({ sig: "PNG", w: 1080, h: 1350 });
    await page.locator("#pcclose").click();
    await expect(page.locator("#dlg")).toBeHidden();
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  test("aucune donnée personnelle sur l'image", async ({ page }) => {
    await spyText(page);
    await openWith(page, { start: "2027-03-01", words: ["Mot-perso-zq7"], back: "Retour-perso-zq7", done: { "RA-D1": "2027-03-02" } });
    await tab(page, "trip");
    // Saisie par les champs du voyage (même chemin que l'utilisateur, les champs peuvent être repliés).
    await page.evaluate(() => {
      const set = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event("input", { bubbles: true })); };
      set("notes0", "Note-perso-zq7"); set("heb1", "Heb-perso-zq7"); set("coeur2", "Coeur-perso-zq7"); set("bud0", "987");
    });
    expect(await page.evaluate(() => [window.__PEI.S.days[0].notes, window.__PEI.S.days[1].heb, window.__PEI.S.days[2].coeur])).toEqual(["Note-perso-zq7", "Heb-perso-zq7", "Coeur-perso-zq7"]);
    await page.evaluate(() => { window.__texts = []; });
    await openPostcard(page);
    const texts = await page.evaluate(() => window.__texts);
    const all = texts.join("\n");
    expect(all).toContain("Carnet Péï · La Réunion");
    expect(all).toContain("7 jours");
    expect(all).toContain("RA-D1");
    for (const s of ["zq7", "987", "2027", "mars", "#t="]) expect(all).not.toContain(s);
    expect(all).not.toMatch(/FAIT » ·/); // garde-fou : aucun compteur de tampons
    const i = texts.indexOf("Composez le vôtre :");
    expect(i).toBeGreaterThanOrEqual(0);
    const url = texts[i + 1];
    expect(url).toBe(await page.evaluate(() => location.origin + location.pathname));
    expect(url).not.toMatch(/[#?]/);
    // Même avec un fragment ou un paramètre dans la barre d'adresse, l'URL écrite reste nue.
    await page.evaluate(() => history.replaceState(null, "", location.pathname + "?x=1#t=abc"));
    await page.evaluate(async () => { window.__texts = []; await window.__buildPostcard(document.createElement("canvas")); });
    const again = await page.evaluate(() => window.__texts);
    expect(again.join("\n")).not.toMatch(/[#?]|zq7/);
  });

  for (const [skin, mode, nom] of [["epure", "light", "epure"], ["epure", "dark", "graphite"], ["desert", "light", "desert"], ["desert", "dark", "bivouac"]]) {
    test(`rendu sans erreur dans le thème ${nom}`, async ({ page }) => {
      const { errors } = await openWith(page, { skin, mode, done: { "RA-D1": "2026-09-10", "AV-D1": "2026-09-11", "EP-D4": "2026-09-12", "NE-16": "2026-09-12" } });
      expect(await page.evaluate(() => document.documentElement.dataset.skin)).toBe(skin);
      await openPostcard(page);
      const data = await page.evaluate(async () => { const c = document.createElement("canvas"); await window.__buildPostcard(c); return c.toDataURL("image/png"); });
      const buf = Buffer.from(data.split(",")[1], "base64");
      expect(pngSize(buf)).toEqual({ sig: "PNG", w: 1080, h: 1350 });
      if (OUT) { await mkdir(OUT, { recursive: true }); await writeFile(`${OUT}/carte-postale-${nom}.png`, buf); await page.screenshot({ path: `${OUT}/feuille-${nom}.png` }); }
      expect(errors).toEqual([]);
    });
  }
});
