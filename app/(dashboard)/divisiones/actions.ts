'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Schema de validacion ──

const divisionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional().or(z.literal('')),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear division ──

export async function crearDivision(formData: unknown): Promise<ActionResult> {
  const parsed = divisionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('divisiones').insert({
    nombre: parsed.data.nombre,
    descripcion: parsed.data.descripcion || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una division con ese nombre' }
    }
    return { success: false, error: `Error al crear la division: ${error.message}` }
  }

  revalidatePath('/divisiones')
  revalidatePath('/personas')

  return { success: true }
}

// ── Actualizar division ──

export async function actualizarDivision(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = divisionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('divisiones')
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una division con ese nombre' }
    }
    return { success: false, error: `Error al actualizar la division: ${error.message}` }
  }

  revalidatePath('/divisiones')
  revalidatePath('/personas')

  return { success: true }
}
