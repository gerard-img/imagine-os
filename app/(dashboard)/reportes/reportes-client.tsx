'use client'

import { useState, useMemo, useCallback } from 'react'
import {
  Download, Table2, Filter, Users, TrendingUp,
  ChevronsUpDown, ChevronsDownUp, Plus,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  TODAS_DIMENSIONES,
  METRICAS,
  type DimensionEje,
  type Metrica,
  type ConfigInforme,
  type FiltrosReporte,
  type NodoFila,
  esDimensionTiempo,
  labelDimension,
  buildFilasCrudas,
  generarReporteJerarquico,
  generarCSVJerarquico,
  formatearValor,
} from '@/lib/helpers-reportes'
import { formatMoney, safeDivide } from '@/lib/helpers'
import { DimChip, SortBtn, DeltaBadge, TablaHead, FilaJerarquica, sortTree } from './reportes-componentes'
import type {
  OrdenTrabajo, Asignacion, Proyecto, Empresa, Persona,
  CuotaPlanificacion, Departamento, CatalogoServicio, EmpresaGrupo,
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

const ESTADOS_OT = ['Todos', 'Propuesto', 'Planificado', 'Realizado', 'Confirmado', 'Facturado'] as const

// ── Plantillas ──────────────────────────────────────────────

type Plantilla = {
  label: string
  filas: DimensionEje[]
  columnas: DimensionEje[]
  metricas: Metrica[]
}

const PLANTILLAS: Plantilla[] = [
  { label: 'Ingresos por cliente × mes', filas: ['cliente'], columnas: ['mes'], metricas: ['ingresos_real', 'ingresos_prev'] },
  { label: 'Cliente > proyecto × trimestre', filas: ['cliente', 'proyecto'], columnas: ['anio', 'trimestre'], metricas: ['ingresos_real'] },
  { label: 'Horas por persona × mes', filas: ['persona'], columnas: ['mes'], metricas: ['horas_plan', 'horas_real'] },
  { label: 'Depto > persona', filas: ['departamento', 'persona'], columnas: [], metricas: ['horas_plan', 'ingresos_prev', 'euro_hora'] },
  { label: 'Ingresos por proyecto', filas: ['proyecto'], columnas: [], metricas: ['ingresos_prev', 'ingresos_real', 'pct_realizacion', 'euro_hora'] },
  { label: 'Empresa grupo × año', filas: ['empresa_grupo'], columnas: ['anio', 'trimestre'], metricas: ['ingresos_real', 'num_ots'] },
]

function plantillaActiva(config: ConfigInforme): number {
  return PLANTILLAS.findIndex((p) =>
    arrEq(p.filas, config.filas) && arrEq(p.columnas, config.columnas) && arrEq(p.metricas, config.metricas),
  )
}

function arrEq(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((v, i) => v === b[i])
}

// ── Componente principal ────────────────────────────────────

export function ReportesClient({
  ordenes, asignaciones, proyectos, empresas,
  personas, cuotas, departamentos, servicios, empresasGrupo,
}: Props) {
  const [config, setConfig] = useState<ConfigInforme>({
    filas: ['cliente'],
    columnas: ['mes'],
    metricas: ['ingresos_real', 'ingresos_prev'],
  })

  const anio = new Date().getFullYear()
  const [filtros, setFiltros] = useState<FiltrosReporte>({
    mesDesde: `${anio}-01-01`, mesHasta: `${anio}-12-01`,
    empresaGrupoId: null, tipoProyecto: 'todos', estadoOT: null, departamentoId: null, clienteId: null,
  })
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [sortCol, setSortCol] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())
  const [mostrarVariacion, setMostrarVariacion] = useState(false)

  // ── Datos ──
  const filasCrudas = useMemo(() =>
    buildFilasCrudas(asignaciones, ordenes, proyectos, empresas, personas, cuotas, departamentos, servicios, empresasGrupo, filtros),
    [asignaciones, ordenes, proyectos, empresas, personas, cuotas, departamentos, servicios, empresasGrupo, filtros],
  )

  const resultado = useMemo(
    () => generarReporteJerarquico(filasCrudas, config),
    [filasCrudas, config],
  )

  const tieneColumnas = config.columnas.length > 0
  const tieneJerarquiaFilas = config.filas.length > 1

  // ── Comparación mes a mes ──
  const columnasTemporales = config.columnas.some((d) => esDimensionTiempo(d))
  const puedeComparar = tieneColumnas && columnasTemporales && resultado.columnasHoja.length >= 2

  // Mapa: colKey → colKey anterior (para calcular deltas)
  const prevColMap = useMemo(() => {
    const map = new Map<string, string>()
    const hojas = resultado.columnasHoja
    for (let i = 1; i < hojas.length; i++) {
      map.set(hojas[i].key, hojas[i - 1].key)
    }
    return map
  }, [resultado.columnasHoja])

  // ── Ordenación recursiva ──
  const filasOrdenadas = useMemo(() => {
    if (!sortCol) return resultado.filas
    return sortTree(resultado.filas, sortCol, sortDir)
  }, [resultado.filas, sortCol, sortDir])

  // ── Dimensiones usadas (para impedir duplicados entre filas y columnas) ──
  const dimsUsadas = useMemo(() => new Set([...config.filas, ...config.columnas]), [config.filas, config.columnas])

  // ── Handlers de jerarquía ──
  const addDimFilas = (d: DimensionEje) => {
    setConfig((c) => ({ ...c, filas: [...c.filas, d] }))
    setSortCol(null)
    setExpandedKeys(new Set())
  }
  const removeDimFilas = (idx: number) => {
    if (config.filas.length <= 1) return
    setConfig((c) => ({ ...c, filas: c.filas.filter((_, i) => i !== idx) }))
    setSortCol(null)
    setExpandedKeys(new Set())
  }
  const moveDimFilas = (idx: number, dir: -1 | 1) => {
    setConfig((c) => {
      const arr = [...c.filas]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return c
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...c, filas: arr }
    })
    setSortCol(null)
    setExpandedKeys(new Set())
  }

  const addDimColumnas = (d: DimensionEje) => {
    setConfig((c) => ({ ...c, columnas: [...c.columnas, d] }))
    setSortCol(null)
  }
  const removeDimColumnas = (idx: number) => {
    setConfig((c) => ({ ...c, columnas: c.columnas.filter((_, i) => i !== idx) }))
    setSortCol(null)
  }
  const moveDimColumnas = (idx: number, dir: -1 | 1) => {
    setConfig((c) => {
      const arr = [...c.columnas]
      const target = idx + dir
      if (target < 0 || target >= arr.length) return c
      ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
      return { ...c, columnas: arr }
    })
    setSortCol(null)
  }
  const clearColumnas = () => {
    setConfig((c) => ({ ...c, columnas: [] }))
    setSortCol(null)
  }

  const toggleMetrica = (m: Metrica) => {
    setConfig((c) => {
      if (c.metricas.includes(m)) {
        if (c.metricas.length <= 1) return c
        return { ...c, metricas: c.metricas.filter((x) => x !== m) }
      }
      return { ...c, metricas: [...c.metricas, m] }
    })
  }

  const toggleSort = (col: string) => {
    if (sortCol === col) setSortDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

  const expandAll = () => {
    const keys = new Set<string>()
    const walk = (nodes: NodoFila[]) => { for (const n of nodes) { if (n.children.length > 0) { keys.add(n.key); walk(n.children) } } }
    walk(resultado.filas)
    setExpandedKeys(keys)
  }

  const aplicarPlantilla = (idx: number) => {
    const p = PLANTILLAS[idx]
    setConfig({ filas: [...p.filas], columnas: [...p.columnas], metricas: [...p.metricas] })
    setSortCol(null)
    setExpandedKeys(new Set())
  }

  const exportarCSV = useCallback(() => {
    const csv = generarCSVJerarquico(resultado, config)
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `informe_${config.filas.join('-')}${config.columnas.length ? '_x_' + config.columnas.join('-') : ''}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }, [resultado, config])

  const metricasMeta = METRICAS.filter((m) => config.metricas.includes(m.value))
  const plantillaIdx = plantillaActiva(config)
  const totalFilas = resultado.filas.length

  // Clientes para filtro
  const clientesUnicos = useMemo(() => {
    const empresaMap = new Map(empresas.map((e) => [e.id, e]))
    const res = new Map<string, string>()
    for (const p of proyectos) {
      if (p.empresa_id && !res.has(p.empresa_id)) {
        const emp = empresaMap.get(p.empresa_id)
        if (emp) res.set(emp.id, emp.nombre_interno ?? emp.nombre_legal)
      }
    }
    return [...res.entries()].sort((a, b) => a[1].localeCompare(b[1]))
  }, [proyectos, empresas])

  const filtrosActivos = [filtros.empresaGrupoId, filtros.tipoProyecto !== 'todos' ? filtros.tipoProyecto : null, filtros.estadoOT, filtros.departamentoId, filtros.clienteId].filter(Boolean).length

  // ── Resumen por persona (tabla fija al final) ──
  const resumenPersonas = useMemo(() => {
    const grupos = new Map<string, { nombre: string; ingresosPrev: number; ingresosReal: number; horasPlan: number; horasReal: number; ots: Set<string> }>()
    for (const f of filasCrudas) {
      let g = grupos.get(f.personaId)
      if (!g) {
        g = { nombre: f.personaNombre, ingresosPrev: 0, ingresosReal: 0, horasPlan: 0, horasReal: 0, ots: new Set() }
        grupos.set(f.personaId, g)
      }
      g.ingresosPrev += f.ingresosPrev
      g.ingresosReal += f.ingresosReal
      g.horasPlan += f.horasPlan
      g.horasReal += f.horasReal
      g.ots.add(f.otId)
    }
    return [...grupos.values()]
      .map((g) => ({
        nombre: g.nombre,
        ingresosPrev: g.ingresosPrev,
        ingresosReal: g.ingresosReal,
        horasPlan: g.horasPlan,
        horasReal: g.horasReal,
        euroHora: safeDivide(g.ingresosReal > 0 ? g.ingresosReal : g.ingresosPrev, g.horasPlan),
        numOTs: g.ots.size,
      }))
      .sort((a, b) => b.ingresosPrev - a.ingresosPrev)
  }, [filasCrudas])

  const [sortPersonaCol, setSortPersonaCol] = useState<string | null>(null)
  const [sortPersonaDir, setSortPersonaDir] = useState<'asc' | 'desc'>('desc')

  const personasOrdenadas = useMemo(() => {
    if (!sortPersonaCol) return resumenPersonas
    return [...resumenPersonas].sort((a, b) => {
      if (sortPersonaCol === 'nombre') {
        return sortPersonaDir === 'asc' ? a.nombre.localeCompare(b.nombre) : b.nombre.localeCompare(a.nombre)
      }
      const va = a[sortPersonaCol as keyof typeof a] as number
      const vb = b[sortPersonaCol as keyof typeof b] as number
      return sortPersonaDir === 'asc' ? va - vb : vb - va
    })
  }, [resumenPersonas, sortPersonaCol, sortPersonaDir])

  const toggleSortPersona = (col: string) => {
    if (sortPersonaCol === col) setSortPersonaDir((d) => d === 'asc' ? 'desc' : 'asc')
    else { setSortPersonaCol(col); setSortPersonaDir('desc') }
  }

  // Dims disponibles para añadir (no usadas todavía)
  const dimDisponiblesFilas = TODAS_DIMENSIONES.filter((d) => !dimsUsadas.has(d.value))
  const dimDisponiblesColumnas = TODAS_DIMENSIONES.filter((d) => !dimsUsadas.has(d.value))

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Informes</h1>
          <p className="text-sm text-muted-foreground">Construye cruces de datos por cualquier dimensión y exporta.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setMostrarFiltros(!mostrarFiltros)} className="gap-1.5">
            <Filter className="h-3.5 w-3.5" />
            Filtros{filtrosActivos > 0 && <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground text-[10px] font-bold h-4 w-4">{filtrosActivos}</span>}
          </Button>
          <Button size="sm" onClick={exportarCSV} disabled={totalFilas === 0} className="gap-1.5">
            <Download className="h-3.5 w-3.5" /> Exportar CSV
          </Button>
        </div>
      </div>

      {/* Plantillas */}
      <div className="mt-4 flex items-center gap-2 flex-wrap">
        <span className="text-xs text-muted-foreground font-medium">Plantillas:</span>
        {PLANTILLAS.map((p, i) => (
          <button key={i} type="button" onClick={() => aplicarPlantilla(i)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${plantillaIdx === i ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
          >{p.label}</button>
        ))}
      </div>

      {/* Filtros */}
      {mostrarFiltros && (
        <div className="mt-4 rounded-xl bg-white p-4 shadow-sm border border-border">
          <div className="mb-2"><span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Filtros — limitan los datos del informe</span></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Desde</label>
              <input type="month" value={filtros.mesDesde.substring(0, 7)} onChange={(e) => setFiltros((f) => ({ ...f, mesDesde: e.target.value ? `${e.target.value}-01` : f.mesDesde }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Hasta</label>
              <input type="month" value={filtros.mesHasta.substring(0, 7)} onChange={(e) => setFiltros((f) => ({ ...f, mesHasta: e.target.value ? `${e.target.value}-01` : f.mesHasta }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Empresa grupo</label>
              <select value={filtros.empresaGrupoId ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, empresaGrupoId: e.target.value || null }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring">
                <option value="">Todas</option>
                {empresasGrupo.map((eg) => <option key={eg.id} value={eg.id}>{eg.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Tipo proyecto</label>
              <select value={filtros.tipoProyecto} onChange={(e) => setFiltros((f) => ({ ...f, tipoProyecto: e.target.value as FiltrosReporte['tipoProyecto'] }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring">
                <option value="todos">Todos</option><option value="facturable">Facturable</option><option value="externo">Externo</option><option value="interno">Interno</option>
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Estado OT</label>
              <select value={filtros.estadoOT ?? 'Todos'} onChange={(e) => setFiltros((f) => ({ ...f, estadoOT: e.target.value === 'Todos' ? null : e.target.value }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring">
                {ESTADOS_OT.map((e) => <option key={e} value={e}>{e}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Departamento</label>
              <select value={filtros.departamentoId ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, departamentoId: e.target.value || null }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring">
                <option value="">Todos</option>
                {departamentos.map((d) => <option key={d.id} value={d.id}>{d.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-semibold uppercase text-muted-foreground">Cliente</label>
              <select value={filtros.clienteId ?? ''} onChange={(e) => setFiltros((f) => ({ ...f, clienteId: e.target.value || null }))} className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring">
                <option value="">Todos</option>
                {clientesUnicos.map(([id, nombre]) => <option key={id} value={id}>{nombre}</option>)}
              </select>
            </div>
            <div className="flex items-end">
              <button type="button" onClick={() => setFiltros({ mesDesde: `${anio}-01-01`, mesHasta: `${anio}-12-01`, empresaGrupoId: null, tipoProyecto: 'todos', estadoOT: null, departamentoId: null, clienteId: null })} className="text-xs text-primary hover:underline">Limpiar filtros</button>
            </div>
          </div>
        </div>
      )}

      {/* Estructura del informe */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-4">Estructura del informe</p>
        <div className="space-y-4">
          {/* 1. Filas */}
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-[10px] font-bold mt-0.5">1</span>
            <div className="space-y-2 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground">Filas <span className="font-normal text-muted-foreground/70">— define la jerarquía de filas</span></label>
              {/* Seleccionadas */}
              <div className="flex flex-wrap items-center gap-1.5">
                {config.filas.map((d, i) => (
                  <DimChip key={d} label={`${i + 1}. ${labelDimension(d)}`} color="primary"
                    onMoveUp={i > 0 ? () => moveDimFilas(i, -1) : undefined}
                    onRemove={config.filas.length > 1 ? () => removeDimFilas(i) : undefined}
                  />
                ))}
              </div>
              {/* Disponibles */}
              {dimDisponiblesFilas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dimDisponiblesFilas.map((d) => (
                    <button key={d.value} type="button" onClick={() => addDimFilas(d.value)}
                      className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 transition-colors"
                    ><Plus className="h-2.5 w-2.5" />{d.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* 2. Columnas */}
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-blue-600/10 text-blue-600 text-[10px] font-bold mt-0.5">2</span>
            <div className="space-y-2 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground">Columnas <span className="font-normal text-muted-foreground/70">— opcional, cruza los datos</span></label>
              <div className="flex flex-wrap items-center gap-1.5">
                {config.columnas.length === 0 ? (
                  <span className="rounded-full px-3 py-1 text-xs font-medium bg-blue-600 text-white">Sin columnas</span>
                ) : (
                  <>
                    {config.columnas.map((d, i) => (
                      <DimChip key={d} label={`${i + 1}. ${labelDimension(d)}`} color="blue"
                        onMoveUp={i > 0 ? () => moveDimColumnas(i, -1) : undefined}
                        onRemove={() => removeDimColumnas(i)}
                      />
                    ))}
                    <button type="button" onClick={clearColumnas}
                      className="rounded-full px-2 py-0.5 text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                    >Limpiar</button>
                  </>
                )}
              </div>
              {dimDisponiblesColumnas.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {dimDisponiblesColumnas.map((d) => (
                    <button key={d.value} type="button" onClick={() => addDimColumnas(d.value)}
                      className="inline-flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium text-gray-500 bg-gray-50 hover:bg-gray-100 border border-dashed border-gray-300 transition-colors"
                    ><Plus className="h-2.5 w-2.5" />{d.label}</button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border/50" />

          {/* 3. Métricas */}
          <div className="flex items-start gap-3">
            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-600 text-[10px] font-bold mt-0.5">3</span>
            <div className="space-y-1.5 flex-1">
              <label className="text-[11px] font-medium text-muted-foreground">Métricas <span className="font-normal text-muted-foreground/70">— valores en cada celda</span></label>
              <div className="flex flex-wrap gap-1.5">
                {METRICAS.map((m) => (
                  <button key={m.value} type="button" onClick={() => toggleMetrica(m.value)}
                    className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${config.metricas.includes(m.value) ? 'bg-emerald-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                  >{m.label}</button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Resumen */}
      <div className="mt-4 flex items-center gap-4 text-sm text-muted-foreground">
        <span><span className="font-semibold text-foreground">{totalFilas}</span> filas</span>
        <span>·</span>
        <span><span className="font-semibold text-foreground">{filasCrudas.length}</span> asignaciones</span>
        {resultado.totalGeneral.ingresos_real > 0 && <><span>·</span><span>Total real: <span className="font-semibold text-foreground">{formatMoney(resultado.totalGeneral.ingresos_real)}</span></span></>}
        <span>·</span>
        <span>Total previsto: <span className="font-semibold text-foreground">{formatMoney(resultado.totalGeneral.ingresos_prev)}</span></span>
        {puedeComparar && (
          <>
            <span>·</span>
            <button type="button" onClick={() => setMostrarVariacion((v) => !v)}
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors ${mostrarVariacion ? 'bg-primary text-primary-foreground' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            >
              <TrendingUp className="h-3 w-3" /> Variación %
            </button>
          </>
        )}
      </div>

      {/* Tabla */}
      <div className="mt-4">
        {/* Expand/Collapse global */}
        {tieneJerarquiaFilas && totalFilas > 0 && (
          <div className="flex justify-end mb-1">
            <button onClick={() => expandedKeys.size > 0 ? setExpandedKeys(new Set()) : expandAll()}
              className="flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            >
              {expandedKeys.size > 0 ? <><ChevronsDownUp className="h-3.5 w-3.5" /> Colapsar</> : <><ChevronsUpDown className="h-3.5 w-3.5" /> Expandir</>}
            </button>
          </div>
        )}

        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          {totalFilas === 0 ? (
            <div className="py-16 text-center">
              <Table2 className="mx-auto h-10 w-10 text-muted-foreground/30" />
              <p className="mt-3 text-sm text-muted-foreground">No hay datos para esta combinación.</p>
              <p className="mt-1 text-xs text-muted-foreground">Prueba a ampliar el rango de fechas o cambiar los filtros.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <TablaHead
                  columnasArbol={resultado.columnasArbol}
                  columnasHoja={resultado.columnasHoja}
                  nivelesColumna={resultado.nivelesColumna}
                  tieneColumnas={tieneColumnas}
                  metricasMeta={metricasMeta}
                  filaLabel={config.filas.map(labelDimension).join(' > ')}
                  sortCol={sortCol} sortDir={sortDir} onToggleSort={toggleSort}
                />
                <tbody>
                  {filasOrdenadas.map((fila) => (
                    <FilaJerarquica key={fila.key} fila={fila}
                      expandedKeys={expandedKeys} onToggle={toggleExpand}
                      tieneColumnas={tieneColumnas}
                      colHojaKeys={resultado.columnasHoja.map((c) => c.key)}
                      metricasMeta={metricasMeta}
                      tieneHijos={tieneJerarquiaFilas}
                      mostrarVariacion={mostrarVariacion}
                      prevColMap={prevColMap}
                    />
                  ))}
                </tbody>
                <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-border">
                  <tr>
                    <td className="px-4 py-2.5 font-bold text-foreground uppercase text-xs tracking-wider">Total</td>
                    {tieneColumnas && resultado.columnasHoja.map((col) => {
                      const c = resultado.totalesPorColumna.get(col.key)
                      const prevKey = prevColMap.get(col.key)
                      const prevC = prevKey ? resultado.totalesPorColumna.get(prevKey) : undefined
                      return metricasMeta.map((m) => (
                        <td key={`${col.key}-${m.value}`} className="px-2 py-2.5 text-right font-bold tabular-nums text-foreground border-l border-border/10">
                          {formatearValor(c?.[m.value] ?? 0, m.format)}
                          {mostrarVariacion && prevC && <DeltaBadge actual={c?.[m.value] ?? 0} anterior={prevC[m.value]} />}
                        </td>
                      ))
                    })}
                    {metricasMeta.map((m) => (
                      <td key={`gt-${m.value}`} className={`px-2 py-2.5 text-right font-bold tabular-nums text-foreground ${tieneColumnas ? 'border-l-2 border-border' : ''}`}>
                        {formatearValor(resultado.totalGeneral[m.value], m.format)}
                      </td>
                    ))}
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Tabla de Personas */}
      <div className="mt-6">
        <div className="flex items-center gap-2 mb-2">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold text-foreground">Personas</h2>
          <span className="text-xs text-muted-foreground">({resumenPersonas.length})</span>
        </div>
        <div className="rounded-xl bg-white shadow-sm overflow-hidden">
          {resumenPersonas.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="mx-auto h-8 w-8 text-muted-foreground/30" />
              <p className="mt-2 text-sm text-muted-foreground">No hay datos de personas para los filtros seleccionados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3 text-left">
                      <SortBtn label="Persona" col="nombre" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="Ingresos prev." col="ingresosPrev" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="Ingresos real" col="ingresosReal" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="Horas plan" col="horasPlan" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="Horas real" col="horasReal" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="€/hora" col="euroHora" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortBtn label="Nº OTs" col="numOTs" sortCol={sortPersonaCol} sortDir={sortPersonaDir} onToggle={toggleSortPersona} align="right" />
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {personasOrdenadas.map((p) => (
                    <tr key={p.nombre} className="border-b border-border/50 bg-white hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2 font-medium text-foreground">{p.nombre}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className={p.ingresosPrev > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{formatearValor(p.ingresosPrev, 'money')}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className={p.ingresosReal > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{formatearValor(p.ingresosReal, 'money')}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{formatearValor(p.horasPlan, 'hours')}</td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{formatearValor(p.horasReal, 'hours')}</td>
                      <td className="px-4 py-2 text-right tabular-nums">
                        <span className={p.euroHora > 0 ? 'font-medium text-foreground' : 'text-muted-foreground'}>{formatearValor(p.euroHora, 'money')}</span>
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums text-muted-foreground">{p.numOTs}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
