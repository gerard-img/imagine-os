import { notFound } from 'next/navigation'
import {
  getEmpresaById,
  getContactosEmpresasByEmpresa,
  getProyectosByEmpresa,
  getOrdenesTrabajo,
  getAsignaciones,
  getCatalogoServicios,
  getCuotasPlanificacion,
  getPersonas,
  getPersonasDepartamentos,
  getDepartamentos,
  getPuestos,
  getEmpresasGrupo,
} from '@/lib/supabase/queries'
import { EmpresaDetalleClient } from './empresa-detalle-client'

export default async function EmpresaDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const empresa = await getEmpresaById(id)
  if (!empresa) notFound()

  const [
    contactos, proyectos, ordenesTrabajo, asignaciones,
    servicios, cuotas, personas, personasDepts, departamentos, puestos,
    empresasGrupo,
  ] = await Promise.all([
    getContactosEmpresasByEmpresa(id),
    getProyectosByEmpresa(id),
    getOrdenesTrabajo(),
    getAsignaciones(),
    getCatalogoServicios(),
    getCuotasPlanificacion(),
    getPersonas(),
    getPersonasDepartamentos(),
    getDepartamentos(),
    getPuestos(),
    getEmpresasGrupo(),
  ])

  return (
    <EmpresaDetalleClient
      empresa={empresa}
      contactos={contactos}
      proyectos={proyectos}
      ordenesTrabajo={ordenesTrabajo}
      asignaciones={asignaciones}
      servicios={servicios}
      cuotas={cuotas}
      personas={personas}
      personasDepts={personasDepts}
      departamentos={departamentos}
      puestos={puestos}
      empresasGrupo={empresasGrupo}
    />
  )
}
