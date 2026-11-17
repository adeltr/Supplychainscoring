# 17 — V2 : branchement des données administratives

**Phase :** 7 (après la V1) · **Dépend de :** 16, et de l'accès aux données · **Produit :** `pipeline/sources/v2_*.py`, mise à jour de `build/`, `docs/v2.md`

Lis `prompts/00-contexte.md` (§ 11), `docs/v2-schema.md`, `pipeline/schemas/v2_*.schema.json`.

## Mission

Remplacer, source par source, les approximations de la V1 par les données administratives, sans changer le format des sorties ni le moteur.

## Préalable

Ces données sont confidentielles. Avant tout code, écris avec moi `docs/v2-gouvernance.md` : qui fournit quoi, sous quelle convention, où les données sont stockées, qui y accède, quel niveau d'agrégation peut être affiché, règle de secret statistique (pas de cellule reposant sur moins de 3 entreprises ; pas d'entreprise dominant une cellule). Aucune donnée administrative n'entre dans le dépôt.

## Tâches

| Source | Remplace ou ajoute | Effet |
|---|---|---|
| DGD, déclarations en douane (entreprise × HS10 × origine) | BACI miroir ; intrants importés des entreprises | importations exactes, HS10, portefeuille réel d'intrants par entreprise, arêtes observées |
| Programmes prévisionnels d'importation | rien en V1 | demande anticipée, détection de dépendances |
| CNRC | listes publiques d'entreprises | univers complet, codes d'activité |
| DGI | capacité financière `missing` | taille, capacité d'investissement (par tranches) |
| CNAS | `v_emplois` estimé | effectifs réels par entreprise et secteur |
| AAPI | rien en V1 | projets d'investissement déclarés ; nœuds déjà en cours de lancement |

Pour chaque source :

1. Chargeur conforme au schéma V2, avec validation et rapport de qualité (valeurs manquantes, doublons, codes HS invalides).
2. Clé de jointure entre sources (identifiant fiscal ou registre de commerce) ; taux d'appariement mesuré.
3. Agrégation HS10 → HS6 ; conservation du HS10 pour les nœuds ambigus.
4. Mise à jour des `quality` : `real` remplace `estimated` ou `demo`, avec trace de l'ancienne valeur.
5. **Statut des nœuds** : la production locale peut enfin être observée (entreprise qui n'importe pas le produit mais importe ses intrants) ; propose une règle et compare avec les statuts V1.
6. **Arêtes** : confronter le graphe manuel aux couples (intrants importés, produits fabriqués) observés ; lister les arêtes confirmées, infirmées, nouvelles.
7. **Proximité des entreprises** : recalcul sur portefeuilles réels ; comparer les listes d'éligibilité V1 et V2.
8. **Impact aval (P1)** : les utilisateurs algériens d'un intrant sont désormais identifiables ; chiffrer l'impact par entreprise, affiché agrégé selon la règle de secret.
9. `docs/v2.md` : ce qui a changé dans les résultats entre V1 et V2, et pourquoi.

## Critères d'acceptation

- Le moteur et l'interface fonctionnent sans modification sur les sorties V2.
- Tests sur données **synthétiques clairement étiquetées** conformes aux schémas ; aucune donnée réelle dans les tests.
- Rapport d'écart V1 / V2 : statuts changés, rangs changés, top 10 comparé.
- Contrôle automatique du secret statistique sur tout ce qui est affiché ou exporté.

## Garde-fous

- P3 : avec des données nominatives, le risque de désignation augmente ; la liste reste une liste d'éligibilité justifiée.
- Pas d'export nominatif sans validation explicite.

## Point d'arrêt

Après `docs/v2-gouvernance.md`, attends mon accord et l'accès aux données.
