import { getOficinas } from '@/lib/supabase/queries'
import { OficinasClient } from './oficinas-client'

export default async function OficinasPage() {
  const oficinas = await getOficinas()

  return <OficinasClient oficinas={oficinas} />
}
