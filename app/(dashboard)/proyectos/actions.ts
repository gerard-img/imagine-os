'use server'

import { createClient } from '@/lib/supabase/server'
import { proyectoSchema } from '@/lib/schemas/proyecto'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  success: boolean
  error?: string
}

export async function crearProyecto(formData: unknown): Promise<ActionResult> {
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
