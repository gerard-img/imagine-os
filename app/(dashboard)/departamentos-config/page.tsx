import { getDepartamentos, getEmpresasGrupo } from '@/lib/supabase/queries'
import { DepartamentosClient } from './departamentos-client'

export default async function DepartamentosPage() {
  const [departamentos, empresas] = await Promise.all([getDepartamentos(), getEmpresasGrupo()])

  return <DepartamentosClient departamentos={departamentos} empresas={empresas} />
}
