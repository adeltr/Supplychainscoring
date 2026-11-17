"""BACI (CEPII), HS 2012, 6 chiffres.

Source : https://www.cepii.fr/CEPII/en/bdd_modele/bdd_modele_item.asp?id=37
Licence : Etalab 2.0. Colonnes : t (année), i (exportateur), j (importateur),
k (produit HS6), v (valeur, milliers USD), q (tonnes).

BACI réconcilie les déclarations de l'exportateur et de l'importateur. Pour
l'Algérie, les flux reposent donc largement sur les déclarations des
partenaires (données miroir).

Le fichier brut est volumineux : ce module produit trois tables agrégées,
mises en cache dans data/raw/baci/cache/.
"""
from __future__ import annotations

import hashlib
import zipfile
from pathlib import Path

import pandas as pd

URL = "https://www.cepii.fr/DATA_DOWNLOAD/baci/data/BACI_HS12_V202601.zip"
VERSION = "V202601"
RAW = Path(__file__).resolve().parents[2] / "data" / "raw" / "baci"
ZIP = RAW / f"BACI_HS12_{VERSION}.zip"
CACHE = RAW / "cache"
DZA = 12


def _require_zip() -> None:
    if not ZIP.exists():
        raise FileNotFoundError(
            f"BACI absent : {ZIP}\nTéléchargez {URL} et déposez-le à cet endroit."
        )


def _read_year(zf: zipfile.ZipFile, year: int) -> pd.DataFrame:
    name = f"BACI_HS12_Y{year}_{VERSION}.csv"
    with zf.open(name) as fh:
        df = pd.read_csv(fh, dtype={"k": str}, usecols=["t", "i", "j", "k", "v"])
    df["k"] = df["k"].str.zfill(6)
    df["v"] = df["v"] * 1000.0  # milliers USD -> USD
    return df


def aggregate(flows: pd.DataFrame, focus: int = DZA) -> dict[str, pd.DataFrame]:
    """Agrège des flux bilatéraux (t, i, j, k, v en USD).

    Rend :
      exports  : t, country, k, exports   (tous pays)
      imports  : t, country, k, imports   (tous pays)
      bilateral: flux où `focus` est exportateur ou importateur
    """
    exports = (flows.groupby(["t", "i", "k"], as_index=False)["v"].sum()
               .rename(columns={"i": "country", "v": "exports"}))
    imports = (flows.groupby(["t", "j", "k"], as_index=False)["v"].sum()
               .rename(columns={"j": "country", "v": "imports"}))
    bilateral = flows[(flows["i"] == focus) | (flows["j"] == focus)].copy()
    return {"exports": exports, "imports": imports, "bilateral": bilateral}


def rca(exports: pd.DataFrame, exclude_prefix: str | None = None) -> pd.DataFrame:
    """RCA de Balassa par (t, country, k).

    RCA = (x_ck / x_c) / (x_k / x_monde). Si `exclude_prefix` est donné
    (ex. "27"), ces produits sont retirés des totaux pays et monde : c'est le
    RCA « hors hydrocarbures ».
    """
    e = exports
    if exclude_prefix:
        e = e[~e["k"].str.startswith(exclude_prefix)]
    xc = e.groupby(["t", "country"])["exports"].sum().rename("xc")
    xk = e.groupby(["t", "k"])["exports"].sum().rename("xk")
    xw = e.groupby("t")["exports"].sum().rename("xw")
    out = e.join(xc, on=["t", "country"]).join(xk, on=["t", "k"]).join(xw, on="t")
    out["rca"] = (out["exports"] / out["xc"]) / (out["xk"] / out["xw"])
    return out[["t", "country", "k", "rca"]]


def load(years: list[int], focus: int = DZA) -> dict[str, pd.DataFrame]:
    """Charge les tables agrégées pour `years` (cache parquet)."""
    CACHE.mkdir(parents=True, exist_ok=True)
    tag = f"{min(years)}_{max(years)}_{focus}"
    paths = {n: CACHE / f"{n}_{tag}.parquet" for n in ("exports", "imports", "bilateral")}
    if all(p.exists() for p in paths.values()):
        return {n: pd.read_parquet(p) for n, p in paths.items()}
    _require_zip()
    parts: dict[str, list[pd.DataFrame]] = {n: [] for n in paths}
    with zipfile.ZipFile(ZIP) as zf:
        for y in years:
            agg = aggregate(_read_year(zf, y), focus)
            for n in parts:
                parts[n].append(agg[n])
    out = {n: pd.concat(v, ignore_index=True) for n, v in parts.items()}
    for n, p in paths.items():
        out[n].to_parquet(p, index=False)
    return out


def labels() -> tuple[pd.DataFrame, pd.DataFrame]:
    """Libellés produits (anglais) et codes pays."""
    _require_zip()
    with zipfile.ZipFile(ZIP) as zf:
        with zf.open(f"product_codes_HS12_{VERSION}.csv") as fh:
            prod = pd.read_csv(fh, dtype=str)
        with zf.open(f"country_codes_{VERSION}.csv") as fh:
            ctry = pd.read_csv(fh)
    return prod, ctry


def describe() -> dict:
    d = {"nom": "BACI (CEPII)", "url": URL, "version": VERSION,
         "licence": "Etalab 2.0", "nomenclature": "HS 2012", "present": ZIP.exists()}
    if ZIP.exists():
        d["taille_octets"] = ZIP.stat().st_size
        h = hashlib.sha256()
        with open(ZIP, "rb") as fh:
            h.update(fh.read(1 << 24))  # empreinte des 16 premiers Mo
        d["empreinte_debut_sha256"] = h.hexdigest()
    return d
