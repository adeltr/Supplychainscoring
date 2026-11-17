// Normalisation sur 100. `values` : tableau de nombres ou de null.
// Rend un tableau de même taille ; null reste null.

const clamp = (x) => Math.max(0, Math.min(100, x));

function minmax(values, f = (x) => x) {
  const xs = values.filter((v) => v != null).map(f);
  if (!xs.length) return values.map(() => null);
  const lo = Math.min(...xs), hi = Math.max(...xs);
  // Toutes les valeurs égales : aucun nœud ne se distingue, tout le monde à 50.
  return values.map((v) => (v == null ? null : hi === lo ? 50 : (100 * (f(v) - lo)) / (hi - lo)));
}

const methods = {
  direct: (values) => values.map((v) => (v == null ? null : clamp(v))),
  minmax: (values) => minmax(values),
  // log(1 + x) : pour les montants très dispersés. Valeurs négatives ramenées à 0.
  logminmax: (values) => minmax(values, (x) => Math.log1p(Math.max(0, x))),
  bornes: (values, { min, max }) =>
    values.map((v) => (v == null ? null : clamp((100 * (v - min)) / (max - min)))),
  rang: (values) => {
    const xs = values.filter((v) => v != null).sort((a, b) => a - b);
    if (!xs.length) return values.map(() => null);
    return values.map((v) => {
      if (v == null) return null;
      if (xs.length === 1) return 50;
      const below = xs.filter((x) => x < v).length, same = xs.filter((x) => x === v).length;
      return (100 * (below + (same - 1) / 2)) / (xs.length - 1);
    });
  },
};

export function normalize(values, spec, sens) {
  const fn = methods[spec.methode];
  if (!fn) throw new Error(`méthode de normalisation inconnue : ${spec.methode}`);
  const out = fn(values, spec);
  return sens === 'plus_bas_plus_favorable' ? out.map((v) => (v == null ? null : 100 - v)) : out;
}
