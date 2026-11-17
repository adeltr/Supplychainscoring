# Moteur de scoring et de séquençage

Modules ES sans dépendance. Tests : `npm test`.

## Ajouter un critère

1. Écrire `criteria/<id>.yaml` (mêmes clés que les fiches existantes).
2. Si `type: donnee` : faire produire la valeur par le pipeline dans
   `node.criteria[<id>]`. Aucun code moteur.
3. Si `type: calcule` : écrire `engine/criteria/<id>.js` qui exporte
   `{ compute(node, ctx, fiche) }` et rend `{ raw, quality, detail }`.
   `ctx` donne `model` (graphe), `dispo` (nœuds disponibles) et `params`.
4. Relancer `python -m pipeline.run`.

Le registre trouve le module par son nom ; l'interface construit ses réglages
depuis `criteria.json`. Rien d'autre n'est à modifier.
