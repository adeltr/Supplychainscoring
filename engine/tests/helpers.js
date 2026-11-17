// Jeux de données jouets, écrits à la main, pour des résultats connus d'avance.
import { createModel } from '../index.js';

const v = (raw, quality = 'real') => ({ raw, quality: raw == null ? 'missing' : quality });

export const node = (hs6, status, o = {}) => ({
  hs6, label: o.label ?? hs6, stage: o.stage ?? 1, frontier: !!o.frontier, status, a_verifier: false,
  imports_usd: v(o.imports ?? 100), tarif: v(null),
  juridique: { part_ue: v(o.part_ue ?? null) },
  criteria: Object.fromEntries(Object.entries(o.criteria ?? {}).map(([k, x]) => [k, v(x)])),
  drc_inputs: { dzd_par_usd_va: o.drc_ratio ?? null, quality: o.drc_ratio == null ? 'missing' : 'real' },
  demo: o.demo ?? null,
});

export const edge = (from, to, kind = 'critique') => ({ from, to, kind });

const crit = (id, type, o = {}) => ({ id, famille: 'valeur', libelle: id, type,
  normalisation: o.normalisation ?? { methode: 'direct' },
  sens: o.sens ?? 'plus_haut_plus_favorable', poids_defaut: o.poids ?? 3, actif_par_defaut: true });

export const CRITERES_CHAINE = [
  crit('f_intrants_critiques', 'calcule'),
  crit('x_attrait', 'donnee'),
];

export const meta = (o = {}) => ({
  taux_change: { officiel: { valeur: 100 }, parallele: { valeur: 200 } },
  parametres: { taux_protection_pct: 30, part_intrants_dans_valeur: 0.6, seuil_part_ue_pct: 50 },
  presets: { equilibree: { poids: {}, contraintes: {} } }, ...o });

// Chaîne linéaire A → B → C. A est couvert. `attrait` fixe le critère de donnée.
export async function chaine(o = {}) {
  const a = o.attrait ?? { B: 50, C: 50 };
  const nodes = [
    node('A', 'couvert', { stage: 1 }),
    node('B', o.statutB ?? 'manquant', { stage: 2, criteria: { x_attrait: a.B }, drc_ratio: o.drcB ?? null }),
    node('C', 'manquant', { stage: 3, criteria: { x_attrait: a.C } }),
    ...(o.avecD ? [node('D', 'manquant', { stage: 4, criteria: { x_attrait: 50 } })] : []),
  ];
  const edges = [edge('A', 'B'), edge('B', 'C'), ...(o.avecD ? [edge('C', 'D')] : [])];
  return createModel({ nodes, edges, capacities: [], criteria: o.criteria ?? CRITERES_CHAINE, firms: [], meta: meta() });
}

export const scenario = (model, contraintes = {}, criteres = {}) => ({
  preset: 'equilibree',
  criteres: { ...Object.fromEntries(model.criteria.map((c) => [c.id, { actif: true, poids: c.poids_defaut }])), ...criteres },
  contraintes: { taux_change: 'officiel', exclure_drc_sup_1: false, inclure_partiels: true,
    seuil_intrants: 100, projets_par_vague: 1, filtre_juridique: false, ...contraintes },
  params: {},
});

export const waves = (seq) => seq.vagues.map((v) => v.map((p) => p.hs6));
