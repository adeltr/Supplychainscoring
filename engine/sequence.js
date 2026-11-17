// Séquençage en vagues.
//
// À chaque vague : sont éligibles les candidats dont la part d'intrants
// critiques disponibles atteint le seuil ; ils sont classés par score recalculé
// dans l'état courant ; les N premiers sont lancés. Un nœud lancé en vague k
// n'est disponible pour ses clients qu'à partir de la vague k + 1.

import { classify, DEFAULT_CONSTRAINTS } from './constraints.js';
import { criticalInputs, criticalShare, initialAvailable } from './graph.js';
import { scoreAll } from './score.js';

const byRank = (model) => (a, b) =>
  (b.score ?? -1) - (a.score ?? -1) ||
  (model.nodes.get(b.hs6).imports_usd?.raw ?? 0) - (model.nodes.get(a.hs6).imports_usd?.raw ?? 0) ||
  (a.hs6 < b.hs6 ? -1 : 1);

export function sequence(model, scenario) {
  const k = { ...DEFAULT_CONSTRAINTS, ...scenario.contraintes };
  const roles = classify(model, scenario);
  const dispo = initialAvailable(model);
  const today = scoreAll(model, scenario, dispo);
  const remaining = new Set([...roles].filter(([, r]) => r.role === 'candidat').map(([id]) => id));
  const seuil = k.seuil_intrants / 100;
  const vagues = [];
  const planned = new Map();

  while (remaining.size) {
    const scores = scoreAll(model, scenario, dispo);
    const eligibles = [...remaining]
      .filter((id) => criticalShare(model, id, dispo) >= seuil)
      .map((id) => ({ hs6: id, score: scores.get(id).score, detail: scores.get(id) }))
      .sort(byRank(model));
    if (!eligibles.length) break;
    const vague = eligibles.slice(0, Math.max(1, k.projets_par_vague)).map((e) => ({
      hs6: e.hs6, vague: vagues.length + 1, score_lancement: e.score,
      score_aujourdhui: today.get(e.hs6).score, detail: e.detail,
      intrants_importes_au_lancement: criticalInputs(model, e.hs6).filter((i) => !dispo.has(i)),
      drc_inconnu: roles.get(e.hs6).drc_inconnu,
    }));
    vagues.push(vague);
    for (const p of vague) { remaining.delete(p.hs6); planned.set(p.hs6, p); }
    for (const p of vague) dispo.add(p.hs6);
  }

  // Raison du blocage d'un intrant critique indisponible.
  const why = (id) => {
    const r = roles.get(id);
    if (r.role === 'exclu') return r.motif === 'partiel' ? 'partiel' : 'exclu';
    if (r.role === 'hors_filiere') return 'hors_filiere';
    return 'non_planifie';
  };
  // Remonte la chaîne jusqu'à la première cause qui n'est pas « non planifié ».
  const rootCause = (id, seen = new Set()) => {
    if (seen.has(id)) return null;
    seen.add(id);
    for (const i of criticalInputs(model, id).filter((x) => !dispo.has(x))) {
      const w = why(i);
      if (w !== 'non_planifie') return { hs6: i, raison: w, motif: roles.get(i).motif };
      const deeper = rootCause(i, seen);
      if (deeper) return deeper;
    }
    return null;
  };
  const bloques = [...remaining].sort().map((id) => {
    const par = criticalInputs(model, id).filter((i) => !dispo.has(i))
      .map((i) => ({ hs6: i, raison: why(i), motif: roles.get(i).motif }));
    return { hs6: id, bloque_par: par, cause_premiere: rootCause(id),
      part_disponible: criticalShare(model, id, dispo), score_aujourdhui: today.get(id).score };
  });
  const exclus = [...roles].filter(([, r]) => r.role === 'exclu')
    .map(([id, r]) => ({ hs6: id, motif: r.motif, drc: r.drc ?? null, part_ue: r.part_ue ?? null,
      score_aujourdhui: today.get(id).score }));

  const ordre = vagues.flat().map((p) => p.hs6);
  ordre.forEach((id, i) => { planned.get(id).rang = i + 1; });
  const imports = (id) => model.nodes.get(id).imports_usd?.raw ?? 0;
  return {
    vagues, bloques, exclus, ordre, planned, roles, today,
    disponibles_au_depart: [...initialAvailable(model)],
    hors_filiere: [...roles].filter(([, r]) => r.role === 'hors_filiere').map(([id]) => id),
    imports_vises_par_vague: vagues.map((v) => v.reduce((s, p) => s + imports(p.hs6), 0)),
  };
}

// Catégorie finale d'un nœud : chaque nœud est dans une seule.
export function categoryOf(seq, id) {
  if (seq.planned.has(id)) return 'planifie';
  const r = seq.roles.get(id).role;
  if (r === 'disponible') return 'couvert';
  if (r === 'exclu') return 'exclu';
  if (r === 'hors_filiere') return 'hors_filiere';
  return 'bloque';
}
