import assert from 'node:assert/strict';
import { mkdtemp, writeFile, copyFile, readdir } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import test from 'node:test';
import { createModel, initialAvailable, normalize, scoreAll } from '../index.js';
import { chaine, edge, meta, node, scenario } from './helpers.js';

const approx = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);

// Deux nœuds, deux critères de donnée déjà sur 100.
async function deuxNoeuds(o = {}) {
  const criteria = [
    { id: 'k1', type: 'donnee', famille: 'valeur', normalisation: { methode: 'direct' }, sens: o.sens1 ?? 'plus_haut_plus_favorable', poids_defaut: 1, actif_par_defaut: true },
    { id: 'k2', type: 'donnee', famille: 'valeur', normalisation: { methode: 'direct' }, sens: 'plus_haut_plus_favorable', poids_defaut: 3, actif_par_defaut: true },
  ];
  const nodes = [node('X', 'manquant', { criteria: { k1: 80, k2: 40 } }),
                 node('Y', 'manquant', { criteria: { k1: 20, k2: o.y2 === undefined ? 60 : o.y2 } })];
  return createModel({ nodes, edges: [], capacities: [], criteria, firms: [], meta: meta() });
}

test('score calculé à la main', async () => {
  const m = await deuxNoeuds();
  const s = scoreAll(m, scenario(m), new Set());
  // X : (1×80 + 3×40) / 4 = 50 ; Y : (1×20 + 3×60) / 4 = 50
  approx(s.get('X').score, 50);
  approx(s.get('Y').score, 50);
  // la somme des points par critère redonne le score
  approx(s.get('X').contributions.reduce((t, c) => t + c.points, 0), 50);
});

test('changer un poids change le score', async () => {
  const m = await deuxNoeuds();
  const s = scoreAll(m, scenario(m, {}, { k1: { actif: true, poids: 3 } }), new Set());
  approx(s.get('X').score, (3 * 80 + 3 * 40) / 6); // 60
  approx(s.get('Y').score, (3 * 20 + 3 * 60) / 6); // 40
});

test('désactiver un critère le retire du score', async () => {
  const m = await deuxNoeuds();
  const s = scoreAll(m, scenario(m, {}, { k2: { actif: false, poids: 3 } }), new Set());
  approx(s.get('X').score, 80);
  assert.equal(s.get('X').contributions.length, 1);
});

test('sens inversé : plus bas est plus favorable', async () => {
  const m = await deuxNoeuds({ sens1: 'plus_bas_plus_favorable' });
  const s = scoreAll(m, scenario(m), new Set());
  approx(s.get('X').score, (1 * 20 + 3 * 40) / 4); // 80 devient 20
});

test('donnée manquante : critère retiré, poids renormalisés, couverture < 1', async () => {
  const m = await deuxNoeuds({ y2: null });
  const y = scoreAll(m, scenario(m), new Set()).get('Y');
  approx(y.score, 20);          // seul k1 compte
  approx(y.couverture, 1 / 4);  // 1 point de poids renseigné sur 4
  assert.equal(y.qualite.missing, 1);
  assert.equal(y.contributions.find((c) => c.id === 'k2').norm, null);
});

test('aucun critère actif : pas de score, jamais 0', async () => {
  const m = await deuxNoeuds();
  const s = scoreAll(m, scenario(m, {}, { k1: { actif: false, poids: 1 }, k2: { actif: false, poids: 3 } }), new Set());
  assert.equal(s.get('X').score, null);
});

test('normalisations : cas limites', () => {
  assert.deepEqual(normalize([10, 20, 30], { methode: 'minmax' }, 'plus_haut_plus_favorable'), [0, 50, 100]);
  assert.deepEqual(normalize([5, 5, 5], { methode: 'minmax' }, 'plus_haut_plus_favorable'), [50, 50, 50]);
  assert.deepEqual(normalize([7], { methode: 'minmax' }, 'plus_haut_plus_favorable'), [50]);
  assert.deepEqual(normalize([null, 4], { methode: 'minmax' }, 'plus_haut_plus_favorable'), [null, 50]);
  assert.deepEqual(normalize([0, 1, 2, 3], { methode: 'bornes', min: 0, max: 2 }, 'plus_bas_plus_favorable'), [100, 50, 0, 0]);
  assert.deepEqual(normalize([1, 2, 3], { methode: 'rang' }, 'plus_haut_plus_favorable'), [0, 50, 100]);
  const log = normalize([0, 9, 99], { methode: 'logminmax' }, 'plus_haut_plus_favorable');
  approx(log[1], 50); // log10 : 0, 1, 2
  assert.throws(() => normalize([1], { methode: 'inconnue' }, 'plus_haut_plus_favorable'));
});

test('chaîne A → B → C : les intrants critiques suivent l\'état de la chaîne', async () => {
  const m = await chaine();
  const get = (dispo, id) => scoreAll(m, scenario(m), dispo).get(id).contributions.find((c) => c.id === 'f_intrants_critiques').raw;
  const d0 = initialAvailable(m);
  assert.deepEqual([...d0], ['A']);
  assert.equal(get(d0, 'B'), 100);
  assert.equal(get(d0, 'C'), 0);
  assert.equal(get(new Set(['A', 'B']), 'C'), 100);
});

test('DRC : même nœud, deux taux de change', async () => {
  // 150 DZD de facteurs domestiques par dollar de valeur ajoutée.
  // Taux officiel 100 : DRC = 1,5. Taux parallèle 200 : DRC = 0,75.
  const criteria = [{ id: 'c_drc', type: 'calcule', famille: 'cout', normalisation: { methode: 'bornes', min: 0, max: 2 }, sens: 'plus_bas_plus_favorable', poids_defaut: 3, actif_par_defaut: true }];
  const m = await createModel({ nodes: [node('X', 'manquant', { drc_ratio: 150 })], edges: [], capacities: [], criteria, firms: [], meta: meta() });
  const c = (taux) => scoreAll(m, scenario(m, { taux_change: taux }), new Set()).get('X').contributions[0];
  approx(c('officiel').raw, 1.5);
  approx(c('parallele').raw, 0.75);
  approx(c('officiel').norm, 25);   // 100 − 100 × 1,5 / 2
  approx(c('parallele').norm, 62.5);
  assert.deepEqual(c('officiel').detail, { officiel: 1.5, parallele: 0.75 });
});

test('DRC sans donnée : manquant, sauf valeurs de démonstration activées et marquées', async () => {
  const criteria = [{ id: 'c_drc', type: 'calcule', famille: 'cout', normalisation: { methode: 'bornes', min: 0, max: 2 }, sens: 'plus_bas_plus_favorable', poids_defaut: 3, actif_par_defaut: true }];
  const m = await createModel({ nodes: [node('X', 'manquant', { demo: { drc_dzd_par_usd_va: 80 } })], edges: [], capacities: [], criteria, firms: [], meta: meta() });
  const sans = scoreAll(m, scenario(m), new Set()).get('X');
  assert.equal(sans.contributions[0].quality, 'missing');
  assert.equal(sans.score, null);
  const avec = scoreAll(m, { ...scenario(m), params: { demo: true } }, new Set()).get('X').contributions[0];
  assert.equal(avec.quality, 'demo');
  approx(avec.raw, 0.8);
});

test('surcoût aval : chiffré, avec la liste des utilisateurs', async () => {
  const criteria = [{ id: 'c_surcout_aval', type: 'calcule', famille: 'cout', normalisation: { methode: 'logminmax' }, sens: 'plus_bas_plus_favorable', poids_defaut: 3, actif_par_defaut: true }];
  const m = await createModel({ nodes: [node('I', 'manquant', { imports: 1000 }), node('U', 'manquant', { stage: 2 })], edges: [edge('I', 'U')], capacities: [], criteria, firms: [], meta: meta() });
  const c = scoreAll(m, scenario(m), new Set()).get('I').contributions[0];
  approx(c.raw, 300); // 30 % × 1000
  assert.deepEqual(c.detail.utilisateurs.map((u) => u.hs6), ['U']);
});

test('extensibilité : un critère ajouté par fichiers seuls est noté', async () => {
  const dir = await mkdtemp(join(tmpdir(), 'criteres-'));
  const src = new URL('../criteria/', import.meta.url);
  for (const f of await readdir(src)) await copyFile(new URL(f, src), join(dir, f));
  // Les modules copiés importent ../graph.js : on fournit le chemin d'origine.
  await writeFile(join(dir, 'x_nouveau.js'),
    'export default { compute: (node) => ({ raw: node.hs6 === "X" ? 90 : 10, quality: "real", detail: null }) };');
  const criteria = [{ id: 'x_nouveau', type: 'calcule', famille: 'valeur', normalisation: { methode: 'direct' }, sens: 'plus_haut_plus_favorable', poids_defaut: 3, actif_par_defaut: true }];
  const m = await createModel({ nodes: [node('X', 'manquant'), node('Y', 'manquant')], edges: [], capacities: [], criteria, firms: [], meta: meta() }, pathToFileURL(dir + '/'));
  const s = scoreAll(m, scenario(m), new Set());
  approx(s.get('X').score, 90);
  approx(s.get('Y').score, 10);
});

test('critère calculé sans module : erreur explicite', async () => {
  const criteria = [{ id: 'x_absent', type: 'calcule', normalisation: { methode: 'direct' }, sens: 'plus_haut_plus_favorable', poids_defaut: 3 }];
  await assert.rejects(createModel({ nodes: [node('X', 'manquant')], edges: [], capacities: [], criteria, firms: [], meta: meta() }));
});
