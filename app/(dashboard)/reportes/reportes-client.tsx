'use client'

import { useState, useMemo, useCallback } from 'react'
import { Download, BarChart3, Table2, Filter, ChevronDown, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DIMENSIONES,
  METRICAS,
  type Dimension,
  type Metrica,
  type FiltrosReporte,
  buildFilasCrudas,
  generarReporte,
  generarCSV,
  formatearValor,
  type ResultadoReporte,
} from '@/lib/helpers-reportes'
import { formatMoney } from '@/lib/helpers'
import type {
  OrdenTrabajo,
  Asignacion,
  Proyecto,
  Empresa,
  Persona,
  CuotaPlanificacion,
  Departamento,
  CatalogoServicio,
  EmpresaGrupo,
} from '@/lib/supabase/types'

type Props = {
  ordenes: OrdenTrabajo[]
  asignaciones: Asignacion[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  personas: Persona[]
  cuotas: CuotaPlanificacion[]
  departamentos: Departamento[]
  servicios: CatalogoServicio[]
  empresasGrupo: EmpresaGrupo[]
}

// ── Estado OT disponibles ────────────────────────────────────
const ESTADOS_OT = ['Todos', 'Propuesto', 'Planificado', 'Realizado', 'Confirmado', 'Facturado'] as const

// ── Plantillas predefinidas ──────────────────────────────────
const PLANTILLAS = [
  { label: 'Ingresos por cliente', dimension: 'cliente' as Dimension, metricas: ['ingresos_prev', 'ingresos_real', 'pct_realizacion'] as Metrica[] },
  { label: 'Ingresos por mes', dimension: 'mes' as Dimension, metricas: ['ingresos_prev', 'ingresos_real', 'pct_realizacion'] as Metrica[] },
  { label: 'Horas por persona', dimension: 'persona' as Dimension, metricas: ['horas_plan', 'horas_real', 'ingresos_prev', 'euro_hora'] as Metrica[] },
  { label: 'Horas por departamento', dimension: 'departamento' as Dimension, metricas: ['horas_plan', 'horas_real', 'ingresos_prev', 'num_ots'] as Metrica[] },
  { label: 'Rentabilidad por proyecto', dimension: 'proyecto' as Dimension, metricas: ['ingresos_prev', 'ingresos_real', 'horas_plan', 'euro_hora'] as Metrica[] },
  { label: 'Servicios facturados', dimension: 'servicio' as Dimension, metricas: ['ingresos_real', 'horas_plan', 'num_ots', 'euro_hora'] as Metrica[] },
  { label: 'Volumen por empresa grupo', dimension: 'empresa_grupo' as Dimension, metricas: ['ingresos_prev', 'ingresos_real', 'num_ots', 'num_asignaciones'] as Metrica[] },
] as const

export function ReportesClient({
  ordenes, asignaciones, proyectos, empresas,
  personas, cuotas, departamentos, servicios, empresasGrupo,
}: Props) {
  // ── Config del informe ──
  const [dimension, setDimension] = useState<Dimension>('cliente')
  const [metricasActivas, setMetricasActivas] = useState<Metrica[]>([
    'ingresos_prev', 'ingresos_real', 'pct_realizacion',
  ])

  // ── Filtros ──
  const ahora = new Date()
  const anio = ahora.getFullYear()
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    mesDesde: `${anio}-01-01`,
    mesHasta: `${anio}-12-01`,
    empresaGrupoId: null,
    tipoProyecto: 'todos',
    estadoOT: null,
    departamentoId: null,
    clienteId: null,
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)

  // ── Ordenación ──
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  // ── Datos crudos (memorizados) ──
  const filasCrudas = useMemo(() =>
    buildFilasCrudas(
      asignaciones, ordenes, proyectos, empresas,
      personas, cuotas, departamentos, servicios, empresasGrupo,
      filtros,
    ),
    [asignaciones, ordenes, proyectos, empresas, personas, cuotas, departamentos, servicios, empresasGrupo, filtros],
  )

  // ── Resultado agrupado ──
  const resultado: ResultadoReporte = useMemo(
    () => generarReporte(filasCrudas, dimension),
    [filasCrudas, dimension],
  )

  // ── Ordenar filas ──
  const filasOrdenadas = useMemo(() => {
    if (!sortCol) return resultado.filas
    const metrica = sortCol as Metrica
    const isMetrica = METRICAS.some((m) => m.value === metrica)
    return [...resultado.filas].sort((a, b) => {
      const va = isMetrica ? a.valores[metrica] : a.label
      const vb = isMetrica ? b.valores[metrica] : b.label
      if (typeof va === 'number' && typeof vb === 'number') {
        return sortDir === 'asc' ? va - vb : vb - va
      }
      return sortDir === 'asc'
        ? String(va).localeCompare(String(vb))
        : String(vb).localeCompare(String(va))
    })
  }, [resultado.filas, sortCol, sortDir])

  // ── Handlers ──
  const toggleMetrica = (m: Metrica) => {
    setMetricasActivas((prev) =>
      prev.includes(m) ? prev.filter((x) => x !== m) : [...prev, m],
    )
  }

  const toggleSort = (col: string) => {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('desc')
    }
  }

  const aplicarPlantilla = (idx: number) => {
    const p = PLANTILLAS[idx]
    setDimension(p.dimension)
    setMetricasActivas([...p.metricas])
    setSortCol(null)
  }

  const exportarCSV = useCallback(() => {
    const dimLabel = DIMENSIONES.find((d) => d.value === dimension)?.label ?? dimension
    const csv = generarCSV(resultado, dimLabel, metricasActivas)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe_${dimension}_${filtros.mesDesde.substring(0, 7)}_${filtros.mesHasta.substring(0, 7)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultado, dimension, metricasActivas, filtros])

  const metricasMeta = METRICAS.filter((m) => metricasActivas.includes(m.value))
  const dimLabel = DIMENSIONES.find((d) => d.value === dimension)?.label ?? ''

  // Clientes únicos para filtro
  const clientesUnicos = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of proyectos) {
      if (p.empresa_id) {
        const emp = empresas.find((e) => e.id === p.empresa_id)
        if (emp) map.set(emp.id, emp.nombre_interno ?? emp.nombre_legal)
      }
    }
    return [...map.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [proyectos, empresas])

  // Filtros activos count
  const filtrosActivos = [
    filtros.empresaGrupoId,
    filtros.tipoProyecto !== 'todos' ? filtros.tipoProyecto : null,
    filtros.estadoOT,
    filtros.departamentoId,
    filtros.clienteId,
  ].filter(Boolean).length

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Informes</h1>
          <p className="text-sm text-muted-foreground">
            Cruza datos por cualquier dimensión, visualiza y exporta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setMostrarFiltros(!mostrarFiltros)}
            className="gap-1.5"
          >
            <Filter className="h-3.5 w-3.5" />
            Filtros{filtrosActivos > 0 && (
              <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4">
                {filtrosActivos}
              </span>
            )}
          </Button>
          <Button
            size="sm"
            onClick={exportarCSV}
            disabled={resultado.filas.length === 0}
            className="gap-1.5"
          >
            <Download className="h-3.5 w-3.5" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Plantillas rápidas */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Plantillas:</span>
        {PLANTILLAS.map((p, i) => (
          <button
            key={i}
            type="button"
            onClick={() => aplicarPlantilla(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              dimension === p.dimension && arraysEqual(metricasActivas, p.metricas)
                ? 'bg-primary text-primary-foreground'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Panel de filtros (colapsable) */}
      {mostrarFiltros && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-border">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {/* Rango de meses */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Desde</label>
              <input
                type="month"
                value={filtros.mesDesde.substring(0, 7)}
                onChange={(e) => setFiltros((f) => ({ ...f, mesDesde: e.target.value ? `${e.target.value}-01` : f.mesDesde }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Hasta</label>
              <input
                type="month"
                value={filtros.mesHasta.substring(0, 7)}
                onChange={(e) => setFiltros((f) => ({ ...f, mesHasta: e.target.value ? `${e.target.value}-01` : f.mesHasta }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              />
            </div>
            {/* Empresa grupo */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Empresa grupo</label>
              <select
                value={filtros.empresaGrupoId ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, empresaGrupoId: e.target.value || null }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Todas</option>
                {empresasGrupo.map((eg) => (
                  <option key={eg.id} value={eg.id}>{eg.nombre}</option>
                ))}
              </select>
            </div>
            {/* Tipo proyecto */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Tipo proyecto</label>
              <select
                value={filtros.tipoProyecto}
                onChange={(e) => setFiltros((f) => ({ ...f, tipoProyecto: e.target.value as FiltrosReporte['tipoProyecto'] }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              >
                <option value="todos">Todos</option>
                <option value="facturable">Facturable</option>
                <option value="externo">Externo</option>
                <option value="interno">Interno</option>
              </select>
            </div>
            {/* Estado OT */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Estado OT</label>
              <select
                value={filtros.estadoOT ?? 'Todos'}
                onChange={(e) => setFiltros((f) => ({ ...f, estadoOT: e.target.value === 'Todos' ? null : e.target.value }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              >
                {ESTADOS_OT.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            {/* Departamento */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Departamento</label>
              <select
                value={filtros.departamentoId ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, departamentoId: e.target.value || null }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Todos</option>
                {departamentos.map((d) => (
                  <option key={d.id} value={d.id}>{d.nombre}</option>
                ))}
              </select>
            </div>
            {/* Cliente */}
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Cliente</label>
              <select
                value={filtros.clienteId ?? ''}
                onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value || null }))}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
              >
                <option value="">Todos</option>
                {clientesUnicos.map(([id, nombre]) => (
                  <option key={id} value={id}>{nombre}</option>
                ))}
              </select>
            </div>
            {/* Limpiar */}
            <div className="flex items-end">
              <button
                type="button"
                onClick={() => setFiltros({
                  mesDesde: `${anio}-01-01`,
                  mesHasta: `${anio}-12-01`,
                  empresaGrupoId: null,
                  tipoProyecto: 'todos',
                  estadoOT: null,
                  departamentoId: null,
                  clienteId: null,
                })}
                className="text-xs text-primary hover:underline"
              >
                Limpiar filtros
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Config: Dimensión + Métricas */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-start gap-6">
          {/* Agrupar por */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Agrupar por
            </label>
            <div className="flex flex-wrap gap-1.5">
              {DIMENSIONES.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => { setDimension(d.value); setSortCol(null) }}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    dimension === d.value
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
          </div>

          {/* Métricas */}
          <div className="space-y-1.5 flex-1">
            <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Métricas
            </label>
            <div className="flex flex-wrap gap-1.5">
              {METRICAS.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => toggleMetrica(m.value)}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                    metricasActivas.includes(m.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Resumen rápido */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{resultado.filas.length}</span> filas
        </span>
        <span>·</span>
        <span>
          <span className="font-semibold text-foreground">{filasCrudas.length}</span> asignaciones
        </span>
        {resultado.totales.ingresos_real > 0 && (
          <>
            <span>·</span>
            <span>
              Total real: <span className="font-semibold text-foreground">{formatMoney(resultado.totales.ingresos_real)}</span>
            </span>
          </>
        )}
        <span>·</span>
        <span>
          Total previsto: <span className="font-semibold text-foreground">{formatMoney(resultado.totales.ingresos_prev)}</span>
        </span>
      </div>

      {/* Tabla de resultados */}
      <div className="mt-4 rounded-xl bg-white shadow-sm overflow-hidden">
        {resultado.filas.length === 0 ? (
          <div className="py-16 text-center">
            <Table2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
            <p className="mt-3 text-sm text-muted-foreground">
              No hay datos para esta combinación de filtros y dimensión.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Prueba a ampliar el rango de fechas o cambiar los filtros.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-gray-50/50">
                  <th className="px-4 py-3 text-left">
                    <SortButton
                      label={dimLabel}
                      col="_label"
                      sortCol={sortCol}
                      sortDir={sortDir}
                      onToggle={toggleSort}
                    />
                  </th>
                  {metricasMeta.map((m) => (
                    <th key={m.value} className="px-4 py-3 text-right">
                      <SortButton
                        label={m.label.replace(/ \(€\)/, '').replace(/ efectivo/, '')}
                        col={m.value}
                        sortCol={sortCol}
                        sortDir={sortDir}
                        onToggle={toggleSort}
                        align="right"
                      />
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filasOrdenadas.map((fila) => (
                  <tr key={fila.key} className="border-b border-border/50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-2.5 font-medium text-foreground">
                      {fila.label}
                    </td>
                    {metricasMeta.map((m) => (
                      <td key={m.value} className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">
                        <span className={
                          m.format === 'money' && fila.valores[m.value] > 0
                            ? 'font-medium text-foreground'
                            : m.format === 'pct' && fila.valores[m.value] >= 100
                              ? 'font-medium text-emerald-600'
                              : m.format === 'pct' && fila.valores[m.value] > 0
                                ? 'font-medium text-amber-600'
                                : ''
                        }>
                          {formatearValor(fila.valores[m.value], m.format)}
                        </span>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border bg-gray-50/80">
                  <td className="px-4 py-2.5 font-bold text-foreground uppercase text-xs tracking-wider">
                    Total
                  </td>
                  {metricasMeta.map((m) => (
                    <td key={m.value} className="px-4 py-2.5 text-right font-bold tabular-nums text-foreground">
                      {formatearValor(resultado.totales[m.value], m.format)}
                    </td>
                  ))}
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Botón de ordenación para cabeceras ───────────────────────

function SortButton({
  label, col, sortCol, sortDir, onToggle, align = 'left',
}: {
  label: string
  col: string
  sortCol: string | null
  sortDir: 'asc' | 'desc'
  onToggle: (col: string) => void
  align?: 'left' | 'right'
}) {
  const isActive = sortCol === col
  const Icon = isActive
    ? sortDir === 'asc' ? ArrowUp : ArrowDown
    : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={() => onToggle(col)}
      className={`inline-flex items-center gap-1 text-xs uppercase tracking-wider transition-colors cursor-pointer select-none ${
        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
      } ${align === 'right' ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {label}
      <Icon className={`shrink-0 ${isActive ? 'h-3.5 w-3.5' : 'h-3 w-3 opacity-50'}`} />
    </button>
  )
}

// ── Utilidad ────────────────────────────────────────────────

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false
  return a.every((v, i) => v === b[i])
}
