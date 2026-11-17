// Modèle en mémoire : index des nœuds, des arêtes et des capacités.

export function buildModel(data, modules = {}) {
  const nodes = new Map(data.nodes.map((n) => [n.hs6, n]));
  const parents = new Map(), children = new Map(), caps = new Map();
  for (const id of nodes.keys()) { parents.set(id, []); children.set(id, []); caps.set(id, []); }
  for (const e of data.edges) {
    if (!nodes.has(e.from) || !nodes.has(e.to)) throw new Error(`arête ${e.from}→${e.to} : extrémité inconnue`);
    parents.get(e.to).push(e);
    children.get(e.from).push(e);
  }
  for (const c of data.capacities ?? []) for (const id of c.required_by) caps.get(id)?.push(c);
  const model = { nodes, parents, children, caps, criteria: data.criteria, firms: data.firms ?? [],
    meta: data.meta ?? {}, modules, descendants: new Map(), ancestors: new Map() };
  for (const id of nodes.keys()) {
    model.descendants.set(id, reach(id, children, 'to'));
    model.ancestors.set(id, reach(id, parents, 'from'));
  }
  return model;
}

function reach(start, index, key) {
  const seen = new Set(), stack = [start];
  while (stack.length) {
    for (const e of index.get(stack.pop())) {
      if (!seen.has(e[key])) { seen.add(e[key]); stack.push(e[key]); }
    }
  }
  return seen;
}

export const criticalInputs = (model, id) =>
  model.parents.get(id).filter((e) => e.kind === 'critique').map((e) => e.from);

// Part (0 à 1) des intrants critiques disponibles. 1 s'il n'y en a aucun.
export function criticalShare(model, id, dispo) {
  const ins = criticalInputs(model, id);
  return ins.length ? ins.filter((i) => dispo.has(i)).length / ins.length : 1;
}

// Nœuds disponibles au départ : ceux dont le statut est « couvert ».
export const initialAvailable = (model) =>
  new Set([...model.nodes.values()].filter((n) => n.status === 'couvert').map((n) => n.hs6));
