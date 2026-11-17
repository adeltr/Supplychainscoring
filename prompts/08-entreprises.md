# 08 — Entreprises : portefeuilles, proximité, liste d'éligibilité

**Phase :** 2 · **Dépend de :** 07 · **Produit :** `data/manual/firms.csv`, `pipeline/build/firms.py`, `data/out/firms.json`, `docs/entreprises.md`

Lis `prompts/00-contexte.md` (P3, P4, § 5, 6), `docs/filiere.md`.

## Mission

Répondre à la question 3 : quelles entreprises algériennes sont les mieux placées pour chaque produit cible. Le résultat est une **liste d'éligibilité classée et justifiée**, jamais une désignation.

## Tâches

1. **Recenser** les entreprises de la filière et de ses abords à partir de sources publiques : sites d'entreprises, rapports annuels, annuaires professionnels, publications officielles, presse spécialisée. Pour chacune : nom, statut (public, privé, mixte), produits fabriqués (HS6 quand c'est déterminable), intrants importés connus, exportations connues, sites, sources.
2. **Capacité financière** : seulement si une source publique existe (comptes publiés, capital social, taille déclarée). Sinon `missing`. Pas d'estimation à vue.
3. **Score de proximité entreprise × nœud** (0-100), transparent et décomposable :
   - le nœud est déjà fabriqué par l'entreprise ;
   - elle fabrique un produit voisin (proximité Growth Lab entre ses produits et le nœud) ;
   - elle fabrique ou importe un intrant du nœud (lien amont) ;
   - elle utilise le nœud comme intrant (lien aval, intérêt à intégrer) ;
   - elle exporte déjà (preuve de compétitivité).
   Propose les pondérations, écris la formule, garde chaque composante dans `reasons`.
4. **Liste d'éligibilité par nœud** : entreprises triées par proximité, avec pour chacune les raisons en clair, la qualité des données et les informations manquantes qui changeraient le rang. Formulation imposée : « éligible, rang n, parce que … ; à vérifier : … ».
5. **Trous.** Nœuds sans aucune entreprise proche : dis-le (cela informe le choix d'instrument : investissement étranger, partenariat, entreprise publique).
6. **`docs/entreprises.md`** : méthode, tableau des entreprises, limites (biais vers les entreprises visibles en ligne, HS6 déduit d'une description), et ce que la V2 changera (DGD, CNRC, DGI, CNAS, AAPI).

## Critères d'acceptation

- Chaque entreprise a au moins une source ; chaque attribution de HS6 a une note.
- `firms.json` valide contre son schéma.
- Test : sur un jeu jouet (2 entreprises, 3 nœuds), le classement attendu est obtenu et les `reasons` sont complètes.
- Aucun texte produit ne contient « l'entreprise retenue », « le champion », ou une recommandation nominative.

## Garde-fous

- P3 et P4.
- Entreprises seulement, pas de personnes physiques. Pas de données personnelles sur les dirigeants.
- Ne présente pas une information de presse isolée comme un fait établi : note sa date et sa nature.

## Point d'arrêt

Montre `docs/entreprises.md` et trois listes d'éligibilité en exemple.
