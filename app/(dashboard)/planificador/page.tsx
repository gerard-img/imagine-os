import {
  getOrdenesTrabajo,
  getAsignaciones,
  getPersonas,
  getProyectos,
  getProyectosDepartamentos,
  getDepartamentos,
  getCatalogoServicios,
  getEmpresas,
  getCuotasPlanificacion,
  getPersonasDepartamentos,
  getHorasTrabajables,
} from '@/lib/supabase/queries'
import { PlanificadorClient } from './planificador-client'

export default async function PlanificadorPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const [
    ordenesTrabajo,
    asignaciones,
    personas,
    proyectos,
    proyectosDepartamentos,
    departamentos,
    catalogoServicios,
    empresas,
    cuotasPlanificacion,
    personasDepartamentos,
    horasTrabajables,
  ] = await Promise.all([
    getOrdenesTrabajo(),
    getAsignaciones(),
    getPersonas(),
    getProyectos(),
    getProyectosDepartamentos(),
    getDepartamentos(),
    getCatalogoServicios(),
    getEmpresas(),
    getCuotasPlanificacion(),
    getPersonasDepartamentos(),
    getHorasTrabajables(),
  ])

  return (
    <PlanificadorClient
      ordenesTrabajo={ordenesTrabajo}
      asignaciones={asignaciones}
      personas={personas}
      proyectos={proyectos}
      proyectosDepartamentos={proyectosDepartamentos}
      departamentos={departamentos}
      catalogoServicios={catalogoServicios}
      empresas={empresas}
      cuotasPlanificacion={cuotasPlanificacion}
      personasDepartamentos={personasDepartamentos}
      horasTrabajables={horasTrabajables}
      initialMonth={mes}
    />
  )
}
