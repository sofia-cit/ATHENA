/** Elige texto legible (blanco o casi-negro) sobre un color hex de fondo. */
export function textoSobre(color: string): string {
  const hex = color.replace('#', '')
  if (hex.length < 6) return '#FFFFFF'
  const r = parseInt(hex.slice(0, 2), 16)
  const g = parseInt(hex.slice(2, 4), 16)
  const b = parseInt(hex.slice(4, 6), 16)
  // luminancia relativa (sRGB) simplificada
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  return lum > 0.62 ? '#0B1220' : '#FFFFFF'
}

/** Oscurece un hex al porcentaje dado (0..1). Usado para gradientes del badge. */
export function oscurecer(color: string, factor: number): string {
  const hex = color.replace('#', '')
  if (hex.length < 6) return color
  const r = Math.round(parseInt(hex.slice(0, 2), 16) * (1 - factor))
  const g = Math.round(parseInt(hex.slice(2, 4), 16) * (1 - factor))
  const b = Math.round(parseInt(hex.slice(4, 6), 16) * (1 - factor))
  const h = (n: number) => n.toString(16).padStart(2, '0')
  return `#${h(Math.max(0, r))}${h(Math.max(0, g))}${h(Math.max(0, b))}`
}
