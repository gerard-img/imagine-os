'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_ADMIN } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ERROR_SIN_PERMISO = 'No tienes permiso para gestionar roles del sistema'

// ── Schema de validación ──

const rolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().max(500, 'La descripción no puede superar los 500 caracteres').optional(),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear rol ──

export async function crearRol(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_ADMIN)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = rolSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('roles').insert({
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un rol con ese nombre' }
    }
    return { success: false, error: `Error al crear el rol: ${error.message}` }
  }

  revalidatePath('/roles-sistema')
  revalidatePath('/personas')

  return { success: true }
}

// ── Actualizar rol ──

export async function actualizarRol(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_ADMIN)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = rolSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('roles')
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un rol con ese nombre' }
    }
    return { success: false, error: `Error al actualizar el rol: ${error.message}` }
  }

  revalidatePath('/roles-sistema')
  revalidatePath('/personas')

  return { success: true }
}
