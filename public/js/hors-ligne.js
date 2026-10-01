/* Pratique : encart « Hors ligne ». Vérifie que chaque fichier de CORE (sw.js) est dans le cache de la VERSION courante,
   et remet en cache les fichiers manquants. CORE et VERSION ne sont pas recopiés ici : le service worker actif les
   renvoie sur demande (message "carnetpei:core" via un MessageChannel), sw.js reste la seule liste. */
import { MODS } from "./data.js";
import { $ } from "./util.js";

const DEMANDE="carnetpei:core";
const DELAI_REPONSE_MS=3000; // un service worker plus ancien, sans réponse à ce message, ne doit pas bloquer l'encart
const ATTENTE="Préparation du mode hors ligne : l'état s'affichera ici dès que l'app sera enregistrée sur cet appareil.";
let tour=0; // seule la dernière vérification lancée met l'encart à jour

function afficher(etat,version){
  $("#hl-etat").textContent=etat;
  const v=$("#hl-version");v.hidden=!version;v.textContent=version?`Version du cache : ${version}`:"";
}
function bouton(visible,occupe=false){
  const b=$("#hl-verif");b.hidden=!visible;b.disabled=occupe;b.setAttribute("aria-busy",String(occupe));
}
function demanderCore(sw){
  return new Promise((ok,ko)=>{
    const canal=new MessageChannel();
    const t=setTimeout(()=>ko(new Error("pas de réponse du service worker")),DELAI_REPONSE_MS);
    canal.port1.onmessage=e=>{clearTimeout(t);ok(e.data)};
    sw.postMessage(DEMANDE,[canal.port2]);
  });
}
async function contexte(){
  const reg=await navigator.serviceWorker.getRegistration();
  if(!reg||!reg.active)return null;
  const {version,core}=await demanderCore(reg.active);
  return {version,urls:core.map(f=>new URL(f,reg.scope).href)};
}
async function manquants({version,urls}){
  if(!await caches.has(version))return urls;
  const c=await caches.open(version);
  const trouves=await Promise.all(urls.map(u=>c.match(u,{ignoreSearch:true})));
  return urls.filter((u,i)=>!trouves[i]);
}
async function completer({version},liste){
  const c=await caches.open(version);
  await Promise.all(liste.map(u=>fetch(u,{cache:"reload"}).then(r=>r.ok?c.put(u,r):null).catch(()=>null)));
}
function resultat(ctx,manque){
  if(!manque.length)afficher(`Prêt : l'app et les ${MODS.length} modules sont disponibles sans réseau`,ctx.version);
  else afficher(manque.length===1?"Incomplet : 1 fichier manque. Réessayez avec du réseau.":`Incomplet : ${manque.length} fichiers manquent. Réessayez avec du réseau.`,ctx.version);
}

export async function verifierHorsLigne({reparer=false}={}){
  if(!("serviceWorker" in navigator)||!("caches" in window)){
    afficher("Ce navigateur ne permet pas d'enregistrer l'app pour l'utiliser sans réseau.");bouton(false);return;
  }
  const n=++tour;
  bouton(!$("#hl-verif").hidden,true);
  try{
    const ctx=await contexte();
    if(n!==tour)return;
    if(!ctx){afficher(ATTENTE);bouton(false);return}
    let manque=await manquants(ctx);
    if(reparer&&manque.length){await completer(ctx,manque);manque=await manquants(ctx)}
    if(n!==tour)return;
    resultat(ctx,manque);bouton(true);
  }catch(e){
    if(n!==tour)return;
    afficher(ATTENTE);bouton(false);
  }
}
export function initHorsLigne(){
  // Rappel placé sous l'encart : la ligne « Avant de marcher » des réflexes du jour, reprise telle quelle (aucun texte nouveau).
  const ligne=[...document.querySelectorAll("#reflexes .check")].find(x=>x.querySelector("b")?.textContent.trim()==="Avant de marcher");
  if(ligne)$("#hl-rappel").appendChild(ligne.cloneNode(true));
  $("#hl-verif").onclick=()=>verifierHorsLigne({reparer:true});
  // Nouvelle vérification à chaque ouverture de l'onglet Pratique.
  document.querySelector("nav.tabs").addEventListener("click",e=>{if(e.target.closest('button[data-v="prat"]'))verifierHorsLigne()});
  if("serviceWorker" in navigator){
    navigator.serviceWorker.ready.then(()=>verifierHorsLigne()).catch(()=>{});
    navigator.serviceWorker.addEventListener("controllerchange",()=>verifierHorsLigne());
  }
  verifierHorsLigne();
}
