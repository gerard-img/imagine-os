'use client'

import { useState, useMemo, Suspense } from 'react'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { SortControl } from '@/components/sortable-header'
import type { Proyecto, Empresa, EmpresaGrupo, Departamento, ProyectoDepartamento, Persona, ServicioYDept } from '@/lib/supabase/types'
import { formatMoney } from '@/lib/helpers'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { StatusBadge } from '@/components/status-badge'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import type { FilterOption } from '@/components/multi-select-filter'
import { ProyectoFormSheet } from './proyecto-form-sheet'
import { ProjectCard } from './project-card'
import { archivarProyecto, desarchivarProyecto, eliminarProyecto, restaurarProyecto } from './actions'
import type { CatalogoServicio } from '@/lib/supabase/types'
import { NumberInput } from '@/components/number-input'
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


const SORT_OPTIONS = [
  { value: 'titulo', label: 'Título' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'ppto', label: 'Presupuesto' },
  { value: 'estado', label: 'Estado' },
  { value: 'fecha', label: 'Fecha inicio' },
]

export default function ProyectosClient(props: Props) {
  return (
    <Suspense>
      <ProyectosContent {...props} />
    </Suspense>
  )
}

function ProyectosContent({
  proyectos,
  empresas,
  empresasGrupo,
  departamentos,
  proyectosDepartamentos,
  personas,
  servicios,
  serviciosYDepts,
}: Props) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'cliente', dir: 'asc' },
  })

  // ── Vista archivo ──
  type ArchivoVista = 'activos' | 'archivados' | 'eliminados'
  const archivoVista = (getParam('archivo', 'activos') as ArchivoVista)

  // ── State for action buttons ──
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // ── Filtros desde URL params (persistentes) ──
  const view = (getParam('vista', 'list') as 'list' | 'kanban')
  const filterEstado = useMemo(() => { const v = getParam('estado'); return v ? v.split(',') : [] }, [getParam])
  const filterEmpresaGrupo = useMemo(() => { const v = getParam('eg'); return v ? v.split(',') : [] }, [getParam])
  const filterEmpresa = useMemo(() => { const v = getParam('empresa'); return v ? v.split(',') : [] }, [getParam])
  const filterDepartamento = useMemo(() => { const v = getParam('depto'); return v ? v.split(',') : [] }, [getParam])
  const filterServicio = useMemo(() => { const v = getParam('servicio'); return v ? v.split(',') : [] }, [getParam])
  const pptoMin = getParam('pptoMin', '')!
  const pptoMax = getParam('pptoMax', '')!
  const fechaDesde = getParam('desde', '')!
  const fechaHasta = getParam('hasta', '')!
  const sinFecha = getParam('sinFecha') === '1'

  // Search permanece local (evitar ruido en URL al teclear)
  const [search, setSearch] = useState('')

  // Helpers para arrays en URL
  const setArrayParam = (key: string, values: string[]) => setParams({ [key]: values.length > 0 ? values.join(',') : null })

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

    // Ventana de 7 días para eliminados
    const sieteDiasAtras = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()

    return proyectos.filter((p) => {
      // Filtro por vista de archivo
      if (archivoVista === 'activos') {
        if (p.deleted_at || p.archivado_at) return false
      } else if (archivoVista === 'archivados') {
        if (p.deleted_at || !p.archivado_at) return false
      } else if (archivoVista === 'eliminados') {
        if (!p.deleted_at) return false
        if (p.deleted_at < sieteDiasAtras) return false
      }

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
  }, [proyectos, archivoVista, search, filterEstado, filterEmpresaGrupo, filterEmpresa, filterDepartamento, filterServicio, pptoMin, pptoMax, fechaDesde, fechaHasta, sinFecha, empresaMap, proyectoDeptIds, deptServiciosMap])

  // ── KPIs (sobre proyectos no eliminados, archivados sí cuentan) ──
  const proyectosVivos = proyectos.filter((p) => !p.deleted_at)
  const activos = proyectosVivos.filter((p) => p.estado === 'Activo').length
  const propuestas = proyectosVivos.filter((p) => p.estado === 'Propuesta').length
  const pptoTotal = proyectosVivos
    .filter((p) => p.estado === 'Activo')
    .reduce((sum, p) => sum + p.ppto_estimado, 0)

  // Aplicar ordenación (solo en vista lista)
  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    titulo: (p) => p.titulo.toLowerCase(),
    cliente: (p) => getClienteNombre(p).toLowerCase(),
    ppto: (p) => p.ppto_estimado,
    estado: (p) => p.estado,
    fecha: (p) => p.fecha_activacion ?? '',
  }), [filtered, sortCol, sortDir])

  // ── ¿Hay algún filtro activo? ──
  const hasAnyFilter = filterEstado.length > 0 || filterEmpresaGrupo.length > 0 || filterEmpresa.length > 0 || filterDepartamento.length > 0 || filterServicio.length > 0 || pptoMin !== '' || pptoMax !== '' || fechaDesde !== '' || fechaHasta !== '' || sinFecha

  function clearAllFilters() {
    setParams({
      estado: null, eg: null, empresa: null, depto: null, servicio: null,
      pptoMin: null, pptoMax: null, desde: null, hasta: null, sinFecha: null,
    })
  }

  async function handleArchivar(id: string) {
    setActionLoading(id)
    setActionError(null)
    const result = await archivarProyecto(id)
    if (!result.success) setActionError(result.error ?? 'Error al archivar')
    setActionLoading(null)
  }

  async function handleDesarchivar(id: string) {
    setActionLoading(id)
    setActionError(null)
    const result = await desarchivarProyecto(id)
    if (!result.success) setActionError(result.error ?? 'Error al desarchivar')
    setActionLoading(null)
  }

  async function handleEliminar(id: string) {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setActionLoading(id)
    setActionError(null)
    setConfirmDeleteId(null)
    const result = await eliminarProyecto(id)
    if (!result.success) setActionError(result.error ?? 'Error al eliminar')
    setActionLoading(null)
  }

  async function handleRestaurar(id: string) {
    setActionLoading(id)
    setActionError(null)
    const result = await restaurarProyecto(id)
    if (!result.success) setActionError(result.error ?? 'Error al restaurar')
    setActionLoading(null)
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-y-3">
        <div>
          <h1 className="text-xl font-bold text-foreground">Proyectos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Proyectos activos, propuestas y proyectos internos
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {/* Pills archivo */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            {([
              { key: 'activos', label: 'Activos' },
              { key: 'archivados', label: 'Archivados' },
              { key: 'eliminados', label: 'Eliminados' },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setParams({ archivo: key === 'activos' ? null : key })}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                  archivoVista === key
                    ? key === 'eliminados' ? 'bg-red-600 text-white' : key === 'archivados' ? 'bg-amber-500 text-white' : 'bg-primary text-white'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Toggle vista */}
          <div className="flex items-center gap-1 rounded-lg border border-border p-1">
            <button
              onClick={() => setParams({ vista: null })}
              className={`rounded-md p-1.5 transition-colors ${view === 'list' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Vista lista"
            >
              <LayoutList className="h-4 w-4" />
            </button>
            <button
              onClick={() => setParams({ vista: 'kanban' })}
              className={`rounded-md p-1.5 transition-colors ${view === 'kanban' ? 'bg-primary text-white' : 'text-muted-foreground hover:text-foreground'}`}
              title="Vista kanban"
            >
              <LayoutGrid className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Error de acción */}
      {actionError && (
        <div className="mt-3 rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2 flex items-center justify-between">
          <p className="text-sm text-destructive">{actionError}</p>
          <button onClick={() => setActionError(null)} className="text-destructive hover:text-destructive/70">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-2 lg:grid-cols-3 gap-4">
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

      {/* ── Filtros (2 filas) ── */}
      <div className="mt-3 space-y-2">
        {/* Fila 1: Dropdowns de filtro */}
        <div className="flex items-center gap-3 flex-wrap">
          <MultiSelectFilter
            label="Estado"
            options={ESTADO_OPTIONS}
            selected={filterEstado}
            onChange={(v) => setArrayParam('estado', v)}
          />
          <MultiSelectFilter
            label="Empresa grupo"
            options={empresaGrupoOptions}
            selected={filterEmpresaGrupo}
            onChange={(v) => setArrayParam('eg', v)}
          />
          <MultiSelectFilter
            label="Empresa"
            options={empresaOptions}
            selected={filterEmpresa}
            onChange={(v) => setArrayParam('empresa', v)}
            searchable
          />
          <MultiSelectFilter
            label="Departamento"
            options={departamentoOptions}
            selected={filterDepartamento}
            onChange={(v) => setArrayParam('depto', v)}
            searchable
          />
          <MultiSelectFilter
            label="Servicio"
            options={servicioOptions}
            selected={filterServicio}
            onChange={(v) => setArrayParam('servicio', v)}
            searchable
          />
        </div>

        {/* Fila 2: Rangos, limpiar, orden */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Rango presupuesto */}
          <div className="flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1">
            <span className="text-xs font-semibold text-muted-foreground whitespace-nowrap">Ppto.</span>
            <NumberInput
              placeholder="Min"
              value={pptoMin}
              onChange={(e) => setParams({ pptoMin: e.target.value || null })}
              className="w-20 border-0 bg-transparent"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <NumberInput
              placeholder="Max"
              value={pptoMax}
              onChange={(e) => setParams({ pptoMax: e.target.value || null })}
              className="w-20 border-0 bg-transparent"
            />
            {(pptoMin || pptoMax) && (
              <button onClick={() => setParams({ pptoMin: null, pptoMax: null })} className="text-muted-foreground hover:text-foreground">
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
              onChange={(e) => setParams({ desde: e.target.value || null })}
              className="w-[120px] bg-transparent text-xs outline-none text-foreground"
            />
            <span className="text-xs text-muted-foreground">–</span>
            <input
              type="date"
              value={fechaHasta}
              onChange={(e) => setParams({ hasta: e.target.value || null })}
              className="w-[120px] bg-transparent text-xs outline-none text-foreground"
            />
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={sinFecha}
                onChange={(e) => setParams({ sinFecha: e.target.checked ? '1' : null })}
                className="h-3 w-3 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">Sin fecha</span>
            </label>
            {(fechaDesde || fechaHasta || sinFecha) && (
              <button onClick={() => setParams({ desde: null, hasta: null, sinFecha: null })} className="text-muted-foreground hover:text-foreground">
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

          {/* Sort + Contador de resultados */}
          <div className="ml-auto flex shrink-0 items-center gap-3">
            {view === 'list' && (
              <SortControl options={SORT_OPTIONS} currentCol={sortCol} currentDir={sortDir} onSort={toggleSort} />
            )}
            <span className="text-xs text-muted-foreground">
              {filtered.length} proyecto{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* ── VISTA LISTA ── */}
      {view === 'list' && (
        <div className="mt-4 space-y-2">
          {filtered.length === 0 && (
            <div className="rounded-xl bg-white p-8 text-center shadow-sm">
              <p className="text-sm text-muted-foreground">No se encontraron proyectos con esos filtros.</p>
            </div>
          )}
          {sorted.map((p) => (
            <ProjectCard
              key={p.id}
              p={p}
              archivoVista={archivoVista}
              empresaMap={empresaMap}
              empresaGrupoMap={empresaGrupoMap}
              proyectoDeptIds={proyectoDeptIds}
              departamentoMap={departamentoMap}
              proyectos={proyectos}
              servicios={servicios}
              departamentos={departamentos}
              personas={personas}
              empresas={empresas}
              empresasGrupo={empresasGrupo}
              actionLoading={actionLoading}
              confirmDeleteId={confirmDeleteId}
              onArchivar={handleArchivar}
              onDesarchivar={handleDesarchivar}
              onEliminar={handleEliminar}
              onRestaurar={handleRestaurar}
            />
          ))}
        </div>
      )}

      {/* ── VISTA KANBAN ── */}
      {view === 'kanban' && (
        <div className="mt-4 overflow-x-auto pb-4 max-w-full">
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
                      colProyectos.map((p) => (
                        <ProjectCard
                          key={p.id}
                          p={p}
                          compact
                          archivoVista={archivoVista}
                          empresaMap={empresaMap}
                          empresaGrupoMap={empresaGrupoMap}
                          proyectoDeptIds={proyectoDeptIds}
                          departamentoMap={departamentoMap}
                          proyectos={proyectos}
                          servicios={servicios}
                          departamentos={departamentos}
                          personas={personas}
                          empresas={empresas}
                          empresasGrupo={empresasGrupo}
                          actionLoading={actionLoading}
                          confirmDeleteId={confirmDeleteId}
                          onArchivar={handleArchivar}
                          onDesarchivar={handleDesarchivar}
                          onEliminar={handleEliminar}
                          onRestaurar={handleRestaurar}
                        />
                      ))
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
