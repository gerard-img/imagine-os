'use server'

import { createClient } from '@/lib/supabase/server'
import { ordenTrabajoSchema } from '@/lib/schemas/orden-trabajo'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; id?: string; error?: string }

export async function crearOrdenTrabajo(formData: unknown): Promise<ActionResult> {
  const parsed = ordenTrabajoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const data = parsed.data
  const supabase = await createClient()

  // Auto-calcular fecha_inicio y fecha_fin a partir de mes_anio
  const fechaInicio = data.mes_anio // primer día del mes (YYYY-MM-01)
  const d = new Date(data.mes_anio)
  const fechaFin = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { data: nueva, error } = await supabase.from('ordenes_trabajo').insert({
    proyecto_id: data.proyecto_id,
    servicio_id: data.servicio_id || null,
    departamento_id: data.departamento_id,
    mes_anio: data.mes_anio,
    titulo: data.titulo || null,
    porcentaje_ppto_mes: data.porcentaje_ppto_mes,
    partida_prevista: data.partida_prevista,
    aprobador_id: data.aprobador_id,
    estado: data.estado,
    fecha_inicio: fechaInicio,
    fecha_fin: fechaFin,
    notas: data.notas || null,
  }).select('id').single()

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una OT con ese proyecto, departamento, servicio, título y mes' }
    }
    return { success: false, error: `Error al crear la orden: ${error.message}` }
  }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  return { success: true, id: nueva.id }
}

export async function actualizarOrdenTrabajo(id: string, formData: unknown): Promise<ActionResult> {
  const parsed = ordenTrabajoSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  // Auto-calcular fecha_inicio y fecha_fin a partir de mes_anio
  const fechaInicio = data.mes_anio
  const d = new Date(data.mes_anio)
  const fechaFin = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().slice(0, 10)

  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({
      proyecto_id: data.proyecto_id,
      servicio_id: data.servicio_id || null,
      departamento_id: data.departamento_id,
      mes_anio: data.mes_anio,
      titulo: data.titulo || null,
      porcentaje_ppto_mes: data.porcentaje_ppto_mes,
      partida_prevista: data.partida_prevista,
      aprobador_id: data.aprobador_id,
      estado: data.estado,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      notas: data.notas || null,
    })
    .eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una OT con ese proyecto, departamento, servicio, título y mes' }
    }
    return { success: false, error: `Error al actualizar la orden: ${error.message}` }
  }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/proyectos')
  return { success: true }
}

export async function confirmarOTsBulk(ids: string[]): Promise<ActionResult> {
  if (ids.length === 0) return { success: false, error: 'No hay OTs seleccionadas' }

  const supabase = await createClient()

  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ estado: 'Confirmado' })
    .in('id', ids)
    .neq('estado', 'Facturado') // no tocar las ya facturadas

  if (error) return { success: false, error: error.message }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/proyectos')
  return { success: true }
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  'Propuesto':  'Planificado',
  'Planificado': 'Confirmado',
  'Confirmado':  'Facturado',
}

export async function avanzarEstadoOT(id: string): Promise<ActionResult> {
  const supabase = await createClient()

  // Leer estado actual para determinar el siguiente
  const { data: ot, error: errLeer } = await supabase
    .from('ordenes_trabajo')
    .select('estado')
    .eq('id', id)
    .single()

  if (errLeer || !ot) return { success: false, error: 'OT no encontrada' }

  const siguiente = SIGUIENTE_ESTADO[ot.estado]
  if (!siguiente) return { success: false, error: 'Esta OT ya está en el estado final' }

  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ estado: siguiente })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/proyectos')
  revalidatePath('/cargas-trabajo')
  return { success: true }
}
