import { criticalShare } from '../graph.js';

// Importations du produit, moins les importations d'intrants que sa production
// déclenche tant que ses intrants critiques ne sont pas disponibles.
export default {
  compute(node, ctx) {
    const imports = node.imports_usd?.raw;
    if (imports == null) return { raw: null, quality: 'missing', detail: null };
    const part = ctx.params.part_intrants_dans_valeur;
    const manque = 1 - criticalShare(ctx.model, node.hs6, ctx.dispo);
    const induites = imports * part * manque;
    return { raw: imports - induites, quality: 'estimated',
      detail: { importations: imports, importations_d_intrants_induites: induites } };
  },
};
