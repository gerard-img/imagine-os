'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

// ── Schema de validación ──

const ciudadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  pais: z.string().min(1, 'El país es obligatorio').max(100, 'El país no puede superar los 100 caracteres'),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear ciudad ──

export async function crearCiudad(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = ciudadSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('ciudades').insert({ nombre: parsed.data.nombre, pais: parsed.data.pais })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una ciudad con ese nombre' }
    }
    return { success: false, error: `Error al crear la ciudad: ${error.message}` }
  }

  revalidatePath('/ciudades')
  revalidatePath('/personas')

  return { success: true }
}

// ── Actualizar ciudad ──

export async function actualizarCiudad(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = ciudadSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('ciudades')
    .update({ nombre: parsed.data.nombre, pais: parsed.data.pais, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una ciudad con ese nombre' }
    }
    return { success: false, error: `Error al actualizar la ciudad: ${error.message}` }
  }

  revalidatePath('/ciudades')
  revalidatePath('/personas')

  return { success: true }
}
