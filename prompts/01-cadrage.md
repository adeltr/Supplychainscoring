# 01 — Cadrage : filière pilote, pays de référence, paramètres

**Phase :** 0 · **Dépend de :** rien · **Produit :** `config/projet.yaml`, `docs/decisions.md`, `docs/cadrage.md`

Lis `prompts/00-contexte.md`.

## Mission

Préparer les choix de cadrage pour que je puisse trancher en connaissance de cause, puis les figer dans la configuration du projet. Tu instruis, je décide.

## Tâches

1. **Comparer 4 filières candidates** : pétrochimie → plasturgie ; sidérurgie → construction métallique ; lait et produits laitiers ; médicaments génériques. Pour chacune, à partir de sources publiques citées :
   - facture d'importation annuelle (BACI, moyenne 2021-2023), 5 premiers HS6 ;
   - nombre approximatif de nœuds HS6 et profondeur de la chaîne ;
   - mélange de statuts attendu (couvert, partiel, manquant, absent) ;
   - ressource ou avantage local ;
   - disponibilité d'un réseau intrant → produit publié ;
   - capacités non marchandes identifiables ;
   - sensibilité juridique (Accord d'association UE, ZLECAf) ;
   - risques pour un pilote (données, taille, controverse).
2. **Comparer 4 pays de référence** (Égypte, Turquie, Maroc, plus un que tu proposes selon la filière) : ressemblance structurelle, avance dans la filière, qualité des données, usage prévu (seuils de couverture, contrôle des coefficients techniques, comparaison des paniers d'exportation).
3. **Vérifier l'accès réel aux données** : pour BACI, Growth Lab, WITS, BEC, O'Clery et al. 2025, Fessina et al. 2025, indique l'adresse, le format, la licence, le dernier millésime, et si le téléchargement fonctionne depuis cet environnement. Si une source est inaccessible, dis-le ; ne la simule pas.
4. **Taux de change** : propose la source et la date du taux officiel. Pour le taux parallèle, liste les sources publiques existantes et leurs limites ; la valeur reste saisie par moi.
5. **Rédiger `docs/cadrage.md`** : deux tableaux comparatifs, une recommandation argumentée, les questions ouvertes.
6. **Après ma réponse**, écrire `config/projet.yaml` (clés du § 4 du contexte) et ouvrir `docs/decisions.md` avec une entrée par décision.

## Critères d'acceptation

- Chaque chiffre de `docs/cadrage.md` a une source et une année.
- Les sources inaccessibles sont listées avec le message d'erreur obtenu.
- `config/projet.yaml` ne contient que des valeurs que j'ai validées ; les autres clés portent `a_confirmer: true`.

## Garde-fous

- Pas de chiffre de mémoire présenté comme une donnée : soit tu le tires d'une source, soit tu écris « non vérifié ».
- Ne choisis pas à ma place.

## Point d'arrêt

Présente `docs/cadrage.md` et pose-moi les questions de décision. N'écris `config/projet.yaml` qu'après mes réponses. Ne commence pas le graphe.
