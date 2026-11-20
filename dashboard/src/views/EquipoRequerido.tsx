import type { Vista } from '../types'

interface Props {
  titulo: string
  onVista: (v: Vista) => void
}

export default function EquipoRequerido({ titulo, onVista }: Props) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="text-lg font-bold text-tinta">{titulo}</h2>
      <div className="mt-6 flex min-h-[16rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-borde bg-pizarra p-10 text-center">
        <svg className="h-10 w-10 text-gold/50" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 7l9 5 9-5" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="3" y="5" width="18" height="14" rx="2" />
        </svg>
        <p className="max-w-sm text-sm text-niebla">
          Primero selecciona un equipo en la pantalla <strong className="text-tinta">1. Equipo</strong> para ver
          esta sección.
        </p>
        <button
          type="button"
          onClick={() => onVista('equipo')}
          className="rounded-lg bg-gradient-to-b from-gold-hover to-gold px-4 py-2 text-sm font-bold text-obsidiana shadow-gold-glow transition hover:brightness-[1.05] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-2 focus-visible:ring-offset-obsidiana"
        >
          Ir a seleccionar equipo
        </button>
      </div>
    </div>
  )
}
