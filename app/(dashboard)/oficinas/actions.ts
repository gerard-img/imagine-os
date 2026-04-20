'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types/action-result'
import { registrarAuditoria } from '@/lib/supabase/audit'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

// ── Schema de validación ──

const oficinaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
})

// ── Crear oficina ──

export async function crearOficina(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = oficinaSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('oficinas').insert({ nombre: parsed.data.nombre })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una oficina con ese nombre' }
    }
    return { success: false, error: `Error al crear la oficina: ${error.message}` }
  }

  revalidatePath('/oficinas')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'crear', tabla: 'oficinas' })
  return { success: true }
}

// ── Actualizar oficina ──

export async function actualizarOficina(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = oficinaSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('oficinas')
    .update({ nombre: parsed.data.nombre, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una oficina con ese nombre' }
    }
    return { success: false, error: `Error al actualizar la oficina: ${error.message}` }
  }

  revalidatePath('/oficinas')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'oficinas', registroId: id })
  return { success: true }
}
