import { test, expect } from "@playwright/test";
import { openApp, tab } from "./helpers.mjs";

test.use({ serviceWorkers: "allow" });

test("l'app fonctionne hors ligne après une première visite", async ({ page, context }) => {
  await openApp(page);
  await page.evaluate(() => navigator.serviceWorker.ready);
  // Le pré-cache (CORE) doit contenir toutes les ressources de l'app
  const cached = await page.evaluate(async () => {
    const keys = await caches.keys();
    const c = await caches.open(keys[0]);
    return (await c.keys()).map(r => new URL(r.url).pathname);
  });
  for (const f of ["/fonts/fonts.css", "/fonts/figtree-latin.woff2", "/vendor/qrcode.min.js", "/data/modules.json"]) expect(cached).toContain(f);

  await context.setOffline(true);
  const { errors } = await openApp(page);
  await expect(page.locator("#list .card")).toHaveCount(200);
  expect(await page.evaluate(() => typeof QRCode)).toBe("function");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => document.fonts.check('1em "Instrument Serif"'))).toBe(true);
  await tab(page, "trip");
  await page.locator("#share").click();
  await expect(page.locator("#qr img, #qr canvas").first()).toBeAttached();
  expect(errors).toEqual([]);
});
