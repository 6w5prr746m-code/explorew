/* « Par où commencer ? » : encart fermable en tête de l'onglet Explorer, affiché tant que la trame
   d'exemple est à l'écran (S.example). Il résume le mode d'emploi du Book (durée, profils, grille)
   et propose trois modules à ajouter au jour 1 en un tap.
   Une fois fermé (S.demarrageFini), ou dès que le voyage n'est plus l'exemple (S.example à false), il ne revient plus. */
import { MODS, PROFILES } from "./data.js";
import { S, save } from "./state.js";
import { $, esc, col } from "./util.js";
import { openModule } from "./module-sheet.js";
import { ajouterAuJour } from "./trip.js";

/* Règle de choix des modules proposés (déterministe, aucune sélection éditoriale) :
   1. fiche complète ;
   2. niveau 1 ou non renseigné (null) ;
   3. budget « Gratuit » ou « € » ;
   4. aucun rappel de sécurité (securite vide) : pas de consigne marche ou baignade pour un tout premier pas ;
   5. tri stable par code (ordre des caractères), puis le premier module de chaque profil, jusqu'à NB_PROPOSES
      profils différents. Moins de NB_PROPOSES modules si la règle n'en retient pas assez. */
export const NB_PROPOSES=3;
export const REGLE_DEMARRAGE=Object.freeze({fiche:"complete",niveaux:[1,null],budgets:["Gratuit","€"],securiteVide:true,profilsDifferents:NB_PROPOSES});
export function modulesProposes(mods=MODS){
  const ok=mods.filter(m=>m.full&&(m.n===1||m.n==null)&&REGLE_DEMARRAGE.budgets.includes(m.b)&&!(m.sec&&m.sec.length));
  const tries=[...ok].sort((a,b)=>a.c<b.c?-1:a.c>b.c?1:0);
  const vus=new Set(),choix=[];
  for(const m of tries){if(choix.length>=NB_PROPOSES)break;if(vus.has(m.p))continue;vus.add(m.p);choix.push(m)}
  return choix;
}

// Sortie du voyage d'exemple (ajout, import, voyage vidé…) : S.example ne repasse jamais à true,
// l'encart ne revient donc plus. Rien n'est écrit au chargement (un ancien état reste tel quel).
function visible(){return !!S.example&&!S.demarrageFini}
export function renderDemarrage(){
  const box=$("#demarrage");if(!box)return;
  if(!visible()){box.hidden=true;box.innerHTML="";return}
  const props=modulesProposes();
  box.hidden=false;
  box.innerHTML=`<div class="dem-h"><h2 id="demarrage-t">Par où commencer ?</h2><button class="btn small dem-x" type="button" id="dem-fermer">Fermer</button></div>
    <p class="sub">Le voyage affiché est un exemple. Pour composer le vôtre&nbsp;:</p>
    <ol class="dem-etapes">
      <li><b>Choisissez la durée</b>, de 7 à 30 jours, dans l'onglet Voyage.</li>
      <li><b>Choisissez un ou deux profils</b> avec les filtres ci-dessous.</li>
      <li><b>Piochez les modules</b> et placez-les dans la grille, jour par jour.</li>
    </ol>
    ${props.length?`<p class="lbl dem-l">Pour un premier pas</p>
    <ul class="dem-mods">${props.map(m=>`<li class="dem-mod" style="--c:${col(m.p)}" data-dem="${m.c}">
      <span class="code">${m.c} · ${esc(PROFILES[m.p])}</span>
      <p class="dem-t" id="dem-t-${m.c}">${esc(m.t)}</p>
      <p class="dem-meta">${esc([m.z,m.d,m.b].filter(Boolean).join(" · "))}</p>
      <div class="row"><button class="btn small primary" type="button" data-dem-add="${m.c}" aria-describedby="dem-t-${m.c}">Ajouter au jour 1</button><button class="btn small" type="button" data-dem-voir="${m.c}" aria-describedby="dem-t-${m.c}">Voir la fiche</button></div>
    </li>`).join("")}</ul>`:""}`;
}
// Après la disparition de l'encart, le focus clavier reste dans l'onglet (premier filtre de profil).
function refocus(){const f=$("#profiles button");if(f)f.focus()}
export function initDemarrage(){
  const box=$("#demarrage");if(!box)return;
  box.addEventListener("click",e=>{
    if(e.target.closest("#dem-fermer")){S.demarrageFini=true;save();renderDemarrage();refocus();return}
    const add=e.target.closest("[data-dem-add]");if(add){S.demarrageFini=true;ajouterAuJour(0,add.dataset.demAdd);refocus();return}
    const voir=e.target.closest("[data-dem-voir]");if(voir)openModule(voir.dataset.demVoir);
  });
}
