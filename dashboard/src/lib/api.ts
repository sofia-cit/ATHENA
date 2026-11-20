import type { Kpis } from '../types'

// Ruta relativa SIN diagonal inicial (regla del hackathon). En desarrollo Vite
// hace proxy de /api al backend; en produccion el mismo servidor sirve API y build.
const BASE = 'api'

export async function fetchKpis(): Promise<Record<string, Kpis>> {
  const res = await fetch(`${BASE}/kpis`)
  if (!res.ok) throw new Error(`Error ${res.status} al cargar KPIs`)
  const data = (await res.json()) as Record<string, Kpis>
  return data ?? {}
}
