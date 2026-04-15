import {
  getOrdenesTrabajoEnRango,
  getAsignacionesEnRango,
  getHorasTrabajablesEnRango,
  getPersonas,
  getProyectos,
  getEmpresas,
  getCuotasPlanificacion,
  getPersonasDepartamentos,
  getEmpresasGrupo,
  getDepartamentos,
} from '@/lib/supabase/queries'
import { defaultDateRange, rangoParaServidor } from '@/lib/date-range-utils'
import { DatosFocoClient } from './datos-foco-client'

export default async function DatosFocoPage({
  searchParams,
}: {
  searchParams: Promise<{ desde?: string; hasta?: string }>
}) {
  const { desde: desdeParam, hasta: hastaParam } = await searchParams
  const def = defaultDateRange()
  const desde = desdeParam || def.desde
  const hasta = hastaParam || def.hasta
  const rango = rangoParaServidor(desde, hasta)

  const [
    ordenesTrabajo,
    asignaciones,
    horasTrabajables,
    personas,
    proyectos,
    empresas,
    cuotas,
    personasDepartamentos,
    empresasGrupo,
    departamentos,
  ] = await Promise.all([
    getOrdenesTrabajoEnRango(rango.desde, rango.hasta),
    getAsignacionesEnRango(rango.desde, rango.hasta),
    getHorasTrabajablesEnRango(rango.desde, rango.hasta),
    getPersonas(),
    getProyectos(),
    getEmpresas(),
    getCuotasPlanificacion(),
    getPersonasDepartamentos(),
    getEmpresasGrupo(),
    getDepartamentos(),
  ])

  return (
    <DatosFocoClient
      ordenesTrabajo={ordenesTrabajo}
      asignaciones={asignaciones}
      personas={personas}
      proyectos={proyectos}
      empresas={empresas}
      cuotas={cuotas}
      horasTrabajables={horasTrabajables}
      personasDepartamentos={personasDepartamentos}
      empresasGrupo={empresasGrupo}
      departamentos={departamentos}
    />
  )
}
