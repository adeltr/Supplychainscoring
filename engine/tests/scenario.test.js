import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { categoryOf, compare, createModel, deserialize, diff, fromPreset, monteCarlo, presetName, rng, sensitivity, sequence, serialize } from '../index.js';
import { chaine, CRITERES_CHAINE, meta, node, scenario } from './helpers.js';

async function trois() {
  // P1 domine sur tout ; P2 et P3 se disputent la deuxième place selon les poids.
  const criteria = [
    { id: 'k1', type: 'donnee', normalisation: { methode: 'direct' }, sens: 'plus_haut_plus_favorable', poids_defaut: 3, actif_par_defaut: true },
    { id: 'k2', type: 'donnee', normalisation: { methode: 'direct' }, sens: 'plus_haut_plus_favorable', poids_defaut: 3, actif_par_defaut: true },
  ];
  const nodes = [node('P1', 'manquant', { criteria: { k1: 100, k2: 100 } }),
                 node('P2', 'manquant', { criteria: { k1: 60, k2: 30 } }),
                 node('P3', 'manquant', { criteria: { k1: 30, k2: 58 } })];
  return createModel({ nodes, edges: [], capacities: [], criteria, firms: [], meta: meta() });
}

test('générateur à graine : reproductible, et différent d\'une graine à l\'autre', () => {
  const a = rng(42), b = rng(42), c = rng(43);
  const xa = [a(), a(), a()], xb = [b(), b(), b()], xc = [c(), c(), c()];
  assert.deepEqual(xa, xb);
  assert.notDeepEqual(xa, xc);
  assert.ok(xa.every((x) => x >= 0 && x < 1));
});

test('Monte Carlo : amplitude 0 → le top N reste à 100 %', async () => {
  const m = await trois();
  const r = monteCarlo(m, scenario(m), { tirages: 50, amplitude: 0, topN: 2 });
  assert.equal(r.par_noeud.get('P1').part_top_n, 1);
  assert.equal(r.par_noeud.get('P2').part_top_n, 1); // 45 contre 44
  assert.equal(r.par_noeud.get('P3').part_top_n, 0);
});

test('Monte Carlo : un nœud dominant reste premier quelle que soit l\'amplitude', async () => {
  const m = await trois();
  const r = monteCarlo(m, scenario(m), { tirages: 200, amplitude: 1.5, topN: 1, seed: 7 });
  assert.equal(r.par_noeud.get('P1').part_top_n, 1);
  assert.equal(r.par_noeud.get('P1').rang_p95, 1);
});

test('Monte Carlo : un classement serré est sensible aux poids, et reproductible', async () => {
  const m = await trois();
  const o = { tirages: 300, amplitude: 0.8, topN: 2, seed: 3 };
  const r1 = monteCarlo(m, scenario(m), o), r2 = monteCarlo(m, scenario(m), o);
  const p2 = r1.par_noeud.get('P2').part_top_n, p3 = r1.par_noeud.get('P3').part_top_n;
  assert.ok(p2 > 0 && p2 < 1 && p3 > 0 && p3 < 1);
  assert.ok(Math.abs(p2 + p3 - 1) < 1e-9); // l'un ou l'autre occupe la 2e place
  assert.equal(p2, r2.par_noeud.get('P2').part_top_n);
  assert.notEqual(p2, monteCarlo(m, scenario(m), { ...o, seed: 4 }).par_noeud.get('P2').part_top_n);
});

test('sensibilité : retirer un critère change le top', async () => {
  const m = await trois();
  const s = sensitivity(m, scenario(m), 2);
  assert.deepEqual(s.find((x) => x.id === 'k1'), { id: 'k1', sortants: ['P2'], entrants: ['P3'] });
  assert.deepEqual(s.find((x) => x.id === 'k2').sortants, []);
});

test('variation de rang entre deux feuilles de route', async () => {
  const m = await trois();
  const a = sequence(m, scenario(m));
  const b = sequence(m, scenario(m, {}, { k1: { actif: false, poids: 3 } }));
  const d = Object.fromEntries(diff(a, b).map((x) => [x.hs6, x]));
  assert.equal(d.P1.mouvement, 'stable');
  assert.deepEqual([d.P2.rang_avant, d.P2.rang_apres, d.P2.mouvement], [2, 3, 'descend']);
  assert.deepEqual([d.P3.ecart, d.P3.mouvement], [1, 'monte']);
});

test('comparaison : un scénario comparé à lui-même', async () => {
  const m = await trois();
  const a = sequence(m, scenario(m));
  const c = compare(a, a, 2);
  assert.equal(c.spearman, 1);
  assert.ok(c.lignes.every((l) => l.mouvement === 'stable'));
  assert.equal(c.communs_top_n, 2);
});

test('comparaison : entrée et sortie de la feuille de route', async () => {
  const m = await chaine({ drcB: 150 });
  const a = sequence(m, scenario(m));
  const b = sequence(m, scenario(m, { exclure_drc_sup_1: true }));
  assert.deepEqual(compare(a, b).seulement_a.sort(), ['B', 'C']);
});

test('préréglage → modification → retour', async () => {
  const data = await donneesReelles();
  const m = await createModel(data);
  const s = fromPreset(m, 'souverainete');
  assert.equal(presetName(m, s), 'souverainete');
  const avant = s.criteres.v_pci.poids;
  s.criteres.v_pci.poids = avant === 5 ? 4 : 5;
  assert.equal(presetName(m, s), 'personnalise');
  s.criteres.v_pci.poids = avant;
  assert.equal(presetName(m, s), 'souverainete');
  s.params.demo = true; // un paramètre n'est pas un réglage du préréglage
  assert.equal(presetName(m, s), 'souverainete');
  assert.deepEqual(deserialize(serialize(s)), s);
});

const donneesReelles = async () => Object.fromEntries(await Promise.all(
  ['nodes', 'edges', 'capacities', 'criteria', 'firms', 'meta'].map(async (n) =>
    [n, JSON.parse(await readFile(new URL(`../../data/out/${n}.json`, import.meta.url), 'utf8'))])));

test('filière réelle : chaque nœud dans une seule catégorie, pour chaque préréglage', async () => {
  const data = await donneesReelles();
  const m = await createModel(data);
  for (const id of Object.keys(data.meta.presets)) {
    const seq = sequence(m, fromPreset(m, id));
    const cats = [...m.nodes.keys()].map((n) => categoryOf(seq, n));
    assert.equal(cats.length, data.nodes.length);
    const n = (c) => cats.filter((x) => x === c).length;
    assert.equal(n('planifie'), seq.ordre.length);
    assert.equal(n('bloque'), seq.bloques.length);
    assert.equal(n('exclu'), seq.exclus.length);
    assert.equal(n('couvert') + n('planifie') + n('bloque') + n('exclu') + n('hors_filiere'), data.nodes.length);
    // aucune valeur de démonstration n'entre dans un score par défaut
    for (const p of seq.planned.values()) assert.equal(p.detail.qualite.demo, 0);
  }
});
