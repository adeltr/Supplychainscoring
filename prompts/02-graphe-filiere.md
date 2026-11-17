# 02 — Graphe de la filière pilote : nœuds, arêtes, capacités

**Phase :** 1 (étape 1) · **Dépend de :** 01 · **Produit :** `data/manual/nodes.csv`, `data/manual/edges.csv`, `data/manual/capacities.csv`, `docs/filiere.md`

Lis `prompts/00-contexte.md` et `config/projet.yaml`.

## Mission

Construire le graphe de la filière pilote : quels produits HS6, dans quel ordre, reliés par quels intrants, et quels prérequis non marchands. Pas de statut ni de score à ce stade.

## Tâches

1. **Délimiter la filière.** Liste les HS6 (HS 2017) du périmètre, de la matière première aux produits finis. Vise 25 à 45 nœuds. Pour chaque nœud exclu alors qu'il aurait pu entrer, écris pourquoi.
2. **Attribuer une étape** (`stage`, entier, 1 = amont). Règle : l'étape d'un nœud est strictement supérieure à celle de tous ses intrants. Nomme chaque étape (ex. « matière première », « intermédiaire de base », « polymère », « transformation », « produit fini »).
3. **Tracer les arêtes** intrant → produit.
   - Point de départ : le réseau produit-produit publié retenu au cadrage, restreint au périmètre.
   - Complément manuel : procédés industriels documentés (source citée par arête).
   - `critique` = sans cet intrant, la production est impossible ou non viable (matière principale, pas de substitut courant). `secondaire` = additif, emballage, intrant substituable. Écris la justification dans `note`.
   - Ne trace pas d'arête sans source.
4. **Intrants hors périmètre.** Si un intrant critique est hors filière (énergie, catalyseurs, machines), ajoute-le comme nœud « frontière » (`frontier: true`) pour qu'il compte dans les intrants critiques sans étendre la filière.
5. **Capacités.** Pour chaque nœud, liste les prérequis non marchands : `competence`, `norme`, `infrastructure`, `ressource`. Une capacité peut servir plusieurs nœuds. Laisse l'état vide ici (rempli au prompt 03).
6. **Contrôles** (script Python court, networkx) : graphe acyclique ; aucune arête vers une étape inférieure ou égale ; aucun nœud isolé ; tout code HS6 existe dans la nomenclature HS 2017 ; libellés français.
7. **Rédiger `docs/filiere.md`** : schéma de la chaîne par étapes, tableau des nœuds, tableau des arêtes avec leur source, liste des capacités, choix de périmètre et leurs raisons, questions ouvertes.

## Format des CSV

```
nodes.csv        hs6,label,stage,stage_label,frontier,source,note
edges.csv        from,to,kind,source,note
capacities.csv   id,type,label,required_by,source,note     (required_by : HS6 séparés par ;)
```

## Critères d'acceptation

- Les contrôles du point 6 passent ; leur sortie est jointe.
- 100 % des arêtes ont `source` et `note` non vides.
- Chaque nœud non-matière-première a au moins un intrant critique, ou une note qui explique pourquoi non.
- Le nombre d'arêtes issues du réseau publié et le nombre d'arêtes manuelles sont indiqués.

## Garde-fous

- P4 : si tu ne trouves pas de source pour un lien que tu crois vrai, mets-le dans une section « liens plausibles non sourcés » de `docs/filiere.md`, pas dans `edges.csv`.
- Un HS6 regroupe souvent plusieurs produits : signale les nœuds où cela rend l'arête ambiguë.

## Point d'arrêt

Montre-moi le schéma, les trois tableaux et les questions ouvertes. Ne calcule aucun statut.
