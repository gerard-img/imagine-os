'use client'

import { useState, useMemo, Suspense } from 'react'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { SortControl } from '@/components/sortable-header'
import { FilterSelect } from '@/components/filter-select'
import { MultiSelectFilter } from '@/components/multi-select-filter'
import { FilterBar } from '@/components/filter-bar'
import type {
  OrdenTrabajo,
  Asignacion,
  Persona,
  Proyecto,
  ProyectoDepartamento,
  Departamento,
  CatalogoServicio,
  Empresa,
  EmpresaGrupo,
  CuotaPlanificacion,
  PersonaDepartamento,
  HorasTrabajables,
} from '@/lib/supabase/types'
import { safeDivide, formatMoney } from '@/lib/helpers'
import { resolverHorasTrabajables } from '@/lib/horas-trabajables'
import { KpiCard } from '@/components/kpi-card'
import { MonthNavigator } from '@/components/month-navigator'
import { SearchBar } from '@/components/search-bar'
import { guardarAsignacionesOT } from './actions'
import { eliminarOrdenTrabajo } from '../ordenes-trabajo/actions'
import { OtFormSheet } from '../ordenes-trabajo/ot-form-sheet'
import { GenerarOtsButton } from '../ordenes-trabajo/generar-ots-button'
import { ProyectosSinOtsAlert } from './proyectos-sin-ots-alert'
import { OtCard } from './ot-card'

// ── Props del servidor ──
type PlanificadorClientProps = {
  ordenesTrabajo: OrdenTrabajo[]
  asignaciones: Asignacion[]
  personas: Persona[]
  proyectos: Proyecto[]
  proyectosDepartamentos: ProyectoDepartamento[]
  departamentos: Departamento[]
  catalogoServicios: CatalogoServicio[]
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
  cuotasPlanificacion: CuotaPlanificacion[]
  personasDepartamentos: PersonaDepartamento[]
  horasTrabajables: HorasTrabajables[]
  initialMonth?: string
}

// Service pill colors — centralizado en components/servicio-pill.tsx

// Dept pill colors — centralizado en components/dept-pill.tsx

// ── Types for local editing state ──
export type AsignacionLocal = {
  id: string
  persona_id: string
  cuota_planificacion_id: string
  porcentaje_ppto_tm: number
  isNew?: boolean
}

type OrdenLocal = {
  id: string
  porcentaje_ppto_mes: number
  partida_prevista: number
  partida_real: number | null
}

const SORT_OPTIONS_PLANIF = [
  { value: 'proyecto', label: 'Proyecto' },
  { value: 'cliente', label: 'Cliente' },
  { value: 'partida', label: 'Partida' },
  { value: 'estado', label: 'Estado' },
]

export function PlanificadorClient(props: PlanificadorClientProps) {
  return (
    <Suspense>
      <PlanificadorContent {...props} />
    </Suspense>
  )
}

function PlanificadorContent({
  ordenesTrabajo,
  asignaciones: allAsignaciones,
  personas,
  proyectos,
  proyectosDepartamentos,
  departamentos,
  catalogoServicios,
  empresas,
  empresasGrupo,
  cuotasPlanificacion,
  personasDepartamentos,
  horasTrabajables,
  initialMonth,
}: PlanificadorClientProps) {
  // ── Lookup maps (O(1) en vez de find()) ──
  const proyectosMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const serviciosMap = useMemo(() => new Map(catalogoServicios.map((s) => [s.id, s])), [catalogoServicios])
  const deptosMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const empresasMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const egMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])
  const personasMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])
  const cuotasMap = useMemo(() => new Map(cuotasPlanificacion.map((c) => [c.id, c])), [cuotasPlanificacion])

  // ── URL params para filtros, sort y mes ──
  const defaultMonth = useMemo(() => {
    if (initialMonth) return initialMonth
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }, [initialMonth])

  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'cliente', dir: 'asc' },
  })
  const month = getParam('mes', defaultMonth)!
  const egFilter = getParam('eg', 'Todos')!
  const estadoFilter = useMemo(() => { const v = getParam('estado'); return v ? v.split(',') : [] }, [getParam])
  const deptoFilter = getParam('depto', 'Todos')!
  const servicioFilter = getParam('servicio', 'Todos')!
  const tipoPartidaFilter = getParam('tipoPartida', 'Todos')!

  // Search permanece local
  const [search, setSearch] = useState('')

  // ── Expanded cards ──
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // ── Local edits ──
  const [asignacionEdits, setAsignacionEdits] = useState<Record<string, AsignacionLocal[]>>({})
  const [ordenEdits, setOrdenEdits] = useState<Record<string, OrdenLocal>>({})

  // ── Save state ──
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  // ── Delete OT state ──
  const [confirmDeleteOt, setConfirmDeleteOt] = useState<string | null>(null)
  const [deletingOt, setDeletingOt] = useState<string | null>(null)

  // Mapa proyecto_id → Set de departamento_ids configurados en proyectos_departamentos
  const proyDeptoMap = useMemo(() => {
    const m = new Map<string, Set<string>>()
    for (const pd of proyectosDepartamentos) {
      if (!m.has(pd.proyecto_id)) m.set(pd.proyecto_id, new Set())
      m.get(pd.proyecto_id)!.add(pd.departamento_id)
    }
    return m
  }, [proyectosDepartamentos])

  const filterOptions = useMemo(() => {
    const egs = ['Todos', ...empresasGrupo.map((eg) => eg.nombre)]
    const estados = [...new Set(ordenesTrabajo.map((o) => o.estado))].map(e => ({ value: e, label: e }))

    // Proyectos con OTs en este mes
    const proyIdsEnMes = new Set(
      ordenesTrabajo.filter((ot) => ot.mes_anio === month).map((ot) => ot.proyecto_id)
    )

    // Cascada EG: si hay empresa_grupo seleccionada, solo proyectos de esa EG
    const egFilterId = egFilter !== 'Todos'
      ? empresasGrupo.find((eg) => eg.nombre === egFilter)?.id ?? null
      : null

    const deptoIdsActivos = new Set<string>()
    for (const proyId of proyIdsEnMes) {
      if (egFilterId) {
        const proy = proyectosMap.get(proyId)
        if (proy?.empresa_grupo_id !== egFilterId) continue
      }
      const pDeptos = proyDeptoMap.get(proyId)
      if (pDeptos) {
        for (const dId of pDeptos) deptoIdsActivos.add(dId)
      }
    }
    // Deduplicar por nombre (mismos nombres en distintas EGs)
    const deptoNombres = new Set(
      Array.from(deptoIdsActivos).map((id) => deptosMap.get(id)?.nombre).filter(Boolean) as string[]
    )
    const deptos = ['Todos', ...Array.from(deptoNombres).sort()]

    const servicios = ['Todos', ...new Set(catalogoServicios.map((s) => s.nombre))]
    const tiposPartida = ['Todos', 'Puntual', 'Recurrente']
    return { egs, estados, deptos, servicios, tiposPartida }
  }, [ordenesTrabajo, month, egFilter, catalogoServicios, empresasGrupo, proyDeptoMap, deptosMap, proyectosMap])

  // ── Filtered ordenes ──
  const filtered = useMemo(() => {
    // Resolver todos los IDs de departamento que coincidan con el nombre seleccionado
    const deptoFilterIds = deptoFilter !== 'Todos'
      ? new Set(
          Array.from(deptosMap.entries())
            .filter(([, d]) => d.nombre === deptoFilter)
            .map(([id]) => id)
        )
      : null

    return ordenesTrabajo.filter((ot) => {
      if (ot.mes_anio !== month) return false

      const proyecto = proyectosMap.get(ot.proyecto_id)
      const servicio = ot.servicio_id ? serviciosMap.get(ot.servicio_id) : undefined
      const depto = deptosMap.get(ot.departamento_id)
      const empresa = proyecto?.empresa_id ? empresasMap.get(proyecto.empresa_id) : undefined
      const clienteNombre = empresa?.nombre_interno ?? empresa?.nombre_legal ?? ''

      if (egFilter !== 'Todos' && egMap.get(proyecto?.empresa_grupo_id ?? '')?.nombre !== egFilter) return false
      if (estadoFilter.length > 0 && !estadoFilter.includes(ot.estado)) return false

      // Filtro de departamento: basado en proyectos_departamentos del proyecto
      if (deptoFilterIds) {
        const proyDeptosIds = proyDeptoMap.get(ot.proyecto_id)
        if (!proyDeptosIds || proyDeptosIds.size === 0) {
          // Proyecto sin departamentos configurados → mostrarlo siempre
        } else {
          // ¿El proyecto tiene configurado alguno de los deptos con este nombre?
          const tieneDepto = Array.from(deptoFilterIds).some((id) => proyDeptosIds.has(id))
          if (tieneDepto) {
            // Solo mostrar OTs cuyo departamento coincida
            if (!deptoFilterIds.has(ot.departamento_id)) return false
          } else {
            // El proyecto no tiene este depto → excluir
            return false
          }
        }
      }

      if (servicioFilter !== 'Todos' && servicio?.nombre !== servicioFilter) return false
      if (tipoPartidaFilter !== 'Todos' && proyecto?.tipo_partida !== tipoPartidaFilter) return false

      if (search) {
        const q = search.toLowerCase()
        const hayMatch =
          proyecto?.titulo.toLowerCase().includes(q) ||
          clienteNombre.toLowerCase().includes(q) ||
          servicio?.nombre.toLowerCase().includes(q) ||
          depto?.nombre.toLowerCase().includes(q)
        if (!hayMatch) return false
      }

      return true
    })
  }, [month, egFilter, estadoFilter, deptoFilter, servicioFilter, tipoPartidaFilter, search, ordenesTrabajo, proyectosMap, serviciosMap, deptosMap, empresasMap, egMap, proyDeptoMap])

  // Aplicar ordenación
  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    proyecto: (ot) => (proyectosMap.get(ot.proyecto_id)?.titulo ?? '').toLowerCase(),
    cliente: (ot) => {
      const p = proyectosMap.get(ot.proyecto_id)
      const e = p?.empresa_id ? empresasMap.get(p.empresa_id) : null
      return (e?.nombre_interno ?? e?.nombre_legal ?? '').toLowerCase()
    },
    partida: (ot) => ot.partida_prevista,
    estado: (ot) => ot.estado,
  }), [filtered, sortCol, sortDir, proyectosMap, empresasMap])

  // ── Get asignaciones for an OT (with local overrides) ──
  function getAsignacionesLocal(ordenId: string): AsignacionLocal[] {
    if (asignacionEdits[ordenId]) return asignacionEdits[ordenId]
    return allAsignaciones
      .filter((a) => a.orden_trabajo_id === ordenId)
      .map((a) => ({
        id: a.id,
        persona_id: a.persona_id,
        cuota_planificacion_id: a.cuota_planificacion_id,
        porcentaje_ppto_tm: a.porcentaje_ppto_tm,
      }))
  }

  function getOrdenPptoPct(ot: OrdenTrabajo): number {
    return ordenEdits[ot.id]?.porcentaje_ppto_mes ?? ot.porcentaje_ppto_mes
  }

  // ── Edit handlers ──
  function toggleExpand(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setConfirmDeleteOt(null)
  }

  function updateAsignacion(ordenId: string, asigId: string, field: keyof AsignacionLocal, value: string | number) {
    const current = getAsignacionesLocal(ordenId)
    const updated = current.map((a) =>
      a.id === asigId ? { ...a, [field]: value } : a
    )
    setAsignacionEdits((prev) => ({ ...prev, [ordenId]: updated }))
  }

  async function handleDeleteOt(otId: string) {
    if (confirmDeleteOt !== otId) { setConfirmDeleteOt(otId); return }
    setDeletingOt(otId)
    const result = await eliminarOrdenTrabajo(otId)
    if (!result.success) {
      setSaveErrors((prev) => ({ ...prev, [otId]: result.error ?? 'Error al eliminar' }))
    }
    setDeletingOt(null)
    setConfirmDeleteOt(null)
  }

  function deleteAsignacion(ordenId: string, asigId: string) {
    const current = getAsignacionesLocal(ordenId)
    const updated = current.filter((a) => a.id !== asigId)
    setAsignacionEdits((prev) => ({ ...prev, [ordenId]: updated }))
  }

  function addAsignacion(ordenId: string, departamentoId: string) {
    const current = getAsignacionesLocal(ordenId)
    const personasDepto = personasDepartamentos
      .filter((pd) => pd.departamento_id === departamentoId)
      .map((pd) => personasMap.get(pd.persona_id))
      .filter((p): p is Persona => !!p && p.activo)

    const firstPersona = personasDepto[0]
    if (!firstPersona) return

    const defaultCuota = cuotasPlanificacion.find(
      (c) => c.empresa_grupo_id === firstPersona.empresa_grupo_id && !c.fin_validez
    )

    const newAsig: AsignacionLocal = {
      id: `new-${Date.now()}`,
      persona_id: firstPersona.id,
      cuota_planificacion_id: defaultCuota?.id ?? cuotasPlanificacion[0]?.id ?? '',
      porcentaje_ppto_tm: 0,
      isNew: true,
    }
    setAsignacionEdits((prev) => ({ ...prev, [ordenId]: [...current, newAsig] }))
  }

  function initOrdenEdit(ordenId: string): OrdenLocal {
    const ot = ordenesTrabajo.find((o) => o.id === ordenId)
    return { id: ordenId, porcentaje_ppto_mes: ot?.porcentaje_ppto_mes ?? 0, partida_prevista: ot?.partida_prevista ?? 0, partida_real: ot?.partida_real ?? null }
  }

  function updateOrdenPpto(ordenId: string, pct: number) {
    setOrdenEdits((prev) => {
      const existing = prev[ordenId] ?? initOrdenEdit(ordenId)
      return { ...prev, [ordenId]: { ...existing, porcentaje_ppto_mes: pct } }
    })
  }

  function updateOrdenPartidaPrevista(ordenId: string, val: number) {
    setOrdenEdits((prev) => {
      const existing = prev[ordenId] ?? initOrdenEdit(ordenId)
      return { ...prev, [ordenId]: { ...existing, partida_prevista: val } }
    })
  }

  function updateOrdenPartidaReal(ordenId: string, val: number | null) {
    setOrdenEdits((prev) => {
      const existing = prev[ordenId] ?? initOrdenEdit(ordenId)
      return { ...prev, [ordenId]: { ...existing, partida_real: val } }
    })
  }

  function getOrdenPartidaPrevista(ot: OrdenTrabajo): number {
    const edit = ordenEdits[ot.id]
    return edit ? edit.partida_prevista : ot.partida_prevista
  }

  function getOrdenPartidaReal(ot: OrdenTrabajo): number | null {
    const edit = ordenEdits[ot.id]
    return edit ? edit.partida_real : ot.partida_real
  }

  async function handleGuardar(ot: OrdenTrabajo) {
    const asigs = getAsignacionesLocal(ot.id)
    const originalIds = allAsignaciones
      .filter((a) => a.orden_trabajo_id === ot.id && !a.deleted_at)
      .map((a) => a.id)

    const ordenUpdate = ordenEdits[ot.id]
      ? { porcentaje_ppto_mes: ordenEdits[ot.id].porcentaje_ppto_mes, partida_prevista: ordenEdits[ot.id].partida_prevista, partida_real: ordenEdits[ot.id].partida_real }
      : undefined

    setSavingIds((prev) => new Set(prev).add(ot.id))
    setSaveErrors((prev) => { const n = { ...prev }; delete n[ot.id]; return n })

    const result = await guardarAsignacionesOT(ot.id, asigs, originalIds, ordenUpdate)

    if (result.success) {
      setAsignacionEdits((prev) => { const n = { ...prev }; delete n[ot.id]; return n })
      setOrdenEdits((prev) => { const n = { ...prev }; delete n[ot.id]; return n })
    } else {
      setSaveErrors((prev) => ({ ...prev, [ot.id]: result.error ?? 'Error desconocido' }))
    }

    setSavingIds((prev) => { const n = new Set(prev); n.delete(ot.id); return n })
  }

  function hasLocalEdits(ordenId: string) {
    return !!(asignacionEdits[ordenId] || ordenEdits[ordenId])
  }

  // ── KPIs ──
  const kpis = useMemo(() => {
    let totalPrevisto = 0
    let totalReal = 0
    const personasSet = new Set<string>()
    let sumCarga = 0
    let cargaCount = 0

    for (const ot of filtered) {
      totalPrevisto += ot.partida_prevista
      totalReal += ot.partida_real ?? 0

      const asigs = getAsignacionesLocal(ot.id)
      for (const a of asigs) {
        personasSet.add(a.persona_id)

        const cuota = cuotasMap.get(a.cuota_planificacion_id)
        const ingresosAsignados = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
        const horasAsignadas = safeDivide(ingresosAsignados, cuota?.precio_hora ?? 0)
        const horasTrab = resolverHorasTrabajables(
          a.persona_id, month, personasMap, personasDepartamentos, horasTrabajables
        )
        const pctCargaPersona = safeDivide(horasAsignadas, horasTrab) * 100
        if (pctCargaPersona > 0) {
          sumCarga += pctCargaPersona
          cargaCount++
        }
      }
    }

    const pctOcupacion = cargaCount > 0 ? Math.round(sumCarga / cargaCount) : 0
    return { totalPrevisto, totalReal, personasAsignadas: personasSet.size, pctOcupacion }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, month, asignacionEdits])

  // ── Proyectos activos sin OTs este mes (solo con filtros activos) ──
  const hayFiltroActivo = egFilter !== 'Todos' || deptoFilter !== 'Todos' || servicioFilter !== 'Todos' || tipoPartidaFilter !== 'Todos'

  const proyectosSinOTs = useMemo(() => {
    if (!hayFiltroActivo) return []

    const [y, m] = month.split('-').map(Number)
    const ultimoDia = `${y}-${String(m).padStart(2, '0')}-${new Date(y, m, 0).getDate()}`

    const proyectosConOTs = new Set(
      ordenesTrabajo
        .filter((ot) => ot.mes_anio === month && !ot.deleted_at)
        .map((ot) => ot.proyecto_id)
    )

    return proyectos.filter((p) => {
      if (p.estado !== 'Activo' && p.estado !== 'Confirmado') return false
      if (!p.fecha_activacion || p.fecha_activacion > ultimoDia) return false
      if (p.fecha_cierre && p.fecha_cierre < month) return false
      if (proyectosConOTs.has(p.id)) return false

      // Aplicar los mismos filtros que las OTs
      if (egFilter !== 'Todos' && egMap.get(p.empresa_grupo_id)?.nombre !== egFilter) return false
      if (tipoPartidaFilter !== 'Todos' && p.tipo_partida !== tipoPartidaFilter) return false
      // Filtro por departamento: el proyecto debe tener ese departamento asignado
      if (deptoFilter !== 'Todos') {
        const deptoId = departamentos.find((d) => d.nombre === deptoFilter)?.id
        const proyDeptos = proyectosDepartamentos.filter((pd) => pd.proyecto_id === p.id)
        if (!proyDeptos.some((pd) => pd.departamento_id === deptoId)) return false
      }

      return true
    })
  }, [month, proyectos, ordenesTrabajo, hayFiltroActivo, egFilter, deptoFilter, tipoPartidaFilter, egMap, departamentos, proyectosDepartamentos])

  // ── Cuotas vigentes ──
  const cuotasVigentes = useMemo(
    () => cuotasPlanificacion.filter((c) => !c.fin_validez),
    [cuotasPlanificacion]
  )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Planificador</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Gestiona órdenes de trabajo y asignaciones del mes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerarOtsButton
            currentMonth={month}
            ordenesTrabajo={ordenesTrabajo}
            proyectos={proyectos}
            servicios={catalogoServicios}
            empresas={empresas}
            departamentos={departamentos}
            deptoFilter={deptoFilter}
          />
          <OtFormSheet
            proyectos={proyectos}
            servicios={catalogoServicios}
            departamentos={departamentos}
            personas={personas}
            empresas={empresas}
            ordenesTrabajo={ordenesTrabajo}
          />
          <MonthNavigator value={month} onChange={(v) => setParams({ mes: v })} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Total previsto" value={formatMoney(kpis.totalPrevisto)} borderColor="border-t-primary" />
        <KpiCard label="Total real" value={formatMoney(kpis.totalReal)} borderColor="border-t-blue-500" />
        <KpiCard label="Personas asignadas" value={kpis.personasAsignadas} borderColor="border-t-purple-500" />
        <KpiCard label="% Ocupación medio" value={`${kpis.pctOcupacion}%`} borderColor="border-t-amber-500" />
      </div>

      {/* Filters */}
      <FilterBar className="mt-5">
        <div className="w-64 shrink-0">
          <SearchBar placeholder="Buscar proyecto, cliente, servicio..." value={search} onChange={setSearch} />
        </div>
        <FilterSelect label="Empresa" options={filterOptions.egs} active={egFilter} onChange={(v) => setParams({ eg: v === 'Todos' ? null : v, depto: null })} />
        <MultiSelectFilter label="Estado" options={filterOptions.estados} selected={estadoFilter} onChange={(v) => setParams({ estado: v.length > 0 ? v.join(',') : null })} />
        <FilterSelect label="Departamento" options={filterOptions.deptos} active={deptoFilter} onChange={(v) => setParams({ depto: v === 'Todos' ? null : v })} />
        <FilterSelect label="Servicio" options={filterOptions.servicios} active={servicioFilter} onChange={(v) => setParams({ servicio: v === 'Todos' ? null : v })} />
        <FilterSelect label="Tipo partida" options={filterOptions.tiposPartida} active={tipoPartidaFilter} onChange={(v) => setParams({ tipoPartida: v === 'Todos' ? null : v })} />
        <div className="ml-auto shrink-0">
          <SortControl options={SORT_OPTIONS_PLANIF} currentCol={sortCol} currentDir={sortDir} onSort={toggleSort} />
        </div>
      </FilterBar>

      {/* Alerta: proyectos sin OTs (solo con filtros activos) */}
      <ProyectosSinOtsAlert
        proyectosSinOTs={proyectosSinOTs}
        month={month}
        empresasMap={empresasMap}
        proyectos={proyectos}
        catalogoServicios={catalogoServicios}
        departamentos={departamentos}
        personas={personas}
        empresas={empresas}
        ordenesTrabajo={ordenesTrabajo}
      />

      {/* Orders list */}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">No hay órdenes de trabajo para este mes con esos filtros.</p>
          </div>
        ) : (
          sorted.map((ot) => {
            const proyecto = proyectosMap.get(ot.proyecto_id)
            const servicio = ot.servicio_id ? serviciosMap.get(ot.servicio_id) : undefined
            const depto = deptosMap.get(ot.departamento_id)
            const empresa = proyecto?.empresa_id ? empresasMap.get(proyecto.empresa_id) : undefined
            const clienteNombre = empresa?.nombre_interno ?? empresa?.nombre_legal ?? '—'
            const asignaciones = getAsignacionesLocal(ot.id)
            const personasDepto = personasDepartamentos
              .filter((pd) => pd.departamento_id === ot.departamento_id)
              .map((pd) => personasMap.get(pd.persona_id))
              .filter((p): p is Persona => !!p && p.activo)

            return (
              <OtCard
                key={ot.id}
                ot={ot}
                month={month}
                expanded={expandedIds.has(ot.id)}
                onToggleExpand={() => toggleExpand(ot.id)}
                proyecto={proyecto}
                clienteNombre={clienteNombre}
                servicio={servicio}
                serviciosEg={catalogoServicios.filter((s) => s.empresa_grupo_id === proyecto?.empresa_grupo_id)}
                depto={depto}
                asignaciones={asignaciones}
                personasDepto={personasDepto}
                personasMap={personasMap}
                personasDepartamentos={personasDepartamentos}
                horasTrabajables={horasTrabajables}
                cuotasMap={cuotasMap}
                cuotasVigentes={cuotasVigentes}
                pptoPct={getOrdenPptoPct(ot)}
                partidaPrevista={getOrdenPartidaPrevista(ot)}
                partidaReal={getOrdenPartidaReal(ot)}
                hasLocalEdits={hasLocalEdits(ot.id)}
                isSaving={savingIds.has(ot.id)}
                saveError={saveErrors[ot.id]}
                confirmDelete={confirmDeleteOt === ot.id}
                isDeletingOt={deletingOt === ot.id}
                onUpdatePpto={(pct) => updateOrdenPpto(ot.id, pct)}
                onUpdatePartidaPrevista={(val) => updateOrdenPartidaPrevista(ot.id, val)}
                onUpdatePartidaReal={(val) => updateOrdenPartidaReal(ot.id, val)}
                onUpdateAsignacion={(asigId, field, value) => updateAsignacion(ot.id, asigId, field, value)}
                onDeleteAsignacion={(asigId) => deleteAsignacion(ot.id, asigId)}
                onAddAsignacion={() => addAsignacion(ot.id, ot.departamento_id)}
                onGuardar={() => handleGuardar(ot)}
                onDeleteOt={() => handleDeleteOt(ot.id)}
              />
            )
          })
        )}
      </div>
    </div>
  )
}

