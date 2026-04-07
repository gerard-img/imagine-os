import 'server-only'
import { createClient } from '@supabase/supabase-js'

/**
 * Cliente Supabase con service_role key.
 * Salta RLS — usar SOLO en Server Actions para operaciones admin.
 * Nunca importar desde Client Components.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}
