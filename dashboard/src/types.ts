export interface TeamColors {
  /** color primario del equipo (hex) */
  primary: string
  /** color secundario / acento del equipo (hex) */
  secondary: string
}

export type Conferencia = 'AFC' | 'NFC'

export interface Team {
  /** abreviatura oficial del dataset 2021 (2-3 letras): KC, BUF, SF, DAL, LA, LV, GB ... */
  abbr: string
  /** nombre completo del equipo, p.ej. "Kansas City Chiefs" */
  nombre: string
  /** ciudad / mercado, p.ej. "Kansas City" */
  ciudad: string
  conferencia: Conferencia
  division: string
  colores: TeamColors
}

export interface Kpis {
  abbr: string
  /** partidos jugados en semanas 1-8 */
  partidos: number
  /** total de jugadas ofensivas */
  jugadasOfensivas: number
  /** total de jugadas defensivas */
  jugadasDefensivas: number
  /** yardas promedio por jugada (promedio de playResult en jugadas ofensivas) */
  avgYardsPorJugada: number
  /** false cuando el equipo no aparece en el resumen */
  tieneDatos: boolean
}

export type Vista = 'equipo' | 'analista' | 'cuadro'
