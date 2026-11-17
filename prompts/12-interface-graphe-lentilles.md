# 12 — Interface : structure, panneau de réglages, graphe, lentilles

**Phase :** 4 · **Dépend de :** 11 et **du prototype de référence** · **Produit :** `web/` (structure, réglages, graphe)

Lis `prompts/00-contexte.md`, puis **le prototype de référence** dans `reference/` (à déposer par moi). S'il est absent, arrête-toi et demande-le.

## Mission

Poser l'application et sa vue principale : le graphe de la chaîne, piloté par les réglages. L'interface reprend le prototype (disposition, vocabulaire, interactions) ; elle branche le vrai moteur et les vraies données.

## Tâches

1. **Analyser le prototype** : inventaire des écrans, composants, états, couleurs, libellés. Liste ce que tu reprends tel quel, ce que tu adaptes, et pourquoi. Montre-moi cette liste avant d'aller plus loin si un écart est important.
2. **Socle technique** : application statique, sans serveur ; charge `data/out/*.json` ; importe `engine/` tel quel (aucune logique de score dans `web/`). Propose l'outillage le plus léger compatible avec le prototype ; justifie toute dépendance.
3. **État de l'application** : un seul objet scénario (prompt 11) ; toute modification relance score et séquençage ; le résultat précédent est gardé pour la variation de rang. État reflété dans l'adresse (lien partageable).
4. **Panneau de réglages** :
   - critères groupés par famille ; interrupteur actif/inactif ; poids 1 à 5 ; info-bulle avec définition, source, couverture ;
   - sélecteur de préréglage ; passage visible en « personnalisé » ; bouton de retour au préréglage ;
   - contraintes : taux de change, exclusion DRC ≥ 1, inclusion des partiels, seuil 0 / 50 / 100, N par vague, filtre juridique.
   Les critères sont générés depuis `criteria.json` : un critère ajouté apparaît sans toucher l'interface.
5. **Graphe par étapes** : amont à gauche, aval à droite, colonnes nommées par étape ; arêtes critiques pleines, secondaires en pointillé ; nœuds frontière distingués ; zoom, déplacement, recherche par nom ou HS6.
6. **Lentilles** (sélecteur) : score composite (échelle continue) ; feuille de route (couleur par vague, bloqués et exclus distincts) ; statut actuel ; un critère seul (au choix). Légende mise à jour avec la lentille.
7. **Sélection d'un nœud** : ancêtres et arêtes amont dans une couleur (« ce qu'il faut avant »), descendants dans une autre (« ce qu'il débloque »), reste atténué ; option « isoler ce chemin » ; touche Échap pour désélectionner.
8. **Marquage des données** : pastille « démo », « estimé », « non disponible » sur tout nœud ou valeur concerné ; bandeau permanent si le scénario s'appuie sur des valeurs `demo`.

## Exigences de qualité

- Utilisable au clavier ; contraste suffisant ; la couleur n'est jamais le seul signal.
- Clair et sombre ; lisible à 1 280 px et sur tablette.
- Recalcul perçu comme immédiat sur la filière pilote.
- Français partout ; nombres au format français.

## Critères d'acceptation

- Parcours vérifié dans un vrai navigateur, captures jointes : chargement ; changement de préréglage ; modification d'un poids → « personnalisé » ; chaque lentille ; clic sur un nœud ; isolement.
- Aucune erreur de console.
- Test de bout en bout minimal (Playwright) : changer le seuil d'intrants modifie le nombre de nœuds planifiés conformément au moteur.

## Point d'arrêt

Démonstration de la vue graphe. Liste des écarts au prototype.
