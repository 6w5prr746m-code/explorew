/* Carte SVG de l'île (coordonnées approximatives tant que geo est vide). */
import { MODS, SLOTS } from "./data.js";
import { S } from "./state.js";
import { $, esc } from "./util.js";
import { openModule } from "./module-sheet.js";
import { rows } from "./explorer.js";
import { switchView } from "./nav.js";

const OUTLINE=[[55.45,-20.872],[55.53,-20.89],[55.61,-20.905],[55.66,-20.95],[55.72,-21.02],[55.79,-21.12],[55.83,-21.18],[55.84,-21.26],[55.80,-21.33],[55.77,-21.365],[55.70,-21.382],[55.62,-21.388],[55.55,-21.377],[55.48,-21.347],[55.41,-21.30],[55.34,-21.282],[55.29,-21.222],[55.278,-21.17],[55.23,-21.08],[55.215,-21.03],[55.26,-21.0],[55.29,-20.935],[55.36,-20.925],[55.41,-20.882]];
const LOC=[["Colimaçons",55.30,-21.13],["Mascarin",55.30,-21.13],["Pointe au Sel",55.285,-21.20],["Piton Saint-Leu",55.32,-21.19],["Saint-Leu",55.285,-21.17],["Étang-Salé",55.34,-21.27],["Ermitage",55.225,-21.08],["La Saline",55.235,-21.10],["Boucan",55.222,-21.035],["Roches Noires",55.222,-21.05],["Saint-Gilles",55.225,-21.055],["Cap La Houssaye",55.235,-21.018],["Le Guillaume",55.32,-21.03],["Bellemène",55.31,-21.02],["Saint-Paul",55.27,-21.005],["Les Avirons",55.34,-21.24],["Maïdo",55.383,-21.071],["Dos d'Âne",55.40,-20.99],["Aurère",55.43,-21.00],["Col des Bœufs",55.47,-21.045],["La Nouvelle",55.43,-21.07],["Marla",55.445,-21.10],["Mafate",55.42,-21.06],["Taïbit",55.46,-21.115],["Caverne Dufour",55.48,-21.095],["Piton des Neiges",55.48,-21.10],["Cilaos",55.472,-21.135],["Bélouve",55.545,-21.07],["Trou de Fer",55.55,-21.08],["Hell-Bourg",55.52,-21.065],["Salazie",55.54,-21.03],["Bébour",55.58,-21.11],["Plaine des Palmistes",55.63,-21.13],["Palmistes",55.63,-21.13],["Bourg-Murat",55.57,-21.21],["Plaine des Cafres",55.57,-21.21],["Pas de Bellecombe",55.688,-21.22],["Route du Volcan",55.63,-21.22],["Makes",55.41,-21.20],["Entre-Deux",55.47,-21.25],["Bois Court",55.55,-21.22],["Le Tampon",55.52,-21.27],["Tampon",55.52,-21.27],["Pierrefonds",55.43,-21.32],["Saint-Louis",55.41,-21.285],["Saint-Pierre",55.478,-21.34],["Petite-Île",55.55,-21.37],["Grande Anse",55.55,-21.37],["Manapany",55.595,-21.375],["Hauts de Saint-Joseph",55.62,-21.33],["Saint-Joseph",55.62,-21.38],["Langevin",55.645,-21.37],["Le Tremblet",55.80,-21.30],["Route des Laves",55.81,-21.25],["Saint-Philippe",55.765,-21.36],["Cap Méchant",55.73,-21.375],["Sainte-Rose",55.795,-21.13],["Anse des Cascades",55.82,-21.17],["Sainte-Anne",55.74,-21.06],["Saint-Benoît",55.715,-21.035],["Bras-Panon",55.68,-21.0],["Saint-André",55.65,-20.965],["Sainte-Suzanne",55.61,-20.91],["Hauts de Saint-Denis",55.46,-20.93],["Plaine des Chicots",55.45,-20.95],["Saint-Denis",55.45,-20.885]];
const ZC={"Ouest":[55.25,-21.06],"Hauts":[55.36,-21.09],"Sud":[55.47,-21.31],"Sud sauvage":[55.72,-21.35],"Volcan":[55.66,-21.22],"Est":[55.69,-21.06],"Nord":[55.46,-20.9],"Cilaos":[55.47,-21.135],"Salazie":[55.53,-21.05],"Mafate":[55.43,-21.07],"Cirques":[55.48,-21.09],"Toute l'île":[55.52,-21.15]};
const W=660,H=590,K=1000;
const P=([lo,la])=>[(lo-55.2)*K+10,(la*-1-20.86)*K*1.07+10];
function locate(m){if(m.geo)return[m.geo.lng,m.geo.lat];const s=(m.l+" "+m.t);for(const [k,lo,la] of LOC){if(s.includes(k))return[lo,la]}return ZC[m.z]||ZC["Toute l'île"]}
// dispersion légère des points superposés
const PT={};(function(){const seen={};MODS.forEach(m=>{let [x,y]=P(locate(m));const key=Math.round(x/6)+":"+Math.round(y/6);const n=seen[key]=(seen[key]||0)+1;if(n>1){const a=n*2.4,r=5+2.2*Math.sqrt(n);x+=Math.cos(a)*r;y+=Math.sin(a)*r}PT[m.c]=[x,y]})})();
const coast=(()=>{const pts=OUTLINE.map(P),n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],f=v=>v.map(x=>x.toFixed(1)).join(",");let d="M"+f(mid(pts[n-1],pts[0]));for(let i=0;i<n;i++)d+="Q"+f(pts[i])+" "+f(mid(pts[i],pts[(i+1)%n]));return d+"Z"})();
function circle(c,r,label,dy){const [x,y]=P(c);return `<circle cx="${x}" cy="${y}" r="${r}" class="mz"/><text x="${x}" y="${y+dy}" class="ml">${label}</text>`}

export function renderMap(rows){
  const el=$("#map");if(!el||el.hidden)return;
  const trip=[];S.days.forEach((d,i)=>SLOTS.forEach(([k])=>d.slots[k].forEach(c=>{if(PT[c])trip.push([i+1,c])})));
  const route=trip.length>1?`<polyline class="route" points="${trip.map(([,c])=>PT[c].join(",")).join(" ")}"/>`:"";
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte de La Réunion avec ${rows.length} modules">
    <defs><pattern id="sea" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7q3.5-3 7 0t7 0" class="wave"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#sea)"/>
    <path d="${coast}" class="land"/>
    ${circle([55.42,-21.06],38,"Mafate",-44)}${circle([55.53,-21.05],36,"Salazie",-42)}${circle([55.47,-21.135],34,"Cilaos",48)}${circle([55.705,-21.235],40,"Volcan",-46)}
    <text x="${P([55.45,-20.875])[0]}" y="${P([55.45,-20.875])[1]-8}" class="city">Saint-Denis</text>
    <text x="${P([55.478,-21.345])[0]}" y="${P([55.478,-21.345])[1]+18}" class="city">Saint-Pierre</text>
    <text x="${P([55.225,-21.055])[0]-6}" y="${P([55.225,-21.055])[1]}" class="city" text-anchor="end">St-Gilles</text>
    <text x="${P([55.70,-20.99])[0]+8}" y="${P([55.70,-20.99])[1]}" class="city" text-anchor="start">St-Benoît</text>
    ${route}
    ${rows.map(m=>{const [x,y]=PT[m.c];return `<circle class="pin" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" style="fill:var(--${m.p})" data-c="${m.c}" tabindex="0"><title>${m.c} · ${esc(m.t)}</title></circle>`}).join("")}
    ${trip.map(([d,c])=>{const [x,y]=PT[c];return `<g class="tp" data-c="${c}"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y+3.5}">${d}</text></g>`}).join("")}
  </svg>
  <p class="sub">Tracé et positions approximatifs. Les pastilles numérotées sont les jours de votre voyage.</p>`;
}
// Liste / Carte
export function setMode(map){$("#segList").setAttribute("aria-pressed",!map);$("#segMap").setAttribute("aria-pressed",map);$("#list").hidden=map;$("#map").hidden=!map;if(map)renderMap(rows)}
export function initMap(){
  document.addEventListener("click",e=>{const p=e.target.closest("#map [data-c]");if(p)openModule(p.dataset.c)});
  $("#segList").onclick=()=>setMode(false);$("#segMap").onclick=()=>setMode(true);
  $("#tripmap").onclick=()=>{switchView("explore");setMode(true)};
}
