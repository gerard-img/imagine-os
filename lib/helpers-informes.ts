// ============================================================
// Helpers de cálculo — Módulo de Informes
//
// Funciones puras para calcular las 6 métricas del módulo:
// 1. Ingresos previstos / reales
// 2. Horas asignadas
// 3. % Carga (utilización)
// 4. €/hora promedio (tarifa efectiva)
// 5. Concentración de cliente (HHI)
// 6. Horas no asignadas
// ============================================================

import { safeDivide, resolverHoras } from './helpers'
import type {
  OrdenTrabajo,
  Asignacion,
  Persona,
  Proyecto,
  Empresa,
  CuotaPlanificacion,
  HorasTrabajables,
  PersonaDepartamento,
  EmpresaGrupo,
  Departamento,
} from './supabase/types'

// ── Tipos de datos agregados ──────────────────────────────────

/**
 * Ingreso "mejor disponible": usa partida_real si existe, fallback a partida_prevista.
 * Útil para métricas de negocio (concentración, tendencia, €/hora efectivo).
 */
export function mejorIngreso(real: number, prevista: number): number {
  return real > 0 ? real : prevista
}

/** Fila agregada con todas las métricas calculadas */
export type FilaInforme = {
  key: string
  label: string
  ingresosReal: number
  ingresosPrev: number
  pctRealizacion: number // real / prev * 100
  horasAsignadas: number
  horasTrabajables: number
  pctCarga: number
  euroHoraEfectivo: number // real / horas (o prev / horas si no hay real)
  horasNoAsignadas: number
  /** Sparkline de tendencia — usa partida_real con fallback a prevista */
  sparkline?: number[]
  /** Hijos colapsables (nivel 2 y 3) */
  children?: FilaInforme[]
}

/** KPIs globales del mes/periodo */
export type KpisInformes = {
  ingresosReal: number
  ingresosPrev: number
  pctRealizacion: number // real / prev * 100
  horasAsignadas: number
  horasTrabajables: number
  pctCarga: number
  euroHoraEfectivo: number
  hhi: number // calculado sobre real con fallback
  hhiNivel: 'diversificado' | 'moderado' | 'concentrado'
  topClientePct: number
  topClienteNombre: string
  horasNoAsignadas: number
}

// ── Lookup maps ───────────────────────────────────────────────

export type LookupMaps = {
  ordenMap: Map<string, {
    id: string
    proyectoId: string
    departamentoId: string
    mesAnio: string
    partidaPrevista: number
    partidaReal: number | null
    estado: string
  }>
  proyectoMap: Map<string, {
    id: string
    empresaId: string | null
    empresaGrupoId: string
    tipoProyecto: string
  }>
  empresaMap: Map<string, { id: string; nombre: string }>
  cuotaMap: Map<string, { precioHora: number }>
  deptoMap: Map<string, { id: string; nombre: string }>
  egMap: Map<string, { id: string; nombre: string }>
}

export function buildLookupMaps(
  ordenes: OrdenTrabajo[],
  proyectos: Proyecto[],
  empresas: Empresa[],
  cuotas: CuotaPlanificacion[],
  departamentos: Departamento[],
  empresasGrupo: EmpresaGrupo[],
): LookupMaps {
  return {
    ordenMap: new Map(
      ordenes.map((o) => [
        o.id,
        {
          id: o.id,
          proyectoId: o.proyecto_id,
          departamentoId: o.departamento_id,
          mesAnio: o.mes_anio,
          partidaPrevista: o.partida_prevista,
          partidaReal: o.partida_real,
          estado: o.estado,
        },
      ]),
    ),
    proyectoMap: new Map(
      proyectos.map((p) => [
        p.id,
        {
          id: p.id,
          empresaId: p.empresa_id,
          empresaGrupoId: p.empresa_grupo_id,
          tipoProyecto: p.tipo_proyecto,
        },
      ]),
    ),
    empresaMap: new Map(
      empresas.map((e) => [
        e.id,
        { id: e.id, nombre: e.nombre_interno ?? e.nombre_legal },
      ]),
    ),
    cuotaMap: new Map(
      cuotas.map((c) => [c.id, { precioHora: c.precio_hora }]),
    ),
    deptoMap: new Map(
      departamentos.map((d) => [d.id, { id: d.id, nombre: d.nombre }]),
    ),
    egMap: new Map(
      empresasGrupo.map((eg) => [eg.id, { id: eg.id, nombre: eg.nombre }]),
    ),
  }
}

// ── Tipo para fila cruda de asignación ────────────────────────

type FilaCruda = {
  empresaId: string | null
  empresaNombre: string
  empresaGrupoId: string
  departamentoId: string
  departamentoNombre: string
  mesAnio: string
  ingresosPrev: number
  ingresosReal: number
  /** Real si existe, fallback a prevista — para métricas de negocio */
  ingresosMejor: number
  horasAsignadas: number
}

/** Tipo de proyecto válido para los filtros (se compara en minúsculas) */
export type TipoProyectoFiltro = 'facturable' | 'externo' | 'interno'

// ── Construir filas crudas a partir de asignaciones ───────────
//
// Convención de filtros: un array vacío significa "sin filtro" (mostrar todos).
// Esto se alinea con el patrón usado en proyectos-client y MultiSelectFilter.

export function buildFilasCrudas(
  asignaciones: Asignacion[],
  maps: LookupMaps,
  filtroEmpresasGrupo: string[],
  filtroMeses: string[], // lista de meses a incluir
  filtroTiposProyecto: TipoProyectoFiltro[],
  filtroEstadosOT: string[],
  filtroDepartamentos: string[],
): FilaCruda[] {
  const filas: FilaCruda[] = []

  for (const a of asignaciones) {
    const orden = maps.ordenMap.get(a.orden_trabajo_id)
    if (!orden) continue
    if (!filtroMeses.includes(orden.mesAnio)) continue

    // Filtro estado OT
    if (filtroEstadosOT.length > 0 && !filtroEstadosOT.includes(orden.estado)) continue

    // Filtro departamento
    if (filtroDepartamentos.length > 0 && !filtroDepartamentos.includes(orden.departamentoId)) continue

    const proyecto = maps.proyectoMap.get(orden.proyectoId)
    if (!proyecto) continue

    // Filtro empresa grupo
    if (filtroEmpresasGrupo.length > 0 && !filtroEmpresasGrupo.includes(proyecto.empresaGrupoId)) continue

    // Filtro tipo proyecto: Facturable (se cobra), Externo (a terceros sin cobrar), Interno
    if (filtroTiposProyecto.length > 0) {
      const tipoLower = proyecto.tipoProyecto.toLowerCase() as TipoProyectoFiltro
      if (!filtroTiposProyecto.includes(tipoLower)) continue
    }

    const cuota = maps.cuotaMap.get(a.cuota_planificacion_id)
    if (!cuota) continue

    const empresa = proyecto.empresaId ? maps.empresaMap.get(proyecto.empresaId) : null
    const depto = maps.deptoMap.get(orden.departamentoId)

    const ingPrev = orden.partidaPrevista * (a.porcentaje_ppto_tm / 100)
    const ingReal = orden.partidaReal !== null ? orden.partidaReal * (a.porcentaje_ppto_tm / 100) : 0
    const horas = safeDivide(ingPrev, cuota.precioHora)

    filas.push({
      empresaId: proyecto.empresaId,
      empresaNombre: empresa?.nombre ?? 'Proyecto interno',
      empresaGrupoId: proyecto.empresaGrupoId,
      departamentoId: orden.departamentoId,
      departamentoNombre: depto?.nombre ?? '—',
      mesAnio: orden.mesAnio,
      ingresosPrev: ingPrev,
      ingresosReal: ingReal,
      ingresosMejor: mejorIngreso(ingReal, ingPrev),
      horasAsignadas: horas,
    })
  }

  return filas
}

// ── Datos para gráficos ──────────────────────────────────────

/** Dato mensual para el gráfico de barras previsto vs real */
export type DatoMensualBarras = {
  mes: string
  mesLabel: string
  mesCorto: string
  ingresosPrev: number
  ingresosReal: number
}

/** Dato de cliente para el donut de concentración */
export type DatoConcentracionCliente = {
  nombre: string
  ingresos: number
  porcentaje: number
  color: string
}

const COLORES_DONUT = [
  '#00C896', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444',
  '#EC4899', '#14B8A6', '#6366F1', '#F97316', '#06B6D4',
]

/** Genera datos mensuales para el gráfico de barras (12 meses del año) */
export function calcularDatosMensualesBarras(
  asignaciones: Asignacion[],
  maps: LookupMaps,
  filtroEmpresasGrupo: string[],
  anio: number,
  filtroTiposProyecto: TipoProyectoFiltro[],
  filtroEstadosOT: string[],
  filtroDepartamentos: string[],
): DatoMensualBarras[] {
  const resultado: DatoMensualBarras[] = []

  for (let m = 1; m <= 12; m++) {
    const mes = `${anio}-${String(m).padStart(2, '0')}-01`
    const filas = buildFilasCrudas(
      asignaciones, maps, filtroEmpresasGrupo, [mes],
      filtroTiposProyecto, filtroEstadosOT, filtroDepartamentos,
    )

    resultado.push({
      mes,
      mesLabel: formatMesLabel(mes),
      mesCorto: MESES_CORTOS[m - 1],
      ingresosPrev: filas.reduce((s, f) => s + f.ingresosPrev, 0),
      ingresosReal: filas.reduce((s, f) => s + f.ingresosReal, 0),
    })
  }

  return resultado
}

/** Genera datos para el donut de concentración de clientes */
export function calcularConcentracionClientes(
  filas: FilaCruda[],
  maxClientes: number = 6,
): DatoConcentracionCliente[] {
  // Agrupar ingresos por cliente — usa ingresosMejor (real con fallback a prevista)
  const ingresoPorCliente = new Map<string, { nombre: string; ingresos: number }>()
  for (const f of filas) {
    const key = f.empresaId ?? '__interno__'
    const existing = ingresoPorCliente.get(key)
    if (existing) {
      existing.ingresos += f.ingresosMejor
    } else {
      ingresoPorCliente.set(key, { nombre: f.empresaNombre, ingresos: f.ingresosMejor })
    }
  }

  const total = filas.reduce((s, f) => s + f.ingresosMejor, 0)
  if (total === 0) return []

  // Ordenar por ingresos desc
  const sorted = [...ingresoPorCliente.values()].sort((a, b) => b.ingresos - a.ingresos)

  const resultado: DatoConcentracionCliente[] = []
  let otrosIngresos = 0

  for (let i = 0; i < sorted.length; i++) {
    if (i < maxClientes) {
      resultado.push({
        nombre: sorted[i].nombre,
        ingresos: sorted[i].ingresos,
        porcentaje: Math.round((sorted[i].ingresos / total) * 100),
        color: COLORES_DONUT[i % COLORES_DONUT.length],
      })
    } else {
      otrosIngresos += sorted[i].ingresos
    }
  }

  if (otrosIngresos > 0) {
    resultado.push({
      nombre: 'Otros',
      ingresos: otrosIngresos,
      porcentaje: Math.round((otrosIngresos / total) * 100),
      color: '#D1D5DB',
    })
  }

  return resultado
}

// ── Horas trabajables por dimensión ───────────────────────────

/**
 * Calcula horas trabajables totales por mes (para personas activas que pasan los filtros).
 * Si hay filtro de departamentos, prorratea las horas según el % de tiempo de cada persona
 * en los departamentos seleccionados.
 */
export function calcularHorasTrabajablesPorMes(
  personas: Persona[],
  personasDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[],
  filtroEmpresasGrupo: string[],
  filtroDepartamentos: string[],
  meses: string[],
): Map<string, number> {
  const result = new Map<string, number>()
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresasGrupo.length > 0 && !filtroEmpresasGrupo.includes(p.empresa_grupo_id)) return false
    return true
  })

  for (const mes of meses) {
    let totalHoras = 0
    for (const persona of activas) {
      const pds = personasDepts.filter((pd) => pd.persona_id === persona.id)
      const deptIds = pds.map((pd) => pd.departamento_id)
      const h = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)

      if (filtroDepartamentos.length === 0) {
        totalHoras += h
      } else {
        // Solo cuenta el % del tiempo de la persona dedicado a deptos filtrados
        const pctEnFiltro = pds
          .filter((pd) => filtroDepartamentos.includes(pd.departamento_id))
          .reduce((s, pd) => s + pd.porcentaje_tiempo, 0)
        totalHoras += h * (pctEnFiltro / 100)
      }
    }
    result.set(mes, totalHoras)
  }

  return result
}

/** Calcula horas trabajables por departamento×mes */
export function calcularHorasTrabajablesPorDepto(
  personas: Persona[],
  personasDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[],
  filtroEmpresasGrupo: string[],
  filtroDepartamentos: string[],
  meses: string[],
): Map<string, number> {
  const result = new Map<string, number>()
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresasGrupo.length > 0 && !filtroEmpresasGrupo.includes(p.empresa_grupo_id)) return false
    return true
  })

  for (const mes of meses) {
    for (const persona of activas) {
      const pds = personasDepts.filter((pd) => pd.persona_id === persona.id)
      const deptIds = pds.map((pd) => pd.departamento_id)
      const totalHoras = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)

      for (const pd of pds) {
        if (filtroDepartamentos.length > 0 && !filtroDepartamentos.includes(pd.departamento_id)) continue
        const key = pd.departamento_id
        const horasDepto = totalHoras * (pd.porcentaje_tiempo / 100)
        result.set(key, (result.get(key) ?? 0) + horasDepto)
      }
    }
  }

  return result
}

// ── Helper para construir FilaInforme desde valores agregados ──

function buildFila(
  key: string,
  label: string,
  filas: FilaCruda[],
  ht: number,
  extra?: { sparkline?: number[]; children?: FilaInforme[] },
): FilaInforme {
  const real = filas.reduce((s, f) => s + f.ingresosReal, 0)
  const prev = filas.reduce((s, f) => s + f.ingresosPrev, 0)
  const horas = filas.reduce((s, f) => s + f.horasAsignadas, 0)
  const mejor = filas.reduce((s, f) => s + f.ingresosMejor, 0)

  return {
    key,
    label,
    ingresosReal: real,
    ingresosPrev: prev,
    pctRealizacion: prev > 0 ? (real / prev) * 100 : 0,
    horasAsignadas: horas,
    horasTrabajables: ht,
    pctCarga: ht > 0 ? safeDivide(horas, ht) * 100 : 0,
    euroHoraEfectivo: horas > 0 ? safeDivide(mejor, horas) : 0,
    horasNoAsignadas: Math.max(0, ht - horas),
    ...extra,
  }
}

// ── Vista: Cliente → Mes → Departamento ───────────────────────

export function vistaCliente(
  filas: FilaCruda[],
  horasTrabPorMes: Map<string, number>,
  horasTrabPorDepto: Map<string, number>,
  sparklines?: Map<string, number[]>,
): FilaInforme[] {
  const porCliente = agrupar(filas, (f) => f.empresaId ?? '__interno__')
  const resultado: FilaInforme[] = []

  for (const [clienteKey, filasCliente] of porCliente) {
    const porMes = agrupar(filasCliente, (f) => f.mesAnio)
    const childrenMes: FilaInforme[] = []

    for (const [mes, filasMes] of porMes) {
      const porDepto = agrupar(filasMes, (f) => f.departamentoId)
      const childrenDepto = [...porDepto.entries()].map(([deptoId, filasDepto]) =>
        buildFila(`${clienteKey}-${mes}-${deptoId}`, filasDepto[0].departamentoNombre, filasDepto, horasTrabPorDepto.get(deptoId) ?? 0),
      )
      childrenDepto.sort((a, b) => b.ingresosReal - a.ingresosReal)

      childrenMes.push(
        buildFila(`${clienteKey}-${mes}`, formatMesLabel(mes), filasMes, horasTrabPorMes.get(mes) ?? 0, { children: childrenDepto }),
      )
    }
    childrenMes.sort((a, b) => b.label.localeCompare(a.label))

    resultado.push(
      buildFila(clienteKey, filasCliente[0].empresaNombre, filasCliente, 0, {
        sparkline: sparklines?.get(clienteKey),
        children: childrenMes,
      }),
    )
  }

  resultado.sort((a, b) => b.ingresosReal - a.ingresosReal)
  return resultado
}

/** Helper: agrupa un array por clave */
function agrupar<T>(items: T[], keyFn: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>()
  for (const item of items) {
    const key = keyFn(item)
    if (!map.has(key)) map.set(key, [])
    map.get(key)!.push(item)
  }
  return map
}

// ── Vista: Mes → Cliente → Departamento ───────────────────────

export function vistaMes(
  filas: FilaCruda[],
  horasTrabPorMes: Map<string, number>,
  horasTrabPorDepto: Map<string, number>,
): FilaInforme[] {
  const porMes = new Map<string, FilaCruda[]>()
  for (const f of filas) {
    if (!porMes.has(f.mesAnio)) porMes.set(f.mesAnio, [])
    porMes.get(f.mesAnio)!.push(f)
  }

  const resultado: FilaInforme[] = []

  for (const [mes, filasMes] of porMes) {
    const porCliente = agrupar(filasMes, (f) => f.empresaId ?? '__interno__')
    const childrenCliente: FilaInforme[] = []

    for (const [clienteKey, filasCliente] of porCliente) {
      const porDepto = agrupar(filasCliente, (f) => f.departamentoId)
      const childrenDepto = [...porDepto.entries()].map(([deptoId, filasDepto]) =>
        buildFila(`${mes}-${clienteKey}-${deptoId}`, filasDepto[0].departamentoNombre, filasDepto, horasTrabPorDepto.get(deptoId) ?? 0),
      )
      childrenDepto.sort((a, b) => b.ingresosReal - a.ingresosReal)

      childrenCliente.push(
        buildFila(`${mes}-${clienteKey}`, filasCliente[0].empresaNombre, filasCliente, 0, { children: childrenDepto }),
      )
    }
    childrenCliente.sort((a, b) => b.ingresosReal - a.ingresosReal)

    resultado.push(
      buildFila(mes, formatMesLabel(mes), filasMes, horasTrabPorMes.get(mes) ?? 0, { children: childrenCliente }),
    )
  }

  resultado.sort((a, b) => b.key.localeCompare(a.key))
  return resultado
}

// ── Vista: Mes → Departamento → Cliente ───────────────────────

export function vistaDepto(
  filas: FilaCruda[],
  horasTrabPorMes: Map<string, number>,
  horasTrabPorDepto: Map<string, number>,
): FilaInforme[] {
  const porMes = agrupar(filas, (f) => f.mesAnio)
  const resultado: FilaInforme[] = []

  for (const [mes, filasMes] of porMes) {
    const porDepto = agrupar(filasMes, (f) => f.departamentoId)
    const childrenDepto: FilaInforme[] = []

    for (const [deptoId, filasDepto] of porDepto) {
      const porCliente = agrupar(filasDepto, (f) => f.empresaId ?? '__interno__')
      const childrenCliente = [...porCliente.entries()].map(([clienteKey, filasCliente]) =>
        buildFila(`${mes}-${deptoId}-${clienteKey}`, filasCliente[0].empresaNombre, filasCliente, 0),
      )
      childrenCliente.sort((a, b) => b.ingresosReal - a.ingresosReal)

      childrenDepto.push(
        buildFila(`${mes}-${deptoId}`, filasDepto[0].departamentoNombre, filasDepto, horasTrabPorDepto.get(deptoId) ?? 0, { children: childrenCliente }),
      )
    }
    childrenDepto.sort((a, b) => b.ingresosReal - a.ingresosReal)

    resultado.push(
      buildFila(mes, formatMesLabel(mes), filasMes, horasTrabPorMes.get(mes) ?? 0, { children: childrenDepto }),
    )
  }

  resultado.sort((a, b) => b.key.localeCompare(a.key))
  return resultado
}

// ── Calcular KPIs globales ────────────────────────────────────

export function calcularKpis(
  filas: FilaCruda[],
  horasTrabPorMes: Map<string, number>,
): KpisInformes {
  const totalPrev = filas.reduce((s, f) => s + f.ingresosPrev, 0)
  const totalReal = filas.reduce((s, f) => s + f.ingresosReal, 0)
  const totalMejor = filas.reduce((s, f) => s + f.ingresosMejor, 0)
  const totalHoras = filas.reduce((s, f) => s + f.horasAsignadas, 0)
  let totalHorasTrab = 0
  for (const h of horasTrabPorMes.values()) totalHorasTrab += h

  // HHI: concentración de cliente — usa ingresosMejor (real con fallback a prevista)
  const ingresoPorCliente = new Map<string, number>()
  for (const f of filas) {
    const key = f.empresaId ?? '__interno__'
    ingresoPorCliente.set(key, (ingresoPorCliente.get(key) ?? 0) + f.ingresosMejor)
  }

  let hhi = 0
  let topClientePct = 0
  let topClienteKey = ''
  if (totalMejor > 0) {
    for (const [key, ingreso] of ingresoPorCliente) {
      const share = (ingreso / totalMejor) * 100
      hhi += share * share
      if (share > topClientePct) {
        topClientePct = share
        topClienteKey = key
      }
    }
  }

  let topClienteNombre = '—'
  if (topClienteKey) {
    const fila = filas.find((f) => (f.empresaId ?? '__interno__') === topClienteKey)
    if (fila) topClienteNombre = fila.empresaNombre
  }

  const hhiNivel: KpisInformes['hhiNivel'] =
    hhi < 1500 ? 'diversificado' : hhi < 2500 ? 'moderado' : 'concentrado'

  return {
    ingresosReal: totalReal,
    ingresosPrev: totalPrev,
    pctRealizacion: totalPrev > 0 ? (totalReal / totalPrev) * 100 : 0,
    horasAsignadas: totalHoras,
    horasTrabajables: totalHorasTrab,
    pctCarga: totalHorasTrab > 0 ? safeDivide(totalHoras, totalHorasTrab) * 100 : 0,
    euroHoraEfectivo: totalHoras > 0 ? safeDivide(totalMejor, totalHoras) : 0,
    hhi: Math.round(hhi),
    hhiNivel,
    topClientePct: Math.round(topClientePct),
    topClienteNombre,
    horasNoAsignadas: Math.max(0, totalHorasTrab - totalHoras),
  }
}

// ── Detectar último mes con datos ─────────────────────────────

export function detectarUltimoMesConDatos(ordenes: OrdenTrabajo[]): string {
  const meses = [...new Set(ordenes.map((o) => o.mes_anio))].sort()
  // Devolver el penúltimo mes si existe (mes pasado tiene datos más completos)
  // o el último si solo hay uno
  if (meses.length === 0) {
    // Sin datos: devolver mes anterior al actual
    const now = new Date()
    now.setMonth(now.getMonth() - 1)
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }
  return meses[meses.length - 1]
}

/** Obtener todos los meses disponibles en los datos */
export function getMesesDisponibles(ordenes: OrdenTrabajo[]): string[] {
  return [...new Set(ordenes.map((o) => o.mes_anio))].sort()
}

// ── Sparklines — tendencia de ingresos por clave ──────────────

/**
 * Calcula sparkline de ingresos previstos para los últimos 6 meses,
 * agrupados por una clave (clienteId, deptoId, etc.)
 * Devuelve Map<clave, number[6]> donde cada posición es un mes (más antiguo → más reciente)
 */
export function calcularSparklines(
  asignaciones: Asignacion[],
  maps: LookupMaps,
  filtroEmpresasGrupo: string[],
  mesActual: string,
  filtroTiposProyecto: TipoProyectoFiltro[],
  filtroEstadosOT: string[],
  filtroDepartamentos: string[],
  agruparPor: 'cliente' | 'depto' = 'cliente',
): Map<string, number[]> {
  // Generar los últimos 6 meses (incluyendo el actual)
  const meses: string[] = []
  const d = new Date(mesActual + 'T00:00:00')
  for (let i = 5; i >= 0; i--) {
    const fecha = new Date(d)
    fecha.setMonth(fecha.getMonth() - i)
    const y = fecha.getFullYear()
    const m = String(fecha.getMonth() + 1).padStart(2, '0')
    meses.push(`${y}-${m}-01`)
  }

  const filas = buildFilasCrudas(
    asignaciones, maps, filtroEmpresasGrupo, meses,
    filtroTiposProyecto, filtroEstadosOT, filtroDepartamentos,
  )

  // Agrupar ingresos por clave × mes — usa ingresosMejor (real con fallback)
  const datosPorClave = new Map<string, Map<string, number>>()
  for (const f of filas) {
    const clave = agruparPor === 'cliente' ? (f.empresaId ?? '__interno__') : f.departamentoId
    if (!datosPorClave.has(clave)) datosPorClave.set(clave, new Map())
    const mesMap = datosPorClave.get(clave)!
    mesMap.set(f.mesAnio, (mesMap.get(f.mesAnio) ?? 0) + f.ingresosMejor)
  }

  // Convertir a arrays ordenados
  const resultado = new Map<string, number[]>()
  for (const [clave, mesMap] of datosPorClave) {
    resultado.set(clave, meses.map((m) => mesMap.get(m) ?? 0))
  }

  return resultado
}

// ── Formato mes ───────────────────────────────────────────────

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
]

const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

function formatMesLabel(mesAnio: string): string {
  const d = new Date(mesAnio + 'T00:00:00')
  return `${MESES[d.getMonth()]} ${d.getFullYear()}`
}

// ── Mes anterior ──────────────────────────────────────────────

export function mesAnterior(mesAnio: string): string {
  const d = new Date(mesAnio + 'T00:00:00')
  d.setMonth(d.getMonth() - 1)
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

// ── Heatmap departamento × mes ────────────────────────────────

export type CeldaHeatmap = {
  departamentoId: string
  mes: string
  horasAsignadas: number
  horasTrabajables: number
  pctCarga: number
}

export type FilaHeatmap = {
  departamentoId: string
  departamentoNombre: string
  celdas: CeldaHeatmap[]
  mediaAnual: number
}

export function calcularHeatmapCarga(
  asignaciones: Asignacion[],
  maps: LookupMaps,
  personas: Persona[],
  personasDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[],
  departamentos: Departamento[],
  filtroEmpresasGrupo: string[],
  anio: number,
  filtroTiposProyecto: TipoProyectoFiltro[],
  filtroEstadosOT: string[],
  filtroDepartamentos: string[],
): FilaHeatmap[] {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    return `${anio}-${m}-01`
  })

  // Horas asignadas por depto × mes
  const horasAsigMap = new Map<string, number>() // key: deptoId-mes
  const filas = buildFilasCrudas(
    asignaciones, maps, filtroEmpresasGrupo, meses,
    filtroTiposProyecto, filtroEstadosOT, filtroDepartamentos,
  )
  for (const f of filas) {
    const key = `${f.departamentoId}-${f.mesAnio}`
    horasAsigMap.set(key, (horasAsigMap.get(key) ?? 0) + f.horasAsignadas)
  }

  // Horas trabajables por depto × mes
  const htPorDeptoMes = new Map<string, number>() // key: deptoId-mes
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresasGrupo.length > 0 && !filtroEmpresasGrupo.includes(p.empresa_grupo_id)) return false
    return true
  })

  for (const mes of meses) {
    for (const persona of activas) {
      const pds = personasDepts.filter((pd) => pd.persona_id === persona.id)
      const deptIds = pds.map((pd) => pd.departamento_id)
      const totalHoras = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)

      for (const pd of pds) {
        if (filtroDepartamentos.length > 0 && !filtroDepartamentos.includes(pd.departamento_id)) continue
        const key = `${pd.departamento_id}-${mes}`
        const horasDepto = totalHoras * (pd.porcentaje_tiempo / 100)
        htPorDeptoMes.set(key, (htPorDeptoMes.get(key) ?? 0) + horasDepto)
      }
    }
  }

  // Filtrar departamentos relevantes (que tengan datos)
  const deptosConDatos = new Set<string>()
  for (const key of horasAsigMap.keys()) {
    deptosConDatos.add(key.split('-')[0])
  }
  for (const key of htPorDeptoMes.keys()) {
    deptosConDatos.add(key.split('-')[0])
  }

  // Filtrar por empresa grupo y departamento si aplica
  const deptosFiltrados = departamentos.filter((d) => {
    if (!deptosConDatos.has(d.id)) return false
    if (filtroEmpresasGrupo.length > 0 && !filtroEmpresasGrupo.includes(d.empresa_grupo_id)) return false
    if (filtroDepartamentos.length > 0 && !filtroDepartamentos.includes(d.id)) return false
    return true
  })

  const resultado: FilaHeatmap[] = []

  for (const depto of deptosFiltrados) {
    const celdas: CeldaHeatmap[] = []
    let sumPct = 0
    let countMesesConDatos = 0

    for (const mes of meses) {
      const key = `${depto.id}-${mes}`
      const horasAsig = horasAsigMap.get(key) ?? 0
      const ht = htPorDeptoMes.get(key) ?? 0
      const pct = ht > 0 ? safeDivide(horasAsig, ht) * 100 : 0

      celdas.push({
        departamentoId: depto.id,
        mes,
        horasAsignadas: horasAsig,
        horasTrabajables: ht,
        pctCarga: pct,
      })

      if (ht > 0) {
        sumPct += pct
        countMesesConDatos++
      }
    }

    resultado.push({
      departamentoId: depto.id,
      departamentoNombre: depto.nombre,
      celdas,
      mediaAnual: countMesesConDatos > 0 ? sumPct / countMesesConDatos : 0,
    })
  }

  // Ordenar por media de carga desc
  resultado.sort((a, b) => b.mediaAnual - a.mediaAnual)
  return resultado
}
