'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string }

/**
 * Invitar usuario: crea cuenta auth con email de la persona y envía invitación.
 * Si la persona ya tiene auth_user_id, devuelve error.
 */
export async function invitarUsuario(personaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Obtener persona
  const { data: persona, error: fetchErr } = await supabase
    .from('personas')
    .select('id, email_corporativo, auth_user_id, persona')
    .eq('id', personaId)
    .single()

  if (fetchErr || !persona) return { success: false, error: 'Persona no encontrada' }
  if (persona.auth_user_id) return { success: false, error: 'Esta persona ya tiene cuenta de acceso' }
  if (!persona.email_corporativo) return { success: false, error: 'La persona no tiene email corporativo' }

  // Crear usuario auth con invitación
  const admin = createAdminClient()
  const { data: authUser, error: authErr } = await admin.auth.admin.inviteUserByEmail(
    persona.email_corporativo,
    { data: { persona_nombre: persona.persona } }
  )

  if (authErr) return { success: false, error: authErr.message }

  // Vincular auth_user_id a la persona
  const { error: linkErr } = await admin
    .from('personas')
    .update({ auth_user_id: authUser.user.id })
    .eq('id', personaId)

  if (linkErr) return { success: false, error: `Usuario creado pero error al vincular: ${linkErr.message}` }

  revalidatePath('/usuarios')
  revalidatePath('/personas')
  return { success: true }
}

/**
 * Desactivar usuario: pone activo=false y banea la cuenta auth.
 */
export async function desactivarUsuario(personaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('id, auth_user_id')
    .eq('id', personaId)
    .single()

  if (!persona) return { success: false, error: 'Persona no encontrada' }

  // Desactivar persona
  const admin = createAdminClient()
  const { error: updErr } = await admin
    .from('personas')
    .update({ activo: false })
    .eq('id', personaId)

  if (updErr) return { success: false, error: updErr.message }

  // Banear auth user si existe
  if (persona.auth_user_id) {
    const { error: banErr } = await admin.auth.admin.updateUserById(
      persona.auth_user_id,
      { ban_duration: '876000h' } // ~100 años
    )
    if (banErr) return { success: false, error: `Persona desactivada, pero error al banear cuenta: ${banErr.message}` }
  }

  revalidatePath('/usuarios')
  revalidatePath('/personas')
  return { success: true }
}

/**
 * Reactivar usuario: pone activo=true y desbanea la cuenta auth.
 */
export async function reactivarUsuario(personaId: string): Promise<ActionResult> {
  const admin = createAdminClient()

  const { data: persona } = await admin
    .from('personas')
    .select('id, auth_user_id')
    .eq('id', personaId)
    .single()

  if (!persona) return { success: false, error: 'Persona no encontrada' }

  const { error: updErr } = await admin
    .from('personas')
    .update({ activo: true })
    .eq('id', personaId)

  if (updErr) return { success: false, error: updErr.message }

  // Desbanear auth user si existe
  if (persona.auth_user_id) {
    const { error: unbanErr } = await admin.auth.admin.updateUserById(
      persona.auth_user_id,
      { ban_duration: 'none' }
    )
    if (unbanErr) return { success: false, error: `Persona reactivada, pero error al desbanear cuenta: ${unbanErr.message}` }
  }

  revalidatePath('/usuarios')
  revalidatePath('/personas')
  return { success: true }
}

/**
 * Resetear contraseña: envía email de reset al email corporativo.
 */
export async function resetearPassword(personaId: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { data: persona } = await supabase
    .from('personas')
    .select('email_corporativo, auth_user_id')
    .eq('id', personaId)
    .single()

  if (!persona) return { success: false, error: 'Persona no encontrada' }
  if (!persona.auth_user_id) return { success: false, error: 'Esta persona no tiene cuenta de acceso' }
  if (!persona.email_corporativo) return { success: false, error: 'La persona no tiene email corporativo' }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.generateLink({
    type: 'recovery',
    email: persona.email_corporativo,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/usuarios')
  return { success: true }
}

/**
 * Eliminar cuenta auth: borra de auth.users y desvincula persona.
 * La persona se mantiene en la DB pero sin acceso.
 */
export async function eliminarCuentaAuth(personaId: string): Promise<ActionResult> {
  const admin = createAdminClient()

  const { data: persona } = await admin
    .from('personas')
    .select('id, auth_user_id')
    .eq('id', personaId)
    .single()

  if (!persona) return { success: false, error: 'Persona no encontrada' }
  if (!persona.auth_user_id) return { success: false, error: 'Esta persona no tiene cuenta de acceso' }

  // Desvincular primero (para no romper FK)
  const { error: unlinkErr } = await admin
    .from('personas')
    .update({ auth_user_id: null })
    .eq('id', personaId)

  if (unlinkErr) return { success: false, error: unlinkErr.message }

  // Eliminar auth user
  const { error: delErr } = await admin.auth.admin.deleteUser(persona.auth_user_id)
  if (delErr) return { success: false, error: `Desvinculada pero error al eliminar cuenta: ${delErr.message}` }

  revalidatePath('/usuarios')
  revalidatePath('/personas')
  return { success: true }
}

/**
 * Cambiar rol de una persona.
 */
export async function cambiarRol(personaId: string, rolId: string): Promise<ActionResult> {
  const admin = createAdminClient()

  const { error } = await admin
    .from('personas')
    .update({ rol_id: rolId })
    .eq('id', personaId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/usuarios')
  revalidatePath('/personas')
  return { success: true }
}
