import 'server-only'
import { createClient } from './server'

export type NivelAcceso = 'global' | 'empresa' | 'personal'

export type PersonaAutenticada = {
  id: string
  nombre: string
  apellido_primero: string
  email_corporativo: string | null
  empresa_grupo_id: string
  rol_id: string
  rol: { nombre: string; nivel_acceso: NivelAcceso }
}

// Niveles de acceso agrupados para usar con getUsuarioConNivel().
// - Admin: solo roles de sistema (Fundador, Administrador, Socio)
// - Gestión: admin + responsables de empresa (Director, Coordinador, Responsable)
export const NIVELES_ADMIN: readonly NivelAcceso[] = ['global'] as const
export const NIVELES_GESTION: readonly NivelAcceso[] = ['global', 'empresa'] as const

// Forma cruda que devuelve Supabase al hacer join `roles(nombre, nivel_acceso)`.
// Según los tipos generados puede venir como objeto o array; normalizamos a objeto.
type PersonaRaw = {
  id: string
  nombre: string
  apellido_primero: string
  email_corporativo: string | null
  empresa_grupo_id: string
  rol_id: string
  roles:
    | { nombre: string; nivel_acceso: NivelAcceso }
    | { nombre: string; nivel_acceso: NivelAcceso }[]
    | null
}

function normalizarPersona(raw: PersonaRaw): PersonaAutenticada | null {
  const rol = Array.isArray(raw.roles) ? raw.roles[0] : raw.roles
  if (!rol) return null
  return {
    id: raw.id,
    nombre: raw.nombre,
    apellido_primero: raw.apellido_primero,
    email_corporativo: raw.email_corporativo,
    empresa_grupo_id: raw.empresa_grupo_id,
    rol_id: raw.rol_id,
    rol,
  }
}

const SELECT_PERSONA =
  'id, nombre, apellido_primero, email_corporativo, empresa_grupo_id, rol_id, roles(nombre, nivel_acceso)'

/**
 * Busca la persona vinculada al usuario autenticado.
 * Si el email coincide con un registro en `personas` pero aún no está vinculado,
 * actualiza auth_user_id para vincularlos.
 *
 * Devuelve la persona con su rol, o null si no tiene acceso.
 */
export async function getPersonaAutenticada(): Promise<PersonaAutenticada | null> {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  // 1. Intentar buscar persona ya vinculada por auth_user_id
  const { data: personaVinculada } = await supabase
    .from('personas')
    .select(SELECT_PERSONA)
    .eq('auth_user_id', user.id)
    .single<PersonaRaw>()

  if (personaVinculada) return normalizarPersona(personaVinculada)

  // 2. Si no está vinculada, buscar por email corporativo
  const { data: personaPorEmail } = await supabase
    .from('personas')
    .select(SELECT_PERSONA)
    .eq('email_corporativo', user.email)
    .single<PersonaRaw>()

  if (!personaPorEmail) return null

  // 3. Vincular auth_user_id a la persona encontrada (vía función SECURITY DEFINER
  //    para evitar el problema huevo/gallina con RLS)
  await supabase.rpc('vincular_persona_por_email', {
    p_auth_user_id: user.id,
    p_email: user.email,
  })

  return normalizarPersona(personaPorEmail)
}

/**
 * Verifica que el usuario autenticado tenga uno de los roles permitidos (por nombre).
 * Úsalo al inicio de cualquier Server Action sensible:
 *
 *   const autorizado = await getUsuarioAutorizado(['Administrador', 'Fundador'])
 *   if (!autorizado) return { success: false, error: 'Sin permiso para esta acción' }
 */
export async function getUsuarioAutorizado(
  rolesPermitidos: readonly string[],
): Promise<PersonaAutenticada | null> {
  const persona = await getPersonaAutenticada()
  if (!persona) return null
  if (!rolesPermitidos.includes(persona.rol.nombre)) return null
  return persona
}

/**
 * Verifica que el usuario autenticado tenga uno de los niveles de acceso permitidos.
 * Más robusto que getUsuarioAutorizado cuando quieres permitir cualquier rol
 * de un nivel determinado (no quedas atado al nombre exacto del rol).
 *
 *   const autorizado = await getUsuarioConNivel(NIVELES_GESTION)
 *   if (!autorizado) return { success: false, error: 'Sin permiso para esta acción' }
 */
export async function getUsuarioConNivel(
  nivelesPermitidos: readonly NivelAcceso[],
): Promise<PersonaAutenticada | null> {
  const persona = await getPersonaAutenticada()
  if (!persona) return null
  if (!nivelesPermitidos.includes(persona.rol.nivel_acceso)) return null
  return persona
}
