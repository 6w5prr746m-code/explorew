# Feuille de route — Carnet Péï

Ordre pensé pour ne pas perdre de temps : d'abord mettre l'app en ligne et la fiabiliser, ensuite enrichir le contenu, puis ajouter des fonctionnalités, et enfin les comptes et la conformité. Chaque tâche est formulée pour être confiée telle quelle à Claude Code.

## Étape 0 — Mise en ligne (1 à 2 h)

- [ ] Créer le dépôt GitHub public `carnet-pei` et pousser ce dossier.
- [ ] Settings → Pages → Source : **GitHub Actions**. Le workflow `deploy.yml` valide les données puis publie `public/`.
- [ ] Ouvrir l'URL `https://<utilisateur>.github.io/carnet-pei/` sur iPhone et Android : installer sur l'écran d'accueil, passer en mode avion, vérifier que l'app s'ouvre.
- [ ] (Option) Nom de domaine : ajouter un fichier `public/CNAME` et configurer le DNS.

## Étape 1 — Fiabiliser (1 à 2 sessions Claude Code)

- [x] **Auto-héberger** les polices (woff2 dans `public/fonts/`) et `qrcodejs` (dans `public/vendor/`) : l'app doit fonctionner 100 % hors ligne, y compris à Mafate.
- [x] Ajouter ces fichiers à la liste `CORE` de `sw.js`.
- [ ] Automatiser `VERSION` (hash des fichiers) via un petit script.
- [x] Passer `app.js` en **modules ES** : `data.js`, `state.js`, `explorer.js`, `module-sheet.js`, `trip.js`, `map.js`, `share.js`, `carnet.js`, `print.js`. Aucun changement de comportement.
- [x] Tests de bout en bout **Playwright** : chargement des 200 modules, filtres, ajout au voyage, partage/import, carte, impression. Les lancer en CI.
- [ ] Prettier + ESLint minimal.
- [x] Bouton « Exporter / restaurer mes données » (fichier JSON) : sécurise le voyage de l'utilisateur, stocké seulement dans son navigateur.

## Étape 2 — Contenu (en continu)

- [ ] Traiter `docs/A-VERIFIER.md` (18 modules et quelques infos transverses).
- [ ] Renseigner `geo` (lat/lng) pour les 200 modules : la carte devient exacte. Proposition en relecture dans `docs/geo/PROPOSITION.md` (80 points de localité à relire, 65 sites à relever sur IGN/OSM, 55 sans point unique).
- [ ] Renseigner `source` (URL reunion.fr ou office de tourisme) et `verifieLe` pour chaque module.
- [ ] Rédiger les **fiches complètes** des 80 modules additionnels (FA, SL, PB, NE) au gabarit : essentiel, créneau, saison, réservation, astuce, plan B, combo.
- [ ] Ajouter des champs `saison` (mois idéaux) et `reservation` (oui/non + délai) pour filtrer par mois de voyage.
- [ ] **Photos** : uniquement des visuels dont la licence permet une diffusion publique (photographes ayant donné leur accord, banques libres, Wikimedia Commons). Champ `photo` avec crédit et licence obligatoires.
- [ ] Monter vers 500 modules (V2) : modules par commune, « coup de cœur d'un local ».

## Étape 3 — Produit (après la mise en ligne)

- [ ] **Vraie carte** : MapLibre GL + tuiles OpenStreetMap (ou IGN), avec tuiles hors ligne pour les cirques.
- [ ] **Composeur intelligent** : alerte si deux modules du même jour sont trop éloignés (temps de trajet), si un module « AUBE » est placé l'après-midi, ou si un module « saison des pluies » est placé en hiver austral.
- [ ] Trames prêtes à l'emploi (7, 10, 15, 20, 25, 30 jours) à charger en un tap, reprises de la Section 1 du Book.
- [ ] Glisser-déposer des modules entre jours et créneaux.
- [ ] Filtre « mois de voyage » et affichage du calendrier saisonnier (baleines, letchis, fêtes).
- [ ] Export de l'itinéraire en `.ics` (agenda) et PDF personnalisé.
- [ ] Version anglaise (i18n : fichiers `fr.json` et `en.json`, contenu traduit dans `modules.json`).

## Étape 4 — Comptes et conformité

- [ ] Comptes et synchronisation entre appareils (ex. Supabase) : voyage partagé en famille, modification à plusieurs.
- [ ] Mesure d'audience respectueuse de la vie privée (Plausible ou équivalent), sans cookies.
- [ ] Pages légales dans l'app : mentions légales, politique de confidentialité (RGPD), crédits et licences.
- [ ] Traiter les issues « Info à corriger » ouvertes par les voyageurs.

## Premières demandes à faire à Claude Code

1. « Lis CLAUDE.md et docs/ROADMAP.md, lance `npm run dev` et `npm run validate`, puis fais-moi un état des lieux du code en 10 lignes. »
2. « Auto-héberge les polices et qrcodejs, mets-les dans le cache du service worker, et vérifie que l'app marche en mode avion. »
3. « Découpe app.js en modules ES sans changer le comportement, puis ajoute des tests Playwright sur les parcours principaux, lancés en CI. »
4. « Ajoute un bouton Exporter / Restaurer mes données dans l'onglet Carnet. »
5. « Propose des coordonnées GPS pour chaque module à partir de `lieu`, dans un fichier séparé que je relirai avant fusion. »
