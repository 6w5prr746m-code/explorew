/* Envies du groupe. L'organisateur envoie un lien de demande (#e=) qui ne contient que les codes des modules du voyage ;
   chaque proche coche « Envie » ou « Pas pour moi » (ou rien) et renvoie un lien de réponse (#r=).
   Les avis s'ajoutent à S.envies, sans jamais modifier la grille. Sans compte ni serveur : tout passe dans le fragment d'URL.
   Tout ce qui vient d'une URL est validé et borné (codes existants, prénom tronqué, tailles maximales) ; le reste est ignoré. */
import { SLOTS, BY, PROFILES } from "./data.js";
import { S, save } from "./state.js";
import { $, esc, col, toast, avis } from "./util.js";
import { dlg, showSheet } from "./module-sheet.js";
import { b64, unb64, lienBoutons } from "./share.js";
import { renderAll } from "./render.js";
import { switchView } from "./nav.js";

// Bornes de ce qui est accepté depuis une URL (caractères du code encodé, codes par liste, prénom, réponses gardées).
export const LIMITES=Object.freeze({lien:8000,codes:150,prenom:30,reponses:50});
const ID_RE=/^[A-Za-z0-9_-]{8,32}$/;
const existe=c=>typeof c==="string"&&Object.hasOwn(BY,c);
const codesValides=a=>Array.isArray(a)?[...new Set(a.filter(existe))].slice(0,LIMITES.codes):[];

// Prénom facultatif : texte seul, sans caractères de contrôle ni de mise en forme invisible, 30 caractères au plus.
export function nettoyerPrenom(v){
  if(typeof v!=="string")return"";
  const t=v.replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202E\u2060-\u2069\uFEFF]/g,"").replace(/\s+/g," ").trim();
  return [...t].slice(0,LIMITES.prenom).join("").trim();
}
// Réponse d'un proche, propre, ou null si inutilisable.
export function lireReponse(o){
  if(!o||typeof o!=="object"||o.v!==1||typeof o.i!=="string"||!ID_RE.test(o.i))return null;
  const e=codesValides(o.e),p=codesValides(o.p).filter(c=>!e.includes(c));
  if(!e.length&&!p.length)return null;
  return{i:o.i,n:nettoyerPrenom(o.n),e,p};
}
// État enregistré (ou restauré depuis un fichier) : mêmes contrôles qu'à la réception d'un lien, sans doublon d'identifiant.
export function cleanEnvies(a){
  if(!Array.isArray(a))return[];
  const vus=new Set(),out=[];
  for(const x of a){const r=x&&typeof x==="object"?lireReponse({...x,v:1}):null;if(r&&!vus.has(r.i)&&out.length<LIMITES.reponses){vus.add(r.i);out.push(r)}}
  return out;
}

// Décode le fragment qui suit `prefixe` (lien complet, fragment seul ou code collé) ; null si illisible ou trop long.
function decoder(texte,prefixe){
  const s=String(texte??"").trim(),i=s.indexOf(prefixe);
  const code=i>=0?s.slice(i+prefixe.length):s;
  if(!code||code.length>LIMITES.lien||!/^[A-Za-z0-9_-]+$/.test(code))return null;
  try{return JSON.parse(unb64(code))}catch(e){return null}
}
// Demande de l'organisateur : liste de codes existants, ou null.
export function lireDemande(texte){const o=decoder(texte,"#e=");if(!o||typeof o!=="object"||o.v!==1)return null;const c=codesValides(o.c);return c.length?c:null}

const base=()=>location.origin+location.pathname;
export const codesDuVoyage=()=>codesValides(S.days.flatMap(d=>SLOTS.flatMap(([k])=>d.slots[k])));
// Lien de demande : uniquement la liste des codes du voyage.
export const lienDemande=codes=>base()+"#e="+b64(JSON.stringify({v:1,c:codes}));
// Lien de réponse : identifiant aléatoire, prénom facultatif, codes « envie » (e) et « pas pour moi » (p).
export const lienReponse=r=>base()+"#r="+b64(JSON.stringify(r.n?{v:1,i:r.i,n:r.n,e:r.e,p:r.p}:{v:1,i:r.i,e:r.e,p:r.p}));
// Identifiant aléatoire de la réponse (24 caractères hexadécimaux), tiré une fois par ouverture de l'écran du proche.
function nouvelId(){const a=new Uint8Array(12);crypto.getRandomValues(a);return [...a].map(x=>x.toString(16).padStart(2,"0")).join("")}

// Ajoute une réponse ; la même réponse (même identifiant) ne compte qu'une fois, sa dernière version remplace la précédente.
export function ajouterReponse(r){
  const k=S.envies.findIndex(x=>x.i===r.i);
  if(k>=0){if(JSON.stringify(S.envies[k])===JSON.stringify(r))return"deja";S.envies[k]=r;return"maj"}
  if(S.envies.length>=LIMITES.reponses)return"plein";
  S.envies.push(r);return"ajout";
}
export function compteEnvies(code){let e=0,p=0;for(const r of Array.isArray(S.envies)?S.envies:[]){if(r?.e?.includes?.(code))e++;else if(r?.p?.includes?.(code))p++}return{e,p}}
// Ligne discrète sous un module de la grille (texte seul, sans couleur d'alerte ni classement).
export function enviesHtml(code){
  const{e,p}=compteEnvies(code);if(!e&&!p)return"";
  const t=[];if(e)t.push(e+(e>1?" envies":" envie"));if(p)t.push(p+" pas pour moi");
  return `<p class="pill-envies">Avis du groupe : ${t.join(" · ")}</p>`;
}
const deQui=n=>n?(/^[aeiouyàâäéèêëîïôöùûü]/i.test(n)?"d'":"de ")+n:"d'un proche";

// ---------- côté organisateur ----------
export function renderEnvies(){
  const box=$("#envies-recues");if(!box)return;
  const rs=S.envies||[];box.hidden=!rs.length;if(!rs.length){box.innerHTML="";return}
  const noms=rs.filter(r=>r.n).map(r=>r.n),anon=rs.length-noms.length;
  const qui=[...noms.map(esc),...(anon?[anon+(anon>1?" proches":" proche")]:[])].join(", ");
  box.innerHTML=`<h3 id="envies-recues-t">Envies du groupe</h3>
    <p class="sub">${rs.length} réponse${rs.length>1?"s":""} : ${qui}. Le nombre d'avis s'affiche sous chaque module ; votre voyage n'est pas modifié.</p>
    <div class="row"><button class="btn" id="envies-effacer" type="button">Effacer les avis</button></div>`;
  $("#envies-effacer").onclick=()=>{if(!confirm("Effacer tous les avis reçus ? Votre voyage n'est pas modifié."))return;S.envies=[];save();renderAll();toast("Avis effacés")};
}
function annoncer(texte){$("#avis-envies")?.remove();avis({id:"avis-envies",texte})}
// Réception d'un lien de réponse (ouvert ou collé). Renvoie true si le lien était lisible.
export function recevoirReponse(texte){
  const r=lireReponse(decoder(texte,"#r="));
  if(!r){toast("Lien de réponse illisible : vérifiez le lien reçu");return false}
  const res=ajouterReponse(r);
  if(res==="plein"){annoncer(`Limite de ${LIMITES.reponses} réponses atteinte : effacez des avis pour en ajouter.`);return true}
  save();renderAll();switchView("trip");
  annoncer(res==="deja"?`Les avis ${deQui(r.n)} étaient déjà ajoutés.`:res==="maj"?`Avis ${deQui(r.n)} mis à jour`:`Avis ${deQui(r.n)} ajoutés`);
  return true;
}
function demander(){
  const codes=codesDuVoyage();
  if(!codes.length){toast("Ajoutez d'abord des modules à votre voyage");return}
  const link=lienDemande(codes);
  $("#sheet").innerHTML=`<div class="grab"></div><h2>Demander les envies du groupe</h2>
   <p class="sub">Envoyez ce lien à vos proches : chacun indique, module par module, « Envie » ou « Pas pour moi », puis vous renvoie un lien de réponse. Les avis s'ajoutent à votre voyage sans rien y changer.</p>
   <p class="sub">Le lien contient uniquement la liste des codes des ${codes.length} module${codes.length>1?"s":""} du voyage : ni dates, ni notes, ni hébergements, ni budget.</p>
   <label class="lbl" for="envies-demande">Lien</label><textarea id="envies-demande" rows="3" readonly>${esc(link)}</textarea>
   <div class="row envies-row"><button class="btn primary" id="envies-copier">Copier le lien</button>${navigator.share?'<button class="btn" id="envies-nshare">Envoyer…</button>':""}<button class="btn ghost" id="envies-fermer">Fermer</button></div>
   <h3 class="envies-h3">Une réponse reçue ?</h3>
   <p class="sub">Ouvrez le lien de réponse sur cet appareil, ou collez-le ici.</p>
   <label class="lbl" for="envies-coller">Lien de réponse</label><textarea id="envies-coller" rows="3" placeholder="https://…#r=…"></textarea>
   <div class="row envies-row"><button class="btn" id="envies-ajouter">Ajouter les avis</button></div>`;
  lienBoutons({link,copy:"#envies-copier",area:"#envies-demande",nshare:"#envies-nshare",titre:"Donnez vos envies",texte:"Donnez vos envies pour notre voyage"});
  $("#envies-fermer").onclick=()=>dlg.close();
  $("#envies-ajouter").onclick=()=>{if(recevoirReponse($("#envies-coller").value))dlg.close()};
  showSheet();
}

// ---------- côté proche ----------
// Écran dédié : rien n'est lu ni écrit dans l'état de cet appareil (le voyage du proche reste intact).
let saisie=null; // {codes, choix: Map code → "e" | "p", id}
function renderProche(){
  const v=$("#v-envies");if(!saisie){v.innerHTML="";return}
  v.innerHTML=`<h2 id="envies-t">Donnez vos envies</h2>
    <p class="sub">On vous demande votre avis sur un voyage en préparation. Pour chaque module, touchez « Envie » ou « Pas pour moi », ou ne répondez pas. Votre propre voyage, s'il y en a un sur cet appareil, n'est pas modifié.</p>
    <ul class="envies-liste">${saisie.codes.map(c=>{const m=BY[c],ch=saisie.choix.get(c);return `<li class="envie" style="--c:${col(m.p)}">
      <p class="envie-t"><span class="code">${c}</span> <span class="envie-p">${esc(PROFILES[m.p]||"")}</span><b>${esc(m.t)}</b></p>
      <div class="envie-choix" role="group" aria-label="Votre avis : ${esc(m.t)}"><button class="btn small" type="button" data-envie="${c}:e" aria-pressed="${ch==="e"}">Envie</button><button class="btn small" type="button" data-envie="${c}:p" aria-pressed="${ch==="p"}">Pas pour moi</button></div></li>`}).join("")}</ul>
    <div class="panel envies-fin">
      <label class="lbl" for="envies-prenom">Votre prénom (facultatif)</label>
      <input id="envies-prenom" maxlength="${LIMITES.prenom}" autocomplete="given-name" aria-describedby="envies-prive">
      <p class="sub" id="envies-prive">Votre prénom et vos réponses ne quittent cet appareil que dans le lien que vous envoyez vous-même. Rien n'est enregistré ici ni envoyé à un serveur.</p>
      <div class="row envies-row"><button class="btn primary" id="envies-envoyer" type="button">Envoyer mes réponses</button><button class="btn ghost" id="envies-quitter" type="button">Revenir à l'application</button></div>
    </div>`;
  $("#envies-envoyer").onclick=envoyer;
  $("#envies-quitter").onclick=quitter;
}
function envoyer(){
  const e=[],p=[];saisie.choix.forEach((v,c)=>(v==="e"?e:p).push(c));
  if(!e.length&&!p.length){toast("Choisissez au moins une « Envie » ou un « Pas pour moi »");return}
  const r={i:saisie.id,n:nettoyerPrenom($("#envies-prenom").value),e,p};
  const link=lienReponse(r);
  $("#sheet").innerHTML=`<div class="grab"></div><h2>Vos réponses</h2>
   <p class="sub">Envoyez ce lien à la personne qui organise le voyage. Il contient uniquement vos réponses${r.n?" et votre prénom":""}.</p>
   <label class="lbl" for="envies-lien">Lien de réponse</label><textarea id="envies-lien" rows="3" readonly>${esc(link)}</textarea>
   <div class="row envies-row"><button class="btn primary" id="envies-lien-copier">Copier le lien</button>${navigator.share?'<button class="btn" id="envies-lien-nshare">Envoyer…</button>':""}<button class="btn ghost" id="envies-lien-fermer">Fermer</button></div>`;
  lienBoutons({link,copy:"#envies-lien-copier",area:"#envies-lien",nshare:"#envies-lien-nshare",titre:"Mes envies",texte:"Mes envies pour le voyage"});
  $("#envies-lien-fermer").onclick=()=>dlg.close();
  showSheet();
}
function quitter(){saisie=null;renderProche();history.replaceState(null,"",location.pathname);switchView("explore")}
function ouvrirDemande(codes){
  saisie={codes,choix:new Map(),id:nouvelId()};
  renderProche();switchView("envies");
}

// Lien ouvert (au démarrage ou sur changement de fragment) : demande (#e=) ou réponse (#r=).
export function enviesFromHash(){
  const h=location.hash;
  if(h.startsWith("#e=")){const c=lireDemande(h);if(c)ouvrirDemande(c);else{toast("Lien de demande illisible");history.replaceState(null,"",location.pathname)}}
  else if(h.startsWith("#r=")){history.replaceState(null,"",location.pathname);recevoirReponse(h)}
}
export function initEnvies(){
  S.envies=cleanEnvies(S.envies);
  $("#envies-demander").onclick=demander;
  $("#v-envies").addEventListener("click",e=>{
    const b=e.target.closest("[data-envie]");if(!b||!saisie)return;
    const[c,v]=b.dataset.envie.split(":");
    if(saisie.choix.get(c)===v)saisie.choix.delete(c);else saisie.choix.set(c,v);
    b.parentNode.querySelectorAll("[data-envie]").forEach(x=>x.setAttribute("aria-pressed",String(saisie.choix.get(c)===x.dataset.envie.split(":")[1])));
  });
  addEventListener("hashchange",enviesFromHash);
}
