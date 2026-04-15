'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { contactoSchema } from '@/lib/schemas/contacto'
import { revalidatePath } from 'next/cache'

export type ActionResult = { success: boolean; error?: string; id?: string }

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

export async function crearContacto(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = contactoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const d = parsed.data
  const supabase = await createClient()

  const { data: nuevo, error } = await supabase.from('contactos_empresas').insert({
    empresa_id: d.empresa_id,
    nombre: d.nombre,
    apellidos: d.apellidos || null,
    email: d.email || null,
    telefono_directo: d.telefono_directo || null,
    movil: d.movil || null,
    cargo: d.cargo || null,
    departamento: d.departamento || null,
    es_decisor: d.es_decisor,
    es_contacto_principal: d.es_contacto_principal,
    notas: d.notas || null,
    activo: d.activo,
    linkedin_url: d.linkedin_url || null,
    rol_influencia: d.rol_influencia || null,
    fecha_ultimo_contacto: d.fecha_ultimo_contacto || null,
    idioma_preferido: d.idioma_preferido || null,
    fecha_cumpleanos: d.fecha_cumpleanos || null,
    assistant_nombre: d.assistant_nombre || null,
    assistant_email: d.assistant_email || null,
  }).select('id').single()

  if (error || !nuevo) {
    return { success: false, error: `Error al crear contacto: ${error?.message ?? 'sin respuesta'}` }
  }

  revalidatePath('/contactos')
  revalidatePath(`/empresas/${d.empresa_id}`)
  return { success: true, id: nuevo.id }
}

export async function actualizarContacto(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return { success: false, error: 'ID de contacto no válido' }
  }

  const parsed = contactoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const d = parsed.data
  const supabase = await createClient()

  const { error } = await supabase.from('contactos_empresas').update({
    empresa_id: d.empresa_id,
    nombre: d.nombre,
    apellidos: d.apellidos || null,
    email: d.email || null,
    telefono_directo: d.telefono_directo || null,
    movil: d.movil || null,
    cargo: d.cargo || null,
    departamento: d.departamento || null,
    es_decisor: d.es_decisor,
    es_contacto_principal: d.es_contacto_principal,
    notas: d.notas || null,
    activo: d.activo,
    linkedin_url: d.linkedin_url || null,
    rol_influencia: d.rol_influencia || null,
    fecha_ultimo_contacto: d.fecha_ultimo_contacto || null,
    idioma_preferido: d.idioma_preferido || null,
    fecha_cumpleanos: d.fecha_cumpleanos || null,
    assistant_nombre: d.assistant_nombre || null,
    assistant_email: d.assistant_email || null,
  }).eq('id', id)

  if (error) {
    return { success: false, error: `Error al actualizar contacto: ${error.message}` }
  }

  revalidatePath('/contactos')
  revalidatePath(`/empresas/${d.empresa_id}`)
  return { success: true }
}
