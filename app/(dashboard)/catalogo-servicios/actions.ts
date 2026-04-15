'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

// ── Schema de validacion ──

const servicioSchema = z.object({
  empresa_grupo_id: z.string().uuid('La empresa es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede superar los 200 caracteres'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(20, 'El codigo no puede superar los 20 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional().or(z.literal('')),
})

// ── Tipo de respuesta ──

export type ActionResult = {
  success: boolean
  error?: string
}

// ── Crear servicio ──

export async function crearServicio(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = servicioSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('catalogo_servicios').insert({
    empresa_grupo_id: parsed.data.empresa_grupo_id,
    nombre: parsed.data.nombre,
    codigo: parsed.data.codigo,
    descripcion: parsed.data.descripcion || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un servicio con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al crear el servicio: ${error.message}` }
  }

  revalidatePath('/catalogo-servicios')

  return { success: true }
}

// ── Actualizar servicio ──

export async function actualizarServicio(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = servicioSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('catalogo_servicios')
    .update({
      nombre: parsed.data.nombre,
      codigo: parsed.data.codigo,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un servicio con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al actualizar el servicio: ${error.message}` }
  }

  revalidatePath('/catalogo-servicios')

  return { success: true }
}
