import type { Distancia, Situacion, Unidad, Zona } from '../lib/situacion'

interface Props {
  situacion: Situacion
  onChange: (patch: Partial<Situacion>) => void
}

function Grupo<T extends string | number>({
  label,
  opciones,
  valor,
  onSelect,
}: {
  label: string
  opciones: { id: T; label: string }[]
  valor: T
  onSelect: (v: T) => void
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-niebla">{label}</span>
      <div className="flex items-center gap-1 rounded-lg border border-borde bg-obsidiana p-0.5">
        {opciones.map((o) => {
          const activo = o.id === valor
          return (
            <button
              key={String(o.id)}
              type="button"
              onClick={() => onSelect(o.id)}
              className={
                'rounded-md px-2.5 py-1 text-xs font-semibold transition ' +
                (activo
                  ? 'bg-pizarra text-tinta shadow-sm ring-1 ring-gold/40'
                  : 'text-niebla hover:bg-pizarra/60 hover:text-tinta')
              }
            >
              {o.label}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function SituacionBar({ situacion, onChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-3 rounded-xl border border-borde bg-pizarra px-4 py-3">
      <Grupo<Unidad>
        label="Unidad"
        valor={situacion.unidad}
        onSelect={(v) => onChange({ unidad: v })}
        opciones={[
          { id: 'ataque', label: 'Ataque' },
          { id: 'defensa', label: 'Defensa' },
        ]}
      />
      <Grupo<number>
        label="Down"
        valor={situacion.down}
        onSelect={(v) => onChange({ down: v as 1 | 2 | 3 | 4 })}
        opciones={[
          { id: 1, label: '1' },
          { id: 2, label: '2' },
          { id: 3, label: '3' },
          { id: 4, label: '4' },
        ]}
      />
      <Grupo<Distancia>
        label="Distancia"
        valor={situacion.distancia}
        onSelect={(v) => onChange({ distancia: v })}
        opciones={[
          { id: 'corto', label: 'Corto 1-3' },
          { id: 'medio', label: 'Medio 4-6' },
          { id: 'largo', label: 'Largo 7+' },
        ]}
      />
      <Grupo<Zona>
        label="Zona"
        valor={situacion.zona}
        onSelect={(v) => onChange({ zona: v })}
        opciones={[
          { id: 'salida', label: 'Salida' },
          { id: 'mediocampo', label: 'Medio Campo' },
          { id: 'redzone', label: 'Red Zone' },
        ]}
      />
    </div>
  )
}
