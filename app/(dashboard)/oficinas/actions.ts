'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Schema de validación ──

const oficinaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear oficina ──

export async function crearOficina(formData: unknown): Promise<ActionResult> {
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

  return { success: true }
}

// ── Actualizar oficina ──

export async function actualizarOficina(id: string, formData: unknown): Promise<ActionResult> {
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

  return { success: true }
}
