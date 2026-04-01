'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
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
} from '@/lib/supabase/types'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import { StatusBadge } from '@/components/status-badge'
import { MonthNavigator } from '@/components/month-navigator'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

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
}

const servicioColors: Record<string, string> = {
  SEO: 'bg-emerald-100 text-emerald-700',
  SEM: 'bg-blue-100 text-blue-700',
  'Diseño Web': 'bg-purple-100 text-purple-700',
  Contenidos: 'bg-amber-100 text-amber-700',
  'Social Media': 'bg-pink-100 text-pink-700',
  Analítica: 'bg-indigo-100 text-indigo-700',
  Estrategia: 'bg-orange-100 text-orange-700',
}

function ServicioPill({ name }: { name: string }) {
  const color = servicioColors[name] ?? 'bg-gray-100 text-gray-700'
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
      {name.toUpperCase()}
    </span>
  )
}

export function EmpresaDetalleClient({
  empresa, contactos, proyectos, ordenesTrabajo, asignaciones,
  servicios, cuotas, personas, personasDepts, departamentos, puestos,
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

  // Proyectos for this empresa
  const proyIds = useMemo(() => {
    return new Set(proyectos.filter((p) => p.empresa_id === empresa.id).map((p) => p.id))
  }, [proyectos, empresa.id])

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
    const pMap = new Map<string, { persona: string; departamento: string; puesto: string; horas: number }>()

    for (const a of asignaciones.filter((a) => ordenIds.has(a.orden_trabajo_id))) {
      const persona = personaMap.get(a.persona_id)
      if (!persona) continue

      const orden = otMap.get(a.orden_trabajo_id)
      const cuota = cuotaMap.get(a.cuota_planificacion_id)

      const depts = personasDepts
        .filter((pd) => pd.persona_id === persona.id)
        .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
      const dept = depts.length > 0 ? deptMap.get(depts[0].departamento_id) : null
      const puesto = puestoMap.get(persona.puesto_id)

      let horas = 0
      if (orden && cuota && cuota.precio_hora > 0) {
        const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
        horas = safeDivide(ingresos, cuota.precio_hora)
      }

      const key = persona.id
      const existing = pMap.get(key) ?? {
        persona: persona.persona,
        departamento: dept?.nombre ?? '—',
        puesto: puesto?.nombre ?? '—',
        horas: 0,
      }
      existing.horas += horas
      pMap.set(key, existing)
    }

    return [...pMap.values()]
  }, [ordenesMes, asignaciones, personaMap, otMap, cuotaMap, personasDepts, deptMap, puestoMap])

  const contactosActivos = contactos.filter((c) => c.activo)
  const feeTotal = serviciosFees.reduce((sum, s) => sum + s.fee, 0)
  const horasEquipoTotal = equipo.reduce((sum, e) => sum + e.horas, 0)

  const subestado =
    empresa.estado === 'Conocido'
      ? empresa.tipo_conocido
      : empresa.estado === 'Cliente'
        ? empresa.tipo_cliente
        : empresa.estado === 'Prospecto'
          ? empresa.estado_prospecto
          : null

  const contactoPrincipal = contactos.find(
    (c) => c.es_contacto_principal && c.activo
  )

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">
          {empresa.nombre_interno ?? empresa.nombre_legal}
        </h1>
        <p className="text-sm text-muted-foreground">Ficha de empresa</p>
      </div>

      {/* Back + title bar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          <span className="text-lg font-bold text-foreground">
            {(empresa.nombre_interno ?? empresa.nombre_legal).toUpperCase()}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={empresa.estado} />
          <MonthNavigator value={mes} onChange={setMes} />
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 3-column info cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Datos Generales */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Datos Generales
            </p>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nombre</dt>
              <dd className="font-semibold text-right">{empresa.nombre_legal}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">CIF</dt>
              <dd className="font-semibold">{empresa.cif}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Tipo</dt>
              <dd className="font-semibold">{empresa.tipo}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Sector</dt>
              <dd className="font-semibold">{empresa.sector ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estado</dt>
              <dd><StatusBadge status={empresa.estado} /></dd>
            </div>
            {subestado && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Subestado</dt>
                <dd className="font-semibold">{subestado}</dd>
              </div>
            )}
            {empresa.fecha_primer_contrato && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">1er contrato</dt>
                <dd className="font-semibold">{formatDate(empresa.fecha_primer_contrato)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Dirección */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Dirección
            </p>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Dirección</dt>
              <dd className="font-semibold text-right">
                {[empresa.calle, empresa.codigo_postal, empresa.ciudad, empresa.provincia, empresa.pais].filter(Boolean).join(', ') || '—'}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Web</dt>
              <dd className="font-semibold text-right truncate max-w-[200px]">{empresa.web ?? '—'}</dd>
            </div>
          </dl>
          {empresa.notas && (
            <div className="mt-4 border-t border-border pt-3">
              <p className="text-xs text-muted-foreground">Notas</p>
              <p className="mt-1 text-sm text-foreground">{empresa.notas}</p>
            </div>
          )}
        </div>

        {/* Contacto */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Contacto
            </p>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          {contactoPrincipal ? (
            <dl className="space-y-2.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Nombre</dt>
                <dd className="font-semibold">
                  {contactoPrincipal.nombre} {contactoPrincipal.apellidos}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Cargo</dt>
                <dd className="font-semibold">{contactoPrincipal.cargo ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Email</dt>
                <dd className="font-semibold text-right truncate max-w-[200px]">{contactoPrincipal.email ?? '—'}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Teléfono</dt>
                <dd className="font-semibold">{contactoPrincipal.movil ?? contactoPrincipal.telefono_directo ?? '—'}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground">Sin contacto principal.</p>
          )}
          {contactosActivos.length > 1 && (
            <p className="mt-3 text-xs text-muted-foreground">
              +{contactosActivos.length - 1} contacto{contactosActivos.length - 1 > 1 ? 's' : ''} más
            </p>
          )}
        </div>
      </div>

      {/* Servicios & Fees */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Servicios
            </p>
            {feeTotal > 0 && (
              <span className="text-sm font-bold text-primary">{formatMoney(feeTotal)}/mes</span>
            )}
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {serviciosFees.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin servicios asignados este mes.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 font-semibold">Servicio</th>
                <th className="pb-2 font-semibold text-right">Fee</th>
                <th className="pb-2 font-semibold text-right w-[120px]">%</th>
                <th className="pb-2 font-semibold text-right">Horas</th>
              </tr>
            </thead>
            <tbody>
              {serviciosFees.map((s) => {
                const pct = feeTotal > 0 ? safeDivide(s.fee, feeTotal) * 100 : 0
                return (
                  <tr key={s.nombre} className="border-t border-border/50">
                    <td className="py-3">
                      <ServicioPill name={s.nombre} />
                    </td>
                    <td className="py-3 text-right font-medium text-primary">
                      {formatMoney(s.fee)}
                    </td>
                    <td className="py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <div className="h-1.5 w-20 rounded-full bg-gray-100">
                          <div
                            className="h-1.5 rounded-full bg-primary"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-muted-foreground w-10 text-right">
                          {Math.round(pct)}%
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-right text-muted-foreground">
                      {Math.round(s.horas)}h
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Equipo Asignado */}
      <div className="mt-4 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Equipo Asignado
            </p>
            {horasEquipoTotal > 0 && (
              <span className="text-sm font-bold text-primary">{Math.round(horasEquipoTotal)}h totales</span>
            )}
          </div>
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        </div>

        {equipo.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin equipo asignado este mes.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs uppercase text-muted-foreground">
                <th className="pb-2 font-semibold">Persona</th>
                <th className="pb-2 font-semibold">Departamento</th>
                <th className="pb-2 font-semibold">Puesto</th>
                <th className="pb-2 font-semibold text-right">Horas</th>
              </tr>
            </thead>
            <tbody>
              {equipo.map((e) => (
                <tr key={e.persona} className="border-t border-border/50">
                  <td className="py-3 font-medium">{e.persona}</td>
                  <td className="py-3 text-muted-foreground">{e.departamento}</td>
                  <td className="py-3 text-muted-foreground">{e.puesto}</td>
                  <td className="py-3 text-right font-medium text-primary">{Math.round(e.horas)}h</td>
                </tr>
              ))}
              <tr className="border-t border-border">
                <td colSpan={3} className="py-3 text-right text-xs font-semibold text-muted-foreground">
                  Total:
                </td>
                <td className="py-3 text-right font-bold text-primary">
                  {Math.round(horasEquipoTotal)}h
                </td>
              </tr>
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
