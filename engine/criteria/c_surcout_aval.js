// Surcoût annuel pour les utilisateurs algériens si le produit était protégé
// au taux hypothétique `taux_protection_pct`. Borne haute de court terme.
export default {
  compute(node, ctx) {
    const imports = node.imports_usd?.raw;
    if (imports == null) return { raw: null, quality: 'missing', detail: null };
    const taux = ctx.params.taux_protection_pct;
    const users = ctx.model.children.get(node.hs6).map((e) => ({
      hs6: e.to, label: ctx.model.nodes.get(e.to).label, lien: e.kind }));
    return {
      raw: (taux / 100) * imports,
      quality: 'estimated',
      detail: {
        surcout_usd: (taux / 100) * imports, taux_pct: taux,
        tarif_actuel_pct: node.tarif?.raw ?? null,
        utilisateurs: users,
        porte_par: users.length ? 'industries en aval, puis consommateurs' : 'consommateurs et acheteurs finals',
        repartition_par_utilisateur: null, // non calculable sans données de douane par entreprise (V2)
      },
    };
  },
};
