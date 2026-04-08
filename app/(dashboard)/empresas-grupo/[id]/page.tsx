import { notFound } from 'next/navigation'
import {
  getEmpresaGrupoById,
  getCatalogoServicios,
  getDepartamentos,
  getRangosInternos,
  getPuestos,
  getPersonas,
} from '@/lib/supabase/queries'
import { EGDetalleClient } from './eg-detalle-client'

export default async function EmpresaGrupoDetallePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const eg = await getEmpresaGrupoById(id)
  if (!eg) notFound()

  const [servicios, departamentos, rangos, puestos, personas] = await Promise.all([
    getCatalogoServicios(),
    getDepartamentos(),
    getRangosInternos(),
    getPuestos(),
    getPersonas(),
  ])

  return (
    <EGDetalleClient
      eg={eg}
      servicios={servicios.filter((s) => s.empresa_grupo_id === eg.id)}
      departamentos={departamentos.filter((d) => d.empresa_grupo_id === eg.id)}
      rangos={rangos.filter((r) => r.empresa_grupo_id === eg.id)}
      puestos={puestos.filter((p) => p.empresa_grupo_id === eg.id)}
      personas={personas.filter((p) => p.empresa_grupo_id === eg.id)}
    />
  )
}
