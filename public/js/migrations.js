/* Mise à jour sûre des données sur le téléphone : quand data/modules.json change, l'état enregistré
   (voyage, tampons « Fait », « Je reviens pour… ») peut contenir des codes de modules qui n'existent plus.
   Au chargement : 1) les anciens codes renommés sont remplacés par les nouveaux (CODES_RENOMMES),
   2) les codes inconnus restants sont retirés (leurs créneaux redeviennent libres),
   3) un message unique et fermable liste les codes retirés. Aucun remplacement n'est jamais inventé. */
import { BY } from "./data.js";
import { S, save } from "./state.js";
import { avis } from "./util.js";

/* Correspondance entre anciens et nouveaux codes, à remplir quand un module change de code dans data/modules.json.
   Format : { "ANCIEN-CODE": "NOUVEAU-CODE" }, par exemple { "AV-D31": "AV-D3" }.
   Le nouveau code doit exister dans data/modules.json ; sinon l'ancien est traité comme un module retiré.
   Une entrée n'est ajoutée que si le module est bien le même (même activité, même lieu), jamais pour proposer un remplacement. */
export const CODES_RENOMMES = Object.freeze({});

const SLOTS_K=["m","a","s"];
const estObjet=v=>v&&typeof v==="object"&&!Array.isArray(v);

// Remplace les anciens codes par les nouveaux dans l'état. Renvoie la liste des renommages appliqués ("ANCIEN→NOUVEAU").
export function appliquerRenommages(etat,table,existe){
  const faits=new Set();
  const neuf=c=>{const n=typeof c==="string"&&Object.prototype.hasOwnProperty.call(table,c)?table[c]:null;if(n&&existe(n)&&!existe(c)){faits.add(c+"→"+n);return n}return c};
  if(Array.isArray(etat.days))etat.days.forEach(d=>{if(d&&estObjet(d.slots))SLOTS_K.forEach(k=>{if(Array.isArray(d.slots[k]))d.slots[k]=d.slots[k].map(neuf)})});
  if(estObjet(etat.done)){const o={};for(const [c,x] of Object.entries(etat.done)){const n=neuf(c);if(!(n in o)||n===c)o[n]=x}etat.done=o}
  if(Array.isArray(etat.back2))etat.back2=[...new Set(etat.back2.map(neuf))];
  return [...faits];
}

// Retire de l'état les codes de modules inconnus. Renvoie la liste triée des codes retirés, sans doublon.
export function retirerInconnus(etat,existe){
  const retires=new Set();
  const garde=c=>{if(typeof c==="string"&&existe(c))return true;if(typeof c==="string")retires.add(c);return false};
  if(Array.isArray(etat.days))etat.days.forEach(d=>{if(d&&estObjet(d.slots))SLOTS_K.forEach(k=>{d.slots[k]=Array.isArray(d.slots[k])?d.slots[k].filter(garde):[]})});
  if(estObjet(etat.done))for(const c of Object.keys(etat.done))if(!garde(c))delete etat.done[c];
  if(Array.isArray(etat.back2))etat.back2=etat.back2.filter(garde);
  return [...retires].sort();
}

// Renommages puis nettoyage. `existe` : code → booléen ; `table` : correspondance anciens → nouveaux codes.
export function migrerCodes(etat,existe,table=CODES_RENOMMES){
  const renommes=appliquerRenommages(etat,table,existe);
  const retires=retirerInconnus(etat,existe);
  return{renommes,retires};
}

// Message sur les modules retirés, gardé dans l'état (S.modulesRetires) tant que le voyageur ne l'a pas fermé.
function afficherRetires(){
  const codes=Array.isArray(S.modulesRetires)?S.modulesRetires:[];
  if(!codes.length)return;
  const un=codes.length===1;
  avis({
    id:"avis-retires",
    titre:un?"Un module n'existe plus":"Des modules n'existent plus",
    texte:`${un?"Ce module a été retiré":"Ces modules ont été retirés"} de Carnet Péï depuis votre dernière visite : ${codes.join(", ")}. ${un?"Il a été enlevé":"Ils ont été enlevés"} de votre voyage et de vos listes, et ${un?"son créneau est libéré":"leurs créneaux sont libérés"}.`,
    fermer(){delete S.modulesRetires;save()},
  });
}

// Demande au navigateur de ne pas effacer les données du carnet en cas de manque de place. Rien n'est affiché.
function stockagePersistant(){
  try{
    const st=navigator.storage;
    if(st&&typeof st.persist==="function")Promise.resolve(st.persisted?st.persisted():false).then(ok=>ok||st.persist()).catch(()=>{});
  }catch(e){}
}

export function initMigrations(){
  const deja=Array.isArray(S.modulesRetires)?S.modulesRetires.filter(c=>typeof c==="string"):[];
  const {renommes,retires}=migrerCodes(S,c=>!!BY[c]);
  if(retires.length||deja.length)S.modulesRetires=[...new Set([...deja,...retires])].sort();
  else delete S.modulesRetires;
  // L'état n'est réécrit que s'il a changé (renommage ou retrait).
  if(renommes.length||retires.length)save();
  afficherRetires();
  stockagePersistant();
}
