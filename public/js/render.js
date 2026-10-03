/* Rafraîchit toutes les vues qui dépendent de l'état. */
import { renderList } from "./explorer.js";
import { renderTrip } from "./trip.js";
import { renderCarnet } from "./carnet.js";
import { renderToday } from "./today.js";
import { renderTampons } from "./passeport.js";
import { renderAgenda } from "./agenda.js";
import { renderSouvenir } from "./souvenir.js";
import { renderCartePostale } from "./carte-postale.js";
import { renderDemarrage } from "./demarrage.js";
import { renderEnvies } from "./envies.js";

export function renderAll(){renderList();renderTrip();renderCarnet();renderToday();renderAgenda();renderTampons();renderSouvenir();renderCartePostale();renderDemarrage();renderEnvies()}
