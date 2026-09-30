import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";
import AxeBuilder from "@axe-core/playwright";

// Audit d'accessibilité automatique (axe-core, WCAG 2.0 et 2.1, niveaux A et AA) sur les écrans
// principaux, dans les quatre combinaisons de thème. Échec sur toute violation « serious » ou « critical ».
const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];
const GRAVES = ["serious", "critical"];

async function audit(page, ecran) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze();
  return violations.filter(v => GRAVES.includes(v.impact)).map(v =>
    `[${ecran}] ${v.id} (${v.impact}, ${v.nodes.length} élément${v.nodes.length > 1 ? "s" : ""}) : ${v.help}\n` +
    v.nodes.slice(0, 5).map(n => `    ${n.target.join(" ")}${n.failureSummary ? "\n      " + n.failureSummary.replace(/\n/g, "\n      ") : ""}`).join("\n"));
}

const fermer = async page => {
  await page.keyboard.press("Escape");
  await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");
};

for (const skin of ["epure", "desert"]) {
  for (const mode of ["light", "dark"]) {
    test(`audit axe : ${skin} ${mode === "light" ? "clair" : "sombre"}`, async ({ page }) => {
      test.setTimeout(180_000);
      await openApp(page);
      // Un module de chaque profil au jour 1 : les huit couleurs de profils passent au contrôle de contraste.
      await page.evaluate(() => {
        const { MODS, PROFILES, applyTrip } = window.__PEI;
        const codes = Object.keys(PROFILES).map(p => MODS.find(m => m.p === p).c);
        applyTrip({ f: 7, s: "", d: [[codes.slice(0, 3), codes.slice(3, 6), codes.slice(6)], ...Array(6).fill([[], [], []])] });
      });
      await tab(page, "prat");
      await page.locator(`[data-set-skin="${skin}"]`).click();
      await page.locator(`[data-set-mode="${mode}"]`).click();
      expect(await page.evaluate(() => [document.documentElement.dataset.skin, document.documentElement.dataset.theme])).toEqual([skin, mode]);

      const echecs = [];
      for (const [v, nom] of [["explore", "Explorer"], ["trip", "Voyage"], ["carnet", "Carnet"], ["prat", "Pratique"]]) {
        await tab(page, v);
        await expect(page.locator(`#v-${v}`)).toBeVisible();
        echecs.push(...await audit(page, nom));
      }

      await tab(page, "explore");
      await page.locator("#segMap").click();
      await expect(page.locator("#map .pin").first()).toBeVisible();
      echecs.push(...await audit(page, "Carte"));

      await page.locator("#segList").click();
      await page.locator("#list .card").first().click();
      await expect(page.locator("#dlg #padd")).toBeVisible();
      echecs.push(...await audit(page, "Fiche module"));
      await fermer(page);

      await tab(page, "trip");
      await page.locator("#share").click();
      await expect(page.locator("#dlg #sharelink")).toBeVisible();
      echecs.push(...await audit(page, "Partager"));
      await fermer(page);

      expect(echecs.length, `Violations d'accessibilité (${skin}, ${mode}) :\n\n${echecs.join("\n\n")}\n`).toBe(0);
    });
  }
}

test.describe("Accessibilité au clavier", () => {
  test("un point de la carte est un bouton nommé ; Entrée et Espace ouvrent la fiche, le focus revient au point", async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => !!window.__PEI);
    await page.locator("#segMap").click();
    const pin = page.locator('#map .pin[data-c="AV-D1"]');
    const titre = await page.evaluate(() => window.__PEI.BY["AV-D1"].t);
    await expect(pin).toHaveAttribute("role", "button");
    await expect(pin).toHaveAttribute("aria-label", `AV-D1 · ${titre}`);
    await expect(page.getByRole("button", { name: `AV-D1 · ${titre}`, exact: true })).toHaveCount(1);

    await pin.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#dlg")).toHaveAttribute("open", "");
    await expect(page.locator("#sheet h2")).toHaveText(titre);
    await page.keyboard.press("Escape");
    await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");
    await expect(pin).toBeFocused();

    const autre = page.locator('#map .pin[data-c="LA-D1"]');
    await autre.focus();
    await page.keyboard.press(" ");
    await expect(page.locator("#sheet h2")).toHaveText(await page.evaluate(() => window.__PEI.BY["LA-D1"].t));
    await page.locator("#pclose").click();
    await expect(autre).toBeFocused();
  });

  test("le bouton × du voyage dit quel module il retire et de quel jour", async ({ page }) => {
    await openApp(page);
    await tab(page, "trip");
    const pills = page.locator('details[data-i="0"] .pill');
    await expect(pills.first()).toBeVisible();
    const attendu = await page.evaluate(() => {
      const { S, SLOTS, BY } = window.__PEI;
      const c = SLOTS.flatMap(([k]) => S.days[0].slots[k])[0];
      return `Retirer ${c} ${BY[c].t} du jour 1`;
    });
    await expect(pills.first().locator(".x")).toHaveAttribute("aria-label", attendu);
    await expect(page.locator('.pill .x[aria-label="Retirer"]')).toHaveCount(0);
    await expect(page.locator('details[data-i="1"] .pill .x').first()).toHaveAttribute("aria-label", / du jour 2$/);
  });

  test("à la fermeture d'une fiche, le focus revient sur ce qui l'a ouverte, même après un ajout", async ({ page }) => {
    await openApp(page);
    await page.waitForFunction(() => !!window.__PEI);
    const carte = page.locator('#list .card[data-c="RA-D1"]');
    // Carte de la liste : le titre est un bouton, Entrée ouvre la fiche
    await carte.locator(".open").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#dlg")).toHaveAttribute("open", "");
    await page.locator("#pclose").click();
    await expect(carte.locator(".open")).toBeFocused();

    // Bouton + : après « Ajouter », la liste est redessinée ; le focus revient sur le nouveau bouton +
    await carte.locator(".add").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#padd")).toBeVisible();
    await page.locator("#padd").click();
    await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");
    await expect(carte.locator(".add")).toHaveAttribute("aria-label", "Déjà dans mon voyage");
    await expect(carte.locator(".add")).toBeFocused();

    // Feuille Partager : retour sur le bouton Partager
    await tab(page, "trip");
    await page.locator("#share").focus();
    await page.keyboard.press("Enter");
    await expect(page.locator("#sharelink")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("#share")).toBeFocused();
  });
});
