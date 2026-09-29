/* Charge les données puis l'application, et enregistre le service worker (hors ligne). */
// Thème choisi (js/theme.js) posé sur <html> avant tout rendu, pour éviter un flash de l'autre thème.
(function preTheme(){
  try{
    const s=JSON.parse(localStorage.getItem("carnetpei.v1"))||{},r=document.documentElement;
    r.dataset.skin=s.skin==="desert"?"desert":"epure";
    if(s.mode==="light"||s.mode==="dark")r.dataset.theme=s.mode;
  }catch(e){}
})();
(async function boot(){
  try{
    // Modules et destination en parallèle (la destination porte zones, carte et libellés propres au lieu).
    const get=u=>fetch(u,{cache:"no-cache"}).then(r=>{if(!r.ok)throw new Error(u);return r.json()});
    [window.__MODULES,window.__DEST]=await Promise.all([get("data/modules.json"),get("data/destinations/reunion.json")]);
  }catch(e){
    document.body.insertAdjacentHTML("afterbegin",'<p style="padding:16px">Impossible de charger les modules. Vérifiez la connexion puis rechargez la page.</p>');
    return;
  }
  const s=document.createElement("script");s.type="module";s.src="js/main.js";document.body.appendChild(s);
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
})();
