// API publique du moteur. Fonctionne dans Node et dans le navigateur.
export { buildModel, criticalInputs, criticalShare, initialAvailable } from './graph.js';
export { loadModules } from './registry.js';
export { normalize } from './normalize.js';
export { evaluate, scoreAll, scoreNode, paramsOf } from './score.js';
export { classify, DEFAULT_CONSTRAINTS } from './constraints.js';
export { sequence, categoryOf } from './sequence.js';
export { instrumentsFor, importPolicy, protectionOption } from './instruments.js';
export { fromPreset, presetName, serialize, deserialize } from './scenario.js';
export { diff, compare, spearman, settingsDiff } from './compare.js';
export { monteCarlo, sensitivity, perturb, rng } from './montecarlo.js';

import { buildModel } from './graph.js';
import { loadModules } from './registry.js';

// Charge le modèle complet à partir des JSON du pipeline.
export async function createModel(data, base) {
  return buildModel(data, await loadModules(data.criteria, base));
}
