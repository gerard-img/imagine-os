'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { SortControl } from '@/components/sortable-header'
import type {
  Persona,
  PersonaDepartamento,
  Departamento,
  Division,
  Rol,
  EmpresaGrupo,
  Puesto,
  RangoInterno,
  Ciudad,
  Oficina,
  Asignacion,
  OrdenTrabajo,
  Empresa,
  Proyecto,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { StatusBadge } from '@/components/status-badge'
import { PersonaFormSheet } from './persona-form-sheet'
import { archivarPersona, restaurarPersona, eliminarPersona } from './actions'
import { Archive, ArchiveRestore, Trash2, Loader2 } from 'lucide-react'

interface PersonasClientProps {
  personas: Persona[]
  personasDepartamentos: PersonaDepartamento[]
  departamentos: Departamento[]
  divisiones: Division[]
  roles: Rol[]
  empresasGrupo: EmpresaGrupo[]
  puestos: Puesto[]
  rangos: RangoInterno[]
  ciudades: Ciudad[]
  oficinas: Oficina[]
  asignaciones: Asignacion[]
  ordenesTrabajo: OrdenTrabajo[]
  empresas: Empresa[]
  proyectos: Proyecto[]
  cuotasPlanificacion: CuotaPlanificacion[]
}

// Color map for department pills
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
  'Consultoría IA': 'bg-cyan-100 text-cyan-700',
  'Dirección': 'bg-slate-100 text-slate-700',
  'UXUI': 'bg-teal-100 text-teal-700',
}

function DeptPill({ name }: { name: string }) {
  const color = deptColors[name] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {name}
    </span>
  )
}

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
  const isActive = value !== 'Todos'
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition-colors cursor-pointer ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
      }`}
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-white text-foreground">
          {opt === 'Todos' ? `${label}: Todos` : opt}
        </option>
      ))}
    </select>
  )
}

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'horas', label: 'Horas' },
]

export default function PersonasClient(props: PersonasClientProps) {
  return (
    <Suspense>
      <PersonasContent {...props} />
    </Suspense>
  )
}

function PersonasContent({
  personas,
  personasDepartamentos,
  departamentos,
  divisiones,
  roles,
  empresasGrupo,
  puestos,
  rangos,
  ciudades,
  oficinas,
  asignaciones,
  ordenesTrabajo,
  empresas,
  proyectos,
  cuotasPlanificacion,
}: PersonasClientProps) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'nombre', dir: 'asc' },
  })
  const rolFilter = getParam('rol', 'Todos')!
  const divisionFilter = getParam('division', 'Todos')!
  const empresaFilter = getParam('empresa', 'Todos')!
  const vistaFilter = (getParam('vista', 'activos') as 'activos' | 'archivados')
  const [search, setSearch] = useState('')
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Build lookup maps for efficient access
  const deptsMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const rolesMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])
  const divisionesMap = useMemo(() => new Map(divisiones.map((d) => [d.id, d])), [divisiones])
  const empresasGrupoMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])
  const puestosMap = useMemo(() => new Map(puestos.map((p) => [p.id, p])), [puestos])
  const empresasMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const proyectosMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const cuotasMap = useMemo(() => new Map(cuotasPlanificacion.map((c) => [c.id, c])), [cuotasPlanificacion])
  const otMap = useMemo(() => new Map(ordenesTrabajo.map((ot) => [ot.id, ot])), [ordenesTrabajo])

  /** Get departamentos for a persona (N:M with %) */
  const getDepartamentosPersona = useMemo(() => {
    // Pre-group by persona_id
    const grouped = new Map<string, Array<{ departamento: Departamento; porcentaje_tiempo: number }>>()
    for (const pd of personasDepartamentos) {
      const dept = deptsMap.get(pd.departamento_id)
      if (!dept) continue
      const arr = grouped.get(pd.persona_id) ?? []
      arr.push({ departamento: dept, porcentaje_tiempo: pd.porcentaje_tiempo })
      grouped.set(pd.persona_id, arr)
    }
    return (personaId: string) => grouped.get(personaId) ?? []
  }, [personasDepartamentos, deptsMap])

  /** Derive unique client names assigned to a persona via asignaciones -> ordenes -> proyectos -> empresas */
  const getClientesAsignados = useMemo(() => {
    // Pre-group asignaciones by persona_id
    const asigByPersona = new Map<string, Asignacion[]>()
    for (const a of asignaciones) {
      const arr = asigByPersona.get(a.persona_id) ?? []
      arr.push(a)
      asigByPersona.set(a.persona_id, arr)
    }
    return (personaId: string): string[] => {
      const personaAsig = asigByPersona.get(personaId) ?? []
      const ordenIds = personaAsig.map((a) => a.orden_trabajo_id)
      const proyectoIds = ordenIds
        .map((oid) => otMap.get(oid)?.proyecto_id)
        .filter(Boolean) as string[]
      const clienteNames = [...new Set(proyectoIds)]
        .map((pid) => {
          const proyecto = proyectosMap.get(pid)
          if (!proyecto?.empresa_id) return null
          const empresa = empresasMap.get(proyecto.empresa_id)
          return empresa?.nombre_interno ?? empresa?.nombre_legal ?? null
        })
        .filter(Boolean) as string[]
      return [...new Set(clienteNames)]
    }
  }, [asignaciones, otMap, proyectosMap, empresasMap])

  /** Calculate total assigned hours for a persona */
  const getHorasTotales = useMemo(() => {
    const asigByPersona = new Map<string, Asignacion[]>()
    for (const a of asignaciones) {
      const arr = asigByPersona.get(a.persona_id) ?? []
      arr.push(a)
      asigByPersona.set(a.persona_id, arr)
    }
    return (personaId: string): number => {
      const personaAsig = asigByPersona.get(personaId) ?? []
      return personaAsig.reduce((sum, a) => {
        const orden = otMap.get(a.orden_trabajo_id)
        const cuota = cuotasMap.get(a.cuota_planificacion_id)
        if (!orden || !cuota || cuota.precio_hora === 0) return sum
        const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
        return sum + ingresos / cuota.precio_hora
      }, 0)
    }
  }, [asignaciones, otMap, cuotasMap])

  const rolOptions = useMemo(() => ['Todos', ...roles.map((r) => r.nombre)], [roles])
  const divisionOptions = useMemo(() => ['Todos', ...divisiones.map((d) => d.nombre)], [divisiones])
  const empresaOptions = useMemo(() => ['Todos', ...empresasGrupo.map((e) => e.codigo)], [empresasGrupo])

  const filtered = personas.filter((p) => {
    // Filtro activos/archivados
    if (vistaFilter === 'activos' && !p.activo) return false
    if (vistaFilter === 'archivados' && p.activo) return false

    const q = search.toLowerCase()
    const matchesSearch =
      !search ||
      p.persona.toLowerCase().includes(q) ||
      p.nombre.toLowerCase().includes(q) ||
      p.apellido_primero.toLowerCase().includes(q)
    const matchesRol = rolFilter === 'Todos' || rolesMap.get(p.rol_id)?.nombre === rolFilter
    const matchesDivision = divisionFilter === 'Todos' || divisionesMap.get(p.division_id)?.nombre === divisionFilter
    const matchesEmpresa = empresaFilter === 'Todos' || empresasGrupoMap.get(p.empresa_grupo_id)?.codigo === empresaFilter
    return matchesSearch && matchesRol && matchesDivision && matchesEmpresa
  })

  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    nombre: (p) => p.persona.toLowerCase(),
    empresa: (p) => empresasGrupoMap.get(p.empresa_grupo_id)?.codigo ?? '',
    horas: (p) => getHorasTotales(p.id),
  }), [filtered, sortCol, sortDir, empresasGrupoMap, getHorasTotales])

  async function handleArchivar(id: string) {
    setActionLoading(id)
    setActionError(null)
    const result = await archivarPersona(id)
    if (!result.success) setActionError(result.error ?? 'Error al archivar')
    setActionLoading(null)
  }

  async function handleRestaurar(id: string) {
    setActionLoading(id)
    setActionError(null)
    const result = await restaurarPersona(id)
    if (!result.success) setActionError(result.error ?? 'Error al restaurar')
    setActionLoading(null)
  }

  async function handleEliminar(id: string) {
    if (confirmDeleteId !== id) { setConfirmDeleteId(id); return }
    setActionLoading(id)
    setActionError(null)
    setConfirmDeleteId(null)
    const result = await eliminarPersona(id)
    if (!result.success) setActionError(result.error ?? 'Error al eliminar')
    setActionLoading(null)
  }

  const activos = personas.filter((p) => p.activo).length
  const archivados = personas.filter((p) => !p.activo).length
  const clientesVinculados = new Set(
    asignaciones
      .map((a) => {
        const ot = otMap.get(a.orden_trabajo_id)
        const proy = ot ? proyectosMap.get(ot.proyecto_id) : null
        return proy?.empresa_id
      })
      .filter(Boolean)
  ).size
  const horasTotales = personas
    .filter((p) => p.activo)
    .reduce((sum, p) => sum + getHorasTotales(p.id), 0)

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Personas</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">Personas del equipo</p>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Miembros activos" value={activos} borderColor="border-t-emerald-500" />
        <KpiCard label="Clientes vinculados" value={clientesVinculados} borderColor="border-t-blue-500" />
        <KpiCard label="Horas totales" value={`${Math.round(horasTotales)}h`} borderColor="border-t-primary" />
      </div>

      {/* Vista toggle */}
      <div className="mt-5 flex items-center gap-2">
        <button
          onClick={() => setParams({ vista: null })}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            vistaFilter === 'activos'
              ? 'bg-primary text-primary-foreground'
              : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
          }`}
        >
          Activos ({activos})
        </button>
        <button
          onClick={() => setParams({ vista: 'archivados' })}
          className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-colors ${
            vistaFilter === 'archivados'
              ? 'bg-primary text-primary-foreground'
              : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
          }`}
        >
          Archivados ({archivados})
        </button>
      </div>

      {/* Error global */}
      {actionError && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Search + Filters + Action */}
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <SearchBar placeholder="Buscar miembro..." value={search} onChange={setSearch} />
        </div>
        <FilterSelect label="Rol" value={rolFilter} options={rolOptions} onChange={(v) => setParams({ rol: v === 'Todos' ? null : v })} />
        <FilterSelect label="División" value={divisionFilter} options={divisionOptions} onChange={(v) => setParams({ division: v === 'Todos' ? null : v })} />
        <FilterSelect label="Empresa" value={empresaFilter} options={empresaOptions} onChange={(v) => setParams({ empresa: v === 'Todos' ? null : v })} />
        <div className="ml-auto flex items-center gap-3">
          <SortControl options={SORT_OPTIONS} currentCol={sortCol} currentDir={sortDir} onSort={toggleSort} />
          <PersonaFormSheet
            empresasGrupo={empresasGrupo}
            roles={roles}
            divisiones={divisiones}
            puestos={puestos}
            rangos={rangos}
            ciudades={ciudades}
            oficinas={oficinas}
          />
        </div>
      </div>

      {/* Person cards */}
      <div className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">No se encontraron miembros.</p>
          </div>
        )}
        {sorted.map((p) => {
          const depts = getDepartamentosPersona(p.id)
          const puesto = p.puesto_id ? puestosMap.get(p.puesto_id) : undefined
          const clientes = getClientesAsignados(p.id)
          const horas = getHorasTotales(p.id)
          const isLoading = actionLoading === p.id

          return (
            <div
              key={p.id}
              className="flex items-start justify-between rounded-xl bg-white px-5 py-4 shadow-sm border border-transparent hover:border-primary/20 transition-colors"
            >
              <Link href={`/personas/${p.id}`} className="flex-1 min-w-0 cursor-pointer">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground">{p.persona}</p>
                    {depts.map((d) => (
                      <span key={d.departamento.id} className="flex items-center gap-0.5">
                        <DeptPill name={d.departamento.nombre} />
                        {d.porcentaje_tiempo < 100 && (
                          <span className="text-[10px] text-muted-foreground">{d.porcentaje_tiempo}%</span>
                        )}
                      </span>
                    ))}
                    {puesto && (
                      <span className="text-xs text-muted-foreground">{puesto.nombre}</span>
                    )}
                  </div>
                  {clientes.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {clientes.map((c) => (
                        <span
                          key={c}
                          className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700"
                        >
                          {c.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              <div className="flex items-center gap-2 shrink-0 ml-3">
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={p.activo ? 'Activo' : 'Inactivo'} />
                  {horas > 0 && (
                    <span className="text-xs font-semibold text-muted-foreground">{Math.round(horas)}h</span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  ) : p.activo ? (
                    <>
                      <button
                        onClick={() => handleArchivar(p.id)}
                        className="rounded p-1.5 text-muted-foreground hover:text-amber-600 hover:bg-amber-50 transition-colors"
                        title="Archivar persona"
                      >
                        <Archive className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id)}
                        className={`rounded p-1.5 transition-colors ${
                          confirmDeleteId === p.id
                            ? 'text-red-700 bg-red-100'
                            : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={confirmDeleteId === p.id ? 'Clic de nuevo para confirmar' : 'Eliminar persona'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => handleRestaurar(p.id)}
                        className="rounded p-1.5 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                        title="Restaurar persona"
                      >
                        <ArchiveRestore className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleEliminar(p.id)}
                        className={`rounded p-1.5 transition-colors ${
                          confirmDeleteId === p.id
                            ? 'text-red-700 bg-red-100'
                            : 'text-muted-foreground hover:text-red-600 hover:bg-red-50'
                        }`}
                        title={confirmDeleteId === p.id ? 'Clic de nuevo para confirmar' : 'Eliminar persona'}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
