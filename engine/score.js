// Score sur 100 : moyenne pondérée des critères actifs et renseignés.

import { normalize } from './normalize.js';

// Paramètres de calcul tirés du scénario et des métadonnées.
export function paramsOf(model, scenario) {
  const m = model.meta, p = scenario.params ?? {};
  return {
    demo: !!p.demo,
    taux_change: scenario.contraintes?.taux_change ?? 'officiel',
    taux: { officiel: p.taux_officiel ?? m.taux_change?.officiel?.valeur ?? null,
            parallele: p.taux_parallele ?? m.taux_change?.parallele?.valeur ?? null },
    taux_protection_pct: p.taux_protection_pct ?? m.parametres?.taux_protection_pct ?? 30,
    part_intrants_dans_valeur: p.part_intrants_dans_valeur ?? m.parametres?.part_intrants_dans_valeur ?? 0.6,
  };
}

// Valeur brute et normalisée de chaque critère pour chaque nœud, dans l'état `dispo`.
export function evaluate(model, scenario, dispo) {
  const ctx = { model, dispo, params: paramsOf(model, scenario) };
  const ids = [...model.nodes.keys()];
  const table = new Map();
  for (const c of model.criteria) {
    const mod = model.modules[c.id];
    if (!mod) throw new Error(`critère ${c.id} : aucun module chargé`);
    const cells = ids.map((id) => mod.compute(model.nodes.get(id), ctx, c));
    const norm = normalize(cells.map((x) => x.raw), c.normalisation, c.sens);
    table.set(c.id, new Map(ids.map((id, i) => [id, { ...cells[i], norm: norm[i] }])));
  }
  return table;
}

// Score d'un nœud à partir de la table d'évaluation.
export function scoreNode(model, scenario, table, id) {
  const contributions = [];
  let sumW = 0, sumWAll = 0, sum = 0;
  const qualite = { real: 0, estimated: 0, demo: 0, missing: 0 };
  for (const c of model.criteria) {
    const s = scenario.criteres[c.id] ?? { actif: c.actif_par_defaut, poids: c.poids_defaut };
    if (!s.actif) continue;
    const cell = table.get(c.id).get(id);
    sumWAll += s.poids;
    qualite[cell.quality] += 1;
    if (cell.norm != null) { sumW += s.poids; sum += s.poids * cell.norm; }
    contributions.push({ id: c.id, poids: s.poids, raw: cell.raw, norm: cell.norm,
      quality: cell.quality, detail: cell.detail });
  }
  const score = sumW ? sum / sumW : null;
  // points : part du score apportée par le critère (leur somme vaut le score)
  for (const k of contributions) k.points = k.norm == null || !sumW ? null : (k.poids * k.norm) / sumW;
  return { score, couverture: sumWAll ? sumW / sumWAll : 0, contributions, qualite };
}

export function scoreAll(model, scenario, dispo) {
  const table = evaluate(model, scenario, dispo);
  return new Map([...model.nodes.keys()].map((id) => [id, scoreNode(model, scenario, table, id)]));
}
