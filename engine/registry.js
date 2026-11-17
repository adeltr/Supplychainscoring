// Registre des critères. Un critère « donnee » n'a besoin d'aucun code.
// Un critère « calcule » a un module criteria/<id>.js, trouvé par son nom :
// il n'y a pas de liste à tenir à jour.

import donnee from './criteria/_donnee.js';

export async function loadModules(criteria, base = new URL('./criteria/', import.meta.url)) {
  const modules = {};
  for (const c of criteria) {
    if (c.type === 'donnee') { modules[c.id] = donnee; continue; }
    const mod = (await import(new URL(`${c.id}.js`, base).href)).default;
    if (typeof mod?.compute !== 'function') throw new Error(`critère ${c.id} : module sans compute()`);
    modules[c.id] = mod;
  }
  return modules;
}
