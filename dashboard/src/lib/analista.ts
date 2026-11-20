import { SAMPLE_JUGADORES, SAMPLE_JUGADAS } from '../data/sampleAnalista'

export type ModoAnalisis = 'ataque' | 'defensa' | 'situacional'

export interface Jugador {
  teamAbbr: string
  nflId: number
  jerseyNumber: number
  displayName: string
  pff_positionLinedUp: string
  pff_role: string
  snaps: number
  sack_allowed: number
  hurry_allowed: number
  hit_allowed: number
  beaten_count: number
  sacks: number
  hurries: number
  hits: number
}

export interface Jugada {
  gameId: number
  week: number
  possessionTeam: string
  defensiveTeam: string
  playResult: number
  down: number
  absoluteYardlineNumber: number
  offenseFormation: string
  personnelO: string
  dropBackType: string
  pff_passCoverage: string
  personnelD: string
  passResult: string
  playDescription: string
}

export interface GrupoCatalogo {
  /** clave legible, p.ej. "SHOTGUN · 1 RB, 1 TE, 3 WR · TRADITIONAL" */
  clave: string
  /** campos individuales que componen el grupo */
  campos: Record<string, string>
  conteo: number
  frecuenciaPct: number
  avgPlayResult: number
  /** 0..1 */
  tasaCompletos: number
  ejemplo: string
}

const PASOS = ['C', 'I', 'S'] // jugadas de pase (passResult en el dataset, mayúsculas)
const COBERTURAS_CRITICAS = ['Red Zone', 'Goal Line', 'Prevent']

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms))

/**
 * SEAM DE DATOS — cuando el backend y los CSV resumidos estén listos, pon
 * USE_MOCK en false: fetchJugadores/fetchJugadas pasarán a llamar a la API.
 * El resto del front (filtrado por modo, situacional y agrupado) ya está listo.
 */
const USE_MOCK = true

export async function fetchJugadores(abbr: string): Promise<Jugador[]> {
  if (USE_MOCK) {
    await delay(150)
    return SAMPLE_JUGADORES.filter((j) => j.teamAbbr === abbr)
  }
  // Contrato esperado del backend: GET api/jugadores/{abbr} -> Jugador[]
  const res = await fetch(`api/jugadores/${abbr}`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar jugadores`)
  return (await res.json()) as Jugador[]
}

export async function fetchJugadas(abbr: string): Promise<Jugada[]> {
  if (USE_MOCK) {
    await delay(200)
    return SAMPLE_JUGADAS.filter((j) => j.possessionTeam === abbr || j.defensiveTeam === abbr)
  }
  // Contrato esperado del backend: GET api/jugadas/{abbr} -> Jugada[]
  // (jugadas donde el equipo aparece, en posesion o en defensa). El front filtra
  // por modo y situacion y agrupa; si el backend ya filtra por modo, el re-filtro
  // del front es idempotente.
  const res = await fetch(`api/jugadas/${abbr}`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar jugadas`)
  return (await res.json()) as Jugada[]
}

/** Filtra las jugadas del equipo segun el modo (ataque/defensa/situacional). */
export function filtrarJugadasPorModo(jugadas: Jugada[], abbr: string, modo: ModoAnalisis): Jugada[] {
  if (modo === 'ataque') return jugadas.filter((j) => j.possessionTeam === abbr)
  if (modo === 'defensa') return jugadas.filter((j) => j.defensiveTeam === abbr)
  return jugadas.filter(
    (j) =>
      j.possessionTeam === abbr &&
      (j.down >= 3 || j.absoluteYardlineNumber >= 80 || COBERTURAS_CRITICAS.includes(j.pff_passCoverage)),
  )
}

/** Agrupa las jugadas (ya filtradas por modo) en el catalogo de jugadas. */
export function agruparCatalogo(jugadas: Jugada[], modo: ModoAnalisis): GrupoCatalogo[] {
  const grupoCols =
    modo === 'defensa'
      ? (['pff_passCoverage', 'personnelD'] as const)
      : (['offenseFormation', 'personnelO', 'dropBackType'] as const)

  const pass = jugadas.filter((j) => PASOS.includes((j.passResult || '').toUpperCase()))
  const total = pass.length
  if (total === 0) return []

  const map = new Map<string, Jugada[]>()
  for (const j of pass) {
    const vals = grupoCols.map((c) => (j[c] || '').trim())
    if (vals.some((v) => v === '')) continue // claves incompletas no agrupan
    const key = vals.join(' · ')
    const arr = map.get(key) ?? []
    arr.push(j)
    map.set(key, arr)
  }

  const grupos: GrupoCatalogo[] = []
  for (const [clave, arr] of map) {
    const conteo = arr.length
    const campos: Record<string, string> = {}
    grupoCols.forEach((c) => (campos[c] = arr[0][c] || ''))
    const avg = arr.reduce((s, j) => s + (j.playResult || 0), 0) / conteo
    const comp = arr.filter((j) => (j.passResult || '').toUpperCase() === 'C').length
    const ejemplo = arr.find((j) => j.playDescription)?.playDescription ?? ''
    grupos.push({
      clave,
      campos,
      conteo,
      frecuenciaPct: Number(((conteo / total) * 100).toFixed(1)),
      avgPlayResult: Number(avg.toFixed(2)),
      tasaCompletos: comp / conteo,
      ejemplo,
    })
  }
  grupos.sort((a, b) => b.conteo - a.conteo)
  return grupos
}

/** Jugadores relevantes al modo: Ataque/Situacional -> bloqueadores; Defensa -> pasadores. */
export function jugadoresPorModo(jugadores: Jugador[], modo: ModoAnalisis): Jugador[] {
  const rol = modo === 'defensa' ? 'Pass Rush' : 'Pass Block'
  return jugadores.filter((j) => j.pff_role === rol)
}

export function posicionesUnicas(jugadores: Jugador[]): string[] {
  return Array.from(new Set(jugadores.map((j) => j.pff_positionLinedUp))).sort()
}

export const TITULOS_MODO: Record<ModoAnalisis, string> = {
  ataque: 'Ataque',
  defensa: 'Defensa',
  situacional: 'Situacional / Crítico',
}
