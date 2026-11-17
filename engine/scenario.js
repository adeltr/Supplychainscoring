// Scénarios : préréglages, détection du scénario personnalisé, sérialisation.

import { DEFAULT_CONSTRAINTS } from './constraints.js';

export function fromPreset(model, presetId = 'equilibree') {
  const preset = model.meta.presets?.[presetId];
  if (!preset) throw new Error(`préréglage inconnu : ${presetId}`);
  const criteres = {};
  for (const c of model.criteria) {
    criteres[c.id] = { actif: c.actif_par_defaut !== false, poids: preset.poids?.[c.id] ?? c.poids_defaut };
  }
  return { preset: presetId, criteres,
    contraintes: { ...DEFAULT_CONSTRAINTS, ...preset.contraintes },
    params: { demo: false, taux_parallele: null } };
}

// Nom du préréglage auquel le scénario est identique, sinon « personnalise ».
// Les paramètres (taux, valeurs de démonstration) ne font pas partie du préréglage.
export function presetName(model, scenario) {
  for (const id of Object.keys(model.meta.presets ?? {})) {
    const ref = fromPreset(model, id);
    const same = JSON.stringify(sorted(ref.criteres)) === JSON.stringify(sorted(scenario.criteres)) &&
      JSON.stringify(sorted(ref.contraintes)) === JSON.stringify(sorted({ ...DEFAULT_CONSTRAINTS, ...scenario.contraintes }));
    if (same) return id;
  }
  return 'personnalise';
}

const sorted = (o) => Object.fromEntries(Object.keys(o).sort().map((k) =>
  [k, o[k] && typeof o[k] === 'object' ? sorted(o[k]) : o[k]]));

export const serialize = (scenario) => JSON.stringify(scenario);
export const deserialize = (text) => {
  const s = JSON.parse(text);
  if (!s.criteres || !s.contraintes) throw new Error('scénario invalide');
  return { params: {}, ...s };
};
