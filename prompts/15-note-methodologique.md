# 15 — Note méthodologique (5 pages)

**Phase :** 5 · **Dépend de :** 04, 10, 11 (peut démarrer dès la fin de la phase 3) · **Produit :** `docs/note-methodologique.md`, export PDF

Lis `prompts/00-contexte.md`, `docs/criteres.md`, `docs/statuts.md`, `docs/entreprises.md`, `docs/decisions.md`, `docs/presets.md`.

## Mission

Une note de 5 pages qu'un économiste d'administration peut lire sans ouvrir le code : ce que l'outil mesure, d'où viennent les chiffres, ce qu'il ne faut pas lui faire dire.

## Lecteur

Cadre d'un ministère ou d'une agence d'investissement, formé à l'économie, pas à la programmation. Il lit la note à froid et doit pouvoir la défendre devant un contradicteur.

## Plan imposé

1. **Objet** (½ page) : les trois questions ; ce que l'outil produit ; ce qu'il ne fait pas (il ne désigne pas d'entreprises, il ne remplace pas une étude de faisabilité).
2. **Données** (¾ page) : sources V1 ; données miroir et leurs conséquences ; définition des quatre statuts ; marquage de la qualité des valeurs ; part actuelle de valeurs réelles, estimées, de démonstration, manquantes.
3. **Critères** (2 pages) : tableau des 14 critères (famille, définition en une phrase, formule, source, normalisation, sens, poids par défaut, couverture). Un paragraphe pour ceux qui demandent une explication : DRC et taux de change, taux de protection effective, effet d'entraînement, importations évitées nettes.
4. **Score, contraintes, séquençage** (¾ page) : formule du score ; traitement des données manquantes ; différence entre score et contrainte ; algorithme en vagues sur un exemple de 3 maillons ; signification de « bloqué ».
5. **Robustesse et comparaison** (¼ page) : ce que mesure le Monte Carlo, ce qu'il ne mesure pas.
6. **Limites** (¾ page), sans les adoucir : production intérieure invisible dans les données miroir ; RCA et hydrocarbures ; agrégation HS6 ; réseau d'intrants complété à la main ; DRC et investissement estimés ; taux parallèle non officiel ; échelle minimale efficace approximative ; biais de visibilité des entreprises ; le score additif suppose des critères compensables ; résultats valables pour la filière pilote seulement.
7. **Vers la V2** (¼ page) : ce que chaque source administrative corrige.

Annexe hors des 5 pages : références bibliographiques complètes, journal des décisions.

## Exigences de rédaction

- Phrases complètes, pas de jargon non défini, chaque sigle développé à la première occurrence.
- Chaque chiffre cité renvoie à une source ou à un fichier du dépôt.
- 5 pages au format A4, corps 11 : vérifie la longueur sur le PDF.
- Les limites sont écrites comme des faits, pas comme des précautions.

## Critères d'acceptation

- Les 14 critères de `criteria/*.yaml` figurent dans le tableau, avec les mêmes définitions et sources (contrôle automatisé des identifiants).
- Les références citées existent (liens ouverts).
- Relecture finale : aucune affirmation plus forte que ce que les données permettent.

## Point d'arrêt

Donne-moi le PDF et la liste des affirmations dont tu n'es pas sûr.
