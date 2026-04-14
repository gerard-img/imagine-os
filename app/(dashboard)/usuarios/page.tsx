import {
  getPersonas, getEmpresasGrupo, getRoles,
  getDepartamentos, getDivisiones, getPersonasDepartamentos,
} from '@/lib/supabase/queries'
import UsuariosClient from './usuarios-client'

export default async function UsuariosPage() {
  const [personas, empresasGrupo, roles, departamentos, divisiones, personasDepartamentos] = await Promise.all([
    getPersonas(),
    getEmpresasGrupo(),
    getRoles(),
    getDepartamentos(),
    getDivisiones(),
    getPersonasDepartamentos(),
  ])

  return (
    <UsuariosClient
      personas={personas}
      empresasGrupo={empresasGrupo}
      roles={roles}
      departamentos={departamentos}
      divisiones={divisiones}
      personasDepartamentos={personasDepartamentos}
    />
  )
}
