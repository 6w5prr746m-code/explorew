// Fixture commune : chaque test démarre à une date fixe, hors de tout séjour simulé par les tests
// (sinon la vue « Aujourd'hui » s'activerait selon la date réelle et changerait l'onglet d'ouverture).
// Un test peut la remplacer en appelant page.clock.setFixedTime(...) avant d'ouvrir l'app.
import { test as base, expect } from "@playwright/test";
export const DATE_PAR_DEFAUT = new Date("2026-09-15T08:00:00+04:00");
export const test = base.extend({
  page: async ({ page }, use) => {
    await page.clock.setFixedTime(DATE_PAR_DEFAUT);
    await use(page);
  },
});
export { expect };
