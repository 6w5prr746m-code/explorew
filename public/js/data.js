/* Référentiels, destination et modules (chargés par boot.js dans window.__DEST et window.__MODULES). */
// Destination : libellés, zones, carte et urgences propres au lieu (data/destinations/<id>.json)
export const DEST=window.__DEST;
export const PROFILES={AV:"Aventurier",LA:"Lagon & farniente",RA:"Randonneur",EP:"Épicurien & culture",FA:"Famille",SL:"Slow & responsable",PB:"Plan B pluie",NE:"Nuit & étoiles"};
export const ZONES=DEST.zones;
export const PICTOS={FAM:"Famille",BUS:"Sans voiture","€":"Petit budget",PLUIE:"Jour de pluie",AUBE:"Lève-tôt",LOCAL:"Rencontre"};
export const SLOTS=[["m","Matin"],["a","Après-midi"],["s","Soirée"]];
// Les modules sont chargés par boot.js depuis data/modules.json
export const MODS=window.__MODULES.map(m=>({c:m.code,p:m.code.slice(0,2),t:m.titre,z:m.zone,l:m.lieu,d:m.duree,n:m.niveau,b:m.budget,f:m.filtres,e:m.essentiel,a:m.astuce,pb:m.planB,k:m.combo,full:m.fiche==="complete",geo:m.geo}));
export const BY=Object.fromEntries(MODS.map(m=>[m.c,m]));
