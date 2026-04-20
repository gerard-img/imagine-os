'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { ordenTrabajoSchema, ESTADOS_OT } from '@/lib/schemas/orden-trabajo'
import { revalidatePath } from 'next/cache'

import type { ActionResult } from '@/lib/types/action-result'
import { registrarAuditoria } from '@/lib/supabase/audit'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

export async function crearOrdenTrabajo(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

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
    partida_real: data.partida_real,
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
  void registrarAuditoria({ persona: autorizado, accion: 'crear', tabla: 'ordenes_trabajo', registroId: nueva.id })
  return { success: true, id: nueva.id }
}

export async function actualizarOrdenTrabajo(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

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
      partida_real: data.partida_real,
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
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'ordenes_trabajo', registroId: id })
  return { success: true }
}

export async function confirmarOTsBulk(ids: string[]): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

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
  void registrarAuditoria({ persona: autorizado, accion: 'cambiar_estado', tabla: 'ordenes_trabajo', datosExtra: { ids, nuevoEstado: 'Confirmado' } })
  return { success: true }
}

const SIGUIENTE_ESTADO: Record<string, string> = {
  'Propuesto':   'Planificado',
  'Planificado': 'Realizado',
  'Realizado':   'Confirmado',
  'Confirmado':  'Facturado',
}

export async function avanzarEstadoOT(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

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
  void registrarAuditoria({ persona: autorizado, accion: 'cambiar_estado', tabla: 'ordenes_trabajo', registroId: id })
  return { success: true }
}

export async function asignarServicioOT(otId: string, servicioId: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  if (!servicioId) return { success: false, error: 'Selecciona un servicio' }

  const supabase = await createClient()
  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ servicio_id: servicioId })
    .eq('id', otId)

  if (error) return { success: false, error: error.message }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/proyectos')
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'ordenes_trabajo', registroId: otId, datosExtra: { servicioId } })
  return { success: true }
}

export async function eliminarOrdenTrabajo(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Soft-delete de las asignaciones asociadas
  const { error: errAsig } = await supabase
    .from('asignaciones')
    .update({ deleted_at: now })
    .eq('orden_trabajo_id', id)
    .is('deleted_at', null)

  if (errAsig) return { success: false, error: `Error al eliminar asignaciones: ${errAsig.message}` }

  // Soft-delete de la OT
  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ deleted_at: now })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: `Error al eliminar la OT: ${error.message}` }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/asignaciones')
  revalidatePath('/cargas-trabajo')
  revalidatePath('/proyectos')
  void registrarAuditoria({ persona: autorizado, accion: 'eliminar', tabla: 'ordenes_trabajo', registroId: id })
  return { success: true }
}

export async function cambiarEstadoOT(id: string, nuevoEstado: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  if (!ESTADOS_OT.includes(nuevoEstado as typeof ESTADOS_OT[number])) {
    return { success: false, error: 'Estado no válido' }
  }

  const supabase = await createClient()

  // Confirmado y Facturado requieren partida_real
  if (nuevoEstado === 'Confirmado' || nuevoEstado === 'Facturado') {
    const { data: ot } = await supabase
      .from('ordenes_trabajo')
      .select('partida_real')
      .eq('id', id)
      .single()

    if (ot?.partida_real == null) {
      return { success: false, error: 'Rellena la partida real antes de pasar a ' + nuevoEstado }
    }
  }

  const { error } = await supabase
    .from('ordenes_trabajo')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/proyectos')
  revalidatePath('/cargas-trabajo')
  void registrarAuditoria({ persona: autorizado, accion: 'cambiar_estado', tabla: 'ordenes_trabajo', registroId: id, datosExtra: { nuevoEstado } })
  return { success: true }
}
