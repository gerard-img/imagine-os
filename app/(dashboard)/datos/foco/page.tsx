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
  getDepartamentos,
} from '@/lib/supabase/queries'
import { DatosFocoClient } from './datos-foco-client'

export default async function DatosFocoPage() {
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
