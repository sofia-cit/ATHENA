import type { JugadorSituacion, Unidad, Zona } from '../lib/situacion'
import { ANCHO_CAMPO, LONGITUD_CAMPO, ZONA_LOS, posicionar } from '../lib/campo'
import { TEAM_POR_ABBR } from '../data/teams'
import { textoSobre } from '../lib/color'

interface Props {
  jugadores: JugadorSituacion[]
  unidad: Unidad
  zona: Zona
  teamAbbr: string
  selected: JugadorSituacion | null
  onSelect: (j: JugadorSituacion) => void
}

const LINEAS_10 = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 110]
const HASH_X = [15, 25, 35, 45, 55, 65, 75, 85, 95, 105]
const HASH_Y = [23.6, 29.7]

function yardDeX(x: number): number {
  return x <= 60 ? x - 10 : 110 - x
}

export default function CampoTactico({ jugadores, unidad, zona, teamAbbr, selected, onSelect }: Props) {
  const team = TEAM_POR_ABBR[teamAbbr]
  const color = team?.colores.primary ?? '#D6C59A'
  const fg = textoSobre(color)
  const los = ZONA_LOS[zona]

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-borde" style={{ aspectRatio: '120 / 53.3' }}>
      <svg viewBox={`0 0 ${LONGITUD_CAMPO} ${ANCHO_CAMPO}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
        {/* fondo */}
        <rect x={0} y={0} width={LONGITUD_CAMPO} height={ANCHO_CAMPO} fill="#0E3B2E" />
        {/* zonas de anotacion */}
        <rect x={0} y={0} width={10} height={ANCHO_CAMPO} fill="#0B3024" />
        <rect x={110} y={0} width={10} height={ANCHO_CAMPO} fill="#0B3024" />
        <rect x={0} y={0} width={10} height={ANCHO_CAMPO} fill="#2c6b54" opacity={0.06} />
        <rect x={110} y={0} width={10} height={ANCHO_CAMPO} fill="#2c6b54" opacity={0.06} />
        {/* lineas de yarda */}
        {LINEAS_10.map((x) => (
          <line
            key={`l${x}`}
            x1={x}
            y1={0}
            x2={x}
            y2={ANCHO_CAMPO}
            stroke={x === 60 ? '#5b8b78' : '#335f4f'}
            strokeWidth={x === 60 ? 0.6 : 0.3}
          />
        ))}
        {/* hashes */}
        {HASH_Y.map((y) =>
          HASH_X.map((x) => (
            <line key={`h${x}-${y}`} x1={x} y1={y - 0.5} x2={x} y2={y + 0.5} stroke="#335f4f" strokeWidth={0.3} />
          )),
        )}
        {/* numeros de yarda */}
        {[20, 30, 40, 50, 70, 80, 90, 100].map((x) => (
          <g key={`n${x}`} fill="#5b8b78">
            <text x={x} y={6} fontSize={2.2} textAnchor="middle">{yardDeX(x)}</text>
            <text x={x} y={ANCHO_CAMPO - 3} fontSize={2.2} textAnchor="middle">{yardDeX(x)}</text>
          </g>
        ))}
        <text x={60} y={6} fontSize={2.2} fill="#9fc3b4" textAnchor="middle">50</text>
        <text x={60} y={ANCHO_CAMPO - 3} fontSize={2.2} fill="#9fc3b4" textAnchor="middle">50</text>
        {/* etiquetas de zona */}
        <text x={5} y={ANCHO_CAMPO / 2} fontSize={2} fill="#3f6f5e" textAnchor="middle" transform={`rotate(-90 5 ${ANCHO_CAMPO / 2})`}>END ZONE</text>
        <text x={115} y={ANCHO_CAMPO / 2} fontSize={2} fill="#3f6f5e" textAnchor="middle" transform={`rotate(90 115 ${ANCHO_CAMPO / 2})`}>END ZONE</text>
        {/* linea de scrimmage */}
        <line x1={los} y1={1} x2={los} y2={ANCHO_CAMPO - 1} stroke="#D6C59A" strokeWidth={0.5} strokeDasharray="1.2 1" />
      </svg>

      {/* nodos de jugadores */}
      <div className="absolute inset-0">
        {jugadores.map((j) => {
          const { x, y } = posicionar(j, unidad, zona)
          const left = (x / LONGITUD_CAMPO) * 100
          const top = (y / ANCHO_CAMPO) * 100
          const labelAbove = y > ANCHO_CAMPO / 2
          const isSel = selected?.jerseyNumber === j.jerseyNumber && selected?.pff_positionLinedUp === j.pff_positionLinedUp
          return (
            <button
              key={`${j.jerseyNumber}-${j.pff_positionLinedUp}`}
              type="button"
              onClick={() => onSelect(j)}
              style={{ left: `${left}%`, top: `${top}%`, transform: 'translate(-50%, -50%)' }}
              className="group absolute z-10 focus:outline-none"
              title={`${j.displayName} · ${j.pff_positionLinedUp}`}
            >
              <span
                className="flex items-center justify-center rounded-full border text-[7px] font-bold leading-none transition group-hover:z-20"
                style={{
                  width: 22,
                  height: 22,
                  backgroundColor: color,
                  color: fg,
                  borderColor: isSel ? '#D6C59A' : 'rgba(255,255,255,0.25)',
                  boxShadow: isSel ? '0 0 0 2px #D6C59A, 0 4px 10px -2px rgba(214,197,154,0.6)' : undefined,
                  transform: isSel ? 'scale(1.12)' : 'scale(1)',
                }}
              >
                {j.pff_positionLinedUp.length > 3 ? j.pff_positionLinedUp.slice(0, 3) : j.pff_positionLinedUp}
              </span>
              <span
                className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-obsidiana/85 px-1 py-0.5 text-[8px] leading-none ${
                  labelAbove ? 'bottom-full mb-0.5' : 'top-full mt-0.5'
                } ${isSel ? 'font-bold text-gold' : 'text-niebla'}`}
              >
                #{j.jerseyNumber} {j.lastName}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
