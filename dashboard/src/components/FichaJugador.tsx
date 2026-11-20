import type { JugadorSituacion } from '../lib/situacion'

interface Props {
  seleccionado: JugadorSituacion | null
  sugeridos: JugadorSituacion[]
  cargando: boolean
}

function fmtPct(v: number) {
  return `${(v * 100).toFixed(1)}%`
}

/** Compara una metrica del titular vs el suplente; mejor=alto significa que mas es mejor. */
function Metrica({
  label,
  titular,
  sup,
  mejor = 'alto',
  fmt = 'num',
}: {
  label: string
  titular: number
  sup: number
  mejor?: 'alto' | 'bajo'
  fmt?: 'num' | 'pct'
}) {
  const tStr = fmt === 'pct' ? fmtPct(titular) : titular.toLocaleString('es-MX')
  const sStr = fmt === 'pct' ? fmtPct(sup) : sup.toLocaleString('es-MX')
  const supMejor = mejor === 'alto' ? sup > titular : sup < titular
  return (
    <div className="flex items-center justify-between py-1 text-[11px]">
      <span className="text-niebla">{label}</span>
      <span className="flex items-center gap-1.5 tabular-nums">
        <span className="text-niebla">{tStr}</span>
        <svg className="h-3 w-3 text-niebla/50" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 6h6M6.5 3l2.5 3-2.5 3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span className={supMejor ? 'font-semibold text-gold' : 'text-tinta'}>{sStr}</span>
      </span>
    </div>
  )
}

export default function FichaJugador({ seleccionado, sugeridos, cargando }: Props) {
  if (cargando) {
    return <div className="rounded-xl border border-borde bg-pizarra p-6 text-center text-xs text-niebla">Cargando…</div>
  }
  if (!seleccionado) {
    return (
      <div className="flex h-full min-h-[16rem] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-borde bg-pizarra p-6 text-center text-xs text-niebla">
        <span>Selecciona un jugador del campo para ver su ficha.</span>
      </div>
    )
  }

  return (
    <section className="flex flex-col gap-4 rounded-xl border border-borde bg-pizarra p-4">
      {/* Ficha del titular */}
      <div>
        <div className="mb-3 flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-full text-xs font-bold"
            style={{ backgroundColor: '#D6C59A', color: '#070C16' }}
          >
            #{seleccionado.jerseyNumber}
          </span>
          <div className="min-w-0">
            <div className="truncate text-base font-bold text-tinta">{seleccionado.displayName}</div>
            <div className="text-[11px] text-niebla">
              {seleccionado.pff_positionLinedUp} · Titular (rank 1)
            </div>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-lg border border-borde bg-obsidiana/60 px-2 py-2 text-center">
            <div className="text-lg font-bold tabular-nums text-tinta">{seleccionado.snaps}</div>
            <div className="text-[10px] uppercase tracking-wide text-niebla">Snaps</div>
          </div>
          <div className="rounded-lg border border-borde bg-obsidiana/60 px-2 py-2 text-center">
            <div className="text-lg font-bold tabular-nums text-gold">{seleccionado.score_rendimiento.toFixed(1)}</div>
            <div className="text-[10px] uppercase tracking-wide text-niebla">Rendimiento</div>
          </div>
          <div className="rounded-lg border border-borde bg-obsidiana/60 px-2 py-2 text-center">
            <div className="text-lg font-bold tabular-nums text-tinta">{fmtPct(seleccionado.tasa_exito)}</div>
            <div className="text-[10px] uppercase tracking-wide text-niebla">Éxito</div>
          </div>
        </div>
      </div>

      {/* Suplentes sugeridos */}
      <div className="border-t border-borde pt-3">
        <h4 className="mb-1 text-xs font-bold text-tinta">Suplentes sugeridos</h4>
        <p className="mb-2 text-[10px] text-niebla">
          rank_posicion 2 y 3 en {seleccionado.pff_positionLinedUp}, comparados frente al titular.
        </p>
        {sugeridos.length === 0 ? (
          <div className="rounded-lg border border-dashed border-borde px-3 py-4 text-center text-[11px] text-niebla">
            Sin suplentes registrados para esta posición.
          </div>
        ) : (
          <div className="space-y-2">
            {sugeridos.map((s) => (
              <div key={`${s.jerseyNumber}-${s.pff_positionLinedUp}`} className="rounded-lg border border-borde bg-obsidiana/40 px-3 py-2">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-xs font-semibold text-tinta">
                    #{s.jerseyNumber} {s.lastName}
                  </span>
                  <span className="rounded bg-gold/15 px-1.5 py-0.5 text-[9px] font-semibold text-gold">
                    rank {s.rank_posicion}
                  </span>
                </div>
                <Metrica label="Snaps" titular={seleccionado.snaps} sup={s.snaps} />
                <Metrica label="Rendimiento" titular={seleccionado.score_rendimiento} sup={s.score_rendimiento} fmt="num" />
                <Metrica label="Tasa éxito" titular={seleccionado.tasa_exito} sup={s.tasa_exito} fmt="pct" />
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
