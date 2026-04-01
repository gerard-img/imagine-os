import { getDivisiones } from '@/lib/supabase/queries'
import { DivisionesClient } from './divisiones-client'

export default async function DivisionesPage() {
  const divisiones = await getDivisiones()

  return <DivisionesClient divisiones={divisiones} />
}
