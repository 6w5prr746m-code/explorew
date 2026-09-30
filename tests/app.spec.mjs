import { test, expect } from "./fixtures.mjs";
import { openApp, tab, emptyTrip } from "./helpers.mjs";

test.describe("Chargement", () => {
  test("affiche les 200 modules sans erreur ni appel externe", async ({ page }) => {
    const { errors, external } = await openApp(page);
    await expect(page.locator("#list .card")).toHaveCount(200);
    await expect(page.locator("#count")).toHaveText("200 modules");
    await expect(page.locator("#nbmod")).toHaveText("200");
    await page.evaluate(() => document.fonts.ready);
    expect(await page.evaluate(() => document.fonts.check('1em "Instrument Serif"') && document.fonts.check("1em Figtree"))).toBe(true);
    expect(errors).toEqual([]);
    expect(external).toEqual([]);
  });

  test("les quatre onglets s'affichent", async ({ page }) => {
    await openApp(page);
    for (const [v, title] of [["trip", "Mon voyage"], ["carnet", "Mon carnet"], ["prat", "Pratique"]]) {
      await tab(page, v);
      await expect(page.locator(`#v-${v} h2`)).toHaveText(title);
      await expect(page.locator(`nav.tabs button[data-v="${v}"]`)).toHaveAttribute("aria-selected", "true");
      await expect(page.locator("#v-explore")).toBeHidden();
    }
    await tab(page, "explore");
    await expect(page.locator("#v-explore")).toBeVisible();
  });
});

test.describe("Filtres", () => {
  test("profil, zone, niveau, pictos et recherche", async ({ page }) => {
    await openApp(page);
    const cards = page.locator("#list .card");
    await page.locator('#profiles [data-p="AV"]').click();
    await expect(cards).toHaveCount(30);
    await expect(page.locator("#count")).toHaveText("30 modules · Aventurier");
    await page.locator('#profiles [data-p=""]').click();
    await expect(cards).toHaveCount(200);

    await page.locator("#zone").selectOption("Mafate");
    const nMafate = await cards.count();
    expect(nMafate).toBeGreaterThan(0);
    expect(nMafate).toBeLessThan(200);
    for (const c of await cards.locator(".meta").allTextContents()) expect(c.length).toBeGreaterThan(0);
    await page.locator("#zone").selectOption("");

    await page.locator("#niveau").selectOption("3");
    const n3 = await cards.count();
    expect(n3).toBeLessThan(200);
    await page.locator("#niveau").selectOption("");

    await page.locator('#pictos [data-k="PLUIE"]').click();
    await expect(page.locator('#pictos [data-k="PLUIE"]')).toHaveAttribute("aria-pressed", "true");
    const nPluie = await cards.count();
    expect(nPluie).toBeLessThan(200);
    for (const tags of await cards.locator(".tags").allTextContents()) expect(tags).toContain("PLUIE");
    await page.locator('#pictos [data-k="PLUIE"]').click();

    // Recherche insensible aux accents et à la casse
    await page.locator("#q").fill("fournaise");
    const a = await cards.count();
    await page.locator("#q").fill("FOURNAISÉ");
    await expect(cards).toHaveCount(a);
    expect(a).toBeGreaterThan(0);

    await page.locator("#q").fill("zzzzzz");
    await expect(page.locator("#list .empty")).toBeVisible();
    await expect(page.locator("#count")).toHaveText("0 module");
  });
});

test.describe("Voyage", () => {
  test("ajouter un module depuis sa fiche, puis le retirer", async ({ page }) => {
    await openApp(page);
    await emptyTrip(page);
    await tab(page, "explore");

    await page.locator('#list .card[data-c="AV-J1"]').click();
    const sheet = page.locator("#sheet");
    await expect(page.locator("#dlg")).toBeVisible();
    await expect(sheet.locator("h2")).toContainText("Fournaise");
    await sheet.locator("#pday").selectOption("1");
    await sheet.locator("#pslot").selectOption("a");
    await sheet.locator("#padd").click();
    await expect(page.locator("#dlg")).toBeHidden();
    await expect(page.locator("#tripbadge")).toHaveText("1");
    await expect(page.locator('#list [data-add="AV-J1"]')).toHaveClass(/on/);

    await tab(page, "trip");
    await expect(page.locator("#k-mod")).toHaveText("1");
    const day2 = page.locator('#days details[data-i="1"]');
    await day2.locator("summary").click();
    await expect(day2.locator('.pill .code')).toHaveText("AV-J1");
    await day2.locator('[data-rm="1:a:0"]').click();
    await expect(page.locator("#k-mod")).toHaveText("0");
    await expect(page.locator("#tripbadge")).toBeHidden();
  });

  test("« + Module » pré-remplit le jour et le créneau", async ({ page }) => {
    await openApp(page);
    await emptyTrip(page);
    await page.locator('#days details[data-i="0"] [data-browse="0:s"]').click();
    await expect(page.locator("#v-explore")).toBeVisible();
    await page.locator('#list .card[data-c="NE-01"]').click();
    await expect(page.locator("#pday")).toHaveValue("0");
    await expect(page.locator("#pslot")).toHaveValue("s");
  });

  test("format, date d'arrivée, budget et persistance après rechargement", async ({ page }) => {
    await openApp(page);
    await emptyTrip(page);
    await page.locator("#fmt").selectOption("10");
    await expect(page.locator("#days details")).toHaveCount(10);
    await page.locator("#start").fill("2026-11-02");
    await expect(page.locator('#days details[data-i="0"] .d')).toContainText("2");
    await page.locator("#bud0").fill("45,5");
    await page.locator("#heb0").fill("Gîte test");
    await expect(page.locator("#k-bud")).toHaveText("46 €");
    await page.waitForTimeout(400); // sauvegarde différée (250 ms)
    await page.reload();
    await tab(page, "trip");
    await expect(page.locator("#fmt")).toHaveValue("10");
    await expect(page.locator("#start")).toHaveValue("2026-11-02");
    await expect(page.locator("#heb0")).toHaveValue("Gîte test");
    await expect(page.locator("#k-bud")).toHaveText("46 €");
  });

  test("réduire le format demande confirmation si des jours sont remplis", async ({ page }) => {
    await openApp(page);
    await emptyTrip(page);
    await page.locator("#fmt").selectOption("10");
    await page.locator('#days details[data-i="9"] summary').click();
    await page.locator('[data-browse="9:m"]').click();
    await page.locator('#list .card[data-c="LA-D1"]').click();
    await page.locator("#padd").click();
    await tab(page, "trip");
    page.once("dialog", d => d.dismiss());
    await page.locator("#fmt").selectOption("7");
    await expect(page.locator("#days details")).toHaveCount(10);
    await expect(page.locator("#fmt")).toHaveValue("10");
    page.once("dialog", d => d.accept());
    await page.locator("#fmt").selectOption("7");
    await expect(page.locator("#days details")).toHaveCount(7);
    await expect(page.locator("#k-mod")).toHaveText("0");
  });
});

test.describe("Partage", () => {
  test("le lien de partage contient un QR et se réimporte", async ({ page, context }) => {
    await openApp(page);
    await tab(page, "trip");
    const placed = await page.locator("#k-mod").textContent();
    await page.locator("#share").click();
    await expect(page.locator("#qr img, #qr canvas").first()).toBeAttached();
    const link = await page.locator("#sharelink").inputValue();
    expect(link).toContain("#t=");

    // Réimport dans un navigateur vierge
    const p2 = await context.browser().newPage({ viewport: { width: 400, height: 800 } });
    p2.once("dialog", d => d.accept());
    await p2.goto(link.replace(/^https?:\/\/[^/]+/, new URL(page.url()).origin));
    await expect(p2.locator("#v-trip")).toBeVisible();
    await expect(p2.locator("#k-mod")).toHaveText(placed);
    expect(p2.url()).not.toContain("#t=");
    await p2.close();
  });

  test("import manuel d'un code, et message d'erreur si illisible", async ({ page }) => {
    await openApp(page);
    const code = await page.evaluate(() => {
      const o = { v: 1, f: 7, s: "", d: [[["LA-D1"], [], []]] };
      return btoa(JSON.stringify(o)).replace(/=+$/, "");
    });
    await tab(page, "trip");
    await page.locator("#import").click();
    await page.locator("#impcode").fill("n'importe quoi");
    await page.locator("#impgo").click();
    await expect(page.locator(".toast")).toContainText("Code illisible");
    await page.locator("#impcode").fill(code);
    await page.locator("#impgo").click();
    await expect(page.locator("#k-mod")).toHaveText("1");
    await expect(page.locator("#days details")).toHaveCount(1);
  });
});

test.describe("Carte", () => {
  test("bascule Liste / Carte, filtres appliqués, clic sur un point", async ({ page }) => {
    await openApp(page);
    await page.locator("#segMap").click();
    await expect(page.locator("#list")).toBeHidden();
    await expect(page.locator("#map svg")).toBeVisible();
    await expect(page.locator("#map circle.pin")).toHaveCount(200);
    await page.locator('#profiles [data-p="LA"]').click();
    await expect(page.locator("#map circle.pin")).toHaveCount(30);
    await expect(page.locator("#map g.tp").first()).toBeAttached(); // jours de la trame d'exemple
    await page.locator('#map circle.pin[data-c="LA-D1"]').dispatchEvent("click");
    await expect(page.locator("#dlg")).toBeVisible();
    await expect(page.locator("#sheet .code")).toContainText("LA-D1");
  });

  test("« Voir sur la carte » depuis le voyage", async ({ page }) => {
    await openApp(page);
    await tab(page, "trip");
    await page.locator("#tripmap").click();
    await expect(page.locator("#v-explore")).toBeVisible();
    await expect(page.locator("#map svg")).toBeVisible();
  });
});

test.describe("Carnet et Pratique", () => {
  test("tampons, mots créoles et check-list sont conservés", async ({ page }) => {
    await openApp(page);
    await tab(page, "carnet");
    await page.locator('#stamps [data-s="mafate"]').click();
    await expect(page.locator('#stamps [data-s="mafate"]')).toHaveAttribute("aria-pressed", "true");
    await page.locator("#word").fill("Marmay = les enfants");
    await page.locator("#wordform button").click();
    await expect(page.locator("#words")).toContainText("Marmay = les enfants");
    await tab(page, "prat");
    await page.locator("#ck2").check();
    await page.waitForTimeout(400);
    await page.reload();
    await tab(page, "carnet");
    await expect(page.locator('#stamps [data-s="mafate"]')).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("#words")).toContainText("Marmay");
    await tab(page, "prat");
    await expect(page.locator("#ck2")).toBeChecked();
  });
});

test.describe("Impression", () => {
  test("le Book complet contient les 200 fiches et l'index", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => window.__printBook());
    await expect(page.locator("body")).toHaveClass(/book/);
    await expect(page.locator("#printout article.bf")).toHaveCount(200);
    await expect(page.locator("#printout section.bprof")).toHaveCount(8);
    await expect(page.locator("#printout .bidx span")).toHaveCount(200);
  });

  test("l'impression du voyage liste chaque jour", async ({ page }) => {
    await openApp(page);
    await page.evaluate(() => { window.print = () => {}; });
    await tab(page, "trip");
    await page.locator("#print").click();
    await expect(page.locator("#printout .pd")).toHaveCount(7);
  });
});
