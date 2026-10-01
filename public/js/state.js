/* État utilisateur, conservé dans localStorage (clé carnetpei.v1). */
import { SLOTS } from "./data.js";
import { avis } from "./util.js";
// ---------- état ----------
const KEY="carnetpei.v1";
// Destination du voyage (data/destinations/<id>.json). Les états enregistrés avant le multi-destinations n'en ont pas.
export const DEST_DEFAUT="reunion";
const EXAMPLE={7:[{m:[],a:["LA-D1"],s:["NE-16"]},{m:["RA-D1"],a:["AV-D1"],s:[]},{m:[],a:["RA-D15"],s:[]},{m:["AV-D2"],a:["LA-D15"],s:[]},{m:["EP-D18"],a:["EP-D4"],s:[]},{m:["AV-J1"],a:["FA-03"],s:[]},{m:["LA-J1"],a:[],s:[]}]};
export function blankDay(){return{slots:{m:[],a:[],s:[]},heb:"",bud:"",coeur:"",notes:""}}
function exampleState(){return{dest:DEST_DEFAUT,fmt:7,start:"",example:true,days:EXAMPLE[7].map(s=>({...blankDay(),slots:JSON.parse(JSON.stringify(s))})),stamps:{},done:{},words:["Ti lampé = doucement, petit à petit"],back:"",back2:[],checks:{}}}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!Array.isArray(S.days))S=exampleState();
// Migration silencieuse : un état sans destination est un voyage existant, gardé tel quel (écrit à la prochaine sauvegarde).
if(typeof S.dest!=="string"||!S.dest)S.dest=DEST_DEFAUT;
// Passeport étendu : tampons datés des modules faits ({code: "AAAA-MM-JJ"}).
if(!S.done||typeof S.done!=="object"||Array.isArray(S.done))S.done={};
// « Je reviens pour… » en liste de modules (codes) ; le texte libre S.back est conservé à côté.
if(!Array.isArray(S.back2))S.back2=[];
S.back2=[...new Set(S.back2.filter(c=>typeof c==="string"))];
export { S };
// Sauvegarde impossible (mémoire pleine, navigation privée) : message discret, une seule fois par session.
let alerteVue=false;
function alerteSauvegarde(){
  if(alerteVue)return;alerteVue=true;
  try{if(sessionStorage.getItem("carnetpei.alerte-sauvegarde"))return;sessionStorage.setItem("carnetpei.alerte-sauvegarde","1")}catch(e){}
  avis({id:"avis-sauvegarde",texte:"Vos modifications ne peuvent pas être enregistrées sur cet appareil (mémoire pleine ou navigation privée). Elles restent affichées tant que la page est ouverte : exportez vos données depuis l'onglet Carnet pour les garder."});
}
let saveT;export function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){alerteSauvegarde()}},250)}
export function touched(){if(S.example){S.example=false}save()}
export function dayDate(i){if(!S.start)return"";const d=new Date(S.start+"T12:00:00");d.setDate(d.getDate()+i);return d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}
export function inTrip(code){return S.days.some(d=>SLOTS.some(([k])=>d.slots[k].includes(code)))}
