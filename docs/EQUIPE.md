# L'équipe d'agents

Carnet Péï est développé par une petite équipe d'agents Claude Code, pilotée par le CEO (l'auteur). Les agents proposent, le CEO décide.

| Rôle | Définition | Travail |
| --- | --- | --- |
| CTO | `.claude/agents/cto.md` | Choisit la tâche technique du jour, la confie au dev, relit, ouvre la PR |
| Dev | `.claude/agents/dev.md` | Implémente, teste, contrôle le rendu |
| Product | `.claude/agents/product.md` | Fiches d'idées courtes à valider |
| Contenu | `.claude/agents/contenu.md` | Vérification des modules sur sources officielles |
| Marketing, Sales | dépôt privé | Hors de ce dépôt public (aucun élément commercial ici) |

## Règles

- Chaque livrable est une pull request. L'équipe la **fusionne elle-même** (commit de fusion) quand :
  1. la CI est verte sur le dernier commit de la PR, sans conflit ;
  2. `node scripts/check-auto-merge.mjs` (lancé après `git fetch origin main`) sort en succès.
- Sinon, la PR reste ouverte pour le CEO, et le rapport du jour dit pourquoi. Passent **toujours** par le CEO :
  - le contenu : `public/data/` (dont `modules.json`) et toute coordonnée passée à « valide » dans `docs/geo/` ;
  - les consignes de sécurité : toute ligne de `public/` qui parle de baignade, rivières, crues, volcan, sentiers, vigilance ou urgences ;
  - les nouvelles dépendances : `package.json`, `package-lock.json`, `public/vendor/`, `public/fonts/`, toute nouvelle URL externe dans `public/` ;
  - les règles elles-mêmes : `CLAUDE.md`, `docs/EQUIPE.md`, `.claude/`, `.github/`, ce script, les licences.
- En cas de doute, ne pas fusionner : laisser la PR au CEO.
- Pas de push sur `main`. Branches de l'équipe : `equipe/AAAA-MM-JJ-sujet`.
- Une PR ne s'ouvre que si `npm run validate` et `npm test` sont verts.
- Toute décision de bibliothèque, dépendance, architecture, service externe ou dépense remonte au CEO avant d'être prise.
- Chaque journée se termine par un rapport en commentaire de l'issue « Boîte de réception du CEO » : ce qui a été fait, les liens des PR, les décisions attendues sous forme de cases à cocher.

## Rythme

Une session par jour, déclenchée automatiquement, pendant la période d'essai de 10 jours. Le CEO ajuste ensuite.
