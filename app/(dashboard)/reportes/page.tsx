import {
  getOrdenesTrabajo,
  getAsignaciones,
  getProyectos,
  getEmpresas,
  getPersonas,
  getCuotasPlanificacion,
  getDepartamentos,
  getCatalogoServicios,
  getEmpresasGrupo,
} from '@/lib/supabase/queries'
import { ReportesClient } from './reportes-client'

export default async function ReportesPage() {
  const [
    ordenes, asignaciones, proyectos, empresas,
    personas, cuotas, departamentos, servicios, empresasGrupo,
  ] = await Promise.all([
    getOrdenesTrabajo(),
    getAsignaciones(),
    getProyectos(),
    getEmpresas(),
    getPersonas(),
    getCuotasPlanificacion(),
    getDepartamentos(),
    getCatalogoServicios(),
    getEmpresasGrupo(),
  ])

  return (
    <ReportesClient
      ordenes={ordenes}
      asignaciones={asignaciones}
      proyectos={proyectos}
      empresas={empresas}
      personas={personas}
      cuotas={cuotas}
      departamentos={departamentos}
      servicios={servicios}
      empresasGrupo={empresasGrupo}
    />
  )
}
