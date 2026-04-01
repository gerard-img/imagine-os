import {
  getOrdenesTrabajo,
  getAsignaciones,
  getPersonas,
  getProyectos,
  getEmpresas,
  getCuotasPlanificacion,
  getHorasTrabajables,
  getPersonasDepartamentos,
  getEmpresasGrupo,
  getCatalogoServicios,
  getDepartamentos,
} from '@/lib/supabase/queries'
import { CargasClient } from './cargas-client'

export default async function CargasTrabajoPage() {
  const [
    ordenesTrabajo,
    asignaciones,
    personas,
    proyectos,
    empresas,
    cuotas,
    horasTrabajables,
    personasDepartamentos,
    empresasGrupo,
    servicios,
    departamentos,
  ] = await Promise.all([
    getOrdenesTrabajo(),
    getAsignaciones(),
    getPersonas(),
    getProyectos(),
    getEmpresas(),
    getCuotasPlanificacion(),
    getHorasTrabajables(),
    getPersonasDepartamentos(),
    getEmpresasGrupo(),
    getCatalogoServicios(),
    getDepartamentos(),
  ])

  return (
    <CargasClient
      ordenesTrabajo={ordenesTrabajo}
      asignaciones={asignaciones}
      personas={personas}
      proyectos={proyectos}
      empresas={empresas}
      cuotas={cuotas}
      horasTrabajables={horasTrabajables}
      personasDepartamentos={personasDepartamentos}
      empresasGrupo={empresasGrupo}
      servicios={servicios}
      departamentos={departamentos}
    />
  )
}
