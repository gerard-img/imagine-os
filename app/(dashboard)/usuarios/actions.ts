'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string }

/**
 * Invitar usuario: crea cuenta auth y envía email de invitación.
 * El usuario recibirá un enlace para establecer su contraseña.
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

  const admin = createAdminClient()

  // Invitar por email: Supabase crea el usuario y envía el email automáticamente
  const { data: invited, error: inviteErr } = await admin.auth.admin.inviteUserByEmail(
    persona.email_corporativo,
    {
      data: { persona_nombre: persona.persona },
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?type=invite`,
    }
  )

  if (inviteErr || !invited?.user) {
    const detail = inviteErr ? `${inviteErr.message} (status: ${inviteErr.status})` : 'Error al invitar'
    return { success: false, error: detail }
  }

  // Vincular auth_user_id a la persona
  const { error: linkErr } = await admin
    .from('personas')
    .update({ auth_user_id: invited.user.id })
    .eq('id', personaId)

  if (linkErr) return { success: false, error: `Invitación enviada pero error al vincular: ${linkErr.message}` }

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
 * Usa resetPasswordForEmail que sí envía el email automáticamente.
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
  const { error } = await admin.auth.resetPasswordForEmail(
    persona.email_corporativo,
    {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/auth/callback?type=recovery`,
    }
  )

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

  // 1. Eliminar auth user primero (si falla, no tocamos nada en personas)
  const { error: delErr } = await admin.auth.admin.deleteUser(persona.auth_user_id)
  if (delErr) return { success: false, error: `Error al eliminar cuenta auth: ${delErr.message}` }

  // 2. Desvincular y reactivar persona (para que pueda ser re-invitada)
  const { error: unlinkErr } = await admin
    .from('personas')
    .update({ auth_user_id: null, activo: true })
    .eq('id', personaId)

  if (unlinkErr) return { success: false, error: `Cuenta eliminada pero error al desvincular: ${unlinkErr.message}` }

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
