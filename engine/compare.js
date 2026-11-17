// Variation de rang entre deux feuilles de route, et comparaison de scénarios.

// Par nœud : rang et vague avant et après, écart, entrée ou sortie.
export function diff(avant, apres) {
  const ids = new Set([...avant.planned.keys(), ...apres.planned.keys()]);
  const out = [];
  for (const id of ids) {
    const a = avant.planned.get(id), b = apres.planned.get(id);
    out.push({
      hs6: id, rang_avant: a?.rang ?? null, rang_apres: b?.rang ?? null,
      ecart: a && b ? a.rang - b.rang : null, // positif : le nœud monte
      vague_avant: a?.vague ?? null, vague_apres: b?.vague ?? null,
      mouvement: !a ? 'entre' : !b ? 'sort' : a.rang === b.rang ? 'stable' : a.rang > b.rang ? 'monte' : 'descend',
    });
  }
  return out.sort((x, y) => (x.rang_apres ?? 1e9) - (y.rang_apres ?? 1e9) || (x.rang_avant ?? 1e9) - (y.rang_avant ?? 1e9));
}

// Corrélation de rang de Spearman sur les nœuds présents dans les deux.
export function spearman(a, b) {
  const ids = a.ordre.filter((id) => b.planned.has(id));
  const n = ids.length;
  if (n < 2) return null;
  const ra = rerank(ids, a), rb = rerank(ids, b);
  const d2 = ids.reduce((s, id) => s + (ra.get(id) - rb.get(id)) ** 2, 0);
  return 1 - (6 * d2) / (n * (n * n - 1));
}
const rerank = (ids, seq) => new Map([...ids].sort((x, y) => seq.planned.get(x).rang - seq.planned.get(y).rang).map((id, i) => [id, i + 1]));

export function compare(a, b, topN = 10) {
  const d = diff(a, b);
  const communs = d.filter((x) => x.ecart != null);
  const top = (s) => new Set(s.ordre.slice(0, topN));
  const ta = top(a), tb = top(b);
  return {
    lignes: d, spearman: spearman(a, b),
    communs_top_n: [...ta].filter((id) => tb.has(id)).length, top_n: topN,
    plus_grandes_montees: [...communs].sort((x, y) => y.ecart - x.ecart).filter((x) => x.ecart > 0).slice(0, 5),
    plus_grandes_descentes: [...communs].sort((x, y) => x.ecart - y.ecart).filter((x) => x.ecart < 0).slice(0, 5),
    seulement_a: d.filter((x) => x.mouvement === 'sort').map((x) => x.hs6),
    seulement_b: d.filter((x) => x.mouvement === 'entre').map((x) => x.hs6),
  };
}

// Critères et contraintes qui diffèrent entre deux scénarios.
export function settingsDiff(a, b) {
  const out = [];
  for (const id of new Set([...Object.keys(a.criteres), ...Object.keys(b.criteres)])) {
    const x = a.criteres[id], y = b.criteres[id];
    if (x?.actif !== y?.actif || x?.poids !== y?.poids) out.push({ type: 'critere', id, a: x, b: y });
  }
  for (const k of new Set([...Object.keys(a.contraintes), ...Object.keys(b.contraintes)])) {
    if (a.contraintes[k] !== b.contraintes[k]) out.push({ type: 'contrainte', id: k, a: a.contraintes[k], b: b.contraintes[k] });
  }
  return out;
}
