'use server'

import { createClient } from '@/lib/supabase/server'
import { empresaSchema } from '@/lib/schemas/empresa'
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
    direccion: data.direccion || null,
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
