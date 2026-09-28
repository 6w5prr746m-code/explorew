/* État utilisateur, conservé dans localStorage (clé carnetpei.v1). */
import { SLOTS } from "./data.js";
// ---------- état ----------
const KEY="carnetpei.v1";
const EXAMPLE={7:[{m:[],a:["LA-D1"],s:["NE-16"]},{m:["RA-D1"],a:["AV-D1"],s:[]},{m:[],a:["RA-D15"],s:[]},{m:["AV-D2"],a:["LA-D15"],s:[]},{m:["EP-D18"],a:["EP-D4"],s:[]},{m:["AV-J1"],a:["FA-03"],s:[]},{m:["LA-J1"],a:[],s:[]}]};
export function blankDay(){return{slots:{m:[],a:[],s:[]},heb:"",bud:"",coeur:"",notes:""}}
function exampleState(){return{fmt:7,start:"",example:true,days:EXAMPLE[7].map(s=>({...blankDay(),slots:JSON.parse(JSON.stringify(s))})),stamps:{},words:["Ti lampé = doucement, petit à petit"],back:"",checks:{}}}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!Array.isArray(S.days))S=exampleState();
export { S };
let saveT;export function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},250)}
export function touched(){if(S.example){S.example=false}save()}
export function dayDate(i){if(!S.start)return"";const d=new Date(S.start+"T12:00:00");d.setDate(d.getDate()+i);return d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}
export function inTrip(code){return S.days.some(d=>SLOTS.some(([k])=>d.slots[k].includes(code)))}
