/* Carnet Péï — point d'entrée de l'application (modules ES, sans build). */
import { MODS, BY, PROFILES, PICTOS, SLOTS, DEST } from "./data.js";
import { S, save, dayDate } from "./state.js";
import { $, toast } from "./util.js";
import { initExplorer, rows } from "./explorer.js";
import { initModuleSheet, openModule } from "./module-sheet.js";
import { initTrip } from "./trip.js";
import { initCarnet } from "./carnet.js";
import { initPratique, renderPrat } from "./pratique.js";
import { initNav, switchView } from "./nav.js";
import { renderAll } from "./render.js";
import { initMap, renderMap } from "./map.js";
import { banner } from "./visuals.js";
import { initShare, importFromHash, encodeTrip, decodeTrip, applyTrip } from "./share.js";
import { initPrint, printBook } from "./print.js";
import { initBackup } from "./backup.js";
import { initTheme } from "./theme.js";
import { initToday } from "./today.js";
import { initAgenda } from "./agenda.js";

initTheme();
$("#nbmod").textContent=MODS.length;
initModuleSheet();initExplorer();initTrip();initCarnet();initPratique();initNav();
renderPrat();
initMap();initShare();initPrint();initBackup();initToday();initAgenda();

// API globale conservée pour les scripts (build-book-pdf.mjs) et le débogage
window.__PEI={DEST,MODS,BY,PROFILES,PICTOS,S,SLOTS,save,renderAll,toast,dayDate,switchView,openModule,renderMap,banner,encodeTrip,decodeTrip,applyTrip,get rows(){return rows}};
window.__printBook=printBook;

importFromHash();
renderAll();
