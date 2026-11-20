import { useEffect, useMemo, useState } from 'react'
import type { Vista } from '../types'
import { useTeam } from '../context/TeamContext'
import EquipoRequerido from './EquipoRequerido'
import PlayerStatsTable from '../components/PlayerStatsTable'
import PlayCatalog from '../components/PlayCatalog'
import {
  agruparCatalogo,
  fetchJugadas,
  fetchJugadores,
  filtrarJugadasPorModo,
  jugadoresPorModo,
  TITULOS_MODO,
  type Jugada,
  type Jugador,
  type ModoAnalisis,
} from '../lib/analista'

interface Props {
  onVista: (v: Vista) => void
}

const MODOS: { id: ModoAnalisis; label: string }[] = [
  { id: 'ataque', label: 'Ataque' },
  { id: 'defensa', label: 'Defensa' },
  { id: 'situacional', label: 'Situacional / Crítico' },
]

export default function AnalistaCoachView({ onVista }: Props) {
  const { equipo } = useTeam()
  const [modo, setModo] = useState<ModoAnalisis>('ataque')
  const [jugadores, setJugadores] = useState<Jugador[]>([])
  const [jugadas, setJugadas] = useState<Jugada[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const abbr = equipo?.abbr ?? null

  useEffect(() => {
    if (!abbr) return
    let cancelado = false
    setCargando(true)
    setError(null)
    Promise.all([fetchJugadores(abbr), fetchJugadas(abbr)])
      .then(([j, p]) => {
        if (cancelado) return
        setJugadores(j)
        setJugadas(p)
      })
      .catch((e: unknown) => {
        if (!cancelado) setError(e instanceof Error ? e.message : 'Error al cargar datos')
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
  }, [abbr])

  const jugadoresModo = useMemo(() => jugadoresPorModo(jugadores, modo), [jugadores, modo])
  const jugadasModo = useMemo(
    () => (abbr ? filtrarJugadasPorModo(jugadas, abbr, modo) : []),
    [jugadas, abbr, modo],
  )
  const grupos = useMemo(() => agruparCatalogo(jugadasModo, modo), [jugadasModo, modo])
  const totalPases = useMemo(
    () => jugadasModo.filter((j) => ['C', 'I', 'S'].includes((j.passResult || '').toUpperCase())).length,
    [jugadasModo],
  )

  if (!equipo) return <EquipoRequerido titulo="2. Analista Coach" onVista={onVista} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-tinta">2. Analista Coach</h2>
        <p className="text-sm text-niebla">
          Apoyo para el coach de <span className="font-semibold text-gold">{equipo.nombre}</span> · filtra por
          situación y revisa esquemas y jugadores.
        </p>
      </div>

      {/* Pestañas de modo */}
      <div className="mb-5">
        <div className="inline-flex items-center gap-1 rounded-xl border border-borde bg-obsidiana p-1">
          {MODOS.map((m) => {
            const activo = modo === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setModo(m.id)}
                aria-current={activo ? 'page' : undefined}
                className={
                  'whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-semibold transition ' +
                  (activo
                    ? 'bg-pizarra text-tinta shadow-sm ring-1 ring-gold/40'
                    : 'text-niebla hover:bg-pizarra/60 hover:text-tinta')
                }
              >
                {m.label}
              </button>
            )
          })}
        </div>
        {modo === 'situacional' && (
          <p className="mt-2 text-[11px] text-niebla">
            Filtra jugadas de pase del equipo en situaciones críticas: <span className="text-tinta">down ≥ 3</span>,{' '}
            <span className="text-tinta">absoluteYardlineNumber ≥ 80</span> o cobertura{' '}
            <span className="text-tinta">Red Zone / Goal Line / Prevent</span>.
          </p>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <PlayerStatsTable jugadores={jugadoresModo} modo={modo} cargando={cargando} error={error} />
        <PlayCatalog grupos={grupos} total={totalPases} modo={modo} cargando={cargando} error={error} />
      </div>

      <p className="mt-6 text-center text-[10px] text-niebla/60">
        Modo: {TITULOS_MODO[modo]} · los datos provienen de resumen_jugador_rol.csv y resumen_jugadas.csv
      </p>
    </div>
  )
}
