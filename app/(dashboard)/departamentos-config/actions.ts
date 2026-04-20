'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import type { ActionResult } from '@/lib/types/action-result'
import { registrarAuditoria } from '@/lib/supabase/audit'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

// -- Schema de validacion --

const departamentoSchema = z.object({
  empresa_grupo_id: z.string().uuid('Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(20, 'El codigo no puede superar los 20 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional(),
})

// -- Crear departamento --

export async function crearDepartamento(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = departamentoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { empresa_grupo_id, nombre, codigo, descripcion } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase.from('departamentos').insert({
    empresa_grupo_id,
    nombre,
    codigo,
    descripcion: descripcion || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un departamento con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al crear el departamento: ${error.message}` }
  }

  revalidatePath('/departamentos-config')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'crear', tabla: 'departamentos' })
  return { success: true }
}

// -- Actualizar departamento --

export async function actualizarDepartamento(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = departamentoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const { empresa_grupo_id, nombre, codigo, descripcion } = parsed.data

  const supabase = await createClient()
  const { error } = await supabase
    .from('departamentos')
    .update({
      empresa_grupo_id,
      nombre,
      codigo,
      descripcion: descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un departamento con ese codigo en esta empresa' }
    }
    return { success: false, error: `Error al actualizar el departamento: ${error.message}` }
  }

  revalidatePath('/departamentos-config')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'departamentos', registroId: id })
  return { success: true }
}
