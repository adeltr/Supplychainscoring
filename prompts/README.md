# Prompts du projet

Un fichier par tâche. Chaque prompt se suffit à lui-même une fois `00-contexte.md` lu : mission, tâches, sorties, critères d'acceptation, garde-fous, point d'arrêt.

## Mode d'emploi

1. Ouvre une session sur ce dépôt.
2. Envoie : « Exécute `prompts/NN-nom.md` ».
3. À la fin, la session s'arrête au **point d'arrêt** et te montre ce qu'elle a produit.
4. Valide, corrige ou tranche les questions ouvertes ; les décisions vont dans `docs/decisions.md`.
5. Passe au prompt suivant. Une session neuve par prompt convient : tout l'état est dans le dépôt.

## Ordre

| N° | Prompt | Phase | Dépend de | Tu valides |
|---|---|---|---|---|
| 00 | `00-contexte.md` | — | — | référence commune, ne s'exécute pas |
| 01 | `01-cadrage.md` | 0 | — | filière, pays de référence, paramètres |
| 02 | `02-graphe-filiere.md` | 1 | 01 | périmètre, étapes, arêtes, capacités |
| 03 | `03-statuts-noeuds.md` | 1 | 02 | statuts, définition du RCA |
| 04 | `04-fiches-criteres.md` | 1 | 03 | 14 fiches, normalisations |
| 05 | `05-revue-etape1.md` | 1 | 02-04 | **étape 1 : accord avant tout code** |
| 06 | `06-pipeline-sources.md` | 2 | 05 | sources chargées et manquantes |
| 07 | `07-pipeline-build-schemas.md` | 2 | 06 | JSON et schémas V1 / V2 |
| 08 | `08-entreprises.md` | 2 | 07 | méthode de proximité |
| 09 | `09-moteur-criteres-score.md` | 3 | 07 | score |
| 10 | `10-contraintes-sequencage.md` | 3 | 09 | feuille de route |
| 11 | `11-scenarios-montecarlo.md` | 3 | 10 | préréglages, robustesse |
| 12 | `12-interface-graphe-lentilles.md` | 4 | 11 + prototype | vue graphe |
| 13 | `13-interface-fiche-feuille-de-route.md` | 4 | 12 | fiche, feuille de route |
| 14 | `14-interface-comparaison-robustesse.md` | 4 | 13 | interface complète |
| 15 | `15-note-methodologique.md` | 5 | 04, 10, 11 | note de 5 pages |
| 16 | `16-recette-finale.md` | 6 | 14, 15 | recette |
| 17 | `17-v2-donnees-administratives.md` | 7 | 16 + accès aux données | V2 |

Parallélisables : 08 et 09 ; 15 dès la fin de 11.

## À fournir par toi

- Avant 01 : rien (le prompt t'aide à choisir la filière et le pays).
- Avant 12 : le prototype de référence, déposé dans `reference/`.
- Avant 17 : conventions d'accès aux données administratives.
