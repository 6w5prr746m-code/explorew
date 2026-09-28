# Thèmes : Épure et Désert

Validé par le CEO le 28 septembre 2026. Deux habillages, chacun en clair et en sombre, qui remplacent le thème actuel.

| Thème | Intention | Clair | Sombre |
| --- | --- | --- | --- |
| **Épure** (par défaut) | L'outil de précision pour préparer : blanc, gris perle, un seul accent lagon, verre dépoli sur l'en-tête et les onglets, ombres douces, coins arrondis | Épure | **Graphite** (gris très foncé, jamais de noir pur) |
| **Désert** (option) | Le carnet de terrain qu'on remplit : sable, papier, terre cuite, grain de papier, filets pointillés, tampons à l'encre, titres en italique | Désert | **Bivouac** (brun profond, textes crème) |

Maquettes : [Épure](maquette-epure.png) · [Désert](maquette-desert.png). Point de départ du code : [`themes-proto.css`](themes-proto.css).

## Règles

- **Polices** : on garde Instrument Serif (titres), Figtree (texte, y compris dans Épure) et JetBrains Mono (codes). Aucune nouvelle police.
- **Tokens uniquement** : chaque thème redéfinit les tokens de `:root` (couleurs, `--shadow`, `--r`, `--glass`, `--grain`). Les retouches de composants passent par ces tokens, jamais par une couleur en dur.
- **Sélection** : `data-skin="epure|desert"` sur `<html>`, combiné à `data-theme="light|dark"` ou, par défaut, au réglage du téléphone (`prefers-color-scheme`). Choix stocké dans l'état (`carnetpei.v1`), réversible en un geste.
- **Où choisir** : un réglage dans l'onglet Pratique, et une proposition « Passer en carnet de terrain » dans le Carnet au premier tampon posé.
- **Contrastes** : niveau AA (4,5:1) pour le texte, le texte secondaire, l'accent et les huit couleurs de profils, dans les quatre jeux. Les valeurs de `themes-proto.css` sont vérifiées ; tout changement de couleur doit être revérifié.
- **Verre dépoli** : uniquement sur l'en-tête et la barre d'onglets, avec un fond opaque de repli si `backdrop-filter` n'est pas pris en charge.
- **Grain et textures** (Désert) : en CSS ou SVG en ligne, sans image à télécharger, pour rester hors ligne et léger.
- **Animations** : courtes, un geste un effet, toutes coupées si `prefers-reduced-motion: reduce`.
- **Impression** : le Book A5 reste en noir sur blanc ; le style Désert pourra servir plus tard au carnet souvenir.
- Pas d'émoji dans l'interface. Tests Playwright : bascule de thème, persistance, captures à 400 px dans les quatre combinaisons.
