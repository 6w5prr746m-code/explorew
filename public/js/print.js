/* Impression : itinéraire du voyage et Book complet (A5). */
import { PROFILES, PICTOS, SLOTS, MODS, BY, DEST } from "./data.js";
import { S, dayDate } from "./state.js";
import { $, esc, toast } from "./util.js";

function fiche(m){
  const facts=[m.z+(m.l&&m.l!==m.z?" · "+m.l:""),m.d,m.n?"niveau "+m.n:"",m.b,m.f.join(" ")].filter(Boolean).join("  |  ");
  const ref=c=>BY[c]?c+" "+BY[c].t:c;
  return `<article class="bf" style="--c:var(--${m.p})"><div class="bh"><span class="bc">${m.c}</span><h4>${esc(m.t)}</h4></div>
   <p class="bm">${esc(facts)}</p><p>${esc(m.e)}</p>
   ${m.a?`<p><b>Ce qu'on ne vous dit pas.</b> ${esc(m.a)}</p>`:""}
   ${m.pb?`<p><b>Plan B.</b> ${esc(ref(m.pb))}</p>`:""}${m.k?`<p><b>${m.full?"À combiner avec":"Voir aussi"}.</b> ${esc(ref(m.k))}</p>`:""}
   <p class="bn">Fait le ___ / ___ &nbsp;·&nbsp; Ma note ☆☆☆☆☆ &nbsp;·&nbsp; ________________________</p></article>`;
}
export function printBook(){
  const grid=`<section class="bp"><h3>Grille du jour</h3><table class="bg">${["Jour · date","Zone / camp de base","Matin","Après-midi","Soirée","Hébergement","Budget prévu / dépensé","Météo · plan B","Coup de cœur","Notes / ressentis"].map(r=>`<tr><th>${r}</th><td></td></tr>`).join("")}</table></section>`;
  const trip=S.days.some(d=>SLOTS.some(([k])=>d.slots[k].length))?`<section class="bp"><h3>Mon itinéraire · ${S.fmt} jours</h3>${S.days.map((d,i)=>`<p class="bday"><b>J${i+1}${S.start?" · "+dayDate(i):""}</b> — ${SLOTS.map(([k,v])=>v+" : "+(d.slots[k].map(c=>BY[c]?c+" "+BY[c].t:c).join(", ")||"—")).join(" · ")}</p>`).join("")}</section>`:"";
  $("#printout").innerHTML=`<section class="bcover"><p class="bk">Carnet de voyage interactif</p><h1>${DEST.libelles.titreBook}</h1><p>${MODS.length} modules à piocher · 8 profils · formats de 7 à 30 jours</p><p class="bsrc">Source principale : ${DEST.libelles.sourcePrincipale}. Horaires, tarifs et accès à vérifier avant de partir. Édition du ${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}.</p></section>
  <section class="bp"><h3>Mode d'emploi</h3><p>1. Choisissez votre durée. 2. Choisissez un ou deux profils. 3. Piochez les modules et reportez leur code dans la grille du jour. 4. Vérifiez la météo et les réservations.</p><p><b>Niveaux</b> : 1 accessible à tous · 2 bonne condition · 3 sportif. <b>Budget</b> : € jusqu'à 20 € · €€ 20 à 80 € · €€€ plus de 80 € par personne.</p><p><b>Pictos</b> : ${Object.entries(PICTOS).map(([k,v])=>k+" "+v).join(" · ")}.</p><p><b>Règles d'or</b> : un camp de base par zone, les Hauts le matin, le littoral l'après-midi, une journée tampon tous les 4 à 5 jours. Baignade uniquement dans le lagon ou les zones surveillées. Urgences : ${DEST.urgences.map(u=>u.numero).join(", ")}.</p></section>
  ${trip}${grid}
  ${Object.entries(PROFILES).map(([p,name])=>`<section class="bprof"><h2 style="--c:var(--${p})">${name}</h2>${MODS.filter(m=>m.p===p).map(fiche).join("")}</section>`).join("")}
  <section class="bp"><h3>Index des modules</h3><div class="bidx">${MODS.map(m=>`<span><b>${m.c}</b> ${esc(m.t)}</span>`).join("")}</div></section>`;
  document.body.classList.add("book");
}
export function initPrint(){
  $("#print").onclick=()=>{
    $("#printout").innerHTML=`<h1>Carnet Péï · mon voyage de ${S.fmt} jours</h1>`+S.days.map((d,i)=>`<div class="pd"><b>J${i+1}${S.start?" · "+dayDate(i):""}</b><br>${SLOTS.map(([k,v])=>`${v} : ${d.slots[k].map(c=>BY[c]?c+" "+BY[c].t:c).join(", ")||"—"}`).join("<br>")}${d.heb?`<br>Hébergement : ${esc(d.heb)}`:""}${d.bud?` · Budget : ${esc(d.bud)} €`:""}${d.coeur?`<br>Coup de cœur : ${esc(d.coeur)}`:""}${d.notes?`<br>Notes : ${esc(d.notes)}`:""}</div>`).join("");
    try{window.print()}catch(e){toast("Impression indisponible ici")}
  };
  window.addEventListener("afterprint",()=>document.body.classList.remove("book"));
  $("#printbook").onclick=()=>{printBook();try{window.print()}catch(e){toast("Impression indisponible ici")}};
}
