/* Bannières illustrées des fiches, générées en SVG selon la zone. */
const SEA=["Ouest","Sud","Sud sauvage"],MOUNT=["Hauts","Cilaos","Salazie","Mafate","Cirques","Nord"];
export function banner(m){
  const c=`var(--${m.p})`;let art;
  if(m.z==="Volcan")art=`<path d="M0 90 L130 90 L200 34 L226 30 L300 90 L400 90Z" fill="${c}" opacity=".85"/><path d="M200 34q13-18 26-4" stroke="${c}" stroke-width="3" fill="none" opacity=".5"/><circle cx="330" cy="26" r="11" fill="${c}" opacity=".35"/>`;
  else if(SEA.includes(m.z))art=`<circle cx="310" cy="30" r="14" fill="${c}" opacity=".45"/><path d="M0 62q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V90H0Z" fill="${c}" opacity=".35"/><path d="M0 74q25-10 50 0t50 0 50 0 50 0 50 0 50 0 50 0 50 0V90H0Z" fill="${c}" opacity=".7"/>`;
  else if(m.z==="Est")art=`<path d="M0 90 L60 40 L120 70 L190 22 L260 64 L330 36 L400 70 L400 90Z" fill="${c}" opacity=".75"/>${[40,90,150,210,270,330].map((x,i)=>`<path d="M${x} ${6+i%2*6}l-6 14" stroke="${c}" stroke-width="2" opacity=".4"/>`).join("")}`;
  else art=`<path d="M0 90 L50 50 L100 70 L160 18 L230 60 L290 30 L350 64 L400 44 L400 90Z" fill="${c}" opacity=".45"/><path d="M0 90 L70 62 L140 80 L220 46 L300 78 L400 60 L400 90Z" fill="${c}" opacity=".85"/>`;
  return `<svg class="banner" viewBox="0 0 400 90" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><rect width="400" height="90" fill="${c}" opacity=".08"/>${art}</svg>`;
}
