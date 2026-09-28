/* Rafraîchit toutes les vues qui dépendent de l'état. */
import { renderList } from "./explorer.js";
import { renderTrip } from "./trip.js";
import { renderCarnet } from "./carnet.js";

export function renderAll(){renderList();renderTrip();renderCarnet()}
