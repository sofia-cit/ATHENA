import TeamGrid from '../components/TeamGrid'
import KpiPanel from '../components/KpiPanel'

interface Props {
  onIrAnalista: () => void
}

export default function EquipoView({ onIrAnalista }: Props) {
  return (
    <div className="pb-40">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <TeamGrid />
      </div>
      <KpiPanel onIrAnalista={onIrAnalista} />
    </div>
  )
}
