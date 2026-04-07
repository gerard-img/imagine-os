import { getPersonas, getEmpresasGrupo, getRoles } from '@/lib/supabase/queries'
import UsuariosClient from './usuarios-client'

export default async function UsuariosPage() {
  const [personas, empresasGrupo, roles] = await Promise.all([
    getPersonas(),
    getEmpresasGrupo(),
    getRoles(),
  ])

  return (
    <UsuariosClient
      personas={personas}
      empresasGrupo={empresasGrupo}
      roles={roles}
    />
  )
}
