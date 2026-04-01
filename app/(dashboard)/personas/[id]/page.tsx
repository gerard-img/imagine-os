import { notFound } from 'next/navigation'
import {
  getPersonaById,
  getPersonasDepartamentos,
  getDepartamentos,
  getEmpresasGrupo,
  getRangosInternos,
  getPuestos,
  getDivisiones,
  getRoles,
  getCiudades,
  getOficinas,
  getAsignacionesByPersona,
  getOrdenesTrabajo,
  getProyectos,
  getEmpresas,
  getCatalogoServicios,
  getCuotasPlanificacion,
} from '@/lib/supabase/queries'
import { PersonaDetalleClient } from './persona-detalle-client'

export default async function PersonaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const persona = await getPersonaById(id)
  if (!persona) notFound()

  const [
    personasDepts, departamentos, empresasGrupo, rangos, puestos,
    divisiones, roles, ciudades, oficinas, asignaciones,
    ordenesTrabajo, proyectos, empresas, servicios, cuotas,
  ] = await Promise.all([
    getPersonasDepartamentos(),
    getDepartamentos(),
    getEmpresasGrupo(),
    getRangosInternos(),
    getPuestos(),
    getDivisiones(),
    getRoles(),
    getCiudades(),
    getOficinas(),
    getAsignacionesByPersona(id),
    getOrdenesTrabajo(),
    getProyectos(),
    getEmpresas(),
    getCatalogoServicios(),
    getCuotasPlanificacion(),
  ])

  return (
    <PersonaDetalleClient
      persona={persona}
      personasDepts={personasDepts}
      departamentos={departamentos}
      empresasGrupo={empresasGrupo}
      rangos={rangos}
      puestos={puestos}
      divisiones={divisiones}
      roles={roles}
      ciudades={ciudades}
      oficinas={oficinas}
      asignaciones={asignaciones}
      ordenesTrabajo={ordenesTrabajo}
      proyectos={proyectos}
      empresas={empresas}
      servicios={servicios}
      cuotas={cuotas}
    />
  )
}
