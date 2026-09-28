/* Navigation entre les quatre onglets. */
import { renderList } from "./explorer.js";

export function switchView(v){
  document.querySelectorAll("section.view").forEach(s=>s.hidden=s.id!=="v-"+v);
  document.querySelectorAll("nav.tabs button").forEach(b=>b.setAttribute("aria-selected",b.dataset.v===v));
  window.scrollTo(0,0);
  if(v==="explore")renderList();
}
export function initNav(){
  document.querySelector("nav.tabs").onclick=e=>{const b=e.target.closest("button");if(b)switchView(b.dataset.v)};
}
