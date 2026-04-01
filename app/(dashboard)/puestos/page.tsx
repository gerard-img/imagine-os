import { getPuestos, getEmpresasGrupo } from '@/lib/supabase/queries'
import { PuestosClient } from './puestos-client'

export default async function PuestosPage() {
  const [puestos, empresas] = await Promise.all([getPuestos(), getEmpresasGrupo()])

  return <PuestosClient puestos={puestos} empresas={empresas} />
}
