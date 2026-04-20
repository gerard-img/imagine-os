/**
 * Appends short alias exports to the auto-generated Supabase types file.
 * Run via: npm run gen:types
 */
import { readFileSync, writeFileSync } from 'node:fs'

const TYPES_FILE = 'lib/supabase/types.generated.ts'
const OUTPUT_FILE = 'lib/supabase/types.ts'

const aliases = `
// ── Alias cortos para usar en componentes ──
// Generados por scripts/patch-types.mjs — no editar a mano.

export type EmpresaGrupo = Database['public']['Tables']['empresas_grupo']['Row']
export type CatalogoServicio = Database['public']['Tables']['catalogo_servicios']['Row']
export type Departamento = Database['public']['Tables']['departamentos']['Row']
export type ServicioYDept = Database['public']['Tables']['servicios_y_depts']['Row']
export type RangoInterno = Database['public']['Tables']['rangos_internos']['Row']
export type Puesto = Database['public']['Tables']['puestos']['Row']
export type Division = Database['public']['Tables']['divisiones']['Row']
export type Rol = Database['public']['Tables']['roles']['Row']
export type Ciudad = Database['public']['Tables']['ciudades']['Row']
export type Oficina = Database['public']['Tables']['oficinas']['Row']
export type Persona = Database['public']['Tables']['personas']['Row']
export type PersonaDepartamento = Database['public']['Tables']['personas_departamentos']['Row']
export type Condicion = Database['public']['Tables']['condiciones']['Row']
export type Ausencia = Database['public']['Tables']['ausencias']['Row']
export type Empresa = Database['public']['Tables']['empresas']['Row']
export type ContactoEmpresa = Database['public']['Tables']['contactos_empresas']['Row']
export type Proyecto = Database['public']['Tables']['proyectos']['Row']
export type ProyectoDepartamento = Database['public']['Tables']['proyectos_departamentos']['Row']
export type OrdenTrabajo = Database['public']['Tables']['ordenes_trabajo']['Row']
export type OrdenTrabajoPersona = Database['public']['Tables']['ordenes_trabajo_personas']['Row']
export type Asignacion = Database['public']['Tables']['asignaciones']['Row']
export type CuotaPlanificacion = Database['public']['Tables']['cuotas_planificacion']['Row']
export type HorasTrabajables = Database['public']['Tables']['horas_trabajables']['Row']
`

const generated = readFileSync(TYPES_FILE, 'utf-8')
writeFileSync(OUTPUT_FILE, generated + aliases)
console.log(`✓ ${OUTPUT_FILE} actualizado con alias`)
