import { readFile } from "node:fs/promises";
import { test, expect } from "./fixtures.mjs";
import { openApp, tab } from "./helpers.mjs";

// Export agenda (.ics) : un événement « toute la journée » par jour, rappel la veille sur les jours de marche.
test.use({ colorScheme: "light" });

const ARRIVEE = "2026-10-12";
const SLOTS_PAR_JOUR = [
  { m: ["LA-D1"], a: [], s: [] },       // J1 : lagon seul, pas de rappel
  { m: [], a: [], s: [] },              // J2 : à composer
  { m: ["AV-J1"], a: [], s: ["NE-16"] }, // J3 : volcan, rappel
];
const etat = start => ({
  dest: "reunion", fmt: 7, start, example: false,
  days: Array.from({ length: 7 }, (_, i) => ({ slots: SLOTS_PAR_JOUR[i] || { m: [], a: [], s: [] }, heb: i === 0 ? "Gîte du lagon" : "", bud: "", coeur: "", notes: i === 0 ? "Snorkeling, puis pique-nique; retour tôt\nDeuxième ligne" : "" })),
  stamps: {}, words: [], back: "", checks: {},
});
async function seed(page, start) {
  await page.addInitScript(e => { if (!sessionStorage.getItem("seeded")) { localStorage.setItem("carnetpei.v1", e); sessionStorage.setItem("seeded", "1"); } }, JSON.stringify(etat(start)));
}
// Déplie les lignes pliées (RFC 5545 §3.1) puis découpe en événements.
const unfold = ics => ics.replace(/\r\n /g, "");
const events = ics => unfold(ics).split("BEGIN:VEVENT").slice(1).map(e => e.split("END:VEVENT")[0]);
const prop = (ev, name) => { const m = ev.match(new RegExp(`\\r\\n${name}(?:;[^:]*)?:([^\\r]*)`)); return m && m[1]; };

async function download(page) {
  const [dl] = await Promise.all([page.waitForEvent("download"), page.locator("#agenda").click()]);
  expect(dl.suggestedFilename()).toBe("carnet-pei-voyage.ics");
  return readFile(await dl.path(), "utf8");
}

test.describe("Export agenda", () => {
  test("sans date d'arrivée, le bouton est désactivé avec l'explication", async ({ page }) => {
    await seed(page, "");
    const { errors } = await openApp(page);
    await tab(page, "trip");
    const b = page.locator("#agenda");
    await expect(b).toHaveText("Ajouter à mon agenda");
    await expect(b).toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#agenda-hint")).toBeVisible();
    await expect(page.locator("#agenda-hint")).toContainText("Indiquez votre date d'arrivée");
    await expect(b).toHaveAccessibleDescription(/Indiquez votre date d'arrivée/);
    let downloaded = false;
    page.on("download", () => { downloaded = true; });
    await b.click({ force: true }); // aria-disabled : le bouton reste focalisable
    await page.waitForTimeout(300);
    expect(downloaded).toBe(false);

    // Une date saisie active le bouton.
    await page.locator("#start").fill(ARRIVEE);
    await page.locator("#start").dispatchEvent("change");
    await expect(b).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#agenda-hint")).toBeHidden();
    expect(errors).toEqual([]);
  });

  test("avec une date, le fichier .ics décrit chaque jour", async ({ page }) => {
    await seed(page, ARRIVEE);
    const { errors } = await openApp(page);
    await tab(page, "trip");
    await expect(page.locator("#agenda")).not.toHaveAttribute("aria-disabled", "true");
    await expect(page.locator("#agenda-hint")).toBeHidden();
    const reflexe = (await page.locator("#reflexes .check", { hasText: "Avant de marcher" }).locator("span").nth(1).textContent()).replace(/\s+/g, " ").trim();
    const ics = await download(page);

    // Format : CRLF partout, lignes de 75 octets au plus.
    expect(ics.endsWith("\r\n")).toBe(true);
    expect(ics.replace(/\r\n/g, "")).not.toMatch(/[\r\n]/);
    for (const l of ics.split("\r\n")) expect(Buffer.byteLength(l, "utf8")).toBeLessThanOrEqual(75);
    const u = unfold(ics);
    expect(u).toMatch(/^BEGIN:VCALENDAR\r\nVERSION:2\.0\r\nPRODID:-\/\/Carnet Péï\/\/FR\r\n/);
    expect(u).toContain("\r\nX-WR-TIMEZONE:Indian/Reunion\r\n");
    expect(u.trimEnd().endsWith("END:VCALENDAR")).toBe(true);

    // Un événement par jour, toute la journée, J1 = date d'arrivée.
    const ev = events(ics);
    expect(ev).toHaveLength(7);
    const jours = ["20261012", "20261013", "20261014", "20261015", "20261016", "20261017", "20261018"];
    ev.forEach((e, i) => {
      expect(prop(e, "DTSTART")).toBe(jours[i]);
      expect(e).toContain(`\r\nDTSTART;VALUE=DATE:${jours[i]}\r\n`);
      expect(e).toContain(`\r\nDTEND;VALUE=DATE:${i < 6 ? jours[i + 1] : "20261019"}\r\n`);
      expect(prop(e, "UID")).toBe(`carnetpei-${jours[i].replace(/(\d{4})(\d{2})(\d{2})/, "$1-$2-$3")}-J${i + 1}@carnetpei`);
      expect(prop(e, "DTSTAMP")).toMatch(/^\d{8}T\d{6}Z$/);
      expect(e).not.toMatch(/DTSTART[^\r]*T\d{6}/);
    });

    // Titres et descriptions.
    expect(prop(ev[0], "SUMMARY")).toBe("J1 · Ouest");
    expect(prop(ev[1], "SUMMARY")).toBe("J2 · À composer");
    expect(prop(ev[2], "SUMMARY")).toBe("J3 · Volcan\\, Ouest");
    expect(prop(ev[2], "DESCRIPTION")).toBe("Matin : AV-J1 Piton de la Fournaise\\, cratère Dolomieu\\nAprès-midi : créneau libre\\nSoirée : NE-16 Coucher de soleil à Boucan");

    // Échappement : virgule, point-virgule et retour à la ligne dans les notes.
    expect(prop(ev[0], "DESCRIPTION")).toContain("\\nHébergement : Gîte du lagon\\nNotes : Snorkeling\\, puis pique-nique\\; retour tôt\\nDeuxième ligne");

    // Rappel la veille, uniquement sur le jour de marche, avec le texte exact du réflexe.
    expect(reflexe).toMatch(/^Avant de marcher : /);
    const alarm = e => (e.match(/BEGIN:VALARM\r\n([\s\S]*?)END:VALARM/) || [])[1];
    expect(alarm(ev[0])).toBeUndefined();
    expect(alarm(ev[1])).toBeUndefined();
    const a3 = alarm(ev[2]);
    expect(a3).toContain("ACTION:DISPLAY\r\n");
    expect(a3).toContain("TRIGGER:-PT12H\r\n");
    const escaped = reflexe.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");
    expect(a3).toContain(`DESCRIPTION:${escaped}\r\n`);
    expect(ev.filter(e => e.includes("BEGIN:VALARM"))).toHaveLength(1);
    expect(ics).not.toMatch(/réserv/i);
    expect(errors).toEqual([]);
  });

  test("buildICS : rappel si un module du jour a « marche » dans securite", async ({ page }) => {
    await openApp(page);
    const r = await page.evaluate(async () => {
      const { needsReminder } = await import("/js/agenda.js");
      const { MODS } = await import("/js/data.js");
      const ex = [needsReminder(["AV-J1"]), needsReminder(["LA-D1"]), needsReminder(["RA-D1"]), needsReminder([]),
        needsReminder(["FA-03"]), needsReminder(["NE-20"]), needsReminder(["LA-D1", "SL-07"])];
      const off = MODS.filter(m => needsReminder([m.c]) !== m.sec.includes("marche")).map(m => m.c);
      return { ex, off };
    });
    // AV-J1 volcan, RA-D1 Maïdo, NE-20 Grand Bassin à pied, SL-07 Mafate : rappel ; lagon seul ou Cité du Volcan (musée) : aucun.
    expect(r.ex).toEqual([true, false, true, false, false, true, true]);
    expect(r.off).toEqual([]);
  });
});
