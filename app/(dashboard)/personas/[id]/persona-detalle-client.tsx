'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import type {
  Persona,
  PersonaDepartamento,
  Departamento,
  EmpresaGrupo,
  RangoInterno,
  Puesto,
  Division,
  Rol,
  Ciudad,
  Oficina,
  Asignacion,
  OrdenTrabajo,
  Proyecto,
  Empresa,
  CatalogoServicio,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import { StatusBadge } from '@/components/status-badge'
import { MonthNavigator } from '@/components/month-navigator'
import { ArrowLeft, Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonaDeptSheet } from '../persona-dept-sheet'
import { toggleInterinidad } from '../actions'

type Props = {
  persona: Persona
  personasDepts: PersonaDepartamento[]
  departamentos: Departamento[]
  empresasGrupo: EmpresaGrupo[]
  rangos: RangoInterno[]
  puestos: Puesto[]
  divisiones: Division[]
  roles: Rol[]
  ciudades: Ciudad[]
  oficinas: Oficina[]
  asignaciones: Asignacion[]
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  servicios: CatalogoServicio[]
  cuotas: CuotaPlanificacion[]
}

const deptColors: Record<string, string> = {
  SEO: 'bg-emerald-100 text-emerald-700',
  SEM: 'bg-blue-100 text-blue-700',
  'Paid Media': 'bg-blue-100 text-blue-700',
  UX: 'bg-purple-100 text-purple-700',
  Contenidos: 'bg-amber-100 text-amber-700',
  Desarrollo: 'bg-indigo-100 text-indigo-700',
  Estrategia: 'bg-pink-100 text-pink-700',
  Operaciones: 'bg-orange-100 text-orange-700',
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

export function PersonaDetalleClient({
  persona, personasDepts, departamentos, empresasGrupo, rangos, puestos,
  divisiones, roles, ciudades, oficinas, asignaciones, ordenesTrabajo,
  proyectos, empresas, servicios, cuotas,
}: Props) {
  const router = useRouter()
  const [mes, setMes] = useState('2026-01-01')

  // Lookup maps
  const egMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const rangoMap = useMemo(() => new Map(rangos.map((r) => [r.id, r])), [rangos])
  const puestoMap = useMemo(() => new Map(puestos.map((p) => [p.id, p])), [puestos])
  const divisionMap = useMemo(() => new Map(divisiones.map((d) => [d.id, d])), [divisiones])
  const rolMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])
  const ciudadMap = useMemo(() => new Map(ciudades.map((c) => [c.id, c])), [ciudades])
  const oficinaMap = useMemo(() => new Map(oficinas.map((o) => [o.id, o])), [oficinas])
  const otMap = useMemo(() => new Map(ordenesTrabajo.map((ot) => [ot.id, ot])), [ordenesTrabajo])
  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const cuotaMap = useMemo(() => new Map(cuotas.map((c) => [c.id, c])), [cuotas])

  // Departamentos de esta persona
  const deptsPersona = useMemo(() => {
    return personasDepts
      .filter((pd) => pd.persona_id === persona.id)
      .map((pd) => ({ ...pd, departamento: deptMap.get(pd.departamento_id) ?? null }))
      .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
  }, [personasDepts, persona.id, deptMap])

  // Clientes asignados para el mes
  const clientes = useMemo(() => {
    const empresaAgg = new Map<
      string,
      { empresa: string; empresaId: string; servicios: { nombre: string; horas: number; ingresos: number }[] }
    >()

    for (const a of asignaciones) {
      const orden = otMap.get(a.orden_trabajo_id)
      if (!orden || orden.mes_anio !== mes || orden.deleted_at) continue

      const proyecto = proyectoMap.get(orden.proyecto_id)
      if (!proyecto?.empresa_id) continue

      const empresa = empresaMap.get(proyecto.empresa_id)
      if (!empresa) continue

      const servicio = orden.servicio_id ? servicioMap.get(orden.servicio_id) : undefined
      const cuota = cuotaMap.get(a.cuota_planificacion_id)

      const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
      const horas = cuota && cuota.precio_hora > 0 ? safeDivide(ingresos, cuota.precio_hora) : 0

      const key = empresa.id
      const existing = empresaAgg.get(key) ?? {
        empresa: empresa.nombre_interno ?? empresa.nombre_legal,
        empresaId: empresa.id,
        servicios: [],
      }

      const servicioNombre = servicio?.nombre ?? '—'
      let servicioEntry = existing.servicios.find((s) => s.nombre === servicioNombre)
      if (!servicioEntry) {
        servicioEntry = { nombre: servicioNombre, horas: 0, ingresos: 0 }
        existing.servicios.push(servicioEntry)
      }
      servicioEntry.horas += horas
      servicioEntry.ingresos += ingresos

      empresaAgg.set(key, existing)
    }

    return [...empresaAgg.values()]
  }, [asignaciones, otMap, proyectoMap, empresaMap, servicioMap, cuotaMap, mes])

  const empresaGrupo = egMap.get(persona.empresa_grupo_id)
  const departamento = deptsPersona.length > 0 ? deptsPersona[0].departamento : null
  const rango = rangoMap.get(persona.rango_id)
  const puesto = puestoMap.get(persona.puesto_id)
  const division = divisionMap.get(persona.division_id)
  const rol = rolMap.get(persona.rol_id)
  const ciudad = ciudadMap.get(persona.ciudad_id)
  const oficina = persona.oficina_id ? oficinaMap.get(persona.oficina_id) : null

  const totalHoras = clientes.reduce(
    (sum, c) => sum + c.servicios.reduce((s, sv) => s + sv.horas, 0), 0
  )
  const totalIngresos = clientes.reduce(
    (sum, c) => sum + c.servicios.reduce((s, sv) => s + sv.ingresos, 0), 0
  )

  const deptName = departamento?.nombre ?? '—'
  const deptColor = deptColors[deptName] ?? 'bg-gray-100 text-gray-700'

  return (
    <div>
      {/* Page header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">{persona.persona}</h1>
        <p className="text-sm text-muted-foreground">Ficha de miembro</p>
      </div>

      {/* Back + title bar */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          <span className="text-lg font-bold text-foreground">
            {persona.nombre} {persona.apellido_primero}
            {persona.apellido_segundo ? ` ${persona.apellido_segundo}` : ''}
          </span>
          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${deptColor}`}>
            {deptName}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={persona.activo ? 'Activo' : 'Inactivo'} />
          <button className="flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 transition-colors">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2-column info cards */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* Datos del Miembro */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Datos del Miembro
            </p>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Nombre completo</dt>
              <dd className="font-semibold text-right">
                {persona.nombre} {persona.apellido_primero}
                {persona.apellido_segundo ? ` ${persona.apellido_segundo}` : ''}
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">DNI</dt>
              <dd className="font-semibold">{persona.dni}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Empresa Grupo</dt>
              <dd className="font-semibold">{empresaGrupo?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between items-start">
              <dt className="text-muted-foreground shrink-0">Departamentos</dt>
              <dd className="flex flex-wrap gap-1 justify-end items-center">
                {deptsPersona.map((d) => {
                  const name = d.departamento?.nombre ?? '—'
                  const color = deptColors[name] ?? 'bg-gray-100 text-gray-700'
                  return (
                    <span key={d.id} className="flex items-center gap-0.5">
                      <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${color}`}>
                        {name}
                      </span>
                      <span className="text-[10px] text-muted-foreground font-medium">{d.porcentaje_tiempo}%</span>
                    </span>
                  )
                })}
                <PersonaDeptSheet
                  personaId={persona.id}
                  personaEmpresaGrupoId={persona.empresa_grupo_id}
                  currentDepts={personasDepts}
                  departamentos={departamentos}
                />
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Puesto</dt>
              <dd className="font-semibold">{puesto?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">Rango</dt>
              <dd className="flex items-center gap-2">
                <span className="font-semibold">{rango?.nombre ?? '—'}</span>
                {persona.rango_es_interino && (
                  <span className="inline-flex rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold tracking-wide text-amber-700">
                    INTERINO
                  </span>
                )}
                <button
                  onClick={async () => { await toggleInterinidad(persona.id, !persona.rango_es_interino) }}
                  title={persona.rango_es_interino ? 'Quitar interinidad' : 'Marcar como interino en este rango'}
                  className="text-[10px] text-muted-foreground hover:text-amber-600 underline transition-colors"
                >
                  {persona.rango_es_interino ? 'Quitar' : 'Interino'}
                </button>
              </dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Rol</dt>
              <dd className="font-semibold">{rol?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">División</dt>
              <dd className="font-semibold">{division?.nombre ?? '—'}</dd>
            </div>
          </dl>
        </div>

        {/* Ubicación y Fechas */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Ubicación y Fechas
            </p>
            <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
              <Pencil className="h-3.5 w-3.5" />
            </button>
          </div>
          <dl className="space-y-2.5 text-sm">
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Ciudad</dt>
              <dd className="font-semibold">{ciudad?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Oficina</dt>
              <dd className="font-semibold">{oficina?.nombre ?? '—'}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Incorporación</dt>
              <dd className="font-semibold">{formatDate(persona.fecha_incorporacion)}</dd>
            </div>
            {persona.fecha_baja && (
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Fecha baja</dt>
                <dd className="font-semibold text-red-500">{formatDate(persona.fecha_baja)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-muted-foreground">Estado</dt>
              <dd><StatusBadge status={persona.activo ? 'Activo' : 'Inactivo'} /></dd>
            </div>
          </dl>

          {/* Summary KPIs for current month */}
          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Resumen del Mes
            </p>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
                <p className="text-lg font-bold text-primary">{clientes.length}</p>
                <p className="text-[10px] text-muted-foreground">Clientes</p>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{Math.round(totalHoras)}h</p>
                <p className="text-[10px] text-muted-foreground">Horas</p>
              </div>
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
                <p className="text-lg font-bold text-emerald-600">{formatMoney(totalIngresos)}</p>
                <p className="text-[10px] text-muted-foreground">Ingresos</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Clientes Asignados */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Clientes Asignados
            </p>
            {totalHoras > 0 && (
              <span className="text-sm font-bold text-primary">{Math.round(totalHoras)}h totales</span>
            )}
          </div>
          <MonthNavigator value={mes} onChange={setMes} />
        </div>

        {clientes.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            Sin asignaciones este mes.
          </p>
        ) : (
          <div className="space-y-3">
            {clientes.map((c) => {
              const clienteHoras = c.servicios.reduce((s, sv) => s + sv.horas, 0)
              const clienteIngresos = c.servicios.reduce((s, sv) => s + sv.ingresos, 0)

              return (
                <div key={c.empresaId} className="rounded-lg border border-border/50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-bold text-foreground">{c.empresa.toUpperCase()}</p>
                    <div className="flex items-center gap-4">
                      <span className="text-sm font-medium text-primary">{formatMoney(clienteIngresos)}</span>
                      <span className="text-sm font-bold text-primary">{Math.round(clienteHoras)}h</span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    {c.servicios.map((s) => (
                      <div key={s.nombre} className="flex items-center justify-between text-sm">
                        <ServicioPill name={s.nombre} />
                        <div className="flex items-center gap-4">
                          <span className="text-muted-foreground">{formatMoney(s.ingresos)}</span>
                          <span className="font-medium text-foreground w-12 text-right">{Math.round(s.horas)}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}

            {/* Total row */}
            <div className="flex items-center justify-between border-t border-border pt-3 px-1">
              <p className="text-xs font-semibold text-muted-foreground">TOTAL</p>
              <div className="flex items-center gap-4">
                <span className="text-sm font-bold text-primary">{formatMoney(totalIngresos)}</span>
                <span className="text-sm font-bold text-primary">{Math.round(totalHoras)}h</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
