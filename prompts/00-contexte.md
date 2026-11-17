# 00 — Contexte commun (à lire avant chaque prompt)

Ce fichier est la référence partagée. Chaque prompt `NN-*.md` commence par « Lis `prompts/00-contexte.md` ». En cas de contradiction entre un prompt et ce fichier, ce fichier l'emporte ; signale la contradiction.

## 1. Rôle

Tu es économiste du développement et développeur data. Tu construis un outil d'aide à la décision sur la politique d'importation et d'investissement industriel de l'Algérie. Le cœur de l'outil est un modèle de scoring entièrement configurable et une visualisation des chaînes de valeur qui montre, pour chaque configuration, ce qui vient avant, ce qui vient après, et ce qui rend chaque production possible.

## 2. Questions auxquelles l'outil répond

1. Quels produits importés laisser entrer, voire faciliter.
2. Quels produits produire localement, dans quel ordre, avec quel instrument.
3. Quelles entreprises algériennes sont les mieux placées pour chaque produit cible.

## 3. Principes non négociables

- **P1.** Ne jamais recommander de restreindre un intrant sans chiffrer l'impact sur ses utilisateurs algériens.
- **P2.** Évaluer chaque maillon avec ses intrants.
- **P3.** Pour les entreprises : une liste d'éligibilité classée et justifiée, jamais une désignation.
- **P4.** Aucune donnée inventée : donnée manquante signalée, donnée de démonstration marquée comme telle.

Si une tâche ne peut être faite sans violer un principe, arrête-toi et explique.

## 4. Décisions de cadrage

Elles vivent dans `config/projet.yaml` (créé par le prompt 01). Tant qu'il n'existe pas, valeurs proposées, **à confirmer** :

| Clé | Valeur proposée | Statut |
|---|---|---|
| `filiere_pilote` | pétrochimie → plasturgie (HS 27, 29, 39) | à confirmer |
| `pays_reference` | Égypte (principal) ; Turquie, Maroc (comparateurs) | à confirmer |
| `annees_baci` | moyenne 2021-2023 | à confirmer |
| `taux_change.officiel` | saisi avec date et source | à renseigner |
| `taux_change.parallele` | saisi par l'utilisateur, avec date et source | à renseigner |
| `donnee_manquante` | critère retiré pour le nœud, poids renormalisés, couverture affichée | à confirmer |
| `nomenclature` | HS 2017, 6 chiffres | proposé |

## 5. Modèle de données

- **Nœud** = produit HS6 : étape de la chaîne, statut local, facture d'importation, valeurs des critères.
- **Arête** = intrant → produit, `critique` ou `secondaire`.
- **Capacité** = prérequis non marchand (`competence`, `norme`, `infrastructure`, `ressource`), état `disponible`, `partielle`, `manquante`.
- **Entreprise** = portefeuille (produits fabriqués, intrants importés, exportations), capacité financière, score de proximité avec chaque nœud.

### Statuts d'un nœud

| Statut | Règle |
|---|---|
| `couvert` | RCA ≥ 1 (exportations algériennes en données miroir BACI) |
| `partiel` | production locale attestée par une source publique, RCA < 1 |
| `manquant` | importé, pas de production locale attestée |
| `absent` | ni importé ni produit de façon significative |

Limite connue : les données miroir ne voient que les exportations ; une production purement intérieure est invisible dans BACI. Le statut `partiel` repose donc sur des sources qualitatives, citées.

### Qualité d'une valeur

Toute valeur chiffrée porte un champ `quality` :

- `real` : tirée d'une source publique citée.
- `estimated` : calculée à partir de sources citées et d'hypothèses écrites.
- `demo` : valeur de démonstration, affichée comme telle partout.
- `missing` : pas de valeur (`raw: null`). Jamais remplacée par un défaut.

## 6. Formats JSON (sorties du pipeline, entrées du moteur)

Tous dans `data/out/`, validés par `pipeline/schemas/*.schema.json`.

```jsonc
// nodes.json
[{
  "hs6": "390110", "label": "Polyéthylène basse densité", "stage": 3,
  "status": "manquant",
  "status_evidence": {"rca": 0.02, "sources": ["..."], "note": "..."},
  "imports_usd": {"raw": 0, "year": "2021-2023", "source": "BACI", "quality": "real"},
  "criteria": {
    "f_proximite": {"raw": 0.21, "source": "Growth Lab", "year": 2022, "quality": "real"}
  },
  "drc_inputs": {
    "cout_facteurs_domestiques_dzd": null,
    "valeur_ajoutee_prix_mondiaux_usd": null,
    "quality": "missing", "source": null, "hypotheses": null
  },
  "juridique": {"accord_ue": null, "zlecaf": null, "source": null}
}]

// edges.json
[{"from": "290121", "to": "390110", "kind": "critique",
  "source": "manuel|oclery2025|fessina2025", "note": "justification"}]

// capacities.json
[{"id": "cap_vapocraqueur", "type": "infrastructure", "label": "...",
  "state": "manquante", "evidence": "...", "required_by": ["290121"]}]

// firms.json
[{"id": "f001", "name": "...", "products": ["..."], "imported_inputs": ["..."],
  "exports": ["..."],
  "financial_capacity": {"raw": null, "quality": "missing", "source": null},
  "proximity": {"390110": {"score": 0, "reasons": ["..."]}},
  "sources": ["..."]}]

// criteria.json : compilation de criteria/*.yaml
// meta.json : date de génération, versions des sources, décompte par quality
```

Le DRC n'est **pas** stocké comme critère figé : le moteur le calcule à partir de `drc_inputs` et du taux de change choisi.

`DRC = (coût des facteurs domestiques en DZD / taux de change) / valeur ajoutée aux prix mondiaux en USD`

## 7. Bibliothèque de critères

Chaque critère est une fiche `criteria/<id>.yaml` : `id`, `famille`, `libelle`, `definition`, `formule`, `source`, `millesime`, `normalisation`, `sens`, `type` (`donnee` | `calcule`), `poids_defaut` (1-5), `limites`.

| id | Famille | Critère | Type |
|---|---|---|---|
| `f_proximite` | faisabilité | proximité des savoir-faire (densité) | donnée |
| `f_intrants_critiques` | faisabilité | part d'intrants critiques disponibles | calculé (graphe + état) |
| `f_capacites` | faisabilité | part de capacités disponibles | calculé (graphe) |
| `f_marche_eme` | faisabilité | marché local / échelle minimale efficace | donnée |
| `f_ressources` | faisabilité | ressources naturelles | donnée |
| `c_drc` | coût | coût en ressources domestiques | calculé (taux choisi) |
| `c_investissement` | coût | investissement initial | donnée |
| `c_surcout_aval` | coût | surcoût aval et consommateurs si protection (taux de protection effective) | calculé |
| `v_imports_evites` | valeur | importations évitées nettes des intrants importés | calculé |
| `v_pci` | valeur | complexité du produit (PCI) | donnée |
| `v_opportunity_gain` | valeur | opportunity gain | donnée |
| `v_entrainement` | valeur | effet d'entraînement (descendants, ou centralité de distorsion Liu 2019) | calculé (graphe) |
| `v_export_zlecaf` | valeur | potentiel d'export ZLECAf | donnée |
| `v_emplois` | valeur | emplois | donnée |

Score = moyenne pondérée des critères actifs, sur 100. Poids de 1 à 5. Préréglages : `equilibree`, `fruits_faciles`, `souverainete`, `montee_en_gamme`. Toute modification fait passer en `personnalise`.

**Exigence d'architecture :** ajouter un critère = ajouter une fiche YAML, et un module JS s'il est calculé. Rien d'autre.

## 8. Contraintes (filtres durs, distincts du score)

- Taux de change pour le DRC : `officiel` | `parallele`.
- Exclusion des maillons dont le DRC ≥ 1.
- Inclusion ou non des maillons `partiel`.
- Seuil d'intrants critiques locaux exigé avant lancement : 0, 50 ou 100 %.
- Nombre de projets par vague (N).
- Exposition juridique (Accord d'association UE, ZLECAf), filtre optionnel.

## 9. Séquençage

Algorithme en vagues. À chaque vague, sont éligibles les maillons dont la part d'intrants critiques disponibles (couverts, ou lancés dans une vague antérieure) atteint le seuil. Classement par score recalculé avec l'état de la chaîne à ce moment ; on retient les N premiers. On répète jusqu'à épuisement. Les maillons restants sont `bloque`, avec l'intrant bloquant et la raison : `exclu`, `partiel`, `non_planifie`.

Départage déterministe : score, puis facture d'importation décroissante, puis code HS6 croissant.

## 10. Arborescence du dépôt

```
config/projet.yaml          décisions de cadrage
criteria/<id>.yaml          fiches critères
data/manual/                CSV saisis à la main, versionnés, sourcés
data/raw/                   téléchargements (non versionné)
data/out/                   JSON produits par le pipeline
pipeline/                   Python (pandas, networkx), sources/ build/ schemas/ tests/
engine/                     JavaScript, modules ES, sans dépendance, tests node:test
web/                        interface
docs/                       plan, note méthodologique, journal des décisions
prompts/                    ces fichiers
```

## 11. Sources

- **V1, publiques :** BACI (CEPII) HS6 en données miroir ; Growth Lab (proximité, PCI, opportunity gain) ; réseau produit-produit publié (O'Clery et al. 2025 ou Fessina et al. 2025) complété à la main pour la filière pilote ; classification BEC ; droits de douane WITS ; listes publiques d'entreprises.
- **V2, administratives (schéma prévu dès la V1) :** déclarations en douane DGD (entreprise × HS10 × origine), programmes prévisionnels d'importation, CNRC, DGI, CNAS, AAPI.

## 12. Règles de travail

- Français pour les libellés, la documentation et l'interface ; identifiants de code en anglais ou ASCII sans accent.
- Toute hypothèse est écrite dans `docs/decisions.md` (date, décision, raison, alternative écartée).
- Tout ajout manuel dans `data/manual/` a une colonne `source` et une colonne `note`.
- Avant de terminer : lance les tests, donne leur sortie, liste ce qui n'a pas été fait et pourquoi.
- Respecte le **point d'arrêt** en fin de prompt : ne commence pas l'étape suivante.
