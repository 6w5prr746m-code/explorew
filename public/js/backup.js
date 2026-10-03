/* Mes données : export et restauration de l'état utilisateur (fichier JSON). */
import { SLOTS, BY } from "./data.js";
import { S, save, blankDay, DEST_DEFAUT } from "./state.js";
import { $, toast } from "./util.js";
import { renderAll } from "./render.js";
import { renderPrat } from "./pratique.js";
import { cleanDone } from "./passeport.js";
import { cleanBack2 } from "./souvenir.js";
import { cleanEnvies } from "./envies.js";

const FORMAT="carnet-pei";

export function exportData(){
  const data={format:FORMAT,version:1,exporteLe:new Date().toISOString(),etat:S};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"});
  const a=document.createElement("a");
  a.href=URL.createObjectURL(blob);
  a.download=`carnet-pei-${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(a.href),1000);
  toast("Fichier exporté");
}

// Vérifie et nettoie un état importé ; lève une erreur s'il est inutilisable.
export function parseBackup(text){
  const o=JSON.parse(text);
  const e=o&&o.format===FORMAT?o.etat:o;
  if(!e||!Array.isArray(e.days)||!e.days.length)throw new Error("format");
  const str=v=>typeof v==="string"?v:"";
  const days=e.days.map(d=>{
    const n=blankDay();if(!d||typeof d!=="object")return n;
    SLOTS.forEach(([k])=>{n.slots[k]=Array.isArray(d.slots&&d.slots[k])?d.slots[k].filter(c=>BY[c]):[]});
    for(const f of ["heb","bud","coeur","notes"])n[f]=str(d[f]);
    return n;
  });
  const obj=v=>v&&typeof v==="object"&&!Array.isArray(v)?v:{};
  return{dest:typeof e.dest==="string"&&e.dest?e.dest:DEST_DEFAUT,fmt:days.length,start:/^\d{4}-\d{2}-\d{2}$/.test(e.start)?e.start:"",example:false,days,
    stamps:obj(e.stamps),done:cleanDone(e.done),words:Array.isArray(e.words)?e.words.filter(w=>typeof w==="string"):[],back:str(e.back),back2:cleanBack2(e.back2),checks:obj(e.checks),envies:cleanEnvies(e.envies)};
}

function restore(text){
  let next;
  try{next=parseBackup(text)}catch(err){toast("Fichier illisible : choisissez un export Carnet Péï");return}
  if(!confirm(`Remplacer votre voyage et votre carnet actuels par ceux du fichier (${next.days.length} jours) ?`))return;
  // L'apparence est un réglage de l'appareil : elle ne vient pas du fichier et reste celle choisie ici.
  const keep={skin:S.skin,mode:S.mode,deserOffered:S.deserOffered};
  for(const k of Object.keys(S))delete S[k];
  Object.assign(S,next,keep);
  save();renderAll();renderPrat();
  toast("Données restaurées");
}

export function initBackup(){
  $("#backup-export").onclick=exportData;
  $("#backup-import").onclick=()=>$("#backup-file").click();
  $("#backup-file").onchange=async e=>{const f=e.target.files[0];e.target.value="";if(f)restore(await f.text())};
}
