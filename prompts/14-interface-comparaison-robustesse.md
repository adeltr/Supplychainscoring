# 14 — Interface : comparaison de scénarios et robustesse

**Phase :** 4 · **Dépend de :** 13 · **Produit :** `web/` (comparaison, robustesse)

Lis `prompts/00-contexte.md` et le prototype de référence.

## Mission

Montrer ce qui change quand on change d'avis, et ce qui ne change pas quand on doute des poids.

## Comparaison de deux scénarios

1. **Choix** : scénario A et scénario B parmi les préréglages, le scénario courant et les scénarios enregistrés.
2. **Rangs côte à côte** : deux colonnes ordonnées par rang ; **une ligne relie chaque nœud d'une colonne à l'autre**. Couleur selon le sens du déplacement, épaisseur selon l'ampleur ; lignes atténuées quand le rang bouge peu ; survol : met en évidence le nœud des deux côtés.
3. **Résumé** : corrélation de rang, nombre de nœuds communs au top N, 5 plus grandes montées et descentes, nœuds planifiés dans un seul scénario, différence d'importations visées par vague.
4. **Différences de réglages** : tableau des critères et contraintes qui diffèrent entre A et B.
5. **Vue par vague** en option : mêmes liens, colonnes découpées par vague.

## Robustesse

1. **Réglages** : nombre de tirages, amplitude de la perturbation, méthode (bornée ou Dirichlet), N du top, graine affichée et modifiable.
2. **Calcul** hors du fil principal si nécessaire, avec progression et annulation.
3. **Résultat par nœud** : part des tirages où il reste dans le top N (barre), part en vague 1, vague médiane, intervalle de rang. Tri par rang du scénario ou par robustesse.
4. **Lecture guidée** : trois groupes nommés par des seuils affichés et modifiables : « solide », « sensible aux poids », « présent par hasard ». Un nœud bien classé mais fragile est signalé.
5. **Lien avec le graphe** : lentille « robustesse » disponible après un calcul.
6. **Sensibilité par critère** : effet du retrait de chaque critère sur le top N.
7. **Avertissement** fixe : la robustesse porte sur les poids, pas sur la qualité des données ; rappel de la part de valeurs `demo` et `estimated`.

## Critères d'acceptation

- Test de bout en bout : A = B donne des lignes toutes horizontales et une corrélation de 1.
- Même graine, même affichage après rechargement.
- Captures jointes : comparaison équilibrée / souveraineté ; robustesse du scénario équilibré.
- 1 000 tirages sans gel de l'interface.

## Point d'arrêt

Démonstration complète de l'interface. Liste de ce qui diffère du prototype et de ce qui reste à faire.
