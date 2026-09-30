// Tests de bout en bout (Playwright). Usage : npm test
import { defineConfig } from "@playwright/test";
// Port configurable (PW_PORT) pour lancer les tests de plusieurs copies du dépôt en même temps
// sans qu'elles partagent le même serveur. Par défaut : 5173, comme npm run dev.
const PORT = Number(process.env.PW_PORT) || 5173;
export default defineConfig({
  testDir: "tests",
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["list"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    viewport: { width: 400, height: 800 },
    locale: "fr-FR",
    // Le service worker est coupé par défaut pour isoler les tests ; le test hors ligne le réactive.
    serviceWorkers: "block",
  },
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  webServer: { command: `npx --yes serve public -l ${PORT}`, url: `http://localhost:${PORT}`, reuseExistingServer: !process.env.CI, timeout: 60_000 },
});
