/* Carte SVG de la destination (coordonnées approximatives tant que geo est vide).
   Contour, localités, centres de zone, cirques et villes viennent de DEST.carte. */
import { MODS, SLOTS, DEST } from "./data.js";
import { S } from "./state.js";
import { $, esc } from "./util.js";
import { openModule } from "./module-sheet.js";
import { rows } from "./explorer.js";
import { switchView } from "./nav.js";

const C=DEST.carte;
const OUTLINE=C.contour,LOC=C.localites,ZC=C.centresZones;
const W=C.largeur,H=C.hauteur,K=C.echelle,O=C.origine,M=C.marge,RY=C.ratio;
const P=([lo,la])=>[(lo-O[0])*K+M,(la*-1+O[1])*K*RY+M];
function locate(m){if(m.geo)return[m.geo.lng,m.geo.lat];const s=(m.l+" "+m.t);for(const [k,lo,la] of LOC){if(s.includes(k))return[lo,la]}return ZC[m.z]||ZC[C.zoneParDefaut]}
// dispersion légère des points superposés
const PT={};(function(){const seen={};MODS.forEach(m=>{let [x,y]=P(locate(m));const key=Math.round(x/6)+":"+Math.round(y/6);const n=seen[key]=(seen[key]||0)+1;if(n>1){const a=n*2.4,r=5+2.2*Math.sqrt(n);x+=Math.cos(a)*r;y+=Math.sin(a)*r}PT[m.c]=[x,y]})})();
const coast=(()=>{const pts=OUTLINE.map(P),n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],f=v=>v.map(x=>x.toFixed(1)).join(",");let d="M"+f(mid(pts[n-1],pts[0]));for(let i=0;i<n;i++)d+="Q"+f(pts[i])+" "+f(mid(pts[i],pts[(i+1)%n]));return d+"Z"})();
function circle(c,r,label,dy){const [x,y]=P(c);return `<circle cx="${x}" cy="${y}" r="${r}" class="mz"/><text x="${x}" y="${y+dy}" class="ml">${label}</text>`}
const cirques=()=>C.cirques.map(z=>circle(z.centre,z.rayon,z.nom,z.dy)).join("");
const villes=()=>C.villes.map(v=>{const [x,y]=P(v.pos);return `<text x="${x+v.dx}" y="${y+v.dy}" class="city"${v.ancre?` text-anchor="${v.ancre}"`:""}>${v.nom}</text>`}).join("\n    ");

export function renderMap(rows){
  const el=$("#map");if(!el||el.hidden)return;
  const trip=[];S.days.forEach((d,i)=>SLOTS.forEach(([k])=>d.slots[k].forEach(c=>{if(PT[c])trip.push([i+1,c])})));
  const route=trip.length>1?`<polyline class="route" points="${trip.map(([,c])=>PT[c].join(",")).join(" ")}"/>`:"";
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="group" aria-label="${DEST.libelles.carte} avec ${rows.length} modules">
    <g aria-hidden="true"><defs><pattern id="sea" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7q3.5-3 7 0t7 0" class="wave"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#sea)"/>
    <path d="${coast}" class="land"/>
    ${cirques()}
    ${villes()}
    ${route}</g>
    ${rows.map(m=>{const [x,y]=PT[m.c];return `<circle class="pin" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" style="fill:var(--${m.p})" data-c="${m.c}" tabindex="0" role="button" aria-label="${m.c} · ${esc(m.t)}"><title>${m.c} · ${esc(m.t)}</title></circle>`}).join("")}
    ${trip.map(([d,c])=>{const [x,y]=PT[c];return `<g class="tp" data-c="${c}" aria-hidden="true"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y+3.5}">${d}</text></g>`}).join("")}
  </svg>
  <p class="sub">Tracé et positions approximatifs. Les pastilles numérotées sont les jours de votre voyage.</p>`;
}
// Liste / Carte
export function setMode(map){$("#segList").setAttribute("aria-pressed",!map);$("#segMap").setAttribute("aria-pressed",map);$("#list").hidden=map;$("#map").hidden=!map;if(map)renderMap(rows)}
export function initMap(){
  document.addEventListener("click",e=>{const p=e.target.closest("#map [data-c]");if(p)openModule(p.dataset.c)});
  // Points de la carte au clavier : Entrée et Espace ouvrent la fiche, comme un bouton.
  document.addEventListener("keydown",e=>{if(e.key!=="Enter"&&e.key!==" ")return;const p=e.target.closest?.("#map .pin[data-c]");if(!p)return;e.preventDefault();openModule(p.dataset.c)});
  $("#segList").onclick=()=>setMode(false);$("#segMap").onclick=()=>setMode(true);
  $("#tripmap").onclick=()=>{switchView("explore");setMode(true)};
}
