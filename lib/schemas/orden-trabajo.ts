import { z } from 'zod'

export const ESTADOS_OT = ['Propuesto', 'Planificado', 'Realizado', 'Confirmado', 'Facturado'] as const

export const ordenTrabajoSchema = z.object({
  proyecto_id: z.string().min(1, 'Selecciona un proyecto'),
  // Opcional: se puede crear sin servicio y asignarlo al revisar la OT
  servicio_id: z.string(),
  departamento_id: z.string().min(1, 'Selecciona un departamento'),
  mes_anio: z.string().min(1, 'Selecciona un mes'),           // YYYY-MM-01
  // Opcional: diferencia OTs del mismo proyecto+depto+servicio+mes (ej. "España", "Francia")
  titulo: z.string(),
  porcentaje_ppto_mes: z.number()
    .min(0.01, 'El porcentaje debe ser mayor que 0')
    .max(100, 'El porcentaje no puede superar 100'),
  partida_prevista: z.number().min(0, 'La partida no puede ser negativa'),
  partida_real: z.union([
    z.number().min(0, 'La partida no puede ser negativa'),
    z.nan(),
    z.null(),
  ]).transform((val) => (typeof val === 'number' && isNaN(val) ? null : val)),
  aprobador_id: z.string().min(1, 'Selecciona un aprobador'),
  estado: z.enum(ESTADOS_OT, { message: 'Selecciona un estado' }),
  notas: z.string(),
})

export type OrdenTrabajoFormData = z.infer<typeof ordenTrabajoSchema>
