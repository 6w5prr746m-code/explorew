/* Carnet Péï — application (vanilla JS, sans build) */
(function(){
"use strict";
const PROFILES={AV:"Aventurier",LA:"Lagon & farniente",RA:"Randonneur",EP:"Épicurien & culture",FA:"Famille",SL:"Slow & responsable",PB:"Plan B pluie",NE:"Nuit & étoiles"};
const ZONES=["Ouest","Hauts","Sud","Sud sauvage","Volcan","Est","Nord","Cilaos","Salazie","Mafate","Cirques","Toute l'île"];
const PICTOS={FAM:"Famille",BUS:"Sans voiture","€":"Petit budget",PLUIE:"Jour de pluie",AUBE:"Lève-tôt",LOCAL:"Rencontre"};
const SLOTS=[["m","Matin"],["a","Après-midi"],["s","Soirée"]];

// ---------- données ----------
// Les modules sont chargés par boot.js depuis data/modules.json
const MODS=window.__MODULES.map(m=>({c:m.code,p:m.code.slice(0,2),t:m.titre,z:m.zone,l:m.lieu,d:m.duree,n:m.niveau,b:m.budget,f:m.filtres,e:m.essentiel,a:m.astuce,pb:m.planB,k:m.combo,full:m.fiche==="complete",geo:m.geo}));
const BY=Object.fromEntries(MODS.map(m=>[m.c,m]));
document.getElementById("nbmod").textContent=MODS.length;

// ---------- état ----------
const KEY="carnetpei.v1";
const EXAMPLE={7:[{m:[],a:["LA-D1"],s:["NE-16"]},{m:["RA-D1"],a:["AV-D1"],s:[]},{m:[],a:["RA-D15"],s:[]},{m:["AV-D2"],a:["LA-D15"],s:[]},{m:["EP-D18"],a:["EP-D4"],s:[]},{m:["AV-J1"],a:["FA-03"],s:[]},{m:["LA-J1"],a:[],s:[]}]};
function blankDay(){return{slots:{m:[],a:[],s:[]},heb:"",bud:"",coeur:"",notes:""}}
function exampleState(){return{fmt:7,start:"",example:true,days:EXAMPLE[7].map(s=>({...blankDay(),slots:JSON.parse(JSON.stringify(s))})),stamps:{},words:["Ti lampé = doucement, petit à petit"],back:"",checks:{}}}
let S;
try{S=JSON.parse(localStorage.getItem(KEY))}catch(e){S=null}
if(!S||!Array.isArray(S.days))S=exampleState();
let saveT;function save(){clearTimeout(saveT);saveT=setTimeout(()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}},250)}
function touched(){if(S.example){S.example=false}save()}

// ---------- utilitaires ----------
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const col=p=>`var(--${p})`;
function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
function dayDate(i){if(!S.start)return"";const d=new Date(S.start+"T12:00:00");d.setDate(d.getDate()+i);return d.toLocaleDateString("fr-FR",{weekday:"short",day:"numeric",month:"short"})}
function inTrip(code){return S.days.some(d=>SLOTS.some(([k])=>d.slots[k].includes(code)))}
function niveau(n){return n?["","accessible","en forme","sportif"][n]:""}

// ---------- explorer ----------
const F={q:"",p:"",z:"",n:"",pic:new Set()};
function buildFilters(){
  const pr=$("#profiles");
  pr.innerHTML=`<button class="chip" aria-pressed="true" data-p="">Tous</button>`+Object.entries(PROFILES).map(([k,v])=>`<button class="chip" style="--c:${col(k)}" aria-pressed="false" data-p="${k}"><span class="dot"></span>${v}</button>`).join("");
  pr.onclick=e=>{const b=e.target.closest("button");if(!b)return;F.p=b.dataset.p;pr.querySelectorAll("button").forEach(x=>x.setAttribute("aria-pressed",x===b));renderList()};
  $("#zone").innerHTML=`<option value="">Toutes zones</option>`+ZONES.map(z=>`<option>${z}</option>`).join("");
  $("#zone").onchange=e=>{F.z=e.target.value;renderList()};
  $("#niveau").onchange=e=>{F.n=e.target.value;renderList()};
  $("#pictos").innerHTML=Object.entries(PICTOS).map(([k,v])=>`<button class="picto" aria-pressed="false" data-k="${k}" title="${v}">${k}</button>`).join("");
  $("#pictos").onclick=e=>{const b=e.target.closest("button");if(!b)return;const k=b.dataset.k;F.pic.has(k)?F.pic.delete(k):F.pic.add(k);b.setAttribute("aria-pressed",F.pic.has(k));renderList()};
  $("#q").oninput=e=>{F.q=e.target.value.trim().toLowerCase();renderList()};
}
function norm(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}
function renderList(){
  const q=norm(F.q);
  const rows=MODS.filter(m=>(!F.p||m.p===F.p)&&(!F.z||m.z===F.z)&&(!F.n||m.n==F.n)&&[...F.pic].every(k=>m.f.includes(k))&&(!q||norm(m.c+" "+m.t+" "+m.l+" "+m.e+" "+m.z).includes(q)));
  if(window.__PEI){window.__PEI.rows=rows;window.__PEI.renderMap&&window.__PEI.renderMap(rows)}
  $("#count").textContent=rows.length+(rows.length>1?" modules":" module")+(F.p?" · "+PROFILES[F.p]:"");
  $("#list").innerHTML=rows.length?rows.map(m=>{
    const meta=[m.z!==m.l?m.l:m.z,m.d,m.n?"niv. "+m.n:"",m.b].filter(Boolean).join(" · ");
    return `<div class="card" style="--c:${col(m.p)}" data-c="${m.c}" role="button" tabindex="0">
      <div><span class="code">${m.c}</span><h3>${esc(m.t)}</h3><div class="meta">${esc(meta)}</div>${m.f.length?`<div class="tags">${m.f.map(f=>`<span class="tag">${esc(f)}</span>`).join("")}</div>`:""}</div>
      <button class="add ${inTrip(m.c)?"on":""}" data-add="${m.c}" aria-label="${inTrip(m.c)?"Déjà dans mon voyage":"Ajouter à mon voyage"}">${inTrip(m.c)?"✓":"+"}</button></div>`}).join(""):`<div class="empty">Aucun module ne correspond. Retirez un filtre.</div>`;
}
$("#list").addEventListener("click",e=>{const a=e.target.closest("[data-add]");if(a){openModule(a.dataset.add,true);return}const c=e.target.closest(".card");if(c)openModule(c.dataset.c)});
$("#list").addEventListener("keydown",e=>{if(e.key==="Enter"&&e.target.classList.contains("card"))openModule(e.target.dataset.c)});

// ---------- fiche module ----------
const dlg=$("#dlg");
dlg.addEventListener("click",e=>{if(e.target===dlg)dlg.close()});
function refLink(code){return BY[code]?`<button class="link" data-open="${code}">${code} · ${esc(BY[code].t)}</button>`:esc(code)}
function openModule(code,focusAdd){
  const m=BY[code];if(!m)return;
  const facts=[["Zone",m.z],["Lieu",m.l],m.d&&["Durée",m.d],m.n&&["Niveau",m.n+" · "+niveau(m.n)],m.b&&["Budget",m.b]].filter(Boolean);
  const dayOpts=S.days.map((d,i)=>`<option value="${i}">J${i+1}${S.start?" · "+dayDate(i):""}</option>`).join("");
  $("#sheet").innerHTML=`<div class="grab"></div>${window.__PEI&&window.__PEI.banner?window.__PEI.banner(m):""}
    <span class="code" style="--c:${col(m.p)}">${m.c} · ${PROFILES[m.p]}</span>
    <h2>${esc(m.t)}</h2>
    <p style="margin:0">${esc(m.e)}</p>
    <div class="facts">${facts.map(([k,v])=>`<div class="fact"><span class="lbl">${k}</span><b>${esc(v)}</b></div>`).join("")}</div>
    ${m.f.length?`<div class="tags" style="margin-bottom:6px">${m.f.map(f=>`<span class="tag">${esc(f)} · ${PICTOS[f]||""}</span>`).join("")}</div>`:""}
    ${m.a?`<div class="block"><span class="lbl">Ce qu'on ne vous dit pas</span><p>${esc(m.a)}</p></div>`:""}
    ${m.pb?`<div class="block"><span class="lbl">Plan B</span><p>${refLink(m.pb)}</p></div>`:""}
    ${m.k?`<div class="block"><span class="lbl">${m.full?"À combiner avec":"Fiche détaillée"}</span><p>${refLink(m.k)}</p></div>`:""}
    <div class="block" id="pick"><span class="lbl">Ajouter à mon voyage</span>
      <div class="picker"><div class="row"><select id="pday" aria-label="Jour">${dayOpts}</select><select id="pslot" aria-label="Créneau">${SLOTS.map(([k,v])=>`<option value="${k}">${v}</option>`).join("")}</select></div>
      <div class="row"><button class="btn primary" id="padd">Ajouter</button><button class="btn ghost" id="pclose">Fermer</button></div></div></div>`;
  $("#sheet").onclick=e=>{const o=e.target.closest("[data-open]");if(o)openModule(o.dataset.open)};
  $("#padd").onclick=()=>{const i=+$("#pday").value,k=$("#pslot").value;S.days[i].slots[k].push(code);touched();dlg.close();toast(`Ajouté au jour ${i+1}`);renderAll()};
  $("#pclose").onclick=()=>dlg.close();
  if(!dlg.open)dlg.showModal();
  $("#sheet").scrollTop=0;
  if(focusAdd)$("#pick").scrollIntoView({block:"end"});
}

// ---------- voyage ----------
function resizeDays(n){while(S.days.length<n)S.days.push(blankDay());if(S.days.length>n)S.days.length=n}
$("#fmt").onchange=e=>{const n=+e.target.value;const dropped=S.days.slice(n).some(d=>SLOTS.some(([k])=>d.slots[k].length));if(dropped&&!confirm("Les jours au-delà de J"+n+" contiennent des modules. Les supprimer ?")){e.target.value=S.fmt;return}S.fmt=n;resizeDays(n);touched();renderTrip()};
$("#start").onchange=e=>{S.start=e.target.value;touched();renderTrip()};
$("#reset").onclick=()=>{if(!confirm("Vider tous les jours du voyage ?"))return;S.days=S.days.map(()=>blankDay());S.example=false;save();renderAll();toast("Voyage vidé")};
function renderTrip(){
  $("#fmt").value=S.fmt;$("#start").value=S.start||"";
  let placed=0,free=0,bud=0;
  S.days.forEach(d=>{SLOTS.forEach(([k])=>{placed+=d.slots[k].length;if(!d.slots[k].length)free++});bud+=parseFloat(String(d.bud).replace(",","."))||0});
  $("#k-mod").textContent=placed;$("#k-free").textContent=free;$("#k-bud").textContent=Math.round(bud).toLocaleString("fr-FR")+" €";
  $("#exnote").innerHTML=S.example?`<div class="note-ex"><span><b>Exemple</b> : la trame « 7 jours · Ouest, Cilaos & Volcan » du Book. Modifiez-la ou videz-la pour composer la vôtre.</span><button class="btn small" id="exclear">Partir de zéro</button></div>`:"";
  if(S.example)$("#exclear").onclick=()=>$("#reset").click();
  const open=new Set([...document.querySelectorAll("#days details[open]")].map(d=>d.dataset.i));
  $("#days").innerHTML=S.days.map((d,i)=>{
    const codes=SLOTS.flatMap(([k])=>d.slots[k]);
    const zones=[...new Set(codes.map(c=>BY[c]&&BY[c].z).filter(Boolean))];
    const dots=SLOTS.map(([k])=>{const c=d.slots[k][0];return `<i class="${c?"f":""}" style="--c:${c?col(BY[c]?.p||"LA"):"var(--line)"}"></i>`}).join("");
    return `<details class="day" data-i="${i}" ${open.has(String(i))||(!open.size&&i===0)?"open":""}>
      <summary><span class="dnum">J${i+1}</span><span class="dsum"><span class="d">${dayDate(i)||"Jour "+(i+1)}</span><div class="z">${zones.join(" · ")||"À composer"}</div></span><span class="dots">${dots}</span></summary>
      <div class="dbody">
        ${SLOTS.map(([k,v])=>`<div class="slot"><div class="h"><span class="lbl">${v}</span><button class="btn small ghost" data-browse="${i}:${k}">+ Module</button></div>
          ${d.slots[k].map((c,j)=>BY[c]?`<div class="pill" style="--c:${col(BY[c].p)}"><span class="code">${c}</span><button class="t" data-open="${c}">${esc(BY[c].t)}</button><button class="x" data-rm="${i}:${k}:${j}" aria-label="Retirer">×</button></div>`:"").join("")}</div>`).join("")}
        <div class="fields">
          <label>Hébergement<input id="heb${i}" data-f="${i}:heb" value="${esc(d.heb)}" placeholder="Gîte, hôtel…"></label>
          <label>Budget du jour (€)<input id="bud${i}" data-f="${i}:bud" inputmode="decimal" value="${esc(d.bud)}" placeholder="0"></label>
          <label class="wide">Coup de cœur du jour<input id="coeur${i}" data-f="${i}:coeur" value="${esc(d.coeur)}" placeholder="Le moment à retenir"></label>
          <label class="wide">Notes / ressentis<textarea id="notes${i}" data-f="${i}:notes" rows="2" placeholder="Rencontre, saveur, mot créole appris…">${esc(d.notes)}</textarea></label>
        </div></div></details>`}).join("");
  const n=placed;const b=$("#tripbadge");b.hidden=!n;b.textContent=n;
}
$("#days").addEventListener("click",e=>{
  const rm=e.target.closest("[data-rm]");if(rm){const[i,k,j]=rm.dataset.rm.split(":");S.days[+i].slots[k].splice(+j,1);touched();renderAll();return}
  const o=e.target.closest("[data-open]");if(o){openModule(o.dataset.open);return}
  const br=e.target.closest("[data-browse]");if(br){const[i,k]=br.dataset.browse.split(":");pendingSlot={i:+i,k};switchView("explore");toast(`Choisissez un module pour J${+i+1} · ${SLOTS.find(s=>s[0]===k)[1]}`)}
});
$("#days").addEventListener("input",e=>{const f=e.target.dataset.f;if(!f)return;const[i,key]=f.split(":");S.days[+i][key]=e.target.value;touched();if(key==="bud"){let bud=0;S.days.forEach(d=>bud+=parseFloat(String(d.bud).replace(",","."))||0);$("#k-bud").textContent=Math.round(bud).toLocaleString("fr-FR")+" €"}if(key==="coeur")renderCarnet()});
let pendingSlot=null;
const _open=openModule;
openModule=function(code,focusAdd){_open(code,focusAdd||!!pendingSlot);if(pendingSlot&&$("#pday")){$("#pday").value=pendingSlot.i;$("#pslot").value=pendingSlot.k;pendingSlot=null}};

$("#print").onclick=()=>{
  $("#printout").innerHTML=`<h1>Carnet Péï · mon voyage de ${S.fmt} jours</h1>`+S.days.map((d,i)=>`<div class="pd"><b>J${i+1}${S.start?" · "+dayDate(i):""}</b><br>${SLOTS.map(([k,v])=>`${v} : ${d.slots[k].map(c=>BY[c]?c+" "+BY[c].t:c).join(", ")||"—"}`).join("<br>")}${d.heb?`<br>Hébergement : ${esc(d.heb)}`:""}${d.bud?` · Budget : ${esc(d.bud)} €`:""}${d.coeur?`<br>Coup de cœur : ${esc(d.coeur)}`:""}${d.notes?`<br>Notes : ${esc(d.notes)}`:""}</div>`).join("");
  try{window.print()}catch(e){toast("Impression indisponible ici")}
};

// ---------- carnet ----------
const STAMPS=[["cilaos","Cirque de Cilaos","RA"],["salazie","Cirque de Salazie","LA"],["mafate","Cirque de Mafate","EP"],["volcan","Piton de la Fournaise","AV"],["lagon","Lagon","LA"],["table","Table créole","EP"]];
function renderCarnet(){
  $("#stamps").innerHTML=STAMPS.map(([k,v,p])=>`<button class="stamp ${S.stamps[k]?"on":""}" style="--c:${col(p)}" data-s="${k}" aria-pressed="${!!S.stamps[k]}">${v}</button>`).join("");
  $("#words").innerHTML=S.words.map((w,i)=>`<div><span>${esc(w)}</span><button class="link" data-w="${i}" aria-label="Supprimer">retirer</button></div>`).join("")||`<p class="sub">Un mot par jour, avec qui vous l'a appris.</p>`;
  const hearts=S.days.map((d,i)=>d.coeur?`<div><span><b>J${i+1}</b> · ${esc(d.coeur)}</span></div>`:"").join("");
  $("#hearts").innerHTML=hearts||`<p class="sub">Vos coups de cœur saisis dans « Mon voyage » s'affichent ici.</p>`;
  $("#back").value=S.back||"";
}
$("#stamps").onclick=e=>{const b=e.target.closest("[data-s]");if(!b)return;S.stamps[b.dataset.s]=!S.stamps[b.dataset.s];save();renderCarnet()};
$("#wordform").onsubmit=e=>{e.preventDefault();const v=$("#word").value.trim();if(!v)return;S.words.unshift(v);$("#word").value="";save();renderCarnet()};
$("#words").onclick=e=>{const b=e.target.closest("[data-w]");if(!b)return;S.words.splice(+b.dataset.w,1);save();renderCarnet()};
$("#back").oninput=e=>{S.back=e.target.value;save()};

// ---------- pratique ----------
const CHECK=["Chaussures de randonnée rodées + sandales","Sac 20–30 L, 2 L d'eau par personne et par rando","Polaire, coupe-vent, bonnet et gants (volcan, Piton des Neiges)","Crème solaire respectueuse du récif, chapeau, lunettes","Masque, tuba, chaussons d'eau","Lampe frontale","Répulsif moustiques, petite trousse de secours","Sac pour redescendre ses déchets","Cartes hors ligne, batterie externe","Argent liquide pour Mafate"];
const LEX=[["Bonjour / Bonswar","Bonjour / Bonsoir"],["Koman i lé ?","Comment ça va ?"],["Lé la, lé bon","Ça va, c'est bon"],["Mersi in pil","Merci beaucoup"],["Kombien i kout ?","Combien ça coûte ?"],["Mi konpran pa","Je ne comprends pas"],["Marmay","Les enfants"],["Ti lampé","Doucement, petit à petit"],["Péï","Du pays, local"],["Kaz","Maison"],["Zourit","Poulpe"]];
function renderPrat(){
  $("#checklist").innerHTML=CHECK.map((c,i)=>`<label class="check"><input type="checkbox" id="ck${i}" data-ck="${i}" ${S.checks[i]?"checked":""}><span>${esc(c)}</span></label>`).join("");
  $("#lex").innerHTML=LEX.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join("");
}
$("#checklist").onchange=e=>{const i=e.target.dataset.ck;if(i==null)return;S.checks[i]=e.target.checked;save()};

// ---------- navigation ----------
function switchView(v){
  document.querySelectorAll("section.view").forEach(s=>s.hidden=s.id!=="v-"+v);
  document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.v===v));
  window.scrollTo(0,0);
  if(v==="explore")renderList();
}
document.querySelector("nav.tabs").onclick=e=>{const b=e.target.closest("button");if(b)switchView(b.dataset.v)};

function renderAll(){renderList();renderTrip();renderCarnet()}
window.__PEI={MODS,BY,PROFILES,PICTOS,S,SLOTS,save,renderAll,toast,dayDate,switchView,openModule:(c,f)=>openModule(c,f)};
buildFilters();renderPrat();

// ---------- hors ligne ----------

})();

/* ===== V2 : carte, visuels, partage, Book imprimé ===== */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const APP=window.__PEI;
const {MODS,BY,PROFILES,S,SLOTS}=APP;

// ---------- géographie (coordonnées approximatives) ----------
const OUTLINE=[[55.45,-20.872],[55.53,-20.89],[55.61,-20.905],[55.66,-20.95],[55.72,-21.02],[55.79,-21.12],[55.83,-21.18],[55.84,-21.26],[55.80,-21.33],[55.77,-21.365],[55.70,-21.382],[55.62,-21.388],[55.55,-21.377],[55.48,-21.347],[55.41,-21.30],[55.34,-21.282],[55.29,-21.222],[55.278,-21.17],[55.23,-21.08],[55.215,-21.03],[55.26,-21.0],[55.29,-20.935],[55.36,-20.925],[55.41,-20.882]];
const LOC=[["Colimaçons",55.30,-21.13],["Mascarin",55.30,-21.13],["Pointe au Sel",55.285,-21.20],["Piton Saint-Leu",55.32,-21.19],["Saint-Leu",55.285,-21.17],["Étang-Salé",55.34,-21.27],["Ermitage",55.225,-21.08],["La Saline",55.235,-21.10],["Boucan",55.222,-21.035],["Roches Noires",55.222,-21.05],["Saint-Gilles",55.225,-21.055],["Cap La Houssaye",55.235,-21.018],["Le Guillaume",55.32,-21.03],["Bellemène",55.31,-21.02],["Saint-Paul",55.27,-21.005],["Les Avirons",55.34,-21.24],["Maïdo",55.383,-21.071],["Dos d'Âne",55.40,-20.99],["Aurère",55.43,-21.00],["Col des Bœufs",55.47,-21.045],["La Nouvelle",55.43,-21.07],["Marla",55.445,-21.10],["Mafate",55.42,-21.06],["Taïbit",55.46,-21.115],["Caverne Dufour",55.48,-21.095],["Piton des Neiges",55.48,-21.10],["Cilaos",55.472,-21.135],["Bélouve",55.545,-21.07],["Trou de Fer",55.55,-21.08],["Hell-Bourg",55.52,-21.065],["Salazie",55.54,-21.03],["Bébour",55.58,-21.11],["Plaine des Palmistes",55.63,-21.13],["Palmistes",55.63,-21.13],["Bourg-Murat",55.57,-21.21],["Plaine des Cafres",55.57,-21.21],["Pas de Bellecombe",55.688,-21.22],["Route du Volcan",55.63,-21.22],["Makes",55.41,-21.20],["Entre-Deux",55.47,-21.25],["Bois Court",55.55,-21.22],["Le Tampon",55.52,-21.27],["Tampon",55.52,-21.27],["Pierrefonds",55.43,-21.32],["Saint-Louis",55.41,-21.285],["Saint-Pierre",55.478,-21.34],["Petite-Île",55.55,-21.37],["Grande Anse",55.55,-21.37],["Manapany",55.595,-21.375],["Hauts de Saint-Joseph",55.62,-21.33],["Saint-Joseph",55.62,-21.38],["Langevin",55.645,-21.37],["Le Tremblet",55.80,-21.30],["Route des Laves",55.81,-21.25],["Saint-Philippe",55.765,-21.36],["Cap Méchant",55.73,-21.375],["Sainte-Rose",55.795,-21.13],["Anse des Cascades",55.82,-21.17],["Sainte-Anne",55.74,-21.06],["Saint-Benoît",55.715,-21.035],["Bras-Panon",55.68,-21.0],["Saint-André",55.65,-20.965],["Sainte-Suzanne",55.61,-20.91],["Hauts de Saint-Denis",55.46,-20.93],["Plaine des Chicots",55.45,-20.95],["Saint-Denis",55.45,-20.885]];
const ZC={"Ouest":[55.25,-21.06],"Hauts":[55.36,-21.09],"Sud":[55.47,-21.31],"Sud sauvage":[55.72,-21.35],"Volcan":[55.66,-21.22],"Est":[55.69,-21.06],"Nord":[55.46,-20.9],"Cilaos":[55.47,-21.135],"Salazie":[55.53,-21.05],"Mafate":[55.43,-21.07],"Cirques":[55.48,-21.09],"Toute l'île":[55.52,-21.15]};
const W=660,H=590,K=1000;
const P=([lo,la])=>[(lo-55.2)*K+10,(la*-1-20.86)*K*1.07+10];
function locate(m){if(m.geo)return[m.geo.lng,m.geo.lat];const s=(m.l+" "+m.t);for(const [k,lo,la] of LOC){if(s.includes(k))return[lo,la]}return ZC[m.z]||ZC["Toute l'île"]}
// dispersion légère des points superposés
const PT={};(function(){const seen={};MODS.forEach(m=>{let [x,y]=P(locate(m));const key=Math.round(x/6)+":"+Math.round(y/6);const n=seen[key]=(seen[key]||0)+1;if(n>1){const a=n*2.4,r=5+2.2*Math.sqrt(n);x+=Math.cos(a)*r;y+=Math.sin(a)*r}PT[m.c]=[x,y]})})();
const coast=(()=>{const pts=OUTLINE.map(P),n=pts.length,mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2],f=v=>v.map(x=>x.toFixed(1)).join(",");let d="M"+f(mid(pts[n-1],pts[0]));for(let i=0;i<n;i++)d+="Q"+f(pts[i])+" "+f(mid(pts[i],pts[(i+1)%n]));return d+"Z"})();
function circle(c,r,label,dy){const [x,y]=P(c);return `<circle cx="${x}" cy="${y}" r="${r}" class="mz"/><text x="${x}" y="${y+dy}" class="ml">${label}</text>`}

APP.renderMap=function(rows){
  const el=$("#map");if(!el||el.hidden)return;
  const trip=[];S.days.forEach((d,i)=>SLOTS.forEach(([k])=>d.slots[k].forEach(c=>{if(PT[c])trip.push([i+1,c])})));
  const route=trip.length>1?`<polyline class="route" points="${trip.map(([,c])=>PT[c].join(",")).join(" ")}"/>`:"";
  el.innerHTML=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Carte de La Réunion avec ${rows.length} modules">
    <defs><pattern id="sea" width="14" height="14" patternUnits="userSpaceOnUse"><path d="M0 7q3.5-3 7 0t7 0" class="wave"/></pattern></defs>
    <rect width="${W}" height="${H}" fill="url(#sea)"/>
    <path d="${coast}" class="land"/>
    ${circle([55.42,-21.06],38,"Mafate",-44)}${circle([55.53,-21.05],36,"Salazie",-42)}${circle([55.47,-21.135],34,"Cilaos",48)}${circle([55.705,-21.235],40,"Volcan",-46)}
    <text x="${P([55.45,-20.875])[0]}" y="${P([55.45,-20.875])[1]-8}" class="city">Saint-Denis</text>
    <text x="${P([55.478,-21.345])[0]}" y="${P([55.478,-21.345])[1]+18}" class="city">Saint-Pierre</text>
    <text x="${P([55.225,-21.055])[0]-6}" y="${P([55.225,-21.055])[1]}" class="city" text-anchor="end">St-Gilles</text>
    <text x="${P([55.70,-20.99])[0]+8}" y="${P([55.70,-20.99])[1]}" class="city" text-anchor="start">St-Benoît</text>
    ${route}
    ${rows.map(m=>{const [x,y]=PT[m.c];return `<circle class="pin" cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="6" style="fill:var(--${m.p})" data-c="${m.c}" tabindex="0"><title>${m.c} · ${esc(m.t)}</title></circle>`}).join("")}
    ${trip.map(([d,c])=>{const [x,y]=PT[c];return `<g class="tp" data-c="${c}"><circle cx="${x}" cy="${y}" r="10"/><text x="${x}" y="${y+3.5}">${d}</text></g>`}).join("")}
  </svg>
  <p class="sub">Tracé et positions approximatifs. Les pastilles numérotées sont les jours de votre voyage.</p>`;
};
document.addEventListener("click",e=>{const p=e.target.closest("#map [data-c]");if(p)APP.openModule(p.dataset.c)});

// ---------- visuels générés ----------
const SEA=["Ouest","Sud","Sud sauvage"],MOUNT=["Hauts","Cilaos","Salazie","Mafate","Cirques","Nord"];
APP.banner=function(m){
  const c=`var(--${m.p})`;let art;
  if(m.z==="Volcan")art=`<path d="M0 90 L130 90 L200 34 L226 30 L300 90 L400 90Z" fill="${c}" opacity=".85"/><path d="M200 34q13-18 26-4" stroke="${c}" stroke-width="3" fill="none" opacity=".5"/><circle cx="330" cy="26" r="11" fill="${c}" opacity=".35"/>`;
  else if(SEA.includes(m.z))art=`<circle cx="310" cy="30" r="14" fill="${c}" opacity=".45"/><path d="M0 62q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V90H0Z" fill="${c}" opacity=".35"/><path d="M0 74q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V90H0Z" fill="${c}" opacity=".7"/>`;
  else if(m.z==="Est")art=`<path d="M0 90 L60 40 L120 70 L190 22 L260 64 L330 36 L400 70 L400 90Z" fill="${c}" opacity=".75"/>${[40,90,150,210,270,330].map((x,i)=>`<path d="M${x} ${6+i%2*6}l-6 14" stroke="${c}" stroke-width="2" opacity=".4"/>`).join("")}`;
  else art=`<path d="M0 90 L50 50 L100 70 L160 18 L230 60 L290 30 L350 64 L400 44 L400 90Z" fill="${c}" opacity=".45"/><path d="M0 90 L70 62 L140 80 L220 46 L300 78 L400 60 L400 90Z" fill="${c}" opacity=".85"/>`;
  return `<svg class="banner" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="400" height="90" fill="${c}" opacity=".08"/>${art}</svg>`;
};

// ---------- partage ----------
const b64=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
const unb64=s=>decodeURIComponent(escape(atob(s.replace(/-/g,"+").replace(/_/g,"/"))));
APP.encodeTrip=()=>b64(JSON.stringify({v:1,f:S.fmt,s:S.start||"",d:S.days.map(d=>SLOTS.map(([k])=>d.slots[k]))}));
APP.decodeTrip=code=>{const o=JSON.parse(unb64(code.trim().replace(/^.*#t=/,"")));if(!o||!Array.isArray(o.d))throw 0;return o};
APP.applyTrip=o=>{S.fmt=o.f;S.start=o.s||"";S.example=false;S.days=o.d.map(sl=>{const d={slots:{m:[],a:[],s:[]},heb:"",bud:"",coeur:"",notes:""};SLOTS.forEach(([k],j)=>d.slots[k]=(sl[j]||[]).filter(c=>BY[c]));return d});APP.save();APP.renderAll()};
})();

/* ===== V2 : interface ===== */
(function(){
"use strict";
const $=s=>document.querySelector(s);
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const APP=window.__PEI;const {S,SLOTS,BY,MODS,PROFILES,PICTOS}=APP;
const BASE=location.origin+location.pathname;

// Liste / Carte
function setMode(map){$("#segList").setAttribute("aria-pressed",!map);$("#segMap").setAttribute("aria-pressed",map);$("#list").hidden=map;$("#map").hidden=!map;if(map)APP.renderMap(APP.rows||MODS)}
$("#segList").onclick=()=>setMode(false);$("#segMap").onclick=()=>setMode(true);
$("#tripmap").onclick=()=>{APP.switchView("explore");setMode(true)};

// Partage
const dlg=$("#dlg");
$("#share").onclick=()=>{
  const code=APP.encodeTrip();const link=BASE+"#t="+code;
  $("#sheet").innerHTML=`<div class="grab"></div><h2>Partager mon voyage</h2>
   <p class="sub">Le lien contient uniquement le format, la date et les modules placés : ni notes, ni budget, ni hébergements.</p>
   <div class="qr" id="qr"></div>
   <label class="lbl" for="sharelink">Lien</label><textarea id="sharelink" rows="3" readonly>${esc(link)}</textarea>
   <div class="row"><button class="btn primary" id="copy">Copier le lien</button>${navigator.share?'<button class="btn" id="nshare">Envoyer…</button>':""}<button class="btn ghost" id="sclose">Fermer</button></div>
   <p class="sub">La personne qui reçoit le lien peut aussi le coller dans « Importer ».</p>`;
  try{new QRCode($("#qr"),{text:link,width:180,height:180,correctLevel:QRCode.CorrectLevel.L})}catch(e){$("#qr").remove()}
  $("#copy").onclick=async()=>{try{await navigator.clipboard.writeText(link);APP.toast("Lien copié")}catch(e){$("#sharelink").select();APP.toast("Sélectionné : copiez-le")}};
  if($("#nshare"))$("#nshare").onclick=()=>navigator.share({title:"Mon voyage à La Réunion",text:"Mon itinéraire Carnet Péï",url:link}).catch(()=>{});
  $("#sclose").onclick=()=>dlg.close();
  if(!dlg.open)dlg.showModal();
};
$("#import").onclick=()=>{
  $("#sheet").innerHTML=`<div class="grab"></div><h2>Importer un voyage</h2>
   <p class="sub">Collez un lien ou un code de voyage reçu. Il remplacera les modules de votre voyage actuel ; vos notes du carnet sont conservées.</p>
   <textarea id="impcode" rows="4" placeholder="https://…#t=…"></textarea>
   <div class="row"><button class="btn primary" id="impgo">Importer</button><button class="btn ghost" id="impclose">Annuler</button></div>`;
  $("#impgo").onclick=()=>{try{APP.applyTrip(APP.decodeTrip($("#impcode").value));dlg.close();APP.toast("Voyage importé")}catch(e){APP.toast("Code illisible : vérifiez le lien copié")}};
  $("#impclose").onclick=()=>dlg.close();
  if(!dlg.open)dlg.showModal();
};
// lien reçu
try{const h=location.hash;if(h.startsWith("#t=")){const o=APP.decodeTrip(h);if(confirm("Un voyage de "+o.f+" jours vous a été partagé. L'importer à la place du vôtre ?")){APP.applyTrip(o);APP.switchView("trip")}history.replaceState(null,"",location.pathname)}}catch(e){}

// Book imprimé complet
function fiche(m){
  const facts=[m.z+(m.l&&m.l!==m.z?" · "+m.l:""),m.d,m.n?"niveau "+m.n:"",m.b,m.f.join(" ")].filter(Boolean).join("  |  ");
  const ref=c=>BY[c]?c+" "+BY[c].t:c;
  return `<article class="bf" style="--c:var(--${m.p})"><div class="bh"><span class="bc">${m.c}</span><h4>${esc(m.t)}</h4></div>
   <p class="bm">${esc(facts)}</p><p>${esc(m.e)}</p>
   ${m.a?`<p><b>Ce qu'on ne vous dit pas.</b> ${esc(m.a)}</p>`:""}
   ${m.pb?`<p><b>Plan B.</b> ${esc(ref(m.pb))}</p>`:""}${m.k?`<p><b>${m.full?"À combiner avec":"Voir aussi"}.</b> ${esc(ref(m.k))}</p>`:""}
   <p class="bn">Fait le ___ / ___ &nbsp;·&nbsp; Ma note ☆☆☆☆☆ &nbsp;·&nbsp; ________________________</p></article>`;
}
window.__printBook=function(){
  const grid=`<section class="bp"><h3>Grille du jour</h3><table class="bg">${["Jour · date","Zone / camp de base","Matin","Après-midi","Soirée","Hébergement","Budget prévu / dépensé","Météo · plan B","Coup de cœur","Notes / ressentis"].map(r=>`<tr><th>${r}</th><td></td></tr>`).join("")}</table></section>`;
  const trip=S.days.some(d=>SLOTS.some(([k])=>d.slots[k].length))?`<section class="bp"><h3>Mon itinéraire · ${S.fmt} jours</h3>${S.days.map((d,i)=>`<p class="bday"><b>J${i+1}${S.start?" · "+APP.dayDate(i):""}</b> — ${SLOTS.map(([k,v])=>v+" : "+(d.slots[k].map(c=>BY[c]?c+" "+BY[c].t:c).join(", ")||"—")).join(" · ")}</p>`).join("")}</section>`:"";
  $("#printout").innerHTML=`<section class="bcover"><p class="bk">Carnet de voyage interactif</p><h1>1001 façons de découvrir La Réunion</h1><p>${MODS.length} modules à piocher · 8 profils · formats de 7 à 30 jours</p><p class="bsrc">Source principale : reunion.fr (Île de la Réunion Tourisme). Horaires, tarifs et accès à vérifier avant de partir. Édition du ${new Date().toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"})}.</p></section>
  <section class="bp"><h3>Mode d'emploi</h3><p>1. Choisissez votre durée. 2. Choisissez un ou deux profils. 3. Piochez les modules et reportez leur code dans la grille du jour. 4. Vérifiez la météo et les réservations.</p><p><b>Niveaux</b> : 1 accessible à tous · 2 bonne condition · 3 sportif. <b>Budget</b> : € jusqu'à 20 € · €€ 20 à 80 € · €€€ plus de 80 € par personne.</p><p><b>Pictos</b> : ${Object.entries(PICTOS).map(([k,v])=>k+" "+v).join(" · ")}.</p><p><b>Règles d'or</b> : un camp de base par zone, les Hauts le matin, le littoral l'après-midi, une journée tampon tous les 4 à 5 jours. Baignade uniquement dans le lagon ou les zones surveillées. Urgences : 112, 15, 18.</p></section>
  ${trip}${grid}
  ${Object.entries(PROFILES).map(([p,name])=>`<section class="bprof"><h2 style="--c:var(--${p})">${name}</h2>${MODS.filter(m=>m.p===p).map(fiche).join("")}</section>`).join("")}
  <section class="bp"><h3>Index des modules</h3><div class="bidx">${MODS.map(m=>`<span><b>${m.c}</b> ${esc(m.t)}</span>`).join("")}</div></section>`;
  document.body.classList.add("book");
};
window.addEventListener("afterprint",()=>document.body.classList.remove("book"));
$("#printbook").onclick=()=>{window.__printBook();try{window.print()}catch(e){APP.toast("Impression indisponible ici")}};

APP.renderAll();
})();
