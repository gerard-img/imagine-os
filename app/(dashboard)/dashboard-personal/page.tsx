import { redirect } from 'next/navigation'
import { getPersonaAutenticada } from '@/lib/supabase/auth-helpers'
import {
  getAsignaciones,
  getOrdenesTrabajo,
  getProyectos,
  getEmpresas,
  getCatalogoServicios,
  getCuotasPlanificacion,
  getHorasTrabajables,
  getPersonasDepartamentos,
} from '@/lib/supabase/queries'
import DashboardPersonalClient from './dashboard-personal-client'

export default async function DashboardPersonalPage() {
  const persona = await getPersonaAutenticada()
  if (!persona) redirect('/sin-acceso')

  const [
    asignaciones, ordenesTrabajo, proyectos, empresas,
    servicios, cuotas, horasTrabajables, personasDepartamentos,
  ] = await Promise.all([
    getAsignaciones(),
    getOrdenesTrabajo(),
    getProyectos(),
    getEmpresas(),
    getCatalogoServicios(),
    getCuotasPlanificacion(),
    getHorasTrabajables(),
    getPersonasDepartamentos(),
  ])

  return (
    <DashboardPersonalClient
      personaId={persona.id}
      personaNombre={persona.nombre}
      empresaGrupoId={persona.empresa_grupo_id}
      asignaciones={asignaciones}
      ordenesTrabajo={ordenesTrabajo}
      proyectos={proyectos}
      empresas={empresas}
      servicios={servicios}
      cuotas={cuotas}
      horasTrabajables={horasTrabajables}
      personasDepartamentos={personasDepartamentos}
    />
  )
}
