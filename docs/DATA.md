# Modèle de données — `public/data/modules.json`

Tableau de 200 objets. Exemple :

```json
{
  "code": "AV-J1",
  "profil": "aventurier",
  "titre": "Piton de la Fournaise, cratère Dolomieu",
  "zone": "Volcan",
  "lieu": "Pas de Bellecombe",
  "duree": "5 à 6 h de marche",
  "niveau": 2,
  "budget": "€",
  "filtres": ["AUBE", "€"],
  "essentiel": "Plaine des Sables, descente du rempart, marche jusqu'au bord du cratère Dolomieu.",
  "astuce": "Moins de 10 °C à l'aube : polaire et coupe-vent. Vérifier l'ouverture de l'enclos (OVPF).",
  "planB": "FA-03",
  "combo": "AV-D19",
  "fiche": "complete",
  "securite": ["marche"],
  "geo": null,
  "photo": null,
  "source": null,
  "verifieLe": "2026-09-19"
}
```

| Champ | Type | Règle |
| --- | --- | --- |
| code | texte | `AV/LA/RA/EP-D1…D20` (demi-journées), `-J1…J10` (journées) ; `FA/SL/PB/NE-01…20` |
| profil | texte | `aventurier`, `lagon`, `randonneur`, `epicurien`, `famille`, `slow`, `plan-b-pluie`, `nuit-etoiles` |
| zone | texte | `Ouest`, `Hauts`, `Sud`, `Sud sauvage`, `Volcan`, `Est`, `Nord`, `Cilaos`, `Salazie`, `Mafate`, `Cirques`, `Toute l'île` |
| niveau | 1, 2, 3 ou null | 1 accessible · 2 bonne condition · 3 sportif/encadré |
| budget | texte | `Gratuit`, `€` (≤ 20 €), `€€` (20-80 €), `€€€` (> 80 €) par personne |
| filtres | liste | `FAM` famille · `BUS` sans voiture · `€` petit budget · `PLUIE` jour de pluie · `AUBE` lève-tôt · `LOCAL` rencontre |
| planB, combo | code ou texte libre | un code doit exister (contrôlé par `npm run validate`) |
| fiche | texte | `complete` (profils principaux) ou `courte` (profils additionnels) |
| securite | liste | réflexes de sécurité de l'onglet Pratique qui s'appliquent : `marche` (sentier, volcan, cirque, canyon, montagne → « Avant de marcher »), `baignade` (mer, lagon, rivière, bassin, cascade, canyon → « Baignade ») ; `[]` sinon. Obligatoire, sans doublon. Classement relu dans `docs/SECURITE-CLASSEMENT.md` |
| geo | objet ou null | `{ "lat": -21.24, "lng": 55.71 }` — **prioritaire** sur le placement approximatif de la carte |
| photo | objet ou null | prévu : `{ "src": "…", "credit": "…", "licence": "…" }` |
| source | URL ou null | page officielle ayant servi à vérifier le module ; proposée avec extrait cité puis fusionnée par `node scripts/merge-sources.mjs` (voir `docs/sources/LISEZMOI.md`) |
| verifieLe | date ISO | dernière vérification |

## Ajouter un module

1. Ajouter l'objet dans `modules.json` (code suivant du profil).
2. `npm run validate`.
3. Ajouter `geo` et `source` dès la création si possible.
