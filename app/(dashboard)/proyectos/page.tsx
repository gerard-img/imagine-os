import {
  getProyectos,
  getEmpresas,
  getEmpresasGrupo,
  getProyectosDepartamentos,
  getDepartamentos,
  getPersonas,
  getCatalogoServicios,
} from '@/lib/supabase/queries'
import ProyectosClient from './proyectos-client'

export default async function ProyectosPage() {
  const [proyectos, empresas, empresasGrupo, proyectosDepts, departamentos, personas, servicios] =
    await Promise.all([
      getProyectos(),
      getEmpresas(),
      getEmpresasGrupo(),
      getProyectosDepartamentos(),
      getDepartamentos(),
      getPersonas(),
      getCatalogoServicios(),
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
    />
  )
}
