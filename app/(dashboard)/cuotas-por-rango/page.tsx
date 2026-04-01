import { getCuotasPlanificacion, getEmpresasGrupo } from '@/lib/supabase/queries'
import { CuotasClient } from './cuotas-client'

export default async function CuotasPlanificacionPage() {
  const [cuotas, empresasGrupo] = await Promise.all([
    getCuotasPlanificacion(),
    getEmpresasGrupo(),
  ])

  return <CuotasClient cuotas={cuotas} empresasGrupo={empresasGrupo} />
}
