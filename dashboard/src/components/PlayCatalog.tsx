import { useState } from 'react'
import type { GrupoCatalogo, ModoAnalisis } from '../lib/analista'
import { TITULOS_MODO } from '../lib/analista'

interface Props {
  grupos: GrupoCatalogo[]
  total: number
  modo: ModoAnalisis
  cargando: boolean
  error: string | null
}

const ETIQUETAS: Record<string, string> = {
  offenseFormation: 'Formación',
  personnelO: 'Personal O',
  dropBackType: 'Dropback',
  pff_passCoverage: 'Cobertura',
  personnelD: 'Personal D',
}

export default function PlayCatalog({ grupos, total, modo, cargando, error }: Props) {
  const [expandidos, setExpandidos] = useState<Record<string, boolean>>({})

  const toggle = (clave: string) => setExpandidos((e) => ({ ...e, [clave]: !e[clave] }))

  return (
    <section className="flex min-w-0 flex-col rounded-xl border border-borde bg-pizarra">
      <div className="border-b border-borde px-4 py-3">
        <h3 className="text-sm font-bold text-tinta">Catálogo de jugadas</h3>
        <p className="text-[11px] text-niebla">
          {TITULOS_MODO[modo]} · {grupos.length} esquemas · {total} jugadas de pase
        </p>
      </div>

      {cargando ? (
        <div className="px-4 py-8 text-center text-xs text-niebla">Cargando catálogo…</div>
      ) : error ? (
        <div className="px-4 py-8 text-center text-xs text-amber-300">No se pudieron cargar jugadas: {error}</div>
      ) : grupos.length === 0 ? (
        <div className="px-4 py-8 text-center text-xs text-niebla">
          Sin jugadas de pase para este equipo y modo todavía.
        </div>
      ) : (
        <div className="max-h-[640px] divide-y divide-borde/60 overflow-y-auto">
          {grupos.map((g) => {
            const abierto = expandidos[g.clave]
            return (
              <article key={g.clave} className="px-4 py-3 transition hover:bg-white/[0.02]">
                <button
                  type="button"
                  onClick={() => toggle(g.clave)}
                  aria-expanded={abierto}
                  className="flex w-full items-start gap-3 text-left focus:outline-none"
                >
                  <svg
                    className={`mt-0.5 h-4 w-4 shrink-0 text-niebla transition ${abierto ? 'rotate-90' : ''}`}
                    viewBox="0 0 12 12"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M4 2l4 4-4 4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs font-semibold text-tinta">{g.clave}</div>
                    <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px]">
                      <span className="text-niebla">
                        Frecuencia{' '}
                        <b className="text-tinta tabular-nums">
                          {g.conteo} · {g.frecuenciaPct.toFixed(1)}%
                        </b>
                      </span>
                      <span className="text-niebla">
                        Yds/jugada <b className="text-tinta tabular-nums">{g.avgPlayResult.toFixed(2)}</b>
                      </span>
                      <span className="text-niebla">
                        Completos <b className="text-gold tabular-nums">{(g.tasaCompletos * 100).toFixed(1)}%</b>
                      </span>
                    </div>
                  </div>
                </button>
                {abierto && (
                  <div className="mt-2 ml-7 space-y-2 border-l border-gold/30 pl-3">
                    <div className="flex flex-wrap gap-1.5">
                      {Object.entries(g.campos).map(([k, v]) => (
                        <span
                          key={k}
                          className="rounded-md border border-borde bg-obsidiana/60 px-1.5 py-0.5 text-[10px] text-niebla"
                        >
                          {ETIQUETAS[k] ?? k}: <span className="text-tinta">{v}</span>
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] italic leading-relaxed text-niebla">
                      <span className="not-italic text-gold">Ejemplo · </span>
                      {g.ejemplo}
                    </p>
                  </div>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
