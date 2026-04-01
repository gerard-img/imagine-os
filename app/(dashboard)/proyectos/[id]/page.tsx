import { notFound } from 'next/navigation'
import {
  getProyectoById,
  getProyectos,
  getProyectosDepartamentosByProyecto,
  getOrdenesTrabajoByProyecto,
  getAsignaciones,
  getCatalogoServicios,
  getCuotasPlanificacion,
  getPersonas,
  getDepartamentos,
  getEmpresas,
  getEmpresasGrupo,
  getOrdenesTrabajoPersonas,
} from '@/lib/supabase/queries'
import { ProyectoDetalleClient } from './proyecto-detalle-client'

export default async function ProyectoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const proyecto = await getProyectoById(id)
  if (!proyecto) notFound()

  const [
    proyectos, proyDepts, ordenes, asignaciones, servicios, cuotas,
    personas, departamentos, empresas, empresasGrupo, ordenesPersonas,
  ] = await Promise.all([
    getProyectos(),
    getProyectosDepartamentosByProyecto(id),
    getOrdenesTrabajoByProyecto(id),
    getAsignaciones(),
    getCatalogoServicios(),
    getCuotasPlanificacion(),
    getPersonas(),
    getDepartamentos(),
    getEmpresas(),
    getEmpresasGrupo(),
    getOrdenesTrabajoPersonas(),
  ])

  return (
    <ProyectoDetalleClient
      proyecto={proyecto}
      proyectos={proyectos}
      proyDepts={proyDepts}
      ordenes={ordenes}
      asignaciones={asignaciones}
      servicios={servicios}
      cuotas={cuotas}
      personas={personas}
      departamentos={departamentos}
      empresas={empresas}
      empresasGrupo={empresasGrupo}
      ordenesPersonas={ordenesPersonas}
    />
  )
}
