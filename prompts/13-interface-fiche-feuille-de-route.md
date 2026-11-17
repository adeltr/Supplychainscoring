# 13 — Interface : fiche du nœud et feuille de route

**Phase :** 4 · **Dépend de :** 12 · **Produit :** `web/` (fiche, feuille de route)

Lis `prompts/00-contexte.md` (principes P1 à P4) et le prototype de référence.

## Mission

Les deux vues qui portent la décision : pourquoi ce maillon, et dans quel ordre.

## Fiche du nœud (au clic)

1. **En-tête** : libellé, HS6, étape, statut avec sa preuve (lien), importations, principaux fournisseurs.
2. **Score** : aujourd'hui et au lancement (vague prévue), avec l'explication de l'écart ; indicateur de couverture des données.
3. **Contribution de chaque critère** : barres triées, valeur brute, valeur normalisée, poids, points apportés, qualité de la donnée, lien vers la fiche du critère.
4. **Intrants** : liste avec type (critique, secondaire), statut, vague de lancement ou raison de blocage ; clic pour y naviguer.
5. **Capacités** : liste avec type, état, preuve.
6. **Aval** : produits débloqués ; **gain de score donné à chaque maillon aval** si ce nœud est lancé (recalcul par le moteur, avec et sans).
7. **DRC** aux deux taux, composantes, qualité, hypothèses ; mention claire si `estimated`, `demo` ou `missing`.
8. **Instrument proposé** et sa raison. Si l'instrument touche un intrant : tableau des utilisateurs algériens concernés et impact chiffré (P1) ; sinon la mention « non recommandable en l'état : impact aval non chiffré ».
9. **Entreprises candidates** : liste d'éligibilité classée, raisons dépliables, qualité des données, « à vérifier ». Titre imposé : « Entreprises éligibles (liste indicative, non une désignation) » (P3).
10. **Si bloqué ou exclu** : la cause, la chaîne de blocage jusqu'à la cause première, et le réglage qui le débloquerait.

## Feuille de route

1. **Colonnes par vague**, cartes de nœuds triées par rang : score au lancement, importations visées, instrument, pastilles de qualité.
2. **En-tête de colonne** : nombre de projets, **montant d'importations visé**, cumul.
3. **Colonnes « bloqués » et « exclus »** : nom de l'intrant bloquant et raison (`exclu`, `partiel`, `non planifié`).
4. **Variation de rang** après chaque changement de réglage : flèche et écart sur chaque carte, changement de vague signalé, entrées et sorties mises en évidence ; bouton « annuler le dernier changement ».
5. **Liaison** avec le graphe : survol ou clic d'une carte met le nœud en évidence dans le graphe, et inversement.
6. **Export** : feuille de route en CSV et scénario en JSON, avec la date, la version des données et la part de valeurs `demo`.

## Critères d'acceptation

- Les chiffres affichés sont ceux du moteur : test de bout en bout qui compare 3 nœuds et les totaux par vague.
- Captures jointes : fiche d'un nœud planifié, d'un nœud bloqué, d'un intrant avec impact aval ; feuille de route avant et après un changement de poids.
- Recherche textuelle dans le code de `web/` : aucune occurrence d'une formulation qui désigne une entreprise.
- Aucune valeur `missing` affichée comme 0.

## Point d'arrêt

Démonstration des deux vues. Liste des écarts au prototype.
