import { SAMPLE_SITUACION } from '../data/sampleSituacion'

export type Unidad = 'ataque' | 'defensa'
export type Zona = 'salida' | 'mediocampo' | 'redzone'
export type Distancia = 'corto' | 'medio' | 'largo'

export interface Situacion {
  unidad: Unidad
  down: 1 | 2 | 3 | 4
  distancia: Distancia
  zona: Zona
}

export interface JugadorSituacion {
  teamAbbr: string
  unidad: Unidad
  displayName: string
  lastName: string
  jerseyNumber: number
  pff_positionLinedUp: string
  rank_posicion: number
  /** snaps del jugador en esa situacion */
  snaps: number
  /** 0..100, rendimiento en la situacion */
  score_rendimiento: number
  /** 0..1, tasa de exito en la situacion */
  tasa_exito: number
  /** coordenadas absolutas del snap (de resumen_posicion_snap.csv). Opcionales */
  x_snap?: number | null
  y_snap?: number | null
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * SEAM DE DATOS — cuando el backend y los CSV resumidos (resumen_jugador_situacion.csv
 * y resumen_posicion_snap.csv) esten listos, pon USE_MOCK en false.
 */
const USE_MOCK = true

function query(s: Situacion): string {
  return `unidad=${s.unidad}&down=${s.down}&distancia=${s.distancia}&zona=${s.zona}`
}

export async function fetchSituacion(team: string, s: Situacion): Promise<JugadorSituacion[]> {
  if (USE_MOCK) {
    await delay(150)
    // La muestra solo varia por equipo y unidad; el backend real filtrara por la
    // situacion completa (down/distancia/zona).
    return SAMPLE_SITUACION.filter((j) => j.teamAbbr === team && j.unidad === s.unidad)
  }
  // Contrato esperado: GET api/situacion/{abbr}?unidad=&down=&distancia=&zona=
  const res = await fetch(`api/situacion/${team}?${query(s)}`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar la situacion`)
  return (await res.json()) as JugadorSituacion[]
}

/** Titulares: rank_posicion == 1 (deben ser 11). */
export function titulares(jugadores: JugadorSituacion[]): JugadorSituacion[] {
  return jugadores.filter((j) => j.rank_posicion === 1)
}

/** Suplentes sugeridos para una posicion: rank 2 y 3 con el mismo pff_positionLinedUp. */
export function sugerencias(jugadores: JugadorSituacion[], posicion: string): JugadorSituacion[] {
  return jugadores
    .filter((j) => j.pff_positionLinedUp === posicion && (j.rank_posicion === 2 || j.rank_posicion === 3))
    .sort((a, b) => a.rank_posicion - b.rank_posicion)
}

/** El titular con mayor score_rendimiento (seleccion por defecto). */
export function titularMasRendimiento(jugadores: JugadorSituacion[]): JugadorSituacion | null {
  const t = titulares(jugadores)
  if (t.length === 0) return null
  return t.reduce((m, j) => (j.score_rendimiento > m.score_rendimiento ? j : m), t[0])
}

export const ETIQUETAS_SITUACION = {
  unidad: { ataque: 'Ataque', defensa: 'Defensa' },
  distancia: { corto: 'Corto (1-3)', medio: 'Medio (4-6)', largo: 'Largo (7+)' },
  zona: { salida: 'Salida', mediocampo: 'Medio Campo', redzone: 'Red Zone' },
}
