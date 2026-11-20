import type { Unidad, Zona, JugadorSituacion } from './situacion'

/** Dimensiones del campo en yardas (incluye zonas de anotacion). */
export const LONGITUD_CAMPO = 120
export const ANCHO_CAMPO = 53.3

/**
 * Linea de scrimmage (x absoluto en el campo 0..120) segun la zona elegida.
 * El campo de juego es 10..110 (100 yardas); las zonas de anotacion son 0..10 y 110..120.
 */
export const ZONA_LOS: Record<Zona, number> = {
  salida: 25, // territorio propio (~ propia 15)
  mediocampo: 60, // midfield
  redzone: 92, // zona roja del rival (~ rival 18)
}

/**
 * Coordenadas tacticas por pff_positionLinedUp. dx es relativo a la linea de
 * scrimmage (negativo = detras de la linea, ofensiva; positivo = delante, defensiva).
 * y es a lo ancho del campo (0..53.3). Son el fallback cuando falta x_snap/y_snap.
 */
export const COORD_TACTICAS: Record<Unidad, Record<string, { dx: number; y: number }>> = {
  ataque: {
    QB: { dx: -8, y: 26.6 },
    LT: { dx: 0, y: 17 },
    LG: { dx: 0, y: 22 },
    C: { dx: 0, y: 26.6 },
    RG: { dx: 0, y: 31 },
    RT: { dx: 0, y: 36 },
    TE: { dx: 0, y: 12 },
    LWR: { dx: -1, y: 5 },
    RWR: { dx: -1, y: 48 },
    SLOT: { dx: -5, y: 41 },
    RB: { dx: -13, y: 22 },
  },
  defensa: {
    LE: { dx: 1, y: 14 },
    DLT: { dx: 1, y: 21 },
    DRT: { dx: 1, y: 32 },
    RE: { dx: 1, y: 39 },
    LOLB: { dx: 4, y: 18 },
    MLB: { dx: 4, y: 27 },
    LCB: { dx: -1, y: 6 },
    RCB: { dx: -1, y: 47 },
    NCB: { dx: 3, y: 40 },
    SS: { dx: 6, y: 12 },
    FS: { dx: 8, y: 40 },
  },
}

export interface Punto {
  x: number
  y: number
}

/**
 * Posiciona un jugador en el campo. Usa x_snap/y_snap (de resumen_posicion_snap.csv)
 * si existen; si no, recurre a coordenadas tacticas por pff_positionLinedUp + la
 * linea de scrimmage de la zona elegida.
 */
export function posicionar(j: JugadorSituacion, unidad: Unidad, zona: Zona): Punto {
  if (j.x_snap != null && j.y_snap != null) {
    return { x: j.x_snap, y: j.y_snap }
  }
  const t = COORD_TACTICAS[unidad]?.[j.pff_positionLinedUp]
  if (t) return { x: ZONA_LOS[zona] + t.dx, y: t.y }
  return { x: ZONA_LOS[zona] - 5, y: 26.6 }
}
