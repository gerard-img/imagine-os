import { z } from 'zod'

export const asignacionSchema = z.object({
  orden_trabajo_id: z.string().min(1, 'Selecciona una orden de trabajo'),
  persona_id: z.string().min(1, 'Selecciona una persona'),
  porcentaje_ppto_tm: z.number()
    .min(0.01, 'El porcentaje debe ser mayor que 0')
    .max(100, 'El porcentaje no puede superar 100'),
  cuota_planificacion_id: z.string().min(1, 'Selecciona una cuota'),
  horas_reales: z.string(),
  notas: z.string(),
})

export type AsignacionFormData = z.infer<typeof asignacionSchema>
