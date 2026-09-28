// Génère le Book imprimé (A5) à partir de l'app servie localement.
// Prérequis : npm install (Playwright) puis npx playwright install chromium
// Usage : npm run pdf   → book/1001-facons-La-Reunion-Book-A5.pdf
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join } from "node:path";
const root = new URL("../public/", import.meta.url).pathname;
const types = { ".html":"text/html", ".css":"text/css", ".js":"text/javascript", ".json":"application/json", ".svg":"image/svg+xml", ".png":"image/png", ".webmanifest":"application/manifest+json", ".woff2":"font/woff2" };
const server = createServer(async (req, res) => {
  const p = join(root, decodeURIComponent(req.url.split("?")[0]).replace(/\/$/, "/index.html"));
  try { res.writeHead(200, { "content-type": types[extname(p)] || "application/octet-stream" }); res.end(await readFile(p)); }
  catch { res.writeHead(404); res.end(); }
}).listen(4173);
const browser = await chromium.launch();
const page = await browser.newPage();
await page.goto("http://localhost:4173/");
await page.waitForFunction(() => window.__printBook && window.__PEI);
await page.evaluate(async () => { window.__PEI.S.days.forEach(d => d.slots = { m: [], a: [], s: [] }); window.__printBook(); await document.fonts.ready; });
await page.emulateMedia({ media: "print" });
await page.pdf({ path: new URL("../book/1001-facons-La-Reunion-Book-A5.pdf", import.meta.url).pathname, format: "A5", printBackground: true, preferCSSPageSize: true });
await browser.close(); server.close();
console.log("PDF généré dans book/");
