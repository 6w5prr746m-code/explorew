import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";

// Bilan d'équilibre (onglet Voyage) : constats neutres tirés des règles d'or du Book, sans score.
test.use({ colorScheme: "light" });

const VIDE = [[], [], []];
// Voyage équilibré : une seule zone (Ouest), un plan B chaque jour, aucun doublon, une journée libre au jour 6.
const EQUILIBRE = [
  [["LA-D1"], ["LA-D3"], []],
  [["LA-D6"], ["LA-D7"], []],
  [["LA-D8"], ["LA-D16"], []],
  [["AV-D13"], ["AV-D17"], []],
  [["LA-D18"], ["EP-D7"], []],
  VIDE,
  [["EP-D1"], ["LA-D14"], []],
];
// Un voyage construit pour déclencher chaque constat.
const DESEQUILIBRE = [
  [["LA-D1"], ["LA-D3"], []],          // J1 : Ouest
  [["LA-D6"], ["AV-D2"], []],          // J2 : Ouest + Cilaos (deux zones le même jour)
  [["LA-D1"], ["LA-D7"], []],          // J3 : doublon de LA-D1, Ouest
  [["AV-D5"], ["LA-D15"], []],         // J4 : Cilaos (changement de zone J3 → J4)
  [["FA-06"], [], []],                 // J5 : Cilaos, sans plan B, après-midi libre
  [["RA-D15"], ["RA-D17"], []],        // J6 : Cilaos (6 jours occupés d'affilée)
  [["AV-J4"], [], []],                 // J7 : Cilaos, module journée
];

async function appliquer(page, d) {
  await page.evaluate(d => window.__PEI.applyTrip({ f: 7, s: "", d }), d);
}
const calculer = (page, d) => page.evaluate(async d => {
  const { calculerBilan } = await import("/js/bilan.js");
  return calculerBilan(d.map(([m, a, s]) => ({ slots: { m, a, s } })));
}, d);

test.describe("Bilan d'équilibre", () => {
  test("calcul : chaque constat sur un voyage construit pour", async ({ page }) => {
    await openApp(page);
    const b = await calculer(page, DESEQUILIBRE);
    const par = t => b.points.filter(p => p.type === t);

    expect(par("doublon")).toHaveLength(1);
    expect(par("doublon")[0].jours).toEqual([0, 2]);
    expect(par("doublon")[0].texte).toContain("LA-D1");
    expect(par("doublon")[0].texte).toContain("jour 1 et jour 3");

    expect(par("zone-jour").map(p => p.jours)).toEqual([[1]]);
    expect(par("zone-jour")[0].texte).toBe("Jour 2 : deux zones dans la même journée (Ouest, Cilaos). Règle d'or du Book : un camp de base par zone.");
    // J2 (Ouest et Cilaos) partage une zone avec J1 et J3 : seul le passage de J3 à J4 change complètement de zone.
    expect(par("zone-suite").map(p => p.jours)).toEqual([[2, 3]]);
    expect(par("zone-suite")[0].texte).toBe("Jour 3 et jour 4 : deux zones différentes (Ouest, puis Cilaos). Règle d'or du Book : un camp de base par zone.");

    expect(par("tampon")).toHaveLength(1);
    expect(par("tampon")[0].texte).toBe("Jours 1 à 7 : 7 jours d'affilée occupés, sans journée libre. Règle d'or du Book : une journée tampon tous les 4 à 5 jours.");

    expect(par("planb")).toHaveLength(1);
    expect(par("planb")[0].jours).toEqual([4]);
    expect(par("planb")[0].texte).toMatch(/^Jour 5 : aucun plan B pluie/);

    // Marge : l'après-midi libre du jour 5 compte, pas celui du jour 7 (module journée).
    expect(b.marge.jours).toEqual([4]);
    expect(b.marge.texte).toBe("De la marge : une demi-journée libre (jour 5 après-midi). De quoi suivre la météo, se reposer ou improviser.");
  });

  test("calcul : jours vides en marge, module de plusieurs jours non compté en doublon", async ({ page }) => {
    await openApp(page);
    const b = await calculer(page, [[["AV-J2"], [], []], [["AV-J2"], [], []], VIDE, VIDE, [["PB-11"], ["AV-D2"], []], VIDE, VIDE]);
    expect(b.points.filter(p => p.type === "doublon")).toEqual([]);
    expect(b.marge.texte).toMatch(/^De la marge : jours 3, 4, 6 et 7 sans module\./);
    // Le profil Plan B pluie suffit pour le jour 5.
    expect(b.points.filter(p => p.type === "planb")).toEqual([]);
  });

  test("affichage : constats cliquables, sans score ni pourcentage", async ({ page }) => {
    const { errors } = await openApp(page);
    await appliquer(page, DESEQUILIBRE);
    await tab(page, "trip");
    const bilan = page.locator("#bilan");
    await expect(bilan).toBeVisible();
    await expect(page.locator("#bilan-tog")).toHaveAttribute("aria-expanded", "true");
    const types = await bilan.locator(".bilan-pt").evaluateAll(l => l.map(e => e.dataset.type));
    expect(new Set(types)).toEqual(new Set(["doublon", "zone-jour", "zone-suite", "tampon", "planb"]));
    await expect(bilan.locator(".bilan-marge")).toContainText("De la marge");
    await expect(bilan).toContainText("Règles d'or du Book : un camp de base par zone, les Hauts le matin, le littoral l'après-midi, une journée tampon tous les 4 à 5 jours.");

    const texte = await bilan.innerText();
    expect(texte).not.toMatch(/%|score|note|\/ ?10|erreur|devriez/i);

    // Zones tactiles d'au moins 40 px.
    for (const b of await bilan.locator("button").all()) {
      const r = await b.boundingBox();
      expect(r.height).toBeGreaterThanOrEqual(40);
      expect(r.width).toBeGreaterThanOrEqual(40);
    }

    // Un clic sur « J4 » du changement de zone ouvre le jour 4 et y place le focus.
    await page.locator("#days details[data-i='0']").evaluate(d => { d.open = false; });
    await bilan.locator(".bilan-pt[data-type='zone-suite'] [data-bilan-jour='3']").click();
    await expect(page.locator("#days details[data-i='3']")).toHaveAttribute("open", "");
    await expect(page.locator("#days details[data-i='3'] summary")).toBeFocused();
    expect(errors).toEqual([]);
  });

  test("voyage équilibré : aucun constat, une phrase neutre", async ({ page }) => {
    const { errors } = await openApp(page);
    await appliquer(page, EQUILIBRE);
    await tab(page, "trip");
    const bilan = page.locator("#bilan");
    await expect(bilan.locator(".bilan-pt")).toHaveCount(0);
    await expect(bilan.locator(".bilan-neutre")).toHaveText("Rien à signaler : la grille suit les règles d'or du Book.");
    await expect(bilan.locator(".bilan-marge")).toContainText("jour 6 sans module");
    expect(errors).toEqual([]);
  });

  test("voyage vide : phrase d'invitation ; exemple : bilan replié par défaut", async ({ page }) => {
    await openApp(page);
    await tab(page, "trip");
    // Trame d'exemple : affiché mais replié, discret.
    await expect(page.locator("#bilan")).toHaveClass(/\bex\b/);
    await expect(page.locator("#bilan-tog")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#bilan-body")).toBeHidden();
    await page.locator("#bilan-tog").click();
    await expect(page.locator("#bilan-body")).toContainText("Bilan de la trame d'exemple.");

    await appliquer(page, Array(7).fill(VIDE));
    await expect(page.locator("#bilan .bilan-neutre")).toHaveText("Placez des modules dans la grille : le bilan du voyage s'affichera ici.");
  });

  test("repli mémorisé après rechargement", async ({ page }) => {
    await openApp(page);
    await appliquer(page, DESEQUILIBRE);
    await tab(page, "trip");
    const tog = page.locator("#bilan-tog");
    await expect(tog).toHaveAttribute("aria-expanded", "true");
    await tog.click();
    await expect(tog).toHaveAttribute("aria-expanded", "false");
    await expect(tog).toHaveText("Afficher");
    await expect(page.locator("#bilan-body")).toBeHidden();
    await expect.poll(() => page.evaluate(() => (JSON.parse(localStorage.getItem("carnetpei.v1"))||{}).bilanReplie)).toBe(true);

    await page.reload();
    await tab(page, "trip");
    await expect(page.locator("#bilan-tog")).toHaveAttribute("aria-expanded", "false");
    await expect(page.locator("#bilan-body")).toBeHidden();
    await page.locator("#bilan-tog").click();
    await expect(page.locator("#bilan-body .bilan-pt").first()).toBeVisible();
  });

  test("absent du Book imprimé et de la carte postale", async ({ page }) => {
    await openApp(page);
    await appliquer(page, DESEQUILIBRE);
    const ecrit = await page.evaluate(async () => {
      const texts = [], f = CanvasRenderingContext2D.prototype.fillText;
      CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { texts.push(String(t)); return f.call(this, t, ...r); };
      await window.__buildPostcard(document.createElement("canvas"));
      CanvasRenderingContext2D.prototype.fillText = f;
      return texts.join("\n");
    });
    expect(ecrit.length).toBeGreaterThan(0);
    expect(ecrit).not.toMatch(/Bilan|Règle d'or|plan B pluie|De la marge/);
    await page.evaluate(() => window.__printBook());
    await page.emulateMedia({ media: "print" });
    await expect(page.locator("#bilan")).toBeHidden();
    await expect(page.locator("#printout")).not.toContainText("Bilan d'équilibre");
    await expect(page.locator("#printout")).toContainText("Règles d'or : un camp de base par zone, les Hauts le matin, le littoral l'après-midi, une journée tampon tous les 4 à 5 jours.");
  });
});
