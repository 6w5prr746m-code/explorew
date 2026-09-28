# Proposition de coordonnées GPS

Généré par `npm run geo:proposer` le 2026-09-28. **Rien n'est fusionné dans `modules.json` tant que vous n'avez pas passé une entrée à `"statut": "valide"` dans `proposition.json`, puis lancé `npm run geo:fusionner`.**

Source unique : GeoNames Gazetteer (https://www.geonames.org), via le paquet npm cities.json 1.1.64, licence CC BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Aucune coordonnée n'a été estimée ou inventée.

| Statut | Modules | Signification |
| --- | --- | --- |
| a-relire | 80 | Point central de la localité nommée dans « lieu ». Suffisant pour la carte schématique, pas pour guider sur place. |
| a-geocoder | 65 | Site précis (belvédère, gîte, sentier…) absent de la source : à relever sur IGN Géoportail ou OpenStreetMap. |
| sans-point-unique | 55 | Itinéraire, plusieurs lieux ou lieu variable : laisser `geo` à null (la carte place le module au centre de sa zone). |

## À relire (80)

| Code | Titre | Lieu | lat, lng |
| --- | --- | --- | --- |
| AV-D2 | Canyoning Fleur Jaune, parcours découverte | Cilaos | -21.13641, 55.47187 |
| AV-D3 | Canyoning de la Rivière des Roches | Bras-Panon | -20.99667, 55.67823 |
| AV-D5 | Canyoning du Bras Rouge | Cilaos | -21.13641, 55.47187 |
| AV-D6 | Canyoning de la rivière Langevin | Saint-Joseph | -21.3777, 55.61691 |
| AV-D7 | Canyoning de Sainte-Suzanne | Sainte-Suzanne | -20.90616, 55.60788 |
| AV-D8 | Canyoning de Takamaka | Saint-Benoît | -21.03795, 55.71546 |
| AV-D9 | Kayak-raft sur la Rivière des Marsouins | Saint-Benoît | -21.03795, 55.71546 |
| AV-D11 | Spéléo dans les tunnels de lave | Départ Saint-Pierre | -21.3393, 55.47811 |
| AV-D13 | Initiation au pilotage de parapente | Saint-Leu | -21.17059, 55.28824 |
| AV-D14 | Parachute ascensionnel | Saint-Paul | -21.00961, 55.27134 |
| AV-D15 | Survol en ULM | Saint-Paul | -21.00961, 55.27134 |
| AV-D16 | Parc aventure et accrobranche | Saint-Pierre | -21.3393, 55.47811 |
| AV-J2 | Piton des Neiges, nuit à la Caverne Dufour | Cilaos | -21.13641, 55.47187 |
| AV-J3 | Canyon du Trou Blanc | Salazie | -21.0271, 55.5395 |
| AV-J4 | Canyon Fleur Jaune intégral | Cilaos | -21.13641, 55.47187 |
| LA-D8 | Lagon de Saint-Leu | Saint-Leu | -21.17059, 55.28824 |
| LA-D9 | Sable noir de l'Étang-Salé et son gouffre | L'Étang-Salé | -21.25, 55.38333 |
| LA-D10 | Grande Anse et sa piscine naturelle | Petite-Île | -21.35327, 55.56427 |
| LA-D11 | Bassin de baignade de Manapany | Saint-Joseph | -21.3777, 55.61691 |
| LA-D12 | Cascade Langevin (Grand Galet) | Saint-Joseph | -21.3777, 55.61691 |
| LA-D13 | Bassins La Paix et La Mer | Saint-Benoît | -21.03795, 55.71546 |
| LA-D15 | Thermes de Cilaos | Cilaos | -21.13641, 55.47187 |
| LA-D19 | Coucher de soleil au Cap La Houssaye | Saint-Paul | -21.00961, 55.27134 |
| LA-J5 | Journée bien-être à Cilaos | Cilaos | -21.13641, 55.47187 |
| LA-J6 | Saint-Pierre côté mer | Saint-Pierre | -21.3393, 55.47811 |
| LA-J7 | Journée tortues : Kélonia et lagon | Saint-Leu | -21.17059, 55.28824 |
| RA-D3 | Voile de la Mariée et Hell-Bourg | Salazie | -21.0271, 55.5395 |
| RA-D6 | Boucle de la pointe des Cascades | Sainte-Rose | -21.12858, 55.79616 |
| RA-D12 | Sentier littoral du Cap Méchant | Saint-Philippe | -21.36086, 55.7679 |
| RA-D15 | Roche Merveilleuse | Cilaos | -21.13641, 55.47187 |
| RA-D16 | Sentier de La Chapelle | Cilaos | -21.13641, 55.47187 |
| RA-D17 | Montée au col du Taïbit | Cilaos | -21.13641, 55.47187 |
| RA-D18 | Sentier botanique de Mare Longue | Saint-Philippe | -21.36086, 55.7679 |
| RA-D19 | Col des Bœufs → Plaine des Tamarins | Salazie | -21.0271, 55.5395 |
| RA-D20 | Balade en forêt de Bébour | Plaine des Palmistes | -21.13425, 55.62819 |
| RA-J2 | Cascade du Bras Rouge depuis Cilaos | Cilaos | -21.13641, 55.47187 |
| RA-J3 | Le Haut Mafate | Départ Salazie | -21.0271, 55.5395 |
| RA-J7 | Le Dimitile, balcon sur Cilaos | Entre-Deux | -21.23333, 55.46667 |
| EP-D1 | Marché de Saint-Paul | Saint-Paul | -21.00961, 55.27134 |
| EP-D2 | Domaine du Café Grillé | Saint-Pierre | -21.3393, 55.47811 |
| EP-D3 | Plantation de la Vanille Roulof | Saint-André | -20.96333, 55.65031 |
| EP-D4 | Saga du Rhum | Saint-Pierre | -21.3393, 55.47811 |
| EP-D5 | Saint-Denis patrimonial | Saint-Denis | -20.88231, 55.4504 |
| EP-D6 | Distillerie Rivière du Mât | Saint-Benoît | -21.03795, 55.71546 |
| EP-D7 | Musée Stella Matutina | Piton Saint-Leu | -21.21962, 55.31513 |
| EP-D8 | Musée de Villèle | Saint-Paul | -21.00961, 55.27134 |
| EP-D9 | MADOI, arts de l'océan Indien | Saint-Louis | -21.28585, 55.41124 |
| EP-D10 | Musée Léon-Dierx et Muséum | Saint-Denis | -20.88231, 55.4504 |
| EP-D15 | Maison du Curcuma | Saint-Joseph | -21.3777, 55.61691 |
| EP-D17 | Marchés de Saint-Denis | Saint-Denis | -20.88231, 55.4504 |
| EP-D18 | Marché couvert de Saint-Pierre | Saint-Pierre | -21.3393, 55.47811 |
| EP-D19 | Temples tamouls de Saint-André | Saint-André | -20.96333, 55.65031 |
| EP-J4 | Saint-Denis en une journée | Saint-Denis | -20.88231, 55.4504 |
| EP-J5 | Saint-Paul, berceau de l'île | Saint-Paul | -21.00961, 55.27134 |
| EP-J8 | Cilaos terroir | Cilaos | -21.13641, 55.47187 |
| FA-01 | Kélonia, observatoire des tortues | Saint-Leu | -21.17059, 55.28824 |
| FA-04 | Croc Parc | L'Étang-Salé | -21.25, 55.38333 |
| FA-06 | Bateaux électriques de la Mare à Joncs | Cilaos | -21.13641, 55.47187 |
| FA-08 | Parcours acrobatiques des Palmistes | Plaine des Palmistes | -21.13425, 55.62819 |
| FA-10 | Jardin des Parfums et des Épices | Saint-Philippe | -21.36086, 55.7679 |
| FA-11 | Maison du Coco | Saint-Leu | -21.17059, 55.28824 |
| FA-12 | Jardin de l'État et Muséum | Saint-Denis | -20.88231, 55.4504 |
| FA-13 | Conservatoire de Mascarin | Saint-Leu | -21.17059, 55.28824 |
| FA-14 | Bassin de Manapany | Saint-Joseph | -21.3777, 55.61691 |
| FA-19 | Tunnels de lave dès 5 ans | Départ Saint-Pierre | -21.3393, 55.47811 |
| SL-03 | Téléphérique urbain de Saint-Denis | Saint-Denis | -20.88231, 55.4504 |
| PB-04 | Kélonia | Saint-Leu | -21.17059, 55.28824 |
| PB-05 | Musée Stella Matutina | Piton Saint-Leu | -21.21962, 55.31513 |
| PB-06 | Saga du Rhum | Saint-Pierre | -21.3393, 55.47811 |
| PB-07 | Distillerie Rivière du Mât | Saint-Benoît | -21.03795, 55.71546 |
| PB-08 | Musée de Villèle | Saint-Paul | -21.00961, 55.27134 |
| PB-09 | MADOI | Saint-Louis | -21.28585, 55.41124 |
| PB-10 | Léon-Dierx et Muséum | Saint-Denis | -20.88231, 55.4504 |
| PB-11 | Thermes de Cilaos | Cilaos | -21.13641, 55.47187 |
| PB-14 | Tunnels de lave | Départ Saint-Pierre | -21.3393, 55.47811 |
| PB-15 | Plantation de vanille | Saint-André | -20.96333, 55.65031 |
| PB-17 | Maison de la broderie | Cilaos | -21.13641, 55.47187 |
| NE-12 | Glamping à Saint-Pierre | Saint-Pierre | -21.3393, 55.47811 |
| NE-15 | Coucher de soleil au Cap La Houssaye | Saint-Paul | -21.00961, 55.27134 |
| NE-20 | Nuit à Grand Bassin | Le Tampon | -21.2766, 55.51766 |

## À géocoder (65)

Regroupés par lieu : un seul relevé sert à plusieurs modules.

| Lieu | Modules |
| --- | --- |
| Saint-Gilles | LA-D6, LA-D7, LA-D14, LA-J9, FA-02, FA-09, SL-04, PB-03, NE-16 |
| Maïdo | AV-J7, RA-D4, FA-07, NE-07 |
| Hell-Bourg | RA-D7, EP-J9, FA-17, NE-19 |
| Pas de Bellecombe | AV-J1, RA-D13, NE-10 |
| Bélouve | AV-J6, RA-J6, FA-18 |
| Ermitage | LA-D1, LA-J3, FA-05 |
| Hauts de Saint-Denis | RA-D8, RA-J5, EP-D13 |
| Saint-Leu (Colimaçons) | AV-D1, LA-D17 |
| Mafate | AV-J8, SL-07 |
| Port de Saint-Gilles | LA-D3, LA-J8 |
| La Saline | LA-D4, NE-17 |
| Route du Volcan | RA-D14, FA-15 |
| Bourg-Murat | FA-03, PB-02 |
| Sainte-Anne | FA-20, SL-10 |
| Plaine des Cafres | SL-09, NE-13 |
| Les Makes | NE-02, NE-03 |
| Départ côte Ouest | AV-D4 |
| Pierrefonds | AV-D12 |
| Route des Laves | AV-D19 |
| Langevin | AV-D20 |
| Col du Taïbit | AV-J5 |
| Maïdo (plus de 2 000 m) | RA-D1 |
| Gîte de Bélouve | RA-D2 |
| Hauts de Saint-Paul | RA-D5 |
| Dos d'Âne | RA-D9 |
| Hauts de Saint-Leu | RA-D11 |
| Le Tampon (Bois Court) | RA-J4 |
| Hauts de Saint-Joseph | EP-D14 |
| Le Guillaume (Saint-Paul) | EP-D16 |
| Hauts de Sainte-Anne | EP-J1 |
| Les Makes (Saint-Louis) | NE-01 |
| Les Makes (1 500 m) | NE-04 |
| Caverne Dufour | NE-08 |
| Plaine des Chicots | NE-09 |

## Sans point unique (55)

`AV-D10` Maïdo → côte Ouest · `AV-D17` Saint-Leu / Saint-Gilles · `AV-D18` Rivières de l'Est · `AV-J9` Maïdo → Saint-Leu · `AV-J10` Nord → Sud · `LA-D2` Saint-Leu → Boucan Canot · `LA-D5` Côte Ouest · `LA-D16` Côte Ouest · `LA-D18` Plages de l'Ouest · `LA-D20` Côte Ouest · `LA-J1` Petite-Île → Saint-Philippe · `LA-J2` Boucan → Saint-Leu · `LA-J4` Sainte-Suzanne → Sainte-Rose · `LA-J10` Côte Ouest · `RA-D10` Nord de Mafate · `RA-J1` Salazie → La Nouvelle / Marla · `RA-J8` Cilaos, Salazie, Mafate · `RA-J9` Col des Bœufs → Cilaos · `RA-J10` Au choix · `EP-D11` Saint-Gilles / Les Avirons · `EP-D12` Sainte-Rose / Le Tremblet · `EP-D20` Selon programmation · `EP-J2` Saint-Leu → Saint-Pierre · `EP-J3` Saint-André → Saint-Benoît · `EP-J6` Saint-Pierre / Saint-Louis · `EP-J7` Saint-Joseph → Saint-Philippe · `EP-J10` Selon l'événement · `FA-16` Volcan / Sud · `SL-01` Aéroports ↔ côte Ouest · `SL-02` Réseaux de bus · `SL-05` Côte Ouest · `SL-06` Hell-Bourg, Cilaos ou Entre-Deux · `SL-08` Hauts de l'île · `SL-11` Selon la ferme · `SL-12` Sud sauvage · `SL-13` Marchés · `SL-14` Lagon · `SL-15` Côte Ouest · `SL-16` Selon le calendrier · `SL-17` Au choix · `SL-18` Toute l'île · `SL-19` Au choix · `SL-20` Marchés et producteurs · `PB-01` Côte Ouest · `PB-12` Côte Ouest · `PB-13` Saint-Gilles / Les Avirons · `PB-16` Saint-Pierre / Saint-Denis · `PB-18` Est / Salazie · `PB-19` Au choix · `PB-20` Toute l'île · `NE-05` Maïdo / Plaine des Cafres · `NE-06` Côte Ouest · `NE-11` Campings de Mafate · `NE-14` Selon programmation · `NE-18` Selon l'éruption
