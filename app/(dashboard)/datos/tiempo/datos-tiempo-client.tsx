'use client'

import { useMemo } from 'react'
import { useTableState } from '@/hooks/use-table-state'
import { formatMoney } from '@/lib/helpers'
import {
  buildLookupMaps,
  buildFilasCrudas,
  calcularKpis,
  calcularHorasTrabajablesPorMes,
  calcularHorasTrabajablesPorDepto,
  calcularDatosMensualesBarras,
  calcularHeatmapCarga,
  vistaMes,
} from '@/lib/helpers-informes'
import type { FilaInforme } from '@/lib/helpers-informes'
import type {
  OrdenTrabajo, Asignacion, Persona, Proyecto, Empresa,
  CuotaPlanificacion, HorasTrabajables, PersonaDepartamento,
  EmpresaGrupo, Departamento,
} from '@/lib/supabase/types'
import { formatHoras, formatEuroHora } from '../components/helpers-ui'
import { KpiDelta } from '../components/kpi-delta'
import { FiltrosDatosBarra, useFiltersDatos } from '../components/filtros-datos'
import { GraficoIngresos } from '../components/grafico-ingresos'
import { HeatmapCarga } from '../components/heatmap-carga'
import { LineasTendencia, type DatoTendenciaMes } from '../components/lineas-tendencia'
import { SparklineClientes, type ClienteSparklineData } from '../components/sparklines-clientes'
import { TablaInforme } from '../components/tabla-informe'

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

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

export function DatosTiempoClient({
  ordenesTrabajo, asignaciones, personas, proyectos, empresas,
  cuotas, horasTrabajables, personasDepartamentos, empresasGrupo, departamentos,
}: Props) {
  const maps = useMemo(
    () => buildLookupMaps(ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo),
    [ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo],
  )

  const { setParams, searchParams } = useTableState({
    defaultSort: { col: 'ingresosReal', dir: 'desc' },
  })

  // Año seleccionado (default: año actual)
  const anio = Number(searchParams.get('anio')) || new Date().getFullYear()
  const setAnio = (a: number) => setParams({ anio: a === new Date().getFullYear() ? null : String(a) })

  const filters = useFiltersDatos({ searchParams, setParams, departamentos })

  // Meses del año y del año anterior (para comparar)
  const mesActual = useMemo(() => {
    const now = new Date()
    const y = now.getFullYear()
    const m = String(now.getMonth() + 1).padStart(2, '0')
    return `${y}-${m}-01`
  }, [])

  const mesesAnio = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      return `${anio}-${m}-01`
    })
  }, [anio])

  const mesesAnioAnterior = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0')
      return `${anio - 1}-${m}-01`
    })
  }, [anio])

  // ── Datos año actual ──

  const filasCrudasAnio = useMemo(
    () => buildFilasCrudas(asignaciones, maps, filters.filtroEgs, mesesAnio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos),
    [asignaciones, maps, filters.filtroEgs, mesesAnio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos],
  )

  const horasTrabAnio = useMemo(
    () => calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesAnio),
    [personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesAnio],
  )

  const horasTrabDeptoAnio = useMemo(
    () => calcularHorasTrabajablesPorDepto(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesAnio),
    [personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesAnio],
  )

  const kpisAnio = useMemo(
    () => calcularKpis(filasCrudasAnio, horasTrabAnio),
    [filasCrudasAnio, horasTrabAnio],
  )

  // ── Datos año anterior (para comparar) ──

  const kpisAnioAnterior = useMemo(() => {
    const filasPrev = buildFilasCrudas(asignaciones, maps, filters.filtroEgs, mesesAnioAnterior, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos)
    const htPrev = calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesAnioAnterior)
    return calcularKpis(filasPrev, htPrev)
  }, [asignaciones, maps, filters.filtroEgs, mesesAnioAnterior, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, personas, personasDepartamentos, horasTrabajables])

  // ── Gráfico de barras ──
  const datosMensuales = useMemo(
    () => calcularDatosMensualesBarras(asignaciones, maps, filters.filtroEgs, anio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos),
    [asignaciones, maps, filters.filtroEgs, anio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos],
  )

  // ── Heatmap ──
  const datosHeatmap = useMemo(
    () => calcularHeatmapCarga(
      asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos,
      filters.filtroEgs, anio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos,
    ),
    [asignaciones, maps, personas, personasDepartamentos, horasTrabajables, departamentos, filters.filtroEgs, anio, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos],
  )

  // ── Líneas de tendencia (KPIs mes a mes) ──
  const datosTendencia: DatoTendenciaMes[] = useMemo(() => {
    return mesesAnio.map((mes, i) => {
      const filasMes = buildFilasCrudas(asignaciones, maps, filters.filtroEgs, [mes], filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos)
      const htMes = calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, [mes])
      const kpisMes = calcularKpis(filasMes, htMes)
      return {
        mesCorto: MESES_CORTOS[i],
        facturado: kpisMes.ingresosReal > 0 ? kpisMes.ingresosReal : kpisMes.ingresosPrev,
        pctCarga: kpisMes.pctCarga,
        euroHora: kpisMes.euroHoraEfectivo,
      }
    })
  }, [asignaciones, maps, filters.filtroEgs, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, personas, personasDepartamentos, horasTrabajables, mesesAnio])

  // ── Sparklines por cliente (año completo) ──
  const sparklineClientes: ClienteSparklineData[] = useMemo(() => {
    const datosPorCliente = new Map<string, { nombre: string; meses: Map<string, number> }>()
    for (const f of filasCrudasAnio) {
      const key = f.empresaId ?? '__interno__'
      if (!datosPorCliente.has(key)) {
        datosPorCliente.set(key, { nombre: f.empresaNombre, meses: new Map() })
      }
      const entry = datosPorCliente.get(key)!
      entry.meses.set(f.mesAnio, (entry.meses.get(f.mesAnio) ?? 0) + f.ingresosMejor)
    }

    // Ordenar por total desc, tomar top 9
    const sorted = [...datosPorCliente.entries()]
      .map(([key, data]) => {
        const total = [...data.meses.values()].reduce((s, v) => s + v, 0)
        return { key, nombre: data.nombre, meses: data.meses, total }
      })
      .sort((a, b) => b.total - a.total)
      .slice(0, 9)

    return sorted.map((c) => ({
      nombre: c.nombre,
      datos: mesesAnio.map((m) => c.meses.get(m) ?? 0),
      totalAnio: c.total,
      mesesLabels: MESES_CORTOS,
    }))
  }, [filasCrudasAnio, mesesAnio])

  // ── Tabla por mes ──
  const filasTabla = useMemo(
    () => vistaMes(filasCrudasAnio, horasTrabAnio, horasTrabDeptoAnio),
    [filasCrudasAnio, horasTrabAnio, horasTrabDeptoAnio],
  )

  const totales: FilaInforme = {
    key: '__totales__', label: 'Total',
    ingresosPrev: kpisAnio.ingresosPrev, ingresosReal: kpisAnio.ingresosReal,
    pctRealizacion: kpisAnio.pctRealizacion, horasAsignadas: kpisAnio.horasAsignadas,
    horasTrabajables: kpisAnio.horasTrabajables, pctCarga: kpisAnio.pctCarga,
    euroHoraEfectivo: kpisAnio.euroHoraEfectivo, horasNoAsignadas: kpisAnio.horasNoAsignadas,
  }

  // ── Años disponibles (derivar de OTs) ──
  const aniosDisponibles = useMemo(() => {
    const años = new Set<number>()
    for (const ot of ordenesTrabajo) {
      const y = new Date(ot.mes_anio + 'T00:00:00').getFullYear()
      años.add(y)
    }
    // Añadir año actual siempre
    años.add(new Date().getFullYear())
    return [...años].sort((a, b) => b - a)
  }, [ordenesTrabajo])

  return (
    <div>
      {/* Filtros + Selector de año */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrosDatosBarra
          empresasGrupo={empresasGrupo}
          departamentos={departamentos}
          {...filters}
        />

        {/* Selector de año */}
        <div className="flex items-center gap-1">
          {aniosDisponibles.map((a) => (
            <button
              key={a}
              onClick={() => setAnio(a)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                anio === a
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
              }`}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* KPI Cards — acumulado del año */}
      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {/* Facturado acumulado */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-primary">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Facturado acumulado</p>
          <p className="mt-1 text-3xl font-bold text-foreground">
            {kpisAnio.ingresosReal > 0 ? formatMoney(kpisAnio.ingresosReal) : '—'}
          </p>
          <div className="mt-1">
            <KpiDelta actual={kpisAnio.ingresosReal} anterior={kpisAnioAnterior.ingresosReal} />
            <span className="ml-2 text-[11px] text-muted-foreground">vs {anio - 1}</span>
          </div>
        </div>

        {/* Planificado acumulado */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-blue-500">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Planificado acumulado</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{formatMoney(kpisAnio.ingresosPrev)}</p>
          <div className="mt-1">
            <KpiDelta actual={kpisAnio.ingresosPrev} anterior={kpisAnioAnterior.ingresosPrev} />
            <span className="ml-2 text-[11px] text-muted-foreground">vs {anio - 1}</span>
          </div>
        </div>

        {/* Media €/hora */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-amber-500">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Media €/hora</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{formatEuroHora(kpisAnio.euroHoraEfectivo)}</p>
          <div className="mt-1">
            <KpiDelta actual={kpisAnio.euroHoraEfectivo} anterior={kpisAnioAnterior.euroHoraEfectivo} />
            <span className="ml-2 text-[11px] text-muted-foreground">vs {anio - 1}</span>
          </div>
        </div>

        {/* Media % Carga */}
        <div className="rounded-xl bg-white p-5 shadow-sm border-t-4 border-t-purple-500">
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Media % Carga</p>
          <p className="mt-1 text-3xl font-bold text-foreground">{Math.round(kpisAnio.pctCarga)}%</p>
          <div className="mt-1 flex flex-col gap-0.5">
            <span className="text-[11px] text-muted-foreground">
              {formatHoras(kpisAnio.horasAsignadas)} / {formatHoras(kpisAnio.horasTrabajables)}
            </span>
            <KpiDelta actual={kpisAnio.pctCarga} anterior={kpisAnioAnterior.pctCarga} invertir />
          </div>
        </div>
      </div>

      {/* Gráfico de barras + Líneas de tendencia */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <GraficoIngresos datos={datosMensuales} mesActual={mesActual} />
        <LineasTendencia datos={datosTendencia} />
      </div>

      {/* Heatmap de carga */}
      <div className="mt-5">
        <HeatmapCarga datos={datosHeatmap} mesActual={mesActual} />
      </div>

      {/* Sparklines por cliente */}
      <div className="mt-5">
        <SparklineClientes clientes={sparklineClientes} />
      </div>

      {/* Tabla por mes */}
      <div className="mt-6">
        <TablaInforme
          filas={filasTabla}
          totales={totales}
          firstColumnLabel="Mes"
          header={
            <span className="pb-2 text-[11px] text-muted-foreground">
              Datos de {anio} — 12 meses
            </span>
          }
        />
      </div>
    </div>
  )
}
