'use client'

import { useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import { ChevronRight, ChevronDown, TrendingUp, TrendingDown, ChevronsUpDown, ChevronsDownUp, Info } from 'lucide-react'
import { formatMoney } from '@/lib/helpers'
import { MonthNavigator } from '@/components/month-navigator'
import { FilterPills } from '@/components/filter-pills'
import {
  buildLookupMaps,
  buildFilasCrudas,
  calcularKpis,
  calcularHorasTrabajablesPorMes,
  calcularHorasTrabajablesPorDepto,
  calcularDatosMensualesBarras,
  calcularConcentracionClientes,
  calcularHeatmapCarga,
  calcularSparklines,
  mesAnterior,
  vistaCliente,
  vistaMes,
  vistaDepto,
  detectarUltimoMesConDatos,
} from '@/lib/helpers-informes'
import type { FilaInforme, KpisInformes } from '@/lib/helpers-informes'
import { GraficoIngresos } from './components/grafico-ingresos'
import { GraficoConcentracion } from './components/grafico-concentracion'
import { HeatmapCarga } from './components/heatmap-carga'
import type {
  OrdenTrabajo, Asignacion, Persona, Proyecto, Empresa,
  CuotaPlanificacion, HorasTrabajables, PersonaDepartamento,
  EmpresaGrupo, Departamento,
} from '@/lib/supabase/types'

// ── Props ─────────────────────────────────────────────────────

type Props = {
  ordenesTrabajo: OrdenTrabajo[]
  asignaciones: Asignacion[]
  personas: Persona[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  cuotas: CuotaPlanificacion[]
  horasTrabajables: HorasTrabajables[]
  personasDepartamentos: PersonaDepartamento[]
  empresasGrupo: EmpresaGrupo[]
  departamentos: Departamento[]
}

type VistaTab = 'cliente' | 'mes' | 'depto'
type TipoProyecto = 'todos' | 'facturable' | 'externo' | 'interno'
type EstadoOTFilter = 'Todos' | 'Planificado' | 'Confirmado' | 'Facturado'
type SortColumn = 'label' | 'ingresosReal' | 'ingresosPrev' | 'pctRealizacion' | 'horasAsignadas' | 'pctCarga' | 'euroHoraEfectivo' | 'horasNoAsignadas'
type SortDir = 'asc' | 'desc'

// ── Helpers de formato ────────────────────────────────────────

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function formatHoras(value: number): string {
  return `${Math.round(value)}h`
}

function formatEuroHora(value: number): string {
  return `${value.toFixed(1)} €/h`
}

/** Calcula delta % entre valor actual y anterior */
function calcDelta(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

/** Mini indicador de tendencia vs mes anterior */
function KpiDelta({ actual, anterior, invertir = false }: { actual: number; anterior: number; invertir?: boolean }) {
  const delta = calcDelta(actual, anterior)
  if (delta === null) return <span className="text-[11px] text-muted-foreground">sin datos previos</span>

  const positivo = delta > 0
  // Para % carga, subir demasiado es malo (invertir)
  const esBueno = invertir ? !positivo : positivo
  const color = Math.abs(delta) < 1 ? 'text-muted-foreground' : esBueno ? 'text-emerald-600' : 'text-red-500'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPct(delta)} vs ant.
    </span>
  )
}

// ── Colores condicionales ─────────────────────────────────────

function realizacionColor(pct: number): string {
  if (pct === 0) return 'text-muted-foreground'
  if (pct >= 100) return 'text-emerald-600'
  if (pct >= 90) return 'text-amber-600'
  return 'text-red-600'
}

function cargaColor(pct: number): { text: string; border: string } {
  if (pct === 0) return { text: 'text-muted-foreground', border: 'border-t-gray-300' }
  if (pct > 90) return { text: 'text-red-600', border: 'border-t-red-500' }
  if (pct >= 80) return { text: 'text-emerald-600', border: 'border-t-emerald-500' }
  if (pct >= 60) return { text: 'text-amber-600', border: 'border-t-amber-500' }
  return { text: 'text-red-600', border: 'border-t-red-500' }
}

function hhiColor(nivel: KpisInformes['hhiNivel']): { text: string; bg: string; label: string } {
  if (nivel === 'diversificado') return { text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Diversificado' }
  if (nivel === 'moderado') return { text: 'text-amber-700', bg: 'bg-amber-50', label: 'Moderado' }
  return { text: 'text-red-700', bg: 'bg-red-50', label: 'Concentrado' }
}

// ── Sparkline SVG mini ────────────────────────────────────────

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2 || data.every((v) => v === 0)) return null

  const w = 64
  const h = 20
  const max = Math.max(...data)
  if (max === 0) return null

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 2) - 1
    return `${x},${y}`
  })

  // Tendencia: último vs primero no-cero
  const firstNonZero = data.find((v) => v > 0) ?? 0
  const last = data[data.length - 1]
  const color = last >= firstNonZero ? '#10B981' : '#EF4444'

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Punto final */}
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - (last / max) * (h - 2) - 1}
        r={2}
        fill={color}
      />
    </svg>
  )
}

// ── Barra de carga mini ───────────────────────────────────────

function BarraCargaMini({ pct }: { pct: number }) {
  if (pct === 0) return null
  const fill = Math.min(pct, 100)
  const color =
    pct > 90 ? 'bg-red-500' :
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-amber-400' :
    'bg-red-400'

  return (
    <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${fill}%` }} />
    </div>
  )
}

// ── Fila colapsable ───────────────────────────────────────────

function FilaColapsable({
  fila,
  nivel,
  expanded,
  onToggle,
  expandedKeys,
}: {
  fila: FilaInforme
  nivel: number
  expanded: boolean
  onToggle: (key: string) => void
  expandedKeys: Set<string>
}) {
  const hasChildren = fila.children && fila.children.length > 0
  const indent = nivel * 24

  const rowBg =
    nivel === 0 ? 'bg-white hover:bg-muted/30' :
    nivel === 1 ? 'bg-gray-50/50 hover:bg-muted/20' :
    'bg-gray-50/30 hover:bg-muted/10'

  const fontWeight = nivel === 0 ? 'font-semibold' : nivel === 1 ? 'font-medium' : 'font-normal'
  const textSize = nivel === 0 ? 'text-sm' : 'text-[13px]'

  return (
    <>
      <tr className={`${rowBg} transition-colors border-b border-border/50`}>
        {/* Label con indent y chevron */}
        <td className="py-3 pr-2" style={{ paddingLeft: `${12 + indent}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => onToggle(fila.key)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={`${textSize} ${fontWeight} text-foreground truncate`}>
              {fila.label}
            </span>
            {nivel === 0 && fila.sparkline && (
              <MiniSparkline data={fila.sparkline} />
            )}
          </div>
        </td>

        {/* Facturado (partida_real) — columna primaria */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums font-medium text-foreground`}>
          {fila.ingresosReal > 0 ? formatMoney(fila.ingresosReal) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        {/* Planificado (partida_prevista) — referencia */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-muted-foreground`}>
          {formatMoney(fila.ingresosPrev)}
        </td>

        {/* % Realización */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.ingresosPrev > 0 && fila.ingresosReal > 0 ? (
            <span className={`font-medium ${realizacionColor(fila.pctRealizacion)}`}>
              {Math.round(fila.pctRealizacion)}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        {/* Horas asignadas */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {formatHoras(fila.horasAsignadas)}
        </td>

        {/* % Carga */}
        <td className="py-3 px-3">
          {fila.horasTrabajables > 0 ? (
            <div className="flex items-center justify-end gap-2">
              <BarraCargaMini pct={fila.pctCarga} />
              <span className={`${textSize} tabular-nums font-medium ${cargaColor(fila.pctCarga).text}`}>
                {Math.round(fila.pctCarga)}%
              </span>
            </div>
          ) : (
            <span className="text-right block text-muted-foreground text-[13px]">—</span>
          )}
        </td>

        {/* €/hora efectivo */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {fila.horasAsignadas > 0 ? formatEuroHora(fila.euroHoraEfectivo) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        {/* Horas no asignadas */}
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.horasTrabajables > 0 ? (
            <span className={fila.horasNoAsignadas > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
              {formatHoras(fila.horasNoAsignadas)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      </tr>

      {/* Hijos */}
      {expanded && hasChildren && fila.children!.map((child) => {
        const childExpanded = expandedKeys.has(child.key)
        return (
          <FilaColapsable
            key={child.key}
            fila={child}
            nivel={nivel + 1}
            expanded={childExpanded}
            onToggle={onToggle}
            expandedKeys={expandedKeys}
          />
        )
      })}
    </>
  )
}

// ── Componente principal ──────────────────────────────────────

export function InformesClient({
  ordenesTrabajo, asignaciones, personas, proyectos, empresas,
  cuotas, horasTrabajables, personasDepartamentos, empresasGrupo, departamentos,
}: Props) {
  // Lookup maps
  const maps = useMemo(
    () => buildLookupMaps(ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo),
    [ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo],
  )

  // ── URL searchParams como fuente de verdad para filtros ──────
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const mesInicial = useMemo(() => detectarUltimoMesConDatos(ordenesTrabajo), [ordenesTrabajo])

  // Leer parámetros de la URL (con defaults)
  const month = searchParams.get('mes') || mesInicial
  const egFilter = searchParams.get('empresa') || 'Todos'
  const vistaTab = (searchParams.get('vista') as VistaTab) || 'cliente'
  const tipoProyecto = (searchParams.get('tipo') as TipoProyecto) || 'facturable'
  const estadoOT = (searchParams.get('estadoOT') as EstadoOTFilter) || 'Todos'
  const sortCol = (searchParams.get('orden') as SortColumn) || 'ingresosReal'
  const sortDir = (searchParams.get('dir') as SortDir) || 'desc'

  // Estado puramente de UI (no va a la URL)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  /** Actualiza uno o más parámetros de URL sin recargar la página */
  const setParams = useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value === null || value === '') params.delete(key)
      else params.set(key, value)
    }
    router.replace(`${pathname}?${params.toString()}`, { scroll: false })
  }, [searchParams, router, pathname])

  const setMonth = (v: string) => { setParams({ mes: v }); setExpandedKeys(new Set()) }
  const setEgFilter = (v: string) => { setParams({ empresa: v === 'Todos' ? null : v }); setExpandedKeys(new Set()) }
  const setVistaTab = (v: VistaTab) => { setParams({ vista: v === 'cliente' ? null : v }); setExpandedKeys(new Set()) }
  const setTipoProyecto = (v: TipoProyecto) => { setParams({ tipo: v === 'facturable' ? null : v }); setExpandedKeys(new Set()) }
  const setEstadoOT = (v: EstadoOTFilter) => { setParams({ estadoOT: v === 'Todos' ? null : v }); setExpandedKeys(new Set()) }

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSort = (col: SortColumn) => {
    const newDir = sortCol === col ? (sortDir === 'asc' ? 'desc' : 'asc') : (col === 'label' ? 'asc' : 'desc')
    setParams({ orden: col === 'ingresosReal' ? null : col, dir: newDir === 'desc' ? null : newDir })
  }

  const filtroEg = egFilter === 'Todos' ? null : egFilter

  // Año extraído del mes seleccionado
  const anio = useMemo(() => {
    const d = new Date(month + 'T00:00:00')
    return d.getFullYear()
  }, [month])

  // Meses del año completo (para vistas temporales)
  const mesesAnio = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      return `${anio}-${m}-01`
    })
  }, [anio])

  // Filas crudas: mes único para vista cliente, año completo para vista mes/depto
  const filasCrudasMes = useMemo(
    () => buildFilasCrudas(asignaciones, maps, filtroEg, [month], tipoProyecto, estadoOT),
    [asignaciones, maps, filtroEg, month, tipoProyecto, estadoOT],
  )

  const filasCrudasAnio = useMemo(
    () => buildFilasCrudas(asignaciones, maps, filtroEg, mesesAnio, tipoProyecto, estadoOT),
    [asignaciones, maps, filtroEg, mesesAnio, tipoProyecto, estadoOT],
  )

  // Horas trabajables (mes único para KPIs, año completo para vistas temporales)
  const horasTrabPorMes = useMemo(
    () => calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filtroEg, [month]),
    [personas, personasDepartamentos, horasTrabajables, filtroEg, month],
  )

  const horasTrabPorMesAnio = useMemo(
    () => calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filtroEg, mesesAnio),
    [personas, personasDepartamentos, horasTrabajables, filtroEg, mesesAnio],
  )

  const horasTrabPorDepto = useMemo(
    () => calcularHorasTrabajablesPorDepto(personas, personasDepartamentos, horasTrabajables, filtroEg, [month]),
    [personas, personasDepartamentos, horasTrabajables, filtroEg, month],
  )

  const horasTrabPorDeptoAnio = useMemo(
    () => calcularHorasTrabajablesPorDepto(personas, personasDepartamentos, horasTrabajables, filtroEg, mesesAnio),
    [personas, personasDepartamentos, horasTrabajables, filtroEg, mesesAnio],
  )

  // KPIs — siempre del mes seleccionado
  const kpis = useMemo(
    () => calcularKpis(filasCrudasMes, horasTrabPorMes),
    [filasCrudasMes, horasTrabPorMes],
  )

  // KPIs del mes anterior (para deltas comparativos)
  const mesPrev = useMemo(() => mesAnterior(month), [month])

  const kpisPrev = useMemo(() => {
    const filasPrev = buildFilasCrudas(asignaciones, maps, filtroEg, [mesPrev], tipoProyecto, estadoOT)
    const htPrev = calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filtroEg, [mesPrev])
    return calcularKpis(filasPrev, htPrev)
  }, [asignaciones, maps, filtroEg, mesPrev, tipoProyecto, estadoOT, personas, personasDepartamentos, horasTrabajables])

  // Heatmap departamento × mes
  const datosHeatmap = useMemo(
    () => calcularHeatmapCarga(asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos, filtroEg, anio, tipoProyecto, estadoOT),
    [asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos, filtroEg, anio, tipoProyecto, estadoOT],
  )

  // Datos para gráficos
  const datosMensuales = useMemo(
    () => calcularDatosMensualesBarras(asignaciones, maps, filtroEg, anio, tipoProyecto, estadoOT),
    [asignaciones, maps, filtroEg, anio, tipoProyecto, estadoOT],
  )

  const datosConcentracion = useMemo(
    () => calcularConcentracionClientes(filasCrudasMes),
    [filasCrudasMes],
  )

  // Sparklines de tendencia por cliente (últimos 6 meses)
  const sparklinesPorCliente = useMemo(
    () => calcularSparklines(asignaciones, maps, filtroEg, month, tipoProyecto, estadoOT, 'cliente'),
    [asignaciones, maps, filtroEg, month, tipoProyecto, estadoOT],
  )

  // Filas de la tabla según la vista
  const filasTabla = useMemo(() => {
    let filas: FilaInforme[]
    if (vistaTab === 'cliente') {
      filas = vistaCliente(filasCrudasMes, horasTrabPorMes, horasTrabPorDepto, sparklinesPorCliente)
    } else if (vistaTab === 'mes') {
      filas = vistaMes(filasCrudasAnio, horasTrabPorMesAnio, horasTrabPorDeptoAnio)
    } else {
      filas = vistaDepto(filasCrudasAnio, horasTrabPorMesAnio, horasTrabPorDeptoAnio)
    }

    // Ordenar nivel 0
    filas.sort((a, b) => {
      const valA = sortCol === 'label' ? a.label : a[sortCol]
      const valB = sortCol === 'label' ? b.label : b[sortCol]
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      const numA = valA as number
      const numB = valB as number
      return sortDir === 'asc' ? numA - numB : numB - numA
    })

    return filas
  }, [filasCrudasMes, filasCrudasAnio, horasTrabPorMes, horasTrabPorMesAnio, horasTrabPorDepto, horasTrabPorDeptoAnio, vistaTab, sortCol, sortDir])

  // Totales para fila sticky — deben coincidir con la vista activa
  const kpisTabla = useMemo(() => {
    if (vistaTab === 'cliente') return kpis
    // Vistas mes/depto muestran año completo → totales del año
    return calcularKpis(filasCrudasAnio, horasTrabPorMesAnio)
  }, [vistaTab, kpis, filasCrudasAnio, horasTrabPorMesAnio])

  const totales: FilaInforme = {
    key: '__totales__',
    label: 'Total',
    ingresosPrev: kpisTabla.ingresosPrev,
    ingresosReal: kpisTabla.ingresosReal,
    pctRealizacion: kpisTabla.pctRealizacion,
    horasAsignadas: kpisTabla.horasAsignadas,
    horasTrabajables: kpisTabla.horasTrabajables,
    pctCarga: kpisTabla.pctCarga,
    euroHoraEfectivo: kpisTabla.euroHoraEfectivo,
    horasNoAsignadas: kpisTabla.horasNoAsignadas,
  }

  const hhiStyle = hhiColor(kpis.hhiNivel)
  const cargaStyle = cargaColor(kpis.pctCarga)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Informes</h1>
          <p className="mt-0.5 text-sm text-muted-foreground flex items-center gap-1.5">
            Análisis de ingresos, carga y concentración por cliente, mes y departamento
            <span className="group relative">
              <Info className="h-3.5 w-3.5 text-muted-foreground/60 cursor-help" />
              <span className="absolute left-1/2 -translate-x-1/2 top-6 z-50 hidden group-hover:block w-72 rounded-lg border border-border bg-white p-3 text-xs text-muted-foreground shadow-lg leading-relaxed">
                <strong className="text-foreground block mb-1">Dato principal: Facturado (partida real)</strong>
                Las métricas de negocio (concentración, tendencia, €/hora efectivo) usan la <em>partida real</em> de cada OT.
                Cuando una OT aún no tiene partida real confirmada, se usa la <em>partida prevista</em> como aproximación.
                <br /><br />
                Las <em>horas asignadas</em> siempre se calculan desde la partida prevista (son una herramienta de planificación).
              </span>
            </span>
          </p>
        </div>
        <MonthNavigator value={month} onChange={setMonth} />
      </div>

      {/* Filtros */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <select
          value={egFilter}
          onChange={(e) => setEgFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">Empresa: Todas</option>
          {empresasGrupo.map((eg) => (
            <option key={eg.id} value={eg.id}>{eg.nombre}</option>
          ))}
        </select>

        <FilterPills
          options={['Todos', 'Facturable', 'Externo', 'Interno']}
          active={tipoProyecto === 'todos' ? 'Todos' : tipoProyecto === 'facturable' ? 'Facturable' : tipoProyecto === 'externo' ? 'Externo' : 'Interno'}
          onChange={(v) => {
            const map: Record<string, TipoProyecto> = { Todos: 'todos', Facturable: 'facturable', Externo: 'externo', Interno: 'interno' }
            setTipoProyecto(map[v] ?? 'facturable')
          }}
        />

        <select
          value={estadoOT}
          onChange={(e) => setEstadoOT(e.target.value as EstadoOTFilter)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">Estado OT: Todos</option>
          <option value="Planificado">Planificado</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Facturado">Facturado</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4 lg:grid-cols-6">
        {/* FACTURADO — la métrica primaria */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-primary">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Facturado</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {kpis.ingresosReal > 0 ? formatMoney(kpis.ingresosReal) : '—'}
          </p>
          <div className="mt-1">
            {kpis.ingresosReal > 0 ? (
              <KpiDelta actual={kpis.ingresosReal} anterior={kpisPrev.ingresosReal} />
            ) : (
              <span className="text-[11px] text-muted-foreground">Sin partida real confirmada</span>
            )}
          </div>
        </div>

        {/* % Realización */}
        <div className={`rounded-xl bg-white p-5 shadow-sm border-t-4 ${
          kpis.pctRealizacion >= 100 ? 'border-t-emerald-500' :
          kpis.pctRealizacion >= 90 ? 'border-t-amber-500' :
          kpis.pctRealizacion > 0 ? 'border-t-red-500' : 'border-t-gray-300'
        }`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">% Realización</p>
          <p className={`mt-1 text-3xl font-bold ${kpis.pctRealizacion > 0 ? realizacionColor(kpis.pctRealizacion) : 'text-muted-foreground'}`}>
            {kpis.pctRealizacion > 0 ? `${Math.round(kpis.pctRealizacion)}%` : '—'}
          </p>
          <div className="mt-1">
            <span className="text-[11px] text-muted-foreground">
              Plan: {formatMoney(kpis.ingresosPrev)}
            </span>
          </div>
        </div>

        {/* Horas asignadas */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-purple-500">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Horas asignadas</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{formatHoras(kpis.horasAsignadas)}</p>
          <div className="mt-1">
            <KpiDelta actual={kpis.horasAsignadas} anterior={kpisPrev.horasAsignadas} />
          </div>
        </div>

        {/* % Carga */}
        <div className={`rounded-xl bg-white p-5 shadow-sm border-t-4 ${cargaStyle.border}`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">% Carga</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{Math.round(kpis.pctCarga)}%</p>
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">{formatHoras(kpis.horasNoAsignadas)} sin asignar</span>
            <KpiDelta actual={kpis.pctCarga} anterior={kpisPrev.pctCarga} invertir />
          </div>
        </div>

        {/* €/hora efectivo */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-amber-500">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">€/hora efectivo</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{formatEuroHora(kpis.euroHoraEfectivo)}</p>
          <div className="mt-1">
            <KpiDelta actual={kpis.euroHoraEfectivo} anterior={kpisPrev.euroHoraEfectivo} />
          </div>
        </div>

        {/* Concentración */}
        <div className={`rounded-xl bg-white p-5 shadow-sm border-t-4 ${kpis.hhiNivel === 'diversificado' ? 'border-t-emerald-500' : kpis.hhiNivel === 'moderado' ? 'border-t-amber-500' : 'border-t-red-500'}`}>
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
            Concentración
          </p>
          <p className="mt-1 text-3xl font-bold text-foreground">{kpis.hhi}</p>
          <div className="mt-1 flex items-center gap-2">
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${hhiStyle.text} ${hhiStyle.bg}`}>
              {hhiStyle.label}
            </span>
            <span className="text-[11px] text-muted-foreground">
              Top: {kpis.topClienteNombre} ({kpis.topClientePct}%)
            </span>
          </div>
        </div>
      </div>

      {/* Gráficos */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <GraficoIngresos datos={datosMensuales} mesActual={month} />
        </div>
        <div className="lg:col-span-2">
          <GraficoConcentracion
            datos={datosConcentracion}
            hhi={kpis.hhi}
            hhiNivel={kpis.hhiNivel}
          />
        </div>
      </div>

      {/* Heatmap de carga */}
      <div className="mt-5">
        <HeatmapCarga datos={datosHeatmap} mesActual={month} />
      </div>

      {/* Pestañas de vista */}
      <div className="mt-6 flex items-end gap-1">
        {(['cliente', 'mes', 'depto'] as const).map((tab) => {
          const labels: Record<VistaTab, string> = {
            cliente: 'Por Cliente',
            mes: 'Por Mes',
            depto: 'Por Departamento',
          }
          const isActive = vistaTab === tab
          return (
            <button
              key={tab}
              onClick={() => setVistaTab(tab)}
              className={`rounded-t-lg px-4 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white text-foreground shadow-sm border border-b-0 border-border'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {labels[tab]}
            </button>
          )
        })}
        <span className="ml-2 pb-2 text-[11px] text-muted-foreground">
          {vistaTab === 'cliente'
            ? `Datos del mes seleccionado`
            : `Datos del año ${anio} completo`}
        </span>

        {/* Expandir/colapsar todos */}
        {filasTabla.length > 0 && (
          <button
            onClick={() => {
              if (expandedKeys.size > 0) {
                setExpandedKeys(new Set())
              } else {
                // Expandir todos los niveles 0 y 1
                const allKeys = new Set<string>()
                for (const fila of filasTabla) {
                  allKeys.add(fila.key)
                  if (fila.children) {
                    for (const child of fila.children) allKeys.add(child.key)
                  }
                }
                setExpandedKeys(allKeys)
              }
            }}
            className="ml-auto mb-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={expandedKeys.size > 0 ? 'Colapsar todos' : 'Expandir todos'}
          >
            {expandedKeys.size > 0 ? (
              <><ChevronsDownUp className="h-3.5 w-3.5" /> Colapsar</>
            ) : (
              <><ChevronsUpDown className="h-3.5 w-3.5" /> Expandir</>
            )}
          </button>
        )}
      </div>

      {/* Tabla */}
      <div className="rounded-b-xl rounded-tr-xl bg-white shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
              <tr className="border-b border-border">
                {([
                  { key: 'label' as SortColumn, label: vistaTab === 'cliente' ? 'Cliente' : 'Periodo', align: 'left', className: 'pl-4 pr-2 w-[220px]' },
                  { key: 'ingresosReal' as SortColumn, label: 'Facturado', align: 'right', className: 'px-3' },
                  { key: 'ingresosPrev' as SortColumn, label: 'Planificado', align: 'right', className: 'px-3' },
                  { key: 'pctRealizacion' as SortColumn, label: '% Realiz.', align: 'right', className: 'px-3' },
                  { key: 'horasAsignadas' as SortColumn, label: 'Horas', align: 'right', className: 'px-3' },
                  { key: 'pctCarga' as SortColumn, label: '% Carga', align: 'right', className: 'px-3' },
                  { key: 'euroHoraEfectivo' as SortColumn, label: '€/h efect.', align: 'right', className: 'px-3' },
                  { key: 'horasNoAsignadas' as SortColumn, label: 'H. no asig.', align: 'right', className: 'px-3' },
                ] as const).map((col) => (
                  <th
                    key={col.key}
                    className={`py-2.5 ${col.className} text-${col.align} text-[10px] font-semibold uppercase tracking-wider text-muted-foreground cursor-pointer select-none hover:text-foreground transition-colors`}
                    onClick={() => toggleSort(col.key)}
                  >
                    <span className="inline-flex items-center gap-0.5">
                      {col.label}
                      {sortCol === col.key && (
                        <span className="text-foreground">{sortDir === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filasTabla.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    No hay datos para este periodo con los filtros seleccionados.
                    <br />
                    <span className="text-xs">Prueba a cambiar el mes o los filtros.</span>
                  </td>
                </tr>
              ) : (
                filasTabla.map((fila) => (
                  <FilaColapsable
                    key={fila.key}
                    fila={fila}
                    nivel={0}
                    expanded={expandedKeys.has(fila.key)}
                    onToggle={toggleExpand}
                    expandedKeys={expandedKeys}
                  />
                ))
              )}
            </tbody>

            {/* Fila totales sticky */}
            {filasTabla.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-border">
                <tr>
                  <td className="py-3 pl-4 pr-2 text-sm font-bold text-foreground">
                    Total
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {totales.ingresosReal > 0 ? formatMoney(totales.ingresosReal) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-muted-foreground">
                    {formatMoney(totales.ingresosPrev)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums">
                    {totales.ingresosPrev > 0 && totales.ingresosReal > 0 ? (
                      <span className={realizacionColor(totales.pctRealizacion)}>
                        {Math.round(totales.pctRealizacion)}%
                      </span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {formatHoras(totales.horasAsignadas)}
                  </td>
                  <td className="py-3 px-3">
                    {totales.horasTrabajables > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <BarraCargaMini pct={totales.pctCarga} />
                        <span className={`text-sm tabular-nums font-bold ${cargaColor(totales.pctCarga).text}`}>
                          {Math.round(totales.pctCarga)}%
                        </span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {totales.horasAsignadas > 0 ? formatEuroHora(totales.euroHoraEfectivo) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-amber-600">
                    {totales.horasTrabajables > 0 ? formatHoras(totales.horasNoAsignadas) : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
