# 03 — Statut local des nœuds, facture d'importation, état des capacités

**Phase :** 1 (étape 1) · **Dépend de :** 02 validé · **Produit :** `data/manual/status_evidence.csv`, `data/manual/capacities.csv` (colonne `state`), `pipeline/sources/baci.py`, `docs/statuts.md`

Lis `prompts/00-contexte.md`, `config/projet.yaml`, `docs/filiere.md`.

## Mission

Dire, pour chaque nœud de la filière, où en est l'Algérie aujourd'hui, avec la preuve ; et l'état de chaque capacité.

## Tâches

1. **Charger BACI** (HS 2017, années de `config/projet.yaml`). Écris `pipeline/sources/baci.py` : téléchargement avec cache dans `data/raw/`, lecture, agrégation. Les flux algériens sont pris en **données miroir** (ce que déclarent les partenaires).
2. **Calculer par nœud** : importations algériennes (USD, moyenne de la période, et par année) ; exportations algériennes ; RCA de Balassa ; 5 premiers fournisseurs et leur part ; mêmes indicateurs pour le pays de référence.
3. **Attribuer le statut** selon le § 5 du contexte.
   - `couvert` : RCA ≥ 1. Contrôle : si les exportations sont minuscules en valeur absolue, signale-le (RCA instable sur petits flux).
   - `partiel` : cherche une production locale attestée (site d'entreprise, ONS, ministère, rapport sectoriel, presse spécialisée). Cite la source, la date, la capacité annoncée si elle existe.
   - `manquant` / `absent` : fixe un seuil d'importation « significative », écris-le dans `docs/decisions.md`.
   - Cas ambigu : statut `a_verifier`, avec ce qui manque pour trancher.
4. **Réexportations et hydrocarbures.** Le RCA algérien est écrasé par le poids des hydrocarbures dans les exportations. Calcule aussi un RCA hors chapitre 27 et montre les nœuds dont le statut change. Je choisirai la définition retenue.
5. **État des capacités** : `disponible`, `partielle`, `manquante`, avec `evidence` sourcée. Sans source : `a_verifier`.
6. **Rédiger `docs/statuts.md`** : tableau des nœuds (statut, RCA, RCA hors hydrocarbures, importations, fournisseurs, preuve), tableau des capacités, décompte par statut, liste des `a_verifier`, limites.

## Format

```
status_evidence.csv   hs6,status,rca,rca_hors_27,imports_usd,exports_usd,evidence_source,evidence_date,note
```

## Critères d'acceptation

- Tout statut `partiel` a une source consultable.
- Les chiffres d'importation se recalculent depuis `data/raw/` par une commande donnée dans `docs/statuts.md`.
- Un test `pipeline/tests/test_baci.py` vérifie le RCA sur un mini-jeu de données construit à la main.
- Total des importations de la filière affiché, avec sa part dans les importations totales du pays.

## Garde-fous

- P4 : pas de statut « par intuition ».
- Si BACI n'est pas téléchargeable ici, arrête-toi et dis-le ; ne fabrique pas de chiffres.

## Point d'arrêt

Montre-moi `docs/statuts.md` et la question du RCA avec ou sans hydrocarbures. Ne passe pas aux critères.
