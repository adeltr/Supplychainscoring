"""Enchaîne le pipeline : python -m pipeline.run

Charge les sources, assemble, valide contre les schémas, écrit data/out/.
Échoue si une valeur n'a pas de qualité déclarée.
"""
from __future__ import annotations

import json
from pathlib import Path

import jsonschema
import yaml

from pipeline.build import assemble
from pipeline.sources import baci, growthlab, wits, worldbank

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "data" / "out"
SCHEMAS = ROOT / "pipeline" / "schemas"


def validate(outputs: dict) -> None:
    for name, data in outputs.items():
        schema = json.loads((SCHEMAS / f"{name}.schema.json").read_text(encoding="utf-8"))
        jsonschema.validate(data, schema)


def main() -> None:
    cfg = yaml.safe_load((ROOT / "config" / "projet.yaml").read_text(encoding="utf-8"))
    trade = baci.load(cfg["annees_baci"], cfg["pays"]["baci"])
    _, ctry = baci.labels()
    gl = growthlab.load(cfg["pays"]["iso3"], cfg["annee_growthlab"])
    import pandas as pd
    codes = list(pd.read_csv(ROOT / "data" / "manual" / "nodes.csv", dtype=str)["hs6"])
    outputs = assemble.build_all(cfg, trade, ctry, gl, wits.load(codes),
                                 worldbank.official_rate(cfg["pays"]["iso3"]), baci.rca)
    outputs["meta"]["sources"] = [baci.describe(), growthlab.describe(), wits.describe()]
    validate(outputs)
    OUT.mkdir(parents=True, exist_ok=True)
    for name, data in outputs.items():
        (OUT / f"{name}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
    m = outputs["meta"]
    print(f"{len(outputs['nodes'])} nœuds, {len(outputs['edges'])} arêtes, "
          f"{len(outputs['capacities'])} capacités, {len(outputs['criteria'])} critères, "
          f"{len(outputs['firms'])} entreprises")
    print("statuts :", m["decompte_statuts"])
    print("qualité des valeurs :", m["decompte_qualite"])


if __name__ == "__main__":
    main()
