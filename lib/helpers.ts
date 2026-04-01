// ============================================================
// Helpers compartidos — Company OS
// Funciones de formato y cálculo seguro usadas en múltiples páginas
// ============================================================

/** División segura: devuelve 0 si el divisor es 0, negativo o NaN */
export function safeDivide(numerator: number, denominator: number): number {
  if (!denominator || denominator <= 0 || Number.isNaN(denominator)) return 0
  if (Number.isNaN(numerator)) return 0
  return numerator / denominator
}

/** Limita un valor entre min y max */
export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min
  return Math.min(Math.max(value, min), max)
}

/** Formato moneda español: 12.500 € */
export function formatMoney(amount: number): string {
  return (
    amount.toLocaleString('es-ES', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + ' €'
  )
}

/** Formato fecha DD/MM/YYYY */
export function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

/**
 * Calcula el nivel de urgencia de una OT en estado "Planificado".
 * Solo aplica cuando el mes de la OT es el actual o pasado.
 *
 * Días transcurridos desde el día 1 del mes de la OT:
 *   < 7          → null  (sin urgencia)
 *   7–13         → 'baja'  (amber)
 *   14–20        → 'media' (orange)
 *   ≥ 21         → 'alta'  (red)
 *   Mes pasado   → 'alta'  siempre (debería estar Confirmado)
 */
export type UrgenciaNivel = 'baja' | 'media' | 'alta'

export function getUrgenciaPlanificado(estado: string, mesAnio: string): UrgenciaNivel | null {
  if (estado !== 'Planificado') return null

  const today = new Date()
  const [y, m] = mesAnio.split('-').map(Number)
  const mesDate = new Date(y, m - 1, 1)

  // Mes futuro: sin urgencia
  if (mesDate > today) return null

  // Mes pasado (no es el mes actual): urgencia máxima
  const esActual =
    mesDate.getFullYear() === today.getFullYear() &&
    mesDate.getMonth() === today.getMonth()
  if (!esActual) return 'alta'

  // Mes actual: según el día
  const dia = today.getDate()
  if (dia < 7) return null
  if (dia < 14) return 'baja'
  if (dia < 21) return 'media'
  return 'alta'
}

/**
 * Resuelve las horas trabajables de una persona en un mes dado.
 * Prioridad: override por persona > override por departamento principal > general de empresa grupo.
 */
export function resolverHoras(
  personaId: string,
  mes: string,
  personaEmpresaGrupoId: string,
  personaDeptIds: string[],
  horasTrab: Array<{
    persona_id: string | null
    departamento_id: string | null
    empresa_grupo_id: string
    mes_trabajo: string
    horas: number
  }>,
): number {
  const overridePersona = horasTrab.find(
    (h) => h.persona_id === personaId && h.mes_trabajo === mes
  )
  if (overridePersona) return overridePersona.horas

  if (personaDeptIds.length > 0) {
    const overrideDepto = horasTrab.find(
      (h) => personaDeptIds.includes(h.departamento_id ?? '') && !h.persona_id && h.mes_trabajo === mes
    )
    if (overrideDepto) return overrideDepto.horas
  }

  const general = horasTrab.find(
    (h) => h.empresa_grupo_id === personaEmpresaGrupoId && !h.departamento_id && !h.persona_id && h.mes_trabajo === mes
  )
  return general?.horas ?? 0
}

/** Formato mes "Enero 2026" */
const meses = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

export function formatMonth(dateStr: string): string {
  const d = new Date(dateStr)
  return `${meses[d.getMonth()]} ${d.getFullYear()}`
}
