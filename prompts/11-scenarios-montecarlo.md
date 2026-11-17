# 11 — Moteur JavaScript : préréglages, scénarios, comparaison, robustesse

**Phase :** 3 · **Dépend de :** 10 · **Produit :** `engine/presets.js`, `engine/scenario.js`, `engine/compare.js`, `engine/montecarlo.js`, `config/presets.yaml`, tests

Lis `prompts/00-contexte.md` (§ 7, 8).

## Mission

Rendre le modèle manipulable : scénarios nommés, comparaison de deux scénarios, variation de rang, et mesure de la robustesse du classement aux poids.

## Spécifications

1. **Scénario** = `{nom, criteres: {id: {actif, poids}}, contraintes: {...}}`. Sérialisable en JSON (export, import, lien partageable).
2. **Préréglages** dans `config/presets.yaml`, proposition de départ à justifier critère par critère dans `docs/presets.md` :

   | Critère | équilibrée | fruits faciles | souveraineté | montée en gamme |
   |---|---|---|---|---|
   | faisabilité (5) | 3 | 5 | 2 | 2 |
   | `c_drc`, `c_investissement` | 3 | 4 | 2 | 2 |
   | `c_surcout_aval` | 3 | 3 | 3 | 3 |
   | `v_imports_evites` | 3 | 2 | 5 | 2 |
   | `v_entrainement` | 3 | 1 | 5 | 3 |
   | `v_pci`, `v_opportunity_gain` | 3 | 1 | 2 | 5 |
   | `v_export_zlecaf` | 3 | 2 | 1 | 4 |
   | `v_emplois` | 3 | 2 | 3 | 2 |

   Chaque préréglage fixe aussi des contraintes par défaut (ex. fruits faciles : seuil 100 %, exclusion DRC ≥ 1).
3. **Passage en `personnalise`** : toute différence avec le préréglage d'origine change le nom ; revenir exactement aux valeurs du préréglage restaure son nom.
4. **Variation de rang** : `diff(avant, apres)` rend, par nœud, rang avant, rang après, écart, changement de vague, entrée ou sortie de la feuille de route.
5. **Comparaison de deux scénarios** : rangs côte à côte, vagues, nœuds présents dans un seul, corrélation de rang (Spearman), liste des 5 plus grands déplacements.
6. **Monte Carlo** (`montecarlo.js`) :
   - tirages des poids autour du scénario : perturbation multiplicative bornée (paramètre d'amplitude), poids recadrés dans [1, 5] ; variante Dirichlet centrée sur les poids ; critères inactifs laissés inactifs ;
   - générateur pseudo-aléatoire à graine, écrit dans le module (reproductible) ;
   - pour chaque tirage, séquençage complet (pas seulement le score) ;
   - sorties par nœud : part des tirages dans le top N, part des tirages en vague 1, vague médiane, intervalle de rang (5e-95e centile) ;
   - 1 000 tirages par défaut ; mesure le temps sur la filière réelle ; si > 1 s, prévois l'exécution hors du fil principal.
7. **Sensibilité simple** en complément : pour chaque critère, effet sur le top N de son retrait.

## Tests

- Poids tous égaux et amplitude 0 : chaque nœud du top N a une part de 100 %.
- Même graine, mêmes résultats ; graine différente, résultats différents.
- Nœud dominant sur tous les critères : 100 % quelle que soit l'amplitude.
- `diff` sur deux classements écrits à la main.
- Aller-retour préréglage → modification → retour.
- Export puis import d'un scénario : identique.

## Critères d'acceptation

- Tests verts, sortie jointe.
- `docs/presets.md` justifie chaque poids en une ligne.
- Temps de 1 000 tirages indiqué.

## Point d'arrêt

Tableau : top 10 de chaque préréglage sur la filière réelle, et robustesse du préréglage équilibré. **Fin de la phase 3 : j'ai besoin du prototype de référence pour la suite.**
