import { useState } from 'react'
import type { Vista } from './types'
import { TeamProvider } from './context/TeamContext'
import Header from './components/Header'
import EquipoView from './views/EquipoView'
import AnalistaCoachView from './views/AnalistaCoachView'
import CuadroSituacionalView from './views/CuadroSituacionalView'

export default function App() {
  const [vista, setVista] = useState<Vista>('equipo')

  return (
    <TeamProvider>
      <div className="min-h-screen bg-obsidiana text-tinta">
        <Header vista={vista} onVista={setVista} />
        <main>
          {vista === 'equipo' && <EquipoView onIrAnalista={() => setVista('analista')} />}
          {vista === 'analista' && <AnalistaCoachView onVista={setVista} />}
          {vista === 'cuadro' && <CuadroSituacionalView onVista={setVista} />}
        </main>
      </div>
    </TeamProvider>
  )
}
