# 10 — Moteur JavaScript : contraintes et séquençage en vagues

**Phase :** 3 · **Dépend de :** 09 · **Produit :** `engine/constraints.js`, `engine/sequence.js`, `engine/instruments.js`, tests

Lis `prompts/00-contexte.md` (§ 8, 9, principes P1 et P2).

## Mission

Transformer des scores en feuille de route : filtres durs, vagues, maillons bloqués avec leur raison, et instrument proposé.

## Spécifications

### Contraintes (`constraints.js`)

Entrée : nœuds, réglages. Sortie : pour chaque nœud `{candidat: bool, motif}`.

- `taux_change` : `officiel` | `parallele` (alimente le DRC).
- `exclure_drc_sup_1` : un nœud de DRC ≥ 1 est `exclu`. DRC `missing` : ni exclu ni validé, marqué `drc_inconnu` (affiché, je décide de la règle).
- `inclure_partiels` : sinon les nœuds `partiel` ne sont pas candidats ; ils ne comptent **pas** comme intrant disponible.
- `seuil_intrants` : 0, 50, 100.
- `projets_par_vague` : N ≥ 1.
- `filtre_juridique` : optionnel ; écarte les nœuds dont l'instrument est exposé (Accord UE, ZLECAf). Exposition `missing` : signalée, non filtrée.

Les nœuds `couvert` ne sont pas candidats : ils sont disponibles d'emblée.

### Séquençage (`sequence.js`)

```
disponibles ← nœuds couverts
vague ← 1
répéter
  éligibles ← candidats non lancés dont la part d'intrants critiques disponibles ≥ seuil
  si aucun : arrêter
  recalculer le score de chaque éligible avec l'état courant
  retenir les N premiers (score ↓, importations ↓, HS6 ↑)
  les ajouter à disponibles, avec leur vague et leur score au lancement
  vague ← vague + 1
restants → bloqués
```

Un nœud lancé en vague k n'est disponible pour ses clients qu'à partir de la vague k + 1.

**Bloqués** : pour chaque nœud restant, `{bloque_par: [hs6], raison}` pour chaque intrant critique indisponible : `exclu` (filtré par une contrainte), `partiel` (non inclus), `non_planifie` (lui-même bloqué, donne la chaîne de blocage jusqu'à la cause première).

Sortie :

```js
{ vagues: [[{hs6, score_lancement, score_aujourdhui, rang}]],
  bloques: [{hs6, bloque_par, raison, cause_premiere}],
  exclus:  [{hs6, motif}],
  total_imports_vises_par_vague: [..] }
```

### Instruments (`instruments.js`)

Pour chaque nœud planifié, propose un type d'instrument (facilitation de l'import des intrants, incitation à l'investissement, commande publique, protection temporaire, partenariat) avec sa raison. Règle dure (P1) : `protection` n'est proposée que si `c_surcout_aval` est calculé ; la sortie porte alors l'impact chiffré par utilisateur aval. Sinon : « non recommandable en l'état : impact aval non chiffré ».

Pour les nœuds non planifiés et les intrants : indiquer « laisser entrer » ou « faciliter » quand ils sont intrants critiques d'un maillon lancé (question 1).

## Tests (cas dont on connaît le résultat)

Chaîne linéaire A → B → C, A couvert, arêtes critiques :

| Cas | Réglages | Attendu |
|---|---|---|
| 1 | seuil 100, N = 1 | vague 1 : B ; vague 2 : C ; aucun bloqué |
| 2 | seuil 100, N = 5 | identique (C n'est pas éligible en vague 1) |
| 3 | seuil 0, N = 1 | vague 1 : le mieux noté de B et C ; vague 2 : l'autre |
| 4 | DRC de B ≥ 1, exclusion active | B exclu ; C bloqué par B, raison `exclu` |
| 5 | B `partiel`, non inclus | C bloqué par B, raison `partiel` |
| 6 | B `partiel`, inclus | vague 1 : B ; vague 2 : C |
| 7 | chaîne A → B → C → D, B exclu | D bloqué par C, raison `non_planifie`, cause première B |

Plus : deux intrants critiques dont un seul disponible, seuil 50 (éligible) et 100 (bloqué) ; départage à score égal ; score au lancement ≠ score aujourd'hui pour C ; déterminisme (deux exécutions identiques) ; refus de `protection` sans surcoût aval chiffré.

## Critères d'acceptation

- Tous les tests passent ; sortie jointe.
- Chaque nœud de la filière finit dans exactement une catégorie : couvert, planifié, bloqué, exclu.

## Point d'arrêt

Feuille de route de la filière réelle avec le préréglage par défaut, en tableau. Questions ouvertes (règle pour `drc_inconnu`).
