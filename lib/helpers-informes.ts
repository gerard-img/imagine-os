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

/** Fila agregada con todas las métricas calculadas */
export type FilaInforme = {
  key: string
  label: string
  ingresosPrev: number
  ingresosReal: number
  deltaRealizacion: number // (real - prev) / prev * 100
  horasAsignadas: number
  horasTrabajables: number
  pctCarga: number
  euroHora: number
  horasNoAsignadas: number
  /** Datos para sparkline de tendencia (últimos N meses de ingresos previstos) */
  sparkline?: number[]
  /** Hijos colapsables (nivel 2 y 3) */
  children?: FilaInforme[]
}

/** KPIs globales del mes/periodo */
export type KpisInformes = {
  ingresosPrev: number
  ingresosReal: number
  deltaPrevReal: number // %
  horasAsignadas: number
  horasTrabajables: number
  pctCarga: number
  euroHora: number
  hhi: number
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
  horasAsignadas: number
}

// ── Construir filas crudas a partir de asignaciones ───────────

export function buildFilasCrudas(
  asignaciones: Asignacion[],
  maps: LookupMaps,
  filtroEmpresaGrupo: string | null,
  filtroMeses: string[], // lista de meses a incluir
  filtroTipoProyecto: 'externo' | 'interno',
  filtroEstadoOT?: string | null, // null o 'Todos' = sin filtro
): FilaCruda[] {
  const filas: FilaCruda[] = []

  for (const a of asignaciones) {
    const orden = maps.ordenMap.get(a.orden_trabajo_id)
    if (!orden) continue
    if (!filtroMeses.includes(orden.mesAnio)) continue

    // Filtro estado OT
    if (filtroEstadoOT && filtroEstadoOT !== 'Todos' && orden.estado !== filtroEstadoOT) continue

    const proyecto = maps.proyectoMap.get(orden.proyectoId)
    if (!proyecto) continue

    // Filtro empresa grupo
    if (filtroEmpresaGrupo && proyecto.empresaGrupoId !== filtroEmpresaGrupo) continue

    // Filtro tipo proyecto
    if (filtroTipoProyecto === 'externo' && proyecto.tipoProyecto === 'Interno') continue
    if (filtroTipoProyecto === 'interno' && proyecto.tipoProyecto !== 'Interno') continue

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
  filtroEmpresaGrupo: string | null,
  anio: number,
  filtroTipoProyecto: 'externo' | 'interno',
): DatoMensualBarras[] {
  const resultado: DatoMensualBarras[] = []

  for (let m = 1; m <= 12; m++) {
    const mes = `${anio}-${String(m).padStart(2, '0')}-01`
    const filas = buildFilasCrudas(asignaciones, maps, filtroEmpresaGrupo, [mes], filtroTipoProyecto)

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
  // Agrupar ingresos por cliente
  const ingresoPorCliente = new Map<string, { nombre: string; ingresos: number }>()
  for (const f of filas) {
    const key = f.empresaId ?? '__interno__'
    const existing = ingresoPorCliente.get(key)
    if (existing) {
      existing.ingresos += f.ingresosPrev
    } else {
      ingresoPorCliente.set(key, { nombre: f.empresaNombre, ingresos: f.ingresosPrev })
    }
  }

  const total = filas.reduce((s, f) => s + f.ingresosPrev, 0)
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

/** Calcula horas trabajables totales por mes (para personas activas que pasan los filtros) */
export function calcularHorasTrabajablesPorMes(
  personas: Persona[],
  personasDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[],
  filtroEmpresaGrupo: string | null,
  meses: string[],
): Map<string, number> {
  const result = new Map<string, number>()
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresaGrupo && p.empresa_grupo_id !== filtroEmpresaGrupo) return false
    return true
  })

  for (const mes of meses) {
    let totalHoras = 0
    for (const persona of activas) {
      const deptIds = personasDepts
        .filter((pd) => pd.persona_id === persona.id)
        .map((pd) => pd.departamento_id)
      const h = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)
      totalHoras += h
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
  filtroEmpresaGrupo: string | null,
  meses: string[],
): Map<string, number> {
  const result = new Map<string, number>()
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresaGrupo && p.empresa_grupo_id !== filtroEmpresaGrupo) return false
    return true
  })

  for (const mes of meses) {
    for (const persona of activas) {
      const pds = personasDepts.filter((pd) => pd.persona_id === persona.id)
      const deptIds = pds.map((pd) => pd.departamento_id)
      const totalHoras = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)

      for (const pd of pds) {
        const key = pd.departamento_id
        const horasDepto = totalHoras * (pd.porcentaje_tiempo / 100)
        result.set(key, (result.get(key) ?? 0) + horasDepto)
      }
    }
  }

  return result
}

// ── Vista: Cliente → Mes → Departamento ───────────────────────

export function vistaCliente(
  filas: FilaCruda[],
  horasTrabPorMes: Map<string, number>,
  horasTrabPorDepto: Map<string, number>,
  sparklines?: Map<string, number[]>,
): FilaInforme[] {
  // Agrupar por empresa (cliente)
  const porCliente = new Map<string, FilaCruda[]>()
  for (const f of filas) {
    const key = f.empresaId ?? '__interno__'
    if (!porCliente.has(key)) porCliente.set(key, [])
    porCliente.get(key)!.push(f)
  }

  const resultado: FilaInforme[] = []

  for (const [clienteKey, filasCliente] of porCliente) {
    // Nivel 2: por mes
    const porMes = new Map<string, FilaCruda[]>()
    for (const f of filasCliente) {
      if (!porMes.has(f.mesAnio)) porMes.set(f.mesAnio, [])
      porMes.get(f.mesAnio)!.push(f)
    }

    const childrenMes: FilaInforme[] = []

    for (const [mes, filasMes] of porMes) {
      // Nivel 3: por departamento
      const porDepto = new Map<string, FilaCruda[]>()
      for (const f of filasMes) {
        if (!porDepto.has(f.departamentoId)) porDepto.set(f.departamentoId, [])
        porDepto.get(f.departamentoId)!.push(f)
      }

      const childrenDepto: FilaInforme[] = []
      for (const [deptoId, filasDepto] of porDepto) {
        const prev = filasDepto.reduce((s, f) => s + f.ingresosPrev, 0)
        const real = filasDepto.reduce((s, f) => s + f.ingresosReal, 0)
        const horas = filasDepto.reduce((s, f) => s + f.horasAsignadas, 0)
        const ht = horasTrabPorDepto.get(deptoId) ?? 0

        childrenDepto.push({
          key: `${clienteKey}-${mes}-${deptoId}`,
          label: filasDepto[0].departamentoNombre,
          ingresosPrev: prev,
          ingresosReal: real,
          deltaRealizacion: prev > 0 ? ((real - prev) / prev) * 100 : 0,
          horasAsignadas: horas,
          horasTrabajables: ht,
          pctCarga: ht > 0 ? safeDivide(horas, ht) * 100 : 0,
          euroHora: horas > 0 ? safeDivide(prev, horas) : 0,
          horasNoAsignadas: Math.max(0, ht - horas),
        })
      }
      childrenDepto.sort((a, b) => b.ingresosPrev - a.ingresosPrev)

      const prevMes = filasMes.reduce((s, f) => s + f.ingresosPrev, 0)
      const realMes = filasMes.reduce((s, f) => s + f.ingresosReal, 0)
      const horasMes = filasMes.reduce((s, f) => s + f.horasAsignadas, 0)
      const htMes = horasTrabPorMes.get(mes) ?? 0

      childrenMes.push({
        key: `${clienteKey}-${mes}`,
        label: formatMesLabel(mes),
        ingresosPrev: prevMes,
        ingresosReal: realMes,
        deltaRealizacion: prevMes > 0 ? ((realMes - prevMes) / prevMes) * 100 : 0,
        horasAsignadas: horasMes,
        horasTrabajables: htMes,
        pctCarga: htMes > 0 ? safeDivide(horasMes, htMes) * 100 : 0,
        euroHora: horasMes > 0 ? safeDivide(prevMes, horasMes) : 0,
        horasNoAsignadas: Math.max(0, htMes - horasMes),
        children: childrenDepto,
      })
    }
    childrenMes.sort((a, b) => b.label.localeCompare(a.label)) // Mes más reciente primero

    const prevCliente = filasCliente.reduce((s, f) => s + f.ingresosPrev, 0)
    const realCliente = filasCliente.reduce((s, f) => s + f.ingresosReal, 0)
    const horasCliente = filasCliente.reduce((s, f) => s + f.horasAsignadas, 0)

    resultado.push({
      key: clienteKey,
      label: filasCliente[0].empresaNombre,
      ingresosPrev: prevCliente,
      ingresosReal: realCliente,
      deltaRealizacion: prevCliente > 0 ? ((realCliente - prevCliente) / prevCliente) * 100 : 0,
      horasAsignadas: horasCliente,
      horasTrabajables: 0, // No aplica a nivel cliente
      pctCarga: 0,
      euroHora: horasCliente > 0 ? safeDivide(prevCliente, horasCliente) : 0,
      horasNoAsignadas: 0,
      sparkline: sparklines?.get(clienteKey),
      children: childrenMes,
    })
  }

  resultado.sort((a, b) => b.ingresosPrev - a.ingresosPrev)
  return resultado
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
    // Nivel 2: por cliente
    const porCliente = new Map<string, FilaCruda[]>()
    for (const f of filasMes) {
      const key = f.empresaId ?? '__interno__'
      if (!porCliente.has(key)) porCliente.set(key, [])
      porCliente.get(key)!.push(f)
    }

    const childrenCliente: FilaInforme[] = []

    for (const [clienteKey, filasCliente] of porCliente) {
      // Nivel 3: por depto
      const porDepto = new Map<string, FilaCruda[]>()
      for (const f of filasCliente) {
        if (!porDepto.has(f.departamentoId)) porDepto.set(f.departamentoId, [])
        porDepto.get(f.departamentoId)!.push(f)
      }

      const childrenDepto: FilaInforme[] = []
      for (const [deptoId, filasDepto] of porDepto) {
        const prev = filasDepto.reduce((s, f) => s + f.ingresosPrev, 0)
        const real = filasDepto.reduce((s, f) => s + f.ingresosReal, 0)
        const horas = filasDepto.reduce((s, f) => s + f.horasAsignadas, 0)
        const ht = horasTrabPorDepto.get(deptoId) ?? 0

        childrenDepto.push({
          key: `${mes}-${clienteKey}-${deptoId}`,
          label: filasDepto[0].departamentoNombre,
          ingresosPrev: prev,
          ingresosReal: real,
          deltaRealizacion: prev > 0 ? ((real - prev) / prev) * 100 : 0,
          horasAsignadas: horas,
          horasTrabajables: ht,
          pctCarga: ht > 0 ? safeDivide(horas, ht) * 100 : 0,
          euroHora: horas > 0 ? safeDivide(prev, horas) : 0,
          horasNoAsignadas: Math.max(0, ht - horas),
        })
      }
      childrenDepto.sort((a, b) => b.ingresosPrev - a.ingresosPrev)

      const prevC = filasCliente.reduce((s, f) => s + f.ingresosPrev, 0)
      const realC = filasCliente.reduce((s, f) => s + f.ingresosReal, 0)
      const horasC = filasCliente.reduce((s, f) => s + f.horasAsignadas, 0)

      childrenCliente.push({
        key: `${mes}-${clienteKey}`,
        label: filasCliente[0].empresaNombre,
        ingresosPrev: prevC,
        ingresosReal: realC,
        deltaRealizacion: prevC > 0 ? ((realC - prevC) / prevC) * 100 : 0,
        horasAsignadas: horasC,
        horasTrabajables: 0,
        pctCarga: 0,
        euroHora: horasC > 0 ? safeDivide(prevC, horasC) : 0,
        horasNoAsignadas: 0,
        children: childrenDepto,
      })
    }
    childrenCliente.sort((a, b) => b.ingresosPrev - a.ingresosPrev)

    const prevMes = filasMes.reduce((s, f) => s + f.ingresosPrev, 0)
    const realMes = filasMes.reduce((s, f) => s + f.ingresosReal, 0)
    const horasMes = filasMes.reduce((s, f) => s + f.horasAsignadas, 0)
    const htMes = horasTrabPorMes.get(mes) ?? 0

    resultado.push({
      key: mes,
      label: formatMesLabel(mes),
      ingresosPrev: prevMes,
      ingresosReal: realMes,
      deltaRealizacion: prevMes > 0 ? ((realMes - prevMes) / prevMes) * 100 : 0,
      horasAsignadas: horasMes,
      horasTrabajables: htMes,
      pctCarga: htMes > 0 ? safeDivide(horasMes, htMes) * 100 : 0,
      euroHora: horasMes > 0 ? safeDivide(prevMes, horasMes) : 0,
      horasNoAsignadas: Math.max(0, htMes - horasMes),
      children: childrenCliente,
    })
  }

  resultado.sort((a, b) => b.key.localeCompare(a.key)) // Mes más reciente primero
  return resultado
}

// ── Vista: Mes → Departamento → Cliente ───────────────────────

export function vistaDepto(
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
    // Nivel 2: por departamento
    const porDepto = new Map<string, FilaCruda[]>()
    for (const f of filasMes) {
      if (!porDepto.has(f.departamentoId)) porDepto.set(f.departamentoId, [])
      porDepto.get(f.departamentoId)!.push(f)
    }

    const childrenDepto: FilaInforme[] = []

    for (const [deptoId, filasDepto] of porDepto) {
      // Nivel 3: por cliente
      const porCliente = new Map<string, FilaCruda[]>()
      for (const f of filasDepto) {
        const key = f.empresaId ?? '__interno__'
        if (!porCliente.has(key)) porCliente.set(key, [])
        porCliente.get(key)!.push(f)
      }

      const childrenCliente: FilaInforme[] = []
      for (const [clienteKey, filasCliente] of porCliente) {
        const prev = filasCliente.reduce((s, f) => s + f.ingresosPrev, 0)
        const real = filasCliente.reduce((s, f) => s + f.ingresosReal, 0)
        const horas = filasCliente.reduce((s, f) => s + f.horasAsignadas, 0)

        childrenCliente.push({
          key: `${mes}-${deptoId}-${clienteKey}`,
          label: filasCliente[0].empresaNombre,
          ingresosPrev: prev,
          ingresosReal: real,
          deltaRealizacion: prev > 0 ? ((real - prev) / prev) * 100 : 0,
          horasAsignadas: horas,
          horasTrabajables: 0,
          pctCarga: 0,
          euroHora: horas > 0 ? safeDivide(prev, horas) : 0,
          horasNoAsignadas: 0,
        })
      }
      childrenCliente.sort((a, b) => b.ingresosPrev - a.ingresosPrev)

      const prevD = filasDepto.reduce((s, f) => s + f.ingresosPrev, 0)
      const realD = filasDepto.reduce((s, f) => s + f.ingresosReal, 0)
      const horasD = filasDepto.reduce((s, f) => s + f.horasAsignadas, 0)
      const htD = horasTrabPorDepto.get(deptoId) ?? 0

      childrenDepto.push({
        key: `${mes}-${deptoId}`,
        label: filasDepto[0].departamentoNombre,
        ingresosPrev: prevD,
        ingresosReal: realD,
        deltaRealizacion: prevD > 0 ? ((realD - prevD) / prevD) * 100 : 0,
        horasAsignadas: horasD,
        horasTrabajables: htD,
        pctCarga: htD > 0 ? safeDivide(horasD, htD) * 100 : 0,
        euroHora: horasD > 0 ? safeDivide(prevD, horasD) : 0,
        horasNoAsignadas: Math.max(0, htD - horasD),
        children: childrenCliente,
      })
    }
    childrenDepto.sort((a, b) => b.ingresosPrev - a.ingresosPrev)

    const prevMes = filasMes.reduce((s, f) => s + f.ingresosPrev, 0)
    const realMes = filasMes.reduce((s, f) => s + f.ingresosReal, 0)
    const horasMes = filasMes.reduce((s, f) => s + f.horasAsignadas, 0)
    const htMes = horasTrabPorMes.get(mes) ?? 0

    resultado.push({
      key: mes,
      label: formatMesLabel(mes),
      ingresosPrev: prevMes,
      ingresosReal: realMes,
      deltaRealizacion: prevMes > 0 ? ((realMes - prevMes) / prevMes) * 100 : 0,
      horasAsignadas: horasMes,
      horasTrabajables: htMes,
      pctCarga: htMes > 0 ? safeDivide(horasMes, htMes) * 100 : 0,
      euroHora: horasMes > 0 ? safeDivide(prevMes, horasMes) : 0,
      horasNoAsignadas: Math.max(0, htMes - horasMes),
      children: childrenDepto,
    })
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
  const totalHoras = filas.reduce((s, f) => s + f.horasAsignadas, 0)
  let totalHorasTrab = 0
  for (const h of horasTrabPorMes.values()) totalHorasTrab += h

  // HHI: concentración de cliente
  const ingresoPorCliente = new Map<string, number>()
  for (const f of filas) {
    const key = f.empresaId ?? '__interno__'
    ingresoPorCliente.set(key, (ingresoPorCliente.get(key) ?? 0) + f.ingresosPrev)
  }

  let hhi = 0
  let topClientePct = 0
  let topClienteKey = ''
  if (totalPrev > 0) {
    for (const [key, ingreso] of ingresoPorCliente) {
      const share = (ingreso / totalPrev) * 100
      hhi += share * share
      if (share > topClientePct) {
        topClientePct = share
        topClienteKey = key
      }
    }
  }

  // Nombre del top cliente
  let topClienteNombre = '—'
  if (topClienteKey) {
    const fila = filas.find((f) => (f.empresaId ?? '__interno__') === topClienteKey)
    if (fila) topClienteNombre = fila.empresaNombre
  }

  const hhiNivel: KpisInformes['hhiNivel'] =
    hhi < 1500 ? 'diversificado' : hhi < 2500 ? 'moderado' : 'concentrado'

  return {
    ingresosPrev: totalPrev,
    ingresosReal: totalReal,
    deltaPrevReal: totalPrev > 0 ? ((totalReal - totalPrev) / totalPrev) * 100 : 0,
    horasAsignadas: totalHoras,
    horasTrabajables: totalHorasTrab,
    pctCarga: totalHorasTrab > 0 ? safeDivide(totalHoras, totalHorasTrab) * 100 : 0,
    euroHora: totalHoras > 0 ? safeDivide(totalPrev, totalHoras) : 0,
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
  filtroEmpresaGrupo: string | null,
  mesActual: string,
  filtroTipoProyecto: 'externo' | 'interno',
  filtroEstadoOT?: string | null,
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

  const filas = buildFilasCrudas(asignaciones, maps, filtroEmpresaGrupo, meses, filtroTipoProyecto, filtroEstadoOT)

  // Agrupar ingresos por clave × mes
  const datosPorClave = new Map<string, Map<string, number>>()
  for (const f of filas) {
    const clave = agruparPor === 'cliente' ? (f.empresaId ?? '__interno__') : f.departamentoId
    if (!datosPorClave.has(clave)) datosPorClave.set(clave, new Map())
    const mesMap = datosPorClave.get(clave)!
    mesMap.set(f.mesAnio, (mesMap.get(f.mesAnio) ?? 0) + f.ingresosPrev)
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
  filtroEmpresaGrupo: string | null,
  anio: number,
  filtroTipoProyecto: 'externo' | 'interno',
  filtroEstadoOT?: string | null,
): FilaHeatmap[] {
  const meses = Array.from({ length: 12 }, (_, i) => {
    const m = String(i + 1).padStart(2, '0')
    return `${anio}-${m}-01`
  })

  // Horas asignadas por depto × mes
  const horasAsigMap = new Map<string, number>() // key: deptoId-mes
  const filas = buildFilasCrudas(asignaciones, maps, filtroEmpresaGrupo, meses, filtroTipoProyecto, filtroEstadoOT)
  for (const f of filas) {
    const key = `${f.departamentoId}-${f.mesAnio}`
    horasAsigMap.set(key, (horasAsigMap.get(key) ?? 0) + f.horasAsignadas)
  }

  // Horas trabajables por depto × mes
  const htPorDeptoMes = new Map<string, number>() // key: deptoId-mes
  const activas = personas.filter((p) => {
    if (!p.activo) return false
    if (filtroEmpresaGrupo && p.empresa_grupo_id !== filtroEmpresaGrupo) return false
    return true
  })

  for (const mes of meses) {
    for (const persona of activas) {
      const pds = personasDepts.filter((pd) => pd.persona_id === persona.id)
      const deptIds = pds.map((pd) => pd.departamento_id)
      const totalHoras = resolverHoras(persona.id, mes, persona.empresa_grupo_id, deptIds, horasTrab)

      for (const pd of pds) {
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

  // Filtrar por empresa grupo si aplica
  const deptosFiltrados = departamentos.filter((d) => {
    if (!deptosConDatos.has(d.id)) return false
    if (filtroEmpresaGrupo && d.empresa_grupo_id !== filtroEmpresaGrupo) return false
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
