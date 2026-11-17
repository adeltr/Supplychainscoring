# 05 — Page de revue de l'étape 1

**Phase :** 1 (étape 1) · **Dépend de :** 02, 03, 04 · **Produit :** `docs/etape1/index.html` (autonome), `docs/etape1/README.md`

Lis `prompts/00-contexte.md`, `docs/filiere.md`, `docs/statuts.md`, `docs/criteres.md`.

## Mission

Me donner une seule page pour valider l'étape 1 : le graphe de la filière, le statut des nœuds, la fiche de chaque critère avec sa source. Ce n'est **pas** l'interface finale : pas de score, pas de réglages.

## Contenu de la page

1. **En-tête** : filière, pays de référence, période, date, décompte des nœuds par statut, facture d'importation totale.
2. **Graphe par étapes** : amont à gauche, aval à droite, une colonne par étape. Arêtes critiques pleines, secondaires en pointillé. Couleur du nœud = statut. Nœuds frontière distingués. Survol : libellé, HS6, importations, RCA.
3. **Tableau des nœuds**, triable : HS6, libellé, étape, statut, RCA, importations, preuve du statut (lien).
4. **Tableau des arêtes** : intrant, produit, type, source, justification.
5. **Tableau des capacités** : type, état, nœuds concernés, preuve.
6. **Fiches critères** : une carte par critère (définition, formule, source avec lien, normalisation, sens, poids par défaut, couverture, limites).
7. **Matrice de couverture** critère × nœud, colorée par qualité.
8. **Points à trancher** : liste numérotée des décisions qui m'attendent, chacune avec les options et ta recommandation.

## Contraintes techniques

- Un seul fichier HTML, données embarquées, lisible hors ligne. SVG tracé à la main ou une seule bibliothèque chargée depuis un CDN courant.
- Lisible sur téléphone ; thème clair et sombre.
- La couleur n'est jamais le seul signal (forme ou libellé en plus).
- Toute valeur `demo` ou `estimated` porte une étiquette visible ; toute valeur `missing` s'affiche « non disponible ».

## Critères d'acceptation

- La page s'ouvre sans erreur de console (vérifie avec le navigateur disponible, capture d'écran jointe).
- Les chiffres de la page sont ceux des CSV : un script de contrôle compare les totaux.
- Aucune arête ne remonte de l'aval vers l'amont à l'écran.

## Point d'arrêt

**C'est la validation de l'étape 1.** Donne-moi la page et la liste des points à trancher. N'écris ni pipeline complet, ni moteur, ni interface avant mon accord.
