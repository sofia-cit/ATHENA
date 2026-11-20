# -*- coding: utf-8 -*-
"""
backend/summarize.py
"""

from __future__ import annotations
import pandas as pd
from pathlib import Path

ROOT  = Path(__file__).resolve().parent.parent
CLEAN = ROOT / "data" / "clean"

OFFENSE_ROLES = {
    "Pass", "Pass Route", "Pass Block", "Run", "Run Route",
    "Run Block", "Pass Block Backfield", "Run Block Lead",
}

def _side(role: str) -> str:
    if pd.isna(role):
        return "Unknown"
    return "Offense" if str(role).strip() in OFFENSE_ROLES else "Defense"


def build_resumen_jugador_rol() -> pd.DataFrame:
    pff     = pd.read_csv(CLEAN / "pff.csv.gz")
    players = pd.read_csv(CLEAN / "players.csv.gz",
                          usecols=["nflId", "displayName", "officialPosition"])
    plays   = pd.read_csv(CLEAN / "plays.csv.gz",
                          usecols=["gameId", "playId",
                                   "possessionTeam", "defensiveTeam"])

    # Anexar equipo de posesion y defensa al registro pff
    df = pff.merge(plays, on=["gameId", "playId"], how="left")
    df = df.merge(players, on="nflId", how="left")

    # Determinar de que equipo es el jugador segun su rol
    df["side"] = df["pff_role"].apply(_side)
    df["team"] = df.apply(
        lambda r: r["possessionTeam"] if r["side"] == "Offense" else r["defensiveTeam"],
        axis=1,
    )

    # Buscar jerseyNumber desde tracking (muestra 1 frame por jugador/jugada)
    tracking = pd.read_csv(
        CLEAN / "tracking.csv.gz",
        usecols=["gameId", "playId", "nflId", "jerseyNumber"],
    )
    jersey = (
        tracking.dropna(subset=["nflId"])
        .groupby("nflId", as_index=False)["jerseyNumber"]
        .first()
    )
    df = df.merge(jersey, on="nflId", how="left")

    # Flag cols: rellenar NaN con 0
    flag_cols = [
        "pff_hit", "pff_hurry", "pff_sack",
        "pff_beatenByDefender",
        "pff_hitAllowed", "pff_hurryAllowed", "pff_sackAllowed",
    ]
    for c in flag_cols:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors="coerce").fillna(0)

    grp = df.groupby(
        ["team", "nflId", "displayName", "officialPosition",
         "pff_positionLinedUp", "side"],
        as_index=False, observed=True,
    )

    agg = grp.agg(
        snaps          = ("playId",           "count"),
        sacks          = ("pff_sack",          "sum"),
        hurries        = ("pff_hurry",         "sum"),
        hits           = ("pff_hit",           "sum"),
        sack_allowed   = ("pff_sackAllowed",   "sum"),
        hurry_allowed  = ("pff_hurryAllowed",  "sum"),
        hit_allowed    = ("pff_hitAllowed",    "sum"),
        beaten_count   = ("pff_beatenByDefender", "sum"),
    )

    # Adjuntar jerseyNumber representativo
    jersey_rep = (
        df.dropna(subset=["jerseyNumber"])
        .groupby("nflId", as_index=False)["jerseyNumber"]
        .first()
    )
    agg = agg.merge(jersey_rep, on="nflId", how="left")

    # Redondear a entero
    int_cols = ["snaps","sacks","hurries","hits",
                "sack_allowed","hurry_allowed","hit_allowed","beaten_count"]
    for c in int_cols:
        agg[c] = agg[c].astype(int)

    return agg


def build_resumen_jugadas() -> pd.DataFrame:
    plays = pd.read_csv(CLEAN / "plays.csv.gz",
                        usecols=[
                            "gameId", "playId",
                            "possessionTeam", "defensiveTeam",
                            "offenseFormation", "personnelO",
                            "personnelD", "dropBackType",
                            "pff_passCoverage", "passResult",
                            "playResult", "down",
                            "absoluteYardlineNumber",
                            "pff_passCoverageType",
                            "playDescription",
                        ])

    # ------------------------------------------------------------------ Offense
    off_grp = plays.groupby(
        ["possessionTeam", "offenseFormation", "personnelO", "dropBackType"],
        as_index=False, observed=True,
    )

    def _complete_rate(s: pd.Series) -> float:
        s = s.astype(str).str.upper()
        total = len(s)
        return round((s == "C").sum() / total * 100, 1) if total else 0.0

    off = off_grp.agg(
        frecuencia    = ("playId",      "count"),
        yardas_prom   = ("playResult",  "mean"),
        pass_complete = ("passResult",  _complete_rate),
    )
    # Ejemplo de descripcion real
    example_off = (
        plays.dropna(subset=["playDescription"])
        .groupby(
            ["possessionTeam", "offenseFormation", "personnelO", "dropBackType"],
            as_index=False, observed=True,
        )["playDescription"].first()
    )
    off = off.merge(example_off, on=["possessionTeam","offenseFormation","personnelO","dropBackType"], how="left")
    off.rename(columns={"possessionTeam": "team"}, inplace=True)
    off["side"]  = "Offense"
    off["esquema"] = (
        off["offenseFormation"].fillna("?") + " | " +
        off["personnelO"].fillna("?") + " | " +
        off["dropBackType"].fillna("?")
    )

    # ------------------------------------------------------------------ Defense
    def_grp = plays.groupby(
        ["defensiveTeam", "pff_passCoverage", "personnelD"],
        as_index=False, observed=True,
    )
    def_ = def_grp.agg(
        frecuencia    = ("playId",      "count"),
        yardas_prom   = ("playResult",  "mean"),
        pass_complete = ("passResult",  _complete_rate),
    )
    example_def = (
        plays.dropna(subset=["playDescription"])
        .groupby(
            ["defensiveTeam", "pff_passCoverage", "personnelD"],
            as_index=False, observed=True,
        )["playDescription"].first()
    )
    def_ = def_.merge(example_def, on=["defensiveTeam","pff_passCoverage","personnelD"], how="left")
    def_.rename(columns={"defensiveTeam": "team"}, inplace=True)
    def_["side"]    = "Defense"
    def_["esquema"] = (
        def_["pff_passCoverage"].fillna("?") + " | " +
        def_["personnelD"].fillna("?")
    )

    # Total jugadas por equipo para calcular %
    total_off = off.groupby("team")["frecuencia"].transform("sum")
    off["frecuencia_pct"] = (off["frecuencia"] / total_off * 100).round(1)
    total_def = def_.groupby("team")["frecuencia"].transform("sum")
    def_["frecuencia_pct"] = (def_["frecuencia"] / total_def * 100).round(1)

    # Columnas comunes para concat
    keep = ["team","side","esquema","frecuencia","frecuencia_pct",
            "yardas_prom","pass_complete","playDescription",
            "offenseFormation","personnelO","dropBackType",
            "pff_passCoverage","personnelD"]
    for df, cols in [(off, keep), (def_, keep)]:
        for c in cols:
            if c not in df.columns:
                df[c] = None

    result = pd.concat([off[keep], def_[keep]], ignore_index=True)
    result["yardas_prom"] = result["yardas_prom"].round(1)
    return result


if __name__ == "__main__":
    print("Generando resumen_jugador_rol.csv ...")
    rjr = build_resumen_jugador_rol()
    rjr.to_csv(CLEAN / "resumen_jugador_rol.csv", index=False)
    print(f"  {len(rjr):,} filas -> data/clean/resumen_jugador_rol.csv")

    print("Generando resumen_jugadas.csv ...")
    rj = build_resumen_jugadas()
    rj.to_csv(CLEAN / "resumen_jugadas.csv", index=False)
    print(f"  {len(rj):,} filas -> data/clean/resumen_jugadas.csv")
    print("Listo.")
