import {
  getProyectos,
  getEmpresas,
  getEmpresasGrupo,
  getProyectosDepartamentos,
  getDepartamentos,
  getPersonas,
  getCatalogoServicios,
  getServiciosYDepts,
} from '@/lib/supabase/queries'
import ProyectosClient from './proyectos-client'

export default async function ProyectosPage() {
  const [proyectos, empresas, empresasGrupo, proyectosDepts, departamentos, personas, servicios, serviciosYDepts] =
    await Promise.all([
      getProyectos(),
      getEmpresas(),
      getEmpresasGrupo(),
      getProyectosDepartamentos(),
      getDepartamentos(),
      getPersonas(),
      getCatalogoServicios(),
      getServiciosYDepts(),
    ])

  return (
    <ProyectosClient
      proyectos={proyectos}
      empresas={empresas}
      empresasGrupo={empresasGrupo}
      proyectosDepartamentos={proyectosDepts}
      departamentos={departamentos}
      personas={personas}
      servicios={servicios}
      serviciosYDepts={serviciosYDepts}
    />
  )
}
