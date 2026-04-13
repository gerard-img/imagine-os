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
    .select('id, proyecto_id, departamento_id, servicio_id, titulo, porcentaje_ppto_mes, partida_prevista, aprobador_id, horas_planificadas, estado')
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
    const { data: nuevaOT, error } = await supabase.from('ordenes_trabajo').insert({
      proyecto_id: ot.proyecto_id,
      departamento_id: ot.departamento_id,
      servicio_id: ot.servicio_id,
      titulo: ot.titulo,
      mes_anio: mesDestino,
      porcentaje_ppto_mes: ot.porcentaje_ppto_mes,
      partida_prevista: ot.partida_prevista,
      horas_planificadas: ot.horas_planificadas,
      aprobador_id: ot.aprobador_id,
      estado: ot.estado === 'Propuesto' ? 'Propuesto' : 'Planificado',
      fecha_inicio: mesDestino,
      fecha_fin: fechaFin,
    }).select('id').single()

    if (error && error.code !== '23505') {
      return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
    }

    if (!error && nuevaOT) {
      creadas++
      // Copiar asignaciones de la OT de referencia
      const { data: asigs } = await supabase
        .from('asignaciones')
        .select('persona_id, cuota_planificacion_id, porcentaje_ppto_tm')
        .eq('orden_trabajo_id', ot.id)
        .is('deleted_at', null)
      if (asigs && asigs.length > 0) {
        await supabase.from('asignaciones').insert(
          asigs.map((a) => ({
            orden_trabajo_id: nuevaOT.id,
            persona_id: a.persona_id,
            cuota_planificacion_id: a.cuota_planificacion_id,
            porcentaje_ppto_tm: a.porcentaje_ppto_tm,
          }))
        )
      }
    } else {
      omitidas++ // UNIQUE violation → ya existía
    }
  }

  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
  return { success: true, creadas, omitidas }
}

/**
 * Versión acotada a un único proyecto Recurrente.
 * Genera las OTs para ese proyecto en el mes indicado.
 *
 * Lógica por departamento:
 *   - Si el dept tenía OT(s) en el mes anterior → REPLICA 1 a 1 cada una
 *     (servicio_id, titulo, %, partida, horas, aprobador, asignaciones).
 *     Esto permite mantener la estructura: si el mes pasado había 3 OTs
 *     con servicios distintos en el mismo dept, este mes se generan las 3.
 *   - Si el dept no tenía OTs el mes anterior → comportamiento por defecto:
 *     1 OT sin servicio con reparto igualitario del ppto entre los depts.
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

  // 2. Departamentos del proyecto
  const { data: proyDepts, error: errD } = await supabase
    .from('proyectos_departamentos')
    .select('departamento_id')
    .eq('proyecto_id', proyectoId)

  if (errD) return { success: false, creadas: 0, omitidas: 0, error: errD.message }
  if (!proyDepts || proyDepts.length === 0) {
    return { success: false, creadas: 0, omitidas: 0, error: 'El proyecto no tiene departamentos asignados' }
  }

  // 3. OTs ya existentes este mes — para evitar duplicados.
  // Clave: dept|servicio|titulo (varias OTs con mismo dept+servicio pueden coexistir
  // si tienen titulos distintos, p.ej. webs de países diferentes).
  const { data: otsExistentes, error: errO } = await supabase
    .from('ordenes_trabajo')
    .select('departamento_id, servicio_id, titulo')
    .eq('proyecto_id', proyectoId)
    .eq('mes_anio', mes)
    .is('deleted_at', null)

  if (errO) return { success: false, creadas: 0, omitidas: 0, error: errO.message }
  const claveExistente = (deptId: string, servId: string | null, titulo: string | null) =>
    `${deptId}|${servId ?? ''}|${titulo ?? ''}`
  const existentes = new Set(
    (otsExistentes ?? []).map((o) => claveExistente(o.departamento_id, o.servicio_id, o.titulo))
  )
  const deptosConAlgunaOT = new Set((otsExistentes ?? []).map((o) => o.departamento_id))

  // 4. OTs del mes anterior — para replicar estructura (servicios + asignaciones)
  const [yearNum, monthNum] = mes.split('-').map(Number)
  const mesAnteriorDate = new Date(yearNum, monthNum - 2, 1)
  const mesAnterior = `${mesAnteriorDate.getFullYear()}-${String(mesAnteriorDate.getMonth() + 1).padStart(2, '0')}-01`

  const { data: otsMesAnterior } = await supabase
    .from('ordenes_trabajo')
    .select('id, departamento_id, servicio_id, titulo, porcentaje_ppto_mes, partida_prevista, horas_planificadas, aprobador_id, estado')
    .eq('proyecto_id', proyectoId)
    .eq('mes_anio', mesAnterior)
    .is('deleted_at', null)

  type OtAnterior = NonNullable<typeof otsMesAnterior>[number]
  const otsAnterioresPorDept = new Map<string, OtAnterior[]>()
  for (const ot of otsMesAnterior ?? []) {
    const arr = otsAnterioresPorDept.get(ot.departamento_id) ?? []
    arr.push(ot)
    otsAnterioresPorDept.set(ot.departamento_id, arr)
  }

  // 5. fecha_fin del mes
  const [year, month] = mes.split('-').map(Number)
  const lastDay = new Date(year, month, 0).getDate()
  const fechaFin = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`

  // Helper: copiar asignaciones de una OT origen a una OT destino
  async function copiarAsignaciones(otOrigenId: string, otDestinoId: string) {
    const { data: asigs } = await supabase
      .from('asignaciones')
      .select('persona_id, cuota_planificacion_id, porcentaje_ppto_tm')
      .eq('orden_trabajo_id', otOrigenId)
      .is('deleted_at', null)
    if (asigs && asigs.length > 0) {
      await supabase.from('asignaciones').insert(
        asigs.map((a) => ({
          orden_trabajo_id: otDestinoId,
          persona_id: a.persona_id,
          cuota_planificacion_id: a.cuota_planificacion_id,
          porcentaje_ppto_tm: a.porcentaje_ppto_tm,
        }))
      )
    }
  }

  // Reparto por defecto (solo se usa en depts sin mes anterior)
  const numDepts = proyDepts.length
  const pctOTDefault = Math.round((100 / numDepts) * 100) / 100
  const partidaOTDefault = Math.round(proyecto.ppto_estimado / numDepts)

  let creadas = 0
  let omitidas = 0

  for (const pd of proyDepts) {
    const otsAntDept = otsAnterioresPorDept.get(pd.departamento_id) ?? []

    if (otsAntDept.length > 0) {
      // RUTA A — replicar 1 a 1 cada OT del mes anterior en este dept
      for (const otAnt of otsAntDept) {
        if (existentes.has(claveExistente(otAnt.departamento_id, otAnt.servicio_id, otAnt.titulo))) {
          omitidas++
          continue
        }

        const estadoNuevo = (otAnt.estado === 'Planificado' || otAnt.estado === 'Realizado'
          || otAnt.estado === 'Confirmado' || otAnt.estado === 'Facturado')
          ? 'Planificado'
          : 'Propuesto'

        const { data: nuevaOT, error } = await supabase.from('ordenes_trabajo').insert({
          proyecto_id: proyectoId,
          departamento_id: otAnt.departamento_id,
          servicio_id: otAnt.servicio_id,
          titulo: otAnt.titulo,
          mes_anio: mes,
          porcentaje_ppto_mes: otAnt.porcentaje_ppto_mes,
          partida_prevista: otAnt.partida_prevista,
          horas_planificadas: otAnt.horas_planificadas,
          aprobador_id: otAnt.aprobador_id,
          estado: estadoNuevo,
          fecha_inicio: mes,
          fecha_fin: fechaFin,
        }).select('id').single()

        if (error && error.code !== '23505') {
          return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
        }
        if (!error && nuevaOT) {
          creadas++
          await copiarAsignaciones(otAnt.id, nuevaOT.id)
        } else {
          omitidas++
        }
      }
    } else {
      // RUTA B — sin mes anterior: 1 OT por defecto (sin servicio, reparto igualitario)
      if (deptosConAlgunaOT.has(pd.departamento_id)) { omitidas++; continue }

      const { data: nuevaOT, error } = await supabase.from('ordenes_trabajo').insert({
        proyecto_id: proyectoId,
        departamento_id: pd.departamento_id,
        servicio_id: null,
        mes_anio: mes,
        porcentaje_ppto_mes: pctOTDefault,
        partida_prevista: partidaOTDefault,
        aprobador_id: proyecto.responsable_id,
        estado: 'Propuesto',
        fecha_inicio: mes,
        fecha_fin: fechaFin,
      }).select('id').single()

      if (error && error.code !== '23505') {
        return { success: false, creadas, omitidas, error: `Error al crear OT: ${error.message}` }
      }
      if (!error && nuevaOT) {
        creadas++
      } else {
        omitidas++
      }
    }
  }

  revalidatePath(`/proyectos/${proyectoId}`)
  revalidatePath('/ordenes-trabajo')
  revalidatePath('/planificador')
  revalidatePath('/cargas-trabajo')
  return { success: true, creadas, omitidas }
}
