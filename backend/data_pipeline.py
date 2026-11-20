# -*- coding: utf-8 -*-
"""
backend/data_pipeline.py
------------------------
Pipeline de limpieza, unión y filtrado de los datos del NFL Big Data Bowl.

Reglas de llaves:
  - gameId                       → games  ↔ plays  ↔ pffScouting  ↔ tracking
  - (gameId, playId)             → plays  ↔ pffScouting  ↔ tracking
    (playId NO es único entre juegos; siempre se usa junto a gameId)
  - (gameId, playId, nflId)      → pffScouting  ↔ tracking  ↔ players
  - Balón en tracking: nflId es NaN  O  team == 'football'

Uso rápido:
    from backend.data_pipeline import DataPipeline
    dp = DataPipeline()
    dp.run()                   # carga, limpia y guarda en data/clean/
    plays = dp.filter_plays(team="KC", week=1)
    roster = dp.filter_players(last_name="Hill")
"""

from __future__ import annotations

import glob
import os
import sys

# Forzar stdout/stderr UTF-8 en Windows (cp1252 no soporta caracteres especiales)
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
if sys.stderr and hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8", errors="replace")

from pathlib import Path
from typing import Optional

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Rutas
# ---------------------------------------------------------------------------
ROOT = Path(__file__).resolve().parent.parent   # raíz del proyecto
DATA_RAW = ROOT / "data"
DATA_CLEAN = ROOT / "data" / "clean"
DATA_CLEAN.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# Tipos canónicos por columna
# ---------------------------------------------------------------------------
_DTYPES_GAMES = {
    "gameId": "int64",
    "season": "int16",
    "week":   "int8",
}

_DTYPES_PLAYS = {
    "gameId":  "int64",
    "playId":  "int32",
    "quarter": "int8",
    "down":    "int8",
    "yardsToGo": "float32",
    "absoluteYardlineNumber": "float32",
    "playResult": "float32",
    "prePenaltyPlayResult": "float32",
    "penaltyYards": "float32",
    "preSnapHomeScore":    "int16",
    "preSnapVisitorScore": "int16",
    "pff_playAction": "int8",
}

_DTYPES_PLAYERS = {
    "nflId":  "int64",
    "weight": "float32",
}

_DTYPES_PFF = {
    "gameId":  "int64",
    "playId":  "int32",
    "nflId":   "float64",        # puede tener NaN antes de dropna
    "pff_hit":          "Int8",  # Int8 nullable (pandas)
    "pff_hurry":        "Int8",
    "pff_sack":         "Int8",
    "pff_beatenByDefender": "Int8",
    "pff_hitAllowed":   "Int8",
    "pff_hurryAllowed": "Int8",
    "pff_sackAllowed":  "Int8",
    "pff_backFieldBlock": "Int8",
}

_DTYPES_TRACKING = {
    "gameId":  "int64",
    "playId":  "int32",
    "frameId": "int32",
    "x": "float32",
    "y": "float32",
    "s": "float32",
    "a": "float32",
    "dis": "float32",
    "o":   "float32",
    "dir": "float32",
}


# ---------------------------------------------------------------------------
# Helpers internos
# ---------------------------------------------------------------------------

def _cast(df: pd.DataFrame, dtypes: dict) -> pd.DataFrame:
    """Aplica dtypes sólo a columnas que existen en el DataFrame."""
    for col, dtype in dtypes.items():
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors="coerce").astype(dtype)
    return df


def _report(label: str, before: int, after: int) -> None:
    pct = 100 * (before - after) / before if before else 0
    print(f"  {label:35s}  {before:>8,} -> {after:>8,}  ({pct:.1f}% eliminado)")


# ---------------------------------------------------------------------------
# Clase principal
# ---------------------------------------------------------------------------

class DataPipeline:
    """
    Carga, limpia y expone los datos del torneo.

    Atributos disponibles tras llamar a run():
        .games      pd.DataFrame
        .plays      pd.DataFrame
        .players    pd.DataFrame
        .pff        pd.DataFrame
        .tracking   pd.DataFrame   (todos los archivos concatenados)
    """

    def __init__(self) -> None:
        self.games:    Optional[pd.DataFrame] = None
        self.plays:    Optional[pd.DataFrame] = None
        self.players:  Optional[pd.DataFrame] = None
        self.pff:      Optional[pd.DataFrame] = None
        self.tracking: Optional[pd.DataFrame] = None

    # ------------------------------------------------------------------
    # Carga individual
    # ------------------------------------------------------------------

    def load_games(self) -> pd.DataFrame:
        df = pd.read_csv(DATA_RAW / "games.csv")
        df = _cast(df, _DTYPES_GAMES)
        # gameDate como fecha
        df["gameDate"] = pd.to_datetime(df["gameDate"], errors="coerce")
        return df

    def load_plays(self) -> pd.DataFrame:
        df = pd.read_csv(DATA_RAW / "plays.csv")
        df = _cast(df, _DTYPES_PLAYS)
        # Categoricals ligeros
        for col in ("possessionTeam", "defensiveTeam", "offenseFormation",
                    "dropBackType", "passResult",
                    "pff_passCoverage", "pff_passCoverageType"):
            if col in df.columns:
                df[col] = df[col].astype("category")
        return df

    def load_players(self) -> pd.DataFrame:
        df = pd.read_csv(DATA_RAW / "players.csv")
        df = _cast(df, _DTYPES_PLAYERS)
        df["birthDate"] = pd.to_datetime(df["birthDate"], errors="coerce")
        # Apellido extraído de displayName ("Nombre Apellido" → "Apellido")
        df["lastName"] = (
            df["displayName"]
            .fillna("")
            .str.strip()
            .str.split()
            .str[-1]
            .str.upper()
        )
        return df

    def load_pff(self) -> pd.DataFrame:
        df = pd.read_csv(DATA_RAW / "pffScoutingData.csv")
        df = _cast(df, _DTYPES_PFF)
        for col in ("pff_role", "pff_positionLinedUp", "pff_blockType"):
            if col in df.columns:
                df[col] = df[col].astype("category")
        return df

    def load_tracking(self) -> pd.DataFrame:
        """Concatena todos los archivos tracking_*.csv."""
        files = sorted(glob.glob(str(DATA_RAW / "tracking" / "tracking_*.csv")))
        if not files:
            raise FileNotFoundError("No se encontraron archivos tracking_*.csv")
        parts = []
        for f in files:
            chunk = pd.read_csv(f)
            chunk = _cast(chunk, _DTYPES_TRACKING)
            # nflId: mantener NaN para el balón; el resto como int64 nullable
            if "nflId" in chunk.columns:
                chunk["nflId"] = pd.to_numeric(chunk["nflId"], errors="coerce")
            for col in ("team", "playDirection", "event"):
                if col in chunk.columns:
                    chunk[col] = chunk[col].astype("category")
            parts.append(chunk)
        return pd.concat(parts, ignore_index=True)

    # ------------------------------------------------------------------
    # Limpieza y validación
    # ------------------------------------------------------------------

    def _clean_games(self, df: pd.DataFrame) -> pd.DataFrame:
        before = len(df)
        df = df.dropna(subset=["gameId", "week", "homeTeamAbbr", "visitorTeamAbbr"])
        _report("games  — nulos críticos", before, len(df))
        return df

    def _clean_plays(self, df: pd.DataFrame) -> pd.DataFrame:
        before = len(df)
        df = df.dropna(subset=["gameId", "playId", "possessionTeam", "defensiveTeam"])
        _report("plays  — nulos críticos", before, len(df))
        return df

    def _clean_players(self, df: pd.DataFrame) -> pd.DataFrame:
        before = len(df)
        df = df.dropna(subset=["nflId", "displayName"])
        _report("players— nulos críticos", before, len(df))
        return df

    def _clean_pff(self, df: pd.DataFrame, valid_keys: pd.DataFrame) -> pd.DataFrame:
        """
        Limpia pff y filtra a jugadas validas.
        valid_keys debe ser un DataFrame con columnas [gameId, playId].
        """
        before = len(df)
        df = df.dropna(subset=["gameId", "playId", "nflId"])
        # nflId ya sin NaN, cast seguro a int64
        df["nflId"] = df["nflId"].astype("int64")
        _report("pff    - nulos criticos", before, len(df))

        before = len(df)
        df = df.merge(valid_keys[["gameId", "playId"]].drop_duplicates(),
                      on=["gameId", "playId"], how="inner")
        _report("pff    - jugadas validas (inner join plays)", before, len(df))
        return df

    def _clean_tracking(self, df: pd.DataFrame, valid_keys: pd.DataFrame) -> pd.DataFrame:
        """
        Limpia tracking.
        - Separa balón (nflId NaN o team=='football') de jugadores.
        - Filtra sólo jugadas que existen en plays.
        """
        before = len(df)
        df = df.dropna(subset=["gameId", "playId", "frameId"])
        _report("tracking— nulos críticos (gameId/playId/frameId)", before, len(df))

        before = len(df)
        df = df.merge(valid_keys[["gameId", "playId"]].drop_duplicates(),
                      on=["gameId", "playId"], how="inner")
        _report("tracking— jugadas válidas (inner join plays)", before, len(df))
        return df

    # ------------------------------------------------------------------
    # Pipeline completo
    # ------------------------------------------------------------------

    def run(self, save: bool = True, verbose: bool = True) -> None:
        """
        Ejecuta carga → limpieza → guardado en data/clean/.

        Parámetros
        ----------
        save    : guarda los Parquet en data/clean/ (recomendado).
        verbose : imprime resumen de conteos.
        """
        if verbose:
            print("\n--- Cargando archivos crudos ---")

        games   = self.load_games()
        plays   = self.load_plays()
        players = self.load_players()
        pff     = self.load_pff()

        if verbose:
            print(f"  games:    {len(games):>8,} filas")
            print(f"  plays:    {len(plays):>8,} filas")
            print(f"  players:  {len(players):>8,} filas")
            print(f"  pff:      {len(pff):>8,} filas")
            print("  tracking: (cargando archivos...)")

        tracking = self.load_tracking()

        if verbose:
            print(f"  tracking: {len(tracking):>8,} filas")
            print("\n--- Limpieza y validacion ---")

        games   = self._clean_games(games)
        plays   = self._clean_plays(plays)
        players = self._clean_players(players)

        # Llaves validas = juegos que existen x jugadas que existen en esos juegos
        valid_game_ids = games[["gameId"]].drop_duplicates()
        plays = plays.merge(valid_game_ids, on="gameId", how="inner")
        valid_play_keys = plays[["gameId", "playId"]].drop_duplicates()

        pff      = self._clean_pff(pff, valid_play_keys)
        tracking = self._clean_tracking(tracking, valid_play_keys)

        # Enriquecer tracking: marcar balon explicitamente
        tracking["is_ball"] = (
            tracking["nflId"].isna() | (tracking["team"].astype(str) == "football")
        )

        # Adjuntar week a plays para filtros rapidos
        plays = plays.merge(games[["gameId", "week", "homeTeamAbbr", "visitorTeamAbbr"]],
                            on="gameId", how="left")

        if verbose:
            print("\n--- Conteos finales ---")
            print(f"  games:    {len(games):>8,} filas  |  semanas: {sorted(games['week'].unique())}")
            print(f"  plays:    {len(plays):>8,} filas")
            print(f"  players:  {len(players):>8,} filas")
            print(f"  pff:      {len(pff):>8,} filas")
            print(f"  tracking: {len(tracking):>8,} filas")
            ball_rows = int(tracking["is_ball"].sum())
            print(f"    balon (is_ball=True): {ball_rows:>8,} filas")
            print(f"    jugadores:            {len(tracking)-ball_rows:>8,} filas")

        self.games    = games
        self.plays    = plays
        self.players  = players
        self.pff      = pff
        self.tracking = tracking

        if save:
            self._save()
            if verbose:
                print(f"\nGuardado en {DATA_CLEAN}")

    def _save(self) -> None:
        # Guarda en CSV comprimido (gzip). No requiere pyarrow ni fastparquet,
        # solo pandas (ya en el stack). El tracking se parte en chunks para
        # evitar picos de memoria al comprimir.
        self.games.to_csv(DATA_CLEAN / "games.csv.gz",    index=False, compression="gzip")
        self.plays.to_csv(DATA_CLEAN / "plays.csv.gz",    index=False, compression="gzip")
        self.players.to_csv(DATA_CLEAN / "players.csv.gz", index=False, compression="gzip")
        self.pff.to_csv(DATA_CLEAN / "pff.csv.gz",        index=False, compression="gzip")
        self.tracking.to_csv(DATA_CLEAN / "tracking.csv.gz", index=False, compression="gzip")

    # ------------------------------------------------------------------
    # Carga desde cache (data/clean/)
    # ------------------------------------------------------------------

    def load_clean(self) -> None:
        """Carga los CSV comprimidos ya procesados (mas rapido que run())."""
        self.games    = pd.read_csv(DATA_CLEAN / "games.csv.gz")
        self.plays    = pd.read_csv(DATA_CLEAN / "plays.csv.gz")
        self.players  = pd.read_csv(DATA_CLEAN / "players.csv.gz")
        self.pff      = pd.read_csv(DATA_CLEAN / "pff.csv.gz")
        self.tracking = pd.read_csv(DATA_CLEAN / "tracking.csv.gz")

    @staticmethod
    def clean_exists() -> bool:
        """True si los cinco archivos de data/clean/ ya existen."""
        files = ["games", "plays", "players", "pff", "tracking"]
        return all((DATA_CLEAN / f"{f}.csv.gz").exists() for f in files)

    # ------------------------------------------------------------------
    # Filtros de alto nivel
    # ------------------------------------------------------------------

    def _ensure_loaded(self) -> None:
        if self.plays is None:
            raise RuntimeError("Llama a run() o load_clean() primero.")

    # --- Equipo / semana ---

    def filter_plays(
        self,
        team: Optional[str] = None,
        week: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Jugadas filtradas por equipo (posesión o defensa) y/o semana.

        Parámetros
        ----------
        team : abreviatura NFL, ej. "KC", "NE".  None = todos.
        week : número de semana 1-18.             None = todas.
        """
        self._ensure_loaded()
        df = self.plays
        if team:
            t = team.upper()
            df = df[df["possessionTeam"].astype(str).str.upper().eq(t) |
                    df["defensiveTeam"].astype(str).str.upper().eq(t)]
        if week is not None:
            df = df[df["week"] == week]
        return df.reset_index(drop=True)

    # --- Jugadores ---

    def filter_players(
        self,
        last_name: Optional[str] = None,
        official_position: Optional[str] = None,
    ) -> pd.DataFrame:
        """
        Jugadores filtrados por apellido (parcial, sin importar mayúsculas)
        y/o posición oficial.

        Parámetros
        ----------
        last_name         : apellido o fragmento, ej. "Hill", "smith".
        official_position : posición NFL, ej. "QB", "WR".
        """
        self._ensure_loaded()
        df = self.players
        if last_name:
            df = df[df["lastName"].str.contains(last_name.upper(), na=False)]
        if official_position:
            df = df[df["officialPosition"].str.upper() == official_position.upper()]
        return df.reset_index(drop=True)

    # --- Scouting PFF ---

    def filter_pff(
        self,
        pff_role: Optional[str] = None,
        pff_position: Optional[str] = None,
        team: Optional[str] = None,
        week: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Registros de scouting filtrados por rol PFF, posición alineada,
        equipo y/o semana.

        Parámetros
        ----------
        pff_role     : ej. "Pass Route", "Pass Block", "Coverage".
        pff_position : pff_positionLinedUp, ej. "WR", "CB".
        team         : abreviatura del equipo (filtra por jugadas).
        week         : semana del torneo.
        """
        self._ensure_loaded()
        df = self.pff
        if pff_role:
            df = df[df["pff_role"].astype(str).str.upper() == pff_role.upper()]
        if pff_position:
            df = df[df["pff_positionLinedUp"].astype(str).str.upper() == pff_position.upper()]
        if team or week is not None:
            play_keys = self.filter_plays(team=team, week=week)[["gameId", "playId"]]
            df = df.merge(play_keys, on=["gameId", "playId"], how="inner")
        return df.reset_index(drop=True)

    # --- Perfil de jugador: jugadas asociadas ---

    def player_plays(
        self,
        last_name: Optional[str] = None,
        nfl_id: Optional[int] = None,
        team: Optional[str] = None,
        week: Optional[int] = None,
    ) -> pd.DataFrame:
        """
        Devuelve todas las jugadas en las que participó un jugador,
        enriquecidas con datos de scouting.

        Identifica al jugador por apellido (parcial) o nflId exacto.
        Filtra adicionalmente por equipo/semana si se proporcionan.
        """
        self._ensure_loaded()

        # Resolver nflId
        if nfl_id is None:
            if last_name is None:
                raise ValueError("Proporciona last_name o nfl_id.")
            matched = self.filter_players(last_name=last_name)
            if matched.empty:
                return pd.DataFrame()
            nfl_ids = matched["nflId"].tolist()
        else:
            nfl_ids = [nfl_id]

        # Jugadas del jugador desde pff
        pff_player = self.pff[self.pff["nflId"].isin(nfl_ids)]

        if team or week is not None:
            play_keys = self.filter_plays(team=team, week=week)[["gameId", "playId"]]
            pff_player = pff_player.merge(play_keys, on=["gameId", "playId"], how="inner")

        # Enriquecer con datos de jugada
        result = pff_player.merge(
            self.plays[["gameId", "playId", "week",
                        "possessionTeam", "defensiveTeam",
                        "quarter", "down", "yardsToGo",
                        "playDescription", "playResult",
                        "offenseFormation", "passResult"]],
            on=["gameId", "playId"], how="left"
        ).merge(
            self.players[["nflId", "displayName", "lastName",
                          "officialPosition"]],
            on="nflId", how="left"
        )
        return result.reset_index(drop=True)

    # --- Resumen por equipo (Head Coach view) ---

    def team_summary(self, team: str, week: Optional[int] = None) -> dict:
        """
        Resumen compacto para el flujo del Head Coach:
        total de jugadas, desglose por formación ofensiva,
        y los 10 jugadores con más snap counts en pff.
        """
        self._ensure_loaded()
        plays = self.filter_plays(team=team, week=week)
        pff   = self.filter_pff(team=team, week=week)

        top_players = (
            pff.merge(self.players[["nflId", "displayName", "officialPosition"]],
                      on="nflId", how="left")
            .groupby(["nflId", "displayName", "officialPosition"], observed=True)
            .size()
            .reset_index(name="snaps")
            .sort_values("snaps", ascending=False)
            .head(10)
        )

        formation_counts = (
            plays["offenseFormation"]
            .astype(str)
            .value_counts()
            .to_dict()
        )

        return {
            "team": team.upper(),
            "week": week,
            "total_plays": int(len(plays)),
            "formations": formation_counts,
            "top_players_by_snaps": top_players.to_dict(orient="records"),
        }
