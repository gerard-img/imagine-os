'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

import type { ActionResult } from '@/lib/types/action-result'
import { registrarAuditoria } from '@/lib/supabase/audit'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

const asignacionItemSchema = z.object({
  id: z.string().optional(),
  isNew: z.boolean().optional(),
  persona_id: z.string().min(1, 'Persona requerida'),
  cuota_planificacion_id: z.string().min(1, 'Cuota requerida'),
  porcentaje_ppto_tm: z.number().min(0).max(100),
})

const ordenUpdatesSchema = z.object({
  porcentaje_ppto_mes: z.number().min(0).max(100),
  partida_prevista: z.number().min(0),
  partida_real: z.number().min(0).nullable(),
})

/**
 * Persiste todos los cambios de asignaciones de una OT:
 * - Inserta las nuevas (isNew: true)
 * - Actualiza las existentes modificadas
 * - Soft-elimina las que desaparecieron del listado local
 */
export async function guardarAsignacionesOT(
  ordenId: string,
  asignaciones: unknown[],
  originalIds: string[],
  rawOrdenUpdates?: unknown,
): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = z.array(asignacionItemSchema).safeParse(asignaciones)
  if (!parsed.success) {
    return { success: false, error: 'Datos de asignación inválidos' }
  }

  const items = parsed.data

  // Validar que la suma no supere 100%
  const totalPct = items.reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
  if (totalPct > 100.001) {
    return {
      success: false,
      error: `La suma de porcentajes es ${Math.round(totalPct)}%, no puede superar 100%`,
    }
  }

  const supabase = await createClient()

  // IDs que siguen presentes en el listado editado (no son nuevos)
  const keepIds = new Set(items.filter((a) => !a.isNew && a.id).map((a) => a.id!))

  // Soft-delete de los que se eliminaron del listado
  const toDelete = originalIds.filter((id) => !keepIds.has(id))
  if (toDelete.length > 0) {
    const { error } = await supabase
      .from('asignaciones')
      .update({ deleted_at: new Date().toISOString() })
      .in('id', toDelete)
    if (error) return { success: false, error: `Error al eliminar: ${error.message}` }
  }

  // Insertar asignaciones nuevas
  const toInsert = items.filter((a) => a.isNew)
  for (const a of toInsert) {
    const { error } = await supabase.from('asignaciones').insert({
      orden_trabajo_id: ordenId,
      persona_id: a.persona_id,
      cuota_planificacion_id: a.cuota_planificacion_id,
      porcentaje_ppto_tm: a.porcentaje_ppto_tm,
    })
    if (error) {
      if (error.code === '23505') {
        return { success: false, error: 'Esta persona ya tiene una asignación con la misma cuota en esta OT' }
      }
      return { success: false, error: `Error al crear asignación: ${error.message}` }
    }
  }

  // Actualizar asignaciones existentes
  const toUpdate = items.filter((a) => !a.isNew && a.id)
  for (const a of toUpdate) {
    const { error } = await supabase
      .from('asignaciones')
      .update({
        persona_id: a.persona_id,
        cuota_planificacion_id: a.cuota_planificacion_id,
        porcentaje_ppto_tm: a.porcentaje_ppto_tm,
      })
      .eq('id', a.id!)
    if (error) return { success: false, error: `Error al actualizar: ${error.message}` }
  }

  // Persistir cambios de la OT (porcentaje_ppto_mes, partida_real)
  if (rawOrdenUpdates) {
    const parsedOT = ordenUpdatesSchema.safeParse(rawOrdenUpdates)
    if (!parsedOT.success) return { success: false, error: 'Datos de OT inválidos' }

    const { error } = await supabase
      .from('ordenes_trabajo')
      .update({
        porcentaje_ppto_mes: parsedOT.data.porcentaje_ppto_mes,
        partida_prevista: parsedOT.data.partida_prevista,
        partida_real: parsedOT.data.partida_real,
      })
      .eq('id', ordenId)
    if (error) return { success: false, error: `Error al actualizar la OT: ${error.message}` }
  }

  revalidatePath('/planificador')
  revalidatePath('/asignaciones')
  revalidatePath('/ordenes-trabajo')
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'asignaciones', registroId: ordenId })
  return { success: true }
}
