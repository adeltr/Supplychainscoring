"""Banque mondiale : taux de change officiel (PA.NUS.FCRF), moyenne annuelle."""
from __future__ import annotations

import json
import urllib.request
from pathlib import Path

RAW = Path(__file__).resolve().parents[2] / "data" / "raw" / "worldbank"
URL = "https://api.worldbank.org/v2/country/{iso3}/indicator/PA.NUS.FCRF?format=json&per_page=80"


def official_rate(iso3: str = "DZA") -> dict | None:
    """Dernière valeur publiée : {valeur, annee, source}. None si indisponible."""
    RAW.mkdir(parents=True, exist_ok=True)
    cache = RAW / f"fcrf_{iso3}.json"
    if not cache.exists():
        try:
            with urllib.request.urlopen(URL.format(iso3=iso3), timeout=40) as r:
                cache.write_bytes(r.read())
        except Exception:
            return None
    rows = json.loads(cache.read_text())[1] or []
    rows = [r for r in rows if r["value"] is not None]
    if not rows:
        return None
    last = max(rows, key=lambda r: int(r["date"]))
    return {"valeur": round(last["value"], 2), "annee": int(last["date"]),
            "source": "Banque mondiale, PA.NUS.FCRF (moyenne annuelle, DZD par USD)"}
