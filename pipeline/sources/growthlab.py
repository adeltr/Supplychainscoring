"""Growth Lab (Harvard), Atlas of Economic Complexity, HS 2012.

Jeu de données : https://doi.org/10.7910/DVN/YAVJDF
La distance, le gain d'opportunité (COG) et la complexité (PCI) sont publiés
au niveau HS4 seulement : chaque HS6 hérite de la valeur de sa position.
"""
from __future__ import annotations

from pathlib import Path

import pandas as pd

DOI = "doi:10.7910/DVN/YAVJDF"
RAW = Path(__file__).resolve().parents[2] / "data" / "raw" / "growthlab"
FILE = RAW / "hs12_country_product_year_4.csv"
URL = "https://dataverse.harvard.edu/api/access/datafile/13685176?format=original"


def load(iso3: str, year: int) -> pd.DataFrame:
    """Rend hs4, distance, cog, pci, export_rca pour un pays et une année."""
    if not FILE.exists():
        raise FileNotFoundError(f"Growth Lab absent : {FILE}\nTéléchargez {URL}")
    cache = RAW / f"cache_{iso3}_{year}.parquet"
    if cache.exists():
        return pd.read_parquet(cache)
    chunks = []
    for ch in pd.read_csv(FILE, dtype={"product_hs12_code": str}, chunksize=500_000):
        chunks.append(ch[(ch["country_iso3_code"] == iso3) & (ch["year"] == year)])
    df = pd.concat(chunks, ignore_index=True)
    df = df.rename(columns={"product_hs12_code": "hs4"})[
        ["hs4", "distance", "cog", "pci", "export_rca"]]
    df["hs4"] = df["hs4"].str.zfill(4)
    df.to_parquet(cache, index=False)
    return df


def describe() -> dict:
    return {"nom": "Growth Lab, Atlas of Economic Complexity (HS 12)", "doi": DOI,
            "url": "https://doi.org/10.7910/DVN/YAVJDF", "niveau": "HS4",
            "present": FILE.exists()}
