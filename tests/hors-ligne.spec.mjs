import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";

// Encart « Hors ligne » de l'onglet Pratique : contrôle du cache CORE de la VERSION courante (sw.js).
const PRET = /^Prêt : l'app et les \d+ modules sont disponibles sans réseau$/;
const ENTREE = "icons/icon-512.png"; // fichier de CORE que la page ne recharge pas d'elle-même

test.describe("avec service worker", () => {
  test.use({ serviceWorkers: "allow" });

  test("l'encart détecte un fichier manquant, le remet en cache, puis l'app s'ouvre sans réseau", async ({ page, context }) => {
    const { errors } = await openApp(page);
    const nb = await page.evaluate(() => window.__PEI.MODS.length);
    // VERSION telle que le service worker actif la donne (même canal que l'encart)
    const version = await page.evaluate(async () => {
      const reg = await navigator.serviceWorker.ready;
      return new Promise(ok => { const c = new MessageChannel(); c.port1.onmessage = e => ok(e.data.version); reg.active.postMessage("carnetpei:core", [c.port2]); });
    });
    expect(version).toMatch(/^carnetpei-v\d+$/);

    await tab(page, "prat");
    const etat = page.locator("#hl-etat"), btn = page.locator("#hl-verif");
    await expect(etat).toHaveText(`Prêt : l'app et les ${nb} modules sont disponibles sans réseau`);
    await expect(page.locator("#hl-version")).toHaveText(`Version du cache : ${version}`);
    await expect(btn).toBeVisible();
    expect((await btn.boundingBox()).height).toBeGreaterThanOrEqual(40);
    // Rappel repris tel quel des réflexes du jour, juste sous l'encart
    await expect(page.locator("#hl-rappel")).toContainText("Avant de marcher");

    // Une entrée de CORE disparaît du cache : l'encart le signale à la prochaine ouverture de l'onglet.
    const present = (v, f) => page.evaluate(async ([v, f]) => !!(await (await caches.open(v)).match(new URL(f, location.href).href)), [v, f]);
    expect(await page.evaluate(async ([v, f]) => (await caches.open(v)).delete(new URL(f, location.href).href), [version, ENTREE])).toBe(true);
    await tab(page, "explore");
    await tab(page, "prat");
    await expect(etat).toHaveText("Incomplet : 1 fichier manque. Réessayez avec du réseau.");

    await btn.click();
    await expect(etat).toHaveText(PRET);
    expect(await present(version, ENTREE)).toBe(true);

    // Sans réseau : rechargement, les quatre onglets s'ouvrent sans erreur.
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#list .card").first()).toBeVisible();
    for (const v of ["explore", "trip", "carnet", "prat"]) {
      await tab(page, v);
      await expect(page.locator(`#v-${v}`)).toBeVisible();
    }
    await expect(etat).toHaveText(PRET);
    expect(errors).toEqual([]);
  });
});

test("service worker pas encore actif : message d'attente neutre, sans bouton", async ({ page }) => {
  // Configuration par défaut des tests : service worker bloqué, l'app n'est jamais enregistrée.
  await openApp(page);
  await tab(page, "prat");
  await expect(page.locator("#hl-etat")).toHaveText(/^Préparation du mode hors ligne/);
  await expect(page.locator("#hl-verif")).toBeHidden();
  await expect(page.locator("#hl-version")).toBeHidden();
});

test("navigateur sans service worker : message neutre, sans bouton", async ({ page }) => {
  await page.addInitScript(() => { delete Navigator.prototype.serviceWorker; });
  await openApp(page);
  expect(await page.evaluate(() => "serviceWorker" in navigator)).toBe(false);
  await tab(page, "prat");
  await expect(page.locator("#hl-etat")).toHaveText("Ce navigateur ne permet pas d'enregistrer l'app pour l'utiliser sans réseau.");
  await expect(page.locator("#hl-verif")).toBeHidden();
});
