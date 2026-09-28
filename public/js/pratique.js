/* Pratique : check-list et lexique. */
import { S, save } from "./state.js";
import { $, esc } from "./util.js";

const CHECK=["Chaussures de randonnée rodées + sandales","Sac 20–30 L, 2 L d'eau par personne et par rando","Polaire, coupe-vent, bonnet et gants (volcan, Piton des Neiges)","Crème solaire respectueuse du récif, chapeau, lunettes","Masque, tuba, chaussons d'eau","Lampe frontale","Répulsif moustiques, petite trousse de secours","Sac pour redescendre ses déchets","Cartes hors ligne, batterie externe","Argent liquide pour Mafate"];
const LEX=[["Bonjour / Bonswar","Bonjour / Bonsoir"],["Koman i lé ?","Comment ça va ?"],["Lé la, lé bon","Ça va, c'est bon"],["Mersi in pil","Merci beaucoup"],["Kombien i kout ?","Combien ça coûte ?"],["Mi konpran pa","Je ne comprends pas"],["Marmay","Les enfants"],["Ti lampé","Doucement, petit à petit"],["Péï","Du pays, local"],["Kaz","Maison"],["Zourit","Poulpe"]];
export function renderPrat(){
  $("#checklist").innerHTML=CHECK.map((c,i)=>`<label class="check"><input type="checkbox" id="ck${i}" data-ck="${i}" ${S.checks[i]?"checked":""}><span>${esc(c)}</span></label>`).join("");
  $("#lex").innerHTML=LEX.map(([a,b])=>`<tr><td>${a}</td><td>${b}</td></tr>`).join("");
}
export function initPratique(){
  $("#checklist").onchange=e=>{const i=e.target.dataset.ck;if(i==null)return;S.checks[i]=e.target.checked;save()};
}
