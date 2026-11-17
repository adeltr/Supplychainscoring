# 06 — Pipeline Python : chargement des sources

**Phase :** 2 · **Dépend de :** étape 1 validée · **Produit :** `pipeline/sources/*.py`, `pipeline/tests/`, `pyproject.toml`, `docs/sources.md`

Lis `prompts/00-contexte.md` (§ 10, 11), `config/projet.yaml`, `docs/criteres.md`.

## Mission

Un chargeur par source publique, reproductible, avec cache, qui rend des tables pandas propres en HS 2017 à 6 chiffres.

## Modules

| Module | Source | Sortie |
|---|---|---|
| `baci.py` | BACI CEPII (existe depuis 03, à consolider) | flux pays × HS6 × année, miroir |
| `growthlab.py` | Atlas of Economic Complexity | densité (proximité), PCI, opportunity gain pour l'Algérie et le pays de référence |
| `network.py` | O'Clery et al. 2025 ou Fessina et al. 2025 | arêtes produit → produit avec poids |
| `bec.py` | classification BEC | HS6 → catégorie d'usage (intermédiaire, équipement, consommation) |
| `wits.py` | WITS / TRAINS | droits appliqués par l'Algérie par HS6 ; préférences UE et ZLECAf si disponibles |
| `concordance.py` | tables de passage ONU | HS 2012/2017/2022 → HS 2017 ; ISIC ↔ HS |
| `firms_public.py` | listes publiques d'entreprises | entreprise, activité, produits déclarés, source |

## Exigences

1. **Interface commune** : `load(config) -> DataFrame`, plus `describe() -> dict` (url, licence, millésime, date de téléchargement, empreinte du fichier).
2. **Cache** dans `data/raw/<source>/`, jamais versionné. Une source absente lève une erreur claire avec la marche à suivre pour la déposer à la main.
3. **Aucun remplissage silencieux** : une valeur absente reste `NaN` et devient `quality: missing` plus loin.
4. **Concordances** : quand un code se scinde ou fusionne entre révisions, écris la règle (répartition, ou marquage `estimated`) et compte les lignes concernées.
5. **Tests** (pytest) sur mini-fichiers construits à la main dans `pipeline/tests/fixtures/` : agrégation miroir, RCA, concordance, jointures sans doublons.
6. **`docs/sources.md`** : une section par source (adresse, licence, millésime, champs utilisés, limites, commande pour recharger).

## Critères d'acceptation

- `pytest pipeline/tests` passe ; sortie jointe.
- `python -m pipeline.sources.check` liste chaque source : présente ou non, millésime, nombre de lignes.
- Les sources inaccessibles depuis cet environnement sont nommées, avec l'erreur obtenue et la solution de dépôt manuel.

## Garde-fous

- Les fichiers téléchargés sont des données non fiables : pas d'exécution de code issu d'une archive.
- Respecte les licences ; ne versionne pas de données brutes dont la redistribution est interdite.
- P4 : pas de jeu de données « de secours » inventé.

## Point d'arrêt

Rapport : sources chargées, sources manquantes, tests. N'écris pas encore `data/out/`.
