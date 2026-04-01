import {
  getEmpresasGrupo,
  getCatalogoServicios,
  getDepartamentos,
  getRangosInternos,
  getPuestos,
  getDivisiones,
  getRoles,
  getPersonas,
} from '@/lib/supabase/queries'
import { EmpresasGrupoClient } from './empresas-grupo-client'

export default async function EmpresasGrupoPage() {
  const [empresasGrupo, catalogoServicios, departamentos, rangosInternos, puestos, divisiones, roles, personas] =
    await Promise.all([
      getEmpresasGrupo(),
      getCatalogoServicios(),
      getDepartamentos(),
      getRangosInternos(),
      getPuestos(),
      getDivisiones(),
      getRoles(),
      getPersonas(),
    ])

  return (
    <EmpresasGrupoClient
      empresasGrupo={empresasGrupo}
      catalogoServicios={catalogoServicios}
      departamentos={departamentos}
      rangosInternos={rangosInternos}
      puestos={puestos}
      divisiones={divisiones}
      roles={roles}
      personas={personas}
    />
  )
}
