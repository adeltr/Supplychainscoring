"""WITS-TRAINS (Banque mondiale) : droit de douane appliqué par l'Algérie, par HS6.

API : https://wits.worldbank.org/API/V1/SDMX/V21/ . Une requête par produit,
résultat mis en cache dans data/raw/wits/tarifs.json.
"""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

RAW = Path(__file__).resolve().parents[2] / "data" / "raw" / "wits"
CACHE = RAW / "tarifs.json"
BASE = ("https://wits.worldbank.org/API/V1/SDMX/V21/datasource/TRN/reporter/{rep}"
        "/partner/000/product/{hs6}/year/ALL/datatype/reported?format=JSON")


def _fetch(hs6: str, reporter: str) -> dict | None:
    try:
        req = urllib.request.Request(BASE.format(rep=reporter, hs6=hs6),
                                     headers={"User-Agent": "trade-data-pipeline/0.1"})
        with urllib.request.urlopen(req, timeout=40) as r:
            d = json.load(r)
    except Exception as exc:  # réseau ou produit absent : valeur manquante, jamais de défaut
        return {"erreur": str(exc)[:120]}
    try:
        years = [v["id"] for v in d["structure"]["dimensions"]["observation"][0]["values"]]
        obs = next(iter(d["dataSets"][0]["series"].values()))["observations"]
        last = max(obs, key=lambda k: int(years[int(k)]))
        return {"taux_pct": obs[last][0], "annee": int(years[int(last)])}
    except Exception:
        return None


def load(codes: list[str], reporter: str = "012") -> dict[str, dict | None]:
    """Droit moyen simple (%) de la dernière année disponible, par HS6."""
    RAW.mkdir(parents=True, exist_ok=True)
    cache = json.loads(CACHE.read_text()) if CACHE.exists() else {}
    for c in codes:
        if c not in cache or (cache[c] or {}).get("erreur"):
            cache[c] = _fetch(c, reporter)
    CACHE.write_text(json.dumps(cache, indent=1))
    return {c: (cache[c] if cache[c] and "taux_pct" in cache[c] else None) for c in codes}


def describe() -> dict:
    return {"nom": "WITS-TRAINS, droits appliqués", "url": "https://wits.worldbank.org",
            "present": CACHE.exists()}
