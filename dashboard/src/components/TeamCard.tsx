import type { Team } from '../types'
import TeamLogo from './TeamLogo'

interface Props {
  team: Team
  selected?: boolean
  tieneDatos?: boolean
  onSelect: (abbr: string) => void
}

export default function TeamCard({ team, selected, tieneDatos, onSelect }: Props) {
  const { primary, secondary } = team.colores
  return (
    <button
      type="button"
      onClick={() => onSelect(team.abbr)}
      aria-pressed={selected}
      className="group relative flex flex-col items-center gap-2 rounded-xl border bg-pizarra p-3 text-center transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
      style={{
        borderColor: selected ? '#D6C59A' : '#1E293B',
        borderWidth: selected ? 2 : 1,
        boxShadow: selected
          ? '0 10px 30px -12px rgba(214,197,154,0.45)'
          : undefined,
      }}
    >
      {selected && (
        <span className="absolute right-1.5 top-1.5 rounded-full bg-gold px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wide text-obsidiana">
          Seleccionado
        </span>
      )}
      <div
        className="absolute left-2 top-2 h-2 w-2 rounded-full"
        style={{
          backgroundColor: tieneDatos ? secondary : 'transparent',
          border: tieneDatos ? 'none' : '1px solid #334155',
        }}
        title={tieneDatos ? 'Equipo con datos disponibles' : 'Sin datos aún'}
      />
      <div className="rounded-xl ring-1 ring-white/5 transition group-hover:scale-105">
        <TeamLogo team={team} size={56} />
      </div>
      <div className="w-full">
        <div className="text-sm font-bold leading-tight text-tinta">{team.abbr}</div>
        <div className="line-clamp-2 text-[11px] leading-tight text-niebla">{team.nombre}</div>
      </div>
      <div className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-niebla/70">
        <span>{team.conferencia}</span>
        <span aria-hidden>·</span>
        <span>{team.division}</span>
      </div>
    </button>
  )
}
