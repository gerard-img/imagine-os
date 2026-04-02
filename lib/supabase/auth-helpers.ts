import 'server-only'
import { cookies } from 'next/headers'
import { createClient } from './server'

/**
 * Busca la persona vinculada al usuario autenticado.
 * Si el email coincide con un registro en `personas` pero aún no está vinculado,
 * actualiza auth_user_id para vincularlos.
 *
 * Además guarda el nivel_acceso en una cookie para que el middleware
 * pueda proteger rutas sin hacer queries extra.
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

  if (personaVinculada) {
    await guardarNivelAccesoCookie(personaVinculada)
    return personaVinculada
  }

  // 2. Si no está vinculada, buscar por email corporativo
  const { data: personaPorEmail } = await supabase
    .from('personas')
    .select('id, nombre, apellido_primero, email_corporativo, empresa_grupo_id, rol_id, roles(nombre, nivel_acceso)')
    .eq('email_corporativo', user.email)
    .single()

  if (!personaPorEmail) return null // No tiene acceso

  // 3. Vincular auth_user_id a la persona encontrada
  await supabase
    .from('personas')
    .update({ auth_user_id: user.id })
    .eq('id', personaPorEmail.id)

  await guardarNivelAccesoCookie(personaPorEmail)
  return personaPorEmail
}

/**
 * Guarda el nivel_acceso en una cookie httpOnly para que el middleware
 * pueda hacer la verificación de rutas sin consultar la BBDD.
 */
async function guardarNivelAccesoCookie(persona: Record<string, unknown>) {
  const roles = persona.roles as { nivel_acceso: string } | null
  const nivelAcceso = roles?.nivel_acceso
  if (!nivelAcceso) return

  const cookieStore = await cookies()
  cookieStore.set('nivel_acceso', nivelAcceso, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24, // 24 horas
  })
}
