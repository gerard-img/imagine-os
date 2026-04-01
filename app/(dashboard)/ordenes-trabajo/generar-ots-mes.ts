'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export type GenerarResult = {
  success: boolean
  creadas: number
  omitidas: number   // ya existían
  error?: string
}

/**
 * Para un mes dado (formato YYYY-MM-01), busca todos los proyectos
 * Recurrentes en estado Activo o Confirmado, y crea una OT por cada combinación
 * proyecto × departamento que no tenga ya OT ese mes.
 *
 * 'Confirmado' se trata igual que 'Activo' porque es un estado de pre-activación:
 * el retainer está acordado y hay que planificar la carga antes de la activación formal.
 *
 * Lógica de OT generada:
 *   - porcentaje_ppto_mes = 100 (una sola OT por depto, reparto completo)
 *   - partida_prevista = ppto_estimado del proyecto
 *   - servicio_id = primer servicio del catálogo de esa empresa_grupo (orientativo)
 *   - aprobador_id = aprobador_final_id del proyecto
 *   - estado = 'Propuesto'
 *   - fecha_inicio = primer día del mes
 *   - fecha_fin = último día del mes
 */
export async function generarOTsMes(mes: string): Promise<GenerarResult> {
  if (!mes.match(/^\d{4}-\d{2}-01$/)) {
    return { success: false, creadas: 0, omitidas: 0, error: 'Formato de mes inválido (esperado YYYY-MM-01)' }
  }

  const supabase = await createClient()

  // 1. Proyectos Recurrentes y Activos
  const { data: proyectos, error: errP } = await supabase
    .from('proyectos')
    .select('id, empresa_grupo_id, ppto_estimado, aprobador_final_id')
    .eq('tipo_partida', 'Recurrente')
    .in('estado', ['Activo', 'Confirmado'])

  if (errP) return { success: false, creadas: 0, omitidas: 0, error: errP.message }
  if (!proyectos || proyectos.length === 0) {
    return { success: true, creadas: 0, omitidas: 0 }
  }

  const proyectoIds = proyectos.map((p) => p.id)

  // 2. Departamentos asignados a cada proyecto
  const { data: proyDepts, error: errD } = await supabase
    .from('proyectos_departamentos')
    .select('proyecto_id, departamento_id')
    .in('proyecto_id', proyectoIds)

  if (errD) return { success: false, creadas: 0, omitidas: 0, error: errD.message }

  // 3. OTs que ya existen este mes para estos proyectos
  const { data: otsExistentes, error: errO } = await supabase
    .from('ordenes_trabajo')
    .select('proyecto_id, departamento_id')
    .in('proyecto_id', proyectoIds)
    .eq('mes_anio', mes)
    .is('deleted_at', null)

  if (errO) return { success: false, creadas: 0, omitidas: 0, error: errO.message }

  const otExisteKey = new Set(
    (otsExistentes ?? []).map((o) => `${o.proyecto_id}__${o.departamento_id}`)
  )

  // 3b. OTs del mes anterior → para heredar el estado si estaba avanzado
  const [yearNum, monthNum] = mes.split('-').map(Number)
  const mesAnteriorDate = new Date(yearNum, monthNum - 2, 1) // mes - 1
  const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}-01`

  const { data: otsMesAnterior } = await supabase
    .from('ordenes_trabajo')
    .select('proyecto_id, departamento_id, estado')
    .in('proyecto_id', proyectoIds)
    .eq('mes_anio', mesAnterior)
    .is('deleted_at', null)

  // Mapa proyecto+depto → estado del mes anterior
  const estadoMesAnterior = new Map<string, string>()
  for (const ot of otsMesAnterior ?? []) {
    estadoMesAnterior.set(`${ot.proyecto_id}__${ot.departamento_id}`, ot.estado)
  }

  // 4. Calcular fecha_fin (último día del mes)
  const [year, month] = mes.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const fechaFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  const proyectoMap = new Map(proyectos.map((p) => [p.id, p]))

  // Número de departamentos por proyecto → determina el reparto de % y partida
  const deptsPorProyecto = new Map<string, number>()
  for (const pd of proyDepts ?? []) {
    deptsPorProyecto.set(pd.proyecto_id, (deptsPorProyecto.get(pd.proyecto_id) ?? 0) + 1)
  }

  let creadas = 0
  let omitidas = 0

  for (const pd of proyDepts ?? []) {
    const key = `${pd.proyecto_id}__${pd.departamento_id}`
    if (otExisteKey.has(key)) { omitidas++; continue }

    const proyecto = proyectoMap.get(pd.proyecto_id)
    if (!proyecto) continue

    // Reparto proporcional entre departamentos
    const numDepts = deptsPorProyecto.get(pd.proyecto_id) ?? 1
    const pctOT = Math.round((100 / numDepts) * 100) / 100          // ej: 33.33
    const partidaOT = Math.round(proyecto.ppto_estimado / numDepts)  // ej: 1667€

    // Heredar estado si el mes anterior estaba avanzado
    const estadoAnterior = estadoMesAnterior.get(key)
    const estadoNuevo = (estadoAnterior === 'Planificado' || estadoAnterior === 'Confirmado' || estadoAnterior === 'Facturado')
      ? 'Planificado'
      : 'Propuesto'

    const { error } = await supabase.from('ordenes_trabajo').insert({
      proyecto_id: pd.proyecto_id,
      departamento_id: pd.departamento_id,
      servicio_id: null,  // se define al revisar la OT
      mes_anio: mes,
      porcentaje_ppto_mes: pctOT,
      partida_prevista: partidaOT,
      aprobador_id: proyecto.aprobador_final_id,
      estado: estadoNuevo,
      fecha_inicio: mes,
      fecha_fin: fechaFin,
    })

    if (error && error.code !== '23505') {
      // 23505 = UNIQUE violation (ya existe, aunque no la detectamos antes): omitir silenciosamente
      return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
    }

    if (!error) creadas++
    else omitidas++
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
    .select('id, ppto_estimado, aprobador_final_id, tipo_partida, estado')
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
      aprobador_id: proyecto.aprobador_final_id,
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
