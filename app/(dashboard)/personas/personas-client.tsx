'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import type {
  Persona,
  PersonaDepartamento,
  Departamento,
  Division,
  Rol,
  EmpresaGrupo,
  Puesto,
  Asignacion,
  OrdenTrabajo,
  Empresa,
  Proyecto,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { StatusBadge } from '@/components/status-badge'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface PersonasClientProps {
  personas: Persona[]
  personasDepartamentos: PersonaDepartamento[]
  departamentos: Departamento[]
  divisiones: Division[]
  roles: Rol[]
  empresasGrupo: EmpresaGrupo[]
  puestos: Puesto[]
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

export default function PersonasClient({
  personas,
  personasDepartamentos,
  departamentos,
  divisiones,
  roles,
  empresasGrupo,
  puestos,
  asignaciones,
  ordenesTrabajo,
  empresas,
  proyectos,
  cuotasPlanificacion,
}: PersonasClientProps) {
  const [search, setSearch] = useState('')
  const [rolFilter, setRolFilter] = useState('Todos')
  const [divisionFilter, setDivisionFilter] = useState('Todos')
  const [empresaFilter, setEmpresaFilter] = useState('Todos')

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

  const activos = personas.filter((p) => p.activo).length
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

      {/* Search + Filters + Action */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <SearchBar placeholder="Buscar miembro..." value={search} onChange={setSearch} />
        </div>
        <FilterSelect label="Rol" value={rolFilter} options={rolOptions} onChange={setRolFilter} />
        <FilterSelect label="División" value={divisionFilter} options={divisionOptions} onChange={setDivisionFilter} />
        <FilterSelect label="Empresa" value={empresaFilter} options={empresaOptions} onChange={setEmpresaFilter} />
        <Button size="default" className="gap-1.5 shrink-0 ml-auto">
          <Plus className="h-4 w-4" />
          Nuevo Miembro
        </Button>
      </div>

      {/* Person cards */}
      <div className="mt-4 space-y-2">
        {filtered.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">No se encontraron miembros.</p>
          </div>
        )}
        {filtered.map((p) => {
          const depts = getDepartamentosPersona(p.id)
          const puesto = puestosMap.get(p.puesto_id)
          const clientes = getClientesAsignados(p.id)
          const horas = getHorasTotales(p.id)

          return (
            <Link
              href={`/personas/${p.id}`}
              key={p.id}
              className="flex items-start justify-between rounded-xl bg-white px-5 py-4 shadow-sm border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
            >
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
              <div className="flex flex-col items-end gap-1">
                <StatusBadge status={p.activo ? 'Activo' : 'Inactivo'} />
                {horas > 0 && (
                  <span className="text-xs font-semibold text-muted-foreground">{Math.round(horas)}h</span>
                )}
              </div>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
