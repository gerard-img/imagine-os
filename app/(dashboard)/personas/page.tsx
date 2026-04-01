import {
  getPersonas,
  getPersonasDepartamentos,
  getDepartamentos,
  getDivisiones,
  getRoles,
  getEmpresasGrupo,
  getPuestos,
  getAsignaciones,
  getOrdenesTrabajo,
  getEmpresas,
  getProyectos,
  getCuotasPlanificacion,
} from '@/lib/supabase/queries'
import PersonasClient from './personas-client'

export default async function PersonasPage() {
  const [
    personas,
    personasDepartamentos,
    departamentos,
    divisiones,
    roles,
    empresasGrupo,
    puestos,
    asignaciones,
    ordenesTrabajo,
    empresas,
    proyectos,
    cuotasPlanificacion,
  ] = await Promise.all([
    getPersonas(),
    getPersonasDepartamentos(),
    getDepartamentos(),
    getDivisiones(),
    getRoles(),
    getEmpresasGrupo(),
    getPuestos(),
    getAsignaciones(),
    getOrdenesTrabajo(),
    getEmpresas(),
    getProyectos(),
    getCuotasPlanificacion(),
  ])

  return (
    <PersonasClient
      personas={personas}
      personasDepartamentos={personasDepartamentos}
      departamentos={departamentos}
      divisiones={divisiones}
      roles={roles}
      empresasGrupo={empresasGrupo}
      puestos={puestos}
      asignaciones={asignaciones}
      ordenesTrabajo={ordenesTrabajo}
      empresas={empresas}
      proyectos={proyectos}
      cuotasPlanificacion={cuotasPlanificacion}
    />
  )
}
