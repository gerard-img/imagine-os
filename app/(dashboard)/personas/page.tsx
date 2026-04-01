import {
  getPersonas,
  getPersonasDepartamentos,
  getDepartamentos,
  getDivisiones,
  getRoles,
  getEmpresasGrupo,
  getPuestos,
  getRangosInternos,
  getCiudades,
  getOficinas,
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
    rangos,
    ciudades,
    oficinas,
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
    getRangosInternos(),
    getCiudades(),
    getOficinas(),
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
      rangos={rangos}
      ciudades={ciudades}
      oficinas={oficinas}
      asignaciones={asignaciones}
      ordenesTrabajo={ordenesTrabajo}
      empresas={empresas}
      proyectos={proyectos}
      cuotasPlanificacion={cuotasPlanificacion}
    />
  )
}
