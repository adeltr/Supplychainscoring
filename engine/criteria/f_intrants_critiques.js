import { criticalInputs } from '../graph.js';

// Part des intrants critiques disponibles (couverts ou lancés avant).
export default {
  compute(node, ctx) {
    const ins = criticalInputs(ctx.model, node.hs6);
    const ok = ins.filter((i) => ctx.dispo.has(i));
    return {
      raw: ins.length ? (100 * ok.length) / ins.length : 100,
      quality: 'real',
      detail: { total: ins.length, disponibles: ok, manquants: ins.filter((i) => !ctx.dispo.has(i)) },
    };
  },
};
