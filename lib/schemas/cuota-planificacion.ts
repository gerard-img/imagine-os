import { z } from 'zod'

export const cuotaSchema = z.object({
  empresa_grupo_id: z.string().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre/categoría es obligatorio'),
  precio_hora: z.number().min(0, 'El precio debe ser >= 0'),
  inicio_validez: z.string().min(1, 'La fecha de inicio es obligatoria'),
  fin_validez: z.string(),
  nota: z.string(),
})

export type CuotaFormData = z.infer<typeof cuotaSchema>
