import { z } from 'zod'

export const ROLES_INFLUENCIA = ['Champion', 'Decision Maker', 'Economic Buyer', 'Influencer', 'Blocker'] as const

export const contactoSchema = z.object({
  empresa_id: z.string().min(1, 'Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellidos: z.string(),
  email: z.string(),
  telefono_directo: z.string(),
  movil: z.string(),
  cargo: z.string(),
  departamento: z.string(),
  es_decisor: z.boolean(),
  es_contacto_principal: z.boolean(),
  notas: z.string(),
  activo: z.boolean(),
  linkedin_url: z.string(),
  rol_influencia: z.string(),
  fecha_ultimo_contacto: z.string(),
  idioma_preferido: z.string(),
  fecha_cumpleanos: z.string(),
  assistant_nombre: z.string(),
  assistant_email: z.string(),
})

export type ContactoFormData = z.infer<typeof contactoSchema>
