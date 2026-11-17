import assert from 'node:assert/strict';
import test from 'node:test';
import { categoryOf, createModel, importPolicy, instrumentsFor, sequence } from '../index.js';
import { chaine, CRITERES_CHAINE, edge, meta, node, scenario, waves } from './helpers.js';

test('cas 1 : seuil 100 %, N = 1 → B puis C, aucun bloqué', async () => {
  const m = await chaine();
  const s = sequence(m, scenario(m));
  assert.deepEqual(waves(s), [['B'], ['C']]);
  assert.equal(s.bloques.length, 0);
});

test('cas 2 : seuil 100 %, N = 5 → identique, C n\'est pas éligible en vague 1', async () => {
  const m = await chaine();
  assert.deepEqual(waves(sequence(m, scenario(m, { projets_par_vague: 5 }))), [['B'], ['C']]);
});

test('cas 3 : seuil 0 %, N = 1 → le mieux noté d\'abord', async () => {
  // C a un attrait de 100 mais 0 intrant disponible : (0 + 100) / 2 = 50.
  // B a un attrait de 10 et 100 % d'intrants : (100 + 10) / 2 = 55. B passe devant.
  const m = await chaine({ attrait: { B: 10, C: 100 } });
  assert.deepEqual(waves(sequence(m, scenario(m, { seuil_intrants: 0 }))), [['B'], ['C']]);
  // Avec un attrait de 0 pour B : (100 + 0) / 2 = 50, égalité avec C ; C gagne s'il a 51.
  const m2 = await chaine({ attrait: { B: 0, C: 100 } });
  const s2 = sequence(m2, scenario(m2, { seuil_intrants: 0 }, { x_attrait: { actif: true, poids: 5 } }));
  // poids 3 et 5 : B = (3×100 + 5×0)/8 = 37,5 ; C = (3×0 + 5×100)/8 = 62,5
  assert.deepEqual(waves(s2), [['C'], ['B']]);
});

test('cas 4 : DRC de B ≥ 1 avec exclusion → B exclu, C bloqué par B (exclu)', async () => {
  const m = await chaine({ drcB: 150 }); // 150 / 100 = 1,5
  const s = sequence(m, scenario(m, { exclure_drc_sup_1: true }));
  assert.deepEqual(waves(s), []);
  assert.deepEqual(s.exclus.map((e) => [e.hs6, e.motif]), [['B', 'drc']]);
  assert.deepEqual(s.bloques[0].bloque_par, [{ hs6: 'B', raison: 'exclu', motif: 'drc' }]);
  // Au taux parallèle (200), le DRC tombe à 0,75 : B n'est plus exclu.
  const s2 = sequence(m, scenario(m, { exclure_drc_sup_1: true, taux_change: 'parallele' }));
  assert.deepEqual(waves(s2), [['B'], ['C']]);
});

test('cas 5 : B partiel non inclus → C bloqué par B (partiel)', async () => {
  const m = await chaine({ statutB: 'partiel' });
  const s = sequence(m, scenario(m, { inclure_partiels: false }));
  assert.deepEqual(waves(s), []);
  assert.equal(s.bloques[0].hs6, 'C');
  assert.equal(s.bloques[0].bloque_par[0].raison, 'partiel');
});

test('cas 6 : B partiel inclus → B puis C', async () => {
  const m = await chaine({ statutB: 'partiel' });
  assert.deepEqual(waves(sequence(m, scenario(m, { inclure_partiels: true }))), [['B'], ['C']]);
});

test('cas 7 : A → B → C → D, B exclu → D bloqué par C (non planifié), cause première B', async () => {
  const m = await chaine({ drcB: 150, avecD: true });
  const s = sequence(m, scenario(m, { exclure_drc_sup_1: true }));
  const d = s.bloques.find((b) => b.hs6 === 'D');
  assert.deepEqual(d.bloque_par, [{ hs6: 'C', raison: 'non_planifie', motif: null }]);
  assert.deepEqual(d.cause_premiere, { hs6: 'B', raison: 'exclu', motif: 'drc' });
});

test('DRC inconnu : ni exclu ni validé, signalé', async () => {
  const m = await chaine();
  const s = sequence(m, scenario(m, { exclure_drc_sup_1: true }));
  assert.deepEqual(waves(s), [['B'], ['C']]);
  assert.equal(s.planned.get('B').drc_inconnu, true);
});

test('deux intrants critiques dont un seul disponible : seuil 50 passe, seuil 100 bloque', async () => {
  const nodes = [node('A', 'couvert'), node('H', 'manquant', { frontier: true }),
                 node('P', 'manquant', { stage: 2, criteria: { x_attrait: 50 } })];
  const m = await createModel({ nodes, edges: [edge('A', 'P'), edge('H', 'P')], capacities: [], criteria: CRITERES_CHAINE, firms: [], meta: meta() });
  assert.deepEqual(waves(sequence(m, scenario(m, { seuil_intrants: 50 }))), [['P']]);
  const s = sequence(m, scenario(m, { seuil_intrants: 100 }));
  assert.deepEqual(waves(s), []);
  assert.deepEqual(s.bloques[0].bloque_par, [{ hs6: 'H', raison: 'hors_filiere', motif: null }]);
  // au seuil 50, l'intrant importé est à faciliter
  const s50 = sequence(m, scenario(m, { seuil_intrants: 50 }));
  assert.deepEqual(s50.planned.get('P').intrants_importes_au_lancement, ['H']);
  assert.deepEqual(importPolicy(m, s50).find((x) => x.hs6 === 'H').avis, 'faciliter');
});

test('une arête secondaire ne bloque pas', async () => {
  const nodes = [node('A', 'manquant', { frontier: true }), node('P', 'manquant', { stage: 2, criteria: { x_attrait: 50 } })];
  const m = await createModel({ nodes, edges: [edge('A', 'P', 'secondaire')], capacities: [], criteria: CRITERES_CHAINE, firms: [], meta: meta() });
  assert.deepEqual(waves(sequence(m, scenario(m))), [['P']]);
});

test('égalité de score : importations décroissantes, puis code croissant', async () => {
  const nodes = [node('P2', 'manquant', { imports: 10, criteria: { x_attrait: 50 } }),
                 node('P1', 'manquant', { imports: 10, criteria: { x_attrait: 50 } }),
                 node('P3', 'manquant', { imports: 99, criteria: { x_attrait: 50 } })];
  const m = await createModel({ nodes, edges: [], capacities: [], criteria: CRITERES_CHAINE, firms: [], meta: meta() });
  assert.deepEqual(waves(sequence(m, scenario(m))), [['P3'], ['P1'], ['P2']]);
});

test('score au lancement différent du score aujourd\'hui pour C', async () => {
  const m = await chaine();
  const c = sequence(m, scenario(m)).planned.get('C');
  assert.equal(c.score_aujourdhui, 25);  // (0 + 50) / 2
  assert.equal(c.score_lancement, 75);   // (100 + 50) / 2
  assert.equal(c.vague, 2);
});

test('déterminisme et partition des nœuds', async () => {
  const m = await chaine({ drcB: 150, avecD: true });
  const sc = scenario(m, { exclure_drc_sup_1: true });
  const a = sequence(m, sc), b = sequence(m, sc);
  assert.deepEqual(waves(a), waves(b));
  const cats = [...m.nodes.keys()].map((id) => categoryOf(a, id));
  assert.deepEqual(cats, ['couvert', 'exclu', 'bloque', 'bloque']);
});

test('filtre juridique : nœud importé surtout de l\'UE exclu si le filtre est actif', async () => {
  const nodes = [node('P', 'manquant', { part_ue: 0.8, criteria: { x_attrait: 50 } }),
                 node('Q', 'manquant', { part_ue: 0.1, criteria: { x_attrait: 50 } })];
  const m = await createModel({ nodes, edges: [], capacities: [], criteria: CRITERES_CHAINE, firms: [], meta: meta() });
  assert.equal(sequence(m, scenario(m)).ordre.length, 2);
  const s = sequence(m, scenario(m, { filtre_juridique: true }));
  assert.deepEqual(s.ordre, ['Q']);
  assert.equal(s.exclus[0].motif, 'juridique');
});

test('protection : refusée sans impact aval chiffré, chiffrée sinon', async () => {
  const m = await chaine();
  const s = sequence(m, scenario(m));
  const p = instrumentsFor(m, s, 'B').find((i) => i.type === 'protection_temporaire');
  assert.equal(p.recommandable, false);
  assert.match(p.raison, /impact aval non chiffré/);

  const criteria = [...CRITERES_CHAINE, { id: 'c_surcout_aval', type: 'calcule', famille: 'cout', normalisation: { methode: 'logminmax' }, sens: 'plus_bas_plus_favorable', poids_defaut: 3, actif_par_defaut: true }];
  const m2 = await chaine({ criteria });
  const p2 = instrumentsFor(m2, sequence(m2, scenario(m2)), 'B').find((i) => i.type === 'protection_temporaire');
  assert.equal(p2.recommandable, true);
  assert.equal(p2.impact_aval.surcout_usd, 30); // 30 % × 100
  assert.deepEqual(p2.impact_aval.utilisateurs.map((u) => u.hs6), ['C']);
});
