// Contraintes : filtres durs, distincts du score.
// Rend, pour chaque nœud, son rôle dans le séquençage.

import { drcAt } from './criteria/c_drc.js';
import { paramsOf } from './score.js';

export const DEFAULT_CONSTRAINTS = {
  taux_change: 'officiel',      // officiel | parallele
  exclure_drc_sup_1: false,
  inclure_partiels: true,
  seuil_intrants: 50,           // 0 | 50 | 100
  projets_par_vague: 4,
  filtre_juridique: false,
};

// role : 'disponible' (couvert), 'candidat', 'exclu', 'hors_filiere'
// motif (si exclu) : 'drc' | 'partiel' | 'juridique'
export function classify(model, scenario) {
  const k = { ...DEFAULT_CONSTRAINTS, ...scenario.contraintes };
  const params = paramsOf(model, scenario);
  const seuilUe = (model.meta.parametres?.seuil_part_ue_pct ?? 50) / 100;
  const out = new Map();
  for (const n of model.nodes.values()) {
    let r = { role: 'candidat', motif: null, drc_inconnu: false };
    if (n.status === 'couvert') r.role = 'disponible';
    else if (n.frontier) r.role = 'hors_filiere';
    else if (n.status === 'partiel' && !k.inclure_partiels) r = { ...r, role: 'exclu', motif: 'partiel' };
    else {
      const drc = drcAt(n, params, k.taux_change);
      if (k.exclure_drc_sup_1) {
        if (drc == null) r.drc_inconnu = true; // ni exclu ni validé : signalé
        else if (drc >= 1) r = { ...r, role: 'exclu', motif: 'drc', drc };
      }
      const ue = n.juridique?.part_ue?.raw;
      if (r.role === 'candidat' && k.filtre_juridique && ue != null && ue >= seuilUe) {
        r = { ...r, role: 'exclu', motif: 'juridique', part_ue: ue };
      }
    }
    out.set(n.hs6, r);
  }
  return out;
}
