import { z } from 'zod'

// ── Valores válidos para enums ──

export const ESTADOS_EMPRESA = ['Conocido', 'Prospecto', 'Cliente', 'Baja', 'Otros'] as const
export const TIPOS_EMPRESA = ['Marca', 'Fabricante', 'Fondo', 'Agencia', 'Tecnología'] as const
export const TIPOS_CONOCIDO = ['Branding', 'Inbound', 'Outbound', 'Eventos propios', 'Eventos externos', 'Cercanos'] as const
export const TIPOS_CLIENTE = ['Consultoria', 'Servicio', 'Solucion'] as const
export const ESTADOS_PROSPECTO = ['Prospección', 'Propuesta', 'Negociación', 'Activación'] as const
export const CLASIFICACIONES_CUENTA = ['A', 'B', 'C'] as const
export const FUENTES_CAPTACION = ['Inbound', 'Outbound', 'Referido', 'Evento', 'Red propia', 'Otro'] as const

// ── Schema de creación ──

export const empresaSchema = z.object({
  nombre_legal: z.string().min(1, 'El nombre legal es obligatorio'),
  cif: z.string().min(1, 'El CIF es obligatorio'),
  nombre_interno: z.string(),
  estado: z.enum(ESTADOS_EMPRESA, { message: 'Selecciona un estado' }),
  tipo: z.enum(TIPOS_EMPRESA, { message: 'Selecciona un tipo' }),
  tipo_conocido: z.string(),
  tipo_cliente: z.string(),
  estado_prospecto: z.string(),
  fecha_primer_contrato: z.string(),
  calle: z.string(),
  codigo_postal: z.string(),
  ciudad: z.string(),
  provincia: z.string(),
  pais: z.string(),
  sector: z.string(),
  web: z.string(),
  notas: z.string(),
}).superRefine((data, ctx) => {
  // Validación condicional según estado
  if (data.estado === 'Conocido' && !data.tipo_conocido) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el tipo de conocido',
      path: ['tipo_conocido'],
    })
  }
  if (data.estado === 'Cliente' && !data.tipo_cliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el tipo de cliente',
      path: ['tipo_cliente'],
    })
  }
  if (data.estado === 'Prospecto' && !data.estado_prospecto) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el estado del prospecto',
      path: ['estado_prospecto'],
    })
  }
})

export type EmpresaFormData = z.infer<typeof empresaSchema>

// ── Schema de edición (todos los campos editables) ──

export const empresaEditSchema = z.object({
  nombre_legal: z.string().min(1, 'El nombre legal es obligatorio'),
  cif: z.string(),
  nombre_interno: z.string(),
  estado: z.enum(ESTADOS_EMPRESA, { message: 'Selecciona un estado' }),
  tipo: z.enum(TIPOS_EMPRESA, { message: 'Selecciona un tipo' }).or(z.literal('')),
  tipo_conocido: z.string(),
  tipo_cliente: z.string(),
  estado_prospecto: z.string(),
  fecha_primer_contrato: z.string(),
  sector: z.string(),
  web: z.string(),
  notas: z.string(),
  // Dirección estructurada
  calle: z.string(),
  codigo_postal: z.string(),
  ciudad: z.string(),
  provincia: z.string(),
  pais: z.string(),
  // Campos comerciales
  linkedin_url: z.string(),
  telefono: z.string(),
  num_empleados: z.string(),
  facturacion_anual_estimada: z.string(),
  clasificacion_cuenta: z.string(),
  moneda: z.string(),
  idioma_preferido: z.string(),
  fuente_captacion: z.string(),
  responsable_cuenta_id: z.string(),
}).superRefine((data, ctx) => {
  if (data.estado === 'Conocido' && !data.tipo_conocido) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el tipo de conocido',
      path: ['tipo_conocido'],
    })
  }
  if (data.estado === 'Cliente' && !data.tipo_cliente) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el tipo de cliente',
      path: ['tipo_cliente'],
    })
  }
  if (data.estado === 'Prospecto' && !data.estado_prospecto) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Selecciona el estado del prospecto',
      path: ['estado_prospecto'],
    })
  }
})

export type EmpresaEditFormData = z.infer<typeof empresaEditSchema>
