import 'server-only'
import { createClient } from './server'

/**
 * Busca la persona vinculada al usuario autenticado.
 * Si el email coincide con un registro en `personas` pero aún no está vinculado,
 * actualiza auth_user_id para vincularlos.
 *
 * Devuelve la persona con su rol, o null si no tiene acceso.
 */
export async function getPersonaAutenticada() {
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Intentar buscar persona ya vinculada por auth_user_id
  const { data: personaVinculada } = await supabase
    .from('personas')
    .select('id, nombre, apellido_primero, email_corporativo, empresa_grupo_id, rol_id, roles(nombre, nivel_acceso)')
    .eq('auth_user_id', user.id)
    .single()

  if (personaVinculada) return personaVinculada

  // 2. Si no está vinculada, buscar por email corporativo
  const { data: personaPorEmail } = await supabase
    .from('personas')
    .select('id, nombre, apellido_primero, email_corporativo, empresa_grupo_id, rol_id, roles(nombre, nivel_acceso)')
    .eq('email_corporativo', user.email)
    .single()

  if (!personaPorEmail) return null // No tiene acceso

  // 3. Vincular auth_user_id a la persona encontrada (vía función SECURITY DEFINER
  //    para evitar el problema huevo/gallina con RLS)
  await supabase.rpc('vincular_persona_por_email', {
    p_auth_user_id: user.id,
    p_email: user.email,
  })

  return personaPorEmail
}
