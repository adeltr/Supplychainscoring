// Coût en ressources domestiques. DRC = (DZD par dollar de valeur ajoutée) / taux de change.
// Sans donnée réelle, n'utilise la valeur de démonstration que si elle est activée.
export function drcAt(node, params, which) {
  const real = node.drc_inputs?.dzd_par_usd_va;
  const ratio = real ?? (params.demo ? node.demo?.drc_dzd_par_usd_va : null);
  const taux = params.taux?.[which];
  if (ratio == null || !taux) return null;
  return ratio / taux;
}

export default {
  compute(node, ctx) {
    const { params } = ctx;
    const raw = drcAt(node, params, params.taux_change);
    const real = node.drc_inputs?.dzd_par_usd_va != null;
    return {
      raw,
      quality: raw == null ? 'missing' : real ? node.drc_inputs.quality : 'demo',
      detail: { officiel: drcAt(node, params, 'officiel'), parallele: drcAt(node, params, 'parallele') },
    };
  },
};
