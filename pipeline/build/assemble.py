"""Assemble les sources et les saisies manuelles en JSON pour le moteur.

Règle : aucune valeur n'est comblée. Une valeur absente sort avec
raw = None et quality = "missing".
"""
from __future__ import annotations

import datetime as dt
from pathlib import Path

import networkx as nx
import pandas as pd
import yaml

ROOT = Path(__file__).resolve().parents[2]
MANUAL = ROOT / "data" / "manual"

UE = ["AUT", "BEL", "BGR", "HRV", "CYP", "CZE", "DNK", "EST", "FIN", "FRA", "DEU", "GRC",
      "HUN", "IRL", "ITA", "LVA", "LTU", "LUX", "MLT", "NLD", "POL", "PRT", "ROU", "SVK",
      "SVN", "ESP", "SWE"]
AFRIQUE = ["AGO", "BEN", "BWA", "BFA", "BDI", "CPV", "CMR", "CAF", "TCD", "COM", "COG", "COD",
           "CIV", "DJI", "EGY", "GNQ", "ERI", "SWZ", "ETH", "GAB", "GMB", "GHA", "GIN", "GNB",
           "KEN", "LSO", "LBR", "LBY", "MDG", "MWI", "MLI", "MRT", "MUS", "MAR", "MOZ", "NAM",
           "NER", "NGA", "RWA", "STP", "SEN", "SYC", "SLE", "SOM", "ZAF", "SSD", "SDN", "TZA",
           "TGO", "TUN", "UGA", "ZMB", "ZWE"]


def val(raw, source, year, quality, **extra) -> dict:
    """Valeur traçable. raw None impose quality = missing."""
    if raw is None or (isinstance(raw, float) and pd.isna(raw)):
        return {"raw": None, "source": source, "year": year, "quality": "missing", **extra}
    return {"raw": float(raw), "source": source, "year": year, "quality": quality, **extra}


def status_rule(rca: float, exports: float, imports: float, manual: str | None,
                stage: int, seuils: dict) -> tuple[str, bool, str]:
    """Statut d'un nœud. Rend (statut, a_verifier, règle appliquée)."""
    s_imp = seuils["importations_significatives_usd"]
    base = "manquant" if imports >= s_imp else "absent"
    if rca >= seuils["rca_couvert"]:
        return "couvert", False, "RCA ≥ 1"
    if manual == "oui":
        return "partiel", False, "production locale attestée par une source publique"
    if manual == "incertain":
        return base, True, "production locale incertaine : sources contradictoires"
    if manual == "non":
        return base, False, "pas de production locale selon les sources citées"
    if exports >= seuils["exportations_partiel_usd"]:
        return "partiel", True, "exportations observées, sans autre source"
    if stage >= 5 and base == "manquant":
        return base, True, "aucune source trouvée ; production locale plausible (transformation)"
    return base, False, "importations seules" if base == "manquant" else "ni importé ni produit"


def check_graph(nodes: pd.DataFrame, edges: pd.DataFrame) -> list[str]:
    """Contrôles de structure. Rend la liste des anomalies (vide si tout va bien)."""
    errs = []
    st = nodes.set_index("hs6")["stage"]
    g = nx.DiGraph()
    g.add_nodes_from(nodes["hs6"])
    for a, b in zip(edges["from"], edges["to"]):
        if a not in st.index or b not in st.index:
            errs.append(f"arête {a}→{b} : extrémité inconnue")
            continue
        if st[a] >= st[b]:
            errs.append(f"arête {a}→{b} : étape non croissante")
        g.add_edge(a, b)
    if not nx.is_directed_acyclic_graph(g):
        errs.append("le graphe contient un cycle")
    errs += [f"nœud isolé : {n}" for n in g if g.degree(n) == 0]
    bad = edges[~edges["kind"].isin(["critique", "secondaire"])]
    errs += [f"type d'arête inconnu : {k}" for k in bad["kind"]]
    return errs


def build_criteria(folder: Path) -> list[dict]:
    """Compile criteria/*.yaml. Tout fichier présent est pris, sans liste à tenir."""
    required = {"id", "famille", "libelle", "definition", "formule", "source", "type",
                "normalisation", "sens", "poids_defaut", "limites"}
    out = []
    for f in sorted(folder.glob("*.yaml")):
        c = yaml.safe_load(f.read_text(encoding="utf-8"))
        missing = required - set(c)
        if missing:
            raise ValueError(f"{f.name} : clés manquantes {sorted(missing)}")
        if c["id"] != f.stem:
            raise ValueError(f"{f.name} : id {c['id']} différent du nom de fichier")
        if c["famille"] not in ("faisabilite", "cout", "valeur"):
            raise ValueError(f"{f.name} : famille inconnue")
        if not 1 <= c["poids_defaut"] <= 5:
            raise ValueError(f"{f.name} : poids hors de 1-5")
        c.setdefault("actif_par_defaut", True)
        for k in ("definition", "limites", "formule"):
            c[k] = " ".join(str(c[k]).split())
        out.append(c)
    order = {"faisabilite": 0, "cout": 1, "valeur": 2}
    return sorted(out, key=lambda c: (order[c["famille"]], c["id"]))


def build_firms(firms: pd.DataFrame, nodes: pd.DataFrame, edges: pd.DataFrame,
                sources: dict) -> list[dict]:
    """Portefeuilles et proximité entreprise × nœud, décomposée en raisons."""
    split = lambda s: [x for x in str(s).split(";") if x and x != "nan"]
    parents = edges.groupby("to")["from"].apply(list).to_dict()
    children = edges.groupby("from")["to"].apply(list).to_dict()
    label = nodes.set_index("hs6")["label"].to_dict()
    out = []
    for r in firms.itertuples():
        prod, imp, exp, proj = split(r.products), split(r.imported_inputs), split(r.exports), split(r.projets)
        prox = {}
        for n in nodes["hs6"]:
            pts, why = 0, []
            if n in prod:
                pts, why = 100, ["fabrique déjà ce produit"]
            else:
                if n in proj:
                    pts += 50; why.append("projet annoncé sur ce produit (+50)")
                made_inputs = [p for p in parents.get(n, []) if p in prod]
                if made_inputs:
                    pts += 30; why.append("fabrique un intrant du produit : " + ", ".join(label[p] for p in made_inputs) + " (+30)")
                if n in imp:
                    pts += 30; why.append("importe ce produit comme intrant : intérêt à l'intégrer (+30)")
                elif any(c in prod for c in children.get(n, [])):
                    pts += 30; why.append("fabrique un produit qui l'utilise (+30)")
                same = [p for p in prod if p[:4] == n[:4]]
                if same:
                    pts += 25; why.append("fabrique un produit de la même position HS4 : " + ", ".join(label[p] for p in same) + " (+25)")
                if pts and exp:
                    pts += 10; why.append("exporte déjà (+10)")
            if pts:
                prox[n] = {"score": min(pts, 100), "reasons": why}
        out.append({
            "id": r.id, "name": r.name, "statut": r.statut, "products": prod,
            "imported_inputs": imp, "exports": exp, "projets": proj,
            "financial_capacity": {"raw": None, "quality": "missing", "source": None},
            "proximity": prox,
            "sources": [sources[s] for s in split(r.sources) if s in sources],
            "note": None if pd.isna(r.note) else r.note,
        })
    return out


def build_all(cfg: dict, trade: dict, ctry: pd.DataFrame, gl: pd.DataFrame,
              tarifs: dict, taux_officiel: dict | None, rca_fn) -> dict:
    """Construit toutes les sorties à partir de tables déjà chargées."""
    nodes = pd.read_csv(MANUAL / "nodes.csv", dtype={"hs6": str})
    edges = pd.read_csv(MANUAL / "edges.csv", dtype=str)
    caps = pd.read_csv(MANUAL / "capacities.csv", dtype=str)
    manual = pd.read_csv(MANUAL / "status_manual.csv", dtype=str).set_index("hs6")
    src = pd.read_csv(MANUAL / "sources.csv", dtype=str)
    edge_src = pd.read_csv(MANUAL / "edge_sources.csv", dtype=str).set_index("code")
    firms = pd.read_csv(MANUAL / "firms.csv", dtype=str)
    demo = pd.read_csv(MANUAL / "demo_values.csv", dtype={"hs6": str}, comment="#").set_index("hs6")
    sources = {r.id: {"id": r.id, "titre": r.titre, "url": r.url, "date": r.date, "nature": r.nature}
               for r in src.itertuples()}
    sources["BACI"] = {"id": "BACI", "titre": "BACI (CEPII), HS 2012, V202601",
                       "url": "https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37",
                       "date": "2026-01", "nature": "base de données"}
    errs = check_graph(nodes, edges)
    if errs:
        raise ValueError("graphe invalide :\n" + "\n".join(errs))

    years = cfg["annees_baci"]; ny = len(years); period = f"{years[0]}-{years[-1]}"
    me, ref = cfg["pays"]["baci"], cfg["pays_reference"]["baci"]
    iso = ctry.set_index("country_code")["country_iso3"].to_dict()
    name = ctry.set_index("country_code")["country_name"].to_dict()
    ex, im, bi = trade["exports"], trade["imports"], trade["bilateral"]
    exp_c = ex.groupby(["country", "k"])["exports"].sum() / ny
    imp_c = im.groupby(["country", "k"])["imports"].sum() / ny
    r_all = rca_fn(ex).groupby(["country", "k"])["rca"].sum() / ny
    r_h27 = rca_fn(ex, "27").groupby(["country", "k"])["rca"].sum() / ny
    get = lambda s, c, k: float(s.get((c, k), 0.0))
    imp_bi = bi[bi["j"] == me].groupby(["k", "i"])["v"].sum() / ny
    ue = {c for c, i in iso.items() if i in UE}
    afr = {c for c, i in iso.items() if i in AFRIQUE}
    gl = gl.set_index("hs4")
    BACI, GL = "BACI (CEPII) HS 2012", "Growth Lab, Atlas (HS 12), niveau HS4"

    out_nodes = []
    for n in nodes.itertuples():
        k = n.hs6
        imports, exports = get(imp_c, me, k), get(exp_c, me, k)
        rca = get(r_all, me, k)
        man = manual.loc[k] if k in manual.index else None
        status, verif, regle = status_rule(rca, exports, imports,
                                           None if man is None else man["production_locale"],
                                           int(n.stage), cfg["seuils"])
        by = imp_bi[k].sort_values(ascending=False) if k in imp_bi.index.get_level_values(0) else pd.Series(dtype=float)
        tot = float(by.sum())
        # échelle : médiane des exportations des pays exportateurs avec avantage comparatif
        xk = exp_c.xs(k, level="k") if k in exp_c.index.get_level_values("k") else pd.Series(dtype=float)
        rk = r_all.xs(k, level="k") if k in r_all.index.get_level_values("k") else pd.Series(dtype=float)
        big = xk[(xk >= 10e6) & (rk.reindex(xk.index).fillna(0) >= 1)]
        eme = imports / float(big.median()) if len(big) and imports > 0 else None
        afr_imp = float(sum(get(imp_c, c, k) for c in afr if c != me))
        g = gl.loc[k[:4]] if k[:4] in gl.index else None
        t = tarifs.get(k)
        d = demo.loc[k] if k in demo.index else None
        out_nodes.append({
            "hs6": k, "label": n.label, "stage": int(n.stage), "stage_label": n.stage_label,
            "frontier": str(n.frontier).lower() == "true",
            "note": None if pd.isna(n.note) else n.note,
            "status": status, "a_verifier": bool(verif),
            "status_evidence": {
                "regle": regle, "rca": round(rca, 3),
                "rca_hors_27": None if k.startswith("27") else round(get(r_h27, me, k), 3),
                "rca_reference": round(get(r_all, ref, k), 3),
                "exports_usd": round(exports),
                "production_locale": None if man is None else man["production_locale"],
                "sources": [] if man is None else [sources[s] for s in man["sources"].split(";") if s in sources],
                "note": None if man is None else man["note"],
            },
            "imports_usd": val(round(imports), BACI, period, "real"),
            "fournisseurs": [{"pays": name.get(c, str(c)), "part": round(v / tot, 3)} for c, v in by.head(5).items()] if tot else [],
            "tarif": val(None if t is None else t["taux_pct"], "WITS-TRAINS, droit moyen simple appliqué",
                         None if t is None else t["annee"], "real"),
            "juridique": {
                "part_ue": val(None if not tot else round(float(by[by.index.isin(ue)].sum()) / tot, 3), BACI, period, "real"),
                "part_afrique": val(None if not tot else round(float(by[by.index.isin(afr)].sum()) / tot, 3), BACI, period, "real"),
            },
            "criteria": {
                "f_proximite": val(None if g is None else 1 - g["distance"], GL, cfg["annee_growthlab"], "real", niveau="HS4"),
                "v_pci": val(None if g is None else g["pci"], GL, cfg["annee_growthlab"], "real", niveau="HS4"),
                "v_opportunity_gain": val(None if g is None else g["cog"], GL, cfg["annee_growthlab"], "real", niveau="HS4"),
                "f_marche_eme": val(eme, BACI + " ; échelle = médiane des exportateurs avec RCA ≥ 1", period, "estimated"),
                "f_ressources": val(n.ressource, "Jugement documenté : " + str(n.ressource_note), 2026, "estimated"),
                "v_export_zlecaf": val(round(afr_imp), BACI + " ; importations des pays africains hors Algérie", period, "real"),
                "c_investissement": val(None, None, None, "missing"),
                "v_emplois": val(None, None, None, "missing"),
            },
            "drc_inputs": {"dzd_par_usd_va": None, "quality": "missing", "source": None},
            "demo": None if d is None else {
                "drc_dzd_par_usd_va": float(d["drc_dzd_par_usd_va"]),
                "c_investissement": float(d["c_investissement"]), "v_emplois": float(d["v_emplois"])},
        })

    out_edges = [{"from": e["from"], "to": e["to"], "kind": e["kind"],
                  "source": edge_src.loc[e["source"], "reference"], "source_verifiee_en_ligne": False,
                  "note": e["note"]} for _, e in edges.iterrows()]
    out_caps = [{"id": c.id, "type": c.type, "label": c.label, "state": c.state,
                 "required_by": c.required_by.split(";"),
                 "sources": [sources[s] for s in str(c.sources).split(";") if s in sources],
                 "note": c.note} for c in caps.itertuples()]
    criteria = build_criteria(ROOT / "criteria")
    out_firms = build_firms(firms, nodes, edges, sources)

    presets = yaml.safe_load((ROOT / "config" / "presets.yaml").read_text(encoding="utf-8"))
    counts: dict[str, int] = {}
    for n in out_nodes:
        for v in list(n["criteria"].values()) + [n["imports_usd"], n["tarif"], n["drc_inputs"]]:
            counts[v["quality"]] = counts.get(v["quality"], 0) + 1
    meta = {
        "genere_le": dt.date.today().isoformat(),
        "pays": cfg["pays"]["nom"], "filiere": cfg["filiere_pilote"]["nom"],
        "pays_reference": cfg["pays_reference"]["nom"], "nomenclature": cfg["nomenclature"],
        "periode_baci": period,
        "taux_change": {"officiel": taux_officiel or {"valeur": None, "annee": None, "source": None},
                        "parallele": cfg["taux_change"]["parallele"]},
        "parametres": cfg["parametres"], "seuils": cfg["seuils"], "demo": cfg["demo"],
        "donnee_manquante": cfg["donnee_manquante"],
        "presets": presets,
        "decompte_qualite": counts,
        "decompte_statuts": pd.Series([n["status"] for n in out_nodes]).value_counts().to_dict(),
        "importations_filiere_usd": round(sum(n["imports_usd"]["raw"] for n in out_nodes)),
        "importations_pays_usd": round(float(imp_c.xs(me, level="country").sum())),
        "avertissements": [
            "Réseau produit-produit publié non trouvé : le graphe est entièrement saisi à la main.",
            "Distance, PCI et gain d'opportunité sont publiés au niveau HS4.",
            "DRC, investissement et emplois : aucune source publique ; valeurs de démonstration désactivées par défaut.",
            "Taux de change parallèle : à saisir par l'utilisateur.",
        ],
    }
    return {"nodes": out_nodes, "edges": out_edges, "capacities": out_caps,
            "criteria": criteria, "firms": out_firms, "meta": meta}
