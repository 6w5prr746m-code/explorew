# Sources proposées avec extrait cité

Même circuit que la géolocalisation (`docs/geo/`) : **rien n'entre dans `public/data/modules.json` sans relecture humaine.** Le script ne touche qu'à deux champs de chaque module : `source` (URL) et `verifieLe` (date de consultation).

## Circuit

1. **L'agent contenu propose**, par lots de 20 modules environ, dans `docs/sources/proposition.json` : URL officielle, extrait exact de la page, date de consultation. Chaque nouvelle entrée a le statut `a-relire`.
2. **Le CEO relit** chaque entrée : il ouvre l'URL, retrouve l'extrait sur la page, vérifie qu'il appuie bien le champ indiqué. Puis il passe `statut` à `valide` (ou à `rejete`, avec une `note` qui dit pourquoi).
3. **On lance le script** :

   ```
   node scripts/merge-sources.mjs --dry-run   # affiche ce qui changerait, n'écrit rien
   node scripts/merge-sources.mjs             # fusionne
   npm run validate && npm run a-verifier
   ```

   Pour chaque entrée `valide`, le module reçoit `source` = l'URL et `verifieLe` = `consulteLe`, et l'entrée passe à `fusionne`. Aucun autre champ du module n'est modifié : si un extrait contredit le texte d'un module (durée, prix, horaire…), la correction se fait à la main, dans une PR de contenu relue par le CEO.
4. Le changement de `modules.json` passe par une PR laissée au CEO (voir `docs/EQUIPE.md`), avec `VERSION` incrémentée dans `public/sw.js`.

Le script fonctionne en **tout ou rien** : si une seule entrée `valide` est refusée, il sort en erreur, liste les motifs et n'écrit aucun fichier.

## Format

```json
{
  "genereLe": "2026-10-01",
  "modeEmploi": "Relire chaque entrée « a-relire », puis passer statut à « valide » ou « rejete ». Puis : node scripts/merge-sources.mjs",
  "modules": [
    {
      "code": "RA-D9",
      "titre": "Titre du module, pour la relecture",
      "source": "https://www.reunion.fr/…",
      "extraits": [
        { "champ": "duree", "texte": "Phrase exacte, copiée de la page." }
      ],
      "consulteLe": "2026-10-01",
      "statut": "a-relire",
      "note": ""
    }
  ]
}
```

| Champ | Règle |
| --- | --- |
| `genereLe` | date AAAA-MM-JJ du lot |
| `modeEmploi` | texte libre pour le relecteur |
| `code` | code d'un module existant de `modules.json` |
| `titre` | titre du module (aide à la relecture, non fusionné) |
| `source` | URL **https** d'un domaine officiel (voir plus bas) |
| `extraits` | au moins un `{ champ, texte }` : `champ` est le champ du module que l'extrait appuie (`duree`, `budget`, `lieu`, `essentiel`, `astuce`…), `texte` la phrase copiée telle quelle |
| `consulteLe` | date AAAA-MM-JJ de consultation de la page, ni invalide ni dans le futur ; devient `verifieLe` |
| `statut` | `a-relire` (proposé), `valide` (relu par le CEO), `rejete` (écarté), `fusionne` (reporté par le script) |
| `note` | facultatif : doute, contradiction, motif de rejet |

`npm run validate` contrôle la structure du fichier quand il existe : champs obligatoires, statut connu, codes existants, URL https, dates. Le script de fusion ajoute, pour les entrées `valide`, le contrôle du domaine, de la présence d'un extrait non vide et de la date de consultation (pas dans le futur).

## Domaines officiels

Liste **provisoire**, dans `DOMAINES_OFFICIELS` de `scripts/sources-format.mjs` (le domaine et ses sous-domaines) :

- `reunion.fr` : IRT, site officiel de la destination
- `onf.fr` : Office national des forêts
- `cinor.re` : Communauté intercommunale du Nord
- `reunion-parcnational.fr` : Parc national de La Réunion
- `reunion.gouv.fr` : Préfecture de La Réunion

Les sites des offices de tourisme n'y sont pas : leurs domaines n'ont pas de format commun sûr. **La liste définitive est à fixer par le CEO** ; chaque ajout se fait un domaine à la fois.

## Règles

- **Extrait exact obligatoire.** Une phrase copiée de la page, sans reformulation. Sans extrait, rien n'est proposé.
- **Extraits courts** : une ou deux phrases par champ, juste ce qui appuie l'information (droit de citation).
- **Sources contradictoires** : ne pas trancher. Le champ du module reste ou passe à « à vérifier », et la `note` cite les deux sources.
- **Sécurité relue par un humain** : tout extrait sur la baignade, les rivières, les crues, le volcan, les sentiers, la vigilance ou les urgences est relu par le CEO, jamais validé par un agent.
- **Aucun contact de prestataire** : pas de téléphone, d'e-mail, de nom de personne ni de tarif négocié dans les extraits ou les notes (dépôt public).
- Ne jamais inventer un chiffre : si la page ne le donne pas, le module garde « à vérifier ».
