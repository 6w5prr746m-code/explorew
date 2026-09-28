# Carnet Péï — 1001 façons de découvrir La Réunion

Application web installable (PWA) et Book imprimable pour composer un voyage sur mesure à La Réunion : **200 modules** d'activités répartis en 8 profils, un composeur d'itinéraire de 7 à 30 jours, une carte, un carnet de voyage et des fiches pratiques.

## Fonctionnalités

- **Explorer** : recherche, filtres par profil, zone, niveau et pictos (famille, sans voiture, petit budget, pluie, lève-tôt, rencontre) ; vue liste ou carte.
- **Voyage** : grille jour par jour (matin, après-midi, soirée), hébergement, budget, coup de cœur, notes ; partage par lien ou QR code ; import ; impression.
- **Carnet** : passeport des cirques, mot créole du jour, coups de cœur, « je reviens pour… ».
- **Pratique** : urgences, réflexes météo, check-list, lexique créole ; impression du **Book complet** en A5.
- **Hors ligne** grâce au service worker. Les données de l'utilisateur restent dans son navigateur.

## Démarrer

```bash
npm run dev        # http://localhost:5173
npm run validate   # contrôle des données
```

Aucun build : le dossier `public/` est servi tel quel.

## Déployer (GitHub Pages)

1. Pousser le dépôt sur GitHub (branche `main`).
2. Settings → Pages → Source : **GitHub Actions**.
3. Chaque push sur `main` valide les données et publie `public/`.

## Régénérer le Book PDF

```bash
npm install
npx playwright install chromium
npm run pdf        # → book/1001-facons-La-Reunion-Book-A5.pdf
```

## Documentation

- [CLAUDE.md](CLAUDE.md) : contexte, conventions et règles pour développer avec Claude Code.
- [docs/ROADMAP.md](docs/ROADMAP.md) : prochaines étapes, par priorité.
- [docs/DATA.md](docs/DATA.md) : modèle de données des modules.
- [docs/A-VERIFIER.md](docs/A-VERIFIER.md) : informations à confirmer avant impression.
- [docs/BOOK.md](docs/BOOK.md) : structure éditoriale du Book.

## Sources et avertissement

Contenu établi principalement à partir de [reunion.fr](https://www.reunion.fr) (Île de la Réunion Tourisme), vérifié en septembre 2026. Horaires, tarifs, accès aux sentiers et conditions de baignade changent : toujours vérifier auprès des sources officielles (onf.fr, OVPF, Météo-France, offices de tourisme) avant de partir.

## Licences

- **Code** : [MIT](LICENSE).
- **Contenu** (modules, Book, textes) : [CC BY-NC-SA 4.0](LICENSE-CONTENT.md). Réutilisation libre à des fins non commerciales avec attribution ; usage commercial sur accord de l'auteur.

## Contribuer

Un sentier fermé, un horaire qui a changé ? Ouvrez une issue « Info à corriger » avec une source officielle. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

© 2026 Arnaud Coulon.
