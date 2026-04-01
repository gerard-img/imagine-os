'use server'

import { createClient } from '@/lib/supabase/server'
import { asignacionSchema } from '@/lib/schemas/asignacion'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string }

function revalidateAll() {
  revalidatePath('/asignaciones')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
}

export async function crearAsignacion(formData: unknown): Promise<ActionResult> {
  const parsed = asignacionSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const supabase = await createClient()

  // Verificar que la suma de porcentajes no supere 100 para esta OT
  const { data: existentes } = await supabase
    .from('asignaciones')
    .select('porcentaje_ppto_tm')
    .eq('orden_trabajo_id', data.orden_trabajo_id)
    .is('deleted_at', null)

  const sumaActual = (existentes ?? []).reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
  if (sumaActual + data.porcentaje_ppto_tm > 100) {
    return {
      success: false,
      error: `Esta OT ya tiene ${sumaActual}% asignado. Solo quedan ${100 - sumaActual}% disponibles`,
    }
  }

  const { error } = await supabase.from('asignaciones').insert({
    orden_trabajo_id: data.orden_trabajo_id,
    persona_id: data.persona_id,
    porcentaje_ppto_tm: data.porcentaje_ppto_tm,
    cuota_planificacion_id: data.cuota_planificacion_id,
  })

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Esta persona ya está asignada a esa orden de trabajo' }
    }
    return { success: false, error: `Error al crear la asignación: ${error.message}` }
  }

  revalidateAll()
  return { success: true }
}

export async function actualizarAsignacion(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = asignacionSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // Verificar que la suma no supere 100 (excluyendo la asignación actual)
  const { data: existentes } = await supabase
    .from('asignaciones')
    .select('porcentaje_ppto_tm')
    .eq('orden_trabajo_id', data.orden_trabajo_id)
    .is('deleted_at', null)
    .neq('id', id)

  const sumaActual = (existentes ?? []).reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
  if (sumaActual + data.porcentaje_ppto_tm > 100) {
    return {
      success: false,
      error: `Esta OT ya tiene ${sumaActual}% asignado en otras personas. Solo quedan ${100 - sumaActual}% disponibles`,
    }
  }

  const { error } = await supabase
    .from('asignaciones')
    .update({
      orden_trabajo_id: data.orden_trabajo_id,
      persona_id: data.persona_id,
      porcentaje_ppto_tm: data.porcentaje_ppto_tm,
      cuota_planificacion_id: data.cuota_planificacion_id,
    })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: `Error al actualizar: ${error.message}` }

  revalidateAll()
  return { success: true }
}

export async function eliminarAsignacion(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  const { error } = await supabase
    .from('asignaciones')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: `Error al eliminar: ${error.message}` }

  revalidateAll()
  return { success: true }
}
