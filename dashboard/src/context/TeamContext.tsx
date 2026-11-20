import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { Kpis } from '../types'
import { TEAM_POR_ABBR } from '../data/teams'
import { fetchKpis } from '../lib/api'

const STORAGE_KEY = 'athena.equipo'

interface TeamContextValue {
  abbr: string | null
  equipo: ReturnType<typeof getEquipo>
  seleccionar: (abbr: string) => void
  limpiar: () => void
  kpis: Kpis | null
  kpisPorEquipo: Record<string, Kpis>
  cargandoKpis: boolean
  errorKpis: string | null
}

function getEquipo(abbr: string | null) {
  return abbr ? TEAM_POR_ABBR[abbr] ?? null : null
}

const TeamContext = createContext<TeamContextValue | null>(null)

export function TeamProvider({ children }: { children: ReactNode }) {
  const [abbr, setAbbr] = useState<string | null>(() => {
    try {
      return localStorage.getItem(STORAGE_KEY)
    } catch {
      return null
    }
  })
  const [kpisPorEquipo, setKpisPorEquipo] = useState<Record<string, Kpis>>({})
  const [cargandoKpis, setCargandoKpis] = useState(true)
  const [errorKpis, setErrorKpis] = useState<string | null>(null)

  useEffect(() => {
    let cancelado = false
    setCargandoKpis(true)
    fetchKpis()
      .then((data) => {
        if (!cancelado) {
          setKpisPorEquipo(data)
          setErrorKpis(null)
        }
      })
      .catch((e: unknown) => {
        if (!cancelado) setErrorKpis(e instanceof Error ? e.message : 'Error al cargar KPIs')
      })
      .finally(() => {
        if (!cancelado) setCargandoKpis(false)
      })
    return () => {
      cancelado = true
    }
  }, [])

  const seleccionar = (nuevo: string) => {
    setAbbr(nuevo)
    try {
      localStorage.setItem(STORAGE_KEY, nuevo)
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }

  const limpiar = () => {
    setAbbr(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* almacenamiento no disponible: se ignora */
    }
  }

  const equipo = getEquipo(abbr)
  const kpis = abbr ? kpisPorEquipo[abbr] ?? null : null

  const value = useMemo<TeamContextValue>(
    () => ({
      abbr,
      equipo,
      seleccionar,
      limpiar,
      kpis,
      kpisPorEquipo,
      cargandoKpis,
      errorKpis,
    }),
    [abbr, equipo, kpis, kpisPorEquipo, cargandoKpis, errorKpis],
  )

  return <TeamContext.Provider value={value}>{children}</TeamContext.Provider>
}

export function useTeam(): TeamContextValue {
  const ctx = useContext(TeamContext)
  if (!ctx) throw new Error('useTeam debe usarse dentro de <TeamProvider>')
  return ctx
}
