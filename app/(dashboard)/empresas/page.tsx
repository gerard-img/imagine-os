import { getEmpresas } from '@/lib/supabase/queries'
import { EmpresasClient } from './empresas-client'

export default async function EmpresasPage() {
  const empresas = await getEmpresas()

  return <EmpresasClient empresas={empresas} />
}
