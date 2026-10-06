/* Bilan d'équilibre du voyage (onglet Voyage) : conseils neutres tirés des règles d'or du Book.
   Aucun chiffre inventé (ni temps de trajet, ni distance), aucun score : seulement des constats sur la grille
   et le rappel de la règle d'or concernée. Le bilan vit dans #v-trip, masqué à l'impression (Book, carte postale). */
import { SLOTS, BY } from "./data.js";
import { S, save } from "./state.js";
import { $, esc } from "./util.js";

// Même texte que les règles d’or du Book (print.js), à garder identique.
export const REGLES_OR="un camp de base par zone, les Hauts le matin, le littoral l'après-midi, une journée tampon tous les 4 à 5 jours";
const REGLE_CAMP="Règle d'or du Book : un camp de base par zone.";
const REGLE_TAMPON="Règle d'or du Book : une journée tampon tous les 4 à 5 jours.";
// Au-delà de ce nombre de jours occupés d'affilée, la règle « une journée tampon tous les 4 à 5 jours » n'est plus suivie.
const TAMPON_MAX=5;
// Zone qui n'est pas un lieu : elle ne compte ni comme changement de zone ni comme mélange.
const ZONE_HORS="Toute l'île";
const DEMI=["m","a"];
const MOMENT={a:"l'après-midi",s:"le soir"};
const NOMBRES=["zéro","une","deux","trois","quatre","cinq","six","sept","huit","neuf","dix"];
const fois=n=>(n<NOMBRES.length?NOMBRES[n]:String(n))+" fois";
const nb=n=>n<NOMBRES.length?NOMBRES[n]:String(n);

// « Jour 3 », « Jour 3 et jour 4 », « Jours 2, 5 et 6 » (indices à partir de 0).
export function joursTexte(idx){
  const n=idx.map(i=>i+1);
  if(n.length===1)return "Jour "+n[0];
  if(n.length===2)return `Jour ${n[0]} et jour ${n[1]}`;
  return "Jours "+n.slice(0,-1).join(", ")+" et "+n[n.length-1];
}
// Module « journée » (code en -J ou durée « Journée ») : il occupe aussi l'après-midi.
const journee=m=>/-J\d/.test(m.c)||/^Journée/i.test(m.d||"");
const plusieursJours=m=>/jours/i.test(m.d||"");

/* Calcul pur : à partir des jours ({slots:{m,a,s}}) et de l'index des modules (code → {c,t,z,d,pb,p}),
   renvoie { vide, points:[{type,jours,texte}], marge:{jours,texte}|null }.
   points : doublon, zone-jour, zone-suite, tampon, planb, aube. marge : jours sans module et demi-journées libres. */
export function calculerBilan(days,by=BY){
  const jours=days.map(d=>{
    const slot=k=>((d.slots&&d.slots[k])||[]).filter(c=>by[c]);
    const codes=SLOTS.flatMap(([k])=>slot(k));
    const mods=codes.map(c=>by[c]);
    const parJour=DEMI.some(k=>slot(k).some(c=>journee(by[c])));
    const demiLibres=DEMI.filter(k=>!slot(k).length&&!(k==="a"&&parJour));
    const zones=[...new Set(mods.map(m=>m.z).filter(z=>z&&z!==ZONE_HORS))];
    const tard=["a","s"].flatMap(k=>slot(k).map(c=>({c,k})));
    return {codes,mods,zones,demiLibres,tard,occupe:codes.length>0,enJournee:DEMI.some(k=>slot(k).length>0)};
  });
  const points=[];
  if(!jours.some(j=>j.occupe))return {vide:true,points,marge:null};

  // Doublons : un même module placé plusieurs fois (sauf module de plusieurs jours sur des jours qui se suivent).
  const ou={};
  jours.forEach((j,i)=>j.codes.forEach(c=>(ou[c]=ou[c]||[]).push(i)));
  for(const [c,idx] of Object.entries(ou)){
    if(idx.length<2)continue;
    const distincts=[...new Set(idx)];
    const suite=distincts.length===idx.length&&distincts.every((x,k)=>!k||x===distincts[k-1]+1);
    if(plusieursJours(by[c])&&suite)continue;
    const ou2=distincts.length===1?`${nb(idx.length)} créneaux du jour ${distincts[0]+1}`:joursTexte(distincts).replace(/^J/,"j");
    points.push({type:"doublon",jours:distincts,texte:`${c} ${by[c].t} figure ${fois(idx.length)} dans le voyage : ${ou2}. À garder si c'est voulu.`});
  }

  // Changements de zone : plusieurs zones le même jour, ou zone différente d'un jour occupé au suivant.
  jours.forEach((j,i)=>{
    if(j.zones.length>1)points.push({type:"zone-jour",jours:[i],texte:`Jour ${i+1} : ${nb(j.zones.length)} zones dans la même journée (${j.zones.join(", ")}). ${REGLE_CAMP}`});
  });
  for(let i=1;i<jours.length;i++){
    const a=jours[i-1],b=jours[i];
    if(!a.zones.length||!b.zones.length)continue;
    if(a.zones.some(z=>b.zones.includes(z)))continue;
    points.push({type:"zone-suite",jours:[i-1,i],texte:`${joursTexte([i-1,i])} : deux zones différentes (${a.zones.join(", ")}, puis ${b.zones.join(", ")}). ${REGLE_CAMP}`});
  }

  // Journée tampon : plus de TAMPON_MAX jours d'affilée avec un module en journée (matin ou après-midi).
  let debut=-1;
  const finSerie=fin=>{const n=fin-debut;if(debut>=0&&n>TAMPON_MAX)points.push({type:"tampon",jours:[debut,fin-1],texte:`Jours ${debut+1} à ${fin} : ${n} jours d'affilée occupés, sans journée libre. ${REGLE_TAMPON}`});debut=-1};
  jours.forEach((j,i)=>{if(j.enJournee){if(debut<0)debut=i}else finSerie(i)});
  finSerie(jours.length);

  // Plan B : jours occupés dont aucun module n'a de plan B ni n'est du profil Plan B pluie.
  const sansB=jours.map((j,i)=>j.occupe&&!j.mods.some(m=>m.pb||m.p==="PB")?i:-1).filter(i=>i>=0);
  if(sansB.length)points.push({type:"planb",jours:sansB,texte:`${joursTexte(sansB)} : aucun plan B pluie parmi les modules ${sansB.length>1?"de ces jours":"du jour"}. Prévoyez une solution de repli, par exemple un module du profil Plan B pluie.`});

  // Sortie à l'aube (filtre AUBE) placée l'après-midi ou le soir.
  jours.forEach((j,i)=>j.tard.forEach(({c,k})=>{
    if((by[c].f||[]).includes("AUBE"))points.push({type:"aube",jours:[i],texte:`Jour ${i+1} : ${c} ${by[c].t} est prévu ${MOMENT[k]}, alors que c'est une sortie à l'aube.`});
  }));

  // Marge : jours sans module et demi-journées libres, présentés comme de la souplesse.
  const libres=jours.map((j,i)=>j.occupe?-1:i).filter(i=>i>=0);
  const demi=jours.flatMap((j,i)=>j.occupe?j.demiLibres.map(k=>({i,k})):[]);
  let marge=null;
  if(libres.length||demi.length){
    const lib=SLOTS.reduce((o,[k,v])=>(o[k]=v.toLowerCase(),o),{});
    const parts=[];
    if(libres.length)parts.push(`${joursTexte(libres).replace(/^J/,"j")} sans module`);
    if(demi.length)parts.push(`${demi.length>1?nb(demi.length)+" demi-journées libres":"une demi-journée libre"} (${demi.map(x=>`jour ${x.i+1} ${lib[x.k]}`).join(", ")})`);
    marge={jours:[...new Set([...libres,...demi.map(x=>x.i)])].sort((a,b)=>a-b),texte:`De la marge : ${parts.join(" et ")}. De quoi suivre la météo, se reposer ou improviser.`};
  }
  return {vide:false,points,marge};
}

const replie=()=>typeof S.bilanReplie==="boolean"?S.bilanReplie:!!S.example;
const liens=idx=>idx.length?`<span class="bilan-j">${idx.map(i=>`<button type="button" class="btn small" data-bilan-jour="${i}" aria-label="Voir le jour ${i+1}">J${i+1}</button>`).join("")}</span>`:"";

export function renderBilan(){
  const box=$("#bilan");if(!box)return;
  const b=calculerBilan(S.days);
  const ferme=replie();
  const tog=$("#bilan-tog"),body=$("#bilan-body");
  tog.setAttribute("aria-expanded",String(!ferme));
  tog.textContent=ferme?"Afficher":"Replier";
  body.hidden=ferme;
  box.classList.toggle("ex",!!S.example);
  let html="";
  if(S.example)html+=`<p class="sub">Bilan de la trame d'exemple.</p>`;
  if(b.vide)html+=`<p class="bilan-neutre">Placez des modules dans la grille : le bilan du voyage s'affichera ici.</p>`;
  else{
    html+=b.points.length?`<ul class="bilan-l">${b.points.map(p=>`<li class="bilan-pt" data-type="${p.type}"><p>${esc(p.texte)}</p>${liens(p.type==="tampon"?[p.jours[0]]:p.jours)}</li>`).join("")}</ul>`
      :`<p class="bilan-neutre">Rien à signaler : la grille suit les règles d'or du Book.</p>`;
    if(b.marge)html+=`<div class="bilan-marge"><p>${esc(b.marge.texte)}</p>${liens(b.marge.jours)}</div>`;
  }
  html+=`<p class="sub bilan-regles">Règles d'or du Book : ${REGLES_OR}.</p>`;
  body.innerHTML=html;
}

// Ouvre le jour demandé dans la grille et y amène le focus.
function allerAuJour(i){
  const d=document.querySelector(`#days details[data-i="${i}"]`);if(!d)return;
  d.open=true;
  const s=d.querySelector("summary");
  d.scrollIntoView({block:"start",behavior:"smooth"});
  if(s)s.focus({preventScroll:true});
}

export function initBilan(){
  const box=$("#bilan");if(!box)return;
  $("#bilan-tog").addEventListener("click",()=>{S.bilanReplie=!replie();save();renderBilan()});
  $("#bilan-body").addEventListener("click",e=>{const b=e.target.closest("[data-bilan-jour]");if(b)allerAuJour(+b.dataset.bilanJour)});
}
