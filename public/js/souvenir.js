/* Carnet souvenir (récit de fin de voyage imprimable, A5) et « Je reviens pour… » en liste de modules (S.back2).
   Le carnet souvenir ne contient que les données du voyageur et les libellés de l'app : aucun texte ajouté. */
import { SLOTS, BY, DEST } from "./data.js";
import { S, save, blankDay } from "./state.js";
import { $, esc, col, toast } from "./util.js";
import { openModule } from "./module-sheet.js";
import { renderAll } from "./render.js";
import { switchView } from "./nav.js";
import { doneByZone, shortDate } from "./passeport.js";

// ---------- dates ----------
// Date ISO (AAAA-MM-JJ) du jour i du séjour, ou "" sans date d'arrivée.
export function dayISO(i){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(S.start||""))return"";
  const d=new Date(S.start+"T12:00:00Z");d.setUTCDate(d.getUTCDate()+i);return d.toISOString().slice(0,10);
}
const fmtDate=(iso,o)=>new Date(iso+"T12:00:00Z").toLocaleDateString("fr-FR",{...o,timeZone:"UTC"});
const longDay=iso=>fmtDate(iso,{weekday:"long",day:"numeric",month:"long"});
const fullDate=iso=>fmtDate(iso,{day:"numeric",month:"long",year:"numeric"});

// ---------- « Je reviens pour… » ----------
// Ne garde que des codes de modules existants, sans doublon (état chargé ou sauvegarde restaurée).
export function cleanBack2(a){return Array.isArray(a)?[...new Set(a.filter(c=>typeof c==="string"&&BY[c]))]:[]}

export function backBtn(code){
  if(!BY[code])return"";
  return `<button class="btn back2-btn" data-back2="${code}" aria-pressed="${S.back2.includes(code)}">Je reviens pour ça</button>`;
}

export function toggleBack2(code){
  if(!BY[code])return;
  const i=S.back2.indexOf(code);
  if(i<0)S.back2.push(code);else S.back2.splice(i,1);
  save();
}

export function renderSouvenir(){
  const box=$("#back2");if(!box)return;
  const list=S.back2.filter(c=>BY[c]);
  box.innerHTML=list.length?list.map(c=>`<div class="b2"><button class="b2-open" data-open="${c}" style="--c:${col(BY[c].p)}"><span class="code">${c}</span><span>${esc(BY[c].t)}</span></button><button class="link b2-rm" data-back2-rm="${c}" aria-label="Retirer ${c} de « Je reviens pour… »">retirer</button></div>`).join("")
    :`<p class="sub">Touchez « Je reviens pour ça » sur une fiche pour l'ajouter ici.</p>`;
  $("#nexttrip").hidden=!list.length;
}

// Formats proposés par le sélecteur de durée du voyage (7, 10, 15… jours).
const formats=()=>[...$("#fmt").options].map(o=>+o.value).sort((a,b)=>a-b);

// Nouveau voyage vide rempli avec la liste : un module par demi-journée (matin puis après-midi de chaque jour),
// dans le plus petit format qui les contient. Carnet, tampons, mots, check-list, destination et thème sont gardés.
export function prepareNextTrip(){
  const list=S.back2.filter(c=>BY[c]);if(!list.length)return false;
  if(!confirm(`Préparer un nouveau voyage avec les ${list.length} module${list.length>1?"s":""} de « Je reviens pour… » ?\n\nVotre voyage actuel sera remplacé. Pensez à exporter vos données avant.`))return false;
  const fm=formats(),max=fm[fm.length-1];
  const fmt=fm.find(n=>n*2>=list.length)||max;
  const days=Array.from({length:fmt},()=>blankDay());
  const placed=list.slice(0,fmt*2);
  placed.forEach((c,j)=>days[Math.floor(j/2)].slots[j%2?"a":"m"].push(c));
  S.fmt=fmt;S.start="";S.example=false;S.days=days;
  // Au-delà de la capacité du plus long format, les modules restants restent dans la liste.
  S.back2=list.slice(placed.length);
  save();renderAll();switchView("trip");
  toast("Nouveau voyage préparé");
  return true;
}

// ---------- carnet souvenir ----------
const mod=c=>`<li><span class="sv-code">${c}</span> ${esc(BY[c].t)}</li>`;
const seal=(m,d)=>`<li><span class="sv-seal">${m.c}</span><span class="sv-tt"><b>${esc(m.t)}</b>${d?`<span class="sv-date">Tampon du ${shortDate(d)}</span>`:""}</span></li>`;
const field=(lbl,v)=>v&&v.trim()?`<div class="sv-field"><p class="sv-lbl">${lbl}</p><p class="sv-txt">${esc(v.trim())}</p></div>`:"";

function dayPage(d,i){
  const iso=dayISO(i);
  const slots=SLOTS.map(([k,v])=>[v,d.slots[k].filter(c=>BY[c])]).filter(([,l])=>l.length);
  const done=iso?Object.entries(S.done).filter(([c,x])=>x===iso&&BY[c]).map(([c])=>BY[c]).sort((a,b)=>a.c.localeCompare(b.c)):[];
  const txt=["coeur","notes","heb"].some(f=>(d[f]||"").trim());
  if(!slots.length&&!done.length&&!txt)return"";
  return `<section class="sv-page sv-day" data-day="${i+1}"><p class="sv-k">Jour ${i+1}</p><h2>${iso?longDay(iso):"Jour "+(i+1)}</h2>
    ${slots.map(([v,l])=>`<div class="sv-field"><p class="sv-lbl">${v}</p><ul class="sv-mods">${l.map(mod).join("")}</ul></div>`).join("")}
    ${done.length?`<div class="sv-field"><p class="sv-lbl">Fait</p><ul class="sv-seals">${done.map(m=>seal(m)).join("")}</ul></div>`:""}
    ${field("Coup de cœur du jour",d.coeur)}${field("Notes / ressentis",d.notes)}${field("Hébergement",d.heb)}</section>`;
}

export function buildSouvenir(){
  const n=S.days.length,first=dayISO(0),last=dayISO(n-1);
  const cover=`<section class="sv-cover"><p class="sv-k">Carnet souvenir</p><h1>Mon voyage à ${esc(DEST.nom)}</h1>
    ${first?`<p class="sv-dates">Du ${fullDate(first)} au ${fullDate(last)}</p>`:""}<p class="sv-len">${n} jours</p></section>`;
  const days=S.days.map(dayPage).join("");
  const groups=doneByZone();
  const tampons=groups.length?`<section class="sv-page sv-tampons"><h2>Mes tampons</h2>${groups.map(([z,items])=>`<div class="sv-field"><p class="sv-lbl">${esc(z)}</p><ul class="sv-seals">${items.map(({m,d})=>seal(m,d)).join("")}</ul></div>`).join("")}</section>`:"";
  const words=S.words.filter(w=>typeof w==="string"&&w.trim());
  const mots=words.length?`<section class="sv-page sv-mots"><h2>Mes mots créoles</h2><ul class="sv-words">${words.map(w=>`<li>${esc(w)}</li>`).join("")}</ul></section>`:"";
  const back=S.back2.filter(c=>BY[c]);
  const reviens=back.length||(S.back||"").trim()?`<section class="sv-page sv-back"><h2>Je reviens pour…</h2>${back.length?`<ul class="sv-mods">${back.map(mod).join("")}</ul>`:""}${(S.back||"").trim()?`<p class="sv-txt">${esc(S.back.trim())}</p>`:""}</section>`:"";
  $("#printout").innerHTML=cover+days+tampons+mots+reviens;
  document.body.classList.remove("book");
  document.body.classList.add("souvenir");
}

export function printSouvenir(){buildSouvenir();try{window.print()}catch(e){toast("Impression indisponible ici")}}

export function initSouvenir(){
  $("#printsouvenir").onclick=printSouvenir;
  window.addEventListener("afterprint",()=>document.body.classList.remove("souvenir"));
  // Bascule sur la fiche : mise à jour sur place, le focus reste sur le bouton.
  document.addEventListener("click",e=>{
    const b=e.target.closest("[data-back2]");if(!b)return;
    const code=b.dataset.back2;toggleBack2(code);
    document.querySelectorAll(`[data-back2="${code}"]`).forEach(x=>x.setAttribute("aria-pressed",S.back2.includes(code)));
    renderSouvenir();
  });
  $("#back2").addEventListener("click",e=>{
    const rm=e.target.closest("[data-back2-rm]");
    if(rm){const i=S.back2.indexOf(rm.dataset.back2Rm);if(i>=0){S.back2.splice(i,1);save()}renderSouvenir();$("#back2 .b2-open, #back")?.focus();return}
    const o=e.target.closest("[data-open]");if(o)openModule(o.dataset.open);
  });
  $("#nexttrip").onclick=prepareNextTrip;
}
