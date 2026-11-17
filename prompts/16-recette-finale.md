# 16 — Recette finale et mise en ligne

**Phase :** 6 · **Dépend de :** 14, 15 · **Produit :** `docs/recette.md`, `README.md`, intégration continue, version étiquetée

Lis `prompts/00-contexte.md` et tout `docs/`.

## Mission

Vérifier que l'ensemble tient ses promesses, de la donnée brute à l'écran, et le rendre reprenable par quelqu'un d'autre. Tu contrôles ; tu ne réécris pas.

## Contrôles

1. **Reproductibilité** : depuis un dépôt cloné à neuf, les commandes du `README` régénèrent `data/out/` à l'identique (empreintes comparées) et lancent tous les tests.
2. **Principes non négociables**, un par un, avec preuve :
   - P1 : cherche tout instrument de restriction proposé sur un intrant ; chacun a son impact aval chiffré.
   - P2 : aucun score calculé sans l'état des intrants.
   - P3 : aucun texte, export ou écran ne désigne une entreprise.
   - P4 : chaque valeur a une `quality` ; chaque valeur `demo` est visible comme telle à l'écran et dans les exports ; aucune valeur `missing` affichée comme un nombre.
3. **Extensibilité** : ajoute un critère factice (fiche et module), constate qu'il apparaît dans le pipeline, le moteur et l'interface sans autre modification ; retire-le. Donne le diff.
4. **Cohérence** : pour 5 nœuds tirés au hasard, suis une valeur de la source brute jusqu'à la fiche du nœud.
5. **Cas limites dans l'interface** : tous les critères désactivés ; seuil 100 % sans aucun nœud éligible ; N supérieur au nombre de nœuds ; taux de change absent.
6. **Lecture critique des résultats** en économiste : le top 10 du scénario équilibré est-il défendable ? Y a-t-il un résultat absurde qui trahit une erreur de donnée ou de normalisation ? Écris-le sans ménagement.
7. **Accessibilité et performance** : clavier, contraste, temps de chargement, temps de recalcul.

## Livrables

- `docs/recette.md` : tableau contrôle / résultat / preuve ; anomalies classées (bloquante, gênante, mineure) ; ce qui n'a pas pu être vérifié.
- `README.md` : objet, installation, commandes, structure, comment ajouter un critère, comment changer de filière, avertissement sur les données de démonstration.
- Intégration continue : tests Python, tests JavaScript, validation des schémas, test de bout en bout.
- Mise en ligne de l'interface statique, **seulement si je le demande**.

## Garde-fous

- Ne corrige pas en silence : chaque anomalie est d'abord notée, puis corrigée dans un commit séparé.
- Un test qui échoue n'est ni désactivé ni contourné.

## Point d'arrêt

Donne-moi `docs/recette.md`. La liste des anomalies bloquantes décide de la suite.
