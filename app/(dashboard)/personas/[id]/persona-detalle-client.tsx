'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Condicion,
  Ausencia,
  OrdenTrabajo,
  Proyecto,
  Empresa,
  CatalogoServicio,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import { StatusBadge } from '@/components/status-badge'
import { MonthNavigator } from '@/components/month-navigator'
import { ArrowLeft, Mail, Phone, ExternalLink, Globe, Archive, ArchiveRestore, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { PersonaDeptSheet } from '../persona-dept-sheet'
import { PersonaFormSheet } from '../persona-form-sheet'
import { toggleInterinidad, archivarPersona, restaurarPersona, eliminarPersona } from '../actions'

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
  condiciones: Condicion[]
  ausencias: Ausencia[]
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  servicios: CatalogoServicio[]
  cuotas: CuotaPlanificacion[]
}

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

function InfoRow({ label, value, children }: { label: string; value?: string | null; children?: React.ReactNode }) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-right">{children ?? value ?? '—'}</dd>
    </div>
  )
}

export function PersonaDetalleClient({
  persona, personasDepts, departamentos, empresasGrupo, rangos, puestos,
  divisiones, roles, ciudades, oficinas, asignaciones, condiciones, ausencias,
  ordenesTrabajo, proyectos, empresas, servicios, cuotas,
}: Props) {
  const router = useRouter()
  const [mes, setMes] = useState('2026-01-01')
  const [actionLoading, setActionLoading] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)

  async function handleArchivar() {
    setActionLoading(true)
    setActionError(null)
    const result = await archivarPersona(persona.id)
    if (!result.success) setActionError(result.error ?? 'Error al archivar')
    setActionLoading(false)
  }

  async function handleRestaurar() {
    setActionLoading(true)
    setActionError(null)
    const result = await restaurarPersona(persona.id)
    if (!result.success) setActionError(result.error ?? 'Error al restaurar')
    setActionLoading(false)
  }

  async function handleEliminar() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setActionLoading(true)
    setActionError(null)
    setConfirmDelete(false)
    const result = await eliminarPersona(persona.id)
    if (result.success) {
      router.push('/personas')
    } else {
      setActionError(result.error ?? 'Error al eliminar')
      setActionLoading(false)
    }
  }

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
  const clientesMes = useMemo(() => {
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
  const rango = rangoMap.get(persona.rango_id)
  const puesto = puestoMap.get(persona.puesto_id)
  const division = divisionMap.get(persona.division_id)
  const rol = rolMap.get(persona.rol_id)
  const ciudad = ciudadMap.get(persona.ciudad_id)
  const oficina = persona.oficina_id ? oficinaMap.get(persona.oficina_id) : null

  const totalHoras = clientesMes.reduce(
    (sum, c) => sum + c.servicios.reduce((s, sv) => s + sv.horas, 0), 0
  )
  const totalIngresos = clientesMes.reduce(
    (sum, c) => sum + c.servicios.reduce((s, sv) => s + sv.ingresos, 0), 0
  )

  // Condición actual (sin fecha_fin)
  const condicionActual = condiciones.find((c) => !c.fecha_fin)
  const condicionesHistoricas = condiciones.filter((c) => c.fecha_fin)

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
              {persona.nombre} {persona.apellido_primero}
              {persona.apellido_segundo ? ` ${persona.apellido_segundo}` : ''}
            </h1>
            <p className="text-sm text-muted-foreground">
              {persona.persona} · {empresaGrupo?.codigo ?? '—'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deptsPersona.map((d) => (
            <DeptPill key={d.id} name={d.departamento?.nombre ?? '—'} />
          ))}
          <StatusBadge status={persona.activo ? 'Activo' : 'Inactivo'} />
          <PersonaFormSheet
            empresasGrupo={empresasGrupo}
            roles={roles}
            divisiones={divisiones}
            puestos={puestos}
            rangos={rangos}
            ciudades={ciudades}
            oficinas={oficinas}
            departamentos={departamentos}
            personasDepts={personasDepts}
            persona={persona}
          />
          {actionLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          ) : persona.activo ? (
            <>
              <Button variant="outline" size="sm" onClick={handleArchivar} className="gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50">
                <Archive className="h-3.5 w-3.5" />
                Archivar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEliminar}
                className={`gap-1.5 ${confirmDelete ? 'text-red-700 bg-red-100 border-red-300' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmDelete ? 'Confirmar' : 'Eliminar'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={handleRestaurar} className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50">
                <ArchiveRestore className="h-3.5 w-3.5" />
                Restaurar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEliminar}
                className={`gap-1.5 ${confirmDelete ? 'text-red-700 bg-red-100 border-red-300' : 'text-red-600 hover:text-red-700 hover:bg-red-50'}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                {confirmDelete ? 'Confirmar' : 'Eliminar'}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Error de acción */}
      {actionError && (
        <div className="mt-3 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* Row 1: 3 info cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Datos del Miembro */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Datos del Miembro
          </p>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="DNI" value={persona.dni} />
            <InfoRow label="Empresa Grupo" value={empresaGrupo?.nombre} />
            <div className="flex justify-between items-start">
              <dt className="text-muted-foreground shrink-0">Departamentos</dt>
              <dd className="flex flex-wrap gap-1 justify-end items-center">
                {deptsPersona.map((d) => (
                  <span key={d.id} className="flex items-center gap-0.5">
                    <DeptPill name={d.departamento?.nombre ?? '—'} />
                    <span className="text-[10px] text-muted-foreground font-medium">{d.porcentaje_tiempo}%</span>
                  </span>
                ))}
                <PersonaDeptSheet
                  personaId={persona.id}
                  personaEmpresaGrupoId={persona.empresa_grupo_id}
                  currentDepts={personasDepts}
                  departamentos={departamentos}
                />
              </dd>
            </div>
            <InfoRow label="Puesto" value={puesto?.nombre} />
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
                  title={persona.rango_es_interino ? 'Quitar interinidad' : 'Marcar como interino'}
                  className="text-[10px] text-muted-foreground hover:text-amber-600 underline transition-colors"
                >
                  {persona.rango_es_interino ? 'Quitar' : 'Interino'}
                </button>
              </dd>
            </div>
            <InfoRow label="Rol" value={rol?.nombre} />
            <InfoRow label="División" value={division?.nombre} />
          </dl>
        </div>

        {/* Contacto y Personal */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Contacto
          </p>
          <dl className="space-y-2.5 text-sm">
            {persona.email_corporativo && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm truncate">{persona.email_corporativo}</span>
              </div>
            )}
            {persona.email_personal && (
              <div className="flex items-center gap-2">
                <Mail className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                <span className="text-sm text-muted-foreground truncate">{persona.email_personal}</span>
              </div>
            )}
            {persona.telefono && (
              <div className="flex items-center gap-2">
                <Phone className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm">{persona.telefono}</span>
              </div>
            )}
            {persona.linkedin_url && (
              <div className="flex items-center gap-2">
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <span className="text-sm text-blue-600 truncate">LinkedIn</span>
              </div>
            )}
            {!persona.email_corporativo && !persona.telefono && !persona.linkedin_url && (
              <p className="text-sm text-muted-foreground italic">Sin datos de contacto.</p>
            )}
          </dl>

          <div className="mt-5 border-t border-border pt-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Personal
            </p>
            <dl className="space-y-2.5 text-sm">
              {persona.fecha_nacimiento && (
                <InfoRow label="Nacimiento" value={formatDate(persona.fecha_nacimiento)} />
              )}
              <InfoRow label="Modalidad" value={persona.modalidad_trabajo} />
              <InfoRow label="Inglés" value={persona.nivel_ingles} />
              {persona.skills_tags && persona.skills_tags.length > 0 && (
                <div className="flex justify-between items-start">
                  <dt className="text-muted-foreground shrink-0">Skills</dt>
                  <dd className="flex flex-wrap gap-1 justify-end">
                    {persona.skills_tags.map((s) => (
                      <span key={s} className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-700">
                        {s}
                      </span>
                    ))}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        {/* Ubicación y Fechas */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Ubicación y Fechas
          </p>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Ciudad" value={ciudad?.nombre} />
            <InfoRow label="Oficina" value={oficina?.nombre} />
            <InfoRow label="Incorporación" value={formatDate(persona.fecha_incorporacion)} />
            {persona.fecha_baja && (
              <InfoRow label="Fecha baja">
                <span className="font-semibold text-red-500">{formatDate(persona.fecha_baja)}</span>
              </InfoRow>
            )}
          </dl>

          {/* Resumen mes */}
          <div className="mt-5 border-t border-border pt-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Resumen del Mes
              </p>
              <MonthNavigator value={mes} onChange={setMes} />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-[#F9FAFB] p-3 text-center">
                <p className="text-lg font-bold text-blue-600">{clientesMes.length}</p>
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

      {/* Row 2: Clientes Asignados + Condición Actual */}
      <div className="mt-4 grid grid-cols-[1fr_380px] gap-4">
        {/* Clientes Asignados */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Clientes Asignados
            </p>
            {totalHoras > 0 && (
              <span className="text-sm font-bold text-blue-600">{Math.round(totalHoras)}h totales</span>
            )}
          </div>

          {clientesMes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">
              Sin asignaciones este mes.
            </p>
          ) : (
            <div className="space-y-3">
              {clientesMes.map((c) => {
                const clienteHoras = c.servicios.reduce((s, sv) => s + sv.horas, 0)
                const clienteIngresos = c.servicios.reduce((s, sv) => s + sv.ingresos, 0)

                return (
                  <div key={c.empresaId} className="rounded-lg border border-border/50 p-4">
                    <div className="flex items-center justify-between mb-2">
                      <Link
                        href={`/empresas/${c.empresaId}`}
                        className="text-sm font-bold text-foreground hover:text-primary transition-colors"
                      >
                        {c.empresa.toUpperCase()}
                      </Link>
                      <div className="flex items-center gap-4">
                        <span className="text-sm text-muted-foreground">{formatMoney(clienteIngresos)}</span>
                        <span className="text-sm font-bold text-blue-600">{Math.round(clienteHoras)}h</span>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {c.servicios.map((s) => (
                        <div key={s.nombre} className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">{s.nombre}</span>
                          <span className="font-medium">{Math.round(s.horas)}h</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Condición Actual */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Condición Actual
          </p>
          {condicionActual ? (
            <dl className="space-y-2.5 text-sm">
              <InfoRow label="Salario bruto anual" value={formatMoney(condicionActual.salario_bruto_anual)} />
              <InfoRow label="Tipo contrato" value={condicionActual.tipo_contrato} />
              <InfoRow label="Jornada" value={condicionActual.jornada} />
              <InfoRow label="Horas/semana" value={`${condicionActual.horas_semana}h`} />
              {condicionActual.salario_variable_anual != null && condicionActual.salario_variable_anual > 0 && (
                <InfoRow label="Variable anual" value={formatMoney(condicionActual.salario_variable_anual)} />
              )}
              {condicionActual.coste_seguridad_social != null && condicionActual.coste_seguridad_social > 0 && (
                <InfoRow label="Coste SS" value={formatMoney(condicionActual.coste_seguridad_social)} />
              )}
              {condicionActual.dias_vacaciones != null && (
                <InfoRow label="Vacaciones" value={`${condicionActual.dias_vacaciones} días`} />
              )}
              {condicionActual.modalidad_trabajo && (
                <InfoRow label="Modalidad" value={condicionActual.modalidad_trabajo} />
              )}
              <InfoRow label="Desde" value={formatDate(condicionActual.fecha_inicio)} />
              {condicionActual.benefits && (
                <div className="mt-2 border-t border-border pt-2">
                  <dt className="text-[10px] uppercase text-muted-foreground mb-1">Benefits</dt>
                  <dd className="text-sm text-foreground">{condicionActual.benefits}</dd>
                </div>
              )}
              {condicionActual.notas && (
                <div className="mt-2 border-t border-border pt-2">
                  <dt className="text-[10px] uppercase text-muted-foreground mb-1">Notas</dt>
                  <dd className="text-sm text-muted-foreground">{condicionActual.notas}</dd>
                </div>
              )}
            </dl>
          ) : (
            <p className="text-sm text-muted-foreground italic">Sin condición registrada.</p>
          )}
        </div>
      </div>

      {/* Row 3: Historial de Condiciones + Ausencias */}
      <div className="mt-4 grid grid-cols-2 gap-4">
        {/* Historial de Condiciones */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Historial de Condiciones
          </p>
          {condicionesHistoricas.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin historial previo.</p>
          ) : (
            <div className="space-y-3">
              {condicionesHistoricas.map((c) => {
                const cRango = rangoMap.get(c.rango_id)
                const cPuesto = puestoMap.get(c.puesto_id)
                return (
                  <div key={c.id} className="rounded-lg border border-border/50 p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-semibold">{cPuesto?.nombre ?? '—'} · {cRango?.nombre ?? '—'}</span>
                      <span className="text-xs text-muted-foreground">
                        {formatDate(c.fecha_inicio)} → {c.fecha_fin ? formatDate(c.fecha_fin) : 'actual'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatMoney(c.salario_bruto_anual)}</span>
                      <span>{c.tipo_contrato}</span>
                      <span>{c.jornada}</span>
                      <span>{c.horas_semana}h/sem</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Ausencias */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Ausencias
          </p>
          {ausencias.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">Sin ausencias registradas.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[10px] uppercase text-muted-foreground">
                  <th className="pb-2 font-semibold">Tipo</th>
                  <th className="pb-2 font-semibold">Desde</th>
                  <th className="pb-2 font-semibold">Hasta</th>
                  <th className="pb-2 font-semibold text-right">Días</th>
                  <th className="pb-2 font-semibold text-right">Estado</th>
                </tr>
              </thead>
              <tbody>
                {ausencias.map((a) => (
                  <tr key={a.id} className="border-t border-border/50">
                    <td className="py-2">{a.tipo}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(a.fecha_inicio)}</td>
                    <td className="py-2 text-muted-foreground">{formatDate(a.fecha_fin)}</td>
                    <td className="py-2 text-right">{a.dias_habiles ?? '—'}</td>
                    <td className="py-2 text-right">
                      <StatusBadge status={a.estado} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
