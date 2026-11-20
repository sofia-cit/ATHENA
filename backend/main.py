"""backend/main.py — API ATHENA (NFL Big Data Bowl, UNAM)
Arranque en desarrollo:
    Windows:  .venv\\Scripts\\uvicorn backend.main:app --reload
    macOS/Linux: .venv/bin/uvicorn backend.main:app --reload

Contrato del hackathon:
- expone `app` (FastAPI) con GET /health -> {"status":"ok"}
- toda la API va bajo /api/...
- el dashboard llama con rutas relativas sin diagonal inicial: fetch('api/...')
"""
import os
from pathlib import Path

def cargar_env():
    f = Path(__file__).resolve().parent.parent / ".env"
    if f.exists():
        for linea in f.read_text(encoding="utf-8-sig").splitlines():
            linea = linea.strip()
            if linea and not linea.startswith("#") and "=" in linea:
                k, v = linea.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip().strip('"').strip("'"))

cargar_env()

import pandas as pd
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from pydantic import BaseModel

app = FastAPI(title="ATHENA - NFL Big Data Bowl")

ROOT     = Path(__file__).resolve().parent.parent
DATA_DIR = ROOT / "data"
CLEAN    = ROOT / "data" / "clean"

# ---------------------------------------------------------------------------
# Semanas válidas del dataset
# ---------------------------------------------------------------------------
SEMANAS_VALIDAS = (1, 8)

# ---------------------------------------------------------------------------
# Modelos Pydantic
# ---------------------------------------------------------------------------
class Kpis(BaseModel):
    abbr: str
    partidos: int
    jugadasOfensivas: int
    jugadasDefensivas: int
    avgYardsPorJugada: float
    tieneDatos: bool

# ---------------------------------------------------------------------------
# Carga de datos al arrancar (lazy, una sola vez)
# ---------------------------------------------------------------------------
_cache: dict = {}

def _load() -> None:
    if _cache:
        return

    # --- resumen_jugadas.csv (para KPIs de Pantalla 1) ---
    resumen_path = DATA_DIR / "resumen_jugadas.csv"
    vacio = pd.DataFrame({
        "gameId": pd.Series(dtype="int64"),
        "week": pd.Series(dtype="int64"),
        "possessionTeam": pd.Series(dtype="object"),
        "defensiveTeam": pd.Series(dtype="object"),
        "playResult": pd.Series(dtype="float64"),
    })
    if resumen_path.exists():
        try:
            df = pd.read_csv(resumen_path)
            df["week"] = pd.to_numeric(df["week"], errors="coerce")
            df = df[df["week"].between(*SEMANAS_VALIDAS)]
            df["playResult"] = pd.to_numeric(df["playResult"], errors="coerce").fillna(0)
            _cache["resumen"] = df
        except Exception:
            _cache["resumen"] = vacio
    else:
        _cache["resumen"] = vacio

    # --- resumen_jugador_rol.csv (para Pantalla 2 - jugadores) ---
    jug_path = CLEAN / "resumen_jugador_rol.csv"
    if jug_path.exists():
        _cache["jugadores"] = pd.read_csv(jug_path)
    else:
        _cache["jugadores"] = pd.DataFrame()

    # --- plays.csv.gz (para Pantalla 2 - jugadas) ---
    plays_path = CLEAN / "plays.csv.gz"
    if plays_path.exists():
        _cache["plays"] = pd.read_csv(plays_path, usecols=[
            "gameId", "playId", "week",
            "possessionTeam", "defensiveTeam",
            "down", "absoluteYardlineNumber",
            "offenseFormation", "personnelO", "dropBackType",
            "pff_passCoverage", "personnelD",
            "passResult", "playResult",
            "playDescription",
        ])
    else:
        _cache["plays"] = pd.DataFrame()

    # --- tracking para jerseyNumber ---
    tracking_sample = CLEAN / "tracking.csv.gz"
    if tracking_sample.exists():
        t = pd.read_csv(tracking_sample, usecols=["nflId", "jerseyNumber"])
        _cache["jersey"] = (
            t.dropna(subset=["nflId"])
            .groupby("nflId", as_index=False)["jerseyNumber"]
            .first()
        )
    else:
        _cache["jersey"] = pd.DataFrame(columns=["nflId", "jerseyNumber"])


# ---------------------------------------------------------------------------
# Helper KPIs
# ---------------------------------------------------------------------------
def _kpis_equipo(abbr: str) -> Kpis:
    _load()
    abbr = abbr.upper()
    df = _cache["resumen"]
    if df.empty:
        return Kpis(abbr=abbr, partidos=0, jugadasOfensivas=0, jugadasDefensivas=0,
                    avgYardsPorJugada=0.0, tieneDatos=False)
    off  = df["possessionTeam"] == abbr
    deff = df["defensiveTeam"]  == abbr
    jugadas_of  = int(off.sum())
    jugadas_def = int(deff.sum())
    partidos    = int(df.loc[off | deff, "gameId"].nunique())
    avg = float(df.loc[off, "playResult"].mean()) if jugadas_of > 0 else 0.0
    tiene = jugadas_of > 0 or jugadas_def > 0 or partidos > 0
    return Kpis(abbr=abbr, partidos=partidos, jugadasOfensivas=jugadas_of,
                jugadasDefensivas=jugadas_def, avgYardsPorJugada=round(avg, 2),
                tieneDatos=tiene)


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------

@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# ── Pantalla 1: KPIs ────────────────────────────────────────────────────────

@app.get("/api/kpis")
def kpis_todos() -> dict:
    """KPIs de todos los equipos indexados por abreviatura."""
    _load()
    df = _cache["resumen"]
    if df.empty:
        return {}
    equipos = set(df["possessionTeam"].dropna().unique()) | set(df["defensiveTeam"].dropna().unique())
    return {e: _kpis_equipo(e).model_dump() for e in sorted(equipos)}


@app.get("/api/kpis/{abbr}")
def kpis_equipo(abbr: str) -> dict:
    """KPIs de un equipo. Devuelve ceros con tieneDatos=False si no existe."""
    return _kpis_equipo(abbr).model_dump()


# ── Pantalla 2: Jugadores ───────────────────────────────────────────────────

@app.get("/api/jugadores/{abbr}")
def get_jugadores(abbr: str):
    """
    Jugadores del equipo con sus métricas PFF agregadas.
    Formato: Jugador[] según lib/analista.ts
    {
      teamAbbr, nflId, jerseyNumber, displayName,
      pff_positionLinedUp, pff_role,
      snaps, sack_allowed, hurry_allowed, hit_allowed, beaten_count,
      sacks, hurries, hits
    }
    """
    _load()
    df = _cache["jugadores"]
    if df.empty:
        return JSONResponse([])

    abbr_up = abbr.upper()
    rows = df[df["team"].str.upper() == abbr_up].copy()
    if rows.empty:
        return JSONResponse([])

    # Adjuntar jerseyNumber desde tracking si no viene en el resumen
    if "jerseyNumber" not in rows.columns or rows["jerseyNumber"].isna().all():
        jersey = _cache["jersey"]
        if not jersey.empty:
            rows = rows.merge(jersey, on="nflId", how="left")

    # El front filtra por pff_role == 'Pass Rush' (defensa) o 'Pass Block' (ataque).
    # resumen_jugador_rol.csv tiene la columna 'side' (Offense/Defense).
    # Mapeamos: Defense -> 'Pass Rush', Offense -> 'Pass Block'
    if "pff_role" not in rows.columns:
        rows["pff_role"] = rows["side"].map(
            {"Defense": "Pass Rush", "Offense": "Pass Block"}
        ).fillna("Pass Block")
    else:
        # Si ya existe pff_role pero viene vacío, rellenar desde side
        mask_empty = rows["pff_role"].isna() | (rows["pff_role"] == "")
        rows.loc[mask_empty, "pff_role"] = rows.loc[mask_empty, "side"].map(
            {"Defense": "Pass Rush", "Offense": "Pass Block"}
        ).fillna("Pass Block")

    # Renombrar team -> teamAbbr
    rows = rows.rename(columns={"team": "teamAbbr"})

    # Columnas esperadas con valores por defecto seguros
    for col in ["jerseyNumber", "sack_allowed", "hurry_allowed", "hit_allowed",
                "beaten_count", "sacks", "hurries", "hits", "snaps"]:
        if col not in rows.columns:
            rows[col] = 0
        rows[col] = pd.to_numeric(rows[col], errors="coerce").fillna(0)

    keep = ["teamAbbr", "nflId", "jerseyNumber", "displayName",
            "pff_positionLinedUp", "pff_role",
            "snaps", "sack_allowed", "hurry_allowed", "hit_allowed", "beaten_count",
            "sacks", "hurries", "hits"]
    keep = [c for c in keep if c in rows.columns]

    result = rows[keep].fillna(0)
    # Convertir a tipos nativos Python para JSON
    return JSONResponse(result.astype(object).where(result.notna(), None).to_dict(orient="records"))


# ── Pantalla 2: Jugadas ─────────────────────────────────────────────────────

@app.get("/api/jugadas/{abbr}")
def get_jugadas(abbr: str):
    """
    Jugadas donde el equipo aparece (posesión o defensa).
    El frontend filtra por modo y agrupa el catálogo.
    Formato: Jugada[] según lib/analista.ts
    {
      gameId, week, possessionTeam, defensiveTeam,
      playResult, down, absoluteYardlineNumber,
      offenseFormation, personnelO, dropBackType,
      pff_passCoverage, personnelD,
      passResult, playDescription
    }
    """
    _load()
    df = _cache["plays"]
    if df.empty:
        return JSONResponse([])

    abbr_up = abbr.upper()
    mask = (
        df["possessionTeam"].str.upper().eq(abbr_up) |
        df["defensiveTeam"].str.upper().eq(abbr_up)
    )
    rows = df[mask].copy()
    if rows.empty:
        return JSONResponse([])

    # Normalizar tipos
    rows["down"]                  = pd.to_numeric(rows["down"],                  errors="coerce").fillna(0)
    rows["absoluteYardlineNumber"]= pd.to_numeric(rows["absoluteYardlineNumber"],errors="coerce").fillna(0)
    rows["playResult"]            = pd.to_numeric(rows["playResult"],            errors="coerce").fillna(0)
    rows["week"]                  = pd.to_numeric(rows["week"],                  errors="coerce").fillna(0)
    rows["gameId"]                = pd.to_numeric(rows["gameId"],                errors="coerce").fillna(0)
    rows["playId"]                = pd.to_numeric(rows["playId"],                errors="coerce").fillna(0)

    # passResult: normalizar a mayúsculas para que el front compare con 'C'
    rows["passResult"] = rows["passResult"].fillna("").astype(str).str.upper()

    rows = rows.fillna("")

    keep = ["gameId", "week", "possessionTeam", "defensiveTeam",
            "playResult", "down", "absoluteYardlineNumber",
            "offenseFormation", "personnelO", "dropBackType",
            "pff_passCoverage", "personnelD",
            "passResult", "playDescription"]
    keep = [c for c in keep if c in rows.columns]

    return JSONResponse(rows[keep].to_dict(orient="records"))
