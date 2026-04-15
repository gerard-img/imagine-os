'use client'

import { useState, useMemo, Suspense } from 'react'
import { useRouter } from 'next/navigation'
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
import { safeDivide, clamp, formatMoney } from '@/lib/helpers'
import { resolverHorasTrabajables } from '@/lib/horas-trabajables'
import { KpiCard } from '@/components/kpi-card'
import { MonthNavigator } from '@/components/month-navigator'
import { SearchBar } from '@/components/search-bar'
import { CambiarEstadoOT } from '@/components/cambiar-estado-ot'
import { ServicioPill } from '@/components/servicio-pill'
import { ClientePill } from '@/components/cliente-pill'
import { DeptPill } from '@/components/dept-pill'
import { NumberInput } from '@/components/number-input'
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2, Save, AlertTriangle } from 'lucide-react'
import { guardarAsignacionesOT } from './actions'
import { eliminarOrdenTrabajo } from '../ordenes-trabajo/actions'
import { OtFormSheet } from '../ordenes-trabajo/ot-form-sheet'
import { GenerarOtsButton } from '../ordenes-trabajo/generar-ots-button'
import { generarOTsProyectoMes } from '../ordenes-trabajo/generar-ots-mes'
import { SinServicioSelector } from './sin-servicio-selector'

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
type AsignacionLocal = {
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
  const router = useRouter()
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
  const [alertaOpen, setAlertaOpen] = useState(true)
  const [generandoIds, setGenerandoIds] = useState<Set<string>>(new Set())

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

  async function handleGenerarOTs(proyectoId: string) {
    setGenerandoIds((prev) => new Set(prev).add(proyectoId))
    await generarOTsProyectoMes(proyectoId, month)
    setGenerandoIds((prev) => { const n = new Set(prev); n.delete(proyectoId); return n })
  }

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
      {proyectosSinOTs.length > 0 && (
        <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
          <button
            onClick={() => setAlertaOpen(!alertaOpen)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left"
          >
            {alertaOpen ? (
              <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
            ) : (
              <ChevronRight className="h-4 w-4 text-amber-600 shrink-0" />
            )}
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-sm font-semibold text-amber-800">
              {proyectosSinOTs.length} proyecto{proyectosSinOTs.length > 1 ? 's' : ''} activo{proyectosSinOTs.length > 1 ? 's' : ''} sin OTs este mes
            </span>
          </button>

          {alertaOpen && (
            <div className="border-t border-amber-200 px-4 pb-3 pt-2 space-y-2">
              {proyectosSinOTs.map((p) => {
                const empresa = p.empresa_id ? empresasMap.get(p.empresa_id) : undefined
                const clienteNombre = empresa?.nombre_interno ?? empresa?.nombre_legal ?? 'Interno'
                const isGenerando = generandoIds.has(p.id)

                return (
                  <div key={p.id} className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <ClientePill name={clienteNombre} />
                      <span
                        className="text-sm font-semibold text-foreground truncate hover:text-primary hover:underline cursor-pointer"
                        onClick={() => router.push(`/proyectos/${p.id}`)}
                      >
                        {p.titulo}
                      </span>
                      <span className="text-[10px] text-muted-foreground shrink-0">
                        {p.tipo_partida}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {p.tipo_partida === 'Recurrente' ? (
                        <button
                          onClick={() => handleGenerarOTs(p.id)}
                          disabled={isGenerando}
                          className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
                        >
                          {isGenerando ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                          Generar OTs
                        </button>
                      ) : (
                        <OtFormSheet
                          proyectos={proyectos}
                          servicios={catalogoServicios}
                          departamentos={departamentos}
                          personas={personas}
                          empresas={empresas}
                          ordenesTrabajo={ordenesTrabajo}
                          preselectedProyectoId={p.id}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

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
            const pptoPct = getOrdenPptoPct(ot)
            const asignaciones = getAsignacionesLocal(ot.id)
            const expanded = expandedIds.has(ot.id)
            const totalPctAsig = asignaciones.reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
            const pctColor = totalPctAsig === 100 ? 'text-emerald-600' : totalPctAsig > 100 ? 'text-red-600' : 'text-amber-600'

            const personasDepto = personasDepartamentos
              .filter((pd) => pd.departamento_id === ot.departamento_id)
              .map((pd) => personasMap.get(pd.persona_id))
              .filter((p): p is Persona => !!p && p.activo)

            return (
              <div key={ot.id} className="rounded-xl bg-white shadow-sm relative">
                {/* ── Header ── */}
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleExpand(ot.id)}
                  onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleExpand(ot.id) } }}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}

                  <ClientePill name={clienteNombre} />
                  <span
                    className="text-sm font-bold text-foreground min-w-0 hover:text-primary hover:underline transition-colors cursor-pointer"
                    onClick={(e) => { e.stopPropagation(); router.push(`/proyectos/${ot.proyecto_id}`) }}
                  >
                    {proyecto?.titulo ?? '—'}
                  </span>

                  <CambiarEstadoOT otId={ot.id} estadoActual={ot.estado} />
                  {hasLocalEdits(ot.id) && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Cambios sin guardar" />
                  )}

                  <span onClick={(e) => e.stopPropagation()}>
                    {servicio ? (
                      <ServicioPill name={servicio.nombre} />
                    ) : (
                      <SinServicioSelector
                        otId={ot.id}
                        servicios={catalogoServicios.filter((s) => s.empresa_grupo_id === proyecto?.empresa_grupo_id)}
                      />
                    )}
                  </span>
                  {depto && <DeptPill name={depto.nombre} label={depto.codigo} />}

                  {/* Editable % ppto mes */}
                  <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <NumberInput
                      min={0}
                      max={100}
                      value={pptoPct}
                      onChange={(e) => updateOrdenPpto(ot.id, clamp(Number(e.target.value), 0, 100))}
                      className="w-14 text-foreground"
                    />
                    <span className="text-[10px] text-muted-foreground">% ppto</span>
                  </span>

                  <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <NumberInput
                      min={0}
                      step={1}
                      value={getOrdenPartidaPrevista(ot)}
                      onChange={(e) => updateOrdenPartidaPrevista(ot.id, Math.max(0, Number(e.target.value)))}
                      className="w-20 text-blue-600"
                    />
                    <span className="text-[10px] text-muted-foreground">€</span>
                  </span>

                  {/* Editable partida real */}
                  <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <NumberInput
                      min={0}
                      value={getOrdenPartidaReal(ot) ?? ''}
                      onChange={(e) => updateOrdenPartidaReal(ot.id, e.target.value === '' ? null : Number(e.target.value))}
                      className="w-20 text-emerald-600"
                      placeholder="—"
                    />
                    <span className="text-[10px] text-muted-foreground">real</span>
                  </span>

                  <span className={`text-xs font-bold shrink-0 tabular-nums w-16 text-right ${pctColor}`}>
                    {totalPctAsig}% asig.
                  </span>

                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                    {proyecto?.tipo_partida ?? '—'}
                  </span>
                </div>

                {/* ── Expanded: Asignaciones ── */}
                {expanded && (
                  <div className="border-t border-border/50 px-5 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Asignaciones
                      </p>
                      {totalPctAsig !== 100 && (
                        <span className="text-[10px] text-muted-foreground">
                          (debe sumar 100%)
                        </span>
                      )}
                    </div>

                    {/* Table header */}
                    <div className="grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 px-2 mb-1">
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Persona</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground">Cuota</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">% Asig.</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">Ingresos</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">Horas</span>
                      <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">% Carga</span>
                      <span />
                    </div>

                    {/* Rows */}
                    {asignaciones.length === 0 ? (
                      <p className="py-3 text-center text-xs text-muted-foreground">
                        Sin asignaciones. Añade personas del departamento.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {asignaciones.map((a) => {
                          const cuota = cuotasMap.get(a.cuota_planificacion_id)
                          const partidaPrev = getOrdenPartidaPrevista(ot)
                          const ingresosAsignados = partidaPrev * (a.porcentaje_ppto_tm / 100)
                          const horasADedicar = safeDivide(ingresosAsignados, cuota?.precio_hora ?? 0)
                          const horasTrab = resolverHorasTrabajables(
                            a.persona_id, month, personasMap, personasDepartamentos, horasTrabajables
                          )
                          const pctCarga = safeDivide(horasADedicar, horasTrab) * 100
                          const cargaColor = pctCarga > 100 ? 'text-red-600' : pctCarga > 80 ? 'text-amber-600' : 'text-foreground'

                          return (
                            <div
                              key={a.id}
                              className="grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-muted/30"
                            >
                              {/* Persona selector */}
                              <select
                                value={a.persona_id}
                                onChange={(e) => updateAsignacion(ot.id, a.id, 'persona_id', e.target.value)}
                                className="rounded border border-border bg-white px-2 py-1 text-sm outline-none focus:border-primary truncate"
                              >
                                {personasDepto.map((p) => (
                                  <option key={p.id} value={p.id}>
                                    {p.persona}
                                  </option>
                                ))}
                                {!personasDepto.find((p) => p.id === a.persona_id) && (
                                  <option value={a.persona_id}>
                                    {personasMap.get(a.persona_id)?.persona ?? '—'}
                                  </option>
                                )}
                              </select>

                              {/* Cuota selector — filtrado por empresa_grupo de la persona */}
                              <select
                                value={a.cuota_planificacion_id}
                                onChange={(e) => updateAsignacion(ot.id, a.id, 'cuota_planificacion_id', e.target.value)}
                                className="rounded border border-border bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                              >
                                {(() => {
                                  const ORDEN_CUOTAS = ['Senior', 'Specialist', 'Junior', 'Intern', 'Coordinador']
                                  const pEgId = personasMap.get(a.persona_id)?.empresa_grupo_id
                                  return cuotasVigentes
                                    .filter((c) => c.empresa_grupo_id === pEgId)
                                    .sort((a, b) => {
                                      const ia = ORDEN_CUOTAS.indexOf(a.nombre)
                                      const ib = ORDEN_CUOTAS.indexOf(b.nombre)
                                      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
                                    })
                                    .map((c) => (
                                      <option key={c.id} value={c.id}>
                                        {c.nombre} ({c.precio_hora}€/h)
                                      </option>
                                    ))
                                })()}
                              </select>

                              {/* % asignación */}
                              <NumberInput
                                min={0}
                                max={100}
                                value={a.porcentaje_ppto_tm}
                                onChange={(e) => updateAsignacion(ot.id, a.id, 'porcentaje_ppto_tm', clamp(Number(e.target.value), 0, 100))}
                                className="w-full px-2 py-1"
                              />

                              {/* Ingresos asignados (read-only) */}
                              <span className="text-xs font-medium text-blue-600 text-right">
                                {formatMoney(ingresosAsignados)}
                              </span>

                              {/* Horas a dedicar (read-only) */}
                              <span className="text-xs font-medium text-right">
                                {Math.round(horasADedicar)}h
                              </span>

                              {/* % Carga (read-only) */}
                              <span className={`text-xs font-bold text-right ${cargaColor}`}>
                                {Math.round(pctCarga)}%
                              </span>

                              {/* Delete */}
                              <button
                                onClick={() => deleteAsignacion(ot.id, a.id)}
                                className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 transition-colors"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    )}

                    {/* Add button */}
                    <button
                      onClick={() => addAsignacion(ot.id, ot.departamento_id)}
                      className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir persona
                    </button>

                    {/* Save / Delete OT / error */}
                    <div className="mt-3 flex items-center gap-3">
                      {hasLocalEdits(ot.id) && (
                        <button
                          onClick={() => handleGuardar(ot)}
                          disabled={savingIds.has(ot.id)}
                          className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
                        >
                          {savingIds.has(ot.id)
                            ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
                            : <><Save className="h-3.5 w-3.5" /> Guardar cambios</>
                          }
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteOt(ot.id)}
                        disabled={deletingOt === ot.id}
                        className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ml-auto ${
                          confirmDeleteOt === ot.id
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'text-red-500 hover:bg-red-50'
                        }`}
                      >
                        {deletingOt === ot.id
                          ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          : <Trash2 className="h-3.5 w-3.5" />
                        }
                        {confirmDeleteOt === ot.id ? '¿Eliminar OT y asignaciones?' : 'Eliminar OT'}
                      </button>
                      {saveErrors[ot.id] && (
                        <p className="text-xs text-destructive">{saveErrors[ot.id]}</p>
                      )}
                    </div>

                    {/* Total row */}
                    {asignaciones.length > 0 && (
                      <div className="mt-3 border-t border-border pt-2 grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 px-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">TOTAL</span>
                        <span />
                        <span className={`text-xs font-bold text-right ${pctColor}`}>{totalPctAsig}%</span>
                        <span className="text-xs font-bold text-blue-600 text-right">
                          {formatMoney(asignaciones.reduce((sum, a) => sum + getOrdenPartidaPrevista(ot) * (a.porcentaje_ppto_tm / 100), 0))}
                        </span>
                        <span className="text-xs font-bold text-right">
                          {Math.round(
                            asignaciones.reduce((sum, a) => {
                              const cuota = cuotasMap.get(a.cuota_planificacion_id)
                              const ing = getOrdenPartidaPrevista(ot) * (a.porcentaje_ppto_tm / 100)
                              return sum + safeDivide(ing, cuota?.precio_hora ?? 0)
                            }, 0)
                          )}h
                        </span>
                        <span />
                        <span />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

