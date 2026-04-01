'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type {
  OrdenTrabajo,
  Asignacion,
  Persona,
  Proyecto,
  Departamento,
  CatalogoServicio,
  Empresa,
  CuotaPlanificacion,
  PersonaDepartamento,
  HorasTrabajables,
} from '@/lib/supabase/types'
import { safeDivide, clamp, formatMoney } from '@/lib/helpers'
import { KpiCard } from '@/components/kpi-card'
import { MonthNavigator } from '@/components/month-navigator'
import { SearchBar } from '@/components/search-bar'
import { StatusBadge } from '@/components/status-badge'
import { ServicioPill } from '@/components/servicio-pill'
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2, Save } from 'lucide-react'
import { guardarAsignacionesOT } from './actions'

// ── Props del servidor ──
type PlanificadorClientProps = {
  ordenesTrabajo: OrdenTrabajo[]
  asignaciones: Asignacion[]
  personas: Persona[]
  proyectos: Proyecto[]
  departamentos: Departamento[]
  catalogoServicios: CatalogoServicio[]
  empresas: Empresa[]
  cuotasPlanificacion: CuotaPlanificacion[]
  personasDepartamentos: PersonaDepartamento[]
  horasTrabajables: HorasTrabajables[]
  initialMonth?: string
}

// Service pill colors — centralizado en components/servicio-pill.tsx

const deptColors: Record<string, string> = {
  'Paid Media': 'bg-blue-100 text-blue-700',
  'SEO GEO': 'bg-emerald-100 text-emerald-700',
  'Growth': 'bg-lime-100 text-lime-700',
  'Automation': 'bg-violet-100 text-violet-700',
  'Comunicación': 'bg-amber-100 text-amber-700',
  'Consultoría Accounts': 'bg-orange-100 text-orange-700',
  'Diseño': 'bg-purple-100 text-purple-700',
  'Desarrollo': 'bg-indigo-100 text-indigo-700',
  'Programática': 'bg-sky-100 text-sky-700',
  'Creativo': 'bg-fuchsia-100 text-fuchsia-700',
  'Producción Audiovisual': 'bg-rose-100 text-rose-700',
  'Consultoría IA': 'bg-cyan-100 text-cyan-700',
  'Dirección': 'bg-slate-100 text-slate-700',
  'UXUI': 'bg-teal-100 text-teal-700',
  'Trading': 'bg-yellow-100 text-yellow-700',
  'Administración': 'bg-stone-100 text-stone-700',
  'Talento': 'bg-pink-100 text-pink-700',
  'Outbound': 'bg-red-100 text-red-700',
  'Mentoring': 'bg-emerald-100 text-emerald-700',
  'Selección Personal': 'bg-pink-100 text-pink-700',
  'Formación': 'bg-amber-100 text-amber-700',
}

function DeptPill({ name }: { name: string }) {
  const color = deptColors[name] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {name}
    </span>
  )
}

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
}

// ── Resolver horas trabajables (misma lógica que el server, replicada en cliente) ──
function resolverHorasTrabajables(
  personaId: string,
  mes: string,
  personasMap: Map<string, Persona>,
  persDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[]
): number {
  const persona = personasMap.get(personaId)
  if (!persona) return 0

  // 1. Override por persona
  const overridePersona = horasTrab.find(
    (h) => h.persona_id === personaId && h.mes_trabajo === mes
  )
  if (overridePersona) return overridePersona.horas

  // 2. Override por departamento principal
  const depts = persDepts
    .filter((pd) => pd.persona_id === personaId)
    .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
  if (depts.length > 0) {
    const deptPrincipalId = depts[0].departamento_id
    const overrideDepto = horasTrab.find(
      (h) => h.departamento_id === deptPrincipalId && !h.persona_id && h.mes_trabajo === mes
    )
    if (overrideDepto) return overrideDepto.horas
  }

  // 3. General de la empresa
  const general = horasTrab.find(
    (h) => h.empresa_grupo_id === persona.empresa_grupo_id && !h.departamento_id && !h.persona_id && h.mes_trabajo === mes
  )
  return general?.horas ?? 0
}

export function PlanificadorClient({
  ordenesTrabajo,
  asignaciones: allAsignaciones,
  personas,
  proyectos,
  departamentos,
  catalogoServicios,
  empresas,
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
  const personasMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])
  const cuotasMap = useMemo(() => new Map(cuotasPlanificacion.map((c) => [c.id, c])), [cuotasPlanificacion])

  // ── Month ── (initialMonth viene de ?mes= en la URL, sino el mes actual)
  const defaultMonth = useMemo(() => {
    if (initialMonth) return initialMonth
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
  }, [initialMonth])
  const [month, setMonth] = useState(defaultMonth)

  // ── Filters ──
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('Todos')
  const [deptoFilter, setDeptoFilter] = useState('Todos')
  const [servicioFilter, setServicioFilter] = useState('Todos')
  const [tipoPartidaFilter, setTipoPartidaFilter] = useState('Todos')

  // ── Expanded cards ──
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set())

  // ── Local edits ──
  const [asignacionEdits, setAsignacionEdits] = useState<Record<string, AsignacionLocal[]>>({})
  const [ordenEdits, setOrdenEdits] = useState<Record<string, OrdenLocal>>({})

  // ── Save state ──
  const [savingIds, setSavingIds] = useState<Set<string>>(new Set())
  const [saveErrors, setSaveErrors] = useState<Record<string, string>>({})

  const filterOptions = useMemo(() => {
    const estados = ['Todos', ...new Set(ordenesTrabajo.map((o) => o.estado))]
    const deptos = ['Todos', ...new Set(departamentos.map((d) => d.nombre))]
    const servicios = ['Todos', ...new Set(catalogoServicios.map((s) => s.nombre))]
    const tiposPartida = ['Todos', 'Puntual', 'Recurrente']
    return { estados, deptos, servicios, tiposPartida }
  }, [ordenesTrabajo, departamentos, catalogoServicios])

  // ── Filtered ordenes ──
  const filtered = useMemo(() => {
    return ordenesTrabajo.filter((ot) => {
      if (ot.mes_anio !== month) return false

      const proyecto = proyectosMap.get(ot.proyecto_id)
      const servicio = ot.servicio_id ? serviciosMap.get(ot.servicio_id) : undefined
      const depto = deptosMap.get(ot.departamento_id)
      const empresa = proyecto?.empresa_id ? empresasMap.get(proyecto.empresa_id) : undefined
      const clienteNombre = empresa?.nombre_interno ?? empresa?.nombre_legal ?? ''

      if (estadoFilter !== 'Todos' && ot.estado !== estadoFilter) return false
      if (deptoFilter !== 'Todos' && depto?.nombre !== deptoFilter) return false
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
  }, [month, estadoFilter, deptoFilter, servicioFilter, tipoPartidaFilter, search, ordenesTrabajo, proyectosMap, serviciosMap, deptosMap, empresasMap])

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
  }

  function updateAsignacion(ordenId: string, asigId: string, field: keyof AsignacionLocal, value: string | number) {
    const current = getAsignacionesLocal(ordenId)
    const updated = current.map((a) =>
      a.id === asigId ? { ...a, [field]: value } : a
    )
    setAsignacionEdits((prev) => ({ ...prev, [ordenId]: updated }))
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

  function updateOrdenPpto(ordenId: string, pct: number) {
    setOrdenEdits((prev) => ({ ...prev, [ordenId]: { id: ordenId, porcentaje_ppto_mes: pct } }))
  }

  async function handleGuardar(ot: OrdenTrabajo) {
    const asigs = getAsignacionesLocal(ot.id)
    const originalIds = allAsignaciones
      .filter((a) => a.orden_trabajo_id === ot.id && !a.deleted_at)
      .map((a) => a.id)

    setSavingIds((prev) => new Set(prev).add(ot.id))
    setSaveErrors((prev) => { const n = { ...prev }; delete n[ot.id]; return n })

    const result = await guardarAsignacionesOT(ot.id, asigs, originalIds)

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
        <MonthNavigator value={month} onChange={setMonth} />
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Total previsto" value={formatMoney(kpis.totalPrevisto)} borderColor="border-t-primary" />
        <KpiCard label="Total real" value={formatMoney(kpis.totalReal)} borderColor="border-t-blue-500" />
        <KpiCard label="Personas asignadas" value={kpis.personasAsignadas} borderColor="border-t-purple-500" />
        <KpiCard label="% Ocupación medio" value={`${kpis.pctOcupacion}%`} borderColor="border-t-amber-500" />
      </div>

      {/* Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchBar placeholder="Buscar proyecto, cliente, servicio..." value={search} onChange={setSearch} />
        </div>
        <FilterSelect label="Estado" value={estadoFilter} options={filterOptions.estados} onChange={setEstadoFilter} />
        <FilterSelect label="Departamento" value={deptoFilter} options={filterOptions.deptos} onChange={setDeptoFilter} />
        <FilterSelect label="Servicio" value={servicioFilter} options={filterOptions.servicios} onChange={setServicioFilter} />
        <FilterSelect label="Tipo partida" value={tipoPartidaFilter} options={filterOptions.tiposPartida} onChange={setTipoPartidaFilter} />
      </div>

      {/* Orders list */}
      <div className="mt-5 space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl bg-white p-8 shadow-sm text-center">
            <p className="text-sm text-muted-foreground">No hay órdenes de trabajo para este mes con esos filtros.</p>
          </div>
        ) : (
          filtered.map((ot) => {
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
              <div key={ot.id} className="rounded-xl bg-white shadow-sm overflow-hidden">
                {/* ── Header ── */}
                <button
                  onClick={() => toggleExpand(ot.id)}
                  className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors"
                >
                  {expanded ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  )}

                  <span
                    className="text-sm font-bold text-foreground flex-1 min-w-0 truncate hover:text-primary hover:underline transition-colors"
                    onClick={(e) => { e.stopPropagation(); router.push(`/proyectos/${ot.proyecto_id}`) }}
                  >
                    {proyecto?.titulo ?? '—'}
                  </span>

                  <StatusBadge status={ot.estado} />
                  {hasLocalEdits(ot.id) && (
                    <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Cambios sin guardar" />
                  )}

                  {servicio && <ServicioPill name={servicio.nombre} />}
                  {depto && <DeptPill name={depto.nombre} />}

                  <span className="text-xs text-muted-foreground shrink-0">{clienteNombre}</span>

                  {/* Editable % ppto mes */}
                  <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="number"
                      min={0}
                      max={100}
                      value={pptoPct}
                      onChange={(e) => updateOrdenPpto(ot.id, clamp(Number(e.target.value), 0, 100))}
                      className="w-14 rounded border border-border px-1.5 py-0.5 text-xs text-right font-medium text-foreground outline-none focus:border-primary"
                    />
                    <span className="text-[10px] text-muted-foreground">% ppto</span>
                  </span>

                  <span className="text-sm font-semibold text-primary shrink-0 w-24 text-right">
                    {formatMoney(ot.partida_prevista)}
                  </span>

                  <span className={`text-xs font-bold shrink-0 tabular-nums w-16 text-right ${pctColor}`}>
                    {totalPctAsig}% tm
                  </span>

                  <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
                    {proyecto?.tipo_partida ?? '—'}
                  </span>
                </button>

                {/* ── Expanded: Asignaciones ── */}
                {expanded && (
                  <div className="border-t border-border/50 px-5 pb-4 pt-3">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                        Asignaciones
                      </p>
                      <div className="flex items-center gap-3">
                        <span className={`text-xs font-bold ${pctColor}`}>
                          Suma %: {totalPctAsig}%
                        </span>
                        {totalPctAsig !== 100 && (
                          <span className="text-[10px] text-muted-foreground">
                            (debe sumar 100%)
                          </span>
                        )}
                      </div>
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
                          const ingresosAsignados = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
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

                              {/* Cuota selector */}
                              <select
                                value={a.cuota_planificacion_id}
                                onChange={(e) => updateAsignacion(ot.id, a.id, 'cuota_planificacion_id', e.target.value)}
                                className="rounded border border-border bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                              >
                                {cuotasVigentes.map((c) => (
                                  <option key={c.id} value={c.id}>
                                    {c.nombre} ({c.precio_hora}€/h)
                                  </option>
                                ))}
                              </select>

                              {/* % asignación */}
                              <input
                                type="number"
                                min={0}
                                max={100}
                                value={a.porcentaje_ppto_tm}
                                onChange={(e) => updateAsignacion(ot.id, a.id, 'porcentaje_ppto_tm', clamp(Number(e.target.value), 0, 100))}
                                className="w-full rounded border border-border px-2 py-1 text-xs text-right font-medium outline-none focus:border-primary"
                              />

                              {/* Ingresos asignados (read-only) */}
                              <span className="text-xs font-medium text-primary text-right">
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
                      className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Añadir persona
                    </button>

                    {/* Save / error */}
                    {hasLocalEdits(ot.id) && (
                      <div className="mt-3 flex items-center gap-3">
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
                        {saveErrors[ot.id] && (
                          <p className="text-xs text-destructive">{saveErrors[ot.id]}</p>
                        )}
                      </div>
                    )}

                    {/* Total row */}
                    {asignaciones.length > 0 && (
                      <div className="mt-3 border-t border-border pt-2 grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 px-2">
                        <span className="text-[10px] font-bold uppercase text-muted-foreground">TOTAL</span>
                        <span />
                        <span className={`text-xs font-bold text-right ${pctColor}`}>{totalPctAsig}%</span>
                        <span className="text-xs font-bold text-primary text-right">
                          {formatMoney(asignaciones.reduce((sum, a) => sum + ot.partida_prevista * (a.porcentaje_ppto_tm / 100), 0))}
                        </span>
                        <span className="text-xs font-bold text-right">
                          {Math.round(
                            asignaciones.reduce((sum, a) => {
                              const cuota = cuotasMap.get(a.cuota_planificacion_id)
                              const ing = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
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

// ── Filter dropdown component ──
function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: string
  options: string[]
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt} value={opt}>
          {opt === 'Todos' ? `${label}: Todos` : opt}
        </option>
      ))}
    </select>
  )
}
