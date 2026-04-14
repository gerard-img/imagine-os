// ============================================================
// Helpers — Módulo de Informes (constructor multidimensional)
//
// Fase 2: jerarquías en filas y columnas.
//   Filas: N dimensiones ordenadas (ej: Cliente > Proyecto)
//   Columnas: N dimensiones ordenadas (ej: Año > Mes)
//   Métricas: múltiples, se muestran en cada celda
// ============================================================

import { safeDivide } from './helpers'
import type {
  OrdenTrabajo, Asignacion, Persona, Proyecto, Empresa,
  CuotaPlanificacion, Departamento, EmpresaGrupo, CatalogoServicio,
} from './supabase/types'

// ── Dimensiones unificadas ──────────────────────────────────
// Cualquier dimensión puede usarse en filas o columnas.

export const TODAS_DIMENSIONES = [
  { value: 'cliente', label: 'Cliente', tipo: 'entidad' as const },
  { value: 'proyecto', label: 'Proyecto', tipo: 'entidad' as const },
  { value: 'persona', label: 'Persona', tipo: 'entidad' as const },
  { value: 'departamento', label: 'Departamento', tipo: 'entidad' as const },
  { value: 'servicio', label: 'Servicio', tipo: 'entidad' as const },
  { value: 'empresa_grupo', label: 'Empresa Grupo', tipo: 'entidad' as const },
  { value: 'anio', label: 'Año', tipo: 'tiempo' as const },
  { value: 'trimestre', label: 'Trimestre', tipo: 'tiempo' as const },
  { value: 'mes', label: 'Mes', tipo: 'tiempo' as const },
] as const

export type DimensionEje = (typeof TODAS_DIMENSIONES)[number]['value']

const DIMS_TIEMPO = new Set<string>(['anio', 'trimestre', 'mes'])

export function esDimensionTiempo(d: DimensionEje): boolean {
  return DIMS_TIEMPO.has(d)
}

export function labelDimension(d: DimensionEje): string {
  return TODAS_DIMENSIONES.find((x) => x.value === d)?.label ?? d
}

// ── Métricas ────────────────────────────────────────────────

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

// ── Configuración del informe ───────────────────────────────

export type ConfigInforme = {
  filas: DimensionEje[]       // al menos 1
  columnas: DimensionEje[]    // 0 = sin eje de columnas
  metricas: Metrica[]         // al menos 1
}

// ── Tipos de resultado jerárquico ───────────────────────────

export type CeldaMetricas = Record<Metrica, number>

export type NodoFila = {
  key: string                              // path completo (ej: "clienteA/proyecto1")
  label: string
  nivel: number
  celdas: Map<string, CeldaMetricas>       // colLeafKey → métricas
  totalesFila: CeldaMetricas
  children: NodoFila[]
}

export type NodoColumna = {
  key: string
  label: string
  children: NodoColumna[]
  span: number                             // nº de hojas descendientes (para colspan)
}

export type ResultadoJerarquico = {
  filas: NodoFila[]
  columnasArbol: NodoColumna[]             // árbol para headers multinivel
  columnasHoja: { key: string; label: string }[]
  nivelesColumna: number
  totalesPorColumna: Map<string, CeldaMetricas>
  totalGeneral: CeldaMetricas
}

// ── Filtros ─────────────────────────────────────────────────

export type FiltrosReporte = {
  mesDesde: string
  mesHasta: string
  empresaGrupoId: string | null
  tipoProyecto: 'todos' | 'facturable' | 'externo' | 'interno'
  estadoOT: string | null
  departamentoId: string | null
  clienteId: string | null
}

// ── Datos crudos ────────────────────────────────────────────

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
  otId: string
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
  asignaciones: Asignacion[], ordenes: OrdenTrabajo[],
  proyectos: Proyecto[], empresas: Empresa[], personas: Persona[],
  cuotas: CuotaPlanificacion[], departamentos: Departamento[],
  servicios: CatalogoServicio[], empresasGrupo: EmpresaGrupo[],
  filtros: FiltrosReporte,
): FilaCruda[] {
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
    if (!orden || !mesesValidos.has(orden.mes_anio)) continue
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
      horasPlan: safeDivide(ingPrev, cuota.precio_hora),
      horasReal: a.horas_reales ?? 0,
      otId: orden.id,
    })
  }
  return filas
}

// ── Resolver dimensión ──────────────────────────────────────

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function resolverDim(fila: FilaCruda, dim: DimensionEje): { key: string; label: string } {
  const [y, m] = fila.mesAnio.split('-').map(Number)
  switch (dim) {
    case 'cliente': return { key: fila.clienteId, label: fila.clienteNombre }
    case 'proyecto': return { key: fila.proyectoId, label: fila.proyectoNombre }
    case 'persona': return { key: fila.personaId, label: fila.personaNombre }
    case 'departamento': return { key: fila.departamentoId, label: fila.departamentoNombre }
    case 'servicio': return { key: fila.servicioId, label: fila.servicioNombre }
    case 'empresa_grupo': return { key: fila.empresaGrupoId, label: fila.empresaGrupoNombre }
    case 'anio': return { key: String(y), label: String(y) }
    case 'trimestre': { const q = Math.ceil(m / 3); return { key: `${y}-Q${q}`, label: `T${q} ${y}` } }
    case 'mes': return { key: fila.mesAnio, label: `${MESES_CORTOS[m - 1]} ${y}` }
  }
}

/** Label corto para columnas anidadas bajo un padre temporal (elimina año redundante) */
function labelCorto(dim: DimensionEje, key: string): string {
  switch (dim) {
    case 'trimestre': return `T${key.split('Q')[1]}`
    case 'mes': { const m = Number(key.split('-')[1]); return MESES_CORTOS[m - 1] }
    default: return key
  }
}

// ── Agregar métricas ────────────────────────────────────────

function agregarMetricas(filas: FilaCruda[]): CeldaMetricas {
  const ingPrev = filas.reduce((s, f) => s + f.ingresosPrev, 0)
  const ingReal = filas.reduce((s, f) => s + f.ingresosReal, 0)
  const hPlan = filas.reduce((s, f) => s + f.horasPlan, 0)
  const hReal = filas.reduce((s, f) => s + f.horasReal, 0)
  return {
    ingresos_prev: ingPrev,
    ingresos_real: ingReal,
    pct_realizacion: safeDivide(ingReal, ingPrev) * 100,
    horas_plan: hPlan,
    horas_real: hReal,
    euro_hora: safeDivide(ingReal > 0 ? ingReal : ingPrev, hPlan),
    num_ots: new Set(filas.map((f) => f.otId)).size,
    num_asignaciones: filas.length,
  }
}

function celdaVacia(): CeldaMetricas {
  return { ingresos_prev: 0, ingresos_real: 0, pct_realizacion: 0, horas_plan: 0, horas_real: 0, euro_hora: 0, num_ots: 0, num_asignaciones: 0 }
}

// ── Generar reporte jerárquico ──────────────────────────────

type DatoIndexado = {
  fila: FilaCruda
  filaKeys: string[]
  filaLabels: string[]
  colLeafKey: string
}

export function generarReporteJerarquico(
  filasCrudas: FilaCruda[],
  config: ConfigInforme,
): ResultadoJerarquico {
  const tieneColumnas = config.columnas.length > 0

  // 1. Resolver paths para cada fila cruda
  const datos: DatoIndexado[] = filasCrudas.map((f) => {
    const filaResolved = config.filas.map((d) => resolverDim(f, d))
    const colResolved = config.columnas.map((d) => resolverDim(f, d))
    return {
      fila: f,
      filaKeys: filaResolved.map((r) => r.key),
      filaLabels: filaResolved.map((r) => r.label),
      colLeafKey: tieneColumnas ? colResolved.map((r) => r.key).join('/') : '__total__',
    }
  })

  // 2. Árbol de columnas
  let columnasArbol: NodoColumna[] = []
  let columnasHoja: { key: string; label: string }[] = []

  if (tieneColumnas) {
    const colPaths = datos.map((d) => ({
      keys: config.columnas.map((dim) => resolverDim(d.fila, dim).key),
      labels: config.columnas.map((dim) => resolverDim(d.fila, dim).label),
    }))
    columnasArbol = buildColumnTree(colPaths, config.columnas, 0)
    columnasHoja = getLeafColumns(columnasArbol, '')
  }
  const colHojaKeys = tieneColumnas ? columnasHoja.map((c) => c.key) : ['__total__']

  // 3. Árbol de filas
  const filas = buildRowTree(datos, config.filas.length, 0, colHojaKeys, '')

  // 4. Totales por columna
  const totalesPorColumna = new Map<string, CeldaMetricas>()
  for (const colKey of colHojaKeys) {
    const filasCol = datos.filter((d) => d.colLeafKey === colKey).map((d) => d.fila)
    totalesPorColumna.set(colKey, filasCol.length > 0 ? agregarMetricas(filasCol) : celdaVacia())
  }

  return {
    filas,
    columnasArbol,
    columnasHoja,
    nivelesColumna: config.columnas.length,
    totalesPorColumna,
    totalGeneral: filasCrudas.length > 0 ? agregarMetricas(filasCrudas) : celdaVacia(),
  }
}

// ── Construir árbol de columnas ─────────────────────────────

function buildColumnTree(
  paths: { keys: string[]; labels: string[] }[],
  dimensiones: DimensionEje[],
  nivel: number,
): NodoColumna[] {
  if (nivel >= dimensiones.length) return []
  const dim = dimensiones[nivel]
  const parentEsTiempo = nivel > 0 && esDimensionTiempo(dimensiones[nivel - 1])
  const dimEsTiempo = esDimensionTiempo(dim)

  const groups = new Map<string, { label: string; childPaths: typeof paths }>()
  for (const path of paths) {
    const key = path.keys[nivel]
    if (!groups.has(key)) {
      let label = path.labels[nivel]
      if (parentEsTiempo && dimEsTiempo) label = labelCorto(dim, key)
      groups.set(key, { label, childPaths: [] })
    }
    groups.get(key)!.childPaths.push(path)
  }

  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, { label, childPaths }]) => {
      const children = buildColumnTree(childPaths, dimensiones, nivel + 1)
      const span = children.length > 0 ? children.reduce((s, c) => s + c.span, 0) : 1
      return { key, label, children, span }
    })
}

function getLeafColumns(tree: NodoColumna[], parentKey: string): { key: string; label: string }[] {
  const result: { key: string; label: string }[] = []
  for (const node of tree) {
    const fullKey = parentKey ? `${parentKey}/${node.key}` : node.key
    if (node.children.length === 0) {
      result.push({ key: fullKey, label: node.label })
    } else {
      result.push(...getLeafColumns(node.children, fullKey))
    }
  }
  return result
}

// ── Construir árbol de filas ────────────────────────────────

function buildRowTree(
  datos: DatoIndexado[],
  numNiveles: number,
  nivelActual: number,
  colHojaKeys: string[],
  parentPath: string,
): NodoFila[] {
  const groups = new Map<string, { label: string; items: DatoIndexado[] }>()
  for (const d of datos) {
    const key = d.filaKeys[nivelActual]
    const label = d.filaLabels[nivelActual]
    if (!groups.has(key)) groups.set(key, { label, items: [] })
    groups.get(key)!.items.push(d)
  }

  return [...groups.entries()]
    .sort(([, a], [, b]) => a.label.localeCompare(b.label))
    .map(([key, { label, items }]) => {
      const fullKey = parentPath ? `${parentPath}/${key}` : key
      const children = nivelActual < numNiveles - 1
        ? buildRowTree(items, numNiveles, nivelActual + 1, colHojaKeys, fullKey)
        : []

      const celdas = new Map<string, CeldaMetricas>()
      for (const colKey of colHojaKeys) {
        const filasCol = items.filter((d) => d.colLeafKey === colKey).map((d) => d.fila)
        celdas.set(colKey, filasCol.length > 0 ? agregarMetricas(filasCol) : celdaVacia())
      }

      return {
        key: fullKey,
        label,
        nivel: nivelActual,
        celdas,
        totalesFila: agregarMetricas(items.map((d) => d.fila)),
        children,
      }
    })
}

// ── Formatear valores ───────────────────────────────────────

export function formatearValor(valor: number, formato: string): string {
  switch (formato) {
    case 'money': return valor.toLocaleString('es-ES', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + ' €'
    case 'pct': return valor.toFixed(1) + '%'
    case 'hours': return valor.toFixed(1) + 'h'
    case 'int': return String(Math.round(valor))
    default: return valor.toFixed(2)
  }
}

// ── Generar CSV jerárquico ──────────────────────────────────
// Exporta TODOS los niveles en formato plano.
// Columnas de fila: una por cada nivel de jerarquía de filas.
// Columnas de datos: una por cada (colLeaf × métrica) + totales.

export function generarCSVJerarquico(
  resultado: ResultadoJerarquico,
  config: ConfigInforme,
): string {
  const metricasMeta = METRICAS.filter((m) => config.metricas.includes(m.value))
  const tieneColumnas = resultado.columnasHoja.length > 0 && config.columnas.length > 0

  // Cabecera
  const headers: string[] = config.filas.map((d) => labelDimension(d))

  if (tieneColumnas) {
    for (const col of resultado.columnasHoja) {
      for (const m of metricasMeta) {
        headers.push(`${col.label} - ${metricaLabelCorto(m)}`)
      }
    }
  }
  for (const m of metricasMeta) {
    headers.push(`Total - ${metricaLabelCorto(m)}`)
  }

  // Filas (recursivo, aplanando todos los niveles)
  const rows: string[][] = []
  flattenRowsCSV(resultado.filas, config.filas.length, [], tieneColumnas, resultado.columnasHoja, metricasMeta, rows)

  // Fila total
  const totalRow: string[] = config.filas.map((_, i) => i === 0 ? '"TOTAL"' : '""')
  if (tieneColumnas) {
    for (const col of resultado.columnasHoja) {
      const celda = resultado.totalesPorColumna.get(col.key)
      for (const m of metricasMeta) { totalRow.push(formatCSV(celda?.[m.value] ?? 0, m.format)) }
    }
  }
  for (const m of metricasMeta) { totalRow.push(formatCSV(resultado.totalGeneral[m.value], m.format)) }

  return [headers.join(';'), ...rows.map((r) => r.join(';')), totalRow.join(';')].join('\n')
}

function flattenRowsCSV(
  nodos: NodoFila[],
  numNiveles: number,
  parentLabels: string[],
  tieneColumnas: boolean,
  colHojas: { key: string }[],
  metricasMeta: (typeof METRICAS)[number][],
  out: string[][],
) {
  for (const nodo of nodos) {
    const labels = [...parentLabels, `"${nodo.label.replace(/"/g, '""')}"`]
    // Rellenar niveles vacíos si es subtotal (no es hoja)
    const padded = [...labels, ...Array(numNiveles - labels.length).fill('""')]
    const row = [...padded]

    if (tieneColumnas) {
      for (const col of colHojas) {
        const celda = nodo.celdas.get(col.key)
        for (const m of metricasMeta) { row.push(formatCSV(celda?.[m.value] ?? 0, m.format)) }
      }
    }
    for (const m of metricasMeta) { row.push(formatCSV(nodo.totalesFila[m.value], m.format)) }
    out.push(row)

    if (nodo.children.length > 0) {
      flattenRowsCSV(nodo.children, numNiveles, labels, tieneColumnas, colHojas, metricasMeta, out)
    }
  }
}

function metricaLabelCorto(m: (typeof METRICAS)[number]): string {
  return m.label.replace(/ \(€\)/, '').replace(/ efectivo/, '')
}

function formatCSV(val: number, formato: string): string {
  if (formato === 'pct') return val.toFixed(1)
  if (formato === 'hours') return val.toFixed(1)
  return String(Math.round(val * 100) / 100)
}
