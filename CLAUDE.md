# CLAUDE.md — Carnet Péï

Contexte pour Claude Code. À lire avant toute modification.

## Le projet

**Carnet Péï** est la version application du Book « 1001 façons de découvrir La Réunion » : un carnet de voyage sur mesure où le voyageur choisit une durée (7 à 30 jours), pioche des modules d'activités (demi-journées et journées) et les assemble dans une grille jour par jour.

- Auteur : Arnaud Coulon. Dépôt public : code MIT, contenu CC BY-NC-SA 4.0 (voir LICENSE et LICENSE-CONTENT.md).
- Public : tous profils de voyageurs. Langue : français (anglais prévu plus tard).
- Formats cibles : PWA (application installable, hors ligne) + Book imprimé A5 généré depuis les mêmes données.
- Source de contenu principale : **reunion.fr** (site officiel IRT). Toute info ajoutée doit être vérifiée sur une source officielle à jour.

## Stack et principes

- **Vanilla HTML/CSS/JS, sans build.** Pas de framework, pas de bundler tant que ce n'est pas nécessaire. Le dossier `public/` est servi tel quel (GitHub Pages).
- Données : `public/data/modules.json` est **la source de vérité** du contenu. L'app, la carte et le PDF en dérivent.
- État utilisateur (voyage, carnet, check-list) : `localStorage`, clé `carnetpei.v1`. Pas de compte, pas de serveur pour l'instant.
- Hors ligne : `public/sw.js` (réseau d'abord, puis cache). **Incrémenter `VERSION` dans `sw.js` à chaque déploiement qui change des fichiers de l'app.**
- Aucune dépendance externe au runtime : polices dans `public/fonts/` (OFL), `qrcodejs` dans `public/vendor/` (MIT). Tout fichier ajouté à l'app doit entrer dans `CORE` de `sw.js`.

## Structure

```
public/
  index.html            coquille de l'app (4 onglets : Explorer, Voyage, Carnet, Pratique)
  styles.css            design tokens (clair + sombre), composants, styles d'impression du Book
  boot.js               charge data/modules.json, puis js/main.js (module ES), puis enregistre le service worker
  js/                   l'application en modules ES (voir ci-dessous)
  data/modules.json     les 200 modules
  fonts/                polices woff2 auto-hébergées + fonts.css + licences OFL
  vendor/               qrcode.min.js (davidshimjs/qrcodejs, MIT)
  sw.js, manifest.webmanifest, icons/
scripts/
  validate-data.mjs     contrôle des données (lancé en CI, doit rester vert)
  list-a-verifier.mjs   génère docs/A-VERIFIER.md
  build-book-pdf.mjs    génère book/…A5.pdf via Playwright
tests/                  tests Playwright (parcours principaux, hors ligne)
.github/workflows/      CI : validation des données + tests Playwright
docs/                   ROADMAP, modèle de données, liste à vérifier
book/                   PDF du Book généré
```

`js/` contient un module par fonctionnalité, sans build :
- `main.js` : point d'entrée, initialise les modules dans l'ordre et expose `window.__PEI` et `window.__printBook()` (utilisés par `scripts/build-book-pdf.mjs`).
- `data.js` (référentiels, modules), `state.js` (état localStorage), `util.js`.
- `explorer.js` (filtres, liste), `module-sheet.js` (fiche), `trip.js` (voyage), `carnet.js`, `pratique.js`, `nav.js`, `render.js` (`renderAll`).
- `map.js` (carte SVG, bascule Liste/Carte), `visuals.js` (bannières), `share.js` (partage `#t=`, QR, import), `print.js` (voyage et Book), `backup.js` (export / restauration JSON, onglet Carnet), `theme.js` (thèmes Épure et Désert, clair ou sombre : `data-skin` et `data-theme` sur `<html>`, `S.skin` et `S.mode`, réglage Apparence dans Pratique, proposition unique dans le Carnet).

Chaque module n'exécute rien au chargement : il exporte des fonctions et un `initXxx()` appelé par `main.js`, ce qui évite les soucis d'imports circulaires. Tout nouveau fichier de `js/` doit être ajouté à `CORE` dans `sw.js`.

## Modèle de données (résumé, détail dans docs/DATA.md)

Chaque module : `code` (ex. `AV-D1`, `FA-01`), `profil`, `titre`, `zone` (liste fermée), `lieu`, `duree`, `niveau` (1-3 ou null), `budget` (`Gratuit`, `€`, `€€`, `€€€`), `filtres` (`FAM BUS € PLUIE AUBE LOCAL`), `essentiel`, `astuce`, `planB`, `combo` (codes d'autres modules), `fiche` (`complete` | `courte`), `geo` ({lat,lng} ou null), `photo` (null), `source` (URL ou null), `verifieLe` (date ISO).

Profils : AV Aventurier · LA Lagon · RA Randonneur · EP Épicurien (30 modules chacun, fiches complètes) · FA Famille · SL Slow & responsable · PB Plan B pluie · NE Nuit & étoiles (20 chacun, fiches courtes qui renvoient souvent vers une fiche complète).

## Règles de contenu

- Ne jamais inventer un chiffre (durée, distance, prix, horaire). Si ce n'est pas sourcé, écrire « à vérifier ».
- Sécurité non négociable : baignade en mer uniquement dans le lagon ou les zones surveillées ; pas de baignade en rivière après de fortes pluies ; volcan selon l'OVPF ; sentiers selon onf.fr.
- Un lieu ou un prestataire n'entre que s'il est référencé par une source officielle (reunion.fr, offices de tourisme, Parc national).
- Ton : direct, concret, « vous ». Pas d'émojis dans l'interface.

## Règles de design

- Deux thèmes (`docs/design/THEMES.md`) : Épure par défaut (Graphite en sombre) et Désert via `[data-skin="desert"]` (Bivouac en sombre). Tokens CSS dans `:root` + redéfinis pour chaque thème et pour le sombre (`prefers-color-scheme` et `[data-theme]`). Ne jamais coder une couleur en dur hors des blocs de tokens. `boot.js` applique le thème avant le rendu.
- Contrastes AA (4,5:1) vérifiés dans les quatre combinaisons pour le texte, le texte secondaire, l'accent et les couleurs de profils.
- Chaque profil a sa couleur (`--AV`, `--LA`, …), utilisée pour les liserés, codes et points de carte.
- Typo : Instrument Serif (titres), Figtree (texte), JetBrains Mono (codes).
- Mobile d'abord (400 px), marge latérale 16 px, zones tactiles ≥ 40 px, focus visible.

## Commandes

```
npm run dev          # sert public/ sur http://localhost:5173
npm run validate     # contrôle des données (obligatoire avant commit)
npm test             # tests Playwright de bout en bout (tests/), lancés aussi en CI
npm run a-verifier   # régénère docs/A-VERIFIER.md
npm run geo:proposer # propose des coordonnées GPS dans docs/geo/ (source GeoNames, rien n'est fusionné)
npm run geo:fusionner # fusionne dans modules.json les entrées passées à « valide »
npm install && npx playwright install chromium && npm run pdf   # régénère le Book PDF
```

## Dépôt public

- Ne jamais committer de données personnelles, de clés d'API, de contacts de partenaires ou d'éléments de stratégie commerciale.
- Les photos ne sont ajoutées qu'avec crédit et licence compatibles avec une diffusion publique.

## Avant chaque PR

1. `npm run validate` et `npm test` sont verts.
2. Tester sur mobile (ou DevTools 400 px), en clair et en sombre.
3. Si des fichiers de `public/` changent : incrémenter `VERSION` dans `sw.js`.
4. Si `modules.json` change : relancer `npm run a-verifier` et, pour une édition papier, `npm run pdf`.
