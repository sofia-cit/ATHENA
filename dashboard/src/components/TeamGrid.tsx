import { useMemo, useState } from 'react'
import { TEAMS, buscarEquipos } from '../data/teams'
import { useTeam } from '../context/TeamContext'
import TeamCard from './TeamCard'

export default function TeamGrid() {
  const { abbr, seleccionar, kpisPorEquipo } = useTeam()
  const [query, setQuery] = useState('')

  const resultados = useMemo(() => buscarEquipos(query), [query])

  return (
    <section aria-label="Selección de equipo" className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-tinta">1. Equipo</h2>
          <p className="text-sm text-niebla">
            Selecciona un equipo para ver su resumen y pasar al análisis.
          </p>
        </div>
        <div className="relative w-full sm:w-72">
          <svg
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-niebla"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por nombre o abreviatura…"
            aria-label="Buscar equipo"
            className="w-full rounded-lg border border-borde bg-inputbg py-2 pl-9 pr-3 text-sm text-tinta placeholder-niebla/60 shadow-sm transition focus:border-gold focus:outline-none focus:ring-1 focus:ring-gold/50"
          />
        </div>
      </div>

      <div className="flex items-center gap-4 text-xs text-niebla">
        <span>
          {resultados.length} de {TEAMS.length} equipos
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="h-2 w-2 rounded-full bg-gold" />
          con datos disponibles
        </span>
      </div>

      {resultados.length === 0 ? (
        <div className="rounded-xl border border-dashed border-borde bg-pizarra p-10 text-center text-sm text-niebla">
          Ningún equipo coincide con “{query}”.
        </div>
      ) : (
        <div className="grid gap-3 grid-cols-[repeat(auto-fill,minmax(150px,1fr))]">
          {resultados.map((t) => (
            <TeamCard
              key={t.abbr}
              team={t}
              selected={abbr === t.abbr}
              tieneDatos={Boolean(kpisPorEquipo[t.abbr]?.tieneDatos)}
              onSelect={seleccionar}
            />
          ))}
        </div>
      )}
    </section>
  )
}
