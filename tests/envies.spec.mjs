import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";
import AxeBuilder from "@axe-core/playwright";

// « Envies du groupe » : lien de demande (#e=) → écran du proche → lien de réponse (#r=) → avis ajoutés chez l'organisateur.
const b64 = o => Buffer.from(JSON.stringify(o)).toString("base64url");
const VOYAGE = { f: 7, s: "2026-10-10", d: [[["LA-D1"], ["AV-D1"], ["NE-16"]], [["RA-D1"], [], []], ...Array(5).fill([[], [], []])] };

// Organisateur : voyage connu, puis lien de demande produit par le bouton.
async function organisateur(page) {
  await openApp(page);
  await page.evaluate(v => window.__PEI.applyTrip(v), VOYAGE);
  await tab(page, "trip");
  await page.locator("#envies-demander").click();
  const lien = await page.locator("#envies-demande").inputValue();
  await expect(page.locator("#dlg")).toContainText("ni dates, ni notes, ni hébergements");
  await page.locator("#envies-fermer").click();
  return lien;
}
// Proche : ouvre le lien, coche, indique son prénom, renvoie le lien de réponse.
async function proche(page, lien, { prenom = "", envies = [], non = [] }) {
  await page.goto(lien);
  await expect(page.locator("#v-envies")).toBeVisible();
  for (const c of envies) await page.locator(`[data-envie="${c}:e"]`).click();
  for (const c of non) await page.locator(`[data-envie="${c}:p"]`).click();
  if (prenom) await page.locator("#envies-prenom").fill(prenom);
  await page.locator("#envies-envoyer").click();
  return page.locator("#envies-lien").inputValue();
}
const jours = page => page.evaluate(() => JSON.stringify(window.__PEI.S.days));
const avisDe = (page, code) => page.locator(`#days .pill:has([data-open="${code}"]) + .pill-envies`);

test.describe("Envies du groupe", () => {
  test("aller-retour avec deux proches, déduplication, grille inchangée, avis effacés", async ({ page, browser }) => {
    const lien = await organisateur(page);
    expect(lien).toMatch(/#e=[A-Za-z0-9_-]+$/);
    const demande = JSON.parse(Buffer.from(lien.split("#e=")[1], "base64url").toString());
    // Rien d'autre que la liste des codes du voyage.
    expect(demande).toEqual({ v: 1, c: ["LA-D1", "AV-D1", "NE-16", "RA-D1"] });
    const avant = await jours(page);

    const ctx = await browser.newContext({ viewport: { width: 400, height: 800 }, serviceWorkers: "block" });
    const p1 = await ctx.newPage();
    const r1 = await proche(p1, lien, { prenom: "Marie", envies: ["LA-D1", "NE-16"], non: ["AV-D1"] });
    await expect(p1.locator("#v-envies .envie")).toHaveCount(4);
    const p2 = await ctx.newPage();
    const r2 = await proche(p2, lien, { envies: ["LA-D1"], non: ["NE-16"] });
    expect(r1).toMatch(/#r=[A-Za-z0-9_-]+$/);
    const o1 = JSON.parse(Buffer.from(r1.split("#r=")[1], "base64url").toString());
    const o2 = JSON.parse(Buffer.from(r2.split("#r=")[1], "base64url").toString());
    expect(o1).toEqual({ v: 1, i: expect.stringMatching(/^[0-9a-f]{24}$/), n: "Marie", e: ["LA-D1", "NE-16"], p: ["AV-D1"] });
    expect(o2.n).toBeUndefined();
    expect(o2.i).not.toBe(o1.i);
    await ctx.close();

    // Réception au démarrage de l'app (nouvel onglet de l'organisateur).
    const org2 = await page.context().newPage();
    await org2.goto(r1);
    await expect(org2.locator("#avis-envies")).toContainText("Avis de Marie ajoutés");
    await expect(org2.locator("#v-trip")).toBeVisible();
    expect(org2.url()).not.toContain("#r=");
    // Onglet fermé aussitôt : la sauvegarde en attente est écrite à la sortie de la page.
    await org2.close({ runBeforeUnload: true });

    // Réception sur l'app déjà ouverte (changement de fragment), puis deuxième import du même lien.
    await page.reload();
    await page.waitForFunction(() => !!window.__PEI);
    await page.goto(r2);
    await expect(page.locator("#avis-envies")).toContainText("Avis d'un proche ajoutés");
    await page.goto(r1);
    await expect(page.locator("#avis-envies")).toContainText("Les avis de Marie étaient déjà ajoutés.");
    // Collé à la main dans la feuille de demande : toujours compté une fois.
    await page.locator("#envies-demander").click();
    await page.locator("#envies-coller").fill(r2);
    await page.locator("#envies-ajouter").click();
    await expect(page.locator("#avis-envies")).toContainText("étaient déjà ajoutés");
    expect(await page.evaluate(() => window.__PEI.S.envies.length)).toBe(2);

    await expect(avisDe(page, "LA-D1")).toHaveText("Avis du groupe : 2 envies");
    await expect(avisDe(page, "NE-16")).toHaveText("Avis du groupe : 1 envie · 1 pas pour moi");
    await expect(avisDe(page, "AV-D1")).toHaveText("Avis du groupe : 1 pas pour moi");
    await expect(avisDe(page, "RA-D1")).toHaveCount(0);
    await expect(page.locator("#envies-recues")).toContainText("2 réponses : Marie, 1 proche");
    expect(await jours(page)).toBe(avant);

    // Conservé après rechargement immédiat, puis effacé sans toucher à la grille.
    await page.reload();
    await tab(page, "trip");
    await expect(avisDe(page, "LA-D1")).toHaveText("Avis du groupe : 2 envies");
    page.once("dialog", d => d.accept());
    await page.locator("#envies-effacer").click();
    await expect(page.locator(".pill-envies")).toHaveCount(0);
    await expect(page.locator("#envies-recues")).toBeHidden();
    expect(await jours(page)).toBe(avant);
  });

  test("écran du proche : bascules exclusives, codes inconnus ignorés, état du proche non écrasé", async ({ page }) => {
    await openApp(page);
    // Le proche a son propre voyage enregistré sur cet appareil.
    await page.evaluate(() => window.__PEI.applyTrip({ f: 7, s: "2026-12-01", d: [[["EP-D4"], [], []], ...Array(6).fill([[], [], []])] }));
    await page.waitForFunction(() => JSON.parse(localStorage.getItem("carnetpei.v1") || "{}").start === "2026-12-01");
    const etat = await page.evaluate(() => localStorage.getItem("carnetpei.v1"));

    await page.goto("/#e=" + b64({ v: 1, c: ["LA-D1", "ZZ-99", "constructor", 42, "LA-D1", "AV-D1"], f: 30 }));
    await expect(page.locator("#v-envies .envie")).toHaveCount(2);
    await expect(page.locator("#v-envies")).toContainText("ne quittent cet appareil que dans le lien que vous envoyez vous-même");
    const envie = page.locator('[data-envie="LA-D1:e"]'), non = page.locator('[data-envie="LA-D1:p"]');
    expect((await envie.boundingBox()).height).toBeGreaterThanOrEqual(40);
    await envie.click();
    await expect(envie).toHaveAttribute("aria-pressed", "true");
    await non.click();
    await expect(envie).toHaveAttribute("aria-pressed", "false");
    await expect(non).toHaveAttribute("aria-pressed", "true");
    await non.click();
    await expect(non).toHaveAttribute("aria-pressed", "false");
    // Rien de coché : pas de lien.
    await page.locator("#envies-envoyer").click();
    await expect(page.locator(".toast")).toContainText("Choisissez au moins");
    await expect(page.locator("#envies-lien")).toHaveCount(0);
    await envie.click();
    await page.locator("#envies-prenom").fill("Paul");
    await page.locator("#envies-envoyer").click();
    await expect(page.locator("#envies-lien")).toHaveValue(/#r=/);
    await page.keyboard.press("Escape");

    await page.waitForTimeout(400); // délai de sauvegarde (250 ms) dépassé
    expect(await page.evaluate(() => localStorage.getItem("carnetpei.v1"))).toBe(etat);
    await page.locator("#envies-quitter").click();
    await expect(page.locator("#v-explore")).toBeVisible();
    expect(page.url()).not.toContain("#e=");
    await tab(page, "trip");
    await expect(page.locator("#start")).toHaveValue("2026-12-01");
    await expect(page.locator(".pill-envies")).toHaveCount(0);
  });

  test("réponse malveillante ou abîmée : codes inconnus, prénom piégé et liens illisibles neutralisés", async ({ page }) => {
    await openApp(page);
    await page.evaluate(v => window.__PEI.applyTrip(v), VOYAGE);
    const avant = await jours(page);
    const piege = '<img src=x onerror="window.__pirate=1">Zoé et encore beaucoup de texte';
    await page.goto("/#r=" + b64({ v: 1, i: "abcdef1234", n: piege, e: ["LA-D1", "XX-99", "__proto__", "constructor", { a: 1 }], p: ["LA-D1", "AV-D1"], x: "en trop" }));
    await expect(page.locator("#avis-envies")).toContainText("<img src=x");
    await expect(page.locator("#avis img, #envies-recues img, #days img")).toHaveCount(0);
    await expect(page.locator("#envies-recues")).toContainText("<img src=x");
    expect(await page.evaluate(() => window.__pirate)).toBeUndefined();
    const r = await page.evaluate(() => window.__PEI.S.envies[0]);
    expect(r).toEqual({ i: "abcdef1234", n: [...piege].slice(0, 30).join(""), e: ["LA-D1"], p: ["AV-D1"] });
    expect(await jours(page)).toBe(avant);

    // Illisibles : identifiant invalide, version inconnue, aucun code connu, code non base64, lien trop long.
    for (const h of [
      "#r=" + b64({ v: 1, i: "x", e: ["LA-D1"], p: [] }),
      "#r=" + b64({ v: 2, i: "abcdef12345", e: ["LA-D1"], p: [] }),
      "#r=" + b64({ v: 1, i: "abcdef12345", e: ["ZZ-1"], p: [] }),
      "#r=<script>",
      "#r=" + "A".repeat(9000),
    ]) {
      await page.goto("/" + h);
      await expect(page.locator(".toast").last()).toContainText("Lien de réponse illisible");
    }
    expect(await page.evaluate(() => window.__PEI.S.envies.length)).toBe(1);
    // Demande sans aucun code connu : pas d'écran du proche.
    await page.goto("/#e=" + b64({ v: 1, c: ["ZZ-1"] }));
    await expect(page.locator(".toast").last()).toContainText("Lien de demande illisible");
    await expect(page.locator("#v-envies")).toBeHidden();
  });

  test("état enregistré ou restauré : avis nettoyés et bornés", async ({ page }) => {
    await openApp(page);
    const out = await page.evaluate(async () => {
      const { cleanEnvies, LIMITES } = await import("/js/envies.js");
      const { parseBackup } = await import("/js/backup.js");
      const ok = { i: "abcdef1234", n: "Léa", e: ["LA-D1"], p: [] };
      const beaucoup = Array.from({ length: 80 }, (_, k) => ({ i: "id" + String(k).padStart(8, "0"), e: ["LA-D1"], p: [] }));
      return {
        propre: cleanEnvies([ok, ok, null, "x", { i: "court", e: ["LA-D1"] }, { i: "abcdef9999", e: ["ZZ"] }]),
        borne: cleanEnvies(beaucoup).length, max: LIMITES.reponses,
        restaure: parseBackup(JSON.stringify({ format: "carnet-pei", etat: { days: [{ slots: { m: ["LA-D1"] } }], envies: [ok, { i: 3 }] } })).envies,
      };
    });
    expect(out.propre).toEqual([{ i: "abcdef1234", n: "Léa", e: ["LA-D1"], p: [] }]);
    expect(out.borne).toBe(out.max);
    expect(out.restaure).toEqual([{ i: "abcdef1234", n: "Léa", e: ["LA-D1"], p: [] }]);
  });

  test("non-régression : un lien de partage v:1 existant est toujours accepté tel quel", async ({ page }) => {
    // Lien produit par la version précédente (format v:1 inchangé).
    const v1 = { v: 1, f: 7, s: "2026-11-02", d: [[["LA-D1"], ["AV-D1"], []], [["RA-D1"], [], ["NE-16"]], [[], [], []], [[], [], []], [[], [], []], [[], [], []], [[], [], []]] };
    await page.goto("/");
    await page.waitForFunction(() => !!window.__PEI);
    await page.evaluate(() => { window.__PEI.S.envies = [{ i: "abcdef1234", n: "", e: ["LA-D1"], p: [] }]; window.__PEI.save(); });
    await page.waitForTimeout(400);
    page.once("dialog", d => d.accept());
    await page.goto("/?v1#t=" + b64(v1));
    await expect(page.locator("#v-trip")).toBeVisible();
    await expect(page.locator("#k-mod")).toHaveText("4");
    await expect(page.locator("#start")).toHaveValue("2026-11-02");
    expect(page.url()).not.toContain("#t=");
    // Le partage n'emporte pas les avis du groupe, et son format reste v:1.
    const partage = await page.evaluate(() => JSON.parse(atob(window.__PEI.encodeTrip().replace(/-/g, "+").replace(/_/g, "/"))));
    expect(partage).toEqual(v1);
    await expect(avisDe(page, "LA-D1")).toHaveText("Avis du groupe : 1 envie");
  });

  // Contrastes AA et rôles : écran du proche, feuille de demande et grille avec avis, dans les quatre thèmes.
  for (const skin of ["epure", "desert"]) for (const mode of ["light", "dark"]) {
    test(`audit axe : ${skin} ${mode === "light" ? "clair" : "sombre"}`, async ({ page }) => {
      const theme = () => page.evaluate(([s, m]) => { document.documentElement.dataset.skin = s; document.documentElement.dataset.theme = m; }, [skin, mode]);
      const audit = async ecran => {
        const { violations } = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
        return violations.filter(v => ["serious", "critical"].includes(v.impact)).map(v => `[${ecran}] ${v.id} : ${v.help} ${v.nodes.slice(0, 3).map(n => n.target.join(" ")).join(" | ")}`);
      };
      const echecs = [];
      await openApp(page);
      await page.evaluate(v => window.__PEI.applyTrip(v), VOYAGE);
      await page.goto("/#r=" + b64({ v: 1, i: "abcdef1234", n: "Marie", e: ["LA-D1"], p: ["AV-D1"] }));
      await theme();
      await expect(page.locator(".pill-envies").first()).toBeVisible();
      echecs.push(...await audit("Voyage avec avis"));
      await page.locator("#envies-demander").click();
      await expect(page.locator("#envies-demande")).toBeVisible();
      echecs.push(...await audit("Demande"));
      await page.keyboard.press("Escape");
      await page.goto("/?p#e=" + b64({ v: 1, c: ["LA-D1", "AV-D1", "NE-16", "RA-D1", "EP-D4", "FA-03", "SL-01", "PB-01"] }));
      await theme();
      await expect(page.locator("#v-envies")).toBeVisible();
      await page.locator('[data-envie="LA-D1:e"]').click();
      await page.locator('[data-envie="AV-D1:p"]').click();
      echecs.push(...await audit("Écran du proche"));
      await page.locator("#envies-envoyer").click();
      await expect(page.locator("#envies-lien")).toBeVisible();
      echecs.push(...await audit("Lien de réponse"));
      expect(echecs, echecs.join("\n")).toEqual([]);
    });
  }
});
