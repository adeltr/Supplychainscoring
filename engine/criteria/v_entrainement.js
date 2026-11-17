// Importations des produits situés en aval et pas encore disponibles.
export default {
  compute(node, ctx) {
    let total = 0;
    const aval = [];
    for (const id of ctx.model.descendants.get(node.hs6)) {
      if (ctx.dispo.has(id)) continue;
      const v = ctx.model.nodes.get(id).imports_usd?.raw ?? 0;
      total += v;
      aval.push(id);
    }
    return { raw: total, quality: 'real', detail: { descendants: aval } };
  },
};
