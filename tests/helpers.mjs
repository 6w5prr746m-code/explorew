import { expect } from "@playwright/test";

// Ouvre l'app, attend le rendu de la liste et renvoie les erreurs et requêtes externes observées.
export async function openApp(page, path = "/") {
  const errors = [], external = [];
  page.on("pageerror", e => errors.push(e.message));
  page.on("console", m => { if (m.type() === "error") errors.push(m.text()); });
  page.on("request", r => { const u = new URL(r.url()); if (u.protocol.startsWith("http") && u.hostname !== "localhost") external.push(r.url()); });
  await page.goto(path);
  await expect(page.locator("#list .card").first()).toBeVisible();
  return { errors, external };
}

// Attend que l'app soit initialisée (window.__PEI) : juste après un rechargement, un clic
// sur un onglet avant que main.js ait branché la navigation serait perdu.
export async function tab(page, v) {
  await page.waitForFunction(() => !!window.__PEI);
  await page.locator(`nav.tabs button[data-v="${v}"]`).click();
}

// Part d'un voyage vide (l'app démarre sur la trame d'exemple).
export async function emptyTrip(page) {
  await tab(page, "trip");
  page.once("dialog", d => d.accept());
  await page.locator("#reset").click();
  await expect(page.locator("#k-mod")).toHaveText("0");
}
