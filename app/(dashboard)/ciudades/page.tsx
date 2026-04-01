import { getCiudades } from '@/lib/supabase/queries'
import { CiudadesClient } from './ciudades-client'

export default async function CiudadesPage() {
  const ciudades = await getCiudades()

  return <CiudadesClient ciudades={ciudades} />
}
