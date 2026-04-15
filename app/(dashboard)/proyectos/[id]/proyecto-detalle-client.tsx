'use client'

import { useMemo, useState, useRef, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, ChevronRight, Pencil, Plus, Users, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { KpiCard } from '@/components/kpi-card'
import { CambiarEstadoProyecto } from '@/components/cambiar-estado-proyecto'
import { CambiarEstadoOT } from '@/components/cambiar-estado-ot'
import { asignarServicioOT } from '../../ordenes-trabajo/actions'
import { OtFormSheet } from '../../ordenes-trabajo/ot-form-sheet'
import { AsignacionFormSheet } from '../../asignaciones/asignacion-form-sheet'
import { MonthNavigator } from '@/components/month-navigator'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import { ProyectoOtAction } from '../proyecto-ot-action'
import { ProyectoFormSheet } from '../proyecto-form-sheet'
import { ServicioPill } from '@/components/servicio-pill'
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
  ContactoEmpresa,
} from '@/lib/supabase/types'

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
  contactos: ContactoEmpresa[]
}

export function ProyectoDetalleClient(props: Props) {
  return (
    <Suspense>
      <ProyectoDetalleContent {...props} />
    </Suspense>
  )
}

function ProyectoDetalleContent({
  proyecto, proyectos, proyDepts, ordenes, ordenesPersonas,
  asignaciones, servicios, cuotas, personas,
  departamentos, empresas, empresasGrupo, contactos,
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

  // Mes inicial: ?mes=YYYY-MM-01 si viene en la URL (p.ej. desde Planificador),
  // si no, el último mes con OTs.
  const searchParams = useSearchParams()
  const mesFromUrl = searchParams.get('mes')
  const [mes, setMes] = useState(
    mesFromUrl && /^\d{4}-\d{2}-01$/.test(mesFromUrl)
      ? mesFromUrl
      : availableMonths[availableMonths.length - 1]
  )

  const deptosProyecto = useMemo(() =>
    proyDepts.map((pd) => departamentoMap.get(pd.departamento_id)).filter(Boolean),
    [proyDepts, departamentoMap]
  )

  // KPIs — totales del proyecto completo
  const totalPrevisto = ordenes.reduce((sum, o) => sum + o.partida_prevista, 0)
  const totalReal = ordenes.reduce((sum, o) => sum + (o.partida_real ?? 0), 0)

  // Suma de % ppto — Recurrente: OTs del mes seleccionado; Puntual: todas las OTs
  const isPuntual = proyecto.tipo_partida === 'Puntual'
  const sumaPctPpto = useMemo(() => {
    const otsParaSumar = isPuntual ? ordenes : ordenes.filter((o) => o.mes_anio === mes)
    return otsParaSumar.reduce((sum, o) => sum + (o.porcentaje_ppto_mes ?? 0), 0)
  }, [ordenes, mes, isPuntual])

  // OTs del mes seleccionado
  const ordenesMes = useMemo(
    () => ordenes.filter((o) => o.mes_anio === mes),
    [ordenes, mes]
  )

  // KPIs del mes seleccionado
  const mesPrevisto = ordenesMes.reduce((sum, o) => sum + o.partida_prevista, 0)
  const mesReal = ordenesMes.reduce((sum, o) => sum + (o.partida_real ?? 0), 0)

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
            contactos={contactos}
            proyecto={proyecto}
            proyectoDepartamentoIds={proyDepts.map((pd) => pd.departamento_id)}
          />
          <CambiarEstadoProyecto proyectoId={proyecto.id} estadoActual={proyecto.estado} />
        </div>
      </div>

      {/* KPIs */}
      {(() => {
        const [y, m] = mes.split('-').map(Number)
        const mesLabel = new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'short' }).replace('.', '')
        return (
          <div className="mt-5 grid grid-cols-4 gap-4">
            <KpiCard label="Órdenes de trabajo" value={ordenes.length} subtitle={`${ordenesMes.length} en ${mesLabel}`} borderColor="border-t-blue-500" />
            <KpiCard label="Ppto. estimado" value={formatMoney(proyecto.ppto_estimado)} subtitle={isPuntual ? 'Total proyecto' : 'Mensual'} borderColor="border-t-primary" />
            <KpiCard label="Previsto OTs" value={formatMoney(totalPrevisto)} subtitle={`${mesLabel}: ${formatMoney(mesPrevisto)}`} borderColor="border-t-purple-500" />
            <KpiCard label="Real OTs" value={formatMoney(totalReal)} subtitle={`${mesLabel}: ${formatMoney(mesReal)}`} borderColor="border-t-amber-500" />
          </div>
        )
      })()}

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
            {proyecto.responsable_id && (() => {
              const responsable = personaMap.get(proyecto.responsable_id)
              return responsable ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Responsable</dt>
                  <dd className="font-semibold">{responsable.persona}</dd>
                </div>
              ) : null
            })()}
            {proyecto.tipo_facturacion && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Facturación</dt>
                <dd className="font-semibold">{proyecto.tipo_facturacion}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ppto. estimado</dt>
              <dd className="font-bold text-blue-600">{formatMoney(proyecto.ppto_estimado)}</dd>
            </div>
            {proyecto.valor_estimado_total != null && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Valor total est.</dt>
                <dd className="font-semibold text-blue-600">{formatMoney(proyecto.valor_estimado_total)}</dd>
              </div>
            )}
            {proyecto.probabilidad_cierre != null && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Prob. cierre</dt>
                <dd className="font-semibold">{proyecto.probabilidad_cierre}%</dd>
              </div>
            )}
            {proyecto.contacto_principal_id && (() => {
              const contacto = contactos.find((c) => c.id === proyecto.contacto_principal_id)
              return contacto ? (
                <div className="flex justify-between">
                  <dt className="text-muted-foreground">Contacto cliente</dt>
                  <dd className="font-semibold">{contacto.nombre} {contacto.apellidos ?? ''}</dd>
                </div>
              ) : null
            })()}
            {proyecto.fecha_propuesta && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Propuesta</dt>
                <dd className="font-semibold">{formatDate(proyecto.fecha_propuesta)}</dd>
              </div>
            )}
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
                  className="inline-flex rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700"
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
            {/* Generar OT del mes (Recurrente) o todas las OTs (Puntual) */}
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
            {/* Editar la primera OT del mes mostrado */}
            {ordenesMes.length > 0 && (
              <OtFormSheet
                proyectos={proyectos}
                servicios={servicios}
                departamentos={departamentos}
                personas={personas}
                empresas={empresas}
                ordenesTrabajo={ordenes}
                ot={ordenesMes[0]}
                trigger={
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Editar OT
                  </Button>
                }
              />
            )}
            {/* Botón nueva asignación global — solo OTs del mes seleccionado */}
            <AsignacionFormSheet
              ordenesTrabajo={ordenesMes}
              proyectos={proyectos}
              empresas={empresas}
              personas={personas}
              cuotas={cuotas}
              asignaciones={asignacionesProyecto}
              servicios={servicios}
              departamentos={departamentos}
              trigger={
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Users className="h-3.5 w-3.5" />
                  Nueva Asignación
                </Button>
              }
            />
          </div>
          <MonthNavigator value={mes} onChange={setMes} />
        </div>

        {/* Aviso suma % ≠ 100 */}
        {ordenes.length > 0 && sumaPctPpto !== 100 && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
            <p className="text-xs text-amber-800">
              La suma de % presupuesto de las OTs
              {isPuntual ? ' del proyecto' : ` en ${mes.substring(0, 7)}`}
              {' '}es <span className="font-semibold">{sumaPctPpto.toFixed(1)}%</span> (debería ser 100%).
            </p>
          </div>
        )}

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
              const deptoHoras = ots.reduce((sum, o) => {
                const otAsigs = asignacionesPorOT.get(o.id) ?? []
                return sum + otAsigs.reduce((s, a) => {
                  const cuota = cuotaMap.get(a.cuota_planificacion_id)
                  if (!cuota || cuota.precio_hora <= 0) return s
                  return s + safeDivide(o.partida_prevista * (a.porcentaje_ppto_tm / 100), cuota.precio_hora)
                }, 0)
              }, 0)

              return (
                <div key={deptoId}>
                  {/* Dept header */}
                  <div className="mb-2 flex items-center gap-3">
                    <span className="inline-flex rounded-full bg-gray-100 px-3 py-1 text-xs font-bold text-gray-700 uppercase tracking-wide">
                      {dept?.nombre ?? '—'}
                    </span>
                    <span className="text-xs font-semibold text-blue-600">
                      {formatMoney(deptoTotal)}
                    </span>
                    {ots.map((o) => (
                      <CambiarEstadoOT key={o.id} otId={o.id} estadoActual={o.estado} />
                    ))}
                    {deptoHoras > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {Math.round(deptoHoras)}h plan.
                      </span>
                    )}
                    <div className="flex-1 border-t border-border/50" />
                  </div>

                  {/* OTs of this dept */}
                  <table className="w-full text-sm table-fixed">
                    <colgroup>
                      <col className="w-[32%]" />
                      <col className="w-[10%]" />
                      <col className="w-[14%]" />
                      <col className="w-[14%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                      <col className="w-[10%]" />
                    </colgroup>
                    <thead>
                      <tr className="text-left text-xs uppercase text-muted-foreground">
                        <th className="pb-2 font-semibold">Servicio</th>
                        <th className="pb-2 font-semibold text-right">%</th>
                        <th className="pb-2 font-semibold text-right">Prevista</th>
                        <th className="pb-2 font-semibold text-right">Real</th>
                        <th className="pb-2 font-semibold text-right">H. Plan.</th>
                        <th className="pb-2 font-semibold text-right">H. Real</th>
                        <th className="pb-2 font-semibold text-right">Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ots.map((o) => {
                        const servicio = o.servicio_id ? servicioMap.get(o.servicio_id) : undefined
                        const otAsignaciones = asignacionesPorOT.get(o.id) ?? []
                        const pctAsignado = otAsignaciones.reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)

                        return (
                          <OTRowWithAsignaciones
                            key={o.id}
                            ot={o}
                            servicio={servicio}
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
          servicios={servicios}
          departamentos={departamentos}
        />
      )}
    </div>
  )
}

// ── Componente para fila de OT + sus asignaciones ──

function OTRowWithAsignaciones({
  ot,
  servicio,
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
              <ServicioPill name={servicio.nombre} />
            ) : (
              <SinServicioSelector
                otId={ot.id}
                servicios={servicios.filter((s) => s.empresa_grupo_id === proyecto.empresa_grupo_id)}
              />
            )}
            {ot.titulo && (
              <span className="text-[11px] text-muted-foreground truncate">{ot.titulo}</span>
            )}
          </div>
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {ot.porcentaje_ppto_mes}%
        </td>
        <td className="py-2.5 text-right font-medium text-blue-600">
          {formatMoney(ot.partida_prevista)}
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {ot.partida_real !== null ? formatMoney(ot.partida_real) : '—'}
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {(() => {
            const hPlan = otAsignaciones.reduce((sum, a) => {
              const cuota = cuotaMap.get(a.cuota_planificacion_id)
              if (!cuota || cuota.precio_hora <= 0) return sum
              const ingresos = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
              return sum + safeDivide(ingresos, cuota.precio_hora)
            }, 0)
            return hPlan > 0 ? `${Math.round(hPlan)}h` : '—'
          })()}
        </td>
        <td className="py-2.5 text-right font-medium text-emerald-600">
          {(() => {
            const hReal = otAsignaciones.reduce((sum, a) => sum + (a.horas_reales ?? 0), 0)
            return hReal > 0 ? `${hReal}h` : '—'
          })()}
        </td>
        <td className="py-2.5">
          <div className="flex items-center justify-end gap-1">
            <OtFormSheet
              proyectos={proyectos}
              servicios={servicios}
              departamentos={departamentos}
              personas={personas}
              empresas={empresas}
              ordenesTrabajo={ordenes}
              ot={ot}
            />
            <AsignacionFormSheet
              ordenesTrabajo={ordenes}
              proyectos={proyectos}
              empresas={empresas}
              personas={personas}
              cuotas={cuotas}
              asignaciones={asignacionesProyecto}
              servicios={servicios}
              departamentos={departamentos}
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
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {persona?.persona ?? '—'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {cuota?.nombre ?? '—'}
                </span>
              </div>
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {a.porcentaje_ppto_tm}%
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {formatMoney(ingresos)}
            </td>
            <td className="py-1.5" /> {/* Real — no aplica a asignación */}
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {horas.toFixed(1)}h
            </td>
            <td className="py-1.5 text-right text-[11px] font-medium text-emerald-600">
              {a.horas_reales != null ? `${a.horas_reales}h` : '—'}
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
                  servicios={servicios}
                  departamentos={departamentos}
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
          <td colSpan={7} className="py-1 pl-6">
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
          <td colSpan={7} className="py-1.5 pl-6">
            <span className="text-[11px] text-muted-foreground/60 italic">Sin asignaciones</span>
          </td>
        </tr>
      )}
    </>
  )
}

// ── Selector inline para OTs sin servicio ──────────────────────────────────────

function SinServicioSelector({
  otId,
  servicios,
}: {
  otId: string
  servicios: CatalogoServicio[]
}) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSelect(servicioId: string) {
    setSaving(true)
    await asignarServicioOT(otId, servicioId)
    setSaving(false)
    setOpen(false)
  }

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Guardando…
      </span>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
      >
        ⚠ Sin servicio
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-white py-1 shadow-lg">
          {servicios.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No hay servicios configurados</p>
          ) : (
            servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.id)}
                className="flex w-full items-center px-3 py-1.5 text-sm transition-colors hover:bg-muted/50 text-left"
              >
                <ServicioPill name={s.nombre} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
