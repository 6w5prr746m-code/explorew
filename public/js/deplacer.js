/* Déplacer un module placé (onglet Voyage) vers un autre créneau, du même jour ou d'un autre jour.
   - Au pointeur (souris, stylet, doigt) : API Pointer Events native, sans dépendance. Élément fantôme, créneau cible
     mis en évidence, défilement automatique près des bords, annulation par Échap ou en lâchant hors d'un créneau.
   - Alternative accessible (WCAG 2.5.7) : le bouton « Déplacer » de chaque module ouvre un choix Jour / Créneau,
     puis « Déplacer ici ». Le résultat est annoncé dans la région aria-live #deplacer-annonce. */
import { SLOTS, BY } from "./data.js";
import { S, touched, dayDate } from "./state.js";
import { $, esc, toast } from "./util.js";
import { renderAll } from "./render.js";

// Au toucher, un appui long démarre le déplacement : un glissé rapide reste un défilement de la page.
// 300 ms : assez court pour rester naturel, assez long pour ne pas confondre avec un geste de défilement.
const APPUI_LONG_MS=300;
// Au toucher, un mouvement plus grand pendant l'appui long est un défilement : le déplacement n'a pas lieu.
const TOLERANCE_TOUCHER_PX=8;
// À la souris ou au stylet, le déplacement démarre après ce mouvement (en dessous, c'est un simple clic).
const SEUIL_SOURIS_PX=5;
// Distance aux bords (sous l'en-tête, au-dessus des onglets) qui déclenche le défilement automatique, et vitesse maximale.
const BORD_PX=64;
const VITESSE_MAX_PX=10;
// Survoler un jour replié pendant ce délai l'ouvre, pour pouvoir y déposer le module.
const OUVRIR_JOUR_MS=500;

const nomCreneau=k=>(SLOTS.find(s=>s[0]===k)||[,""])[1];
const libelleJour=i=>{const d=dayDate(i);return "Jour "+(i+1)+(d?" · "+d:"")};

// Bouton « Déplacer » d'un module placé (rendu par trip.js dans chaque pastille).
export function boutonDeplacer(i,k,j,code){
  const t=BY[code]?BY[code].t:"";
  return `<button type="button" class="deplacer-btn" data-deplacer="${i}:${k}:${j}" aria-label="Déplacer ${esc(code)} ${esc(t)}" aria-expanded="false" title="Déplacer"><svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.6"/><circle cx="15" cy="6" r="1.6"/><circle cx="9" cy="12" r="1.6"/><circle cx="15" cy="12" r="1.6"/><circle cx="9" cy="18" r="1.6"/><circle cx="15" cy="18" r="1.6"/></svg></button>`;
}

function annoncer(msg){const r=$("#deplacer-annonce");if(!r)return;r.textContent="";setTimeout(()=>{r.textContent=msg},30)}

/* Déplace le module du créneau (i,k) à la position j vers la fin du créneau (ti,tk).
   Renvoie la nouvelle position {i,k,j} ou null si rien n'a changé (même créneau, position introuvable). */
export function deplacerModule(i,k,j,ti,tk){
  const src=S.days[i]&&S.days[i].slots[k];const dst=S.days[ti]&&S.days[ti].slots[tk];
  if(!src||!dst||j<0||j>=src.length)return null;
  if(i===ti&&k===tk)return null;
  const [code]=src.splice(j,1);dst.push(code);
  touched();renderAll();
  const msg=`${code} déplacé au jour ${ti+1} · ${nomCreneau(tk)}`;
  toast(msg);annoncer(msg);
  return {i:ti,k:tk,j:dst.length-1,code};
}

// ---------- alternative accessible : choix Jour / Créneau ----------
function fermerChoix(rendreFocus){
  const c=$("#days .deplacer-choix");if(!c)return;
  const b=$(`#days [data-deplacer="${c.dataset.pos}"]`);
  c.remove();
  if(b){b.setAttribute("aria-expanded","false");if(rendreFocus)b.focus()}
}
function ouvrirChoix(btn){
  const pos=btn.dataset.deplacer;const deja=$("#days .deplacer-choix");
  fermerChoix(false);if(deja&&deja.dataset.pos===pos){btn.focus();return}
  const[i,k,j]=pos.split(":");const code=S.days[+i].slots[k][+j];if(!code)return;
  const id="deplacer-choix";
  const box=document.createElement("div");
  box.className="deplacer-choix";box.id=id;box.dataset.pos=pos;
  box.setAttribute("role","group");box.setAttribute("aria-label",`Déplacer ${code} ${BY[code]?BY[code].t:""}`);
  box.innerHTML=`<label>Jour<select class="dc-jour">${S.days.map((_,n)=>`<option value="${n}"${n===+i?" selected":""}>${esc(libelleJour(n))}</option>`).join("")}</select></label>
    <label>Créneau<select class="dc-creneau">${SLOTS.map(([v,l])=>`<option value="${v}"${v===k?" selected":""}>${l}</option>`).join("")}</select></label>
    <div class="dc-actions"><button type="button" class="btn small primary dc-ok">Déplacer ici</button><button type="button" class="btn small dc-annuler">Annuler</button></div>`;
  btn.closest(".pill").after(box);
  btn.setAttribute("aria-expanded","true");btn.setAttribute("aria-controls",id);
  box.querySelector(".dc-annuler").onclick=()=>fermerChoix(true);
  box.querySelector(".dc-ok").onclick=()=>{
    const ti=+box.querySelector(".dc-jour").value,tk=box.querySelector(".dc-creneau").value;
    if(+i===ti&&k===tk){annoncer(`${code} est déjà au jour ${ti+1} · ${nomCreneau(tk)}`);fermerChoix(true);return}
    const r=deplacerModule(+i,k,+j,ti,tk);if(!r)return;
    const jour=$(`#days details.day[data-i="${r.i}"]`);if(jour)jour.open=true;
    const nb=$(`#days [data-deplacer="${r.i}:${r.k}:${r.j}"]`);if(nb)nb.focus();
  };
  box.addEventListener("keydown",e=>{if(e.key==="Escape"){e.preventDefault();e.stopPropagation();fermerChoix(true)}});
  box.querySelector(".dc-jour").focus();
}

// ---------- glisser-déposer au pointeur ----------
let g=null; // geste en cours : {id,type,pill,pos,x0,y0,x,y,actif,timer,fantome,dx,dy,cible,survol,survolT,raf}
let ignorerClic=false;

function cibleSous(x,y){
  const el=document.elementFromPoint(x,y);
  if(!el||!el.closest("#days"))return {slot:null,sum:null};
  return {slot:el.closest(".slot[data-slot]"),sum:el.closest("details.day:not([open]) > summary")};
}
function majCible(){
  const {slot,sum}=cibleSous(g.x,g.y);
  if(slot!==g.cible){if(g.cible)g.cible.classList.remove("deplacer-cible");g.cible=slot;if(slot)slot.classList.add("deplacer-cible")}
  if(sum!==g.survol){clearTimeout(g.survolT);g.survol=sum;if(sum)g.survolT=setTimeout(()=>{if(g&&g.survol===sum){sum.parentElement.open=true;majCible()}},OUVRIR_JOUR_MS)}
}
// Le fantôme suit le pointeur, sans sortir de l'écran sur les côtés (pas de défilement horizontal à 400 px).
function placerFantome(){const x=Math.max(0,Math.min(g.x-g.dx,innerWidth-g.w));g.fantome.style.transform=`translate(${x}px,${g.y-g.dy}px)`}
function defiler(){
  if(!g||!g.actif)return;
  const haut=($("header.top")?.getBoundingClientRect().bottom||0)+BORD_PX;
  const bas=($("nav.tabs")?.getBoundingClientRect().top||innerHeight)-BORD_PX;
  let v=0;
  if(g.y<haut)v=-Math.ceil(VITESSE_MAX_PX*Math.min(1,(haut-g.y)/BORD_PX));
  else if(g.y>bas)v=Math.ceil(VITESSE_MAX_PX*Math.min(1,(g.y-bas)/BORD_PX));
  if(v){const avant=scrollY;scrollBy(0,v);if(scrollY!==avant)majCible()}
  g.raf=requestAnimationFrame(defiler);
}
function demarrer(){
  clearTimeout(g.timer);g.actif=true;fermerChoix(false);
  const r=g.pill.getBoundingClientRect();g.dx=g.x0-r.left;g.dy=g.y0-r.top;g.w=r.width;
  const f=g.pill.cloneNode(true);
  f.classList.add("deplacer-fantome");f.setAttribute("aria-hidden","true");f.removeAttribute("data-pos");
  f.querySelectorAll("button").forEach(b=>{b.tabIndex=-1;b.removeAttribute("data-deplacer");b.removeAttribute("data-rm");b.removeAttribute("data-open")});
  f.style.width=r.width+"px";f.style.left="0";f.style.top="0";
  document.body.appendChild(f);g.fantome=f;placerFantome();
  g.pill.classList.add("deplacer-source");document.body.classList.add("deplacer-en-cours");
  majCible();g.raf=requestAnimationFrame(defiler);
}
function finir(deposer){
  if(!g)return;const geste=g;g=null;
  clearTimeout(geste.timer);clearTimeout(geste.survolT);cancelAnimationFrame(geste.raf);
  removeEventListener("pointermove",bouge);removeEventListener("pointerup",lache);removeEventListener("pointercancel",annule);
  if(!geste.actif)return;
  // Le clic qui suit le relâchement (titre, bouton Déplacer) ne doit pas ouvrir la fiche ni le choix.
  ignorerClic=true;setTimeout(()=>{ignorerClic=false},0);
  geste.fantome.remove();geste.pill.classList.remove("deplacer-source");document.body.classList.remove("deplacer-en-cours");
  if(geste.cible)geste.cible.classList.remove("deplacer-cible");
  const[i,k,j]=geste.pos.split(":");const code=S.days[+i]?.slots[k]?.[+j];
  if(!deposer||!geste.cible){annoncer("Déplacement annulé");return}
  const[ti,tk]=geste.cible.dataset.slot.split(":");
  if(+i===+ti&&k===tk){annoncer(`${code} reste au jour ${+ti+1} · ${nomCreneau(tk)}`);return}
  deplacerModule(+i,k,+j,+ti,tk);
}
function bouge(e){
  if(!g||e.pointerId!==g.id)return;
  g.x=e.clientX;g.y=e.clientY;const d=Math.hypot(g.x-g.x0,g.y-g.y0);
  if(!g.actif){
    if(g.type==="touch"){if(d>TOLERANCE_TOUCHER_PX)finir(false);return}
    if(d<SEUIL_SOURIS_PX)return;
    demarrer();
  }
  e.preventDefault();placerFantome();majCible();
}
function lache(e){if(g&&e.pointerId===g.id)finir(true)}
function annule(e){if(g&&e.pointerId===g.id)finir(false)}

function appui(e){
  if(g||!e.isPrimary||e.button!==0)return;
  const pill=e.target.closest(".pill[data-pos]");
  if(!pill||e.target.closest(".x, .deplacer-choix"))return;
  g={id:e.pointerId,type:e.pointerType,pill,pos:pill.dataset.pos,x0:e.clientX,y0:e.clientY,x:e.clientX,y:e.clientY,actif:false};
  if(g.type==="touch")g.timer=setTimeout(()=>{if(g&&!g.actif)demarrer()},APPUI_LONG_MS);
  addEventListener("pointermove",bouge);addEventListener("pointerup",lache);addEventListener("pointercancel",annule);
}

export function initDeplacer(){
  const days=$("#days");
  days.addEventListener("pointerdown",appui);
  // Pendant un déplacement au doigt, le geste ne doit pas faire défiler la page (le défilement automatique s'en charge).
  days.addEventListener("touchmove",e=>{if(g&&g.actif)e.preventDefault()},{passive:false});
  // Appui long : pas de menu contextuel du navigateur.
  days.addEventListener("contextmenu",e=>{if(g&&e.target.closest(".pill[data-pos]"))e.preventDefault()});
  // Phase de capture : passe avant le gestionnaire de trip.js (ouverture de la fiche).
  days.addEventListener("click",e=>{
    if(ignorerClic){e.preventDefault();e.stopPropagation();ignorerClic=false;return}
    const b=e.target.closest("[data-deplacer]");if(b){e.stopPropagation();ouvrirChoix(b)}
  },true);
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&g&&g.actif){e.preventDefault();finir(false)}});
}
