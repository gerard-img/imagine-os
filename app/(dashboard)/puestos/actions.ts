'use server'

import { createClient } from '@/lib/supabase/server'
import { getUsuarioConNivel, NIVELES_GESTION } from '@/lib/supabase/auth-helpers'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const ERROR_SIN_PERMISO = 'No tienes permiso para esta acción'

// ── Schema de validacion ──

const puestoSchema = z.object({
  empresa_grupo_id: z.string().min(1, 'La empresa es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede superar los 200 caracteres'),
  descripcion: z.string().max(500).optional(),
})

async function generarCodigoPuesto(
  supabase: Awaited<ReturnType<typeof createClient>>,
  empresaGrupoId: string,
): Promise<string> {
  const { data } = await supabase
    .from('puestos')
    .select('codigo')
    .eq('empresa_grupo_id', empresaGrupoId)

  let maxNum = 0
  for (const row of data ?? []) {
    const m = /^P(\d+)$/.exec(row.codigo ?? '')
    if (m) {
      const n = parseInt(m[1], 10)
      if (n > maxNum) maxNum = n
    }
  }
  const siguiente = maxNum + 1
  return 'P' + String(siguiente).padStart(2, '0')
}

import type { ActionResult } from '@/lib/types/action-result'
import { registrarAuditoria } from '@/lib/supabase/audit'

// ── Crear puesto ──

export async function crearPuesto(formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = puestoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const codigo = await generarCodigoPuesto(supabase, parsed.data.empresa_grupo_id)

  const { error } = await supabase.from('puestos').insert({
    empresa_grupo_id: parsed.data.empresa_grupo_id,
    nombre: parsed.data.nombre,
    codigo,
    descripcion: parsed.data.descripcion || null,
  })

  if (error) {
    return { success: false, error: `Error al crear el puesto: ${error.message}` }
  }

  revalidatePath('/puestos')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'crear', tabla: 'puestos' })
  return { success: true }
}

// ── Actualizar puesto ──

export async function actualizarPuesto(id: string, formData: unknown): Promise<ActionResult> {
  const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
  if (!autorizado) return { success: false, error: ERROR_SIN_PERMISO }

  const parsed = puestoSchema.safeParse(formData)
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0].message }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('puestos')
    .update({
      nombre: parsed.data.nombre,
      descripcion: parsed.data.descripcion || null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) {
    return { success: false, error: `Error al actualizar el puesto: ${error.message}` }
  }

  revalidatePath('/puestos')
  revalidatePath('/personas')
  void registrarAuditoria({ persona: autorizado, accion: 'actualizar', tabla: 'puestos', registroId: id })
  return { success: true }
}
