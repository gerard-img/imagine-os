'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Pencil, Plus, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/kpi-card'
import { StatusBadge, UrgenciaIndicador } from '@/components/status-badge'
import { getUrgenciaPlanificado } from '@/lib/helpers'
import { AvanzarEstadoButton } from '../../ordenes-trabajo/avanzar-estado-button'
import { OtFormSheet } from '../../ordenes-trabajo/ot-form-sheet'
import { AsignacionFormSheet } from '../../asignaciones/asignacion-form-sheet'
import { MonthNavigator } from '@/components/month-navigator'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
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

  // ── Flujo encadenado: OT creada → abrir asignación automáticamente ──
  const [pendingOtId, setPendingOtId] = useState<string | null>(null)

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

  // Asignaciones indexadas por orden_trabajo_id para acceso rápido
  const asignacionesPorOT = useMemo(() => {
    const ordenIds = new Set(ordenes.map((o) => o.id))
    const map = new Map<string, Asignacion[]>()
    for (const a of asignaciones) {
      if (!ordenIds.has(a.orden_trabajo_id)) continue
      const existing = map.get(a.orden_trabajo_id) ?? []
      existing.push(a)
      map.set(a.orden_trabajo_id, existing)
    }
    return map
  }, [asignaciones, ordenes])

  // Asignaciones filtradas solo para las OTs de este proyecto
  const asignacionesProyecto = useMemo(() => {
    const ordenIds = new Set(ordenes.map((o) => o.id))
    return asignaciones.filter((a) => ordenIds.has(a.orden_trabajo_id))
  }, [asignaciones, ordenes])

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
            onCreated={(id) => setPendingOtId(id)}
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
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Órdenes de trabajo
            </p>
            {/* Botón nueva asignación global */}
            <AsignacionFormSheet
              ordenesTrabajo={ordenes}
              proyectos={proyectos}
              empresas={empresas}
              personas={personas}
              cuotas={cuotas}
              asignaciones={asignacionesProyecto}
              trigger={
                <button className="flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                  <Users className="h-3.5 w-3.5" />
                  Nueva Asignación
                </button>
              }
            />
          </div>
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
                        <th className="pb-2 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ots.map((o) => {
                        const servicio = o.servicio_id ? servicioMap.get(o.servicio_id) : undefined
                        const sColor = SERVICIO_COLORS[servicio?.nombre ?? ''] ?? 'bg-gray-100 text-gray-700'
                        const otAsignaciones = asignacionesPorOT.get(o.id) ?? []
                        const pctAsignado = otAsignaciones.reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)

                        return (
                          <OTRowWithAsignaciones
                            key={o.id}
                            ot={o}
                            servicio={servicio}
                            sColor={sColor}
                            otAsignaciones={otAsignaciones}
                            pctAsignado={pctAsignado}
                            personaMap={personaMap}
                            cuotaMap={cuotaMap}
                            // Props para formularios
                            proyecto={proyecto}
                            proyectos={proyectos}
                            ordenes={ordenes}
                            servicios={servicios}
                            departamentos={departamentos}
                            personas={personas}
                            empresas={empresas}
                            cuotas={cuotas}
                            asignacionesProyecto={asignacionesProyecto}
                          />
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

      {/* Flujo encadenado: tras crear OT → abrir asignación automáticamente */}
      {pendingOtId && (
        <AsignacionFormSheet
          key={pendingOtId}
          externalOpen={true}
          onExternalOpenChange={(open) => { if (!open) setPendingOtId(null) }}
          preselectedOrdenId={pendingOtId}
          ordenesTrabajo={ordenes}
          proyectos={proyectos}
          empresas={empresas}
          personas={personas}
          cuotas={cuotas}
          asignaciones={asignacionesProyecto}
        />
      )}
    </div>
  )
}

// ── Componente para fila de OT + sus asignaciones ──

function OTRowWithAsignaciones({
  ot,
  servicio,
  sColor,
  otAsignaciones,
  pctAsignado,
  personaMap,
  cuotaMap,
  proyecto,
  proyectos,
  ordenes,
  servicios,
  departamentos,
  personas,
  empresas,
  cuotas,
  asignacionesProyecto,
}: {
  ot: OrdenTrabajo
  servicio: CatalogoServicio | undefined
  sColor: string
  otAsignaciones: Asignacion[]
  pctAsignado: number
  personaMap: Map<string, Persona>
  cuotaMap: Map<string, CuotaPlanificacion>
  proyecto: Proyecto
  proyectos: Proyecto[]
  ordenes: OrdenTrabajo[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  cuotas: CuotaPlanificacion[]
  asignacionesProyecto: Asignacion[]
}) {
  return (
    <>
      {/* Fila de la OT */}
      <tr className="border-t border-border/50">
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
            {ot.titulo && (
              <span className="text-[11px] text-muted-foreground">{ot.titulo}</span>
            )}
          </div>
        </td>
        <td className="py-2.5 text-right font-medium text-primary">
          {formatMoney(ot.partida_prevista)}
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {ot.partida_real !== null ? formatMoney(ot.partida_real) : '—'}
        </td>
        <td className="py-2.5 text-muted-foreground">
          {ot.porcentaje_ppto_mes}%
        </td>
        <td className="py-2.5">
          <div className="flex items-center gap-2">
            <StatusBadge status={ot.estado} />
            <AvanzarEstadoButton otId={ot.id} estadoActual={ot.estado} />
            {(() => {
              const u = getUrgenciaPlanificado(ot.estado, ot.mes_anio)
              return u ? <UrgenciaIndicador nivel={u} /> : null
            })()}
          </div>
        </td>
        <td className="py-2.5">
          <div className="flex items-center justify-end gap-1">
            {/* Editar OT */}
            <OtFormSheet
              proyectos={proyectos}
              servicios={servicios}
              departamentos={departamentos}
              personas={personas}
              empresas={empresas}
              ot={ot}
            />
            {/* Añadir Asignación a esta OT */}
            <AsignacionFormSheet
              ordenesTrabajo={ordenes}
              proyectos={proyectos}
              empresas={empresas}
              personas={personas}
              cuotas={cuotas}
              asignaciones={asignacionesProyecto}
              preselectedOrdenId={ot.id}
              trigger={
                <button
                  className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  title="Añadir asignación"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
        </td>
      </tr>

      {/* Sub-filas: asignaciones de esta OT */}
      {otAsignaciones.map((a) => {
        const persona = personaMap.get(a.persona_id)
        const cuota = cuotaMap.get(a.cuota_planificacion_id)
        const ingresos = (ot.partida_prevista * a.porcentaje_ppto_tm) / 100
        const horas = safeDivide(ingresos, cuota?.precio_hora ?? 0)

        return (
          <tr key={a.id} className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
            <td className="py-1.5 pl-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">└</span>
                <span className="inline-flex rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-semibold text-primary">
                  {persona?.persona ?? '—'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {cuota?.nombre ?? '—'}
                </span>
              </div>
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {formatMoney(ingresos)}
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {horas.toFixed(1)}h
            </td>
            <td className="py-1.5 text-[11px] text-muted-foreground">
              {a.porcentaje_ppto_tm}%
            </td>
            <td className="py-1.5">
              {cuota && (
                <span className="text-[11px] text-muted-foreground">
                  {formatMoney(cuota.precio_hora)}/h
                </span>
              )}
            </td>
            <td className="py-1.5">
              <div className="flex items-center justify-end">
                <AsignacionFormSheet
                  ordenesTrabajo={ordenes}
                  proyectos={proyectos}
                  empresas={empresas}
                  personas={personas}
                  cuotas={cuotas}
                  asignaciones={asignacionesProyecto}
                  asignacion={a}
                  trigger={
                    <button className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  }
                />
              </div>
            </td>
          </tr>
        )
      })}

      {/* Indicador de % asignado */}
      {otAsignaciones.length > 0 && (
        <tr className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
          <td colSpan={6} className="py-1 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/50">└</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  Asignado: <span className={`font-bold ${pctAsignado >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{pctAsignado}%</span>
                </span>
                {pctAsignado < 100 && (
                  <span className="text-[10px] text-muted-foreground">
                    Disponible: <span className="font-bold text-blue-600">{100 - pctAsignado}%</span>
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Mensaje si no hay asignaciones */}
      {otAsignaciones.length === 0 && (
        <tr className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
          <td colSpan={6} className="py-1.5 pl-6">
            <span className="text-[11px] text-muted-foreground/60 italic">Sin asignaciones</span>
          </td>
        </tr>
      )}
    </>
  )
}
