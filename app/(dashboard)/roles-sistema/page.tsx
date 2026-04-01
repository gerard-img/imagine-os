import { getRoles } from '@/lib/supabase/queries'
import { RolesClient } from './roles-client'

export default async function RolesPage() {
  const roles = await getRoles()

  return <RolesClient roles={roles} />
}
