'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GenerarResult = {
  success: boolean
  creadas: number
  omitidas: number   // ya existían (UNIQUE violation)
  error?: string
}

/**
 * Clona OTs de un mes de referencia al mes destino.
 *
 * Recibe los IDs de las OTs a clonar (del mes de referencia).
 * Para cada una, crea una copia en el mes destino preservando:
 *   proyecto_id, departamento_id, servicio_id, titulo,
 *   porcentaje_ppto_mes, partida_prevista, aprobador_id.
 *
 * Campos ajustados en la copia:
 *   - mes_anio = mes destino
 *   - fecha_inicio = primer día del mes destino
 *   - fecha_fin = último día del mes destino
 *   - estado = 'Propuesto' (siempre arranca como propuesto)
 *   - partida_real = null
 *   - horas_reales = null
 *   - notas_cierre = null
 *
 * OTs que ya existen (misma identidad unique) se omiten sin error.
 */
export async function clonarOTsMes(
  mesDestino: string,
  otIds: string[],
): Promise<GenerarResult> {
  if (!mesDestino.match(/^\d{4}-\d{2}-01$/)) {
    return { success: false, creadas: 0, omitidas: 0, error: 'Formato de mes inválido (esperado YYYY-MM-01)' }
  }
  if (!otIds || otIds.length === 0) {
    return { success: false, creadas: 0, omitidas: 0, error: 'No se seleccionaron OTs para clonar' }
  }

  const supabase = await createClient()

  // 1. Obtener las OTs de referencia
  const { data: otsRef, error: errRef } = await supabase
    .from('ordenes_trabajo')
    .select('id, proyecto_id, departamento_id, servicio_id, titulo, porcentaje_ppto_mes, partida_prevista, aprobador_id, horas_planificadas')
    .in('id', otIds)
    .is('deleted_at', null)

  if (errRef) return { success: false, creadas: 0, omitidas: 0, error: errRef.message }
  if (!otsRef || otsRef.length === 0) {
    return { success: true, creadas: 0, omitidas: 0 }
  }

  // 2. Calcular fechas del mes destino
  const [year, month] = mesDestino.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const fechaFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  let creadas = 0
  let omitidas = 0

  for (const ot of otsRef) {
    const { error } = await supabase.from('ordenes_trabajo').insert({
      proyecto_id: ot.proyecto_id,
      departamento_id: ot.departamento_id,
      servicio_id: ot.servicio_id,
      titulo: ot.titulo,
      mes_anio: mesDestino,
      porcentaje_ppto_mes: ot.porcentaje_ppto_mes,
      partida_prevista: ot.partida_prevista,
      horas_planificadas: ot.horas_planificadas,
      aprobador_id: ot.aprobador_id,
      estado: 'Propuesto',
      fecha_inicio: mesDestino,
      fecha_fin: fechaFin,
    })

    if (error && error.code !== '23505') {
      return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
    }

    if (!error) creadas++
    else omitidas++ // UNIQUE violation → ya existía
  }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
  return { success: true, creadas, omitidas }
}

/**
 * Versión acotada a un único proyecto Recurrente.
 * Genera las OTs para ese proyecto en el mes indicado,
 * siguiendo la misma lógica de reparto que generarOTsMes.
 * Útil desde la página de detalle del proyecto.
 */
export async function generarOTsProyectoMes(
  proyectoId: string,
  mes: string,
): Promise<GenerarResult> {
  if (!mes.match(/^\d{4}-\d{2}-01$/)) {
    return { success: false, creadas: 0, omitidas: 0, error: 'Formato de mes inválido' }
  }

  const supabase = await createClient()

  // 1. Proyecto
  const { data: proyecto, error: errP } = await supabase
    .from('proyectos')
    .select('id, ppto_estimado, responsable_id, tipo_partida, estado')
    .eq('id', proyectoId)
    .single()

  if (errP || !proyecto) return { success: false, creadas: 0, omitidas: 0, error: 'Proyecto no encontrado' }
  if (proyecto.tipo_partida !== 'Recurrente') return { success: false, creadas: 0, omitidas: 0, error: 'Este proyecto no es Recurrente' }
  if (proyecto.estado !== 'Activo' && proyecto.estado !== 'Confirmado') {
    return { success: false, creadas: 0, omitidas: 0, error: `El proyecto está en estado "${proyecto.estado}"` }
  }

  // 2. Departamentos
  const { data: proyDepts, error: errD } = await supabase
    .from('proyectos_departamentos')
    .select('departamento_id')
    .eq('proyecto_id', proyectoId)

  if (errD) return { success: false, creadas: 0, omitidas: 0, error: errD.message }
  if (!proyDepts || proyDepts.length === 0) {
    return { success: false, creadas: 0, omitidas: 0, error: 'El proyecto no tiene departamentos asignados' }
  }

  // 3. OTs ya existentes este mes para este proyecto
  const { data: otsExistentes, error: errO } = await supabase
    .from('ordenes_trabajo')
    .select('departamento_id')
    .eq('proyecto_id', proyectoId)
    .eq('mes_anio', mes)
    .is('deleted_at', null)

  if (errO) return { success: false, creadas: 0, omitidas: 0, error: errO.message }
  const deptoExiste = new Set((otsExistentes ?? []).map((o) => o.departamento_id))

  // 4. OT del mes anterior → heredar estado
  const [yearNum, monthNum] = mes.split('-').map(Number)
  const mesAnteriorDate = new Date(yearNum, monthNum - 2, 1)
  const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}-01`

  const { data: otsMesAnterior } = await supabase
    .from('ordenes_trabajo')
    .select('departamento_id, estado')
    .eq('proyecto_id', proyectoId)
    .eq('mes_anio', mesAnterior)
    .is('deleted_at', null)

  const estadoMesAnterior = new Map<string, string>()
  for (const ot of otsMesAnterior ?? []) {
    estadoMesAnterior.set(ot.departamento_id, ot.estado)
  }

  // 5. fecha_fin del mes
  const [year, month] = mes.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const fechaFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const numDepts = proyDepts.length
  const pctOT = Math.round((100 / numDepts) * 100) / 100
  const partidaOT = Math.round(proyecto.ppto_estimado / numDepts)

  let creadas = 0
  let omitidas = 0

  for (const pd of proyDepts) {
    if (deptoExiste.has(pd.departamento_id)) { omitidas++; continue }

    const estadoAnterior = estadoMesAnterior.get(pd.departamento_id)
    const estadoNuevo = (estadoAnterior === 'Planificado' || estadoAnterior === 'Confirmado' || estadoAnterior === 'Facturado')
      ? 'Planificado'
      : 'Propuesto'

    const { error } = await supabase.from('ordenes_trabajo').insert({
      proyecto_id: proyectoId,
      departamento_id: pd.departamento_id,
      servicio_id: null,
      mes_anio: mes,
      porcentaje_ppto_mes: pctOT,
      partida_prevista: partidaOT,
      aprobador_id: proyecto.responsable_id,
      estado: estadoNuevo,
      fecha_inicio: mes,
      fecha_fin: fechaFin,
    })

    if (error && error.code !== '23505') {
      return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
    }
    if (!error) creadas++
    else omitidas++
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
  return { success: true, creadas, omitidas }
}
