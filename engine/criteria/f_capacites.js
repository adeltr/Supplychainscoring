const VALEUR = { disponible: 1, partielle: 0.5, manquante: 0, inconnue: 0 };

// Part des capacités non marchandes en place. Une capacité d'état inconnu compte 0.
export default {
  compute(node, ctx) {
    const caps = ctx.model.caps.get(node.hs6);
    if (!caps.length) return { raw: 100, quality: 'real', detail: { total: 0, inconnues: 0 } };
    const sum = caps.reduce((s, c) => s + VALEUR[c.state], 0);
    const inconnues = caps.filter((c) => c.state === 'inconnue').length;
    return { raw: (100 * sum) / caps.length, quality: inconnues ? 'estimated' : 'real',
      detail: { total: caps.length, inconnues } };
  },
};
