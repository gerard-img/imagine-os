'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { personaSchema, type PersonaFormData } from '@/lib/schemas/persona'

export type ActionResult = { success: boolean; error?: string }

export async function crearPersona(data: PersonaFormData): Promise<ActionResult> {
  const parsed = personaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const d = parsed.data
  const autoNombre = [d.nombre, d.apellido_primero, d.apellido_segundo].filter(Boolean).join(' ')
  const persona = d.nombre_interno?.trim() || autoNombre

  const supabase = await createClient()
  const { data: nueva, error } = await supabase.from('personas').insert({
    persona,
    nombre: d.nombre,
    apellido_primero: d.apellido_primero,
    apellido_segundo: d.apellido_segundo || null,
    dni: d.dni,
    empresa_grupo_id: d.empresa_grupo_id,
    rol_id: d.rol_id,
    division_id: d.division_id,
    puesto_id: d.puesto_id,
    rango_id: d.rango_id,
    ciudad_id: d.ciudad_id,
    oficina_id: d.oficina_id || null,
    fecha_incorporacion: d.fecha_incorporacion,
    email_corporativo: d.email_corporativo || null,
    email_personal: d.email_personal || null,
    telefono: d.telefono || null,
    modalidad_trabajo: d.modalidad_trabajo || null,
    activo: d.activo,
    rango_es_interino: false,
    fecha_baja: d.fecha_baja || null,
    linkedin_url: d.linkedin_url || null,
    fecha_nacimiento: d.fecha_nacimiento || null,
    nivel_ingles: d.nivel_ingles || null,
    skills_tags: d.skills_tags ? d.skills_tags.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
    foto_url: d.foto_url || null,
  }).select('id').single()

  if (error || !nueva) return { success: false, error: error?.message ?? 'Error al crear' }

  // Guardar departamentos si se indicaron
  if (d.departamentos.length > 0) {
    const { error: deptError } = await supabase
      .from('personas_departamentos')
      .insert(d.departamentos.map((e) => ({
        persona_id: nueva.id,
        departamento_id: e.departamento_id,
        porcentaje_tiempo: e.porcentaje_tiempo,
      })))
    if (deptError) return { success: false, error: `Error al asignar departamentos: ${deptError.message}` }
  }

  revalidatePath('/personas')
  return { success: true }
}

export async function actualizarPersona(id: string, data: PersonaFormData): Promise<ActionResult> {
  const parsed = personaSchema.safeParse(data)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? 'Datos inválidos' }
  }

  const d = parsed.data
  const autoNombre = [d.nombre, d.apellido_primero, d.apellido_segundo].filter(Boolean).join(' ')
  const persona = d.nombre_interno?.trim() || autoNombre

  const supabase = await createClient()
  const { error } = await supabase.from('personas').update({
    persona,
    nombre: d.nombre,
    apellido_primero: d.apellido_primero,
    apellido_segundo: d.apellido_segundo || null,
    dni: d.dni,
    empresa_grupo_id: d.empresa_grupo_id,
    rol_id: d.rol_id,
    division_id: d.division_id,
    puesto_id: d.puesto_id,
    rango_id: d.rango_id,
    ciudad_id: d.ciudad_id,
    oficina_id: d.oficina_id || null,
    fecha_incorporacion: d.fecha_incorporacion,
    email_corporativo: d.email_corporativo || null,
    email_personal: d.email_personal || null,
    telefono: d.telefono || null,
    modalidad_trabajo: d.modalidad_trabajo || null,
    activo: d.activo,
    fecha_baja: d.fecha_baja || null,
    linkedin_url: d.linkedin_url || null,
    fecha_nacimiento: d.fecha_nacimiento || null,
    nivel_ingles: d.nivel_ingles || null,
    skills_tags: d.skills_tags ? d.skills_tags.split(',').map((s: string) => s.trim()).filter(Boolean) : null,
    foto_url: d.foto_url || null,
  }).eq('id', id)

  if (error) return { success: false, error: error.message }

  // Actualizar departamentos: delete + insert
  if (d.departamentos.length > 0) {
    const total = d.departamentos.reduce((sum, e) => sum + e.porcentaje_tiempo, 0)
    if (Math.abs(total - 100) > 0.01) {
      return { success: false, error: `La suma de departamentos debe ser 100%. Actualmente: ${total}%` }
    }

    await supabase.from('personas_departamentos').delete().eq('persona_id', id)
    const { error: deptError } = await supabase
      .from('personas_departamentos')
      .insert(d.departamentos.map((e) => ({
        persona_id: id,
        departamento_id: e.departamento_id,
        porcentaje_tiempo: e.porcentaje_tiempo,
      })))
    if (deptError) return { success: false, error: `Error al actualizar departamentos: ${deptError.message}` }
  }

  revalidatePath(`/personas/${id}`)
  revalidatePath('/personas')
  revalidatePath('/cargas-trabajo')
  revalidatePath('/planificador')
  return { success: true }
}

export async function actualizarDepartamentosPersona(
  personaId: string,
  entries: { departamento_id: string; porcentaje_tiempo: number }[]
): Promise<ActionResult> {
  if (entries.length === 0) {
    return { success: false, error: 'Debe haber al menos un departamento asignado.' }
  }

  const total = entries.reduce((sum, e) => sum + e.porcentaje_tiempo, 0)
  if (Math.abs(total - 100) > 0.01) {
    return { success: false, error: `La suma debe ser exactamente 100%. Actualmente: ${total}%.` }
  }

  const supabase = await createClient()

  const { error: delError } = await supabase
    .from('personas_departamentos')
    .delete()
    .eq('persona_id', personaId)

  if (delError) return { success: false, error: delError.message }

  const { error: insError } = await supabase
    .from('personas_departamentos')
    .insert(entries.map((e) => ({
      persona_id: personaId,
      departamento_id: e.departamento_id,
      porcentaje_tiempo: e.porcentaje_tiempo,
    })))

  if (insError) return { success: false, error: insError.message }

  revalidatePath(`/personas/${personaId}`)
  revalidatePath('/personas')
  revalidatePath('/cargas-trabajo')
  revalidatePath('/planificador')
  return { success: true }
}

export async function toggleInterinidad(personaId: string, valor: boolean): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('personas')
    .update({ rango_es_interino: valor })
    .eq('id', personaId)
  if (error) return { success: false, error: error.message }
  revalidatePath(`/personas/${personaId}`)
  revalidatePath('/personas')
  return { success: true }
}
