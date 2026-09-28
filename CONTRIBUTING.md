# Contribuer à Carnet Péï

Merci ! Les contributions les plus utiles sont les **corrections de terrain** : un sentier fermé, un horaire qui a changé, un lieu qui n'existe plus.

## Signaler une information à corriger

Ouvrez une issue « Info à corriger » en indiquant le code du module (ex. `RA-D9`), ce qui est faux, et **une source officielle** (reunion.fr, office de tourisme, onf.fr, OVPF, site du prestataire).

## Proposer une modification

1. Forkez le dépôt et créez une branche.
2. Modifiez `public/data/modules.json` (format décrit dans `docs/DATA.md`) ou le code.
3. Lancez `npm run validate` : il doit être vert.
4. Si vous touchez `public/`, incrémentez `VERSION` dans `public/sw.js`.
5. Ouvrez une pull request en citant vos sources.

## Règles de contenu

- Aucun chiffre sans source (durée, distance, prix, horaire). Sinon : « à vérifier ».
- Sécurité : baignade en mer uniquement dans le lagon ou les zones surveillées ; pas de rivière après de fortes pluies ; volcan selon l'OVPF ; sentiers selon onf.fr.
- Pas de contenu promotionnel ni de liens d'affiliation.
- En contribuant, vous acceptez que votre contribution soit publiée sous les licences du dépôt (MIT pour le code, CC BY-NC-SA 4.0 pour le contenu).
