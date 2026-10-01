/* Voyage : grille jour par jour, format, date, budget. */
import { SLOTS, BY } from "./data.js";
import { S, save, touched, blankDay, dayDate } from "./state.js";
import { $, esc, col, toast } from "./util.js";
import { openModule, setPendingSlot } from "./module-sheet.js";
import { renderAll } from "./render.js";
import { renderCarnet } from "./carnet.js";
import { switchView } from "./nav.js";

function resizeDays(n){while(S.days.length<n)S.days.push(blankDay());if(S.days.length>n)S.days.length=n}
export function renderTrip(){
  $("#fmt").value=S.fmt;$("#start").value=S.start||"";
  let placed=0,free=0,bud=0;
  S.days.forEach(d=>{SLOTS.forEach(([k])=>{placed+=d.slots[k].length;if(!d.slots[k].length)free++});bud+=parseFloat(String(d.bud).replace(",","."))||0});
  $("#k-mod").textContent=placed;$("#k-free").textContent=free;$("#k-bud").textContent=Math.round(bud).toLocaleString("fr-FR")+" €";
  $("#exnote").innerHTML=S.example?`<div class="note-ex"><span><b>Exemple</b> : la trame « 7 jours · Ouest, Cilaos & Volcan » du Book. Modifiez-la ou videz-la pour composer la vôtre.</span><button class="btn small" id="exclear">Partir de zéro</button></div>`:"";
  if(S.example)$("#exclear").onclick=()=>$("#reset").click();
  const open=new Set([...document.querySelectorAll("#days details[open]")].map(d=>d.dataset.i));
  $("#days").innerHTML=S.days.map((d,i)=>{
    const codes=SLOTS.flatMap(([k])=>d.slots[k]);
    const zones=[...new Set(codes.map(c=>BY[c]&&BY[c].z).filter(Boolean))];
    const dots=SLOTS.map(([k])=>{const c=d.slots[k][0];return `<i class="${c?"f":""}" style="--c:${c?col(BY[c]?.p||"LA"):"var(--line)"}"></i>`}).join("");
    return `<details class="day" data-i="${i}" ${open.has(String(i))||(!open.size&&i===0)?"open":""}>
      <summary><span class="dnum">J${i+1}</span><span class="dsum"><span class="d">${dayDate(i)||"Jour "+(i+1)}</span><div class="z">${zones.join(" · ")||"À composer"}</div></span><span class="dots">${dots}</span></summary>
      <div class="dbody">
        ${SLOTS.map(([k,v])=>`<div class="slot"><div class="h"><span class="lbl">${v}</span><button class="btn small ghost" data-browse="${i}:${k}">+ Module</button></div>
          ${d.slots[k].map((c,j)=>BY[c]?`<div class="pill" style="--c:${col(BY[c].p)}"><span class="code">${c}</span><button class="t" data-open="${c}">${esc(BY[c].t)}</button><button class="x" data-rm="${i}:${k}:${j}" aria-label="Retirer ${c} ${esc(BY[c].t)} du jour ${i+1}">×</button></div>`:"").join("")}</div>`).join("")}
        <div class="fields">
          <label>Hébergement<input id="heb${i}" data-f="${i}:heb" value="${esc(d.heb)}" placeholder="Gîte, hôtel…"></label>
          <label>Budget du jour (€)<input id="bud${i}" data-f="${i}:bud" inputmode="decimal" value="${esc(d.bud)}" placeholder="0"></label>
          <label class="wide">Coup de cœur du jour<input id="coeur${i}" data-f="${i}:coeur" value="${esc(d.coeur)}" placeholder="Le moment à retenir"></label>
          <label class="wide">Notes / ressentis<textarea id="notes${i}" data-f="${i}:notes" rows="2" placeholder="Rencontre, saveur, mot créole appris…">${esc(d.notes)}</textarea></label>
        </div></div></details>`}).join("");
  const n=placed;const b=$("#tripbadge");b.hidden=!n;b.textContent=n;
}
export function initTrip(){
  $("#fmt").onchange=e=>{const n=+e.target.value;const dropped=S.days.slice(n).some(d=>SLOTS.some(([k])=>d.slots[k].length));if(dropped&&!confirm("Les jours au-delà de J"+n+" contiennent des modules. Les supprimer ?")){e.target.value=S.fmt;return}S.fmt=n;resizeDays(n);touched();renderTrip()};
  $("#start").onchange=e=>{S.start=e.target.value;touched();renderTrip()};
  $("#reset").onclick=()=>{if(!confirm("Vider tous les jours du voyage ?"))return;S.days=S.days.map(()=>blankDay());S.example=false;save();renderAll();toast("Voyage vidé")};
  $("#days").addEventListener("click",e=>{
    const rm=e.target.closest("[data-rm]");if(rm){const[i,k,j]=rm.dataset.rm.split(":");S.days[+i].slots[k].splice(+j,1);touched();renderAll();return}
    const o=e.target.closest("[data-open]");if(o){openModule(o.dataset.open);return}
    const br=e.target.closest("[data-browse]");if(br){const[i,k]=br.dataset.browse.split(":");setPendingSlot({i:+i,k});switchView("explore");toast(`Choisissez un module pour J${+i+1} · ${SLOTS.find(s=>s[0]===k)[1]}`)}
  });
  $("#days").addEventListener("input",e=>{const f=e.target.dataset.f;if(!f)return;const[i,key]=f.split(":");S.days[+i][key]=e.target.value;touched();if(key==="bud"){let bud=0;S.days.forEach(d=>bud+=parseFloat(String(d.bud).replace(",","."))||0);$("#k-bud").textContent=Math.round(bud).toLocaleString("fr-FR")+" €"}if(key==="coeur")renderCarnet()});
}
