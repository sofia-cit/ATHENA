"""API del proyecto ATHENA (Hackathon NFL Big Data Bowl, UNAM).

Arranque en desarrollo:
    Windows:  .venv\\Scripts\\uvicorn backend.main:app --reload
    macOS/Linux: .venv/bin/uvicorn backend.main:app --reload

Contrato del hackathon:
- expone `app` (FastAPI) con GET /health -> {"status":"ok"}
- toda la API va bajo /api/...
- el dashboard la llama con rutas relativas sin diagonal inicial: fetch('api/...')

Los KPIs se calculan al arranque desde data/resumen_jugadas.csv (columnas:
gameId, week, possessionTeam, defensiveTeam, playResult). Si el archivo no
existe o esta vacio, los endpoints responden vacios/ceros y la app sigue
funcionando (muestra "sin datos").
"""
from pathlib import Path

import pandas as pd
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI(title="ATHENA - NFL Big Data Bowl")

DATA_DIR = Path(__file__).resolve().parent.parent / "data"
RESUMEN = DATA_DIR / "resumen_jugadas.csv"

# semanas validas del dataset de la competencia
SEMANAS_VALIDAS = (1, 8)


class Kpis(BaseModel):
    abbr: str
    partidos: int               # partidos jugados en semanas 1-8
    jugadasOfensivas: int       # jugadas donde el equipo tiene la posesion
    jugadasDefensivas: int      # jugadas donde el equipo esta a la defensiva
    avgYardsPorJugada: float    # promedio de playResult en sus jugadas ofensivas
    tieneDatos: bool            # False cuando el equipo no aparece en el CSV


def _cargar_resumen() -> pd.DataFrame:
    """Lee el CSV de jugadas y deja solo semanas 1-8. Cache en modulo."""
    vacio = pd.DataFrame(
        {"gameId": pd.Series(dtype="int64"), "week": pd.Series(dtype="int64"),
         "possessionTeam": pd.Series(dtype="object"),
         "defensiveTeam": pd.Series(dtype="object"),
         "playResult": pd.Series(dtype="float64")}
    )
    if not RESUMEN.exists():
        return vacio
    try:
        df = pd.read_csv(RESUMEN)
    except pd.errors.EmptyDataError:
        return vacio
    if df.empty:
        return vacio
    df["week"] = pd.to_numeric(df["week"], errors="coerce")
    df = df[df["week"].between(*SEMANAS_VALIDAS)]
    df["playResult"] = pd.to_numeric(df["playResult"], errors="coerce").fillna(0)
    return df


_DF = _cargar_resumen()


def _kpis_equipo(abbr: str) -> Kpis:
    abbr = abbr.upper()
    df = _DF
    if df.empty:
        return Kpis(abbr=abbr, partidos=0, jugadasOfensivas=0, jugadasDefensivas=0,
                    avgYardsPorJugada=0.0, tieneDatos=False)
    off = df["possessionTeam"] == abbr
    deff = df["defensiveTeam"] == abbr
    jugadas_of = int(off.sum())
    jugadas_def = int(deff.sum())
    partidos = int(df.loc[off | deff, "gameId"].nunique())
    avg = float(df.loc[off, "playResult"].mean()) if jugadas_of > 0 else 0.0
    tiene = jugadas_of > 0 or jugadas_def > 0 or partidos > 0
    return Kpis(abbr=abbr, partidos=partidos, jugadasOfensivas=jugadas_of,
                jugadasDefensivas=jugadas_def, avgYardsPorJugada=round(avg, 2),
                tieneDatos=tiene)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/api/kpis")
def kpis_todos() -> dict:
    """KPIs de todos los equipos que aparecen en el resumen, indexados por abreviatura."""
    df = _DF
    if df.empty:
        return {}
    equipos = set(df["possessionTeam"].unique()) | set(df["defensiveTeam"].unique())
    return {e: _kpis_equipo(e).model_dump() for e in sorted(equipos)}


@app.get("/api/kpis/{abbr}")
def kpis_equipo(abbr: str) -> dict:
    """KPIs de un equipo. Si no esta en el CSV, devuelve ceros con tieneDatos=False."""
    return _kpis_equipo(abbr).model_dump()
