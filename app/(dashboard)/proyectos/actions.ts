'use server'

import { createClient } from '@/lib/supabase/server'
import {
  getPersonaAutenticada,
  getUsuarioConNivel,
  NIVELES_GESTION,
} from '@/lib/supabase/auth-helpers'
import { proyectoSchema, ESTADOS_PROYECTO } from '@/lib/schemas/proyecto'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  success: boolean
  error?: string
}

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'
const ROLES_DIRECTOR_O_SUPERIOR = ['Director', 'Socio', 'Administrador', 'Fundador']

function revalidateProyectos(id?: string) {
  revalidatePath('/proyectos')
  if (id) revalidatePath(`/proyectos/${id}`)
  revalidatePath('/planificador')
  revalidatePath('/ordenes-trabajo')
  revalidatePath('/asignaciones')
  revalidatePath('/cargas-trabajo')
  revalidatePath('/datos')
}

// ── Archivar ──
export async function archivarProyecto(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proyectos')
    .update({ archivado_at: new Date().toISOString() })
    .eq('id', id)
    .is('deleted_at', null)

  if (error) return { success: false, error: error.message }
  revalidateProyectos(id)
  return { success: true }
}

// ── Desarchivar ──
export async function desarchivarProyecto(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proyectos')
    .update({ archivado_at: null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateProyectos(id)
  return { success: true }
}

// ── Eliminar (soft delete en cascada) ──
export async function eliminarProyecto(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const supabase = await createClient()
  const now = new Date().toISOString()

  // Comprobar si tiene OTs facturadas
  const { data: otsFacturadas } = await supabase
    .from('ordenes_trabajo')
    .select('id')
    .eq('proyecto_id', id)
    .eq('estado', 'Facturado')
    .is('deleted_at', null)
    .limit(1)

  if (otsFacturadas && otsFacturadas.length > 0) {
    // Solo Director o superior puede borrar proyectos con OTs facturadas
    const persona = await getPersonaAutenticada()
    const rolNombre = persona?.rol.nombre ?? ''

    if (!ROLES_DIRECTOR_O_SUPERIOR.includes(rolNombre)) {
      return {
        success: false,
        error: 'Este proyecto tiene OTs facturadas. Solo un Director o superior puede eliminarlo.',
      }
    }
  }

  // Soft-delete asignaciones de las OTs del proyecto
  const { data: ots } = await supabase
    .from('ordenes_trabajo')
    .select('id')
    .eq('proyecto_id', id)
    .is('deleted_at', null)

  if (ots && ots.length > 0) {
    const otIds = ots.map((o) => o.id)
    await supabase
      .from('asignaciones')
      .update({ deleted_at: now })
      .in('orden_trabajo_id', otIds)
      .is('deleted_at', null)

    // Soft-delete las OTs
    await supabase
      .from('ordenes_trabajo')
      .update({ deleted_at: now })
      .in('id', otIds)
  }

  // Soft-delete el proyecto
  const { error } = await supabase
    .from('proyectos')
    .update({ deleted_at: now })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateProyectos(id)
  return { success: true }
}

// ── Restaurar (quita deleted_at del proyecto, sus OTs y asignaciones) ──
export async function restaurarProyecto(id: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const supabase = await createClient()

  // Restaurar asignaciones de OTs del proyecto
  const { data: ots } = await supabase
    .from('ordenes_trabajo')
    .select('id')
    .eq('proyecto_id', id)
    .not('deleted_at', 'is', null)

  if (ots && ots.length > 0) {
    const otIds = ots.map((o) => o.id)
    await supabase
      .from('asignaciones')
      .update({ deleted_at: null })
      .in('orden_trabajo_id', otIds)

    await supabase
      .from('ordenes_trabajo')
      .update({ deleted_at: null })
      .in('id', otIds)
  }

  // Restaurar proyecto
  const { error } = await supabase
    .from('proyectos')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidateProyectos(id)
  return { success: true }
}

export async function cambiarEstadoProyecto(id: string, nuevoEstado: string): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  if (!ESTADOS_PROYECTO.includes(nuevoEstado as typeof ESTADOS_PROYECTO[number])) {
    return { success: false, error: 'Estado no válido' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('proyectos')
    .update({ estado: nuevoEstado })
    .eq('id', id)

  if (error) return { success: false, error: error.message }

  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
  revalidatePath('/planificador')
  revalidatePath('/ordenes-trabajo')
  return { success: true }
}

export async function crearProyecto(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = proyectoSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError.message }
  }

  const data = parsed.data

  const insert = {
    titulo: data.titulo,
    empresa_id: data.empresa_id,
    empresa_grupo_id: data.empresa_grupo_id,
    tipo_proyecto: data.tipo_proyecto,
    tipo_partida: data.tipo_partida,
    estado: data.estado,
    responsable_id: data.responsable_id,
    ppto_estimado: data.ppto_estimado,
    descripcion: data.descripcion || null,
    explicacion_presupuestos: data.explicacion_presupuestos || null,
    fecha_activacion: data.fecha_activacion || null,
    fecha_cierre: data.fecha_cierre || null,
    notas: data.notas || null,
    tipo_facturacion: data.tipo_facturacion || null,
    contacto_principal_id: data.contacto_principal_id || null,
    probabilidad_cierre: data.probabilidad_cierre ? parseInt(data.probabilidad_cierre, 10) : null,
    valor_estimado_total: data.valor_estimado_total ? parseFloat(data.valor_estimado_total) : null,
    fecha_propuesta: data.fecha_propuesta || null,
  }

  const supabase = await createClient()

  // Insertar proyecto y obtener el id generado
  const { data: proyecto, error } = await supabase
    .from('proyectos')
    .insert(insert)
    .select('id')
    .single()

  if (error || !proyecto) {
    return { success: false, error: `Error al crear proyecto: ${error?.message ?? 'sin respuesta'}` }
  }

  // Insertar departamentos asociados (si hay)
  if (data.departamento_ids.length > 0) {
    const deptInserts = data.departamento_ids.map((deptoId) => ({
      proyecto_id: proyecto.id,
      departamento_id: deptoId,
    }))

    const { error: deptError } = await supabase
      .from('proyectos_departamentos')
      .insert(deptInserts)

    if (deptError) {
      // El trigger de la migración 015 puede lanzar error si el depto no es de la misma empresa_grupo
      return { success: false, error: `Error al asignar departamentos: ${deptError.message}` }
    }
  }

  revalidatePath('/proyectos')
  return { success: true }
}

export async function actualizarProyecto(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = proyectoSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const data = parsed.data
  const supabase = await createClient()

  const { error } = await supabase
    .from('proyectos')
    .update({
      titulo: data.titulo,
      empresa_id: data.empresa_id,
      empresa_grupo_id: data.empresa_grupo_id,
      tipo_proyecto: data.tipo_proyecto,
      tipo_partida: data.tipo_partida,
      estado: data.estado,
      responsable_id: data.responsable_id,
      ppto_estimado: data.ppto_estimado,
      descripcion: data.descripcion || null,
      explicacion_presupuestos: data.explicacion_presupuestos || null,
      fecha_activacion: data.fecha_activacion || null,
      fecha_cierre: data.fecha_cierre || null,
      notas: data.notas || null,
      tipo_facturacion: data.tipo_facturacion || null,
      contacto_principal_id: data.contacto_principal_id || null,
      probabilidad_cierre: data.probabilidad_cierre ? parseInt(data.probabilidad_cierre, 10) : null,
      valor_estimado_total: data.valor_estimado_total ? parseFloat(data.valor_estimado_total) : null,
      fecha_propuesta: data.fecha_propuesta || null,
    })
    .eq('id', id)

  if (error) return { success: false, error: `Error al actualizar proyecto: ${error.message}` }

  // Reemplazar departamentos (delete + insert)
  await supabase.from('proyectos_departamentos').delete().eq('proyecto_id', id)
  if (data.departamento_ids.length > 0) {
    const { error: deptError } = await supabase
      .from('proyectos_departamentos')
      .insert(data.departamento_ids.map((deptoId) => ({ proyecto_id: id, departamento_id: deptoId })))
    if (deptError) return { success: false, error: `Error al actualizar departamentos: ${deptError.message}` }
  }

  revalidatePath('/proyectos')
  revalidatePath(`/proyectos/${id}`)
  return { success: true }
}
