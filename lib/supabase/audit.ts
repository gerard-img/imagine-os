import 'server-only'
import { createClient } from './server'
import type { PersonaAutenticada } from './auth-helpers'

type Accion =
  | 'crear'
  | 'actualizar'
  | 'eliminar'
  | 'archivar'
  | 'restaurar'
  | 'cambiar_estado'
  | 'otro'

type AuditParams = {
  persona: PersonaAutenticada
  accion: Accion
  tabla: string
  registroId?: string | null
  datosExtra?: Record<string, unknown> | null
}

/**
 * Registra una entrada en audit_log.
 * Se llama desde server actions DESPUÉS de que la operación haya sido exitosa.
 * No lanza errores — si falla el insert de auditoría, se ignora silenciosamente
 * para no bloquear la operación principal del usuario.
 */
export async function registrarAuditoria({
  persona,
  accion,
  tabla,
  registroId,
  datosExtra,
}: AuditParams): Promise<void> {
  try {
    const supabase = await createClient()
    await supabase.from('audit_log').insert({
      persona_id: persona.id,
      accion,
      tabla,
      registro_id: registroId ?? null,
      datos_extra: datosExtra ?? null,
    })
  } catch {
    // Silenciar errores de auditoría para no afectar la operación principal
  }
}
