import { useEffect, useState } from 'react'
import type { Vista } from '../types'
import { useTeam } from '../context/TeamContext'
import EquipoRequerido from './EquipoRequerido'
import SituacionBar from '../components/SituacionBar'
import CampoTactico from '../components/CampoTactico'
import FichaJugador from '../components/FichaJugador'
import {
  ETIQUETAS_SITUACION,
  fetchSituacion,
  sugerencias,
  titularMasRendimiento,
  titulares,
  type JugadorSituacion,
  type Situacion,
} from '../lib/situacion'

interface Props {
  onVista: (v: Vista) => void
}

export default function CuadroSituacionalView({ onVista }: Props) {
  const { equipo } = useTeam()
  const [situacion, setSituacion] = useState<Situacion>({
    unidad: 'ataque',
    down: 1,
    distancia: 'medio',
    zona: 'mediocampo',
  })
  const [jugadores, setJugadores] = useState<JugadorSituacion[]>([])
  const [seleccionado, setSeleccionado] = useState<JugadorSituacion | null>(null)
  const [cargando, setCargando] = useState(true)

  const abbr = equipo?.abbr ?? null

  useEffect(() => {
    if (!abbr) return
    let cancelado = false
    setCargando(true)
    fetchSituacion(abbr, situacion)
      .then((data) => {
        if (cancelado) return
        setJugadores(data)
        setSeleccionado(titularMasRendimiento(data))
      })
      .catch(() => {
        if (!cancelado) {
          setJugadores([])
          setSeleccionado(null)
        }
      })
      .finally(() => {
        if (!cancelado) setCargando(false)
      })
    return () => {
      cancelado = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abbr, situacion.unidad, situacion.down, situacion.distancia, situacion.zona])

  if (!equipo) return <EquipoRequerido titulo="3. Cuadro Situacional" onVista={onVista} />

  const onceTitulares = titulares(jugadores)
  const suplentes = seleccionado ? sugerencias(jugadores, seleccionado.pff_positionLinedUp) : []

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <div className="mb-4">
        <h2 className="text-lg font-bold text-tinta">3. Cuadro Situacional</h2>
        <p className="text-sm text-niebla">
          Alineación inicial de <span className="font-semibold text-gold">{equipo.nombre}</span> por situación de juego.
        </p>
      </div>

      <div className="mb-4">
        <SituacionBar situacion={situacion} onChange={(patch) => setSituacion((s) => ({ ...s, ...patch }))} />
        <p className="mt-2 text-[11px] text-niebla">
          {ETIQUETAS_SITUACION.unidad[situacion.unidad]} · {situacion.down}° Down ·{' '}
          {ETIQUETAS_SITUACION.distancia[situacion.distancia]} · {ETIQUETAS_SITUACION.zona[situacion.zona]}
        </p>
      </div>

      <div className="grid gap-5 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-2">
          <CampoTactico
            jugadores={onceTitulares}
            unidad={situacion.unidad}
            zona={situacion.zona}
            teamAbbr={equipo.abbr}
            selected={seleccionado}
            onSelect={setSeleccionado}
          />
          <p className="text-[11px] text-niebla">
            11 titulares (rank_posicion = 1). La línea dorada marca la yarda de scrimmage según la zona; los
            nodos se posicionan con x_snap/y_snap (o coordenadas tácticas por posición como respaldo).
          </p>
        </div>
        <FichaJugador seleccionado={seleccionado} sugeridos={suplentes} cargando={cargando} />
      </div>
    </div>
  )
}
