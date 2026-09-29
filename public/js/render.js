/* Rafraîchit toutes les vues qui dépendent de l'état. */
import { renderList } from "./explorer.js";
import { renderTrip } from "./trip.js";
import { renderCarnet } from "./carnet.js";
import { renderToday } from "./today.js";
import { renderAgenda } from "./agenda.js";

export function renderAll(){renderList();renderTrip();renderCarnet();renderToday();renderAgenda()}
