'use server'

import { createClient } from '@/lib/supabase/server'
import { empresaSchema, empresaEditSchema } from '@/lib/schemas/empresa'
import { revalidatePath } from 'next/cache'

export type ActionResult = {
  success: boolean
  error?: string
}

export async function crearEmpresa(formData: unknown): Promise<ActionResult> {
  // 1. Validar con zod en servidor (nunca confiar solo en el cliente)
  const parsed = empresaSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError.message }
  }

  const data = parsed.data

  // 2. Preparar datos para insertar (convertir strings vacíos a null)
  const insert = {
    nombre_legal: data.nombre_legal,
    cif: data.cif,
    nombre_interno: data.nombre_interno || null,
    estado: data.estado,
    tipo: data.tipo,
    tipo_conocido: data.estado === 'Conocido' ? (data.tipo_conocido || null) : null,
    tipo_cliente: data.estado === 'Cliente' ? (data.tipo_cliente || null) : null,
    estado_prospecto: data.estado === 'Prospecto' ? (data.estado_prospecto || null) : null,
    fecha_primer_contrato: data.fecha_primer_contrato || null,
    calle: data.calle || null,
    codigo_postal: data.codigo_postal || null,
    ciudad: data.ciudad || null,
    provincia: data.provincia || null,
    pais: data.pais || null,
    sector: data.sector || null,
    web: data.web || null,
    notas: data.notas || null,
  }

  // 3. Insertar en Supabase
  const supabase = await createClient()
  const { error } = await supabase.from('empresas').insert(insert)

  if (error) {
    // CIF duplicado
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una empresa con ese CIF' }
    }
    return { success: false, error: `Error al crear empresa: ${error.message}` }
  }

  // 4. Revalidar para que la lista se actualice
  revalidatePath('/empresas')

  return { success: true }
}

export async function actualizarEmpresa(id: string, formData: unknown): Promise<ActionResult> {
  if (!id || !/^[0-9a-f-]{36}$/.test(id)) {
    return { success: false, error: 'ID de empresa no válido' }
  }

  const parsed = empresaEditSchema.safeParse(formData)
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]
    return { success: false, error: firstError.message }
  }

  const data = parsed.data

  const update = {
    nombre_legal: data.nombre_legal,
    cif: data.cif || null,
    nombre_interno: data.nombre_interno || null,
    estado: data.estado,
    tipo: data.tipo || null,
    tipo_conocido: data.estado === 'Conocido' ? (data.tipo_conocido || null) : null,
    tipo_cliente: data.estado === 'Cliente' ? (data.tipo_cliente || null) : null,
    estado_prospecto: data.estado === 'Prospecto' ? (data.estado_prospecto || null) : null,
    fecha_primer_contrato: data.fecha_primer_contrato || null,
    sector: data.sector || null,
    web: data.web || null,
    notas: data.notas || null,
    calle: data.calle || null,
    codigo_postal: data.codigo_postal || null,
    ciudad: data.ciudad || null,
    provincia: data.provincia || null,
    pais: data.pais || null,
    linkedin_url: data.linkedin_url || null,
    telefono: data.telefono || null,
    num_empleados: data.num_empleados ? parseInt(data.num_empleados, 10) : null,
    facturacion_anual_estimada: data.facturacion_anual_estimada ? parseFloat(data.facturacion_anual_estimada) : null,
    clasificacion_cuenta: data.clasificacion_cuenta || null,
    moneda: data.moneda || 'EUR',
    idioma_preferido: data.idioma_preferido || null,
    fuente_captacion: data.fuente_captacion || null,
    responsable_cuenta_id: data.responsable_cuenta_id || null,
  }

  const supabase = await createClient()
  const { error } = await supabase.from('empresas').update(update).eq('id', id)

  if (error) {
    if (error.code === '23505') {
      return { success: false, error: 'Ya existe una empresa con ese CIF' }
    }
    return { success: false, error: `Error al actualizar empresa: ${error.message}` }
  }

  revalidatePath(`/empresas/${id}`)
  revalidatePath('/empresas')

  return { success: true }
}
