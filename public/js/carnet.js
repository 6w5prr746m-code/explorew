/* Carnet : passeport des cirques, mots créoles, coups de cœur. */
import { S, save } from "./state.js";
import { $, esc, col } from "./util.js";
import { offerDesert } from "./theme.js";

const STAMPS=[["cilaos","Cirque de Cilaos","RA"],["salazie","Cirque de Salazie","LA"],["mafate","Cirque de Mafate","EP"],["volcan","Piton de la Fournaise","AV"],["lagon","Lagon","LA"],["table","Table créole","EP"]];
export function renderCarnet(){
  $("#stamps").innerHTML=STAMPS.map(([k,v,p])=>`<button class="stamp ${S.stamps[k]?"on":""}" style="--c:${col(p)}" data-s="${k}" aria-pressed="${!!S.stamps[k]}">${v}</button>`).join("");
  $("#words").innerHTML=S.words.map((w,i)=>`<div><span>${esc(w)}</span><button class="link" data-w="${i}" aria-label="Supprimer">retirer</button></div>`).join("")||`<p class="sub">Un mot par jour, avec qui vous l'a appris.</p>`;
  const hearts=S.days.map((d,i)=>d.coeur?`<div><span><b>J${i+1}</b> · ${esc(d.coeur)}</span></div>`:"").join("");
  $("#hearts").innerHTML=hearts||`<p class="sub">Vos coups de cœur saisis dans « Mon voyage » s'affichent ici.</p>`;
  $("#back").value=S.back||"";
}
export function initCarnet(){
  $("#stamps").onclick=e=>{const b=e.target.closest("[data-s]");if(!b)return;const k=b.dataset.s;S.stamps[k]=!S.stamps[k];save();renderCarnet();if(S.stamps[k])offerDesert()};
  $("#wordform").onsubmit=e=>{e.preventDefault();const v=$("#word").value.trim();if(!v)return;S.words.unshift(v);$("#word").value="";save();renderCarnet()};
  $("#words").onclick=e=>{const b=e.target.closest("[data-w]");if(!b)return;S.words.splice(+b.dataset.w,1);save();renderCarnet()};
  $("#back").oninput=e=>{S.back=e.target.value;save()};
}
