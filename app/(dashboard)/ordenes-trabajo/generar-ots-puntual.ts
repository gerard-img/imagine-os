'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GenerarPuntualResult = {
  success: boolean
  creadas: number
  omitidas: number
  meses: number      // meses del proyecto
  error?: string
}

/** Devuelve array de 'YYYY-MM-01' para todos los meses entre dos fechas (inclusive) */
function mesesEnRango(inicio: string, fin: string): string[] {
  const result: string[] = []
  const [yi, mi] = inicio.split('-').map(Number)
  const [yf, mf] = fin.split('-').map(Number)
  let year = yi, month = mi
  while (year < yf || (year === yf && month <= mf)) {
    result.push(`${year}-${String(month).padStart(2, '0')}-01`)
    month++
    if (month > 12) { month = 1; year++ }
  }
  return result
}

function ultimoDiaMes(mes: string): string {
  const [year, month] = mes.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  return `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
}

/**
 * Para un proyecto Puntual + Activo, genera una OT por cada combinación
 * departamento × mes del rango [fecha_activacion … fecha_cierre].
 *
 * Reparto del presupuesto:
 *   pptoPorOT = ppto_estimado / (numDepts × numMeses)
 *   pctPorOT  = 100 / (numDepts × numMeses)
 *
 * Estado: 'Propuesto' (punto de partida; el equipo ajusta antes de confirmar).
 * OTs ya existentes (mismo proyecto+dept+mes) se omiten sin error.
 */
export async function generarOTsPuntual(proyectoId: string): Promise<GenerarPuntualResult> {
  const supabase = await createClient()

  // 1. Proyecto
  const { data: proyecto, error: errP } = await supabase
    .from('proyectos')
    .select('id, empresa_grupo_id, ppto_estimado, aprobador_final_id, fecha_activacion, fecha_cierre, tipo_partida, estado')
    .eq('id', proyectoId)
    .single()

  if (errP || !proyecto) {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: 'Proyecto no encontrado' }
  }
  if (proyecto.tipo_partida !== 'Puntual') {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: 'Este proyecto no es Puntual' }
  }
  if (proyecto.estado !== 'Activo' && proyecto.estado !== 'Confirmado') {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: `El proyecto está en estado "${proyecto.estado}". Solo se generan OTs para proyectos Activos o Confirmados` }
  }
  if (!proyecto.fecha_activacion) {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: 'El proyecto no tiene fecha de activación definida' }
  }
  if (!proyecto.fecha_cierre) {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: 'El proyecto no tiene fecha de cierre definida (necesaria para proyectos Puntuales)' }
  }

  // 2. Rango de meses
  const meses = mesesEnRango(proyecto.fecha_activacion, proyecto.fecha_cierre)
  if (meses.length === 0) {
    return { success: false, creadas: 0, omitidas: 0, meses: 0, error: 'El rango de fechas no genera ningún mes' }
  }

  // 3. Departamentos del proyecto
  const { data: proyDepts, error: errD } = await supabase
    .from('proyectos_departamentos')
    .select('departamento_id')
    .eq('proyecto_id', proyectoId)

  if (errD) return { success: false, creadas: 0, omitidas: 0, meses: meses.length, error: errD.message }
  if (!proyDepts || proyDepts.length === 0) {
    return { success: false, creadas: 0, omitidas: 0, meses: meses.length, error: 'El proyecto no tiene departamentos asignados' }
  }

  const numDepts = proyDepts.length
  const numMeses = meses.length
  const totalOTs = numDepts * numMeses

  // Reparto igual: ppto y % por OT
  const pptoPorOT = Math.round(proyecto.ppto_estimado / totalOTs)
  const pctPorOT = Math.round((100 / totalOTs) * 100) / 100

  // 4. OTs ya existentes para este proyecto (todos los meses)
  const { data: otsExistentes, error: errO } = await supabase
    .from('ordenes_trabajo')
    .select('departamento_id, mes_anio')
    .eq('proyecto_id', proyectoId)
    .is('deleted_at', null)

  if (errO) return { success: false, creadas: 0, omitidas: 0, meses: meses.length, error: errO.message }

  const otExisteKey = new Set(
    (otsExistentes ?? []).map((o) => `${o.departamento_id}__${o.mes_anio}`)
  )

  // 5. Crear OTs (servicio_id = null, se define al revisar)
  let creadas = 0
  let omitidas = 0

  for (const mes of meses) {
    const fechaFin = ultimoDiaMes(mes)

    for (const pd of proyDepts) {
      const key = `${pd.departamento_id}__${mes}`
      if (otExisteKey.has(key)) { omitidas++; continue }

      const { error } = await supabase.from('ordenes_trabajo').insert({
        proyecto_id: proyectoId,
        departamento_id: pd.departamento_id,
        servicio_id: null,  // se define al revisar la OT
        mes_anio: mes,
        porcentaje_ppto_mes: pctPorOT,
        partida_prevista: pptoPorOT,
        aprobador_id: proyecto.aprobador_final_id,
        estado: 'Propuesto',
        fecha_inicio: mes,
        fecha_fin: fechaFin,
      })

      if (error && error.code !== '23505') {
        return { success: false, creadas, omitidas, meses: meses.length, error: `Error al crear OT: ${error.message}` }
      }

      if (!error) creadas++
      else omitidas++
    }
  }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
  return { success: true, creadas, omitidas, meses: meses.length }
}
