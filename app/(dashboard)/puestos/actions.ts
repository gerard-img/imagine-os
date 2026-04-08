'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// ── Schema de validacion ──

const puestoSchema = z.object({
  empresa_grupo_id: z.string().uuid('La empresa es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede superar los 200 caracteres'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(20, 'El codigo no puede superar los 20 caracteres'),
  descripcion: z.string().max(500).optional(),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear puesto ──

export async function crearPuesto(formData: unknown): Promise<ActionResult> {
  const parsed = puestoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('puestos').insert({
    empresa_grupo_id: parsed.data.empresa_grupo_id,
    nombre: parsed.data.nombre,
    codigo: parsed.data.codigo,
    descripcion: parsed.data.descripcion || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un puesto con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al crear el puesto: ${error.message}` }
  }

  revalidatePath('/puestos')
  revalidatePath('/personas')

  return { success: true }
}

// ── Actualizar puesto ──

export async function actualizarPuesto(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = puestoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('puestos')
    .update({
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un puesto con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al actualizar el puesto: ${error.message}` }
  }

  revalidatePath('/puestos')
  revalidatePath('/personas')

  return { success: true }
}
