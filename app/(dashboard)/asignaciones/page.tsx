import {
  getAsignaciones,
  getOrdenesTrabajo,
  getProyectos,
  getCatalogoServicios,
  getDepartamentos,
  getPersonas,
  getCuotasPlanificacion,
  getEmpresas,
  getPersonasDepartamentos,
  getHorasTrabajables,
} from '@/lib/supabase/queries'
import { safeDivide, resolverHoras } from '@/lib/helpers'
import { AsignacionesClient } from './asignaciones-client'

/** Enriched row type passed to the client component */
export type AsignacionRow = {
  id: string
  mes: string
  proyectoId: string
  proyectoTitulo: string
  clienteNombre: string
  servicioNombre: string
  personaNombre: string
  cuotaNombre: string
  porcentaje: number
  ingresosAsignados: number
  ingresosReales: number | null
  horasDedicar: number
  /** Horas totales asignadas a esta persona en este mes (todas sus asignaciones) */
  horasPersonaMes: number
  /** Horas disponibles de esta persona en este mes */
  horasDisponibles: number
}

export default async function AsignacionesPage() {
  // Fetch all data in parallel from Supabase
  const [asignaciones, ordenes, proyectos, servicios, personas, cuotas, empresas, persDepts, horasTrab, departamentos] =
    await Promise.all([
      getAsignaciones(),
      getOrdenesTrabajo(),
      getProyectos(),
      getCatalogoServicios(),
      getPersonas(),
      getCuotasPlanificacion(),
      getEmpresas(),
      getPersonasDepartamentos(),
      getHorasTrabajables(),
      getDepartamentos(),
    ])

  // Build lookup maps for fast access
  const ordenMap = new Map(ordenes.map((o) => [o.id, o]))
  const personaMap = new Map(personas.map((p) => [p.id, p]))

  // Mapa persona_id → departamento_ids
  const personaDeptIds = new Map<string, string[]>()
  for (const pd of persDepts) {
    const arr = personaDeptIds.get(pd.persona_id) ?? []
    arr.push(pd.departamento_id)
    personaDeptIds.set(pd.persona_id, arr)
  }

  // Precalcular horas totales asignadas por (persona_id, mes)
  const horasAsigMap = new Map<string, number>()
  for (const a of asignaciones) {
    const orden = ordenMap.get(a.orden_trabajo_id)
    if (!orden) continue
    const cuota = cuotas.find((c) => c.id === a.cuota_planificacion_id)
    if (!cuota) continue
    const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
    const horas = safeDivide(ingresos, cuota.precio_hora)
    const key = `${a.persona_id}::${orden.mes_anio}`
    horasAsigMap.set(key, (horasAsigMap.get(key) ?? 0) + horas)
  }
  const proyectoMap = new Map(proyectos.map((p) => [p.id, p]))
  const servicioMap = new Map(servicios.map((s) => [s.id, s]))
  const cuotaMap = new Map(cuotas.map((c) => [c.id, c]))
  const empresaMap = new Map(empresas.map((e) => [e.id, e]))

  // Build enriched rows
  const rows: AsignacionRow[] = asignaciones.map((a) => {
    const orden = ordenMap.get(a.orden_trabajo_id)
    const proyecto = orden ? proyectoMap.get(orden.proyecto_id) : undefined
    const servicio = orden?.servicio_id ? servicioMap.get(orden.servicio_id) : undefined
    const persona = personaMap.get(a.persona_id)
    const cuota = cuotaMap.get(a.cuota_planificacion_id)

    const partidaPrevista = orden?.partida_prevista ?? 0
    const partidaReal = orden?.partida_real ?? null
    const ingresosAsignados = partidaPrevista * (a.porcentaje_ppto_tm / 100)
    const ingresosReales =
      partidaReal !== null ? partidaReal * (a.porcentaje_ppto_tm / 100) : null
    const horasDedicar = safeDivide(ingresosAsignados, cuota?.precio_hora ?? 0)

    return {
      id: a.id,
      mes: orden?.mes_anio ?? '',
      proyectoId: orden?.proyecto_id ?? '',
      proyectoTitulo: proyecto?.titulo ?? '',
      clienteNombre: (() => {
        const emp = proyecto?.empresa_id ? empresaMap.get(proyecto.empresa_id) : null
        return emp?.nombre_interno ?? emp?.nombre_legal ?? 'Interno'
      })(),
      servicioNombre: servicio?.nombre ?? '',
      personaNombre: persona?.persona ?? '',
      cuotaNombre: cuota?.nombre ?? '—',
      porcentaje: a.porcentaje_ppto_tm,
      ingresosAsignados,
      ingresosReales,
      horasDedicar,
      horasPersonaMes: horasAsigMap.get(`${a.persona_id}::${orden?.mes_anio ?? ''}`) ?? 0,
      horasDisponibles: persona
        ? resolverHoras(
            persona.id,
            orden?.mes_anio ?? '',
            persona.empresa_grupo_id,
            personaDeptIds.get(persona.id) ?? [],
            horasTrab,
          )
        : 0,
    }
  })

  // Get available months from ordenes
  const availableMonths = [
    ...new Set(ordenes.map((ot) => ot.mes_anio)),
  ].sort()
  const months = availableMonths.length > 0 ? availableMonths : ['2026-01-01']

  return (
    <AsignacionesClient
      rows={rows}
      availableMonths={months}
      ordenesTrabajo={ordenes}
      proyectos={proyectos}
      empresas={empresas}
      personas={personas}
      cuotas={cuotas}
      asignaciones={asignaciones}
      servicios={servicios}
      departamentos={departamentos}
    />
  )
}
