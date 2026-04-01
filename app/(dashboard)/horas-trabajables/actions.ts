'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const horasSchema = z.object({
  empresa_grupo_id: z.string().min(1, 'Selecciona una empresa'),
  mes_trabajo: z.string().min(1, 'El mes es obligatorio'),
  horas: z.coerce.number().min(0, 'Las horas deben ser >= 0').max(744, 'Máximo 744 horas'),
  departamento_id: z.string().optional(),
  persona_id: z.string().optional(),
  comentarios: z.string().optional(),
})

export type ActionResult = {
  success: boolean
  error?: string
}

export async function crearHorasTrabajables(formData: unknown): Promise<ActionResult> {
  const parsed = horasSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase.from('horas_trabajables').insert({
    empresa_grupo_id: parsed.data.empresa_grupo_id,
    mes_trabajo: parsed.data.mes_trabajo,
    horas: parsed.data.horas,
    departamento_id: parsed.data.departamento_id || null,
    persona_id: parsed.data.persona_id || null,
    comentarios: parsed.data.comentarios || null,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un registro con esos mismos criterios para ese mes' }
    }
    return { success: false, error: `Error al crear: ${error.message}` }
  }

  revalidatePath('/horas-trabajables')
  return { success: true }
}

export async function actualizarHorasTrabajables(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = horasSchema.safeParse(formData)
  if (!parsed.success) {
    console.error('VALIDATION ERRORS:', JSON.stringify(parsed.error.issues, null, 2))
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('horas_trabajables')
    .update({
      empresa_grupo_id: parsed.data.empresa_grupo_id,
      mes_trabajo: parsed.data.mes_trabajo,
      horas: parsed.data.horas,
      departamento_id: parsed.data.departamento_id || null,
      persona_id: parsed.data.persona_id || null,
      comentarios: parsed.data.comentarios || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe un registro con esos mismos criterios para ese mes' }
    }
    return { success: false, error: `Error al actualizar: ${error.message}` }
  }

  revalidatePath('/horas-trabajables')
  return { success: true }
}
