// ============================================================
// Helpers — Módulo de Informes personalizados (Reportes)
//
// Genera tablas cruzando dos dimensiones (filas × columnas)
// con métricas seleccionables y filtros flexibles.
// ============================================================

import { safeDivide } from './helpers'
import type {
  OrdenTrabajo,
  Asignacion,
  Persona,
  Proyecto,
  Empresa,
  CuotaPlanificacion,
  Departamento,
  EmpresaGrupo,
  CatalogoServicio,
} from './supabase/types'

// ── Dimensiones y métricas disponibles ───────────────────────

export const DIMENSIONES = [
  { value: 'cliente', label: 'Cliente' },
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'persona', label: 'Persona' },
  { value: 'departamento', label: 'Departamento' },
  { value: 'servicio', label: 'Servicio' },
  { value: 'mes', label: 'Mes' },
  { value: 'empresa_grupo', label: 'Empresa Grupo' },
] as const

export type Dimension = (typeof DIMENSIONES)[number]['value']

export const METRICAS = [
  { value: 'ingresos_prev', label: 'Ingresos previstos (€)', format: 'money' },
  { value: 'ingresos_real', label: 'Ingresos reales (€)', format: 'money' },
  { value: 'pct_realizacion', label: '% Realización', format: 'pct' },
  { value: 'horas_plan', label: 'Horas planificadas', format: 'hours' },
  { value: 'horas_real', label: 'Horas reales', format: 'hours' },
  { value: 'euro_hora', label: '€/hora efectivo', format: 'money' },
  { value: 'num_ots', label: 'Nº OTs', format: 'int' },
  { value: 'num_asignaciones', label: 'Nº Asignaciones', format: 'int' },
] as const

export type Metrica = (typeof METRICAS)[number]['value']

// ── Tipos de resultado ───────────────────────────────────────

export type FilaReporte = {
  key: string
  label: string
  valores: Record<Metrica, number>
}

export type ResultadoReporte = {
  filas: FilaReporte[]
  totales: Record<Metrica, number>
}

// ── Filtros ──────────────────────────────────────────────────

export type FiltrosReporte = {
  mesDesde: string        // YYYY-MM-01
  mesHasta: string        // YYYY-MM-01
  empresaGrupoId: string | null
  tipoProyecto: 'todos' | 'facturable' | 'externo' | 'interno'
  estadoOT: string | null // null = todos
  departamentoId: string | null
  clienteId: string | null
}

// ── Datos crudos por asignación ─────────────────────────────

type FilaCruda = {
  clienteId: string
  clienteNombre: string
  proyectoId: string
  proyectoNombre: string
  personaId: string
  personaNombre: string
  departamentoId: string
  departamentoNombre: string
  servicioId: string
  servicioNombre: string
  empresaGrupoId: string
  empresaGrupoNombre: string
  mesAnio: string
  ingresosPrev: number
  ingresosReal: number
  horasPlan: number
  horasReal: number
  otId: string // para contar OTs únicas
}

// ── Generación de meses en rango ────────────────────────────

export function generarMesesEnRango(desde: string, hasta: string): string[] {
  const meses: string[] = []
  const [yD, mD] = desde.split('-').map(Number)
  const [yH, mH] = hasta.split('-').map(Number)
  let y = yD, m = mD
  while (y < yH || (y === yH && m <= mH)) {
    meses.push(`${y}-${String(m).padStart(2, '0')}-01`)
    m++
    if (m > 12) { m = 1; y++ }
  }
  return meses
}

// ── Construir filas crudas ──────────────────────────────────

export function buildFilasCrudas(
  asignaciones: Asignacion[],
  ordenes: OrdenTrabajo[],
  proyectos: Proyecto[],
  empresas: Empresa[],
  personas: Persona[],
  cuotas: CuotaPlanificacion[],
  departamentos: Departamento[],
  servicios: CatalogoServicio[],
  empresasGrupo: EmpresaGrupo[],
  filtros: FiltrosReporte,
): FilaCruda[] {
  // Maps O(1)
  const ordenMap = new Map(ordenes.map((o) => [o.id, o]))
  const proyectoMap = new Map(proyectos.map((p) => [p.id, p]))
  const empresaMap = new Map(empresas.map((e) => [e.id, e]))
  const personaMap = new Map(personas.map((p) => [p.id, p]))
  const cuotaMap = new Map(cuotas.map((c) => [c.id, c]))
  const deptoMap = new Map(departamentos.map((d) => [d.id, d]))
  const servicioMap = new Map(servicios.map((s) => [s.id, s]))
  const egMap = new Map(empresasGrupo.map((eg) => [eg.id, eg]))

  const mesesValidos = new Set(generarMesesEnRango(filtros.mesDesde, filtros.mesHasta))

  const filas: FilaCruda[] = []

  for (const a of asignaciones) {
    const orden = ordenMap.get(a.orden_trabajo_id)
    if (!orden) continue
    if (!mesesValidos.has(orden.mes_anio)) continue
    if (filtros.estadoOT && filtros.estadoOT !== 'Todos' && orden.estado !== filtros.estadoOT) continue

    const proyecto = proyectoMap.get(orden.proyecto_id)
    if (!proyecto) continue
    if (filtros.empresaGrupoId && proyecto.empresa_grupo_id !== filtros.empresaGrupoId) continue
    if (filtros.tipoProyecto === 'facturable' && proyecto.tipo_proyecto !== 'Facturable') continue
    if (filtros.tipoProyecto === 'externo' && proyecto.tipo_proyecto !== 'Externo') continue
    if (filtros.tipoProyecto === 'interno' && proyecto.tipo_proyecto !== 'Interno') continue
    if (filtros.departamentoId && orden.departamento_id !== filtros.departamentoId) continue
    if (filtros.clienteId && proyecto.empresa_id !== filtros.clienteId) continue

    const cuota = cuotaMap.get(a.cuota_planificacion_id)
    if (!cuota) continue

    const empresa = proyecto.empresa_id ? empresaMap.get(proyecto.empresa_id) : null
    const persona = personaMap.get(a.persona_id)
    const depto = deptoMap.get(orden.departamento_id)
    const servicio = orden.servicio_id ? servicioMap.get(orden.servicio_id) : null
    const eg = egMap.get(proyecto.empresa_grupo_id)

    const ingPrev = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
    const ingReal = orden.partida_real !== null ? orden.partida_real * (a.porcentaje_ppto_tm / 100) : 0
    const hPlan = safeDivide(ingPrev, cuota.precio_hora)

    filas.push({
      clienteId: proyecto.empresa_id ?? '_interno',
      clienteNombre: empresa ? (empresa.nombre_interno ?? empresa.nombre_legal) : 'Proyecto interno',
      proyectoId: proyecto.id,
      proyectoNombre: proyecto.titulo,
      personaId: a.persona_id,
      personaNombre: persona?.persona ?? '—',
      departamentoId: orden.departamento_id,
      departamentoNombre: depto?.nombre ?? '—',
      servicioId: orden.servicio_id ?? '_sin_servicio',
      servicioNombre: servicio?.nombre ?? 'Sin servicio',
      empresaGrupoId: proyecto.empresa_grupo_id,
      empresaGrupoNombre: eg?.nombre ?? '—',
      mesAnio: orden.mes_anio,
      ingresosPrev: ingPrev,
      ingresosReal: ingReal,
      horasPlan: hPlan,
      horasReal: a.horas_reales ?? 0,
      otId: orden.id,
    })
  }

  return filas
}

// ── Resolver dimensión → key + label ────────────────────────

function resolverDimension(fila: FilaCruda, dimension: Dimension): { key: string; label: string } {
  switch (dimension) {
    case 'cliente':
      return { key: fila.clienteId, label: fila.clienteNombre }
    case 'proyecto':
      return { key: fila.proyectoId, label: `${fila.clienteNombre} — ${fila.proyectoNombre}` }
    case 'persona':
      return { key: fila.personaId, label: fila.personaNombre }
    case 'departamento':
      return { key: fila.departamentoId, label: fila.departamentoNombre }
    case 'servicio':
      return { key: fila.servicioId, label: fila.servicioNombre }
    case 'mes': {
      const [y, m] = fila.mesAnio.split('-').map(Number)
      const label = new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
      return { key: fila.mesAnio, label }
    }
    case 'empresa_grupo':
      return { key: fila.empresaGrupoId, label: fila.empresaGrupoNombre }
  }
}

// ── Calcular métricas agregadas ─────────────────────────────

function agregarMetricas(filas: FilaCruda[]): Record<Metrica, number> {
  const ingPrev = filas.reduce((s, f) => s + f.ingresosPrev, 0)
  const ingReal = filas.reduce((s, f) => s + f.ingresosReal, 0)
  const hPlan = filas.reduce((s, f) => s + f.horasPlan, 0)
  const hReal = filas.reduce((s, f) => s + f.horasReal, 0)
  const otsUnicas = new Set(filas.map((f) => f.otId)).size

  return {
    ingresos_prev: ingPrev,
    ingresos_real: ingReal,
    pct_realizacion: safeDivide(ingReal, ingPrev) * 100,
    horas_plan: hPlan,
    horas_real: hReal,
    euro_hora: safeDivide(ingReal > 0 ? ingReal : ingPrev, hPlan),
    num_ots: otsUnicas,
    num_asignaciones: filas.length,
  }
}

// ── Generar reporte agrupado por una dimensión ──────────────

export function generarReporte(
  filasCrudas: FilaCruda[],
  dimension: Dimension,
): ResultadoReporte {
  // Agrupar
  const grupos = new Map<string, { label: string; filas: FilaCruda[] }>()
  for (const f of filasCrudas) {
    const { key, label } = resolverDimension(f, dimension)
    const existing = grupos.get(key)
    if (existing) {
      existing.filas.push(f)
    } else {
      grupos.set(key, { label, filas: [f] })
    }
  }

  // Filas resultado
  const filas: FilaReporte[] = [...grupos.entries()]
    .map(([key, { label, filas: group }]) => ({
      key,
      label,
      valores: agregarMetricas(group),
    }))
    .sort((a, b) => a.label.localeCompare(b.label))

  return {
    filas,
    totales: agregarMetricas(filasCrudas),
  }
}

// ── Formatear valores ───────────────────────────────────────

export function formatearValor(valor: number, formato: string): string {
  switch (formato) {
    case 'money':
      return valor.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    case 'pct':
      return valor.toFixed(1) + '%'
    case 'hours':
      return valor.toFixed(1) + 'h'
    case 'int':
      return String(Math.round(valor))
    default:
      return valor.toFixed(2)
  }
}

// ── Generar CSV ─────────────────────────────────────────────

export function generarCSV(
  resultado: ResultadoReporte,
  dimensionLabel: string,
  metricasSeleccionadas: Metrica[],
): string {
  const metricasMeta = METRICAS.filter((m) => metricasSeleccionadas.includes(m.value))
  const headers = [dimensionLabel, ...metricasMeta.map((m) => m.label)]

  const rows = resultado.filas.map((fila) => [
    `"${fila.label.replace(/"/g, '""')}"`,
    ...metricasMeta.map((m) => {
      const val = fila.valores[m.value]
      // CSV sin formato visual, solo números
      return m.format === 'pct' ? val.toFixed(1) : m.format === 'hours' ? val.toFixed(1) : String(Math.round(val * 100) / 100)
    }),
  ])

  // Fila de totales
  const totalRow = [
    '"TOTAL"',
    ...metricasMeta.map((m) => {
      const val = resultado.totales[m.value]
      return m.format === 'pct' ? val.toFixed(1) : m.format === 'hours' ? val.toFixed(1) : String(Math.round(val * 100) / 100)
    }),
  ]

  return [headers.join(';'), ...rows.map((r) => r.join(';')), totalRow.join(';')].join('\n')
}
