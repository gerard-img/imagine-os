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
import { DatosTiempoClient } from './datos-tiempo-client'

export default async function DatosTiempoPage() {
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
    <DatosTiempoClient
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
