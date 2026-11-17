# 04 — Fiches des critères, avec source et couverture

**Phase :** 1 (étape 1) · **Dépend de :** 03 validé · **Produit :** `criteria/*.yaml` (14 fiches), `docs/criteres.md`

Lis `prompts/00-contexte.md` (§ 7), `config/projet.yaml`, `docs/filiere.md`, `docs/statuts.md`.

## Mission

Écrire la fiche de chaque critère de la bibliothèque et dire honnêtement, pour la filière pilote, quelles valeurs existent.

## Fiche type

```yaml
id: f_proximite
famille: faisabilite            # faisabilite | cout | valeur
libelle: Proximité des savoir-faire
definition: >                   # 2-3 phrases, lisibles par un non-économiste
formule: >                      # formule exacte, variables définies
source: {nom: , url: , licence: , millesime: }
type: donnee                    # donnee | calcule
depend_de: []                   # pour un calcule : champs du graphe, état, paramètres
normalisation: {methode: minmax, bornes: filiere, log: false}   # minmax | rang | seuil
sens: plus_haut_plus_favorable  # ou plus_bas_plus_favorable
poids_defaut: 3                 # 1 à 5
actif_par_defaut: true
couverture: {noeuds_avec_valeur: , noeuds_total: , quality: real}
limites: >
references: []
```

## Tâches

1. **Une fiche par critère** (14, liste du § 7 du contexte). Points d'attention :
   - `f_proximite`, `v_pci`, `v_opportunity_gain` : Growth Lab ; précise le millésime, la révision HS et la table de passage vers HS 2017.
   - `f_intrants_critiques` : part des intrants critiques `couvert` ou lancés. Précise si elle est en nombre ou pondérée par la valeur ; propose, je tranche.
   - `f_capacites` : part des capacités disponibles ; `partielle` compte 0,5 (à confirmer).
   - `f_marche_eme` : marché local apparent (importations + production connue) rapporté à l'échelle minimale efficace. Dis d'où vient l'échelle minimale (littérature d'ingénierie, taille médiane des usines du pays de référence) et la qualité qui en découle.
   - `c_drc` : formule du § 6 du contexte ; liste ce qu'il faut pour `drc_inputs` et ce qui existe publiquement. Probablement `estimated` ou `demo` : dis-le.
   - `c_surcout_aval` : taux de protection effective à partir des droits WITS et des coefficients d'intrants ; chiffre l'impact sur chaque utilisateur aval (principe P1).
   - `v_imports_evites` : importations du produit moins importations d'intrants induites par sa production locale.
   - `v_entrainement` : deux variantes documentées, nombre de descendants pondéré par leur facture d'importation, et centralité de distorsion (Liu 2019) ; dis laquelle est calculable avec les données disponibles.
   - `v_export_zlecaf` : importations des pays ZLECAf pour ce HS6, corrigées de la distance et des droits ; méthode simple et transparente.
   - `v_emplois` : source d'intensité en emploi par secteur ; passage ISIC → HS6 ; qualité.
2. **Normalisation.** Pour chaque critère, justifie la méthode : min-max sur la filière, rang, seuil, log. Montre l'effet sur la distribution réelle (5 valeurs : min, quartiles, max). Signale les critères où une valeur extrême écrase les autres.
3. **Couverture.** Tableau critère × nœud avec la qualité (`real`, `estimated`, `demo`, `missing`). Aucune case remplie par une valeur de confort.
4. **Corrélations.** Si deux critères mesurent presque la même chose sur la filière (corrélation de rang > 0,8), signale le double comptage.
5. **Rédiger `docs/criteres.md`** : les 14 fiches en clair, le tableau de couverture, les corrélations, les décisions qui me reviennent.

## Critères d'acceptation

- 14 fichiers YAML valides, mêmes clés partout.
- Chaque `source.url` a été ouverte ; sinon mention « non vérifiée ».
- Le tableau de couverture donne le pourcentage de cases `real`, `estimated`, `demo`, `missing`.
- Chaque fiche a un paragraphe `limites` non vide.

## Garde-fous

- P4. Un critère sans donnée reste dans la bibliothèque avec `couverture: 0` : il n'est ni supprimé ni rempli.
- Pas de code de moteur ici.

## Point d'arrêt

Montre-moi `docs/criteres.md`. Liste les décisions attendues de ma part.
