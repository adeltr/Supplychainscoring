// Robustesse : tirages aléatoires des poids autour d'un scénario.
// Chaque tirage refait le séquençage complet.

import { sequence } from './sequence.js';

// Générateur pseudo-aléatoire à graine (mulberry32) : résultats reproductibles.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Poids perturbés : poids × exp(u × amplitude), u uniforme sur [-1, 1], recadrés dans [1, 5].
// amplitude 0 : poids inchangés. Les critères inactifs restent inactifs.
export function perturb(scenario, amplitude, random) {
  const criteres = {};
  for (const [id, c] of Object.entries(scenario.criteres)) {
    const w = c.actif ? Math.min(5, Math.max(1, c.poids * Math.exp((2 * random() - 1) * amplitude))) : c.poids;
    criteres[id] = { ...c, poids: w };
  }
  return { ...scenario, criteres };
}

const quantile = (sorted, q) => sorted[Math.min(sorted.length - 1, Math.floor(q * sorted.length))];

export function monteCarlo(model, scenario, { tirages = 500, amplitude = 0.5, topN = 10, seed = 1, onProgress } = {}) {
  const random = rng(seed);
  const stats = new Map();
  const get = (id) => stats.get(id) ?? stats.set(id, { top: 0, vague1: 0, planifie: 0, rangs: [], vagues: [] }).get(id);
  for (let t = 0; t < tirages; t++) {
    const seq = sequence(model, perturb(scenario, amplitude, random));
    seq.ordre.forEach((id, i) => {
      const s = get(id), p = seq.planned.get(id);
      s.planifie += 1;
      if (i < topN) s.top += 1;
      if (p.vague === 1) s.vague1 += 1;
      s.rangs.push(i + 1); s.vagues.push(p.vague);
    });
    if (onProgress && t % 25 === 0) onProgress(t / tirages);
  }
  const out = new Map();
  for (const [id, s] of stats) {
    const r = s.rangs.sort((a, b) => a - b), v = s.vagues.sort((a, b) => a - b);
    out.set(id, { part_top_n: s.top / tirages, part_vague_1: s.vague1 / tirages,
      part_planifie: s.planifie / tirages, vague_mediane: quantile(v, 0.5),
      rang_p5: quantile(r, 0.05), rang_median: quantile(r, 0.5), rang_p95: quantile(r, 0.95) });
  }
  return { par_noeud: out, tirages, amplitude, topN, seed };
}

// Sensibilité : effet du retrait de chaque critère actif sur le top N.
export function sensitivity(model, scenario, topN = 10) {
  const base = new Set(sequence(model, scenario).ordre.slice(0, topN));
  return Object.entries(scenario.criteres).filter(([, c]) => c.actif).map(([id]) => {
    const s = { ...scenario, criteres: { ...scenario.criteres, [id]: { ...scenario.criteres[id], actif: false } } };
    const top = sequence(model, s).ordre.slice(0, topN);
    return { id, sortants: [...base].filter((x) => !top.includes(x)), entrants: top.filter((x) => !base.has(x)) };
  });
}
