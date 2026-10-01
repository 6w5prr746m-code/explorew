import { test, expect } from "./fixtures.mjs";
import { openApp } from "./helpers.mjs";

test.use({ serviceWorkers: "allow" });
// Sous Chromium, Playwright n'intercepte les requêtes du service worker qu'avec cette variable, lue au démarrage du worker :
// posée pour ce seul fichier (les tests d'un même processus s'exécutent l'un après l'autre).
test.beforeAll(() => { process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = "1"; });
test.afterAll(() => { delete process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS; });

// sw.js : au-delà de DELAI_RESEAU_MS (4 s), la copie en cache est servie si elle existe.
test("réseau très lent au démarrage : l'app s'ouvre depuis le cache", async ({ page, context }) => {
  test.setTimeout(60_000);
  await openApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => !!navigator.serviceWorker.controller);

  // Toute requête met désormais 20 s à répondre.
  await context.route("**/*", async route => { await new Promise(r => setTimeout(r, 20_000)); await route.continue().catch(() => {}); });
  const t0 = Date.now();
  await page.reload({ waitUntil: "commit" });
  await expect(page.locator("#list .card").first()).toBeVisible({ timeout: 15_000 });
  const duree = Date.now() - t0;
  // Ni avant le délai (preuve que le réseau a bien été attendu), ni après la réponse du réseau.
  expect(duree).toBeGreaterThanOrEqual(3_500);
  expect(duree).toBeLessThan(15_000);
  await context.unrouteAll({ behavior: "ignoreErrors" });
});
