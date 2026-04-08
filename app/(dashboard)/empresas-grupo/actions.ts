'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const egSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  nombre_legal: z.string(),
  codigo: z.string().min(1, 'El código es obligatorio'),
  cif: z.string().min(1, 'El CIF es obligatorio'),
  pais: z.string(),
  moneda_base: z.string(),
  web: z.string(),
  email_general: z.string(),
  telefono: z.string(),
  logo_url: z.string(),
  color_marca: z.string(),
})

export type ActionResult = { success: boolean; error?: string }

export async function crearEmpresaGrupo(formData: unknown): Promise<ActionResult> {
  const parsed = egSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('empresas_grupo').insert({
    nombre: d.nombre,
    nombre_legal: d.nombre_legal || null,
    codigo: d.codigo,
    cif: d.cif,
    pais: d.pais || null,
    moneda_base: d.moneda_base || 'EUR',
    web: d.web || null,
    email_general: d.email_general || null,
    telefono: d.telefono || null,
    logo_url: d.logo_url || null,
    color_marca: d.color_marca || null,
  })

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe una empresa con ese código o CIF' }
    return { success: false, error: `Error al crear: ${error.message}` }
  }

  revalidatePath('/empresas-grupo')
  return { success: true }
}

export async function actualizarEmpresaGrupo(id: string, formData: unknown): Promise<ActionResult> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) return { success: false, error: 'ID no válido' }

  const parsed = egSchema.safeParse(formData)
  if (!parsed.success) return { success: false, error: parsed.error.issues[0].message }

  const d = parsed.data
  const supabase = await createClient()
  const { error } = await supabase.from('empresas_grupo').update({
    nombre: d.nombre,
    nombre_legal: d.nombre_legal || null,
    codigo: d.codigo,
    cif: d.cif,
    pais: d.pais || null,
    moneda_base: d.moneda_base || 'EUR',
    web: d.web || null,
    email_general: d.email_general || null,
    telefono: d.telefono || null,
    logo_url: d.logo_url || null,
    color_marca: d.color_marca || null,
  }).eq('id', id)

  if (error) {
    if (error.code === '23505') return { success: false, error: 'Ya existe una empresa con ese código o CIF' }
    return { success: false, error: `Error al actualizar: ${error.message}` }
  }

  revalidatePath('/empresas-grupo')
  revalidatePath(`/empresas-grupo/${id}`)
  return { success: true }
}
