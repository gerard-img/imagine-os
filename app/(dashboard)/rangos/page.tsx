import { getRangosInternos, getEmpresasGrupo } from '@/lib/supabase/queries'
import { RangosClient } from './rangos-client'

export default async function RangosPage() {
  const [rangos, empresas] = await Promise.all([getRangosInternos(), getEmpresasGrupo()])

  return <RangosClient rangos={rangos} empresas={empresas} />
}
