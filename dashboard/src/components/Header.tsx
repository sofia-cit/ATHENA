import type { Vista } from '../types'
import { useTeam } from '../context/TeamContext'
import TeamLogo from './TeamLogo'
import athenaLogo from '../assets/athena-logo.svg'

interface Props {
  vista: Vista
  onVista: (v: Vista) => void
}

const PESTANAS: { id: Vista; label: string }[] = [
  { id: 'equipo', label: '1. Equipo' },
  { id: 'analista', label: '2. Analista Coach' },
  { id: 'cuadro', label: '3. Cuadro Situacional' },
]

export default function Header({ vista, onVista }: Props) {
  const { equipo } = useTeam()

  return (
    <header className="sticky top-0 z-30 border-b border-borde bg-pizarra/90 backdrop-blur">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between py-2.5">
          {/* Marca */}
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-gold/40 bg-pizarra p-1 shadow-[0_0_14px_-4px_rgba(214,197,154,0.5)]">
              <img src={athenaLogo} alt="ATHENA" className="h-full w-full object-contain" />
            </div>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-[0.18em] text-tinta">ATHENA</div>
              <div className="hidden text-[10px] font-semibold uppercase tracking-[0.22em] text-niebla sm:block">
                NFL Tactical Analytics
              </div>
            </div>
          </div>

          {/* Equipo actual + cambiar */}
          <div className="flex items-center gap-3">
            {equipo ? (
              <div className="flex items-center gap-2.5">
                <TeamLogo team={equipo} size={34} />
                <div className="hidden leading-tight sm:block">
                  <div className="text-sm font-bold text-tinta">{equipo.abbr}</div>
                  <div className="max-w-[10rem] truncate text-[11px] text-niebla">
                    {equipo.nombre}
                  </div>
                </div>
              </div>
            ) : (
              <span className="hidden text-xs text-niebla sm:inline">Sin equipo seleccionado</span>
            )}
            <button
              type="button"
              onClick={() => onVista('equipo')}
              className="rounded-lg border border-borde px-3 py-1.5 text-xs font-semibold text-niebla transition hover:border-gold/60 hover:text-tinta focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/50"
            >
              {equipo ? 'Cambiar' : 'Elegir equipo'}
            </button>
          </div>
        </div>

        {/* Navegacion */}
        <nav className="pb-2" aria-label="Navegación principal">
          <div className="inline-flex items-center gap-1 rounded-xl border border-borde bg-obsidiana p-1">
            {PESTANAS.map((p) => {
              const activo = vista === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => onVista(p.id)}
                  aria-current={activo ? 'page' : undefined}
                  className={
                    'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                    (activo
                      ? 'bg-pizarra text-tinta shadow-sm ring-1 ring-gold/40'
                      : 'text-niebla hover:bg-pizarra/60 hover:text-tinta')
                  }
                >
                  {p.label}
                </button>
              )
            })}
          </div>
        </nav>
      </div>
    </header>
  )
}
