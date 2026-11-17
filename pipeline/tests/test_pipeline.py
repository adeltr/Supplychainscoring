"""Tests du pipeline sur des mini-jeux de données écrits à la main."""
import json
import shutil
from pathlib import Path

import jsonschema
import pandas as pd
import pytest

from pipeline.build import assemble
from pipeline.sources import baci

ROOT = Path(__file__).resolve().parents[2]
SEUILS = {"rca_couvert": 1.0, "exportations_partiel_usd": 1e6, "importations_significatives_usd": 1e6}


def flows():
    # 2 pays exportateurs (1, 2), 1 importateur (3), 2 produits
    return pd.DataFrame({
        "t": [2022] * 4, "i": [1, 1, 2, 2], "j": [3, 3, 3, 3],
        "k": ["000001", "000002", "000001", "000002"], "v": [90.0, 10.0, 10.0, 90.0]})


def test_aggregate_miroir():
    a = baci.aggregate(flows(), focus=3)
    assert a["imports"]["imports"].sum() == 200
    assert len(a["bilateral"]) == 4  # le pays 3 n'apparaît que comme importateur
    e = a["exports"].set_index(["country", "k"])["exports"]
    assert e[(1, "000001")] == 90


def test_rca_calcul_a_la_main():
    # pays 1 : part du produit 1 = 90/100 ; monde : 100/200 -> RCA = 0.9 / 0.5 = 1.8
    r = baci.rca(baci.aggregate(flows())["exports"]).set_index(["country", "k"])["rca"]
    assert r[(1, "000001")] == pytest.approx(1.8)
    assert r[(1, "000002")] == pytest.approx(0.2)


def test_rca_hors_prefixe():
    f = flows(); f.loc[len(f)] = [2022, 1, 3, "270000", 900.0]
    ex = baci.aggregate(f)["exports"]
    avec = baci.rca(ex).set_index(["country", "k"])["rca"][(1, "000001")]
    sans = baci.rca(ex, "27").set_index(["country", "k"])["rca"][(1, "000001")]
    assert avec < 1 < sans  # les hydrocarbures écrasent le RCA standard


@pytest.mark.parametrize("rca,exp,imp,manual,stage,attendu", [
    (1.2, 5e6, 0, None, 2, ("couvert", False)),
    (0.2, 0, 5e6, "oui", 5, ("partiel", False)),
    (0.2, 0, 5e6, "incertain", 4, ("manquant", True)),
    (0.2, 2e6, 5e6, None, 4, ("partiel", True)),      # prouvé par les seules exportations
    (0.0, 0, 5e6, None, 4, ("manquant", False)),
    (0.0, 0, 5e6, None, 6, ("manquant", True)),       # transformation : production plausible
    (0.0, 0, 1e3, None, 3, ("absent", False)),
    (0.0, 0, 1e3, "non", 3, ("absent", False)),
])
def test_regle_de_statut(rca, exp, imp, manual, stage, attendu):
    s, v, _ = assemble.status_rule(rca, exp, imp, manual, stage, SEUILS)
    assert (s, v) == attendu


def chaine3():
    n = pd.DataFrame({"hs6": ["000001", "000002", "000003"], "stage": [1, 2, 3]})
    e = pd.DataFrame({"from": ["000001", "000002"], "to": ["000002", "000003"], "kind": ["critique"] * 2})
    return n, e


def test_graphe_valide():
    assert assemble.check_graph(*chaine3()) == []


def test_graphe_cycle_et_etape():
    n, e = chaine3()
    e.loc[len(e)] = ["000003", "000001", "critique"]
    errs = assemble.check_graph(n, e)
    assert any("cycle" in x for x in errs) and any("étape" in x for x in errs)


def test_graphe_extremite_inconnue_et_type():
    n, e = chaine3()
    e.loc[len(e)] = ["000009", "000003", "bizarre"]
    errs = assemble.check_graph(n, e)
    assert any("inconnue" in x for x in errs) and any("type" in x for x in errs)


def test_ajout_d_un_critere_sans_toucher_au_code(tmp_path):
    shutil.copytree(ROOT / "criteria", tmp_path / "criteria")
    avant = len(assemble.build_criteria(tmp_path / "criteria"))
    (tmp_path / "criteria" / "x_test.yaml").write_text(
        "id: x_test\nfamille: valeur\nlibelle: Test\ndefinition: d\nformule: f\n"
        "source: {nom: s}\ntype: donnee\nnormalisation: {methode: minmax}\n"
        "sens: plus_haut_plus_favorable\npoids_defaut: 3\nlimites: l\n", encoding="utf-8")
    apres = assemble.build_criteria(tmp_path / "criteria")
    assert len(apres) == avant + 1 and "x_test" in [c["id"] for c in apres]


def test_fiche_incomplete_refusee(tmp_path):
    (tmp_path / "bad.yaml").write_text("id: bad\nfamille: valeur\n", encoding="utf-8")
    with pytest.raises(ValueError):
        assemble.build_criteria(tmp_path)


def test_valeur_manquante_jamais_comblee():
    assert assemble.val(None, "s", 2024, "real") == {"raw": None, "source": "s", "year": 2024, "quality": "missing"}
    assert assemble.val(float("nan"), "s", 2024, "real")["quality"] == "missing"


def test_proximite_entreprises_jouet():
    nodes = pd.DataFrame({"hs6": ["000001", "000002", "000003"], "label": ["A", "B", "C"]})
    edges = pd.DataFrame({"from": ["000001", "000002"], "to": ["000002", "000003"]})
    firms = pd.DataFrame([
        {"id": "f1", "name": "Fabricant de B", "statut": "privé", "products": "000002",
         "imported_inputs": "000001", "exports": "", "projets": "", "sources": "S", "note": ""},
        {"id": "f2", "name": "Sans lien", "statut": "privé", "products": "", "imported_inputs": "",
         "exports": "", "projets": "", "sources": "S", "note": ""}])
    out = assemble.build_firms(firms, nodes, edges, {"S": {"id": "S"}})
    p = out[0]["proximity"]
    assert p["000002"]["score"] == 100
    assert p["000001"]["score"] == 30 + 25      # l'importe comme intrant + même position HS4
    assert p["000003"]["score"] == 30 + 25      # fabrique un intrant + même position HS4
    assert all(v["reasons"] for v in p.values())
    assert out[1]["proximity"] == {}


OUT = ROOT / "data" / "out"


@pytest.mark.skipif(not (OUT / "nodes.json").exists(), reason="lancer python -m pipeline.run")
def test_sorties_valides_et_tracees():
    for name in ["nodes", "edges", "capacities", "criteria", "firms", "meta"]:
        data = json.loads((OUT / f"{name}.json").read_text(encoding="utf-8"))
        schema = json.loads((ROOT / "pipeline" / "schemas" / f"{name}.schema.json").read_text(encoding="utf-8"))
        jsonschema.validate(data, schema)
    for n in json.loads((OUT / "nodes.json").read_text(encoding="utf-8")):
        for v in n["criteria"].values():
            assert (v["raw"] is None) == (v["quality"] == "missing")
            assert v["quality"] != "demo"  # aucune valeur de démonstration dans les données


def test_exemples_v2_vides_et_valides():
    for f in sorted((ROOT / "pipeline" / "schemas").glob("v2_*.schema.json")):
        ex = ROOT / "data" / "v2_exemples" / f.name.replace(".schema", "")
        jsonschema.validate(json.loads(ex.read_text()), json.loads(f.read_text(encoding="utf-8")))
        assert json.loads(ex.read_text()) == []
