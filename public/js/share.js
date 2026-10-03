/* Partage d'un voyage : encodage dans l'URL (#t=), QR code, import. */
import { SLOTS, BY, DEST } from "./data.js";
import { S, save } from "./state.js";
import { $, esc, toast } from "./util.js";
import { dlg, showSheet } from "./module-sheet.js";
import { renderAll } from "./render.js";
import { switchView } from "./nav.js";

export const b64=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
export const unb64=s=>decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/"))));
export const encodeTrip=()=>b64(JSON.stringify({v:1,f:S.fmt,s:S.start||"",d:S.days.map(d=>SLOTS.map(([k])=>d.slots[k]))}));
export const decodeTrip=code=>{const o=JSON.parse(unb64(code.trim().replace(/^.*#t=/,"")));if(!o||!Array.isArray(o.d))throw 0;return o};
export const applyTrip=o=>{S.fmt=o.f;S.start=o.s||"";S.example=false;S.days=o.d.map(sl=>{const d={slots:{m:[],a:[],s:[]},heb:"",bud:"",coeur:"",notes:""};SLOTS.forEach(([k],j)=>d.slots[k]=(sl[j]||[]).filter(c=>BY[c]));return d});save();renderAll()};
// Boutons « Copier le lien » et « Envoyer… » (partage natif, s'il existe) d'une feuille de lien.
export function lienBoutons({link,copy,area,nshare,titre,texte}){
  $(copy).onclick=async()=>{try{await navigator.clipboard.writeText(link);toast("Lien copié")}catch(e){$(area).select();toast("Sélectionné : copiez-le")}};
  if(nshare&&$(nshare))$(nshare).onclick=()=>navigator.share({title:titre,text:texte,url:link}).catch(()=>{});
}
export function initShare(){
  const BASE=location.origin+location.pathname;
  $("#share").onclick=()=>{
    const code=encodeTrip();const link=BASE+"#t="+code;
    $("#sheet").innerHTML=`<div class="grab"></div><h2>Partager mon voyage</h2>
   <p class="sub">Le lien contient uniquement le format, la date et les modules placés : ni notes, ni budget, ni hébergements.</p>
   <div class="qr" id="qr" role="img" aria-label="QR code du lien de partage"></div>
   <label class="lbl" for="sharelink">Lien</label><textarea id="sharelink" rows="3" readonly>${esc(link)}</textarea>
   <div class="row"><button class="btn primary" id="copy">Copier le lien</button>${navigator.share?'<button class="btn" id="nshare">Envoyer…</button>':""}<button class="btn ghost" id="sclose">Fermer</button></div>
   <p class="sub">La personne qui reçoit le lien peut aussi le coller dans « Importer ».</p>`;
    try{new QRCode($("#qr"),{text:link,width:180,height:180,correctLevel:QRCode.CorrectLevel.L});$("#qr").querySelectorAll("img").forEach(i=>i.alt="")}catch(e){$("#qr").remove()}
    lienBoutons({link,copy:"#copy",area:"#sharelink",nshare:"#nshare",titre:DEST.libelles.partage,texte:"Mon itinéraire Carnet Péï"});
    $("#sclose").onclick=()=>dlg.close();
    showSheet();
  };
  $("#import").onclick=()=>{
    $("#sheet").innerHTML=`<div class="grab"></div><h2>Importer un voyage</h2>
   <p class="sub">Collez un lien ou un code de voyage reçu. Il remplacera les modules de votre voyage actuel ; vos notes du carnet sont conservées.</p>
   <textarea id="impcode" rows="4" placeholder="https://…#t=…"></textarea>
   <div class="row"><button class="btn primary" id="impgo">Importer</button><button class="btn ghost" id="impclose">Annuler</button></div>`;
    $("#impgo").onclick=()=>{try{applyTrip(decodeTrip($("#impcode").value));dlg.close();toast("Voyage importé")}catch(e){toast("Code illisible : vérifiez le lien copié")}};
    $("#impclose").onclick=()=>dlg.close();
    showSheet();
  };
}
// Lien reçu : propose d'importer le voyage partagé
export function importFromHash(){
  try{const h=location.hash;if(h.startsWith("#t=")){const o=decodeTrip(h);if(confirm("Un voyage de "+o.f+" jours vous a été partagé. L'importer à la place du vôtre ?")){applyTrip(o);switchView("trip")}history.replaceState(null,"",location.pathname)}}catch(e){}
}
