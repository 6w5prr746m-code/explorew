/* Carte postale : image de partage (PNG portrait 1080 × 1350) dessinée dans le navigateur, sans réseau ni dépendance.
   Aucune donnée personnelle : seulement la destination, le nombre de jours, le trajet (codes et numéros de jour),
   les codes des tampons « Fait » (sans date) et l'adresse de l'app sans paramètre ni fragment.
   Couleurs lues dans les tokens CSS du thème actif, polices de l'app. */
import { SLOTS, BY, DEST } from "./data.js";
import { S } from "./state.js";
import { $, esc, toast } from "./util.js";
import { dlg } from "./module-sheet.js";
import { GEO, pointOf, tripPoints } from "./map.js";

export const PC_W=1080, PC_H=1350;
export const FICHIER="carnet-pei-carte-postale.png";
const MAX_TAMPONS=18;

const DISPLAY='"Instrument Serif", Georgia, serif', BODY='Figtree, system-ui, sans-serif', MONO='"JetBrains Mono", ui-monospace, monospace';
const token=n=>getComputedStyle(document.documentElement).getPropertyValue("--"+n).trim();

export const hasTrip=()=>S.days.some(d=>SLOTS.some(([k])=>d.slots[k].some(c=>BY[c])));
// Adresse de l'app, sans paramètre ni fragment (jamais de lien #t=).
export const appURL=()=>location.origin+location.pathname;

// Les seules données dessinées sur la carte postale.
export function postcardData(){
  return {
    nom:DEST.nom,
    jours:S.days.length,
    trajet:tripPoints().filter(([,c])=>BY[c]),
    tampons:Object.keys(S.done||{}).filter(c=>BY[c]).sort(),
    url:appURL(),
  };
}

// Écrit un texte en réduisant la taille jusqu'à tenir dans la largeur donnée.
function fitText(ctx,txt,x,y,maxW,size,family,weight=""){
  let s=size;
  do{ctx.font=`${weight} ${s}px ${family}`.trim();s-=1}while(ctx.measureText(txt).width>maxW&&s>12);
  ctx.fillText(txt,x,y);
}

async function fontsReady(){
  try{
    await Promise.all([`400 72px ${DISPLAY}`,`italic 400 30px ${DISPLAY}`,`600 30px ${BODY}`,`500 20px ${MONO}`].map(f=>document.fonts.load(f)));
    await document.fonts.ready;
  }catch(e){}
}

// Dessine la carte postale dans le canvas (redimensionné en 1080 × 1350) et renvoie les données utilisées.
export async function buildPostcard(canvas){
  await fontsReady();
  const d=postcardData();
  canvas.width=PC_W;canvas.height=PC_H;
  const ctx=canvas.getContext("2d");
  const c={ground:token("ground"),surface:token("surface"),s2:token("surface-2"),ink:token("ink"),muted:token("muted"),line:token("line"),accent:token("accent"),accentInk:token("accent-ink")};
  const X0=64,X1=PC_W-64,CW=X1-X0;

  // Fond et cadre
  ctx.fillStyle=c.ground;ctx.fillRect(0,0,PC_W,PC_H);
  ctx.strokeStyle=c.line;ctx.lineWidth=3;ctx.strokeRect(32,32,PC_W-64,PC_H-64);

  // En-tête
  ctx.textAlign="left";ctx.textBaseline="alphabetic";
  ctx.fillStyle=c.ink;
  fitText(ctx,`Carnet Péï · ${d.nom}`,X0,150,CW,84,DISPLAY,"400");
  ctx.fillStyle=c.accent;
  fitText(ctx,`${d.jours} jour${d.jours>1?"s":""} de voyage`,X0,206,CW,38,BODY,"600");

  // Zone des tampons (en bas), puis la carte dans la place restante
  const n=d.tampons.length,shown=n>MAX_TAMPONS?MAX_TAMPONS-1:n;
  const R=44,STEP=104,PER=Math.floor(CW/STEP);
  const rows=n?Math.ceil(Math.min(n,MAX_TAMPONS)/PER):0;
  const FOOT=1196;
  const stampsH=rows?60+rows*STEP:0;
  const top=246,bottom=FOOT-stampsH-16;
  const s=Math.min(CW/GEO.W,(bottom-top)/GEO.H);
  const mw=GEO.W*s,mh=GEO.H*s,ox=X0+(CW-mw)/2,oy=top+(bottom-top-mh)/2;
  const P=([x,y])=>[ox+x*s,oy+y*s];

  // Silhouette de l'île et cirques
  ctx.save();ctx.translate(ox,oy);ctx.scale(s,s);
  const coast=new Path2D(GEO.coast);
  ctx.fillStyle=c.s2;ctx.fill(coast);
  ctx.strokeStyle=c.ink;ctx.lineWidth=2.6/s;ctx.lineJoin="round";ctx.stroke(coast);
  ctx.strokeStyle=c.muted;ctx.lineWidth=1.6/s;ctx.setLineDash([5/s,6/s]);
  GEO.cirques.forEach(z=>{const [x,y]=GEO.P(z.centre);ctx.beginPath();ctx.arc(x,y,z.rayon,0,Math.PI*2);ctx.stroke()});
  ctx.setLineDash([]);ctx.restore();
  ctx.fillStyle=c.muted;ctx.textAlign="center";ctx.font=`italic 400 ${Math.round(24*s/1.45)}px ${DISPLAY}`;
  // Noms des cirques au-dessus de leur cercle, pour ne pas passer sous les pastilles du trajet.
  GEO.cirques.forEach(z=>{const [x,y]=P(GEO.P(z.centre));ctx.fillText(z.nom,x,y-z.rayon*s-10)});

  // Trajet et pastilles numérotées par jour
  const pts=d.trajet.map(([j,code])=>[j,P(pointOf(code))]);
  if(pts.length>1){
    ctx.strokeStyle=c.accent;ctx.lineWidth=5;ctx.lineJoin="round";ctx.lineCap="round";ctx.setLineDash([14,10]);
    ctx.beginPath();pts.forEach(([,[x,y]],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();ctx.setLineDash([]);
  }
  // Pastilles proches regroupées (même lieu, jours différents) pour garder chaque numéro lisible : « 3·4 ».
  const groups=[];
  pts.forEach(([j,[x,y]])=>{
    const g=groups.find(g=>Math.hypot(g.x-x,g.y-y)<40);
    if(g){if(!g.days.includes(j))g.days.push(j)}else groups.push({x,y,days:[j]});
  });
  ctx.textAlign="center";ctx.textBaseline="middle";
  groups.forEach(({x,y,days})=>{
    const label=days.join("·");
    ctx.font=`500 20px ${MONO}`;
    const w=Math.max(38,ctx.measureText(label).width+22),h=38;
    ctx.beginPath();ctx.roundRect(x-w/2,y-h/2,w,h,h/2);ctx.fillStyle=c.ink;ctx.fill();ctx.lineWidth=4;ctx.strokeStyle=c.ground;ctx.stroke();
    ctx.fillStyle=c.ground;ctx.fillText(label,x,y+1);
  });

  // Tampons « Fait » : un petit cercle par module, code seul, sans date
  if(rows){
    const ty=FOOT-stampsH;
    ctx.textAlign="left";ctx.textBaseline="alphabetic";ctx.fillStyle=c.muted;ctx.font=`700 24px ${BODY}`;
    ctx.fillText("TAMPONS « FAIT »",X0,ty+28);
    const items=d.tampons.slice(0,shown).map(code=>[code,token(BY[code].p)||c.accent]);
    if(shown<n)items.push([`+${n-shown}`,c.muted]);
    items.forEach(([label,col],i)=>{
      const r=Math.floor(i/PER),k=i%PER,inRow=Math.min(PER,items.length-r*PER);
      const x=X0+(CW-inRow*STEP)/2+STEP/2+k*STEP,y=ty+60+STEP/2+r*STEP;
      ctx.beginPath();ctx.arc(x,y,R,0,Math.PI*2);ctx.fillStyle=c.surface;ctx.fill();
      ctx.lineWidth=4;ctx.strokeStyle=col;ctx.stroke();
      ctx.beginPath();ctx.arc(x,y,R-8,0,Math.PI*2);ctx.lineWidth=1.5;ctx.setLineDash([4,4]);ctx.stroke();ctx.setLineDash([]);
      ctx.fillStyle=col;ctx.textAlign="center";ctx.textBaseline="middle";
      fitText(ctx,label,x,y+1,2*R-22,19,MONO,"500");
    });
  }

  // Pied : invitation et adresse de l'app
  ctx.strokeStyle=c.line;ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(X0,FOOT);ctx.lineTo(X1,FOOT);ctx.stroke();
  ctx.textAlign="left";ctx.textBaseline="alphabetic";
  ctx.fillStyle=c.muted;fitText(ctx,"Composez le vôtre :",X0,FOOT+54,CW,32,BODY,"600");
  ctx.fillStyle=c.ink;fitText(ctx,d.url,X0,FOOT+104,CW,32,MONO,"500");
  return d;
}

export function altText(d){
  const e=d.trajet.length,t=d.tampons.length;
  return `Carte postale Carnet Péï : ${d.nom}, ${d.jours} jours. Silhouette de l'île avec le trajet du voyage en ${e} étape${e>1?"s":""} numérotées par jour`
    +(t?`, et les tampons « Fait » : ${d.tampons.join(", ")}.`:".")
    +` Composez le vôtre : ${d.url}`;
}

let lastURL="";
async function openPostcard(){
  if(!hasTrip()){toast("Composez d'abord votre voyage");return}
  const canvas=document.createElement("canvas");
  let d,blob;
  try{d=await buildPostcard(canvas);blob=await new Promise(r=>canvas.toBlob(r,"image/png"))}catch(e){blob=null}
  if(!blob){toast("Image indisponible sur cet appareil");return}
  if(lastURL)URL.revokeObjectURL(lastURL);
  lastURL=URL.createObjectURL(blob);
  const file=new File([blob],FICHIER,{type:"image/png"});
  let canShare=false;try{canShare=!!(navigator.canShare&&navigator.canShare({files:[file]}))}catch(e){}
  $("#sheet").innerHTML=`<div class="grab"></div><h2>Ma carte postale</h2>
   <p class="sub">Rien de personnel : ni notes, ni dates, ni hébergements, seulement le trajet, les tampons et l'adresse de l'app.</p>
   <img class="pc-img" id="pcimg" src="${lastURL}" width="${PC_W}" height="${PC_H}" alt="${esc(altText(d))}">
   <div class="row pc-row"><button class="btn primary" id="pcsave">Enregistrer l'image</button>${canShare?'<button class="btn" id="pcshare">Envoyer…</button>':""}<button class="btn ghost" id="pcclose">Fermer</button></div>`;
  $("#pcsave").onclick=()=>{
    const a=document.createElement("a");a.href=lastURL;a.download=FICHIER;
    document.body.appendChild(a);a.click();a.remove();toast("Image enregistrée");
  };
  if($("#pcshare"))$("#pcshare").onclick=()=>navigator.share({files:[file],title:`Carnet Péï · ${DEST.nom}`}).catch(()=>{});
  $("#pcclose").onclick=()=>dlg.close();
  if(!dlg.open)dlg.showModal();
  $("#pcsave").focus();
}

export function renderCartePostale(){
  const b=$("#postcard"),h=$("#postcard-hint");if(!b)return;
  const ok=hasTrip();
  if(ok)b.removeAttribute("aria-disabled");else b.setAttribute("aria-disabled","true");
  if(h)h.hidden=ok;
}

export function initCartePostale(){
  const b=$("#postcard");if(!b)return;
  b.addEventListener("click",openPostcard);
}
