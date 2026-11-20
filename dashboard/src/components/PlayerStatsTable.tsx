import { useMemo, useState } from 'react'
import type { Jugador, ModoAnalisis } from '../lib/analista'
import { posicionesUnicas } from '../lib/analista'

interface Props {
  jugadores: Jugador[]
  modo: ModoAnalisis
  cargando: boolean
  error: string | null
}

type SortDir = 'asc' | 'desc'
interface Col {
  key: keyof Jugador
  label: string
  num?: boolean
}

const ATAQUE_COLS: Col[] = [
  { key: 'jerseyNumber', label: '#', num: true },
  { key: 'displayName', label: 'Jugador' },
  { key: 'pff_positionLinedUp', label: 'Pos' },
  { key: 'snaps', label: 'Snaps', num: true },
  { key: 'sack_allowed', label: 'Sack perm.', num: true },
  { key: 'hurry_allowed', label: 'Apuros perm.', num: true },
  { key: 'hit_allowed', label: 'Golpes perm.', num: true },
  { key: 'beaten_count', label: 'Vencido', num: true },
]
const DEFENSA_COLS: Col[] = [
  { key: 'jerseyNumber', label: '#', num: true },
  { key: 'displayName', label: 'Jugador' },
  { key: 'pff_positionLinedUp', label: 'Pos' },
  { key: 'snaps', label: 'Snaps', num: true },
  { key: 'sacks', label: 'Sacks', num: true },
  { key: 'hurries', label: 'Apuros', num: true },
  { key: 'hits', label: 'Golpes', num: true },
]

function colsDe(modo: ModoAnalisis): Col[] {
  return modo === 'defensa' ? DEFENSA_COLS : ATAQUE_COLS
}

export default function PlayerStatsTable({ jugadores, modo, cargando, error }: Props) {
  const [query, setQuery] = useState('')
  const [posicion, setPosicion] = useState('')
  const [sortKey, setSortKey] = useState<keyof Jugador>('snaps')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const cols = colsDe(modo)
  const posiciones = useMemo(() => posicionesUnicas(jugadores), [jugadores])

  const filas = useMemo(() => {
    const q = query.trim().toLowerCase()
    let r = jugadores.filter((j) => !q || j.displayName.toLowerCase().includes(q))
    r = r.filter((j) => !posicion || j.pff_positionLinedUp === posicion)
    const col = cols.find((c) => c.key === sortKey) ?? cols[0]
    r = [...r].sort((a, b) => {
      const av = a[sortKey]
      const bv = b[sortKey]
      if (col.num && typeof av === 'number' && typeof bv === 'number') {
        return sortDir === 'asc' ? av - bv : bv - av
      }
      return sortDir === 'asc'
        ? String(av).localeCompare(String(bv))
        : String(bv).localeCompare(String(av))
    })
    return r
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jugadores, query, posicion, sortKey, sortDir, modo])

  const toggle = (k: keyof Jugador) => {
    if (sortKey === k) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      const col = cols.find((c) => c.key === k)
      setSortKey(k)
      setSortDir(col?.num ? 'desc' : 'asc')
    }
  }

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-borde bg-pizarra">
      <div className="flex items-center justify-between gap-3 border-b border-borde px-4 py-3">
        <div>
          <h3 className="text-sm font-bold text-tinta">Estadísticas de jugadores</h3>
          <p className="text-[11px] text-niebla">
            {modo === 'defensa' ? 'Pasadores (pass rush)' : 'Bloqueadores (pass protection)'} ·{' '}
            {jugadores.length} jugadores
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 border-b border-borde px-4 py-3">
        <div className="relative min-w-0 flex-1">
          <svg
            className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-niebla"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar jugador…"
            aria-label="Buscar jugador"
            className="w-full rounded-lg border border-borde bg-inputbg py-1.5 pl-8 pr-2 text-xs text-tinta placeholder-niebla/60 focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
          />
        </div>
        <select
          value={posicion}
          onChange={(e) => setPosicion(e.target.value)}
          aria-label="Filtrar por posición"
          className="rounded-lg border border-borde bg-inputbg px-2 py-1.5 text-xs text-tinta focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/40"
        >
          <option value="">Todas las posiciones</option>
          {posiciones.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-obsidiana/60">
              {cols.map((c) => {
                const activo = sortKey === c.key
                return (
                  <th
                    key={c.key}
                    onClick={() => toggle(c.key)}
                    className={`cursor-pointer select-none whitespace-nowrap px-3 py-2 text-[11px] font-semibold uppercase tracking-wide transition hover:text-tinta ${
                      activo ? 'text-gold' : 'text-niebla'
                    } ${c.num ? 'text-right' : 'text-left'}`}
                  >
                    <span className="inline-flex items-center gap-1">
                      {c.label}
                      {activo ? (
                        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="currentColor">
                          {sortDir === 'asc' ? (
                            <path d="M6 3l4 5H2z" />
                          ) : (
                            <path d="M6 9L2 4h8z" />
                          )}
                        </svg>
                      ) : null}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {filas.map((j) => (
              <tr key={`${j.nflId}`} className="border-t border-borde/60 transition hover:bg-white/[0.03]">
                {cols.map((c) => {
                  const v = j[c.key]
                  return (
                    <td
                      key={c.key}
                      className={`whitespace-nowrap px-3 py-2 text-xs ${
                        c.num ? 'text-right tabular-nums text-tinta' : 'text-niebla'
                      } ${c.key === 'displayName' ? 'font-semibold text-tinta' : ''}`}
                    >
                      {c.key === 'jerseyNumber' ? `#${v}` : v}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filas.length === 0 && !cargando && !error && (
        <div className="px-4 py-8 text-center text-xs text-niebla">
          {jugadores.length === 0
            ? 'Sin datos de jugadores para este equipo todavía.'
            : 'Ningún jugador coincide con los filtros.'}
        </div>
      )}
      {cargando && <div className="px-4 py-8 text-center text-xs text-niebla">Cargando jugadores…</div>}
      {error && (
        <div className="px-4 py-8 text-center text-xs text-amber-300">No se pudieron cargar jugadores: {error}</div>
      )}
    </section>
  )
}
