/* Agenda : export du voyage en fichier .ics (RFC 5545), généré dans le navigateur, sans serveur.
   Un événement « toute la journée » par jour : les créneaux Matin / Après-midi / Soirée n'ont pas d'heure dans les données,
   on n'en invente donc aucune. */
import { SLOTS, BY, DEST } from "./data.js";
import { S } from "./state.js";
import { $, toast } from "./util.js";

const FICHIER="carnet-pei-voyage.ics";
// Rappel la veille : un événement « toute la journée » commence à minuit (heure locale du calendrier) ;
// -PT12H place donc le rappel la veille à midi. C'est un choix d'affichage, pas une donnée du module.
const TRIGGER_VEILLE="-PT12H";

// Texte du réflexe « Avant de marcher », repris mot pour mot de l'onglet Pratique (#reflexes), comme la vue Aujourd'hui.
export function reflexeMarche(){
  const p=$("#reflexes");if(!p)return"";
  const c=[...p.querySelectorAll(".check")].find(n=>/^Avant de marcher/.test((n.querySelector("b")||{}).textContent||""));
  const t=c&&c.querySelector("b")?c.querySelector("b").parentElement:null;
  return t?t.textContent.replace(/\s+/g," ").trim():"";
}

// Échappement des valeurs TEXT (RFC 5545 §3.3.11).
const escTxt=s=>String(s??"").replace(/\\/g,"\\\\").replace(/;/g,"\\;").replace(/,/g,"\\,").replace(/\r\n|\r|\n/g,"\\n");
// Pliage à 75 octets UTF-8 (hors CRLF), sans couper un caractère multi-octet ; la suite commence par une espace.
const enc=new TextEncoder();
export function fold(line){
  const out=[];let cur="",n=0,max=75;
  for(const ch of line){
    const b=enc.encode(ch).length;
    if(n+b>max){out.push(cur);cur=" ";n=1;max=75}
    cur+=ch;n+=b;
  }
  out.push(cur);return out.join("\r\n");
}
const isoDay=iso=>Date.UTC(+iso.slice(0,4),+iso.slice(5,7)-1,+iso.slice(8,10));
const plusJours=(iso,n)=>new Date(isoDay(iso)+n*864e5).toISOString().slice(0,10);
const dateICS=iso=>iso.replace(/-/g,"");
const stamp=d=>d.toISOString().replace(/[-:]/g,"").replace(/\.\d{3}/,"");

// Jours qui reçoivent le rappel « Avant de marcher » : un module du jour dont le champ `securite` contient "marche".
export function needsReminder(codes){
  return codes.some(c=>BY[c]?.sec.includes("marche"));
}

// Construit le calendrier du voyage ; null sans date d'arrivée.
export function buildICS(state=S,now=new Date(),reflexe=reflexeMarche()){
  if(!/^\d{4}-\d{2}-\d{2}$/.test(state.start||""))return null;
  const L=["BEGIN:VCALENDAR","VERSION:2.0","PRODID:-//Carnet Péï//FR","CALSCALE:GREGORIAN","METHOD:PUBLISH",
    "X-WR-CALNAME:"+escTxt(DEST.libelles.partage),"X-WR-TIMEZONE:"+DEST.fuseau];
  state.days.forEach((d,i)=>{
    const iso=plusJours(state.start,i);
    const codes=SLOTS.flatMap(([k])=>d.slots[k]).filter(c=>BY[c]);
    const zones=[...new Set(codes.map(c=>BY[c].z))];
    const desc=SLOTS.map(([k,v])=>{const l=d.slots[k].filter(c=>BY[c]);return l.length?l.map(c=>`${v} : ${c} ${BY[c].t}`).join("\n"):`${v} : créneau libre`});
    if(d.heb&&d.heb.trim())desc.push("Hébergement : "+d.heb.trim());
    if(d.notes&&d.notes.trim())desc.push("Notes : "+d.notes.trim());
    L.push("BEGIN:VEVENT",`UID:carnetpei-${iso}-J${i+1}@carnetpei`,"DTSTAMP:"+stamp(now),
      "DTSTART;VALUE=DATE:"+dateICS(iso),"DTEND;VALUE=DATE:"+dateICS(plusJours(iso,1)),
      "SUMMARY:"+escTxt(`J${i+1} · ${zones.join(", ")||"À composer"}`),
      "DESCRIPTION:"+escTxt(desc.join("\n")),"TRANSP:TRANSPARENT");
    if(reflexe&&needsReminder(codes))L.push("BEGIN:VALARM","ACTION:DISPLAY","TRIGGER:"+TRIGGER_VEILLE,"DESCRIPTION:"+escTxt(reflexe),"END:VALARM");
    L.push("END:VEVENT");
  });
  L.push("END:VCALENDAR");
  return L.map(fold).join("\r\n")+"\r\n";
}

export function renderAgenda(){
  const b=$("#agenda"),h=$("#agenda-hint");if(!b)return;
  const ok=/^\d{4}-\d{2}-\d{2}$/.test(S.start||"");
  if(ok)b.removeAttribute("aria-disabled");else b.setAttribute("aria-disabled","true");
  if(h)h.hidden=ok;
}

export function initAgenda(){
  const b=$("#agenda");if(!b)return;
  b.addEventListener("click",()=>{
    const ics=buildICS();
    if(!ics){toast("Indiquez votre date d'arrivée");$("#start").focus();return}
    const a=document.createElement("a");
    a.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar;charset=utf-8"}));
    a.download=FICHIER;
    document.body.appendChild(a);a.click();a.remove();
    setTimeout(()=>URL.revokeObjectURL(a.href),1000);
    toast("Fichier agenda téléchargé");
  });
  $("#start").addEventListener("change",renderAgenda);
}
