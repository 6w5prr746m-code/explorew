/* Utilitaires DOM et texte. */
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const col=p=>`var(--${p})`;
export function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
export function niveau(n){return n?["","accessible","en forme","sportif"][n]:""}
export function norm(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}
