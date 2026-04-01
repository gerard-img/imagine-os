import {
  getOrdenesTrabajo,
  getOrdenesTrabajoPersonas,
  getProyectos,
  getCatalogoServicios,
  getEmpresas,
  getDepartamentos,
  getPersonas,
  getAsignaciones,
  getCuotasPlanificacion,
} from '@/lib/supabase/queries'
import { OrdenesTrabajoClient } from './ordenes-trabajo-client'

export default async function OrdenesTrabajoPage() {
  const [
    ordenesTrabajo,
    ordenesPersonas,
    proyectos,
    servicios,
    empresas,
    departamentos,
    personas,
    asignaciones,
    cuotas,
  ] = await Promise.all([
    getOrdenesTrabajo(),
    getOrdenesTrabajoPersonas(),
    getProyectos(),
    getCatalogoServicios(),
    getEmpresas(),
    getDepartamentos(),
    getPersonas(),
    getAsignaciones(),
    getCuotasPlanificacion(),
  ])

  return (
    <OrdenesTrabajoClient
      ordenesTrabajo={ordenesTrabajo}
      ordenesPersonas={ordenesPersonas}
      proyectos={proyectos}
      servicios={servicios}
      empresas={empresas}
      departamentos={departamentos}
      personas={personas}
      asignaciones={asignaciones}
      cuotas={cuotas}
    />
  )
}
