'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { cuotaSchema, type CuotaFormData } from '@/lib/schemas/cuota-planificacion'

export type ActionResult = { success: boolean; error?: string }

export async function crearCuota(data: CuotaFormData): Promise<ActionResult> {
  const parsed = cuotaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const d = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('cuotas_planificacion').insert({
    empresa_grupo_id: d.empresa_grupo_id,
    nombre: d.nombre,
    precio_hora: d.precio_hora,
    inicio_validez: d.inicio_validez,
    fin_validez: d.fin_validez || null,
    nota: d.nota || null,
  })

  if (error) return { success: false, error: error.message }

  revalidatePath('/cuotas-por-rango')
  return { success: true }
}

export async function actualizarCuota(id: string, data: CuotaFormData): Promise<ActionResult> {
  const parsed = cuotaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const d = parsed.data
  const supabase = await createClient()
  const { error } = await supabase
    .from('cuotas_planificacion')
    .update({
      empresa_grupo_id: d.empresa_grupo_id,
      nombre: d.nombre,
      precio_hora: d.precio_hora,
      inicio_validez: d.inicio_validez,
      fin_validez: d.fin_validez || null,
      nota: d.nota || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/cuotas-por-rango')
  return { success: true }
}

export async function eliminarCuota(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('cuotas_planificacion')
    .delete()
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/cuotas-por-rango')
  return { success: true }
}
