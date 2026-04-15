import { z } from 'zod'

export const MODALIDADES_TRABAJO = ['Presencial', 'Híbrido', 'Remoto'] as const
export const NIVELES_INGLES = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo'] as const

export const personaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido_primero: z.string().min(1, 'El primer apellido es obligatorio'),
  apellido_segundo: z.string(),
  nombre_interno: z.string(), // campo "persona" en DB — se auto-genera si vacío
  dni: z.string().min(1, 'El DNI es obligatorio'),
  empresa_grupo_id: z.string().min(1, 'Selecciona una empresa grupo'),
  rol_id: z.string().min(1, 'Selecciona un rol'),
  division_id: z.string().min(1, 'Selecciona una división'),
  puesto_id: z.string(),
  rango_id: z.string().min(1, 'Selecciona un rango'),
  ciudad_id: z.string().min(1, 'Selecciona una ciudad'),
  oficina_id: z.string(),
  fecha_incorporacion: z.string().min(1, 'La fecha de incorporación es obligatoria'),
  email_corporativo: z.string(),
  email_personal: z.string(),
  telefono: z.string(),
  modalidad_trabajo: z.string(),
  departamentos: z.array(z.object({
    departamento_id: z.string().min(1),
    porcentaje_tiempo: z.number().min(0).max(100),
  })),
  // Campos adicionales
  fecha_baja: z.string(),
  activo: z.boolean(),
  linkedin_url: z.string(),
  fecha_nacimiento: z.string(),
  nivel_ingles: z.string(),
  skills_tags: z.string(), // Comma-separated, se parsea en la action
  foto_url: z.string(),
})

export type PersonaFormData = z.infer<typeof personaSchema>
