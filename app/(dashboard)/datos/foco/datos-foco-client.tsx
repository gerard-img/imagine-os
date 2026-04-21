'use client'

import { useMemo } from 'react'
import { useTableState } from '@/hooks/use-table-state'
import { formatMoney } from '@/lib/helpers'
import { DateRangeSelector, generateMonthRange, rangoPrevioEquivalente, defaultDateRange } from '@/components/date-range-selector'
import type { DateRange } from '@/components/date-range-selector'
import {
  buildLookupMaps,
  buildFilasCrudas,
  calcularKpis,
  calcularHorasTrabajablesPorMes,
  calcularHorasTrabajablesPorDepto,
  calcularConcentracionClientes,
  vistaCliente,
} from '@/lib/helpers-informes'
import type { FilaInforme } from '@/lib/helpers-informes'
import type {
  OrdenTrabajo, Asignacion, Persona, Proyecto, Empresa,
  CuotaPlanificacion, HorasTrabajables, PersonaDepartamento,
  EmpresaGrupo, Departamento, CatalogoServicio,
} from '@/lib/supabase/types'
import { formatHoras, formatEuroHora, realizacionColor, cargaColor, hhiColor } from '../components/helpers-ui'
import { KpiDelta } from '../components/kpi-delta'
import { FiltrosDatosBarra, useFiltersDatos } from '../components/filtros-datos'
import { GraficoConcentracion } from '../components/grafico-concentracion'
import { RankingEuroHora, type ClienteEuroHora } from '../components/ranking-euro-hora'
import { BarrasCargaDepto, type DeptoCarga } from '../components/barras-carga-depto'
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
  catalogoServicios: CatalogoServicio[]
}

type VistaTab = 'cliente' | 'depto'

export function DatosFocoClient({
  ordenesTrabajo, asignaciones, personas, proyectos, empresas,
  cuotas, horasTrabajables, personasDepartamentos, empresasGrupo, departamentos,
  catalogoServicios,
}: Props) {
  const maps = useMemo(
    () => buildLookupMaps(ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo),
    [ordenesTrabajo, proyectos, empresas, cuotas, departamentos, empresasGrupo],
  )

  const { setParams, searchParams } = useTableState({
    defaultSort: { col: 'ingresosReal', dir: 'desc' },
  })

  const defaultRange = useMemo(() => defaultDateRange(), [])
  const desde = searchParams.get('desde') || defaultRange.desde
  const hasta = searchParams.get('hasta') || defaultRange.hasta
  const vistaTab = (searchParams.get('vista') as VistaTab) || 'cliente'

  const filters = useFiltersDatos({ searchParams, setParams, departamentos, catalogoServicios })

  const setDateRange = (range: DateRange) => {
    const isDefault = range.desde === defaultRange.desde && range.hasta === defaultRange.hasta
    setParams({ desde: isDefault ? null : range.desde, hasta: isDefault ? null : range.hasta })
  }
  const setVistaTab = (v: VistaTab) => setParams({ vista: v === 'cliente' ? null : v })

  // ── Datos calculados ──

  const mesesRango = useMemo(() => generateMonthRange(desde, hasta), [desde, hasta])
  const esRangoUnico = mesesRango.length === 1

  const filasCrudasRango = useMemo(
    () => buildFilasCrudas(asignaciones, maps, filters.filtroEgs, mesesRango, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, filters.filtroServicios),
    [asignaciones, maps, filters.filtroEgs, mesesRango, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, filters.filtroServicios],
  )

  const horasTrabRango = useMemo(
    () => calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesRango),
    [personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesRango],
  )

  const horasTrabDeptoRango = useMemo(
    () => calcularHorasTrabajablesPorDepto(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesRango),
    [personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesRango],
  )

  const kpis = useMemo(
    () => calcularKpis(filasCrudasRango, horasTrabRango),
    [filasCrudasRango, horasTrabRango],
  )

  // KPIs periodo anterior
  const rangoPrev = useMemo(() => rangoPrevioEquivalente(desde, hasta), [desde, hasta])
  const mesesPrev = useMemo(() => generateMonthRange(rangoPrev.desde, rangoPrev.hasta), [rangoPrev])

  const kpisPrev = useMemo(() => {
    const filasPrev = buildFilasCrudas(asignaciones, maps, filters.filtroEgs, mesesPrev, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, filters.filtroServicios)
    const htPrev = calcularHorasTrabajablesPorMes(personas, personasDepartamentos, horasTrabajables, filters.filtroEgs, filters.filtroDeptos, mesesPrev)
    return calcularKpis(filasPrev, htPrev)
  }, [asignaciones, maps, filters.filtroEgs, mesesPrev, filters.filtroTipos, filters.filtroEstadosOT, filters.filtroDeptos, filters.filtroServicios, personas, personasDepartamentos, horasTrabajables])

  // Donut
  const datosConcentracion = useMemo(
    () => calcularConcentracionClientes(filasCrudasRango),
    [filasCrudasRango],
  )

  // Ranking €/h por cliente
  const { top5, bottom5 } = useMemo(() => {
    const filasCliente = vistaCliente(filasCrudasRango, horasTrabRango, horasTrabDeptoRango)
    const conHoras = filasCliente.filter((f) => f.horasAsignadas > 0 && f.key !== '__interno__')
    const sorted = [...conHoras].sort((a, b) => b.euroHoraEfectivo - a.euroHoraEfectivo)
    const top: ClienteEuroHora[] = sorted.slice(0, 5).map((f) => ({
      nombre: f.label, euroHora: f.euroHoraEfectivo, horas: f.horasAsignadas, ingresos: f.ingresosReal || f.ingresosPrev,
    }))
    const bottom: ClienteEuroHora[] = sorted.slice(-5).reverse().map((f) => ({
      nombre: f.label, euroHora: f.euroHoraEfectivo, horas: f.horasAsignadas, ingresos: f.ingresosReal || f.ingresosPrev,
    }))
    return { top5: top, bottom5: sorted.length > 5 ? bottom : [] }
  }, [filasCrudasRango, horasTrabRango, horasTrabDeptoRango])

  // Barras carga por depto
  const datosCargaDepto: DeptoCarga[] = useMemo(() => {
    const porDepto = new Map<string, { horas: number; nombre: string }>()
    for (const f of filasCrudasRango) {
      const existing = porDepto.get(f.departamentoId)
      if (existing) {
        existing.horas += f.horasAsignadas
      } else {
        porDepto.set(f.departamentoId, { horas: f.horasAsignadas, nombre: f.departamentoNombre })
      }
    }

    return [...porDepto.entries()].map(([deptoId, data]) => ({
      nombre: data.nombre,
      pctCarga: (horasTrabDeptoRango.get(deptoId) ?? 0) > 0
        ? (data.horas / (horasTrabDeptoRango.get(deptoId) ?? 1)) * 100
        : 0,
      horasAsignadas: data.horas,
      horasTrabajables: horasTrabDeptoRango.get(deptoId) ?? 0,
    })).filter((d) => d.horasTrabajables > 0)
  }, [filasCrudasRango, horasTrabDeptoRango])

  // Tabla
  const filasTabla = useMemo(() => {
    if (vistaTab === 'cliente') {
      return vistaCliente(filasCrudasRango, horasTrabRango, horasTrabDeptoRango)
    }
    // vista depto: agrupar por depto → cliente (sin nivel mes intermedio)
    const porDepto = new Map<string, typeof filasCrudasRango>()
    for (const f of filasCrudasRango) {
      if (!porDepto.has(f.departamentoId)) porDepto.set(f.departamentoId, [])
      porDepto.get(f.departamentoId)!.push(f)
    }

    const resultado: FilaInforme[] = []
    for (const [deptoId, filasDepto] of porDepto) {
      // Hijos: clientes
      const porCliente = new Map<string, typeof filasCrudasRango>()
      for (const f of filasDepto) {
        const key = f.empresaId ?? '__interno__'
        if (!porCliente.has(key)) porCliente.set(key, [])
        porCliente.get(key)!.push(f)
      }

      const childrenCliente: FilaInforme[] = [...porCliente.entries()].map(([clienteKey, filasCliente]) => {
        const real = filasCliente.reduce((s, f) => s + f.ingresosReal, 0)
        const prev = filasCliente.reduce((s, f) => s + f.ingresosPrev, 0)
        const horas = filasCliente.reduce((s, f) => s + f.horasAsignadas, 0)
        const mejor = filasCliente.reduce((s, f) => s + f.ingresosMejor, 0)
        return {
          key: `${deptoId}-${clienteKey}`,
          label: filasCliente[0].empresaNombre,
          ingresosReal: real, ingresosPrev: prev,
          pctRealizacion: prev > 0 ? (real / prev) * 100 : 0,
          horasAsignadas: horas, horasTrabajables: 0,
          pctCarga: 0, euroHoraEfectivo: horas > 0 ? mejor / horas : 0,
          horasNoAsignadas: 0,
        }
      })
      childrenCliente.sort((a, b) => b.ingresosReal - a.ingresosReal)

      const totalReal = filasDepto.reduce((s, f) => s + f.ingresosReal, 0)
      const totalPrev = filasDepto.reduce((s, f) => s + f.ingresosPrev, 0)
      const totalHoras = filasDepto.reduce((s, f) => s + f.horasAsignadas, 0)
      const totalMejor = filasDepto.reduce((s, f) => s + f.ingresosMejor, 0)
      const ht = horasTrabDeptoRango.get(deptoId) ?? 0

      resultado.push({
        key: deptoId,
        label: filasDepto[0].departamentoNombre,
        ingresosReal: totalReal, ingresosPrev: totalPrev,
        pctRealizacion: totalPrev > 0 ? (totalReal / totalPrev) * 100 : 0,
        horasAsignadas: totalHoras, horasTrabajables: ht,
        pctCarga: ht > 0 ? (totalHoras / ht) * 100 : 0,
        euroHoraEfectivo: totalHoras > 0 ? totalMejor / totalHoras : 0,
        horasNoAsignadas: Math.max(0, ht - totalHoras),
        children: childrenCliente,
      })
    }

    resultado.sort((a, b) => b.ingresosReal - a.ingresosReal)
    return resultado
  }, [filasCrudasRango, horasTrabRango, horasTrabDeptoRango, vistaTab])

  const totales: FilaInforme = {
    key: '__totales__', label: 'Total',
    ingresosPrev: kpis.ingresosPrev, ingresosReal: kpis.ingresosReal,
    pctRealizacion: kpis.pctRealizacion, horasAsignadas: kpis.horasAsignadas,
    horasTrabajables: kpis.horasTrabajables, pctCarga: kpis.pctCarga,
    euroHoraEfectivo: kpis.euroHoraEfectivo, horasNoAsignadas: kpis.horasNoAsignadas,
  }

  const hhiStyle = hhiColor(kpis.hhiNivel)
  const cargaStyle = cargaColor(kpis.pctCarga)

  return (
    <div>
      {/* Filtros + DateRange */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <FiltrosDatosBarra
          empresasGrupo={empresasGrupo}
          departamentos={departamentos}
          catalogoServicios={catalogoServicios}
          {...filters}
        />
        <DateRangeSelector value={{ desde, hasta }} onChange={setDateRange} />
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4 lg:grid-cols-6">
        {/* FACTURADO */}
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
            <span className="text-[11px] text-muted-foreground">Plan: {formatMoney(kpis.ingresosPrev)}</span>
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
          <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">Concentración</p>
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

      {/* Donut + Ranking €/h */}
      <div className="mt-5 grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <GraficoConcentracion
            datos={datosConcentracion}
            hhi={kpis.hhi}
            hhiNivel={kpis.hhiNivel}
          />
        </div>
        <div className="lg:col-span-3">
          <RankingEuroHora top={top5} bottom={bottom5} />
        </div>
      </div>

      {/* Barras carga por departamento */}
      <div className="mt-5">
        <BarrasCargaDepto datos={datosCargaDepto} />
      </div>

      {/* Tabla */}
      <div className="mt-6">
        <TablaInforme
          filas={filasTabla}
          totales={totales}
          firstColumnLabel={vistaTab === 'cliente' ? 'Cliente' : 'Departamento'}
          header={
            <>
              {(['cliente', 'depto'] as const).map((tab) => {
                const labels: Record<VistaTab, string> = { cliente: 'Por Cliente', depto: 'Por Departamento' }
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
                {esRangoUnico ? 'Datos del mes seleccionado' : `Datos de ${mesesRango.length} meses`}
              </span>
            </>
          }
        />
      </div>
    </div>
  )
}
