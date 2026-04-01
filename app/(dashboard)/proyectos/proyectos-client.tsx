'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type { Proyecto, Empresa, EmpresaGrupo, Departamento, ProyectoDepartamento, Persona } from '@/lib/supabase/types'
import { formatMoney, formatDate } from '@/lib/helpers'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { FilterPills } from '@/components/filter-pills'
import { StatusBadge } from '@/components/status-badge'
import { ProyectoFormSheet } from './proyecto-form-sheet'
import { ProyectoOtAction } from './proyecto-ot-action'
import type { CatalogoServicio } from '@/lib/supabase/types'
import { LayoutList, LayoutGrid } from 'lucide-react'

const ESTADO_OPTIONS = ['Todos', 'Activo', 'Propuesta', 'Confirmado', 'Pausado', 'Finalizado', 'Cancelado']
const KANBAN_COLUMNS = ['Propuesta', 'Confirmado', 'Activo', 'Pausado', 'Finalizado', 'Cancelado']

type Props = {
  proyectos: Proyecto[]
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
  departamentos: Departamento[]
  proyectosDepartamentos: ProyectoDepartamento[]
  personas: Persona[]
  servicios: CatalogoServicio[]
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
}: Props) {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('Todos')
  const [view, setView] = useState<'list' | 'kanban'>('list')

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const empresaGrupoMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])
  const departamentoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])

  function getDepartamentosProyecto(proyectoId: string) {
    return proyectosDepartamentos
      .filter((pd) => pd.proyecto_id === proyectoId)
      .map((pd) => departamentoMap.get(pd.departamento_id))
      .filter(Boolean)
  }

  function getDepartamentoIdsProyecto(proyectoId: string) {
    return proyectosDepartamentos
      .filter((pd) => pd.proyecto_id === proyectoId)
      .map((pd) => pd.departamento_id)
  }

  const getClienteNombre = (p: Proyecto) => {
    const empresa = p.empresa_id ? empresaMap.get(p.empresa_id) : null
    return empresa ? (empresa.nombre_interno ?? empresa.nombre_legal ?? '—') : 'Interno'
  }

  const filtered = useMemo(() => proyectos.filter((p) => {
    const clienteNombre = getClienteNombre(p)
    const matchesSearch =
      search === '' ||
      p.titulo.toLowerCase().includes(search.toLowerCase()) ||
      clienteNombre.toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'Todos' || p.estado === filter
    return matchesSearch && matchesFilter
  }), [proyectos, search, filter, empresaMap])

  const activos = proyectos.filter((p) => p.estado === 'Activo').length
  const propuestas = proyectos.filter((p) => p.estado === 'Propuesta').length
  const pptoTotal = proyectos
    .filter((p) => p.estado === 'Activo')
    .reduce((sum, p) => sum + p.ppto_estimado, 0)

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
            <p className={`font-bold text-foreground truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {cliente} — {p.titulo}
            </p>
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
            <span className={`font-bold text-primary ${compact ? 'text-xs' : 'text-sm'}`}>
              {formatMoney(p.ppto_estimado)}
            </span>
            {!compact && <StatusBadge status={p.estado} />}
          </div>
        </div>

        {/* Departamentos */}
        {depts.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {depts.map((d) => (
              <span
                key={d!.id}
                className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600"
              >
                {d!.nombre}
              </span>
            ))}
          </div>
        )}

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

      {/* Search + Filters + Action */}
      <div className="mt-5 flex items-center gap-3">
        <SearchBar placeholder="Buscar proyecto o cliente..." value={search} onChange={setSearch} />
        {view === 'list' && (
          <FilterPills options={ESTADO_OPTIONS} active={filter} onChange={setFilter} />
        )}
        <ProyectoFormSheet
          empresas={empresas}
          empresasGrupo={empresasGrupo}
          personas={personas}
          departamentos={departamentos}
        />
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
              const colProyectos = proyectos.filter((p) => {
                const cliente = getClienteNombre(p)
                const matchesSearch =
                  search === '' ||
                  p.titulo.toLowerCase().includes(search.toLowerCase()) ||
                  cliente.toLowerCase().includes(search.toLowerCase())
                return p.estado === estado && matchesSearch
              })

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
