import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";

// Vue « Aujourd'hui » : jour en cours calculé dans le fuseau de la destination (Indian/Reunion, UTC+4).
test.use({ colorScheme: "light" });

const ARRIVEE = "2026-10-12"; // J3 = mercredi 14 octobre
const etat = start => ({
  dest: "reunion", fmt: 7, start, example: false,
  days: Array.from({ length: 7 }, (_, i) => ({ slots: i === 2 ? { m: ["AV-J1"], a: [], s: ["NE-16"] } : { m: i === 0 ? ["LA-D1"] : [], a: [], s: [] }, heb: "", bud: "", coeur: "", notes: "" })),
  stamps: {}, words: [], back: "", checks: {},
});
// Pose l'état une seule fois (pas à chaque rechargement).
async function seed(page, start) {
  await page.addInitScript(e => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("carnetpei.v1", e); sessionStorage.setItem("seeded", "1"); } }, JSON.stringify(etat(start)));
}
const stored = page => page.evaluate(() => JSON.parse(localStorage.getItem("carnetpei.v1")));
async function openInTrip(page) {
  const errors = [];
  page.on("pageerror", e => errors.push(e.message));
  await page.goto("/");
  await expect(page.locator("#today")).toBeVisible();
  return errors;
}

test.describe("Aujourd'hui", () => {
  test("sans date d'arrivée, rien ne change", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-14T08:00:00+04:00"));
    await seed(page, "");
    await openApp(page);
    await expect(page.locator("#v-explore")).toBeVisible();
    await tab(page, "trip");
    await expect(page.locator("#today")).toBeHidden();
  });

  for (const [cas, quand] of [["avant l'arrivée", "2026-10-11T23:30:00+04:00"], ["après le dernier jour", "2026-10-19T00:30:00+04:00"]]) {
    test(`hors séjour (${cas}), rien ne change`, async ({ page }) => {
      await page.clock.setFixedTime(new Date(quand));
      await seed(page, ARRIVEE);
      await openApp(page);
      await expect(page.locator("#v-explore")).toBeVisible();
      await tab(page, "trip");
      await expect(page.locator("#today")).toBeHidden();
    });
  }

  test("au jour 3, l'app s'ouvre sur le voyage avec le jour en cours", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-14T08:00:00+04:00"));
    await seed(page, ARRIVEE);
    const errors = await openInTrip(page);
    await expect(page.locator("#v-trip")).toBeVisible();
    await expect(page.locator("#v-explore")).toBeHidden();
    await expect(page.locator('nav.tabs button[data-v="trip"]')).toHaveAttribute("aria-selected", "true");
    await expect(page.locator("#today h3")).toHaveText("Aujourd'hui · J3 · mercredi 14 octobre");
    await expect(page.locator('#today [data-slot="m"] .tmod')).toHaveAttribute("data-open", "AV-J1");
    await expect(page.locator('#today [data-slot="a"] .tempty')).toHaveText("Créneau libre");
    await expect(page.locator('#today [data-slot="s"] .tmod')).toHaveAttribute("data-open", "NE-16");
    await expect(page.locator("#today .tpb")).toHaveCount(0);

    // Réflexes repris tels quels de l'onglet Pratique
    const prat = await page.locator("#reflexes .check").allTextContents();
    expect(prat.length).toBeGreaterThan(0);
    expect(await page.locator("#today .treflex .check").allTextContents()).toEqual(prat);

    // Zones tactiles
    for (const b of await page.locator("#today button").all()) expect((await b.boundingBox()).height).toBeGreaterThanOrEqual(40);

    // Clic sur un module = fiche ; lien vers la journée complète
    await page.locator('#today [data-open="AV-J1"]').click();
    await expect(page.locator("#sheet h2")).toContainText("Piton de la Fournaise");
    await page.locator("#pclose").click();
    await page.locator("#today-full").click();
    await expect(page.locator('#days details[data-i="2"]')).toHaveAttribute("open", "");
    expect(errors).toEqual([]);
  });

  test("bascule Plan B : planB du module, sinon modules PB de la zone", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-14T08:00:00+04:00"));
    await seed(page, ARRIVEE);
    await openInTrip(page);
    const rain = page.locator("#today-rain");
    await expect(rain).toHaveAttribute("aria-pressed", "false");
    await rain.click();
    await expect(page.locator("#today-rain")).toHaveAttribute("aria-pressed", "true");
    // AV-J1 a un planB : FA-03
    await expect(page.locator('#today [data-slot="m"] .talt [data-open]')).toHaveCount(1);
    await expect(page.locator('#today [data-slot="m"] .talt [data-open]')).toHaveAttribute("data-open", "FA-03");
    // NE-16 (Ouest) n'en a pas : jusqu'à 3 modules PB de l'Ouest
    const alt = await page.locator('#today [data-slot="s"] .talt [data-open]').evaluateAll(b => b.map(x => x.dataset.open));
    expect(alt.length).toBeGreaterThan(0);
    expect(alt.length).toBeLessThanOrEqual(3);
    const zones = await page.evaluate(c => c.map(x => window.__PEI.BY[x]).map(m => m.p + ":" + m.z), alt);
    expect(zones.every(z => z === "PB:Ouest")).toBe(true);
    // Créneau vide : propositions PB à ajouter
    await expect(page.locator('#today [data-slot="a"] [data-put]').first()).toBeVisible();
    // Bascule éteinte, et non sauvegardée
    await page.locator("#today-rain").click();
    await expect(page.locator("#today .tpb")).toHaveCount(0);
    await page.locator("#today-rain").click();
    await page.reload();
    await expect(page.locator("#today-rain")).toHaveAttribute("aria-pressed", "false");
    expect(await stored(page)).not.toHaveProperty("rain");
  });

  test("remplacer le module du créneau met à jour le voyage", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-14T08:00:00+04:00"));
    await seed(page, ARRIVEE);
    await openInTrip(page);
    await page.locator("#today-rain").click();
    await page.locator('#today [data-swap="m:0:FA-03"]').click();
    await expect(page.locator('#today [data-slot="m"] > .tmod')).toHaveAttribute("data-open", "FA-03");
    await expect(page.locator('#days details[data-i="2"] .pill [data-open="FA-03"]')).toHaveCount(1);
    await expect(page.locator('#days details[data-i="2"] .pill [data-open="AV-J1"]')).toHaveCount(0);
    // La bascule reste active après le remplacement
    await expect(page.locator("#today-rain")).toHaveAttribute("aria-pressed", "true");
    await expect.poll(async () => (await stored(page)).days[2].slots.m).toEqual(["FA-03"]);
    // Ajout dans un créneau vide
    const c = await page.locator('#today [data-slot="a"] [data-put]').first().getAttribute("data-put");
    await page.locator(`#today [data-put="${c}"]`).click();
    await expect.poll(async () => (await stored(page)).days[2].slots.a).toEqual([c.split(":")[1]]);
  });

  test.describe("téléphone réglé en UTC", () => {
    test.use({ timezoneId: "UTC" });
    test("à 21 h UTC la veille, c'est déjà le lendemain à La Réunion", async ({ page }) => {
      // 13 octobre 21 h UTC = 14 octobre 1 h à La Réunion : J3, et non J2
      await page.clock.setFixedTime(new Date("2026-10-13T21:00:00Z"));
      await seed(page, ARRIVEE);
      await openInTrip(page);
      expect(await page.evaluate(() => new Date().getDate())).toBe(13);
      await expect(page.locator("#today h3")).toHaveText("Aujourd'hui · J3 · mercredi 14 octobre");
    });
    test("dernier jour à 23 h 30 à La Réunion : encore J7", async ({ page }) => {
      await page.clock.setFixedTime(new Date("2026-10-18T19:30:00Z"));
      await seed(page, ARRIVEE);
      await openInTrip(page);
      await expect(page.locator("#today h3")).toContainText("J7");
    });
  });
});
