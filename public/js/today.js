/* Aujourd'hui : pendant le séjour, le jour en cours en haut de l'onglet Voyage, avec les réflexes du jour et une bascule Plan B pluie. */
import { SLOTS, BY, MODS, DEST } from "./data.js";
import { S, touched } from "./state.js";
import { $, esc, col } from "./util.js";
import { openModule } from "./module-sheet.js";
import { renderAll } from "./render.js";
import { switchView } from "./nav.js";
import { doneBlock } from "./passeport.js";

const PB_MAX=3;
// Zone des modules valables partout (repli quand aucun module PB n'existe dans la zone du créneau).
const PARTOUT="Toute l'île";
let rain=false; // bascule Plan B : jamais sauvegardée

// Date du jour (AAAA-MM-JJ) dans le fuseau de la destination, pas dans celui du téléphone.
export function todayISO(now=new Date()){
  const p=Object.fromEntries(new Intl.DateTimeFormat("en-CA",{timeZone:DEST.fuseau,year:"numeric",month:"2-digit",day:"2-digit"}).formatToParts(now).map(x=>[x.type,x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}
const utcDay=iso=>Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10))/864e5;
// Index du jour en cours (0 = arrivée), ou -1 hors séjour.
export function todayIndex(){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(S.start||""))return -1;
  const i=utcDay(todayISO())-utcDay(S.start);
  return i>=0&&i<S.days.length?i:-1;
}
function longDate(iso){return new Date(iso+"T12:00:00Z").toLocaleDateString("fr-FR",{weekday:"long",day:"numeric",month:"long",timeZone:"UTC"})}

// Repli pluie d'un module : son planB s'il existe, sinon des modules PB de la même zone, à défaut de toute l'île.
export function planBFor(m,zone,exclude=[]){
  if(m&&m.pb&&BY[m.pb])return[BY[m.pb]];
  const z=m?m.z:zone,skip=new Set([...(m?[m.c]:[]),...exclude]);
  const pb=MODS.filter(x=>x.p==="PB"&&!skip.has(x.c));
  const same=z?pb.filter(x=>x.z===z):[];
  if(same.length)return same.slice(0,PB_MAX);
  return[...pb.filter(x=>x.z===PARTOUT),...pb.filter(x=>x.z!==PARTOUT)].slice(0,PB_MAX);
}

// Les réflexes sont ceux de l'onglet Pratique, repris tels quels depuis le DOM.
function reflexes(){const p=$("#reflexes");return p?[...p.querySelectorAll(".check")].map(n=>n.outerHTML).join(""):""}

function modBtn(c){const m=BY[c];return `<button class="tmod" data-open="${c}" style="--c:${col(m.p)}"><span class="code">${c}</span><span class="t">${esc(m.t)}</span></button>`}
function altRow(alt,action,label){return `<div class="talt" style="--c:${col(alt.p)}"><button class="tmod" data-open="${alt.c}"><span class="code">${alt.c}</span><span class="t">${esc(alt.t)}</span></button><button class="btn small" ${action}>${label}</button></div>`}

export function renderToday(){
  const box=$("#today");if(!box)return;
  const i=todayIndex();
  if(i<0){box.hidden=true;box.innerHTML="";return}
  const d=S.days[i],iso=todayISO();
  const codes=SLOTS.flatMap(([k])=>d.slots[k]).filter(c=>BY[c]);
  const dayZone=codes.length?BY[codes[0]].z:null;
  box.hidden=false;
  box.innerHTML=`<div class="thead"><h3 id="today-h">Aujourd'hui · J${i+1} · ${longDate(iso)}</h3>
    <button class="btn rain" id="today-rain" aria-pressed="${rain}">Il pleut ? Plan B</button></div>
    ${SLOTS.map(([k,v])=>{
      const list=d.slots[k].map((c,j)=>[c,j]).filter(([c])=>BY[c]);
      const body=list.length?list.map(([c,j])=>`${modBtn(c)}${doneBlock(c,true)}${rain?`<div class="tpb"><span class="lbl">Plan B pour ${c}</span>${planBFor(BY[c],null,codes).map(a=>altRow(a,`data-swap="${k}:${j}:${a.c}"`,"Remplacer")).join("")}</div>`:""}`).join("")
        :`<p class="tempty">Créneau libre</p>${rain?`<div class="tpb"><span class="lbl">Plan B pluie</span>${planBFor(null,dayZone,codes).map(a=>altRow(a,`data-put="${k}:${a.c}"`,"Ajouter")).join("")}</div>`:""}`;
      return `<div class="tslot" data-slot="${k}"><span class="lbl">${v}</span>${body}</div>`}).join("")}
    <button class="btn ghost tfull" id="today-full">Voir la journée complète</button>
    <div class="treflex"><h4>Les réflexes du jour</h4>${reflexes()}</div>`;
}

export function initToday(){
  const box=$("#today");if(!box)return;
  box.setAttribute("aria-labelledby","today-h");
  box.addEventListener("click",e=>{
    const i=todayIndex();if(i<0)return;
    if(e.target.closest("#today-rain")){rain=!rain;renderToday();$("#today-rain").focus();return}
    const sw=e.target.closest("[data-swap]");
    if(sw){const[k,j,c]=sw.dataset.swap.split(":");S.days[i].slots[k].splice(+j,1,c);touched();renderAll();return}
    const put=e.target.closest("[data-put]");
    if(put){const[k,c]=put.dataset.put.split(":");S.days[i].slots[k].push(c);touched();renderAll();return}
    const o=e.target.closest("[data-open]");if(o){openModule(o.dataset.open);return}
    if(e.target.closest("#today-full")){const det=document.querySelector(`#days details[data-i="${i}"]`);if(det){det.open=true;det.scrollIntoView({block:"start"});det.querySelector("summary").focus()}}
  });
  // Pendant le séjour, l'app s'ouvre sur le voyage.
  if(todayIndex()>=0)switchView("trip");
  // Le jour peut changer pendant que l'app reste ouverte.
  document.addEventListener("visibilitychange",()=>{if(!document.hidden)renderToday()});
}
