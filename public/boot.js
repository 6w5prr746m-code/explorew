/* Charge les données puis l'application, et enregistre le service worker (hors ligne). */
(async function boot(){
  try{
    const res=await fetch("data/modules.json",{cache:"no-cache"});
    window.__MODULES=await res.json();
  }catch(e){
    document.body.insertAdjacentHTML("afterbegin",'<p style="padding:16px">Impossible de charger les modules. Vérifiez la connexion puis rechargez la page.</p>');
    return;
  }
  const s=document.createElement("script");s.src="app.js";document.body.appendChild(s);
  if("serviceWorker" in navigator){navigator.serviceWorker.register("sw.js").catch(()=>{})}
})();
