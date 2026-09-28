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

- **Rien n'est fusionné sans le CEO.** Chaque livrable est une pull request ; le CEO relit et fusionne.
- Pas de push sur `main`. Branches de l'équipe : `equipe/AAAA-MM-JJ-sujet`.
- Une PR ne s'ouvre que si `npm run validate` et `npm test` sont verts.
- Toute décision de bibliothèque, dépendance, architecture, service externe ou dépense remonte au CEO avant d'être prise.
- Chaque journée se termine par un rapport en commentaire de l'issue « Boîte de réception du CEO » : ce qui a été fait, les liens des PR, les décisions attendues sous forme de cases à cocher.

## Rythme

Une session par jour, déclenchée automatiquement, pendant la période d'essai de 10 jours. Le CEO ajuste ensuite.
