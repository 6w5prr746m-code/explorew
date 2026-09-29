/* Passeport étendu : bouton « Fait » sur chaque module (fiche et vue « Aujourd'hui »), qui pose un tampon daté (S.done[code] = AAAA-MM-JJ),
   et section « Mes tampons » du Carnet. Le tampon récompense l'expérience vécue : aucun compte, score, série ni heure. */
import { BY, DEST } from "./data.js";
import { S, save } from "./state.js";
import { $, esc, col, norm } from "./util.js";
import { todayISO } from "./today.js";
import { openModule } from "./module-sheet.js";

export const ISO_DATE=/^\d{4}-\d{2}-\d{2}$/;
const valid=iso=>ISO_DATE.test(iso)&&!isNaN(Date.parse(iso+"T12:00:00Z"))&&new Date(iso+"T12:00:00Z").toISOString().slice(0,10)===iso;

// Ne garde que des codes de modules existants et des dates valides (restauration d'une sauvegarde).
export function cleanDone(o){
  const out={};
  if(!o||typeof o!=="object"||Array.isArray(o))return out;
  for(const [c,d] of Object.entries(o))if(BY[c]&&typeof d==="string"&&valid(d))out[c]=d;
  return out;
}

export function shortDate(iso){return new Date(iso+"T12:00:00Z").toLocaleDateString("fr-FR",{day:"numeric",month:"short",year:"numeric",timeZone:"UTC"})}

// Rappels de sécurité : repris mot pour mot des réflexes de l'onglet Pratique (#reflexes), jamais réécrits ici.
function reflex(start){const n=[...document.querySelectorAll("#reflexes .check")].find(x=>x.querySelector("b")?.textContent.trim().startsWith(start));return n?n.outerHTML:""}
export function safetyFor(m){
  const t=norm([m.t,m.l,m.e,m.a].filter(Boolean).join(" "));
  const walk=m.z==="Volcan"||m.p==="RA"||m.p==="AV"||/sentier|volcan/.test(t);
  // Activités d'eau (mer, lagon, rivière, bassin, canyon). Mieux vaut un rappel de trop qu'un rappel manquant ;
  // les noms propres sans activité d'eau (distilleries, Beaubassin) sont écartés. À remplacer par un champ de données.
  const eau=/baign|\bnag|snorkel|plongee|palmes|tuba|kayak|paddle|\bsurf|canyon|bassin|cascade|ravine|piscine naturelle|sentier sous-marin|plage|riviere|lagon/;
  const swim=eau.test(t)&&!(/distillerie|beaubassin/.test(t)&&!/baign/.test(t));
  return (walk?reflex("Avant de marcher"):"")+(swim?reflex("Baignade"):"");
}

// Bloc « Fait » : bouton bascule, date du tampon, rappel de sécurité éventuel.
export function doneBlock(code,compact){
  const m=BY[code];if(!m)return"";
  const d=S.done[code],safe=safetyFor(m);
  return `<div class="done${compact?" compact":""}" data-done-box="${code}" style="--c:${col(m.p)}">
    <div class="done-row"><button class="btn done-btn" data-done="${code}" aria-pressed="${!!d}"${compact?` aria-label="Fait : ${esc(m.t)}"`:""}>Fait</button>${d?`<span class="done-date">Tampon du ${shortDate(d)}</span>`:""}</div>
    ${safe?`<div class="done-safe">${safe}</div>`:""}</div>`;
}

export function toggleDone(code){
  if(!BY[code])return;
  if(S.done[code])delete S.done[code];else S.done[code]=todayISO();
  save();
}

// Mes tampons : groupés par zone (ordre des zones de la destination), puis par date.
export function renderTampons(){
  const box=$("#tampons");if(!box)return;
  const list=Object.entries(S.done).filter(([c])=>BY[c]).map(([c,d])=>({m:BY[c],d}));
  if(!list.length){box.innerHTML=`<p class="sub">Touchez « Fait » sur une fiche quand vous l'avez vécue.</p>`;return}
  list.sort((a,b)=>a.d.localeCompare(b.d)||a.m.c.localeCompare(b.m.c));
  const zones=[...DEST.zones,...new Set(list.map(x=>x.m.z).filter(z=>!DEST.zones.includes(z)))];
  box.innerHTML=zones.map(z=>{
    const items=list.filter(x=>x.m.z===z);if(!items.length)return"";
    return `<section class="tzone"><h4>${esc(z)}</h4><ul>${items.map(({m,d})=>`<li><button class="tampon" data-open="${m.c}" style="--c:${col(m.p)}"><span class="seal">${m.c}</span><span class="tt"><b>${esc(m.t)}</b><span class="td">${shortDate(d)}</span></span></button></li>`).join("")}</ul></section>`;
  }).join("");
}

export function initPasseport(){
  // Un seul écouteur pour la fiche et la vue « Aujourd'hui » : les blocs sont redessinés sur place, le focus reste sur le bouton.
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-done]");if(!b)return;
    const code=b.dataset.done;toggleDone(code);
    document.querySelectorAll(`[data-done-box="${code}"]`).forEach(box=>{
      const had=box.contains(document.activeElement)||box.contains(b);
      const tmp=document.createElement("div");tmp.innerHTML=doneBlock(code,box.classList.contains("compact"));
      const nb=tmp.firstElementChild;box.replaceWith(nb);
      if(had){const btn=nb.querySelector("[data-done]");btn.focus();if(S.done[code])btn.classList.add("stamped")}
    });
    renderTampons();
  });
  $("#tampons").addEventListener("click",e=>{const o=e.target.closest("[data-open]");if(o)openModule(o.dataset.open)});
}
