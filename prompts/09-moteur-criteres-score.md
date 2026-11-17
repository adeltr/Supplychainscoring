# 09 — Moteur JavaScript : registre de critères, normalisation, score

**Phase :** 3 · **Dépend de :** 07 · **Produit :** `engine/` (registre, critères, normalisation, score), `engine/tests/`

Lis `prompts/00-contexte.md` (§ 6, 7), `criteria/*.yaml`, `docs/criteres.md`.

## Mission

Le cœur du scoring : un registre de critères extensible et un calcul de score sur 100, purs et testés. Pas de contraintes, pas de vagues, pas d'interface.

## Architecture

```
engine/
  index.js            API publique
  graph.js            index des nœuds, ancêtres, descendants, intrants critiques
  registry.js         charge criteria.json, associe les modules de calcul
  normalize.js        minmax, rang, seuil, log, inversion selon le sens
  score.js            score d'un nœud, contributions par critère
  criteria/
    _donnee.js        calcul générique : lit node.criteria[id].raw
    f_intrants_critiques.js   f_capacites.js   c_drc.js
    c_surcout_aval.js   v_imports_evites.js   v_entrainement.js
  tests/
```

Modules ES, aucune dépendance, exécutables dans Node et dans le navigateur. Fonctions pures : mêmes entrées, mêmes sorties.

## Spécifications

1. **Contrat d'un critère calculé** : `export default { id, compute(node, ctx) }` qui rend `{raw, quality, detail}`. `ctx` contient le graphe, l'état de la chaîne (`disponibles` : ensemble des HS6 couverts ou lancés), les paramètres (taux de change, variante d'entraînement). Les modules sont découverts par leur nom de fichier : pas de liste à tenir à la main.
2. **Critère de type `donnee`** : aucun code spécifique.
3. **Normalisation** sur 100 selon la fiche ; bornes calculées sur les nœuds de la filière ; le sens `plus_bas_plus_favorable` inverse. Cas limites : une seule valeur, toutes égales, valeurs négatives avec log.
4. **Score** = Σ(poids × valeur normalisée) / Σ(poids), sur les critères **actifs et disponibles** pour le nœud. Donnée manquante : règle de `config/projet.yaml` (par défaut : critère retiré, poids renormalisés). Le résultat expose :
   ```js
   { score, couverture,            // part du poids actif effectivement renseigné
     contributions: [{id, poids, raw, norm, points, quality}],
     qualite: {real, estimated, demo, missing} }
   ```
5. **`c_drc`** : calculé depuis `drc_inputs` et le taux choisi ; rend aussi la valeur aux deux taux pour la fiche du nœud.
6. **`f_intrants_critiques`** et **`v_entrainement`** dépendent de `ctx.disponibles` : le score d'un nœud change quand la chaîne avance.
7. **`c_surcout_aval`** : `detail` liste chaque utilisateur aval et le surcoût chiffré (principe P1).

## Tests (`node --test engine/tests`)

- **Score à la main** : 2 nœuds, 2 critères, poids 1 et 3 ; résultat attendu écrit en commentaire avec le calcul.
- Inversion du sens ; poids modifié ; critère désactivé.
- Donnée manquante : renormalisation, `couverture` < 1.
- Normalisation : valeurs égales, valeur unique.
- **Extensibilité** : le test dépose une fiche et un module factices dans un dossier temporaire, recharge le registre, vérifie que le critère est noté, sans toucher un autre fichier.
- **Chaîne linéaire A → B → C**, A couvert : `f_intrants_critiques` vaut 100 pour B et 0 pour C ; après ajout de B aux disponibles, 100 pour C.
- DRC : même nœud, deux taux, deux valeurs attendues calculées à la main.

## Critères d'acceptation

- Tous les tests passent ; sortie jointe.
- Aucun `if (id === ...)` hors du dossier `criteria/`.
- `README` de `engine/` : comment ajouter un critère, en 10 lignes.

## Point d'arrêt

Rapport de tests et exemple de sortie de score pour 3 nœuds réels de la filière.
