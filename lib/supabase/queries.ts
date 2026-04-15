// ============================================================
// Queries Supabase — Company OS
//
// Funciones server-only para leer datos desde Supabase.
// Se usan desde Server Components y Server Actions.
// Cada función crea su propio cliente (patrón recomendado por Supabase).
// ============================================================

import 'server-only'
import { createClient } from './server'
import type {
  EmpresaGrupo,
  CatalogoServicio,
  Departamento,
  Persona,
  PersonaDepartamento,
  Empresa,
  Proyecto,
  ProyectoDepartamento,
  OrdenTrabajo,
  OrdenTrabajoPersona,
  Asignacion,
  CuotaPlanificacion,
  HorasTrabajables,
  ContactoEmpresa,
  Division,
  Rol,
  RangoInterno,
  Puesto,
  Ciudad,
  Oficina,
  Condicion,
  Ausencia,
  ServicioYDept,
} from './types'

// ── Helpers internos ──

async function query<T>(
  table: string,
  options?: {
    select?: string
    filters?: Array<{ column: string; op: 'eq' | 'neq' | 'is' | 'in'; value: unknown }>
    order?: { column: string; ascending?: boolean }
  }
): Promise<T[]> {
  const supabase = await createClient()
  let q = supabase.from(table).select(options?.select ?? '*')

  if (options?.filters) {
    for (const f of options.filters) {
      if (f.op === 'eq') q = q.eq(f.column, f.value)
      else if (f.op === 'neq') q = q.neq(f.column, f.value)
      else if (f.op === 'is') q = q.is(f.column, f.value as null)
      else if (f.op === 'in') q = q.in(f.column, f.value as string[])
    }
  }

  if (options?.order) {
    q = q.order(options.order.column, { ascending: options.order.ascending ?? true })
  }

  const { data, error } = await q
  if (error) throw new Error(`Error consultando ${table}: ${error.message}`)
  return (data ?? []) as T[]
}

// ── Empresas Grupo ──

export async function getEmpresasGrupo(): Promise<EmpresaGrupo[]> {
  return query<EmpresaGrupo>('empresas_grupo', {
    order: { column: 'nombre' },
  })
}

export async function getEmpresaGrupoById(id: string): Promise<EmpresaGrupo | null> {
  const supabase = await createClient()
  const { data } = await supabase.from('empresas_grupo').select('*').eq('id', id).single()
  return data
}

// ── Catálogo Servicios ──

export async function getCatalogoServicios(): Promise<CatalogoServicio[]> {
  return query<CatalogoServicio>('catalogo_servicios', {
    order: { column: 'nombre' },
  })
}

// ── Departamentos ──

export async function getDepartamentos(): Promise<Departamento[]> {
  return query<Departamento>('departamentos', {
    order: { column: 'nombre' },
  })
}

// ── Lookups globales ──

export async function getDivisiones(): Promise<Division[]> {
  return query<Division>('divisiones', { order: { column: 'nombre' } })
}

export async function getRoles(): Promise<Rol[]> {
  return query<Rol>('roles', { order: { column: 'nombre' } })
}

export async function getRangosInternos(): Promise<RangoInterno[]> {
  return query<RangoInterno>('rangos_internos', { order: { column: 'orden' } })
}

export async function getPuestos(): Promise<Puesto[]> {
  return query<Puesto>('puestos', { order: { column: 'nombre' } })
}

export async function getCiudades(): Promise<Ciudad[]> {
  return query<Ciudad>('ciudades', { order: { column: 'nombre' } })
}

export async function getOficinas(): Promise<Oficina[]> {
  return query<Oficina>('oficinas', { order: { column: 'nombre' } })
}

// ── Personas ──

export async function getPersonas(): Promise<Persona[]> {
  return query<Persona>('personas', {
    order: { column: 'persona' },
  })
}

export async function getPersonaById(id: string): Promise<Persona | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('personas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Persona
}

export async function getPersonasDepartamentos(): Promise<PersonaDepartamento[]> {
  return query<PersonaDepartamento>('personas_departamentos')
}

// ── Condiciones (historial laboral) ──

export async function getCondicionesByPersona(personaId: string): Promise<Condicion[]> {
  return query<Condicion>('condiciones', {
    filters: [
      { column: 'persona_id', op: 'eq', value: personaId },
      { column: 'deleted_at', op: 'is', value: null },
    ],
    order: { column: 'fecha_inicio', ascending: false },
  })
}

// ── Ausencias ──

export async function getAusenciasByPersona(personaId: string): Promise<Ausencia[]> {
  return query<Ausencia>('ausencias', {
    filters: [{ column: 'persona_id', op: 'eq', value: personaId }],
    order: { column: 'fecha_inicio', ascending: false },
  })
}

// ── Empresas (clientes) ──

export async function getEmpresas(): Promise<Empresa[]> {
  return query<Empresa>('empresas', {
    order: { column: 'nombre_legal' },
  })
}

export async function getEmpresaById(id: string): Promise<Empresa | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('empresas')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Empresa
}

// ── Proyectos ──

/**
 * Por defecto excluye borrados. Incluye archivados (las otras páginas los necesitan).
 * NOTA: el filtro de deleted_at requiere migración 046. Si la columna no existe aún,
 * se devuelven todos (graceful fallback).
 */
export async function getProyectos(opciones?: { incluirEliminados?: boolean }): Promise<Proyecto[]> {
  const supabase = await createClient()

  if (opciones?.incluirEliminados) {
    const { data, error } = await supabase.from('proyectos').select('*').order('titulo')
    if (error) throw new Error(`Error consultando proyectos: ${error.message}`)
    return (data ?? []) as Proyecto[]
  }

  // Intentar filtrar por deleted_at; si la columna no existe aún, fallback sin filtro
  const { data, error } = await supabase.from('proyectos').select('*').is('deleted_at', null).order('titulo')
  if (error?.message?.includes('does not exist')) {
    const { data: fallback, error: err2 } = await supabase.from('proyectos').select('*').order('titulo')
    if (err2) throw new Error(`Error consultando proyectos: ${err2.message}`)
    return (fallback ?? []) as Proyecto[]
  }
  if (error) throw new Error(`Error consultando proyectos: ${error.message}`)
  return (data ?? []) as Proyecto[]
}

/** Trae todos los proyectos incluyendo eliminados (para la vista de papelera). */
export async function getProyectosConEliminados(): Promise<Proyecto[]> {
  return getProyectos({ incluirEliminados: true })
}

export async function getProyectoById(id: string): Promise<Proyecto | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('proyectos')
    .select('*')
    .eq('id', id)
    .single()
  if (error) return null
  return data as Proyecto
}

export async function getProyectosByEmpresa(empresaId: string): Promise<Proyecto[]> {
  const supabase = await createClient()
  let q = supabase.from('proyectos').select('*').eq('empresa_id', empresaId)

  // Intentar filtrar por deleted_at si la columna existe
  const { data, error } = await q.is('deleted_at', null).order('created_at', { ascending: false })
  if (error?.message?.includes('does not exist')) {
    const { data: fallback, error: err2 } = await supabase
      .from('proyectos').select('*').eq('empresa_id', empresaId).order('created_at', { ascending: false })
    if (err2) throw new Error(`Error consultando proyectos: ${err2.message}`)
    return (fallback ?? []) as Proyecto[]
  }
  if (error) throw new Error(`Error consultando proyectos: ${error.message}`)
  return (data ?? []) as Proyecto[]
}

export async function getProyectosDepartamentos(): Promise<ProyectoDepartamento[]> {
  return query<ProyectoDepartamento>('proyectos_departamentos')
}

export async function getProyectosDepartamentosByProyecto(proyectoId: string): Promise<ProyectoDepartamento[]> {
  return query<ProyectoDepartamento>('proyectos_departamentos', {
    filters: [{ column: 'proyecto_id', op: 'eq', value: proyectoId }],
  })
}

// ── Órdenes de trabajo ──

export async function getOrdenesTrabajo(): Promise<OrdenTrabajo[]> {
  return query<OrdenTrabajo>('ordenes_trabajo', {
    filters: [{ column: 'deleted_at', op: 'is', value: null }],
    order: { column: 'mes_anio' },
  })
}

/**
 * Órdenes cuyo `mes_anio` cae dentro del rango [desde, hasta] (inclusivo).
 * Ambos extremos en formato "YYYY-MM-01".
 */
export async function getOrdenesTrabajoEnRango(
  desde: string,
  hasta: string,
): Promise<OrdenTrabajo[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('ordenes_trabajo')
    .select('*')
    .is('deleted_at', null)
    .gte('mes_anio', desde)
    .lte('mes_anio', hasta)
    .order('mes_anio')
  if (error) throw new Error(`Error consultando ordenes_trabajo: ${error.message}`)
  return (data ?? []) as OrdenTrabajo[]
}

export async function getOrdenesTrabajoByMes(mes: string): Promise<OrdenTrabajo[]> {
  return query<OrdenTrabajo>('ordenes_trabajo', {
    filters: [
      { column: 'deleted_at', op: 'is', value: null },
      { column: 'mes_anio', op: 'eq', value: mes },
    ],
    order: { column: 'created_at' },
  })
}

export async function getOrdenesTrabajoByProyecto(proyectoId: string): Promise<OrdenTrabajo[]> {
  return query<OrdenTrabajo>('ordenes_trabajo', {
    filters: [
      { column: 'deleted_at', op: 'is', value: null },
      { column: 'proyecto_id', op: 'eq', value: proyectoId },
    ],
    order: { column: 'mes_anio', ascending: false },
  })
}

export async function getOrdenesTrabajoPersonas(): Promise<OrdenTrabajoPersona[]> {
  return query<OrdenTrabajoPersona>('ordenes_trabajo_personas')
}

// ── Asignaciones ──

export async function getAsignaciones(): Promise<Asignacion[]> {
  return query<Asignacion>('asignaciones', {
    filters: [{ column: 'deleted_at', op: 'is', value: null }],
  })
}

/**
 * Asignaciones cuyas órdenes caen dentro del rango [desde, hasta] (inclusivo).
 * Hace join interno contra `ordenes_trabajo.mes_anio` para filtrar en servidor.
 */
export async function getAsignacionesEnRango(
  desde: string,
  hasta: string,
): Promise<Asignacion[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('asignaciones')
    .select('*, ordenes_trabajo!inner(mes_anio)')
    .is('deleted_at', null)
    .gte('ordenes_trabajo.mes_anio', desde)
    .lte('ordenes_trabajo.mes_anio', hasta)
  if (error) throw new Error(`Error consultando asignaciones: ${error.message}`)
  // Quitar el campo embebido `ordenes_trabajo` para devolver `Asignacion` limpia.
  return (data ?? []).map(({ ordenes_trabajo: _ot, ...rest }) => rest) as Asignacion[]
}

export async function getAsignacionesByOrden(ordenId: string): Promise<Asignacion[]> {
  return query<Asignacion>('asignaciones', {
    filters: [
      { column: 'deleted_at', op: 'is', value: null },
      { column: 'orden_trabajo_id', op: 'eq', value: ordenId },
    ],
  })
}

// ── Cuotas de planificación ──

export async function getCuotasPlanificacion(): Promise<CuotaPlanificacion[]> {
  return query<CuotaPlanificacion>('cuotas_planificacion', {
    order: { column: 'nombre' },
  })
}

// ── Servicios y departamentos (N:M) ──

export async function getServiciosYDepts(): Promise<ServicioYDept[]> {
  return query<ServicioYDept>('servicios_y_depts')
}

// ── Contactos de empresas ──

export async function getContactosEmpresas(): Promise<ContactoEmpresa[]> {
  return query<ContactoEmpresa>('contactos_empresas', {
    order: { column: 'nombre' },
  })
}

export async function getContactosEmpresasByEmpresa(empresaId: string): Promise<ContactoEmpresa[]> {
  return query<ContactoEmpresa>('contactos_empresas', {
    filters: [{ column: 'empresa_id', op: 'eq', value: empresaId }],
    order: { column: 'nombre' },
  })
}

// ── Asignaciones por persona ──

export async function getAsignacionesByPersona(personaId: string): Promise<Asignacion[]> {
  return query<Asignacion>('asignaciones', {
    filters: [
      { column: 'deleted_at', op: 'is', value: null },
      { column: 'persona_id', op: 'eq', value: personaId },
    ],
  })
}

// ── Horas trabajables ──

export async function getHorasTrabajables(): Promise<HorasTrabajables[]> {
  return query<HorasTrabajables>('horas_trabajables')
}

/**
 * Horas trabajables cuyo `mes_trabajo` cae en [desde, hasta] (inclusivo).
 */
export async function getHorasTrabajablesEnRango(
  desde: string,
  hasta: string,
): Promise<HorasTrabajables[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('horas_trabajables')
    .select('*')
    .gte('mes_trabajo', desde)
    .lte('mes_trabajo', hasta)
  if (error) throw new Error(`Error consultando horas_trabajables: ${error.message}`)
  return (data ?? []) as HorasTrabajables[]
}

// ── Función compuesta: resolver horas trabajables por persona/mes ──
// Prioridad: override persona > override departamento > general empresa

export async function resolverHorasTrabajablesPersona(
  personaId: string,
  mes: string,
  // Se pasan pre-cargados para evitar N+1 queries
  personasDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[],
  personas: Persona[]
): Promise<number> {
  const persona = personas.find((p) => p.id === personaId)
  if (!persona) return 0

  // 1. Override por persona
  const overridePersona = horasTrab.find(
    (h) => h.persona_id === personaId && h.mes_trabajo === mes
  )
  if (overridePersona) return overridePersona.horas

  // 2. Override por departamento (principal de la persona)
  const depts = personasDepts
    .filter((pd) => pd.persona_id === personaId)
    .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
  if (depts.length > 0) {
    const deptPrincipalId = depts[0].departamento_id
    const overrideDepto = horasTrab.find(
      (h) =>
        h.departamento_id === deptPrincipalId &&
        !h.persona_id &&
        h.mes_trabajo === mes
    )
    if (overrideDepto) return overrideDepto.horas
  }

  // 3. General de la empresa
  const general = horasTrab.find(
    (h) =>
      h.empresa_grupo_id === persona.empresa_grupo_id &&
      !h.departamento_id &&
      !h.persona_id &&
      h.mes_trabajo === mes
  )
  return general?.horas ?? 0
}
