'use client'

import { useState, useMemo } from 'react'
import { ChevronsUpDown, ChevronsDownUp, Info } from 'lucide-react'
import { useTableState } from '@/hooks/use-table-state'
import { SortableHeader } from '@/components/sortable-header'
import { formatMoney } from '@/lib/helpers'
import { DateRangeSelector, generateMonthRange, rangoPrevioEquivalente, defaultDateRange } from '@/components/date-range-selector'
import type { DateRange } from '@/components/date-range-selector'
import { MultiSelectFilter, type FilterOption } from '@/components/multi-select-filter'
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
  vistaCliente,
  vistaMes,
  vistaDepto,
} from '@/lib/helpers-informes'
import type { FilaInforme, KpisInformes, TipoProyectoFiltro } from '@/lib/helpers-informes'
import { FilaColapsable, formatHoras, formatEuroHora, realizacionColor, cargaColor, BarraCargaMini } from './fila-colapsable'
import { KpiDelta } from './kpi-delta'
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
type EstadoOT = 'Planificado' | 'Realizado' | 'Confirmado' | 'Facturado'
type SortColumn = 'label' | 'ingresosReal' | 'ingresosPrev' | 'pctRealizacion' | 'horasAsignadas' | 'pctCarga' | 'euroHoraEfectivo' | 'horasNoAsignadas'

const TIPO_PROYECTO_OPTIONS: FilterOption[] = [
  { value: 'facturable', label: 'Facturable' },
  { value: 'externo', label: 'Externo' },
  { value: 'interno', label: 'Interno' },
]

const ESTADO_OT_OPTIONS: FilterOption[] = [
  { value: 'Planificado', label: 'Planificado' },
  { value: 'Realizado', label: 'Realizado' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Facturado', label: 'Facturado' },
]

function hhiColor(nivel: KpisInformes['hhiNivel']): { text: string; bg: string; label: string } {
  if (nivel === 'diversificado') return { text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Diversificado' }
  if (nivel === 'moderado') return { text: 'text-amber-700', bg: 'bg-amber-50', label: 'Moderado' }
  return { text: 'text-red-700', bg: 'bg-red-50', label: 'Concentrado' }
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
  const { sortCol: sortColRaw, sortDir, setParams, searchParams } = useTableState({
    defaultSort: { col: 'ingresosReal', dir: 'desc' },
  })
  const sortCol = (sortColRaw ?? 'ingresosReal') as SortColumn

  // Rango de fechas por defecto: mes actual
  const defaultRange = useMemo(() => defaultDateRange(), [])

  // Leer parámetros de la URL (con defaults)
  const desde = searchParams.get('desde') || defaultRange.desde
  const hasta = searchParams.get('hasta') || defaultRange.hasta
  const vistaTab = (searchParams.get('vista') as VistaTab) || 'cliente'

  // Filtros multi-select (array vacío = sin filtro)
  const filtroEgs = useMemo(() => {
    const v = searchParams.get('eg')
    return v ? v.split(',') : []
  }, [searchParams])
  const filtroTipos = useMemo(() => {
    const v = searchParams.get('tipo')
    return v ? (v.split(',') as TipoProyectoFiltro[]) : []
  }, [searchParams])
  const filtroEstadosOT = useMemo(() => {
    const v = searchParams.get('estadoOT')
    return v ? (v.split(',') as EstadoOT[]) : []
  }, [searchParams])
  const filtroDeptos = useMemo(() => {
    const v = searchParams.get('depto')
    return v ? v.split(',') : []
  }, [searchParams])

  // Estado puramente de UI (no va a la URL)
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const setArrayParam = (key: string, values: string[]) => {
    setParams({ [key]: values.length > 0 ? values.join(',') : null })
    setExpandedKeys(new Set())
  }

  const setDateRange = (range: DateRange) => {
    const isDefault = range.desde === defaultRange.desde && range.hasta === defaultRange.hasta
    setParams({ desde: isDefault ? null : range.desde, hasta: isDefault ? null : range.hasta })
    setExpandedKeys(new Set())
  }
  const setVistaTab = (v: VistaTab) => { setParams({ vista: v === 'cliente' ? null : v }); setExpandedKeys(new Set()) }

  const setFiltroEgs = (vals: string[]) => {
    // Al cambiar empresas grupo, limpiar departamentos seleccionados que ya no aplican
    const deptosValidos = vals.length === 0
      ? filtroDeptos
      : filtroDeptos.filter((dId) => {
          const d = departamentos.find((x) => x.id === dId)
          return d && vals.includes(d.empresa_grupo_id)
        })
    setParams({
      eg: vals.length > 0 ? vals.join(',') : null,
      depto: deptosValidos.length > 0 ? deptosValidos.join(',') : null,
    })
    setExpandedKeys(new Set())
  }
  const setFiltroTipos = (vals: string[]) => setArrayParam('tipo', vals)
  const setFiltroEstadosOT = (vals: string[]) => setArrayParam('estadoOT', vals)
  const setFiltroDeptos = (vals: string[]) => setArrayParam('depto', vals)

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

  // Meses del rango seleccionado
  const mesesRango = useMemo(() => generateMonthRange(desde, hasta), [desde, hasta])
  const esRangoUnico = mesesRango.length === 1

  // Año del "desde" (para gráficos y heatmap que necesitan año completo)
  const anio = useMemo(() => {
    const d = new Date(desde + 'T00:00:00')
    return d.getFullYear()
  }, [desde])



  // Filas crudas del rango seleccionado (para todas las vistas y KPIs)
  const filasCrudasRango = useMemo(
    () => buildFilasCrudas(asignaciones, maps, filtroEgs, mesesRango, filtroTipos, filtroEstadosOT, filtroDeptos),
    [asignaciones, maps, filtroEgs, mesesRango, filtroTipos, filtroEstadosOT, filtroDeptos],
  )

  // Horas trabajables del rango
  const horasTrabRango = useMemo(
    () => calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filtroEgs, filtroDeptos, mesesRango),
    [personas, personasDepartamentos, horasTrabajables, filtroEgs, filtroDeptos, mesesRango],
  )

  const horasTrabDeptoRango = useMemo(
    () => calcularHorasTrabajablesPorDepto(personas, personasDepartamentos, horasTrabajables, filtroEgs, filtroDeptos, mesesRango),
    [personas, personasDepartamentos, horasTrabajables, filtroEgs, filtroDeptos, mesesRango],
  )

  // KPIs — del rango seleccionado
  const kpis = useMemo(
    () => calcularKpis(filasCrudasRango, horasTrabRango),
    [filasCrudasRango, horasTrabRango],
  )

  // KPIs del periodo anterior equivalente (para deltas comparativos)
  const rangoPrev = useMemo(() => rangoPrevioEquivalente(desde, hasta), [desde, hasta])
  const mesesPrev = useMemo(() => generateMonthRange(rangoPrev.desde, rangoPrev.hasta), [rangoPrev])

  const kpisPrev = useMemo(() => {
    const filasPrev = buildFilasCrudas(asignaciones, maps, filtroEgs, mesesPrev, filtroTipos, filtroEstadosOT, filtroDeptos)
    const htPrev = calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filtroEgs, filtroDeptos, mesesPrev)
    return calcularKpis(filasPrev, htPrev)
  }, [asignaciones, maps, filtroEgs, mesesPrev, filtroTipos, filtroEstadosOT, filtroDeptos, personas, personasDepartamentos, horasTrabajables])

  // Heatmap departamento × mes (año completo del "desde")
  const datosHeatmap = useMemo(
    () => calcularHeatmapCarga(
      asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos,
      filtroEgs, anio, filtroTipos, filtroEstadosOT, filtroDeptos,
    ),
    [asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos, filtroEgs, anio, filtroTipos, filtroEstadosOT, filtroDeptos],
  )

  // Datos para gráficos (año completo del "desde")
  const datosMensuales = useMemo(
    () => calcularDatosMensualesBarras(asignaciones, maps, filtroEgs, anio, filtroTipos, filtroEstadosOT, filtroDeptos),
    [asignaciones, maps, filtroEgs, anio, filtroTipos, filtroEstadosOT, filtroDeptos],
  )

  const datosConcentracion = useMemo(
    () => calcularConcentracionClientes(filasCrudasRango),
    [filasCrudasRango],
  )

  // Sparklines de tendencia por cliente (últimos 6 meses desde el final del rango)
  const sparklinesPorCliente = useMemo(
    () => calcularSparklines(asignaciones, maps, filtroEgs, hasta, filtroTipos, filtroEstadosOT, filtroDeptos, 'cliente'),
    [asignaciones, maps, filtroEgs, hasta, filtroTipos, filtroEstadosOT, filtroDeptos],
  )

  // Opciones para los multi-select
  const empresaGrupoOptions: FilterOption[] = useMemo(
    () => empresasGrupo.map((eg) => ({ value: eg.id, label: eg.nombre })),
    [empresasGrupo],
  )

  // Departamentos: si hay empresa_grupo seleccionada, solo los de esas empresas_grupo
  const departamentoOptions: FilterOption[] = useMemo(() => {
    const filtered = filtroEgs.length > 0
      ? departamentos.filter((d) => filtroEgs.includes(d.empresa_grupo_id))
      : departamentos
    return filtered
      .map((d) => ({ value: d.id, label: d.nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [departamentos, filtroEgs])

  // Filas de la tabla según la vista — todas usan el rango seleccionado
  const filasTabla = useMemo(() => {
    let filas: FilaInforme[]
    if (vistaTab === 'cliente') {
      filas = vistaCliente(filasCrudasRango, horasTrabRango, horasTrabDeptoRango, sparklinesPorCliente)
    } else if (vistaTab === 'mes') {
      filas = vistaMes(filasCrudasRango, horasTrabRango, horasTrabDeptoRango)
    } else {
      filas = vistaDepto(filasCrudasRango, horasTrabRango, horasTrabDeptoRango)
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
  }, [filasCrudasRango, horasTrabRango, horasTrabDeptoRango, vistaTab, sortCol, sortDir, sparklinesPorCliente])

  // Totales para fila sticky — siempre del rango seleccionado
  const kpisTabla = kpis

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
      <div>
        <h1 className="text-xl font-bold text-foreground">Datos</h1>
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

      {/* Filtros + selector de fechas en una sola fila */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DateRangeSelector value={{ desde, hasta }} onChange={setDateRange} />

        <div className="h-5 w-px bg-border shrink-0" />

        <MultiSelectFilter
          label="Empresa"
          options={empresaGrupoOptions}
          selected={filtroEgs}
          onChange={setFiltroEgs}
          searchable
        />

        <MultiSelectFilter
          label="Departamento"
          options={departamentoOptions}
          selected={filtroDeptos}
          onChange={setFiltroDeptos}
          searchable
        />

        <MultiSelectFilter
          label="Tipo proyecto"
          options={TIPO_PROYECTO_OPTIONS}
          selected={filtroTipos}
          onChange={setFiltroTipos}
        />

        <MultiSelectFilter
          label="Estado OT"
          options={ESTADO_OT_OPTIONS}
          selected={filtroEstadosOT}
          onChange={setFiltroEstadosOT}
        />
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
          <GraficoIngresos datos={datosMensuales} mesActual={hasta} />
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
        <HeatmapCarga datos={datosHeatmap} mesActual={hasta} />
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
          {esRangoUnico
            ? 'Datos del mes seleccionado'
            : `Datos de ${mesesRango.length} meses`}
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
                  { key: 'label' as SortColumn, label: vistaTab === 'cliente' ? 'Cliente' : 'Periodo', align: 'left' as const, className: 'pl-4 pr-2 w-[220px]' },
                  { key: 'ingresosReal' as SortColumn, label: 'Facturado', align: 'right' as const, className: 'px-3' },
                  { key: 'ingresosPrev' as SortColumn, label: 'Planificado', align: 'right' as const, className: 'px-3' },
                  { key: 'pctRealizacion' as SortColumn, label: '% Realiz.', align: 'right' as const, className: 'px-3' },
                  { key: 'horasAsignadas' as SortColumn, label: 'Horas', align: 'right' as const, className: 'px-3' },
                  { key: 'pctCarga' as SortColumn, label: '% Carga', align: 'right' as const, className: 'px-3' },
                  { key: 'euroHoraEfectivo' as SortColumn, label: '€/h efect.', align: 'right' as const, className: 'px-3' },
                  { key: 'horasNoAsignadas' as SortColumn, label: 'H. no asig.', align: 'right' as const, className: 'px-3' },
                ]).map((col) => (
                  <th key={col.key} className={`py-2.5 ${col.className}`}>
                    <SortableHeader
                      label={col.label}
                      column={col.key}
                      currentCol={sortCol}
                      currentDir={sortDir}
                      onToggle={(c) => toggleSort(c as SortColumn)}
                      align={col.align}
                    />
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
