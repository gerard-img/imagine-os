import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Tablas que acepta este endpoint
const VALID_TABLES = ['personas', 'empresas', 'proyectos', 'ordenes_trabajo', 'asignaciones'] as const
type ValidTable = (typeof VALID_TABLES)[number]

function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ============================================================
// POST /api/import/[tabla]
// Recibe un array de filas con nombres legibles, los resuelve
// a UUIDs y hace insert/update en Supabase.
// ============================================================

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tabla: string }> }
) {
  const { tabla } = await params

  // Auth: verificar service role key
  const authHeader = request.headers.get('authorization')
  const key = authHeader?.replace('Bearer ', '')
  if (!key || key !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }

  if (!VALID_TABLES.includes(tabla as ValidTable)) {
    return NextResponse.json({ error: `Tabla "${tabla}" no soportada` }, { status: 400 })
  }

  let rows: Record<string, unknown>[]
  try {
    rows = await request.json()
  } catch {
    return NextResponse.json({ error: 'JSON inválido' }, { status: 400 })
  }

  if (!Array.isArray(rows) || rows.length === 0) {
    return NextResponse.json({ error: 'Se esperaba un array con al menos una fila' }, { status: 400 })
  }

  const supabase = createAdminClient()
  const lookups = await loadLookups(supabase)

  const resultados: { ok: number; errores: { fila: number; error: string }[] } = {
    ok: 0,
    errores: [],
  }

  for (let i = 0; i < rows.length; i++) {
    try {
      const resolved = resolveRow(tabla as ValidTable, rows[i], lookups)
      const cleaned = cleanRow(resolved)

      if (cleaned.id) {
        const { id, ...updateData } = cleaned
        const { error } = await supabase.from(tabla).update(updateData).eq('id', id)
        if (error) throw new Error(error.message)
      } else {
        delete cleaned.id
        const { error } = await supabase.from(tabla).insert(cleaned)
        if (error) throw new Error(error.message)
      }

      resultados.ok++
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e)
      resultados.errores.push({ fila: i + 2, error: msg })
    }
  }

  return NextResponse.json(resultados)
}

// ============================================================
// LOOKUPS — carga todas las tablas de referencia en memoria
// ============================================================

type Lookups = {
  empresasGrupo: Map<string, string>
  ciudades: Map<string, string>
  oficinas: Map<string, string>
  divisiones: Map<string, string>
  roles: Map<string, string>
  rangos: Map<string, string>
  puestos: Map<string, string>
  departamentos: Map<string, string>
  departamentosPorCodigo: Map<string, string>
  servicios: Map<string, string>
  cuotas: Map<string, string>
  personas: Map<string, string>
  empresas: Map<string, string>
  proyectos: Map<string, string>
  otEmpresaGrupo: Map<string, string>
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function loadLookups(supabase: any): Promise<Lookups> {
  const [
    egRes, ciRes, ofRes, diRes, roRes, raRes, puRes,
    dpRes, svRes, cuRes, peRes, emRes, prRes, otRes,
  ] = await Promise.all([
    supabase.from('empresas_grupo').select('id, codigo, nombre'),
    supabase.from('ciudades').select('id, nombre'),
    supabase.from('oficinas').select('id, nombre'),
    supabase.from('divisiones').select('id, nombre'),
    supabase.from('roles').select('id, nombre'),
    supabase.from('rangos_internos').select('id, nombre, empresa_grupo_id'),
    supabase.from('puestos').select('id, nombre, empresa_grupo_id'),
    supabase.from('departamentos').select('id, nombre, codigo, empresa_grupo_id'),
    supabase.from('catalogo_servicios').select('id, nombre, codigo, empresa_grupo_id'),
    supabase.from('cuotas_planificacion').select('id, nombre, empresa_grupo_id'),
    supabase.from('personas').select('id, persona'),
    supabase.from('empresas').select('id, nombre_interno, nombre_legal'),
    supabase.from('proyectos').select('id, titulo, empresa_grupo_id'),
    supabase.from('ordenes_trabajo').select('id, proyecto_id, proyectos(empresa_grupo_id)'),
  ])

  // Mapa OT → empresa_grupo_id (para resolver cuotas en asignaciones)
  const otEmpresaGrupo = new Map<string, string>()
  for (const ot of otRes.data || []) {
    const proy = ot.proyectos as unknown as { empresa_grupo_id: string } | null
    if (proy) otEmpresaGrupo.set(ot.id, proy.empresa_grupo_id)
  }

  return {
    empresasGrupo: toMap(egRes.data, 'codigo'),
    ciudades: toMap(ciRes.data, 'nombre'),
    oficinas: toMap(ofRes.data, 'nombre'),
    divisiones: toMap(diRes.data, 'nombre'),
    roles: toMap(roRes.data, 'nombre'),
    rangos: toScopedMap(raRes.data, 'nombre', 'empresa_grupo_id'),
    puestos: toScopedMap(puRes.data, 'nombre', 'empresa_grupo_id'),
    departamentos: toScopedMap(dpRes.data, 'nombre', 'empresa_grupo_id'),
    departamentosPorCodigo: toScopedMap(dpRes.data, 'codigo', 'empresa_grupo_id'),
    servicios: toScopedMap(svRes.data, 'codigo', 'empresa_grupo_id'),
    cuotas: toScopedMap(cuRes.data, 'nombre', 'empresa_grupo_id'),
    personas: toMap(peRes.data, 'persona'),
    empresas: toMapWithFallback(emRes.data),
    proyectos: toScopedMap(prRes.data, 'titulo', 'empresa_grupo_id'),
    otEmpresaGrupo,
  }
}

function toMap(data: Record<string, unknown>[] | null, keyField: string): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of data || []) {
    const key = row[keyField] as string
    if (key) map.set(key, row.id as string)
  }
  return map
}

function toScopedMap(
  data: Record<string, unknown>[] | null,
  keyField: string,
  scopeField: string
): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of data || []) {
    const key = `${row[keyField]}|${row[scopeField]}`
    map.set(key, row.id as string)
  }
  return map
}

// Empresas: buscar por nombre_interno o nombre_legal
function toMapWithFallback(data: Record<string, unknown>[] | null): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of data || []) {
    if (row.nombre_interno) map.set(row.nombre_interno as string, row.id as string)
    if (row.nombre_legal) map.set(row.nombre_legal as string, row.id as string)
  }
  return map
}

// ============================================================
// RESOLVER — traduce nombres legibles a UUIDs
// ============================================================

function resolveRow(tabla: ValidTable, row: Record<string, unknown>, lookups: Lookups) {
  switch (tabla) {
    case 'personas': return resolvePersona(row, lookups)
    case 'empresas': return resolveEmpresa(row, lookups)
    case 'proyectos': return resolveProyecto(row, lookups)
    case 'ordenes_trabajo': return resolveOrdenTrabajo(row, lookups)
    case 'asignaciones': return resolveAsignacion(row, lookups)
  }
}

function resolvePersona(row: Record<string, unknown>, lk: Lookups) {
  const r: Record<string, unknown> = {}

  // Campos directos
  for (const f of [
    'id', 'persona', 'dni', 'nombre', 'apellido_primero', 'apellido_segundo',
    'fecha_incorporacion', 'fecha_baja', 'activo', 'rango_es_interino',
    'email_corporativo', 'email_personal', 'telefono', 'modalidad_trabajo',
    'nivel_ingles', 'skills_tags',
  ]) {
    if (row[f] !== undefined && row[f] !== '') r[f] = row[f]
  }

  // empresa_grupo (codigo → id)
  const eg = row.empresa_grupo as string
  if (eg) {
    const egId = lk.empresasGrupo.get(eg)
    if (!egId) throw new Error(`Empresa grupo "${eg}" no encontrada`)
    r.empresa_grupo_id = egId

    // Lookups con scope de empresa_grupo
    if (row.rango) {
      const id = lk.rangos.get(`${row.rango}|${egId}`)
      if (!id) throw new Error(`Rango "${row.rango}" no encontrado en ${eg}`)
      r.rango_id = id
    }
    if (row.puesto) {
      const id = lk.puestos.get(`${row.puesto}|${egId}`)
      if (!id) throw new Error(`Puesto "${row.puesto}" no encontrado en ${eg}`)
      r.puesto_id = id
    }
  }

  // Lookups globales
  if (row.ciudad) {
    const id = lk.ciudades.get(row.ciudad as string)
    if (!id) throw new Error(`Ciudad "${row.ciudad}" no encontrada`)
    r.ciudad_id = id
  }
  if (row.oficina) {
    const id = lk.oficinas.get(row.oficina as string)
    if (!id) throw new Error(`Oficina "${row.oficina}" no encontrada`)
    r.oficina_id = id
  }
  if (row.division) {
    const id = lk.divisiones.get(row.division as string)
    if (!id) throw new Error(`División "${row.division}" no encontrada`)
    r.division_id = id
  }
  if (row.rol) {
    const id = lk.roles.get(row.rol as string)
    if (!id) throw new Error(`Rol "${row.rol}" no encontrado`)
    r.rol_id = id
  }

  return r
}

function resolveEmpresa(row: Record<string, unknown>, lk: Lookups) {
  const r: Record<string, unknown> = {}

  for (const f of [
    'id', 'nombre_legal', 'cif', 'nombre_interno', 'estado', 'tipo',
    'tipo_cliente', 'tipo_conocido', 'estado_prospecto', 'sector', 'web',
    'calle', 'codigo_postal', 'ciudad', 'provincia', 'pais', 'telefono',
    'clasificacion_cuenta', 'fuente_captacion', 'notas',
  ]) {
    if (row[f] !== undefined && row[f] !== '') r[f] = row[f]
  }

  // responsable_cuenta (persona name → id)
  if (row.responsable_cuenta) {
    const id = lk.personas.get(row.responsable_cuenta as string)
    if (!id) throw new Error(`Persona "${row.responsable_cuenta}" no encontrada`)
    r.responsable_cuenta_id = id
  }

  return r
}

function resolveProyecto(row: Record<string, unknown>, lk: Lookups) {
  const r: Record<string, unknown> = {}

  for (const f of [
    'id', 'titulo', 'descripcion', 'tipo_proyecto', 'tipo_partida', 'estado',
    'ppto_estimado', 'fecha_activacion', 'fecha_cierre', 'tipo_facturacion',
    'probabilidad_cierre', 'valor_estimado_total', 'notas',
  ]) {
    if (row[f] !== undefined && row[f] !== '') r[f] = row[f]
  }

  // empresa_grupo (codigo → id)
  const eg = row.empresa_grupo as string
  if (eg) {
    const egId = lk.empresasGrupo.get(eg)
    if (!egId) throw new Error(`Empresa grupo "${eg}" no encontrada`)
    r.empresa_grupo_id = egId
  }

  // empresa/cliente (nombre → id)
  if (row.empresa) {
    const id = lk.empresas.get(row.empresa as string)
    if (!id) throw new Error(`Empresa/cliente "${row.empresa}" no encontrada`)
    r.empresa_id = id
  }

  // responsable (persona name → id)
  if (row.responsable) {
    const id = lk.personas.get(row.responsable as string)
    if (!id) throw new Error(`Persona "${row.responsable}" no encontrada`)
    r.responsable_id = id
  }

  return r
}

function resolveOrdenTrabajo(row: Record<string, unknown>, lk: Lookups) {
  const r: Record<string, unknown> = {}

  for (const f of [
    'id', 'mes_anio', 'porcentaje_ppto_mes', 'partida_prevista', 'partida_real',
    'estado', 'fecha_inicio', 'fecha_fin', 'titulo', 'horas_planificadas',
    'horas_reales', 'notas',
  ]) {
    if (row[f] !== undefined && row[f] !== '') r[f] = row[f]
  }

  // proyecto_id: si viene como UUID directo, usarlo
  if (row.proyecto_id) {
    r.proyecto_id = row.proyecto_id
  } else if (row.proyecto && row.empresa_grupo) {
    // Resolver por título + empresa_grupo
    const egId = lk.empresasGrupo.get(row.empresa_grupo as string)
    if (!egId) throw new Error(`Empresa grupo "${row.empresa_grupo}" no encontrada`)
    const id = lk.proyectos.get(`${row.proyecto}|${egId}`)
    if (!id) throw new Error(`Proyecto "${row.proyecto}" no encontrado en ${row.empresa_grupo}`)
    r.proyecto_id = id
  }

  // Necesitamos empresa_grupo para resolver servicio y departamento
  let egId: string | undefined
  if (row.empresa_grupo) {
    egId = lk.empresasGrupo.get(row.empresa_grupo as string)
  } else if (r.proyecto_id) {
    // Derivar de proyecto → empresa_grupo
    for (const [key, id] of lk.proyectos) {
      if (id === r.proyecto_id) {
        egId = key.split('|')[1]
        break
      }
    }
  }

  if (row.servicio && egId) {
    const id = lk.servicios.get(`${row.servicio}|${egId}`)
    if (!id) throw new Error(`Servicio "${row.servicio}" no encontrado`)
    r.servicio_id = id
  }

  if (row.departamento && egId) {
    // Intentar por nombre primero, luego por código
    const id = lk.departamentos.get(`${row.departamento}|${egId}`)
      || lk.departamentosPorCodigo.get(`${row.departamento}|${egId}`)
    if (!id) throw new Error(`Departamento "${row.departamento}" no encontrado`)
    r.departamento_id = id
  }

  if (row.aprobador) {
    const id = lk.personas.get(row.aprobador as string)
    if (!id) throw new Error(`Persona "${row.aprobador}" no encontrada`)
    r.aprobador_id = id
  }

  return r
}

function resolveAsignacion(row: Record<string, unknown>, lk: Lookups) {
  const r: Record<string, unknown> = {}

  for (const f of ['id', 'orden_trabajo_id', 'porcentaje_ppto_tm', 'horas_reales', 'notas']) {
    if (row[f] !== undefined && row[f] !== '') r[f] = row[f]
  }

  // persona (name → id)
  if (row.persona) {
    const id = lk.personas.get(row.persona as string)
    if (!id) throw new Error(`Persona "${row.persona}" no encontrada`)
    r.persona_id = id
  }

  // cuota (nombre → id, necesita empresa_grupo del OT)
  if (row.cuota && r.orden_trabajo_id) {
    const egId = lk.otEmpresaGrupo.get(r.orden_trabajo_id as string)
    if (!egId) throw new Error(`No se encontró empresa grupo para la OT "${r.orden_trabajo_id}"`)
    const id = lk.cuotas.get(`${row.cuota}|${egId}`)
    if (!id) throw new Error(`Cuota "${row.cuota}" no encontrada`)
    r.cuota_planificacion_id = id
  }

  return r
}

// ============================================================
// UTILS
// ============================================================

function cleanRow(row: Record<string, unknown>): Record<string, unknown> {
  const cleaned: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    if (value === '' || value === undefined || value === null) continue
    if (value === 'true' || value === true) { cleaned[key] = true; continue }
    if (value === 'false' || value === false) { cleaned[key] = false; continue }
    cleaned[key] = value
  }
  return cleaned
}
