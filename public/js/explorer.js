/* Explorer : filtres, recherche et liste des modules. */
import { PROFILES, ZONES, PICTOS, MODS } from "./data.js";
import { inTrip } from "./state.js";
import { $, esc, col, norm } from "./util.js";
import { openModule } from "./module-sheet.js";
import { renderMap } from "./map.js";

// Dernière sélection affichée (partagée avec la carte)
export let rows=MODS;
const F={q:"",p:"",z:"",n:"",pic:new Set()};
export function buildFilters(){
  const pr=$("#profiles");
  pr.innerHTML=`<button class="chip" aria-pressed="true" data-p="">Tous</button>`+Object.entries(PROFILES).map(([k,v])=>`<button class="chip" style="--c:${col(k)}" aria-pressed="false" data-p="${k}"><span class="dot"></span>${v}</button>`).join("");
  pr.onclick=e=>{const b=e.target.closest("button");if(!b)return;F.p=b.dataset.p;pr.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderList()};
  $("#zone").innerHTML=`<option value="">Toutes zones</option>`+ZONES.map(z=>`<option>${z}</option>`).join("");
  $("#zone").onchange=e=>{F.z=e.target.value;renderList()};
  $("#niveau").onchange=e=>{F.n=e.target.value;renderList()};
  $("#pictos").innerHTML=Object.entries(PICTOS).map(([k,v])=>`<button class="picto" aria-pressed="false" data-k="${k}" title="${v}">${k}</button>`).join("");
  $("#pictos").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset.k;F.pic.has(k)?F.pic.delete(k):F.pic.add(k);b.setAttribute("aria-pressed",F.pic.has(k));renderList()};
  $("#q").oninput=e=>{F.q=e.target.value.trim().toLowerCase();renderList()};
}
export function renderList(){
  const q=norm(F.q);
  rows=MODS.filter(m=>(!F.p||m.p===F.p)&&(!F.z||m.z===F.z)&&(!F.n||m.n==F.n)&&[...F.pic].every(k=>m.f.includes(k))&&(!q||norm(m.c+" "+m.t+" "+m.l+" "+m.e+" "+m.z).includes(q)));
  renderMap(rows);
  $("#count").textContent=rows.length+(rows.length>1?" modules":" module")+(F.p?" · "+PROFILES[F.p]:"");
  $("#list").innerHTML=rows.length?rows.map(m=>{
    const meta=[m.z!==m.l?m.l:m.z,m.d,m.n?"niv. "+m.n:"",m.b].filter(Boolean).join(" · ");
    return `<div class="card" style="--c:${col(m.p)}" data-c="${m.c}">
      <div><span class="code">${m.c}</span><h3><button class="open" data-c="${m.c}">${esc(m.t)}</button></h3><div class="meta">${esc(meta)}</div>${m.f.length?`<div class="tags">${m.f.map(f=>`<span class="tag">${esc(f)}</span>`).join("")}</div>`:""}</div>
      <button class="add ${inTrip(m.c)?"on":""}" data-add="${m.c}" aria-label="${inTrip(m.c)?"Déjà dans mon voyage":"Ajouter à mon voyage"}">${inTrip(m.c)?"✓":"+"}</button></div>`}).join(""):`<div class="empty">Aucun module ne correspond. Retirez un filtre.</div>`;
}
export function initExplorer(){
  $("#list").addEventListener("click",e=>{const a=e.target.closest("[data-add]");if(a){openModule(a.dataset.add,true);return}const c=e.target.closest(".card");if(c)openModule(c.dataset.c)});
    buildFilters();
}
