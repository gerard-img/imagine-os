import { z } from 'zod'

export const MODALIDADES_TRABAJO = ['Presencial', 'Híbrido', 'Remoto'] as const

export const personaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  apellido_primero: z.string().min(1, 'El primer apellido es obligatorio'),
  apellido_segundo: z.string(),
  dni: z.string().min(1, 'El DNI es obligatorio'),
  empresa_grupo_id: z.string().min(1, 'Selecciona una empresa grupo'),
  rol_id: z.string().min(1, 'Selecciona un rol'),
  division_id: z.string().min(1, 'Selecciona una división'),
  puesto_id: z.string().min(1, 'Selecciona un puesto'),
  rango_id: z.string().min(1, 'Selecciona un rango'),
  ciudad_id: z.string().min(1, 'Selecciona una ciudad'),
  oficina_id: z.string(),
  fecha_incorporacion: z.string().min(1, 'La fecha de incorporación es obligatoria'),
  email_corporativo: z.string(),
  email_personal: z.string(),
  telefono: z.string(),
  modalidad_trabajo: z.string(),
})

export type PersonaFormData = z.infer<typeof personaSchema>
