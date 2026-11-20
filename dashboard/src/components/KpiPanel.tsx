import { useTeam } from '../context/TeamContext'
import TeamLogo from './TeamLogo'

const nf = new Intl.NumberFormat('es-MX')

interface Props {
  onIrAnalista: () => void
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xl font-bold leading-none tabular-nums text-tinta">{value}</div>
      <div className="mt-1 text-[11px] font-medium uppercase tracking-wide text-niebla">
        {label}
        {sub ? <span className="ml-1 normal-case text-niebla/60">{sub}</span> : null}
      </div>
    </div>
  )
}

export default function KpiPanel({ onIrAnalista }: Props) {
  const { equipo, kpis, cargandoKpis, errorKpis } = useTeam()
  if (!equipo) return null

  const sinDatos = !kpis || !kpis.tieneDatos

  return (
    <div className="sticky bottom-0 z-20 border-t border-borde bg-pizarra/85 shadow-[0_-8px_24px_-12px_rgba(0,0,0,0.6)] backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <TeamLogo team={equipo} size={48} />
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-tinta">{equipo.nombre}</div>
            <div className="text-xs text-niebla">
              {equipo.conferencia} {equipo.division} · Resumen semanas 1-8
            </div>
          </div>
        </div>

        {cargandoKpis ? (
          <div className="text-sm text-niebla">Calculando KPIs…</div>
        ) : errorKpis ? (
          <div className="text-sm text-amber-300">
            No se pudieron cargar los KPIs ({errorKpis}). Verifica que el backend esté activo.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:flex lg:gap-8">
            <Stat label="Partidos jugados" value={nf.format(kpis?.partidos ?? 0)} sub="sem 1-8" />
            <Stat label="Jugadas ofensivas" value={nf.format(kpis?.jugadasOfensivas ?? 0)} />
            <Stat label="Jugadas defensivas" value={nf.format(kpis?.jugadasDefensivas ?? 0)} />
            <Stat
              label="Yds por jugada"
              value={(kpis?.avgYardsPorJugada ?? 0).toFixed(2)}
              sub="playResult"
            />
          </div>
        )}

        <div className="flex shrink-0 items-center gap-3">
          {sinDatos && !cargandoKpis && !errorKpis ? (
            <span className="text-xs text-niebla">Sin datos para este equipo</span>
          ) : null}
          <button
            type="button"
            onClick={onIrAnalista}
            className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-b from-gold-hover to-gold px-4 py-2.5 text-sm font-bold text-obsidiana shadow-gold-glow transition hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidiana"
          >
            Ir a Analista Coach
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
