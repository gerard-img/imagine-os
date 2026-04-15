import type {
  Persona,
  PersonaDepartamento,
  HorasTrabajables,
} from '@/lib/supabase/types'

// Resolver horas trabajables de una persona para un mes, en cliente.
// Prioridad: override persona > override departamento principal > general empresa_grupo.
// (Misma lógica que resolverHorasTrabajablesPersona en lib/supabase/queries.ts,
//  pero trabajando con datos ya cargados en memoria.)
export function resolverHorasTrabajables(
  personaId: string,
  mes: string,
  personasMap: Map<string, Persona>,
  persDepts: PersonaDepartamento[],
  horasTrab: HorasTrabajables[]
): number {
  const persona = personasMap.get(personaId)
  if (!persona) return 0

  const overridePersona = horasTrab.find(
    (h) => h.persona_id === personaId && h.mes_trabajo === mes
  )
  if (overridePersona) return overridePersona.horas

  const depts = persDepts
    .filter((pd) => pd.persona_id === personaId)
    .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
  if (depts.length > 0) {
    const deptPrincipalId = depts[0].departamento_id
    const overrideDepto = horasTrab.find(
      (h) => h.departamento_id === deptPrincipalId && !h.persona_id && h.mes_trabajo === mes
    )
    if (overrideDepto) return overrideDepto.horas
  }

  const general = horasTrab.find(
    (h) =>
      h.empresa_grupo_id === persona.empresa_grupo_id &&
      !h.departamento_id &&
      !h.persona_id &&
      h.mes_trabajo === mes
  )
  return general?.horas ?? 0
}
