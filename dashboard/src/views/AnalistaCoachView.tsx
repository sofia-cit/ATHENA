import type { Vista } from '../types'
import { useTeam } from '../context/TeamContext'
import EquipoRequerido from './EquipoRequerido'

interface Props {
  onVista: (v: Vista) => void
}

export default function AnalistaCoachView({ onVista }: Props) {
  const { equipo } = useTeam()
  if (!equipo) return <EquipoRequerido titulo="2. Analista Coach" onVista={onVista} />

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-6">
        <h2 className="text-lg font-bold text-tinta">2. Analista Coach</h2>
        <p className="text-sm text-niebla">
          Asistente de análisis para <span className="font-semibold text-gold">{equipo.nombre}</span>.
        </p>
      </div>
      <div className="flex min-h-[16rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-borde bg-pizarra p-10 text-center">
        <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
          En construcción
        </span>
        <p className="max-w-md text-sm text-niebla">
          Aquí irá el Analista Coach: análisis de jugadas, patrones y recomendaciones
          del equipo seleccionado. Esta pantalla se desarrolla en la siguiente etapa.
        </p>
      </div>
    </div>
  )
}
