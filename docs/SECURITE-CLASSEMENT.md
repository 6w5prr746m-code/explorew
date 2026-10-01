# Classement `securite` des 200 modules

Champ `securite` de `public/data/modules.json` : quels réflexes de l'onglet Pratique s'appliquent au module.
`marche` → « Avant de marcher » (fiche, vue Aujourd'hui, rappel agenda la veille) ; `baignade` → « Baignade » (fiche, vue Aujourd'hui).
Classement fait le 2026-10-01 d'après titre, lieu, zone, essentiel et astuce, sans information nouvelle. En cas de doute, le rappel est gardé.

Répartition : 50 `marche` seul · 33 `baignade` seul · 20 les deux · 97 aucun.

## Cas où j'ai hésité (à relire en priorité)

Inclus par prudence :
- **AV-D10, AV-J9** (VTT depuis le Maïdo) : pas une marche, mais activité de montagne → `marche`.
- **NE-05** (Voie lactée au Maïdo, de nuit) : montagne, froid, nuit → `marche`.
- **LA-J5** (bien-être à Cilaos) : Roche Merveilleuse est un belvédère de montagne → `marche`.
- **LA-J9, SL-04** (Saint-Gilles sans voiture) : balade à pied littorale, peu « montagne » → `marche` gardé, plus `baignade`.
- **FA-16** (4×4 volcan et cascades) : « sans longues marches » mais courtes marches au volcan et arrêts aux cascades → les deux.
- **AV-D11, FA-19, PB-14** (tunnels de lave) : progression à pied hors zone urbaine → `marche`.
- **LA-D19, NE-15** (Cap La Houssaye) et **PB-18** (cascades en crue) : la baignade y est exclue, mais le rappel « Baignade » renforce l'interdiction → `baignade`.
- **RA-D6** (pointe des Cascades) : cascades qui tombent dans l'océan → `baignade` en plus de `marche`.
- **RA-J4, NE-20** (Grand Bassin) : bassin et cascade au bout du sentier → `baignade` en plus de `marche`.
- **LA-D2, LA-D5, LA-D18, LA-J6, SL-10** : la baignade n'est pas l'activité principale mais elle est possible sur place → `baignade`.

Laissés sans rappel (choix discutables) :
- **AV-D9** (kayak-raft) : `baignade` seul, pas de sentier décrit.
- **AV-D14** (parachute ascensionnel) : tracté au-dessus de la baie, aucune mise à l'eau décrite.
- **LA-D3, FA-09, SL-15** (sortie cétacés en bateau) : aucune mise à l'eau décrite.
- **LA-D15, PB-11** (thermes) et **LA-D16, PB-12** (spa) : bains encadrés en intérieur, hors réflexe « Baignade ».
- **RA-D3, EP-J9** (Voile de la Mariée, Hell-Bourg) : cascade vue depuis la route, village.
- **FA-04** (Croc Parc) : la plage n'est que citée.
- **FA-06** (bateaux électriques de la Mare à Joncs) : sur un étang, sans baignade.
- **FA-07** (luge du Maïdo) : parc de loisirs aménagé, malgré l'altitude.
- **EP-D14** (labyrinthe en champ de thé) : parcours aménagé, assimilé à un jardin.

## Tableau

| Code | Titre | securite | Justification |
| --- | --- | --- | --- |
| AV-D1 | Parapente biplace au-dessus du lagon | aucun | Vol en parapente, ni sentier ni mise à l'eau |
| AV-D2 | Canyoning Fleur Jaune, parcours découverte | `marche`, `baignade` | Canyoning : approche à pied, sauts et bassins |
| AV-D3 | Canyoning de la Rivière des Roches | `marche`, `baignade` | Canyoning en rivière : marche, sauts, bassins |
| AV-D4 | Survol des cirques en hélicoptère | aucun | Survol en hélicoptère, aucune marche ni eau |
| AV-D5 | Canyoning du Bras Rouge | `marche`, `baignade` | Canyoning : rappels, toboggans, approche à pied |
| AV-D6 | Canyoning de la rivière Langevin | `marche`, `baignade` | Canyoning en rivière : cascades, toboggans, sauts |
| AV-D7 | Canyoning de Sainte-Suzanne | `marche`, `baignade` | Canyoning : marche et mise à l'eau |
| AV-D8 | Canyoning de Takamaka | `marche`, `baignade` | Canyon physique en rivière, approche à pied |
| AV-D9 | Kayak-raft sur la Rivière des Marsouins | `baignade` | Kayak-raft en rivière, mise à l'eau sans sentier |
| AV-D10 | Descente VTT du Maïdo avec navette | `marche` | VTT de montagne depuis le Maïdo, inclus par prudence |
| AV-D11 | Spéléo dans les tunnels de lave | `marche` | Progression à pied dans des tunnels de lave |
| AV-D12 | Saut en parachute tandem (3 000 m) | aucun | Saut en parachute, ni marche ni baignade |
| AV-D13 | Initiation au pilotage de parapente | aucun | Vol en parapente, ni sentier ni mise à l'eau |
| AV-D14 | Parachute ascensionnel | aucun | Tracté par bateau dans les airs, pas de baignade |
| AV-D15 | Survol en ULM | aucun | Vol en ULM, ni marche ni baignade |
| AV-D16 | Parc aventure et accrobranche | aucun | Parcours dans les arbres en parc aménagé |
| AV-D17 | Plongée bouteille : baptême ou exploration | `baignade` | Plongée bouteille en mer |
| AV-D18 | Randonnée aquatique en rivière | `marche`, `baignade` | Randonnée aquatique : rivière à pied et à la nage |
| AV-D19 | Marche sur les coulées du Grand Brûlé | `marche` | Marche sur les coulées de lave |
| AV-D20 | Canyon de Ti Cap (saison des pluies) | `marche`, `baignade` | Canyon : toboggans près de la cascade |
| AV-J1 | Piton de la Fournaise, cratère Dolomieu | `marche` | Randonnée au volcan jusqu'au cratère |
| AV-J2 | Piton des Neiges, nuit à la Caverne Dufour | `marche` | Montée en montagne au Piton des Neiges |
| AV-J3 | Canyon du Trou Blanc | `marche`, `baignade` | Canyon vertical en rivière, approche à pied |
| AV-J4 | Canyon Fleur Jaune intégral | `marche`, `baignade` | Canyon intégral : 7 cascades, marche et eau |
| AV-J5 | Alpinisme aux Trois Salazes | `marche` | Approche à pied et alpinisme en montagne |
| AV-J6 | Canyon du Trou de Fer | `marche`, `baignade` | Canyon expert au pied de la cascade |
| AV-J7 | Grand Bénare depuis le Maïdo | `marche` | Randonnée sur la crête jusqu'au Grand Bénare |
| AV-J8 | Tour de Mafate (GR R3) | `marche` | Randonnée de plusieurs jours dans Mafate |
| AV-J9 | Journée 100 % adrénaline Ouest | `marche` | Maïdo à l'aube et VTT de montagne |
| AV-J10 | Traversée de l'île à pied (GR R2) | `marche` | Traversée de l'île à pied par les sentiers |
| EP-D1 | Marché de Saint-Paul | aucun | Marché en ville |
| EP-D2 | Domaine du Café Grillé | aucun | Visite de domaine et jardin aménagé |
| EP-D3 | Plantation de la Vanille Roulof | aucun | Visite de plantation de vanille |
| EP-D4 | Saga du Rhum | aucun | Musée du rhum et dégustation |
| EP-D5 | Saint-Denis patrimonial | aucun | Visite patrimoniale en ville |
| EP-D6 | Distillerie Rivière du Mât | aucun | Visite de distillerie |
| EP-D7 | Musée Stella Matutina | aucun | Musée en ancienne usine |
| EP-D8 | Musée de Villèle | aucun | Musée en propriété historique |
| EP-D9 | MADOI, arts de l'océan Indien | aucun | Musée d'arts décoratifs |
| EP-D10 | Musée Léon-Dierx et Muséum | aucun | Musées en centre-ville |
| EP-D11 | Atelier de cuisine créole | aucun | Atelier de cuisine en intérieur |
| EP-D12 | Vanille du Sud sauvage | aucun | Visite de plantations de vanille |
| EP-D13 | Domaine de Beaubassin | aucun | Visite de maison créole |
| EP-D14 | Labyrinthe en Champ Thé | aucun | Champ de thé aménagé en labyrinthe |
| EP-D15 | Maison du Curcuma | aucun | Visite de producteur de curcuma |
| EP-D16 | Maison du Géranium | aucun | Visite de distillerie de géranium |
| EP-D17 | Marchés de Saint-Denis | aucun | Marchés en ville |
| EP-D18 | Marché couvert de Saint-Pierre | aucun | Marché couvert en ville |
| EP-D19 | Temples tamouls de Saint-André | aucun | Visite de temples en ville |
| EP-D20 | Soirée maloya | aucun | Soirée musicale |
| EP-J1 | Du champ à l'assiette | aucun | Visite de ferme et repas partagé |
| EP-J2 | Route du sucre et du rhum | aucun | Musées et dégustation |
| EP-J3 | Route de la vanille et du rhum de l'Est | aucun | Temples, plantation et distillerie |
| EP-J4 | Saint-Denis en une journée | aucun | Visites en ville et musées |
| EP-J5 | Saint-Paul, berceau de l'île | aucun | Marché, musée et visites en ville |
| EP-J6 | Saint-Pierre et Saint-Louis | aucun | Marché, musées et église en ville |
| EP-J7 | Route des épices et du thé du Sud | aucun | Champ de thé, producteur et jardin |
| EP-J8 | Cilaos terroir | aucun | Producteurs et artisans au village |
| EP-J9 | Hell-Bourg et Salazie | aucun | Cascade vue de la route, village et repas |
| EP-J10 | Vivre une fête locale | aucun | Fête locale |
| FA-01 | Kélonia, observatoire des tortues | aucun | Observatoire et musée des tortues |
| FA-02 | Aquarium de La Réunion | aucun | Aquarium en intérieur |
| FA-03 | Cité du Volcan | aucun | Musée du volcan en intérieur |
| FA-04 | Croc Parc | aucun | Parc animalier, plage seulement citée |
| FA-05 | Sentier sous-marin de l'Ermitage | `baignade` | Snorkeling sur le sentier sous-marin |
| FA-06 | Bateaux électriques de la Mare à Joncs | aucun | Petits bateaux sur un étang, sans baignade |
| FA-07 | Parc de la Luge du Maïdo | aucun | Parc de loisirs aménagé |
| FA-08 | Parcours acrobatiques des Palmistes | aucun | Parcours acrobatique en parc aménagé |
| FA-09 | Dauphins et baleines en famille | aucun | Sortie en bateau, sans mise à l'eau décrite |
| FA-10 | Jardin des Parfums et des Épices | aucun | Jardin de plantes aménagé |
| FA-11 | Maison du Coco | aucun | Cocoteraie et ateliers |
| FA-12 | Jardin de l'État et Muséum | aucun | Jardin public et musée en ville |
| FA-13 | Conservatoire de Mascarin | aucun | Jardin botanique aménagé |
| FA-14 | Bassin de Manapany | `baignade` | Piscine naturelle en bord de mer |
| FA-15 | Plaine des Sables avec un guide | `marche` | Randonnée volcanique guidée |
| FA-16 | Excursion 4×4 volcan et cascades | `marche`, `baignade` | Volcan et cascades, courtes marches possibles |
| FA-17 | Jeu de piste des cases de Hell-Bourg | aucun | Jeu de piste dans le village |
| FA-18 | Forêt de Bélouve en famille | `marche` | Boucle à pied en forêt de Bélouve |
| FA-19 | Tunnels de lave dès 5 ans | `marche` | Progression à pied dans des tunnels de lave |
| FA-20 | Du champ à l'assiette en famille | aucun | Visite de ferme et repas |
| LA-D1 | Snorkeling de l'Ermitage à La Saline | `baignade` | Snorkeling dans le lagon |
| LA-D2 | Pointe au Sel puis coucher de soleil à Boucan | `baignade` | Plage de Boucan Canot, baignade possible |
| LA-D3 | Sortie en mer : dauphins et baleines | aucun | Sortie en bateau, aucune mise à l'eau décrite |
| LA-D4 | Kayak transparent et paddle au coucher du soleil | `baignade` | Kayak et paddle sur le lagon |
| LA-D5 | Massage sur le lagon | `baignade` | Soin au bord du lagon, baignade possible |
| LA-D6 | Plage de Boucan Canot | `baignade` | Plage avec zone de baignade |
| LA-D7 | Plage des Roches Noires | `baignade` | Plage surveillée et piscine naturelle |
| LA-D8 | Lagon de Saint-Leu | `baignade` | Lagon et plage, baignade |
| LA-D9 | Sable noir de l'Étang-Salé et son gouffre | `baignade` | Plage et zone de lagon, baignade |
| LA-D10 | Grande Anse et sa piscine naturelle | `baignade` | Piscine naturelle aménagée pour la baignade |
| LA-D11 | Bassin de baignade de Manapany | `baignade` | Bassin naturel de baignade en bord de mer |
| LA-D12 | Cascade Langevin (Grand Galet) | `baignade` | Cascade et bassin profond en rivière |
| LA-D13 | Bassins La Paix et La Mer | `baignade` | Bassins d'eau douce en rivière, non surveillés |
| LA-D14 | Bassins de la ravine Saint-Gilles | `baignade` | Bassins d'eau douce en ravine |
| LA-D15 | Thermes de Cilaos | aucun | Établissement thermal, bains encadrés en intérieur |
| LA-D16 | Spa d'hôtel sur la côte Ouest | aucun | Spa et piscine d'hôtel, aucune eau libre |
| LA-D17 | Conservatoire botanique de Mascarin | aucun | Jardin botanique, lagon vu de loin |
| LA-D18 | Pique-nique créole du dimanche | `baignade` | Pique-nique sur les plages, baignade probable |
| LA-D19 | Coucher de soleil au Cap La Houssaye | `baignade` | Rivage où la baignade est interdite : rappel utile |
| LA-D20 | Observer les étoiles en mer | aucun | Sortie en bateau de nuit, sans mise à l'eau |
| LA-J1 | Sud sauvage : Grande Anse, Manapany, Cap Méchant | `baignade` | Piscine naturelle et bassin de baignade |
| LA-J2 | La route des plages de l'Ouest | `baignade` | Une plage par étape, baignade |
| LA-J3 | Journée lagon complète à l'Ermitage | `baignade` | Snorkeling et kayak dans le lagon |
| LA-J4 | Cascades et bassins de l'Est | `baignade` | Cascades et bassins de rivière |
| LA-J5 | Journée bien-être à Cilaos | `marche` | Belvédère de Roche Merveilleuse en montagne, par prudence |
| LA-J6 | Saint-Pierre côté mer | `baignade` | Plage de Saint-Pierre, baignade possible |
| LA-J7 | Journée tortues : Kélonia et lagon | `baignade` | Baignade et snorkeling dans le lagon |
| LA-J8 | Croisière en catamaran | `baignade` | Baignade à bord selon le prestataire |
| LA-J9 | Journée sans voiture à Saint-Gilles | `marche`, `baignade` | Balade à pied littorale et plages |
| LA-J10 | Mini-séjour 3 jours 100 % farniente | `baignade` | Lagon, plages et sortie en mer |
| NE-01 | Observatoire des Makes, de jour | aucun | Observatoire astronomique de jour |
| NE-02 | Soirée d'observation aux Makes | aucun | Soirée à l'observatoire |
| NE-03 | Sortie astronomie Makes Astro | aucun | Sortie astronomie encadrée |
| NE-04 | Nuit en bulle transparente | aucun | Nuit en bulle chauffée |
| NE-05 | Voie lactée au Maïdo | `marche` | Nuit en montagne au Maïdo, par prudence |
| NE-06 | Étoiles en mer | aucun | Sortie en bateau de nuit |
| NE-07 | Lever du soleil au Maïdo | `marche` | Lever du soleil au belvédère du Maïdo |
| NE-08 | Lever du soleil au Piton des Neiges | `marche` | Lever du soleil au sommet, à pied |
| NE-09 | Lever du soleil à la Roche Écrite | `marche` | Lever du soleil au sommet, à pied |
| NE-10 | Fournaise à l'aube | `marche` | Volcan à l'aube |
| NE-11 | Bivouac à Mafate | `marche` | Bivouac dans le cirque sans route |
| NE-12 | Glamping à Saint-Pierre | aucun | Hébergement en glamping |
| NE-13 | Nuit en roulotte | aucun | Hébergement en roulotte |
| NE-14 | Soirée maloya ou kabar | aucun | Soirée musicale |
| NE-15 | Coucher de soleil au Cap La Houssaye | `baignade` | Rivage sans baignade, rappel utile |
| NE-16 | Coucher de soleil à Boucan | `baignade` | Plage de Boucan, baignade possible |
| NE-17 | Kayak transparent au crépuscule | `baignade` | Kayak sur le lagon |
| NE-18 | Observer une éruption en sécurité | `marche` | Sites d'observation du volcan, à pied |
| NE-19 | Soirée à Hell-Bourg | aucun | Soirée au village |
| NE-20 | Nuit à Grand Bassin | `marche`, `baignade` | Descente à pied à Grand Bassin, bassins proches |
| PB-01 | Basculer vers la côte Ouest | aucun | Conseil de trajet en voiture |
| PB-02 | Cité du Volcan | aucun | Musée du volcan en intérieur |
| PB-03 | Aquarium de La Réunion | aucun | Aquarium en intérieur |
| PB-04 | Kélonia | aucun | Musée et bassins de soins des tortues |
| PB-05 | Musée Stella Matutina | aucun | Musée en intérieur |
| PB-06 | Saga du Rhum | aucun | Musée et dégustation |
| PB-07 | Distillerie Rivière du Mât | aucun | Visite de distillerie |
| PB-08 | Musée de Villèle | aucun | Musée en intérieur |
| PB-09 | MADOI | aucun | Musée en intérieur |
| PB-10 | Léon-Dierx et Muséum | aucun | Musées en intérieur |
| PB-11 | Thermes de Cilaos | aucun | Établissement thermal en intérieur |
| PB-12 | Spa d'hôtel | aucun | Spa en intérieur |
| PB-13 | Atelier de cuisine créole | aucun | Atelier de cuisine en intérieur |
| PB-14 | Tunnels de lave | `marche` | Progression à pied dans des tunnels de lave |
| PB-15 | Plantation de vanille | aucun | Visite de plantation sous abri |
| PB-16 | Marchés couverts | aucun | Marchés couverts |
| PB-17 | Maison de la broderie | aucun | Musée de la broderie |
| PB-18 | Cascades en pleine eau | `baignade` | Rivières en crue : rappel de non-baignade utile |
| PB-19 | Journée carnet de voyage | aucun | Journée au calme, sans activité extérieure |
| PB-20 | Jour d'alerte : rester à l'abri | aucun | Rester à l'abri |
| RA-D1 | Lever de soleil au belvédère du Maïdo | `marche` | Belvédère de montagne à 2 000 m, à pied |
| RA-D2 | Bélouve → belvédère du Trou de Fer | `marche` | Sentier forestier jusqu'au Trou de Fer |
| RA-D3 | Voile de la Mariée et Hell-Bourg | aucun | Cascade vue de la route, visite du village |
| RA-D4 | Maïdo → Piton des Orangers | `marche` | Randonnée sur le rempart de Mafate |
| RA-D5 | Chemin pavé Bellemène – Lougnon | `marche` | Randonnée sur un ancien chemin pavé |
| RA-D6 | Boucle de la pointe des Cascades | `marche`, `baignade` | Boucle à pied, cascades et océan proches |
| RA-D7 | Hell-Bourg → Bélouve | `marche` | Montée soutenue à pied jusqu'à Bélouve |
| RA-D8 | Pic d'Adam | `marche` | Randonnée jusqu'au Pic d'Adam |
| RA-D9 | Boucle du Cap Noir | `marche` | Boucle à pied avec passages à échelles |
| RA-D10 | Canal Augustave → Aurère | `marche` | Sentier exposé le long d'un canal |
| RA-D11 | Piton Rouge | `marche` | Randonnée jusqu'au Piton Rouge |
| RA-D12 | Sentier littoral du Cap Méchant | `marche` | Sentier littoral sur falaises de lave |
| RA-D13 | Pas de Bellecombe → Formica Leo | `marche` | Randonnée dans l'enclos du volcan |
| RA-D14 | Nez de Bœuf et cratère Commerson | `marche` | Belvédères du volcan atteints à pied |
| RA-D15 | Roche Merveilleuse | `marche` | Belvédère de montagne atteint à pied |
| RA-D16 | Sentier de La Chapelle | `marche`, `baignade` | Sentier de fond de cirque, marche dans l'eau |
| RA-D17 | Montée au col du Taïbit | `marche` | Montée à pied au col du Taïbit |
| RA-D18 | Sentier botanique de Mare Longue | `marche` | Sentier botanique en forêt |
| RA-D19 | Col des Bœufs → Plaine des Tamarins | `marche` | Sentier d'entrée dans Mafate |
| RA-D20 | Balade en forêt de Bébour | `marche` | Balade à pied en forêt de Bébour |
| RA-J1 | Mafate en 2 jours par le Col des Bœufs | `marche` | Randonnée de deux jours dans Mafate |
| RA-J2 | Cascade du Bras Rouge depuis Cilaos | `marche`, `baignade` | Descente à pied, cascade et bassins |
| RA-J3 | Le Haut Mafate | `marche` | Journée de montagne dans les îlets |
| RA-J4 | Grand Bassin, le bout du monde | `marche`, `baignade` | Randonnée vers Grand Bassin et sa cascade |
| RA-J5 | Roche Écrite avec nuit en gîte | `marche` | Randonnée en montagne avec nuit en gîte |
| RA-J6 | Bélouve → gîte du Piton des Neiges | `marche` | Randonnée de Bélouve à la Caverne Dufour |
| RA-J7 | Le Dimitile, balcon sur Cilaos | `marche` | Randonnée sur le rempart du Dimitile |
| RA-J8 | Tour du Piton des Neiges (GR R1) | `marche` | Tour à pied de plusieurs jours (GR R1) |
| RA-J9 | Salazie → Mafate → Cilaos en 3 jours | `marche` | Traversée des cirques à pied en 3 jours |
| RA-J10 | Randonnée avec un accompagnateur | `marche` | Randonnée guidée sur sentiers exigeants |
| SL-01 | Ligne touristique T du Car Jaune | aucun | Trajet en bus |
| SL-02 | M-Ticket et carte yPass | aucun | Titres de transport sur smartphone |
| SL-03 | Téléphérique urbain de Saint-Denis | aucun | Téléphérique urbain |
| SL-04 | Journée sans voiture à Saint-Gilles | `marche`, `baignade` | Marche entre plages et lagon |
| SL-05 | Le littoral Ouest à vélo | aucun | Vélo sur pistes cyclables du littoral |
| SL-06 | Une semaine dans un seul village | `marche` | Séjour dans un cirque, tout à pied |
| SL-07 | Mafate, cirque sans route | `marche` | Cirque sans route, accès à pied |
| SL-08 | Nuit en Accueil Paysan | aucun | Hébergement chez l'habitant |
| SL-09 | Roulotte à la Ferme du Kilimandjaro | aucun | Hébergement en roulotte |
| SL-10 | Camping à la ferme du Bois Joli Cœur | `baignade` | Camping près des bassins, baignade possible |
| SL-11 | Rencontre avec un agriculteur | aucun | Visite de ferme |
| SL-12 | Atelier de tressage du vacoa | aucun | Atelier d'artisanat |
| SL-13 | Fruits de saison au marché | aucun | Marché |
| SL-14 | Crème solaire respectueuse du récif | `baignade` | Geste pour la baignade dans le lagon |
| SL-15 | Cétacés selon la charte | aucun | Observation des cétacés depuis un bateau |
| SL-16 | Fête religieuse, avec respect | aucun | Fête religieuse |
| SL-17 | Journée déconnexion | `marche`, `baignade` | Une randonnée et un bassin au programme |
| SL-18 | Voyager hors saison | aucun | Conseil de calendrier, pas une activité |
| SL-19 | Accompagnateur local | `marche` | Randonnée avec accompagnateur dans les Hauts |
| SL-20 | Ramener des produits péï | aucun | Achat de produits locaux |
