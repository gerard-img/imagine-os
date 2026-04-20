'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import type {
  Empresa,
  ContactoEmpresa,
  Proyecto,
  OrdenTrabajo,
  Asignacion,
  CatalogoServicio,
  CuotaPlanificacion,
  Persona,
  PersonaDepartamento,
  Departamento,
  Puesto,
  EmpresaGrupo,
} from '@/lib/supabase/types'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import { StatusBadge } from '@/components/status-badge'
import { MonthNavigator } from '@/components/month-navigator'
import { ArrowLeft, Globe, Phone, Mail, ExternalLink, Crown, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoRow } from '@/components/info-row'
import { EmpresaEditSheet } from './empresa-edit-sheet'
import { ContactoFormSheet } from '../../contactos/contacto-form-sheet'

type Props = {
  empresa: Empresa
  contactos: ContactoEmpresa[]
  proyectos: Proyecto[]
  ordenesTrabajo: OrdenTrabajo[]
  asignaciones: Asignacion[]
  servicios: CatalogoServicio[]
  cuotas: CuotaPlanificacion[]
  personas: Persona[]
  personasDepts: PersonaDepartamento[]
  departamentos: Departamento[]
  puestos: Puesto[]
  empresasGrupo: EmpresaGrupo[]
}

const clasificacionColors: Record<string, string> = {
  A: 'bg-emerald-100 text-emerald-700',
  B: 'bg-blue-100 text-blue-700',
  C: 'bg-gray-100 text-gray-600',
}

export function EmpresaDetalleClient({
  empresa, contactos, proyectos, ordenesTrabajo, asignaciones,
  servicios, cuotas, personas, personasDepts, departamentos, puestos, empresasGrupo,
}: Props) {
  const router = useRouter()
  const [mes, setMes] = useState('2026-01-01')

  // Lookup maps
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const cuotaMap = useMemo(() => new Map(cuotas.map((c) => [c.id, c])), [cuotas])
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const puestoMap = useMemo(() => new Map(puestos.map((p) => [p.id, p])), [puestos])
  const otMap = useMemo(() => new Map(ordenesTrabajo.map((ot) => [ot.id, ot])), [ordenesTrabajo])
  const egMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])

  const proyIds = useMemo(() => new Set(proyectos.map((p) => p.id)), [proyectos])

  // Ordenes for this empresa in current month
  const ordenesMes = useMemo(() => {
    return ordenesTrabajo.filter(
      (ot) => proyIds.has(ot.proyecto_id) && ot.mes_anio === mes && !ot.deleted_at
    )
  }, [ordenesTrabajo, proyIds, mes])

  // Servicios y fees
  const serviciosFees = useMemo(() => {
    const sMap = new Map<string, { nombre: string; fee: number; horas: number }>()
    for (const ot of ordenesMes) {
      const servicio = ot.servicio_id ? servicioMap.get(ot.servicio_id) : undefined
      const nombre = servicio?.nombre ?? '—'
      const existing = sMap.get(nombre) ?? { nombre, fee: 0, horas: 0 }
      existing.fee += ot.partida_prevista

      const asigs = asignaciones.filter((a) => a.orden_trabajo_id === ot.id)
      for (const a of asigs) {
        const cuota = cuotaMap.get(a.cuota_planificacion_id)
        if (cuota && cuota.precio_hora > 0) {
          const ingresos = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
          existing.horas += safeDivide(ingresos, cuota.precio_hora)
        }
      }
      sMap.set(nombre, existing)
    }
    return [...sMap.values()]
  }, [ordenesMes, asignaciones, servicioMap, cuotaMap])

  // Equipo asignado
  const equipo = useMemo(() => {
    const ordenIds = new Set(ordenesMes.map((ot) => ot.id))
    const pMap = new Map<string, { personaId: string; persona: string; departamento: string; puesto: string; horas: number }>()

    for (const a of asignaciones.filter((a) => ordenIds.has(a.orden_trabajo_id))) {
      const persona = personaMap.get(a.persona_id)
      if (!persona) continue

      const orden = otMap.get(a.orden_trabajo_id)
      const cuota = cuotaMap.get(a.cuota_planificacion_id)

      const depts = personasDepts
        .filter((pd) => pd.persona_id === persona.id)
        .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
      const dept = depts.length > 0 ? deptMap.get(depts[0].departamento_id) : null
      const puesto = persona.puesto_id ? puestoMap.get(persona.puesto_id) : undefined

      let horas = 0
      if (orden && cuota && cuota.precio_hora > 0) {
        const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
        horas = safeDivide(ingresos, cuota.precio_hora)
      }

      const key = persona.id
      const existing = pMap.get(key) ?? {
        personaId: persona.id,
        persona: persona.persona,
        departamento: dept?.nombre ?? '—',
        puesto: puesto?.nombre ?? '—',
        horas: 0,
      }
      existing.horas += horas
      pMap.set(key, existing)
    }

    return [...pMap.values()].sort((a, b) => b.horas - a.horas)
  }, [ordenesMes, asignaciones, personaMap, otMap, cuotaMap, personasDepts, deptMap, puestoMap])

  const contactosActivos = contactos.filter((c) => c.activo)
  const feeTotal = serviciosFees.reduce((sum, s) => sum + s.fee, 0)
  const horasEquipoTotal = equipo.reduce((sum, e) => sum + e.horas, 0)

  const subestado =
    empresa.estado === 'Conocido' ? empresa.tipo_conocido
    : empresa.estado === 'Cliente' ? empresa.tipo_cliente
    : empresa.estado === 'Prospecto' ? empresa.estado_prospecto
    : null

  const responsable = empresa.responsable_cuenta_id ? personaMap.get(empresa.responsable_cuenta_id) : null

  // Proyectos activos e inactivos
  const proyectosActivos = proyectos.filter((p) => ['Activo', 'Confirmado', 'Propuesta'].includes(p.estado))
  const proyectosInactivos = proyectos.filter((p) => !['Activo', 'Confirmado', 'Propuesta'].includes(p.estado))

  // Ingresos totales acumulados (todas las OTs de todos los proyectos)
  const ingresosTotal = useMemo(() => {
    return ordenesTrabajo
      .filter((ot) => proyIds.has(ot.proyecto_id) && !ot.deleted_at)
      .reduce((sum, ot) => sum + ot.partida_prevista, 0)
  }, [ordenesTrabajo, proyIds])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {(empresa.nombre_interno ?? empresa.nombre_legal).toUpperCase()}
            </h1>
            <p className="text-sm text-muted-foreground">
              {empresa.nombre_legal}{empresa.cif ? ` · ${empresa.cif}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {empresa.clasificacion_cuenta && (
            <span className={`inline-flex rounded-full px-3 py-0.5 text-xs font-bold ${clasificacionColors[empresa.clasificacion_cuenta] ?? 'bg-gray-100 text-gray-600'}`}>
              Cuenta {empresa.clasificacion_cuenta}
            </span>
          )}
          <StatusBadge status={empresa.estado} />
          {subestado && (
            <span className="text-xs text-muted-foreground">({subestado})</span>
          )}
          <EmpresaEditSheet empresa={empresa} personas={personas} />
        </div>
      </div>

      {/* Row 1: 3 info cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Datos Generales */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Datos Generales
          </p>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Tipo" value={empresa.tipo} />
            <InfoRow label="Sector" value={empresa.sector} />
            <InfoRow label="Moneda" value={empresa.moneda} />
            {empresa.fecha_primer_contrato && (
              <InfoRow label="1er contrato" value={formatDate(empresa.fecha_primer_contrato)} />
            )}
            {empresa.fuente_captacion && (
              <InfoRow label="Fuente" value={empresa.fuente_captacion} />
            )}
            {responsable && (
              <InfoRow label="Responsable">
                <Link href={`/personas/${responsable.id}`} className="font-semibold text-primary hover:underline">
                  {responsable.persona}
                </Link>
              </InfoRow>
            )}
            {empresa.idioma_preferido && (
              <InfoRow label="Idioma" value={empresa.idioma_preferido} />
            )}
          </dl>
        </div>

        {/* Comercial */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Datos Comerciales
          </p>
          <dl className="space-y-2.5 text-sm">
            {empresa.num_empleados != null && (
              <InfoRow label="Empleados" value={empresa.num_empleados.toLocaleString('es-ES')} />
            )}
            {empresa.facturacion_anual_estimada != null && (
              <InfoRow label="Facturación est." value={formatMoney(empresa.facturacion_anual_estimada)} />
            )}
            <InfoRow label="Proyectos activos" value={String(proyectosActivos.length)} />
            <InfoRow label="Ingresos acumulados" value={formatMoney(ingresosTotal)} />
          </dl>

          {/* Dirección */}
          <div className="mt-4 border-t border-border pt-3">
            <p className="text-[10px] uppercase text-muted-foreground mb-2">Dirección</p>
            <p className="text-sm">
              {[empresa.calle, empresa.codigo_postal, empresa.ciudad, empresa.provincia, empresa.pais].filter(Boolean).join(', ') || '—'}
            </p>
          </div>

          {/* Links */}
          <div className="mt-3 flex items-center gap-3">
            {empresa.web && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Globe className="h-3 w-3" />
                <span className="truncate max-w-[150px]">{empresa.web}</span>
              </span>
            )}
            {empresa.linkedin_url && (
              <span className="flex items-center gap-1 text-xs text-blue-600">
                <ExternalLink className="h-3 w-3" />
                LinkedIn
              </span>
            )}
            {empresa.telefono && (
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                {empresa.telefono}
              </span>
            )}
          </div>
        </div>

        {/* Resumen Mes */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Resumen del Mes
            </p>
            <MonthNavigator value={mes} onChange={setMes} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{formatMoney(feeTotal)}</p>
              <p className="text-[10px] text-muted-foreground">Fee mensual</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
              <p className="text-lg font-bold text-blue-600">{Math.round(horasEquipoTotal)}h</p>
              <p className="text-[10px] text-muted-foreground">Horas equipo</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
              <p className="text-lg font-bold text-emerald-600">{equipo.length}</p>
              <p className="text-[10px] text-muted-foreground">Personas</p>
            </div>
            <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
              <p className="text-lg font-bold text-amber-600">{serviciosFees.length}</p>
              <p className="text-[10px] text-muted-foreground">Servicios</p>
            </div>
          </div>

          {empresa.notas && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-[10px] uppercase text-muted-foreground mb-1">Notas</p>
              <p className="text-sm text-muted-foreground">{empresa.notas}</p>
            </div>
          )}
        </div>
      </div>

      {/* Row 2: Servicios + Equipo */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Servicios */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Servicios
            </p>
            {feeTotal > 0 && (
              <span className="text-sm font-bold text-blue-600">{formatMoney(feeTotal)}/mes</span>
            )}
          </div>

          {serviciosFees.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin servicios asignados este mes.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase text-muted-foreground">
                  <th className="pb-2 font-semibold">Servicio</th>
                  <th className="pb-2 font-semibold text-right">Fee</th>
                  <th className="pb-2 font-semibold text-right w-[100px]">%</th>
                  <th className="pb-2 font-semibold text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {serviciosFees.map((s) => {
                  const pct = feeTotal > 0 ? safeDivide(s.fee, feeTotal) * 100 : 0
                  return (
                    <tr key={s.nombre} className="border-t border-border/50">
                      <td className="py-2.5 font-medium">{s.nombre}</td>
                      <td className="py-2.5 text-right text-blue-600 font-medium">{formatMoney(s.fee)}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="h-1.5 w-16 rounded-full bg-gray-100">
                            <div className="h-1.5 rounded-full bg-primary" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-xs text-muted-foreground w-8 text-right">{Math.round(pct)}%</span>
                        </div>
                      </td>
                      <td className="py-2.5 text-right text-muted-foreground">{Math.round(s.horas)}h</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Equipo Asignado */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Equipo Asignado
            </p>
            {horasEquipoTotal > 0 && (
              <span className="text-sm font-bold text-blue-600">{Math.round(horasEquipoTotal)}h totales</span>
            )}
          </div>

          {equipo.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin equipo asignado este mes.
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase text-muted-foreground">
                  <th className="pb-2 font-semibold">Persona</th>
                  <th className="pb-2 font-semibold">Dept.</th>
                  <th className="pb-2 font-semibold">Puesto</th>
                  <th className="pb-2 font-semibold text-right">Horas</th>
                </tr>
              </thead>
              <tbody>
                {equipo.map((e) => (
                  <tr key={e.personaId} className="border-t border-border/50">
                    <td className="py-2.5">
                      <Link href={`/personas/${e.personaId}`} className="font-medium hover:text-primary transition-colors">
                        {e.persona}
                      </Link>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{e.departamento}</td>
                    <td className="py-2.5 text-muted-foreground">{e.puesto}</td>
                    <td className="py-2.5 text-right font-medium text-blue-600">{Math.round(e.horas)}h</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Row 3: Contactos + Proyectos */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Contactos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contactos
            </p>
            <span className="text-xs text-muted-foreground">{contactosActivos.length} activos</span>
            <div className="ml-auto">
              <ContactoFormSheet
                empresas={[empresa]}
                preselectedEmpresaId={empresa.id}
                trigger={
                  <button className="rounded-full bg-primary/10 p-1.5 text-primary hover:bg-primary/20 transition-colors" title="Nuevo contacto">
                    <span className="sr-only">Nuevo contacto</span>
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" d="M12 5v14m-7-7h14" /></svg>
                  </button>
                }
              />
            </div>
          </div>

          {contactosActivos.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin contactos registrados.
            </p>
          ) : (
            <div className="space-y-3">
              {contactosActivos.map((c) => (
                <div key={c.id} className="rounded-lg border border-border/50 p-3">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold">
                        {c.nombre} {c.apellidos ?? ''}
                      </span>
                      {c.es_contacto_principal && (
                        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
                      )}
                      {c.es_decisor && (
                        <Crown className="h-3.5 w-3.5 text-purple-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.rol_influencia && (
                        <span className="text-[10px] text-muted-foreground">{c.rol_influencia}</span>
                      )}
                      <ContactoFormSheet empresas={[empresa]} contacto={c} />
                    </div>
                  </div>
                  {c.cargo && (
                    <p className="text-xs text-muted-foreground mb-1">{c.cargo}{c.departamento ? ` · ${c.departamento}` : ''}</p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    {c.email && (
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        <span className="truncate max-w-[160px]">{c.email}</span>
                      </span>
                    )}
                    {(c.movil ?? c.telefono_directo) && (
                      <span className="flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        {c.movil ?? c.telefono_directo}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Proyectos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Proyectos
            </p>
            <span className="text-xs text-muted-foreground">
              {proyectosActivos.length} activos · {proyectos.length} total
            </span>
          </div>

          {proyectos.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin proyectos asociados.
            </p>
          ) : (
            <div className="space-y-2">
              {[...proyectosActivos, ...proyectosInactivos].map((p) => {
                const eg = egMap.get(p.empresa_grupo_id)
                return (
                  <Link
                    key={p.id}
                    href={`/proyectos`}
                    className="flex items-center justify-between rounded-lg border border-border/50 p-3 hover:bg-muted/30 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.titulo}</p>
                      <p className="text-xs text-muted-foreground">
                        {eg?.codigo ?? '—'} · {p.tipo_proyecto} · {p.tipo_partida}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-sm font-medium text-blue-600">{formatMoney(p.ppto_estimado)}</span>
                      <StatusBadge status={p.estado} />
                    </div>
                  </Link>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
