'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/kpi-card'
import { StatusBadge, UrgenciaIndicador } from '@/components/status-badge'
import { getUrgenciaPlanificado } from '@/lib/helpers'
import { AvanzarEstadoButton } from '../../ordenes-trabajo/avanzar-estado-button'
import { MonthNavigator } from '@/components/month-navigator'
import { formatMoney, formatDate } from '@/lib/helpers'
import { ProyectoOtAction } from '../proyecto-ot-action'
import { ProyectoFormSheet } from '../proyecto-form-sheet'
import type {
  Proyecto,
  ProyectoDepartamento,
  OrdenTrabajo,
  OrdenTrabajoPersona,
  Asignacion,
  CatalogoServicio,
  CuotaPlanificacion,
  Persona,
  Departamento,
  Empresa,
  EmpresaGrupo,
} from '@/lib/supabase/types'

const SERVICIO_COLORS: Record<string, string> = {
  SEO: 'bg-emerald-100 text-emerald-700',
  SEM: 'bg-blue-100 text-blue-700',
  'Diseño Web': 'bg-purple-100 text-purple-700',
  Contenidos: 'bg-amber-100 text-amber-700',
  'Social Media': 'bg-pink-100 text-pink-700',
  Analítica: 'bg-indigo-100 text-indigo-700',
  Estrategia: 'bg-orange-100 text-orange-700',
}

type Props = {
  proyecto: Proyecto
  proyectos: Proyecto[]
  proyDepts: ProyectoDepartamento[]
  ordenes: OrdenTrabajo[]
  ordenesPersonas: OrdenTrabajoPersona[]
  asignaciones: Asignacion[]
  servicios: CatalogoServicio[]
  cuotas: CuotaPlanificacion[]
  personas: Persona[]
  departamentos: Departamento[]
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
}

export function ProyectoDetalleClient({
  proyecto, proyectos, proyDepts, ordenes, ordenesPersonas,
  asignaciones, servicios, cuotas, personas,
  departamentos, empresas, empresasGrupo,
}: Props) {
  const router = useRouter()

  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const departamentoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const empresaGrupoMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])
  const cuotaMap = useMemo(() => new Map(cuotas.map((c) => [c.id, c])), [cuotas])

  const empresa = proyecto.empresa_id ? empresaMap.get(proyecto.empresa_id) : null
  const empresaGrupo = empresaGrupoMap.get(proyecto.empresa_grupo_id)
  const clienteNombre = empresa
    ? (empresa.nombre_interno ?? empresa.nombre_legal)
    : 'Interno'

  // Months with OTs (for navigator)
  const availableMonths = useMemo(() => {
    const months = [...new Set(ordenes.map((o) => o.mes_anio))].sort()
    return months.length > 0 ? months : ['2026-01-01']
  }, [ordenes])

  const [mes, setMes] = useState(availableMonths[availableMonths.length - 1])

  const deptosProyecto = useMemo(() =>
    proyDepts.map((pd) => departamentoMap.get(pd.departamento_id)).filter(Boolean),
    [proyDepts, departamentoMap]
  )

  // KPIs — totales del proyecto completo
  const totalPrevisto = ordenes.reduce((sum, o) => sum + o.partida_prevista, 0)
  const totalReal = ordenes.reduce((sum, o) => sum + (o.partida_real ?? 0), 0)

  // OTs del mes seleccionado, agrupadas por departamento
  const ordenesMes = useMemo(
    () => ordenes.filter((o) => o.mes_anio === mes),
    [ordenes, mes]
  )

  const ordenesPorDepto = useMemo(() => {
    const groups = new Map<string, OrdenTrabajo[]>()
    for (const o of ordenesMes) {
      const existing = groups.get(o.departamento_id) ?? []
      existing.push(o)
      groups.set(o.departamento_id, existing)
    }
    return groups
  }, [ordenesMes])

  // Equipo global del proyecto
  const equipoProyecto = useMemo(() => {
    const ordenIds = new Set(ordenes.map((o) => o.id))
    const personaIds = new Set(
      ordenesPersonas
        .filter((op) => ordenIds.has(op.orden_trabajo_id))
        .map((op) => op.persona_id)
    )
    asignaciones
      .filter((a) => ordenIds.has(a.orden_trabajo_id))
      .forEach((a) => personaIds.add(a.persona_id))
    return [...personaIds]
      .map((pid) => personaMap.get(pid))
      .filter(Boolean) as Persona[]
  }, [ordenes, ordenesPersonas, asignaciones, personaMap])

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="mb-3 flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link href="/proyectos" className="hover:text-foreground transition-colors">
          Proyectos
        </Link>
        <ChevronRight className="h-3.5 w-3.5 shrink-0" />
        {clienteNombre !== 'Interno' && (
          <>
            <span>{clienteNombre}</span>
            <ChevronRight className="h-3.5 w-3.5 shrink-0" />
          </>
        )}
        <span className="font-medium text-foreground truncate max-w-[300px]">{proyecto.titulo}</span>
      </nav>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {clienteNombre} — {proyecto.titulo}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <ProyectoFormSheet
            empresas={empresas}
            empresasGrupo={empresasGrupo}
            personas={personas}
            departamentos={departamentos}
            proyecto={proyecto}
            proyectoDepartamentoIds={proyDepts.map((pd) => pd.departamento_id)}
          />
          <ProyectoOtAction
            proyecto={proyecto}
            proyectos={proyectos}
            servicios={servicios}
            departamentos={departamentos}
            personas={personas}
            empresas={empresas}
            currentMonth={mes}
          />
          <StatusBadge status={proyecto.estado} />
        </div>
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Órdenes de trabajo" value={ordenes.length} borderColor="border-t-blue-500" />
        <KpiCard label="Ppto. estimado" value={formatMoney(proyecto.ppto_estimado)} borderColor="border-t-primary" />
        <KpiCard label="Previsto OTs" value={formatMoney(totalPrevisto)} borderColor="border-t-purple-500" />
        <KpiCard label="Real OTs" value={formatMoney(totalReal)} borderColor="border-t-amber-500" />
      </div>

      {/* Info cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Datos del proyecto */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Datos del proyecto
          </p>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Cliente</dt>
              <dd className="font-semibold text-right">{clienteNombre}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Empresa grupo</dt>
              <dd className="font-semibold">{empresaGrupo?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-semibold">{proyecto.tipo_proyecto}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Partida</dt>
              <dd className="font-semibold">{proyecto.tipo_partida}</dd>
            </div>
            {proyecto.tipo_facturacion && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Facturación</dt>
                <dd className="font-semibold">{proyecto.tipo_facturacion}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ppto. estimado</dt>
              <dd className="font-bold text-primary">{formatMoney(proyecto.ppto_estimado)}</dd>
            </div>
            {proyecto.fecha_activacion && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Activación</dt>
                <dd className="font-semibold">{formatDate(proyecto.fecha_activacion)}</dd>
              </div>
            )}
            {proyecto.fecha_cierre && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cierre</dt>
                <dd className="font-semibold">{formatDate(proyecto.fecha_cierre)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Departamentos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Departamentos
          </p>
          {deptosProyecto.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin departamentos asignados.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {deptosProyecto.map((d) => (
                <span
                  key={d!.id}
                  className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700"
                >
                  {d!.nombre}
                </span>
              ))}
            </div>
          )}
          {proyecto.notas && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="mt-1 text-sm text-foreground">{proyecto.notas}</p>
            </div>
          )}
        </div>

        {/* Equipo */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Equipo asignado
          </p>
          {equipoProyecto.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin personas asignadas.</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {equipoProyecto.map((p) => (
                <span
                  key={p.id}
                  className="inline-flex rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"
                >
                  {p.persona}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* OTs del mes */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Órdenes de trabajo
          </p>
          <MonthNavigator value={mes} onChange={setMes} />
        </div>

        {ordenes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No hay órdenes de trabajo para este proyecto todavía.
          </p>
        ) : ordenesMes.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Sin órdenes de trabajo este mes.
          </p>
        ) : (
          <div className="space-y-6">
            {[...ordenesPorDepto.entries()].map(([deptoId, ots]) => {
              const dept = departamentoMap.get(deptoId)
              const deptoTotal = ots.reduce((sum, o) => sum + o.partida_prevista, 0)

              return (
                <div key={deptoId}>
                  {/* Dept header */}
                  <div className="mb-2 flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {dept?.nombre ?? '—'}
                    </span>
                    <span className="text-xs font-semibold text-primary">
                      {formatMoney(deptoTotal)}
                    </span>
                    <div className="flex-1 border-t border-border/50" />
                  </div>

                  {/* OTs of this dept */}
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-semibold">Servicio</th>
                        <th className="pb-2 font-semibold text-right">Prevista</th>
                        <th className="pb-2 font-semibold text-right">Real</th>
                        <th className="pb-2 font-semibold">% Ppto</th>
                        <th className="pb-2 font-semibold">Estado</th>
                        <th className="pb-2 font-semibold">Personas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ots.map((o) => {
                        const servicio = o.servicio_id ? servicioMap.get(o.servicio_id) : null
                        const sColor = SERVICIO_COLORS[servicio?.nombre ?? ''] ?? 'bg-gray-100 text-gray-700'
                        const personasOT = ordenesPersonas
                          .filter((op) => op.orden_trabajo_id === o.id)
                          .map((op) => personaMap.get(op.persona_id)?.persona)
                          .filter(Boolean) as string[]

                        return (
                          <tr key={o.id} className="border-t border-border/50">
                            <td className="py-2.5">
                              <div className="flex items-center gap-1.5">
                                {servicio ? (
                                  <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${sColor}`}>
                                    {servicio.nombre}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                                    ⚠ Sin servicio
                                  </span>
                                )}
                                {o.titulo && (
                                  <span className="text-[11px] text-muted-foreground">{o.titulo}</span>
                                )}
                              </div>
                            </td>
                            <td className="py-2.5 text-right font-medium text-primary">
                              {formatMoney(o.partida_prevista)}
                            </td>
                            <td className="py-2.5 text-right text-muted-foreground">
                              {o.partida_real !== null ? formatMoney(o.partida_real) : '—'}
                            </td>
                            <td className="py-2.5 text-muted-foreground">
                              {o.porcentaje_ppto_mes}%
                            </td>
                            <td className="py-2.5">
                              <div className="flex items-center gap-2">
                                <StatusBadge status={o.estado} />
                                <AvanzarEstadoButton otId={o.id} estadoActual={o.estado} />
                                {(() => {
                                  const u = getUrgenciaPlanificado(o.estado, o.mes_anio)
                                  return u ? <UrgenciaIndicador nivel={u} /> : null
                                })()}
                              </div>
                            </td>
                            <td className="py-2.5">
                              <div className="flex flex-wrap gap-1">
                                {personasOT.length > 0
                                  ? personasOT.map((n) => (
                                      <span key={n} className="text-xs text-muted-foreground">{n}</span>
                                    ))
                                  : <span className="text-xs text-muted-foreground">—</span>
                                }
                              </div>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
