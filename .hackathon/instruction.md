# Reglas del Proyecto — NFL Hackathon Analytics UI

- **Objetivo:** Aplicación web de análisis táctico de NFL con 3 pantallas principales.
- **Fuente de datos:** Leerá 4 archivos CSV pre-procesados en `/data/` (inicialmente usar datos mock con esta misma estructura):
  1. `resumen_jugadas.csv`: `gameId, playId, season, week, possessionTeam, defensiveTeam, quarter, down, yardsToGo, yardlineNumber, absoluteYardlineNumber, score_diff, offenseFormation, personnelO, personnelD, dropBackType, pff_playAction, pff_passCoverage, pff_passCoverageType, passResult, playResult, playDescription`
  2. `resumen_jugador_rol.csv`: `nflId, displayName, officialPosition, team, jerseyNumber, area, pff_role, pff_positionLinedUp, snaps, sack_allowed, hurry_allowed, hit_allowed, beaten_count, sacks, hurries, hits`
  3. `resumen_jugador_situacion.csv`: `team, area, down, dist_bucket, field_zone, nflId, displayName, jerseyNumber, pff_positionLinedUp, pff_role, snaps_situacion, score_rendimiento, rank_posicion`
  4. `resumen_posicion_snap.csv`: `team, area, pff_positionLinedUp, x_snap, y_snap`
- **Restricciones de hackatón:**
  - Priorizar componentes limpios, carga rápida, diseño dark/deportivo de alto contraste y cero dependencias pesadas innecesarias.
  - Mantener el equipo seleccionado (`selectedTeam`) en estado global accesible desde las 3 pantallas.
  - Todas las etiquetas visibles de la interfaz deben estar en español.