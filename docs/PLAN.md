# Plan du projet : priorisation des importations et de l'investissement industriel en Algérie

Outil d'aide à la décision : un modèle de scoring configurable et une visualisation des chaînes de valeur. Ce plan découpe le travail en 8 phases et 17 prompts exécutables (`prompts/`). Chaque phase se termine par une validation.

## Vue d'ensemble

| Phase | Objet | Prompts | Livrable | Validation |
|---|---|---|---|---|
| 0 | Cadrage | 01 | `config/projet.yaml`, `docs/cadrage.md` | choix de la filière et du pays |
| 1 | Étape 1 : graphe, statuts, critères | 02-05 | CSV manuels, 14 fiches, page de revue | **accord avant tout code** |
| 2 | Pipeline Python | 06-08 | `data/out/*.json`, schémas V1 et V2 | JSON valides, qualité des données connue |
| 3 | Moteur JavaScript | 09-11 | `engine/`, tests | cas simples justes |
| 4 | Interface web | 12-14 | `web/` | démonstration |
| 5 | Note méthodologique | 15 | note de 5 pages | relecture |
| 6 | Recette | 16 | `docs/recette.md`, `README.md` | anomalies bloquantes levées |
| 7 | V2 administrative | 17 | chargeurs V2 | après accès aux données |

```
01 → 02 → 03 → 04 → 05 ══ validation ══► 06 → 07 ─┬─► 08 ─────────────┐
                                                   └─► 09 → 10 → 11 ─┬─► 12 → 13 → 14 ─┬─► 16 → 17
                                                                     └─► 15 ───────────┘
```

## Décisions ouvertes

| # | Décision | Proposition | Tranchée au prompt |
|---|---|---|---|
| D1 | Filière pilote | pétrochimie → plasturgie | 01 |
| D2 | Pays de référence | Égypte ; Turquie et Maroc en comparateurs | 01 |
| D3 | Période BACI | moyenne 2021-2023 | 01 |
| D4 | Taux de change parallèle | saisi par l'utilisateur, daté et sourcé | 01 |
| D5 | RCA avec ou sans hydrocarbures | à voir sur les chiffres | 03 |
| D6 | Seuil d'importation « significative » | à voir sur les chiffres | 03 |
| D7 | Intrants critiques : en nombre ou en valeur | en nombre (plus lisible) | 04 |
| D8 | Donnée manquante dans le score | critère retiré, poids renormalisés, couverture affichée | 04 |
| D9 | Valeurs de démonstration autorisées | non par défaut | 07 |
| D10 | DRC inconnu et exclusion DRC ≥ 1 | ni exclu ni validé, signalé | 10 |
| D11 | Poids des préréglages | tableau du prompt 11 | 11 |
| D12 | Prototype de référence | **à fournir** (absent du dépôt) | avant 12 |

---

## Phase 0 : cadrage (prompt 01)

**But.** Choisir la filière pilote et le pays de référence sur pièces, vérifier que les données sont accessibles.

**Travail.**
- Comparaison de 4 filières : facture d'importation, taille et profondeur de la chaîne, mélange de statuts, ressource locale, réseau d'intrants publié, capacités, sensibilité juridique, risques.
- Comparaison de 4 pays de référence et de l'usage qu'on en fait.
- Test d'accès à chaque source (BACI, Growth Lab, WITS, BEC, réseaux publiés).
- Sources possibles des taux de change.

**Livrables.** `docs/cadrage.md`, puis `config/projet.yaml` et `docs/decisions.md` après tes réponses.

**Risque.** Réseau produit-produit publié non téléchargeable : le graphe pilote est alors entièrement manuel, ce qui allonge le prompt 02.

## Phase 1 : étape 1, à montrer avant de coder l'interface (prompts 02-05)

**But.** Le graphe de la filière, le statut de chaque nœud, la fiche de chaque critère avec sa source.

**02, graphe.** 25 à 45 nœuds HS6, étapes de l'amont à l'aval, arêtes critiques et secondaires sourcées une à une, nœuds frontière pour les intrants hors filière, capacités non marchandes. Contrôles : acyclique, étapes croissantes.

**03, statuts.** BACI en données miroir ; importations, exportations, RCA, fournisseurs ; statut `couvert`, `partiel`, `manquant`, `absent` avec preuve ; état des capacités. Variante du RCA hors hydrocarbures.

**04, critères.** 14 fiches YAML : définition, formule, source, normalisation, sens, type, poids par défaut, limites. Matrice de couverture critère × nœud avec la qualité de chaque valeur. Détection des doubles comptages.

**05, page de revue.** Une page HTML autonome : graphe, tableaux, fiches, matrice de couverture, liste des décisions à prendre.

**Sortie de phase.** Tu valides le périmètre, les statuts, les critères. Rien n'est codé au-delà avant cet accord.

**Risques.** Statut `partiel` difficile à prouver ; DRC, investissement, échelle minimale efficace sans source publique au niveau HS6 (resteront `estimated`, `demo` ou `missing`) ; HS6 trop agrégé pour certaines arêtes.

## Phase 2 : pipeline Python (prompts 06-08)

**But.** Des JSON reproductibles et validés : nœuds, arêtes, critères, capacités, entreprises, métadonnées.

**06, sources.** Un chargeur par source, cache, concordances HS, tests sur mini-fichiers.

**07, construction et schémas.** Assemblage en six JSON ; chaque valeur porte `raw`, `source`, `year`, `quality` ; la génération échoue plutôt que de combler un trou. Schémas des tables V2 (DGD, programmes prévisionnels, CNRC, DGI, CNAS, AAPI) dès maintenant. Filière jouet de 3 nœuds exportée pour les tests du moteur.

**08, entreprises.** Recensement sur sources publiques ; proximité entreprise × nœud décomposable ; liste d'éligibilité classée et justifiée.

**Sortie de phase.** `python -m pipeline.run` passe ; `meta.json` donne la part de valeurs réelles, estimées, de démonstration, manquantes.

## Phase 3 : moteur JavaScript (prompts 09-11)

**But.** Score, contraintes, séquençage, scénarios et robustesse, en fonctions pures testées, sans dépendance.

**09, score.** Registre de critères (fiche YAML, plus un module si calculé) ; normalisation ; score pondéré sur 100 avec contributions et couverture ; DRC aux deux taux. Test d'extensibilité : un critère ajouté par fichiers seuls.

**10, contraintes et vagues.** Filtres durs séparés du score ; algorithme en vagues avec score recalculé à chaque état ; bloqués avec intrant bloquant, raison et cause première ; instrument proposé, protection refusée sans impact aval chiffré. Tests sur la chaîne linéaire A → B → C (7 cas à résultat connu).

**11, scénarios et robustesse.** 4 préréglages ; passage en personnalisé ; variation de rang ; comparaison de deux scénarios ; Monte Carlo à graine sur les poids, avec séquençage complet à chaque tirage.

**Sortie de phase.** Tests verts ; feuille de route et top 10 par préréglage sur la filière réelle.

## Phase 4 : interface web (prompts 12-14)

**But.** Reprendre le prototype de référence et y brancher le moteur et les données.

**12.** Socle statique, panneau de réglages généré depuis `criteria.json`, graphe par étapes, 4 lentilles, mise en évidence amont et aval, isolement d'un chemin.

**13.** Fiche du nœud (score aujourd'hui et au lancement, contributions, intrants, capacités, gain donné à l'aval, DRC aux deux taux, entreprises éligibles) ; feuille de route par vague avec importations visées et variation de rang.

**14.** Comparaison de deux scénarios avec lignes de déplacement ; robustesse (part des tirages dans le top N).

**Sortie de phase.** Démonstration dans un vrai navigateur, tests de bout en bout, écarts au prototype listés.

**Prérequis.** Le prototype de référence, déposé dans `reference/`.

## Phase 5 : note méthodologique (prompt 15)

5 pages : objet, données, critères (définition et source de chacun), score et séquençage, robustesse, limites, V2. Peut commencer dès la fin de la phase 3.

## Phase 6 : recette (prompt 16)

Reproductibilité à partir d'un clone neuf ; vérification des quatre principes avec preuve ; test d'ajout d'un critère ; suivi de 5 valeurs de la source à l'écran ; lecture critique des résultats ; `README.md` et intégration continue.

## Phase 7 : V2, données administratives (prompt 17)

Gouvernance et secret statistique d'abord ; puis un chargeur par source, sans changer le format des sorties ; comparaison des résultats V1 et V2.

---

## Principes vérifiés à chaque phase

| Principe | Où il est garanti |
|---|---|
| P1 : pas de restriction d'intrant sans impact aval chiffré | critère `c_surcout_aval` (04, 09), règle dure des instruments (10), fiche du nœud (13), recette (16) |
| P2 : chaque maillon évalué avec ses intrants | critères calculés sur le graphe (09), score recalculé par vague (10) |
| P3 : liste d'éligibilité, jamais de désignation | méthode et formulation (08), titre imposé (13), contrôle textuel (16) |
| P4 : aucune donnée inventée | champ `quality` partout (07), pastilles à l'écran (12-13), part des valeurs `demo` dans les exports (13) |

## Arborescence cible

```
config/      projet.yaml, presets.yaml
criteria/    une fiche YAML par critère
data/        manual/ (versionné)  raw/ (non versionné)  out/ (JSON)
pipeline/    sources/ build/ schemas/ tests/ run.py
engine/      registry, normalize, score, constraints, sequence, montecarlo, criteria/, tests/
web/         interface statique
docs/        PLAN, cadrage, filiere, statuts, criteres, entreprises, decisions, note méthodologique, recette
prompts/     00 à 17
reference/   prototype de référence (à fournir)
```
