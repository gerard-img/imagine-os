'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Proyecto, Empresa, EmpresaGrupo, Departamento, ProyectoDepartamento, Persona, ServicioYDept } from '@/lib/supabase/types'
import { formatMoney, formatDate } from '@/lib/helpers'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { StatusBadge } from '@/components/status-badge'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import type { FilterOption } from '@/components/multi-select-filter'
import { ProyectoFormSheet } from './proyecto-form-sheet'
import { ProyectoOtAction } from './proyecto-ot-action'
import type { CatalogoServicio } from '@/lib/supabase/types'
import { ClientePill } from '@/components/cliente-pill'
import { DeptPill } from '@/components/dept-pill'
import { LayoutList, LayoutGrid, X } from 'lucide-react'

const ESTADO_OPTIONS: FilterOption[] = [
  { value: 'Activo', label: 'Activo' },
  { value: 'Propuesta', label: 'Propuesta' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Pausado', label: 'Pausado' },
  { value: 'Finalizado', label: 'Finalizado' },
  { value: 'Cancelado', label: 'Cancelado' },
]

const KANBAN_COLUMNS = ['Propuesta', 'Confirmado', 'Activo', 'Pausado', 'Finalizado', 'Cancelado']

type Props = {
  proyectos: Proyecto[]
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
  departamentos: Departamento[]
  proyectosDepartamentos: ProyectoDepartamento[]
  personas: Persona[]
  servicios: CatalogoServicio[]
  serviciosYDepts: ServicioYDept[]
}

// Calcula el % de tiempo transcurrido entre activación y cierre
function calcularProgresoTiempo(proyecto: Proyecto): number | null {
  if (!proyecto.fecha_activacion || !proyecto.fecha_cierre) return null
  const inicio = new Date(proyecto.fecha_activacion).getTime()
  const fin = new Date(proyecto.fecha_cierre).getTime()
  const hoy = Date.now()
  if (fin <= inicio) return null
  return Math.min(Math.max(((hoy - inicio) / (fin - inicio)) * 100, 0), 110)
}

function BarraTiempo({ proyecto }: { proyecto: Proyecto }) {
  if (proyecto.tipo_partida !== 'Puntual') return null
  const pct = calcularProgresoTiempo(proyecto)
  if (pct === null) return null

  const color = pct > 100 ? 'bg-red-500' : pct > 85 ? 'bg-amber-400' : 'bg-emerald-500'
  const vencido = pct > 100

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold shrink-0 tabular-nums ${vencido ? 'text-red-600' : 'text-muted-foreground'}`}>
        {Math.round(pct)}%{vencido ? ' ⚠' : ''}
      </span>
    </div>
  )
}

export default function ProyectosClient({
  proyectos,
  empresas,
  empresasGrupo,
  departamentos,
  proyectosDepartamentos,
  personas,
  servicios,
  serviciosYDepts,
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [view, setView] = useState<'list' | 'kanban'>('list')

  // ── Estado de filtros ──
  const [filterEstado, setFilterEstado] = useState<string[]>([])
  const [filterEmpresaGrupo, setFilterEmpresaGrupo] = useState<string[]>([])
  const [filterEmpresa, setFilterEmpresa] = useState<string[]>([])
  const [filterDepartamento, setFilterDepartamento] = useState<string[]>([])
  const [filterServicio, setFilterServicio] = useState<string[]>([])
  const [pptoMin, setPptoMin] = useState('')
  const [pptoMax, setPptoMax] = useState('')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')
  const [sinFecha, setSinFecha] = useState(false)

  // ── Mapas de lookup ──
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const empresaGrupoMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])
  const departamentoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])

  // ── Mapa: departamento_id → servicio_ids ──
  const deptServiciosMap = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const sd of serviciosYDepts) {
      if (!map.has(sd.departamento_id)) map.set(sd.departamento_id, new Set())
      map.get(sd.departamento_id)!.add(sd.servicio_id)
    }
    return map
  }, [serviciosYDepts])

  // ── Mapa: proyecto_id → departamento_ids ──
  const proyectoDeptIds = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const pd of proyectosDepartamentos) {
      if (!map.has(pd.proyecto_id)) map.set(pd.proyecto_id, [])
      map.get(pd.proyecto_id)!.push(pd.departamento_id)
    }
    return map
  }, [proyectosDepartamentos])

  function getDepartamentosProyecto(proyectoId: string) {
    return (proyectoDeptIds.get(proyectoId) ?? [])
      .map((id) => departamentoMap.get(id))
      .filter(Boolean)
  }

  function getDepartamentoIdsProyecto(proyectoId: string) {
    return proyectoDeptIds.get(proyectoId) ?? []
  }

  const getClienteNombre = (p: Proyecto) => {
    const empresa = p.empresa_id ? empresaMap.get(p.empresa_id) : null
    return empresa ? (empresa.nombre_interno ?? empresa.nombre_legal ?? '—') : 'Interno'
  }

  // ── Opciones dinámicas de filtros ──

  const empresaGrupoOptions: FilterOption[] = useMemo(
    () => empresasGrupo.map((eg) => ({ value: eg.id, label: eg.codigo || eg.nombre })),
    [empresasGrupo]
  )

  const empresaOptions: FilterOption[] = useMemo(
    () => empresas
      .filter((e) => ['Cliente', 'Prospecto', 'Baja'].includes(e.estado))
      .map((e) => ({ value: e.id, label: e.nombre_interno ?? e.nombre_legal ?? '—' })),
    [empresas]
  )

  // Departamentos: si hay empresa_grupo seleccionada, solo los de esas empresas_grupo
  const departamentoOptions: FilterOption[] = useMemo(() => {
    const filtered = filterEmpresaGrupo.length > 0
      ? departamentos.filter((d) => filterEmpresaGrupo.includes(d.empresa_grupo_id))
      : departamentos
    return filtered.map((d) => ({ value: d.id, label: d.nombre }))
  }, [departamentos, filterEmpresaGrupo])

  // Servicios: si hay empresa_grupo seleccionada, solo los de esas empresas_grupo
  const servicioOptions: FilterOption[] = useMemo(() => {
    const filtered = filterEmpresaGrupo.length > 0
      ? servicios.filter((s) => filterEmpresaGrupo.includes(s.empresa_grupo_id))
      : servicios
    return filtered.map((s) => ({ value: s.id, label: s.nombre }))
  }, [servicios, filterEmpresaGrupo])

  // ── Filtrado principal ──
  const filtered = useMemo(() => {
    const minPpto = pptoMin !== '' ? Number(pptoMin) : null
    const maxPpto = pptoMax !== '' ? Number(pptoMax) : null

    return proyectos.filter((p) => {
      // Búsqueda texto
      const clienteNombre = getClienteNombre(p)
      if (search) {
        const q = search.toLowerCase()
        if (!p.titulo.toLowerCase().includes(q) && !clienteNombre.toLowerCase().includes(q)) return false
      }

      // Estado (multi)
      if (filterEstado.length > 0 && !filterEstado.includes(p.estado)) return false

      // Empresa grupo
      if (filterEmpresaGrupo.length > 0 && !filterEmpresaGrupo.includes(p.empresa_grupo_id)) return false

      // Empresa (cliente)
      if (filterEmpresa.length > 0) {
        if (!p.empresa_id || !filterEmpresa.includes(p.empresa_id)) return false
      }

      // Departamento
      if (filterDepartamento.length > 0) {
        const deptIds = getDepartamentoIdsProyecto(p.id)
        if (!filterDepartamento.some((fd) => deptIds.includes(fd))) return false
      }

      // Servicio (a través de departamentos del proyecto)
      if (filterServicio.length > 0) {
        const deptIds = getDepartamentoIdsProyecto(p.id)
        const servicioIds = new Set<string>()
        for (const dId of deptIds) {
          const sIds = deptServiciosMap.get(dId)
          if (sIds) sIds.forEach((id) => servicioIds.add(id))
        }
        if (!filterServicio.some((fs) => servicioIds.has(fs))) return false
      }

      // Presupuesto estimado
      if (minPpto !== null && p.ppto_estimado < minPpto) return false
      if (maxPpto !== null && p.ppto_estimado > maxPpto) return false

      // Fecha de activación
      if (sinFecha || fechaDesde || fechaHasta) {
        const tieneFecha = !!p.fecha_activacion
        if (sinFecha && (fechaDesde || fechaHasta)) {
          // Checkbox + rango: incluir sin fecha OR dentro del rango
          if (tieneFecha) {
            if (fechaDesde && p.fecha_activacion! < fechaDesde) return false
            if (fechaHasta && p.fecha_activacion! > fechaHasta) return false
          }
          // sin fecha pasa siempre en modo OR
        } else if (sinFecha) {
          // Solo checkbox: solo los que no tienen fecha
          if (tieneFecha) return false
        } else {
          // Solo rango: excluir los sin fecha
          if (!tieneFecha) return false
          if (fechaDesde && p.fecha_activacion! < fechaDesde) return false
          if (fechaHasta && p.fecha_activacion! > fechaHasta) return false
        }
      }

      return true
    })
  }, [proyectos, search, filterEstado, filterEmpresaGrupo, filterEmpresa, filterDepartamento, filterServicio, pptoMin, pptoMax, fechaDesde, fechaHasta, sinFecha, empresaMap, proyectoDeptIds, deptServiciosMap])

  // ── KPIs (sobre el total, no filtrado) ──
  const activos = proyectos.filter((p) => p.estado === 'Activo').length
  const propuestas = proyectos.filter((p) => p.estado === 'Propuesta').length
  const pptoTotal = proyectos
    .filter((p) => p.estado === 'Activo')
    .reduce((sum, p) => sum + p.ppto_estimado, 0)

  // ── ¿Hay algún filtro activo? ──
  const hasAnyFilter = filterEstado.length > 0 || filterEmpresaGrupo.length > 0 || filterEmpresa.length > 0 || filterDepartamento.length > 0 || filterServicio.length > 0 || pptoMin !== '' || pptoMax !== '' || fechaDesde !== '' || fechaHasta !== '' || sinFecha

  function clearAllFilters() {
    setFilterEstado([])
    setFilterEmpresaGrupo([])
    setFilterEmpresa([])
    setFilterDepartamento([])
    setFilterServicio([])
    setPptoMin('')
    setPptoMax('')
    setFechaDesde('')
    setFechaHasta('')
    setSinFecha(false)
  }

  function ProjectCard({ p, compact = false }: { p: Proyecto; compact?: boolean }) {
    const cliente = getClienteNombre(p)
    const empresaGrupo = empresaGrupoMap.get(p.empresa_grupo_id)
    const depts = getDepartamentosProyecto(p.id)
    const deptIds = getDepartamentoIdsProyecto(p.id)

    return (
      <div
        onClick={() => router.push(`/proyectos/${p.id}`)}
        className={`rounded-xl bg-white shadow-sm border border-transparent hover:border-primary/20 transition-colors cursor-pointer ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
              <ClientePill name={cliente} />
              <p className={`font-bold text-foreground ${compact ? 'text-xs truncate' : 'text-sm'}`}>
                {p.titulo}
              </p>
              {!compact && depts.map((d) => (
                <DeptPill key={d!.id} name={d!.nombre} label={d!.codigo} />
              ))}
            </div>
            {!compact && (
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                <span>{empresaGrupo?.codigo ?? '—'}</span>
                <span>·</span>
                <span>{p.tipo_proyecto}</span>
                <span>·</span>
                <span>{p.tipo_partida}</span>
                {p.fecha_activacion && (
                  <>
                    <span>·</span>
                    <span>Desde {formatDate(p.fecha_activacion)}</span>
                  </>
                )}
              </div>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
              {formatMoney(p.ppto_estimado)}
            </span>
            {!compact && <StatusBadge status={p.estado} />}
          </div>
        </div>

        {/* Barra de tiempo para Puntuales */}
        <BarraTiempo proyecto={p} />

        {/* Acciones — solo en modo lista */}
        {!compact && (
          <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
            <ProyectoOtAction
              proyecto={p}
              proyectos={proyectos}
              servicios={servicios}
              departamentos={departamentos}
              personas={personas}
              empresas={empresas}
            />
            <ProyectoFormSheet
              empresas={empresas}
              empresasGrupo={empresasGrupo}
              personas={personas}
              departamentos={departamentos}
              proyecto={p}
              proyectoDepartamentoIds={deptIds}
            />
          </div>
        )}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Proyectos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Proyectos activos, propuestas y proyectos internos
          </p>
        </div>
        {/* Toggle vista */}
        <div className="flex items-center gap-1 rounded-lg border border-border p-1">
          <button
            onClick={() => setView('list')}
            className={`rounded-md p-1.5 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista lista"
          >
            <LayoutList className="h-4 w-4" />
          </button>
          <button
            onClick={() => setView('kanban')}
            className={`rounded-md p-1.5 transition-colors ${view === 'kanban' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista kanban"
          >
            <LayoutGrid className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Activos" value={activos} borderColor="border-t-blue-500" />
        <KpiCard label="Propuestas" value={propuestas} borderColor="border-t-purple-500" />
        <KpiCard label="Ppto. activos" value={formatMoney(pptoTotal)} borderColor="border-t-amber-500" />
      </div>

      {/* Search + Action */}
      <div className="mt-5 flex items-center gap-3">
        <SearchBar placeholder="Buscar proyecto o cliente..." value={search} onChange={setSearch} />
        <ProyectoFormSheet
          empresas={empresas}
          empresasGrupo={empresasGrupo}
          personas={personas}
          departamentos={departamentos}
        />
      </div>

      {/* ── Barra de filtros ── */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <MultiSelectFilter
          label="Estado"
          options={ESTADO_OPTIONS}
          selected={filterEstado}
          onChange={setFilterEstado}
        />
        <MultiSelectFilter
          label="Empresa grupo"
          options={empresaGrupoOptions}
          selected={filterEmpresaGrupo}
          onChange={setFilterEmpresaGrupo}
        />
        <MultiSelectFilter
          label="Empresa"
          options={empresaOptions}
          selected={filterEmpresa}
          onChange={setFilterEmpresa}
          searchable
        />
        <MultiSelectFilter
          label="Departamento"
          options={departamentoOptions}
          selected={filterDepartamento}
          onChange={setFilterDepartamento}
          searchable
        />
        <MultiSelectFilter
          label="Servicio"
          options={servicioOptions}
          selected={filterServicio}
          onChange={setFilterServicio}
          searchable
        />

        {/* Rango presupuesto */}
        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Ppto.</span>
          <input
            type="number"
            placeholder="Min"
            value={pptoMin}
            onChange={(e) => setPptoMin(e.target.value)}
            className="w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="number"
            placeholder="Max"
            value={pptoMax}
            onChange={(e) => setPptoMax(e.target.value)}
            className="w-20 bg-transparent text-xs outline-none placeholder:text-muted-foreground/60 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
          />
          {(pptoMin || pptoMax) && (
            <button onClick={() => { setPptoMin(''); setPptoMax('') }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Rango fecha activación */}
        <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
          <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Inicio</span>
          <input
            type="date"
            value={fechaDesde}
            onChange={(e) => setFechaDesde(e.target.value)}
            className="w-[120px] bg-transparent text-xs outline-none text-foreground"
          />
          <span className="text-xs text-muted-foreground">–</span>
          <input
            type="date"
            value={fechaHasta}
            onChange={(e) => setFechaHasta(e.target.value)}
            className="w-[120px] bg-transparent text-xs outline-none text-foreground"
          />
          <label className="flex items-center gap-1 cursor-pointer">
            <input
              type="checkbox"
              checked={sinFecha}
              onChange={(e) => setSinFecha(e.target.checked)}
              className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <span className="text-[10px] text-muted-foreground whitespace-nowrap">Sin fecha</span>
          </label>
          {(fechaDesde || fechaHasta || sinFecha) && (
            <button onClick={() => { setFechaDesde(''); setFechaHasta(''); setSinFecha(false) }} className="text-muted-foreground hover:text-foreground">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Limpiar todos */}
        {hasAnyFilter && (
          <button
            onClick={clearAllFilters}
            className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors"
          >
            <X className="h-3 w-3" />
            Limpiar filtros
          </button>
        )}

        {/* Contador de resultados */}
        <span className="ml-auto text-xs text-muted-foreground">
          {filtered.length} de {proyectos.length} proyectos
        </span>
      </div>

      {/* ── VISTA LISTA ── */}
      {view === 'list' && (
        <div className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">No se encontraron proyectos con esos filtros.</p>
            </div>
          )}
          {filtered.map((p) => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}

      {/* ── VISTA KANBAN ── */}
      {view === 'kanban' && (
        <div className="mt-4 overflow-x-auto pb-4">
          <div className="flex gap-4 min-w-max">
            {KANBAN_COLUMNS.map((estado) => {
              const colProyectos = filtered.filter((p) => p.estado === estado)

              return (
                <div key={estado} className="w-64 shrink-0">
                  {/* Columna header */}
                  <div className="mb-2 flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <StatusBadge status={estado} />
                      <span className="text-xs font-semibold text-muted-foreground">
                        {colProyectos.length}
                      </span>
                    </div>
                  </div>

                  {/* Tarjetas */}
                  <div className="space-y-2">
                    {colProyectos.length === 0 ? (
                      <div className="rounded-xl border-2 border-dashed border-border p-4 text-center">
                        <p className="text-xs text-muted-foreground">Sin proyectos</p>
                      </div>
                    ) : (
                      colProyectos.map((p) => <ProjectCard key={p.id} p={p} compact />)
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
