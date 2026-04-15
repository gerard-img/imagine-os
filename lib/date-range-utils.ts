// ============================================================
// Utilidades puras para rangos de meses — Company OS
//
// Funciones sin React ni DOM, seguras para usar en Server
// Components y Server Actions.
// ============================================================

export interface DateRange {
  desde: string // "YYYY-MM-01"
  hasta: string // "YYYY-MM-01"
}

export function toMonthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

export function parseMonth(dateStr: string): { year: number; month: number } {
  const d = new Date(dateStr + 'T00:00:00')
  return { year: d.getFullYear(), month: d.getMonth() }
}

export function shiftMonths(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + delta)
  return toMonthStr(d.getFullYear(), d.getMonth())
}

export function monthsBetween(desde: string, hasta: string): number {
  const d = parseMonth(desde)
  const h = parseMonth(hasta)
  return (h.year - d.year) * 12 + (h.month - d.month)
}

/** Genera array de meses entre desde y hasta (inclusivos) */
export function generateMonthRange(desde: string, hasta: string): string[] {
  const meses: string[] = []
  const d = parseMonth(desde)
  const h = parseMonth(hasta)
  let year = d.year
  let month = d.month

  while (year < h.year || (year === h.year && month <= h.month)) {
    meses.push(toMonthStr(year, month))
    month++
    if (month > 11) { month = 0; year++ }
  }

  return meses
}

/** Calcula el rango "anterior equivalente" para comparación de KPIs */
export function rangoPrevioEquivalente(desde: string, hasta: string): DateRange {
  const nMeses = monthsBetween(desde, hasta) + 1
  const nuevaHasta = shiftMonths(desde, -1)
  const nuevaDesde = shiftMonths(nuevaHasta, -(nMeses - 1))
  return { desde: nuevaDesde, hasta: nuevaHasta }
}

/** Devuelve el mes actual como rango por defecto */
export function defaultDateRange(): DateRange {
  const now = new Date()
  const mes = toMonthStr(now.getFullYear(), now.getMonth())
  return { desde: mes, hasta: mes }
}

/**
 * Rango extendido que el servidor debe cargar para que el cliente
 * pueda calcular todas sus vistas sin tener que volver al servidor:
 *
 *  - Rango seleccionado (desde..hasta).
 *  - Rango previo equivalente (para deltas de KPIs).
 *  - Año natural completo del "desde" (heatmap y gráficos mensuales).
 *  - 6 meses antes del "hasta" (sparklines).
 *
 * Devuelve el rango mínimo que cubre todos los casos anteriores.
 */
export function rangoParaServidor(desde: string, hasta: string): DateRange {
  const prev = rangoPrevioEquivalente(desde, hasta)
  const { year: anioDesde } = parseMonth(desde)
  const inicioAnio = toMonthStr(anioDesde, 0)
  const finAnio = toMonthStr(anioDesde, 11)
  const sparklineDesde = shiftMonths(hasta, -5)

  const candidatosDesde = [desde, prev.desde, inicioAnio, sparklineDesde]
  const candidatosHasta = [hasta, prev.hasta, finAnio]

  const minDesde = candidatosDesde.reduce((a, b) => (a < b ? a : b))
  const maxHasta = candidatosHasta.reduce((a, b) => (a > b ? a : b))

  return { desde: minDesde, hasta: maxHasta }
}
