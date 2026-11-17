// Instruments proposés pour un maillon planifié, et traitement des importations.
//
// Règle dure : une protection n'est jamais proposée sans le chiffrage de son
// impact sur les utilisateurs algériens du produit.

import { categoryOf } from './sequence.js';

export function instrumentsFor(model, seq, id) {
  const p = seq.planned.get(id);
  if (!p) return [];
  const node = model.nodes.get(id);
  const label = (x) => model.nodes.get(x).label;
  const out = [];
  if (p.intrants_importes_au_lancement.length) {
    out.push({ type: 'facilitation_import_intrants', libelle: "Faciliter l'importation des intrants",
      raison: 'Intrants critiques non disponibles localement au lancement : ' +
        p.intrants_importes_au_lancement.map(label).join(', ') + '.' });
  }
  const caps = model.caps.get(id).filter((c) => c.state !== 'disponible');
  if (caps.length) {
    out.push({ type: 'mise_en_place_capacites', libelle: 'Lever les prérequis non marchands',
      raison: 'Capacités à établir ou à vérifier : ' + caps.map((c) => `${c.label} (${c.state})`).join(', ') + '.' });
  }
  out.push(node.status === 'partiel'
    ? { type: 'extension', libelle: "Incitation à l'extension de capacité",
        raison: 'Une production locale existe déjà : il s\'agit de la porter à l\'échelle du marché.' }
    : { type: 'investissement', libelle: "Incitation à l'investissement",
        raison: 'Aucune production locale attestée : il s\'agit de créer une capacité.' });
  out.push(protectionOption(model, p, node));
  return out;
}

// Option « protection temporaire » : évaluée, recommandable seulement si chiffrée.
export function protectionOption(model, planned, node) {
  const c = planned.detail.contributions.find((x) => x.id === 'c_surcout_aval');
  const chiffre = c && c.raw != null;
  return {
    type: 'protection_temporaire', libelle: 'Protection temporaire (option évaluée)',
    recommandable: !!chiffre,
    raison: chiffre
      ? `Surcoût annuel estimé pour les utilisateurs : ${Math.round(c.detail.surcout_usd).toLocaleString('fr-FR')} USD ` +
        `au taux de ${c.detail.taux_pct} % ; porté par : ${c.detail.porte_par}.`
      : 'Non recommandable en l\'état : impact aval non chiffré.',
    impact_aval: chiffre ? c.detail : null,
  };
}

// Question 1 : que faire des importations de chaque produit non lancé ?
export function importPolicy(model, seq) {
  const besoin = new Map(); // intrant -> produits planifiés qui l'importent au lancement
  for (const p of seq.planned.values()) {
    for (const i of p.intrants_importes_au_lancement) {
      if (!besoin.has(i)) besoin.set(i, []);
      besoin.get(i).push(p.hs6);
    }
  }
  const out = [];
  for (const n of model.nodes.values()) {
    const cat = categoryOf(seq, n.hs6);
    if (cat === 'couvert') continue;
    const pour = besoin.get(n.hs6) ?? [];
    if (pour.length) {
      out.push({ hs6: n.hs6, avis: 'faciliter', pour,
        raison: 'Intrant critique de maillons lancés avant qu\'il soit disponible localement.' });
    } else if (cat !== 'planifie') {
      out.push({ hs6: n.hs6, avis: 'laisser_entrer', pour: [],
        raison: cat === 'hors_filiere' ? 'Intrant hors filière, sans projet de production locale.'
          : 'Aucune production locale planifiée dans ce scénario.' });
    }
  }
  return out;
}
