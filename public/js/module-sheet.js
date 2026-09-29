/* Fiche module : feuille de détail et ajout au voyage. */
import { PROFILES, PICTOS, SLOTS, BY } from "./data.js";
import { S, touched, dayDate } from "./state.js";
import { $, esc, col, toast, niveau } from "./util.js";
import { banner } from "./visuals.js";
import { renderAll } from "./render.js";
import { doneBlock } from "./passeport.js";

export const dlg=$("#dlg");
// Créneau choisi depuis « + Module » dans le voyage, appliqué à la prochaine fiche ouverte
let pendingSlot=null;
export function setPendingSlot(p){pendingSlot=p}
function refLink(code){return BY[code]?`<button class="link" data-open="${code}">${code} · ${esc(BY[code].t)}</button>`:esc(code)}
function renderSheet(code,focusAdd){
  const m=BY[code];if(!m)return;
  const facts=[["Zone",m.z],["Lieu",m.l],m.d&&["Durée",m.d],m.n&&["Niveau",m.n+" · "+niveau(m.n)],m.b&&["Budget",m.b]].filter(Boolean);
  const dayOpts=S.days.map((d,i)=>`<option value="${i}">J${i+1}${S.start?" · "+dayDate(i):""}</option>`).join("");
  $("#sheet").innerHTML=`<div class="grab"></div>${banner(m)}
    <span class="code" style="--c:${col(m.p)}">${m.c} · ${PROFILES[m.p]}</span>
    <h2>${esc(m.t)}</h2>
    <p style="margin:0">${esc(m.e)}</p>
    <div class="facts">${facts.map(([k,v])=>`<div class="fact"><span class="lbl">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>
    ${m.f.length?`<div class="tags" style="margin-bottom:6px">${m.f.map(f=>`<span class="tag">${esc(f)} · ${PICTOS[f]||""}</span>`).join("")}</div>`:""}
    <div class="block">${doneBlock(code)}</div>
    ${m.a?`<div class="block"><span class="lbl">Ce qu'on ne vous dit pas</span><p>${esc(m.a)}</p></div>`:""}
    ${m.pb?`<div class="block"><span class="lbl">Plan B</span><p>${refLink(m.pb)}</p></div>`:""}
    ${m.k?`<div class="block"><span class="lbl">${m.full?"À combiner avec":"Fiche détaillée"}</span><p>${refLink(m.k)}</p></div>`:""}
    <div class="block" id="pick"><span class="lbl">Ajouter à mon voyage</span>
      <div class="picker"><div class="row"><select id="pday" aria-label="Jour">${dayOpts}</select><select id="pslot" aria-label="Créneau">${SLOTS.map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="row"><button class="btn primary" id="padd">Ajouter</button><button class="btn ghost" id="pclose">Fermer</button></div></div></div>`;
  $("#sheet").onclick=e=>{const o=e.target.closest("[data-open]");if(o)openModule(o.dataset.open)};
  $("#padd").onclick=()=>{const i=+$("#pday").value,k=$("#pslot").value;S.days[i].slots[k].push(code);touched();dlg.close();toast(`Ajouté au jour ${i+1}`);renderAll()};
  $("#pclose").onclick=()=>dlg.close();
  if(!dlg.open)dlg.showModal();
  $("#sheet").scrollTop=0;
  if(focusAdd)$("#pick").scrollIntoView({block:"end"});
}
export function openModule(code,focusAdd){renderSheet(code,focusAdd||!!pendingSlot);if(pendingSlot&&$("#pday")){$("#pday").value=pendingSlot.i;$("#pslot").value=pendingSlot.k;pendingSlot=null}}
export function initModuleSheet(){
  dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
}
