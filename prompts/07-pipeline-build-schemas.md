# 07 — Pipeline Python : construction des JSON et schémas (V1 et V2)

**Phase :** 2 · **Dépend de :** 06 · **Produit :** `pipeline/build/*.py`, `pipeline/schemas/*.schema.json`, `pipeline/run.py`, `data/out/*.json`

Lis `prompts/00-contexte.md` (§ 5, 6), `criteria/*.yaml`, `data/manual/*.csv`.

## Mission

Assembler les sources et les saisies manuelles en six fichiers JSON validés, que le moteur JavaScript consomme tels quels.

## Tâches

1. **`build/nodes.py`** : part de `data/manual/nodes.csv` et `status_evidence.csv` ; ajoute importations, RCA, valeur brute de chaque critère de type `donnee`, `drc_inputs`, champs `juridique`. Chaque valeur est un objet `{raw, source, year, quality}`.
2. **`build/edges.py`** : `data/manual/edges.csv` → `edges.json`. Contrôles networkx : acyclique, étapes croissantes, extrémités existantes.
3. **`build/capacities.py`** : `capacities.csv` → `capacities.json`.
4. **`build/criteria.py`** : compile `criteria/*.yaml` en `criteria.json`. Générique : un nouveau fichier YAML est pris sans modifier le code. Valide chaque fiche contre un schéma.
5. **`build/firms.py`** : squelette qui lit `data/manual/firms.csv` s'il existe et sort `firms.json` (contenu au prompt 08).
6. **`build/meta.py`** : `meta.json` avec date, empreintes des sources, décompte des valeurs par `quality` et par critère, liste des avertissements.
7. **Valeurs de démonstration.** Si je l'autorise explicitement dans `config/projet.yaml` (`demo.autorise: true`), les critères sans donnée peuvent recevoir une valeur `demo` depuis `data/manual/demo_values.csv`, fichier écrit à la main et commenté. Jamais de génération aléatoire silencieuse. Sans autorisation : `missing`.
8. **Schémas JSON** (`pipeline/schemas/`) pour les six sorties V1, **et pour les tables V2** :
   - `v2_dgd_declarations` : entreprise × HS10 × origine × période, valeur, quantité, régime douanier ;
   - `v2_programmes_previsionnels` : entreprise × HS10 × année, volume prévu ;
   - `v2_cnrc` : identifiant, raison sociale, codes d'activité, wilaya, date de création ;
   - `v2_dgi` : identifiant, chiffre d'affaires, résultat, tranche (agrégats seulement) ;
   - `v2_cnas` : identifiant, effectifs déclarés ;
   - `v2_aapi` : projet, entreprise, HS6 visé, montant, avantages, état.
   Fournis pour chaque table V2 un fichier d'exemple **vide** valide, la clé de jointure, et le niveau de confidentialité. Décris dans `docs/v2-schema.md` comment HS10 s'agrège en HS6 et comment ces tables remplaceront les sources V1.
9. **`pipeline/run.py`** : une commande qui enchaîne tout, valide contre les schémas, et échoue si une valeur n'a pas de `quality`.
10. **Tests** : schémas, une filière jouet de 3 nœuds de bout en bout, détection d'un cycle, détection d'une valeur sans source.

## Critères d'acceptation

- `python -m pipeline.run` produit les six fichiers ; tous valident.
- `meta.json` donne la part des valeurs `real` / `estimated` / `demo` / `missing`.
- Ajouter un fichier `criteria/x_test.yaml` de type `donnee` le fait apparaître dans `criteria.json` sans autre changement (test automatisé).
- La filière jouet `pipeline/tests/fixtures/chaine3/` est aussi exportée pour les tests du moteur (prompt 09).

## Garde-fous

- P4 : la génération échoue plutôt que de combler un trou.
- Les schémas V2 ne contiennent aucune donnée nominative d'exemple réelle.

## Point d'arrêt

Montre `meta.json`, le résultat des tests et un extrait de chaque sortie.
