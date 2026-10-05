import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";
import AxeBuilder from "@axe-core/playwright";

// Déplacer un module placé (onglet Voyage) : glisser-déposer au pointeur (souris, doigt) et alternative au clavier.
test.use({ colorScheme: "light" });

const VIDE = [[], [], []];
// J1 : Ouest le matin, Cilaos l'après-midi (deux zones le même jour, constat du bilan). Le reste est vide.
const VOYAGE = [[["LA-D1"], ["AV-D2"], []], VIDE, VIDE, VIDE, VIDE, VIDE, VIDE];

async function preparer(page, d = VOYAGE) {
  const r = await openApp(page);
  if (d) await page.evaluate(d => window.__PEI.applyTrip({ f: 7, s: "", d }), d);
  await tab(page, "trip");
  return r;
}
// Amène la grille en haut de l'écran (sous l'en-tête) pour les gestes au pointeur.
const grilleEnHaut = page => page.evaluate(() => {
  const h = document.querySelector("header.top").getBoundingClientRect().bottom;
  scrollTo(0, scrollY + document.querySelector("#days").getBoundingClientRect().top - h - 8);
});
// Grille réduite aux codes : [[m, a, s], …] par jour.
const grille = page => page.evaluate(() => window.__PEI.S.days.map(d => [d.slots.m, d.slots.a, d.slots.s]));
// Tous les codes placés, triés : aucun module perdu ni dupliqué.
const tous = g => g.flat(2).sort();
const jour = (page, i) => page.locator(`#days details.day[data-i="${i}"]`);
const ouvrir = async (page, i) => {
  const d = jour(page, i);
  if (!(await d.evaluate(e => e.open))) await d.locator("summary").click();
  await expect(d).toHaveAttribute("open", "");
};
const centre = async loc => { const b = await loc.boundingBox(); return { x: b.x + b.width / 2, y: b.y + b.height / 2 }; };

// Glisser à la souris, en plusieurs étapes, du titre d'un module vers un point.
async function glisserSouris(page, depuis, vers, { lacher = true } = {}) {
  await grilleEnHaut(page);
  const a = await centre(depuis);
  await page.mouse.move(a.x, a.y);
  await page.mouse.down();
  await page.mouse.move(a.x + 3, a.y + 8, { steps: 2 });
  const b = typeof vers.x === "number" ? vers : await centre(vers);
  await page.mouse.move(b.x, b.y, { steps: 12 });
  if (lacher) await page.mouse.up();
}

test.describe("Déplacer un module", () => {
  // Écran de téléphone en hauteur : deux jours ouverts tiennent à l'écran (le défilement automatique a son propre test).
  test.use({ viewport: { width: 400, height: 1300 } });
  test("à la souris : du jour 1 matin au jour 2 après-midi, sans perte ni doublon", async ({ page }) => {
    const { errors } = await preparer(page);
    await ouvrir(page, 1);
    const avant = await grille(page);
    const cible = jour(page, 1).locator('.slot[data-slot="1:a"] .h');
    await glisserSouris(page, jour(page, 0).locator('.pill[data-pos="0:m:0"] .t'), cible, { lacher: false });
    // Pendant le déplacement : fantôme, source estompée, créneau cible mis en évidence.
    await expect(page.locator("body > .deplacer-fantome")).toBeVisible();
    await expect(page.locator(".pill.deplacer-source")).toHaveCount(1);
    await expect(page.locator('.slot[data-slot="1:a"]')).toHaveClass(/deplacer-cible/);
    await page.mouse.up();

    await expect(page.locator(".toast").last()).toHaveText("LA-D1 déplacé au jour 2 · Après-midi");
    await expect(page.locator("#deplacer-annonce")).toHaveText("LA-D1 déplacé au jour 2 · Après-midi");
    const apres = await grille(page);
    expect(apres[0]).toEqual([[], ["AV-D2"], []]);
    expect(apres[1]).toEqual([[], ["LA-D1"], []]);
    expect(tous(apres)).toEqual(tous(avant));
    await expect(page.locator(".deplacer-fantome")).toHaveCount(0);
    await expect(page.locator(".deplacer-cible, .deplacer-source")).toHaveCount(0);
    // Le relâchement n'a pas ouvert la fiche du module.
    await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");
    await expect(jour(page, 1).locator('.pill[data-pos="1:a:0"] .code')).toHaveText("LA-D1");
    expect(errors).toEqual([]);
  });

  test("à la souris : vers un autre créneau du même jour, le module garde ses avis du groupe", async ({ page }) => {
    await preparer(page);
    await page.evaluate(() => { const P = window.__PEI; P.S.envies = [{ i: "abcdef0123456789", n: "Léa", e: ["AV-D2"], p: [] }]; P.renderAll(); });
    await expect(page.locator('.pill[data-pos="0:a:0"] + .pill-envies')).toHaveText("Avis du groupe : 1 envie");
    await glisserSouris(page, page.locator('.pill[data-pos="0:a:0"] .t'), page.locator('.slot[data-slot="0:s"] .h'));
    expect((await grille(page))[0]).toEqual([["LA-D1"], [], ["AV-D2"]]);
    await expect(page.locator('.pill[data-pos="0:s:0"] + .pill-envies')).toHaveText("Avis du groupe : 1 envie");
    await expect(page.locator(".pill-envies")).toHaveCount(1);
  });

  test("annulation : Échap pendant le déplacement, puis lâcher hors d'un créneau", async ({ page }) => {
    await preparer(page);
    const avant = await grille(page);
    const src = page.locator('.pill[data-pos="0:m:0"] .t');

    await glisserSouris(page, src, page.locator('.slot[data-slot="0:s"] .h'), { lacher: false });
    await expect(page.locator('.slot[data-slot="0:s"]')).toHaveClass(/deplacer-cible/);
    await page.keyboard.press("Escape");
    await expect(page.locator(".deplacer-fantome")).toHaveCount(0);
    await page.mouse.up();
    expect(await grille(page)).toEqual(avant);
    await expect(page.locator("#deplacer-annonce")).toHaveText("Déplacement annulé");
    await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");

    // Lâcher sur les indicateurs (hors de tout créneau) : rien ne bouge.
    await page.locator(".kpis").scrollIntoViewIfNeeded();
    await glisserSouris(page, src, page.locator(".kpis"));
    expect(await grille(page)).toEqual(avant);
    await expect(page.locator(".deplacer-fantome, .deplacer-cible, .deplacer-source")).toHaveCount(0);
    // Le voyage n'a pas été modifié : pas de toast « déplacé ».
    await expect(page.locator(".toast", { hasText: "déplacé" })).toHaveCount(0);
  });

  test("défilement automatique près du bord bas, sur un écran de 800 px", async ({ page }) => {
    await page.setViewportSize({ width: 400, height: 800 });
    await preparer(page);
    await ouvrir(page, 1);
    await grilleEnHaut(page);
    const cible = jour(page, 1).locator('.slot[data-slot="1:s"]');
    const hautEcran = await page.evaluate(() => innerHeight);
    expect((await cible.boundingBox()).y).toBeGreaterThan(hautEcran);
    const a = await centre(page.locator('.pill[data-pos="0:m:0"] .t'));
    await page.mouse.move(a.x, a.y);
    await page.mouse.down();
    await page.mouse.move(a.x, a.y + 10, { steps: 2 });
    const y0 = await page.evaluate(() => scrollY);
    // Près des onglets du bas : la page défile seule tant que le pointeur y reste.
    const bas = await page.evaluate(() => document.querySelector("nav.tabs").getBoundingClientRect().top - 10);
    await page.mouse.move(a.x, bas, { steps: 6 });
    await expect.poll(async () => (await cible.boundingBox()).y < bas - 100, { timeout: 8000 }).toBe(true);
    // Retour au milieu de l'écran : le défilement s'arrête.
    await page.mouse.move(a.x, 400, { steps: 3 });
    const y1 = await page.evaluate(() => scrollY);
    expect(y1).toBeGreaterThan(y0);
    await page.waitForTimeout(200);
    expect(await page.evaluate(() => scrollY)).toBe(y1);
    await cible.locator(".h").scrollIntoViewIfNeeded();
    const b = await centre(cible.locator(".h"));
    await page.mouse.move(b.x, b.y, { steps: 4 });
    await expect(cible).toHaveClass(/deplacer-cible/);
    await page.mouse.up();
    expect((await grille(page))[1]).toEqual([[], [], ["LA-D1"]]);
  });

  test("un simple clic sur le titre ouvre toujours la fiche", async ({ page }) => {
    await preparer(page);
    await page.locator('.pill[data-pos="0:m:0"] .t').click();
    await expect(page.locator("#dlg")).toHaveAttribute("open", "");
  });

  test("au clavier : bouton « Déplacer », choix Jour / Créneau, « Déplacer ici »", async ({ page }) => {
    await preparer(page);
    const avant = await grille(page);
    const titre = await page.evaluate(() => window.__PEI.BY["AV-D2"].t);
    const btn = page.getByRole("button", { name: `Déplacer AV-D2 ${titre}`, exact: true });
    await expect(btn).toHaveCount(1);
    const b = await btn.boundingBox();
    expect(b.width).toBeGreaterThanOrEqual(40);
    expect(b.height).toBeGreaterThanOrEqual(40);

    // Atteint au clavier depuis le titre du module.
    await page.locator('.pill[data-pos="0:a:0"] .t').focus();
    await page.keyboard.press("Tab");
    await expect(btn).toBeFocused();
    await page.keyboard.press("Enter");
    await expect(btn).toHaveAttribute("aria-expanded", "true");
    const choix = page.getByRole("group", { name: `Déplacer AV-D2 ${titre}` });
    await expect(choix).toBeVisible();
    const jourSel = choix.getByLabel("Jour"), creneauSel = choix.getByLabel("Créneau");
    await expect(jourSel).toBeFocused();
    await expect(jourSel).toHaveValue("0");
    await expect(creneauSel).toHaveValue("a");

    // Échap ferme le choix et rend le focus au bouton.
    await page.keyboard.press("Escape");
    await expect(choix).toHaveCount(0);
    await expect(btn).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(jourSel).toBeFocused();
    await page.keyboard.press("ArrowDown");
    await page.keyboard.press("ArrowDown");
    await expect(jourSel).toHaveValue("2");
    await page.keyboard.press("Tab");
    await expect(creneauSel).toBeFocused();
    await page.keyboard.press("ArrowUp");
    await expect(creneauSel).toHaveValue("m");
    await page.keyboard.press("Tab");
    await expect(choix.getByRole("button", { name: "Déplacer ici" })).toBeFocused();
    await page.keyboard.press("Enter");

    const apres = await grille(page);
    expect(apres[0]).toEqual([["LA-D1"], [], []]);
    expect(apres[2]).toEqual([["AV-D2"], [], []]);
    expect(tous(apres)).toEqual(tous(avant));
    await expect(page.locator("#deplacer-annonce")).toHaveText("AV-D2 déplacé au jour 3 · Matin");
    await expect(page.locator(".toast").last()).toHaveText("AV-D2 déplacé au jour 3 · Matin");
    // Le jour d'arrivée est ouvert et le focus est sur le bouton du module déplacé.
    await expect(jour(page, 2)).toHaveAttribute("open", "");
    await expect(page.locator('[data-deplacer="2:m:0"]')).toBeFocused();
    await expect(page.locator(".deplacer-choix")).toHaveCount(0);
  });

  test("sortie du mode exemple", async ({ page }) => {
    await preparer(page, null);
    expect(await page.evaluate(() => window.__PEI.S.example)).toBe(true);
    await expect(page.locator("#exnote .note-ex")).toBeVisible();
    const avant = await grille(page);
    const code = avant[0][1][0];
    await page.locator('[data-deplacer="0:a:0"]').click();
    await page.locator(".deplacer-choix .dc-creneau").selectOption("m");
    await page.locator(".deplacer-choix .dc-ok").click();
    expect(await page.evaluate(() => window.__PEI.S.example)).toBe(false);
    await expect(page.locator("#exnote .note-ex")).toHaveCount(0);
    const apres = await grille(page);
    expect(apres[0][0]).toContain(code);
    expect(tous(apres)).toEqual(tous(avant));
    // L'état est enregistré.
    await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1") || "{}").example)).toBe(false);
  });

  test("bilan recalculé après un déplacement", async ({ page }) => {
    await preparer(page);
    const bilan = page.locator("#bilan-body");
    await expect(bilan).toContainText("Jour 1 : deux zones dans la même journée");
    await ouvrir(page, 1);
    await glisserSouris(page, page.locator('.pill[data-pos="0:a:0"] .t'), jour(page, 1).locator('.slot[data-slot="1:m"] .h'));
    expect((await grille(page)).slice(0, 2)).toEqual([[["LA-D1"], [], []], [["AV-D2"], [], []]]);
    await expect(bilan).not.toContainText("deux zones dans la même journée");
    await expect(bilan).toContainText("Jour 1 et jour 2 : deux zones différentes");
    // Indicateurs recalculés : toujours 2 modules placés.
    await expect(page.locator("#k-mod")).toHaveText("2");
  });

  test("audit axe avec le choix ouvert, dans les quatre thèmes", async ({ page }) => {
    test.setTimeout(90_000);
    await preparer(page);
    for (const skin of ["epure", "desert"]) for (const mode of ["light", "dark"]) {
      await page.evaluate(([s, m]) => { document.documentElement.dataset.skin = s; document.documentElement.dataset.theme = m; }, [skin, mode]);
      if (!(await page.locator(".deplacer-choix").count())) await page.locator('[data-deplacer="0:a:0"]').click();
      const { violations } = await new AxeBuilder({ page }).include("#days").withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]).analyze();
      expect(violations.filter(v => ["serious", "critical"].includes(v.impact)).map(v => `${skin} ${mode} ${v.id}`)).toEqual([]);
    }
  });
});

test.describe("Déplacer au toucher", () => {
  test.use({ hasTouch: true, isMobile: true, viewport: { width: 400, height: 1300 } });

  // Gestes tactiles réels (événements touch → Pointer Events de type « touch ») via le protocole Chrome DevTools.
  async function toucher(page) {
    const cdp = await page.context().newCDPSession(page);
    const ev = (type, p) => cdp.send("Input.dispatchTouchEvent", { type, touchPoints: p ? [{ x: p.x, y: p.y, id: 1 }] : [] });
    return {
      debut: p => ev("touchStart", p),
      async glisser(a, b, steps = 12) { for (let s = 1; s <= steps; s++) await ev("touchMove", { x: a.x + (b.x - a.x) * s / steps, y: a.y + (b.y - a.y) * s / steps }); },
      fin: () => ev("touchEnd"),
    };
  }

  test("appui long puis glissé : du jour 1 au jour 2", async ({ page }) => {
    await preparer(page);
    await ouvrir(page, 1);
    const avant = await grille(page);
    await grilleEnHaut(page);
    const t = await toucher(page);
    const a = await centre(page.locator('.pill[data-pos="0:a:0"] .t'));
    const b = await centre(jour(page, 1).locator('.slot[data-slot="1:s"] .h'));
    await t.debut(a);
    await page.waitForTimeout(450); // au-delà de l'appui long (300 ms)
    await expect(page.locator("body > .deplacer-fantome")).toBeVisible();
    await t.glisser(a, b);
    await expect(page.locator('.slot[data-slot="1:s"]')).toHaveClass(/deplacer-cible/);
    await t.fin();
    const apres = await grille(page);
    expect(apres[0]).toEqual([["LA-D1"], [], []]);
    expect(apres[1]).toEqual([[], [], ["AV-D2"]]);
    expect(tous(apres)).toEqual(tous(avant));
    await expect(page.locator(".toast").last()).toHaveText("AV-D2 déplacé au jour 2 · Soirée");
    await expect(page.locator("#dlg")).not.toHaveAttribute("open", "");
  });

  test("un glissé rapide sans appui long ne déplace rien", async ({ page }) => {
    await preparer(page);
    await ouvrir(page, 1);
    const avant = await grille(page);
    await grilleEnHaut(page);
    const t = await toucher(page);
    const a = await centre(page.locator('.pill[data-pos="0:a:0"] .t'));
    const b = await centre(jour(page, 1).locator('.slot[data-slot="1:s"] .h'));
    await t.debut(a);
    await t.glisser(a, b, 6);
    await t.fin();
    await page.waitForTimeout(400);
    await expect(page.locator(".deplacer-fantome")).toHaveCount(0);
    expect(await grille(page)).toEqual(avant);
  });
});
