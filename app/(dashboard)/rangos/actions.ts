'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Schema de validación ──

const rangoSchema = z.object({
  empresa_grupo_id: z.string().uuid('Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  codigo: z.string().min(1, 'El código es obligatorio').max(20, 'El código no puede superar los 20 caracteres'),
  orden: z.coerce.number().min(1, 'El orden debe ser al menos 1'),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear rango ──

export async function crearRango(formData: unknown): Promise<ActionResult> {
  const parsed = rangoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('rangos_internos').insert({
    empresa_grupo_id: parsed.data.empresa_grupo_id,
    nombre: parsed.data.nombre,
    codigo: parsed.data.codigo,
    orden: parsed.data.orden,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un rango con ese código en esta empresa' }
    }
    return { success: false, error: `Error al crear el rango: ${error.message}` }
  }

  revalidatePath('/rangos')
  revalidatePath('/personas')

  return { success: true }
}

// ── Actualizar rango ──

export async function actualizarRango(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = rangoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('rangos_internos')
    .update({
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo,
      orden: parsed.data.orden,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un rango con ese código en esta empresa' }
    }
    return { success: false, error: `Error al actualizar el rango: ${error.message}` }
  }

  revalidatePath('/rangos')
  revalidatePath('/personas')

  return { success: true }
}
