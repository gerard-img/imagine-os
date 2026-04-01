import { z } from 'zod'

export const TIPOS_PROYECTO = ['Interno', 'Externo', 'Facturable'] as const
export const TIPOS_PARTIDA = ['Puntual', 'Recurrente'] as const
export const ESTADOS_PROYECTO = ['Propuesta', 'Confirmado', 'Activo', 'Pausado', 'Finalizado', 'Cancelado'] as const

export const proyectoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  empresa_id: z.string(),           // vacío = proyecto interno
  empresa_grupo_id: z.string().min(1, 'Selecciona la empresa del grupo'),
  tipo_proyecto: z.enum(TIPOS_PROYECTO, { message: 'Selecciona el tipo de proyecto' }),
  tipo_partida: z.enum(TIPOS_PARTIDA, { message: 'Selecciona el tipo de partida' }),
  estado: z.enum(ESTADOS_PROYECTO, { message: 'Selecciona el estado' }),
  aprobador_final_id: z.string().min(1, 'Selecciona un aprobador'),
  ppto_estimado: z.number().min(0, 'El presupuesto no puede ser negativo'),
  descripcion: z.string(),
  explicacion_presupuestos: z.string(),
  fecha_activacion: z.string(),
  fecha_cierre: z.string(),
  notas: z.string(),
  departamento_ids: z.array(z.string()),
})

export type ProyectoFormData = z.infer<typeof proyectoSchema>
