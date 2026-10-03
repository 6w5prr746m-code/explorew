# Feuille de route — Carnet Péï

Ordre pensé pour ne pas perdre de temps : d'abord mettre l'app en ligne et la fiabiliser, ensuite enrichir le contenu, puis ajouter des fonctionnalités, et enfin les comptes et la conformité. Chaque tâche est formulée pour être confiée telle quelle à Claude Code.

## Étape 0 — Mise en ligne (1 à 2 h)

- [x] Dépôt GitHub public `6w5prr746m-code/explorew`.
- [x] Workflow `.github/workflows/deploy.yml` : valide les données puis publie `public/` à chaque push sur main.
- [ ] Settings → Pages → Source : **GitHub Actions** (à faire une fois par le CEO).
- [ ] (CEO) Ouvrir l'URL `https://6w5prr746m-code.github.io/explorew/` sur iPhone et Android : installer sur l'écran d'accueil, passer en mode avion, vérifier que l'app s'ouvre.
- [ ] (Option) Nom de domaine : ajouter un fichier `public/CNAME` et configurer le DNS.

## Étape 1 — Fiabiliser (1 à 2 sessions Claude Code)

- [x] **Auto-héberger** les polices (woff2 dans `public/fonts/`) et `qrcodejs` (dans `public/vendor/`) : l'app doit fonctionner 100 % hors ligne, y compris à Mafate.
- [x] Ajouter ces fichiers à la liste `CORE` de `sw.js`.
- [ ] Automatiser `VERSION` (hash des fichiers) via un petit script.
- [x] Passer `app.js` en **modules ES** : `data.js`, `state.js`, `explorer.js`, `module-sheet.js`, `trip.js`, `map.js`, `share.js`, `carnet.js`, `print.js`. Aucun changement de comportement.
- [x] Tests de bout en bout **Playwright** : chargement des 200 modules, filtres, ajout au voyage, partage/import, carte, impression. Les lancer en CI.
- [ ] Prettier + ESLint minimal.
- [x] Bouton « Exporter / restaurer mes données » (fichier JSON) : sécurise le voyage de l'utilisateur, stocké seulement dans son navigateur.

## Étape 1 bis — Expérience (validée par le CEO le 28 septembre 2026)

À traiter dans cet ordre, **en priorité sur les cases restantes des étapes 1 et 2**. Chaque livrable respecte les garde-fous : aucune mécanique qui culpabilise (série de jours, fausse rareté), aucun tampon ni badge qui récompense la performance (sommet, niveau 3, vitesse, heure de départ), rappels de sécurité toujours visibles à côté des actions, pas de compte ni de pistage, aucun chiffre non sourcé.

- [x] **Thèmes Épure (par défaut) et Désert**, clair et sombre (Graphite, Bivouac), selon `docs/design/THEMES.md` : réglage « Apparence » dans Pratique, proposition unique dans le Carnet au premier tampon (`js/theme.js`).
- [x] **Préparer le multi-destinations, étape 1** (validé le 29 septembre) : extraire tout ce qui est propre à La Réunion (zones, carte, libellés, fuseau, urgences, sources de sécurité) dans `public/data/destinations/reunion.json`, `S.dest` par défaut « reunion », sans aucun changement visible. À faire avant la vue « Aujourd'hui » et l'export agenda (fuseau et rappels codés une seule fois).
- [x] **Vue « Aujourd'hui »** : à l'ouverture pendant le séjour, le jour en cours (matin, après-midi, soir), les réflexes du jour, et une bascule **Plan B pluie** qui propose pour le créneau les modules PB ou le `planB` du module prévu.
- [x] **Export agenda (.ics)** du voyage : un événement par créneau, avec rappels « réserver » et « vérifier la veille l'état des sentiers (onf.fr) et du volcan (OVPF) ». Fichier généré dans le navigateur, sans serveur.
- [x] **Passeport étendu** : bouton « Fait » sur chaque module, qui pose un tampon daté ; collection par zone et par profil. Le tampon récompense l'expérience vécue, jamais la performance ; un module volcan, sentier ou baignade garde son rappel de sécurité à côté du bouton.
- [x] **Carnet souvenir et carte postale** : récit de fin de voyage (jours, tampons, coups de cœur, mots appris) imprimable, image de partage sans données personnelles (carte, trajet, tampons), et « Je reviens pour… » transformé en liste de modules qui préremplit le prochain voyage. *Partie A (carnet souvenir, liste « Je reviens pour… ») et partie B (carte postale) faites le 30 septembre.*
- [x] **« Vérifié le… » sur chaque fiche** (validé le 29 septembre) : date de vérification, source (ou « Source à venir ») et étiquette visible sur les champs « à vérifier ». Le bouton « Signaler une info » attend le choix du canal par le CEO (à creuser : issue GitHub ou autre).
- [x] **Mise à jour sûre des données sur le téléphone** (validé le 1er octobre, **priorité**) : corriger le créneau fantôme (un code de module disparu des données est compté comme occupé sans rien afficher) ; correspondance entre anciens et nouveaux codes, migration avec message (« ce module n'existe plus, voici le plan B »), délai maximal sur le réseau au démarrage, alerte si la sauvegarde échoue, stockage persistant.
- [x] **Bilan d'équilibre du voyage** (validé le 29 septembre) : dans l'onglet Voyage, conseils neutres tirés des règles d'or du Book (doublons, créneaux vides, changements de zone, journées tampon, jours sans plan B). Jamais de score ni de ton culpabilisant.
- [x] **Audit d'accessibilité en CI** (validé le 30 septembre, avec `@axe-core/playwright` en dépendance de dev) : aucune violation « serious » ou « critical » dans les 4 onglets et les 4 thèmes. Corriger la carte au clavier, les libellés des boutons « × » du voyage et le retour du focus après une fiche.
- [x] **Champ `securite` sur chaque module** (validé le 30 septembre) : `["marche"]`, `["baignade"]`, les deux ou `[]`, rempli et relu à la main (PR de contenu, pour le CEO). L'app l'utilise à la place de la détection par mots-clés du passeport et de l'agenda.
- [x] **« Par où commencer ? »** (validé le 1er octobre) : au premier écran, tant que le voyage d'exemple est affiché, un encart fermable explique le principe en 3 étapes et propose 3 modules à ajouter au jour 1.
- [ ] **Lever et coucher du soleil du jour** (validé le 1er octobre) : calculés sur le téléphone sans réseau, dans la vue « Aujourd'hui ». Table de référence pour vérifier le calcul : à choisir par le CEO. Le texte du rappel « retour avant la nuit » est une consigne de sécurité, soumis au CEO avant fusion.
- [x] **« Envies du groupe »** (validé le 30 septembre, après l'étape 1 bis) : lien « Donnez vos envies », chaque proche coche ses envies ou « pas pour moi » et renvoie un lien. Les avis s'ajoutent au voyage sans jamais le remplacer. Sans compte ni serveur, lien v:1 toujours accepté.
- [x] **« Prêt pour le hors-ligne »** (validé le 1er octobre) : dans Pratique, un contrôle que chaque fichier de `CORE` est en cache (« Prêt » ou « Incomplet : réessayer avec du réseau »), version des données et bouton pour relancer le téléchargement. Il ne dit jamais qu'un sentier ou le volcan est praticable : le rappel onf.fr / OVPF reste à côté.
- [ ] **Sources proposées avec extrait cité** (validé le 1er octobre) : même circuit que la géolocalisation. Un agent propose, par lots de 20 modules, URL officielle, extrait exact et date de consultation dans `docs/sources/proposition.json` (statut « a-relire », tableau lisible dans `docs/sources/PROPOSITION.md`) ; le CEO relit ; un script fusionne les lignes « valide » (`source`, `verifieLe`). Sans extrait cité, rien n'est proposé ; sources contradictoires : « à vérifier ».
- [ ] **Veille des sources officielles** (validé le 1er octobre, à cadrer après les sources avec extrait) : tâche CI mensuelle qui relit les URL de `source` et signale liens morts, redirections et extraits disparus, sans rien corriger seule. Format de sortie (fichier ou issue) à fixer.
- [ ] **Tableau de santé du contenu** (validé le 30 septembre) : `npm run sante-contenu` produit `docs/SANTE-CONTENU.md` par destination (ancienneté de `verifieLe`, source hors domaines officiels, doublons, renvois à sens unique, champs manquants). **Seuil de péremption et liste des domaines officiels : à fixer par le CEO.**

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
- [ ] **Avancée par le CEO le 30 septembre (à traiter avant l'étape 4)** : mesure d'audience respectueuse de la vie privée (Plausible ou équivalent, **outil à choisir par le CEO**), sans cookies.
- [ ] Pages légales dans l'app : mentions légales, politique de confidentialité (RGPD), crédits et licences.
- [ ] Traiter les issues « Info à corriger » ouvertes par les voyageurs.

## Premières demandes à faire à Claude Code

1. « Lis CLAUDE.md et docs/ROADMAP.md, lance `npm run dev` et `npm run validate`, puis fais-moi un état des lieux du code en 10 lignes. »
2. « Auto-héberge les polices et qrcodejs, mets-les dans le cache du service worker, et vérifie que l'app marche en mode avion. »
3. « Découpe app.js en modules ES sans changer le comportement, puis ajoute des tests Playwright sur les parcours principaux, lancés en CI. »
4. « Ajoute un bouton Exporter / Restaurer mes données dans l'onglet Carnet. »
5. « Propose des coordonnées GPS pour chaque module à partir de `lieu`, dans un fichier séparé que je relirai avant fusion. »
