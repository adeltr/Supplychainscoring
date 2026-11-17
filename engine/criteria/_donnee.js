// Calcul générique d'un critère de type « donnee » : lit la valeur du nœud.
// Si elle manque et que les valeurs de démonstration sont activées, prend la
// valeur de démonstration et la marque comme telle.
export default {
  compute(node, ctx, crit) {
    const key = crit.champ ?? crit.id;
    const v = node.criteria?.[key];
    if (v && v.raw != null) return { raw: v.raw, quality: v.quality, detail: v };
    const d = ctx.params.demo ? node.demo?.[key] : null;
    if (d != null) return { raw: d, quality: 'demo', detail: { source: 'valeur de démonstration' } };
    return { raw: null, quality: 'missing', detail: null };
  },
};
