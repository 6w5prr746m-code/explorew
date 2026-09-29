/* Apparence : thèmes Épure (défaut) et Désert, en mode automatique, clair ou sombre.
   Le choix (S.skin, S.mode) est posé sur <html> : data-skin="epure|desert", data-theme="light|dark" (absent en automatique).
   boot.js applique déjà ce choix avant le chargement de l'app pour éviter un flash. */
import { S, save } from "./state.js";
import { $, toast } from "./util.js";

export const SKINS=["epure","desert"];
export const MODES=["auto","light","dark"];
const systemDark=matchMedia("(prefers-color-scheme: dark)");

export function applyTheme(){
  if(!SKINS.includes(S.skin))S.skin="epure";
  if(!MODES.includes(S.mode))S.mode="auto";
  const root=document.documentElement;
  root.dataset.skin=S.skin;
  if(S.mode==="auto")root.removeAttribute("data-theme");else root.dataset.theme=S.mode;
  // La barre du navigateur (mobile, app installée) prend la couleur de fond du thème affiché
  const meta=document.querySelector('meta[name="theme-color"]');
  const ground=getComputedStyle(root).getPropertyValue("--ground").trim();
  if(meta&&ground)meta.setAttribute("content",ground);
  document.querySelectorAll("[data-set-skin]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setSkin===S.skin));
  document.querySelectorAll("[data-set-mode]").forEach(b=>b.setAttribute("aria-pressed",b.dataset.setMode===S.mode));
}

export function setTheme({skin,mode}){
  if(skin)S.skin=skin;
  if(mode)S.mode=mode;
  applyTheme();save();
}

// Proposée une seule fois, au premier tampon posé, tant que le thème est Épure. Encart discret, jamais bloquant.
export function offerDesert(){
  if(S.skin==="desert"||S.deserOffered||$("#skin-offer"))return false;
  S.deserOffered=true;save();
  const box=document.createElement("div");
  box.className="offer";box.id="skin-offer";box.setAttribute("role","group");box.setAttribute("aria-labelledby","skin-offer-t");
  box.innerHTML=`<p id="skin-offer-t">Passer en carnet de terrain ?</p><p class="sub">Le thème Désert : sable, papier et tampons à l'encre. Vous pourrez revenir à Épure dans l'onglet Pratique.</p>
    <div class="row"><button class="btn primary" data-offer="oui">Oui</button><button class="btn" data-offer="non">Non merci</button></div>`;
  box.onclick=e=>{
    const b=e.target.closest("[data-offer]");if(!b)return;
    if(b.dataset.offer==="oui"){setTheme({skin:"desert"});toast("Thème Désert activé")}
    box.remove();
    const stamp=document.querySelector('#stamps [aria-pressed="true"]');if(stamp)stamp.focus();
  };
  $("#stamps").after(box);
  return true;
}

export function initTheme(){
  applyTheme();
  $("#appearance").onclick=e=>{
    const b=e.target.closest("[data-set-skin],[data-set-mode]");if(!b)return;
    setTheme({skin:b.dataset.setSkin,mode:b.dataset.setMode});
  };
  systemDark.addEventListener("change",()=>{if(S.mode==="auto")applyTheme()});
}
