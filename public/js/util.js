/* Utilitaires DOM et texte. */
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
export const col=p=>`var(--${p})`;
export function toast(msg){const t=document.createElement("div");t.className="toast";t.textContent=msg;document.body.appendChild(t);setTimeout(()=>t.remove(),1800)}
export function niveau(n){return n?["","accessible","en forme","sportif"][n]:""}
export function norm(s){return s.normalize("NFD").replace(/[̀-ͯ]/g,"").toLowerCase()}
// Dates de vérification (ISO AAAA-MM-JJ), lues en date locale pour éviter tout décalage de fuseau
function isoDate(iso){const m=/^(\d{4})-(\d{2})-(\d{2})$/.exec(iso||"");return m?new Date(+m[1],m[2]-1,+m[3]):null}
export function dateLongue(iso){const d=isoDate(iso);return d?d.toLocaleDateString("fr-FR",{day:"numeric",month:"long",year:"numeric"}):""}
export function dateCourte(iso){const d=isoDate(iso);return d?d.toLocaleDateString("fr-FR",{day:"2-digit",month:"2-digit",year:"numeric"}):""}
// Nom de domaine d'une source http(s), sans « www. » ; "" si ce n'est pas une URL web
export function domaine(u){try{const x=new URL(u);return /^https?:$/.test(x.protocol)?x.hostname.replace(/^www\./,""):""}catch(e){return ""}}
// Le texte signale-t-il une info « à vérifier » (casse et accents ignorés) ?
export function aVerifier(s){return norm(String(s??"")).includes("a verifier")}
