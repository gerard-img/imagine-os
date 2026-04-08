import { z } from 'zod'

export const TIPOS_PROYECTO = ['Interno', 'Externo', 'Facturable'] as const
export const TIPOS_PARTIDA = ['Puntual', 'Recurrente'] as const
export const ESTADOS_PROYECTO = ['Propuesta', 'Confirmado', 'Activo', 'Pausado', 'Finalizado', 'Cancelado'] as const
export const TIPOS_FACTURACION = ['Precio fijo', 'Por horas', 'Retainer', 'Éxito'] as const

export const proyectoSchema = z.object({
  titulo: z.string().min(1, 'El título es obligatorio'),
  empresa_id: z.string().min(1, 'Selecciona una empresa cliente'),
  empresa_grupo_id: z.string().min(1, 'Selecciona la empresa del grupo'),
  tipo_proyecto: z.enum(TIPOS_PROYECTO, { message: 'Selecciona el tipo de proyecto' }),
  tipo_partida: z.enum(TIPOS_PARTIDA, { message: 'Selecciona el tipo de partida' }),
  estado: z.enum(ESTADOS_PROYECTO, { message: 'Selecciona el estado' }),
  responsable_id: z.string().min(1, 'Selecciona un contacto principal'),
  ppto_estimado: z.number().min(0, 'El presupuesto no puede ser negativo'),
  descripcion: z.string(),
  explicacion_presupuestos: z.string(),
  fecha_activacion: z.string(),
  fecha_cierre: z.string(),
  notas: z.string(),
  departamento_ids: z.array(z.string()),
  tipo_facturacion: z.string(),
  contacto_principal_id: z.string(),
  probabilidad_cierre: z.string(),
  valor_estimado_total: z.string(),
  fecha_propuesta: z.string(),
})

export type ProyectoFormData = z.infer<typeof proyectoSchema>
