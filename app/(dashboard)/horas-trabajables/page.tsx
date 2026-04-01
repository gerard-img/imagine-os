import {
  getHorasTrabajables,
  getEmpresasGrupo,
  getDepartamentos,
  getPersonas,
} from '@/lib/supabase/queries'
import { HorasTrabajablesClient } from './horas-trabajables-client'

export default async function HorasTrabajablesPage() {
  const [horasTrabajables, empresasGrupo, departamentos, personas] =
    await Promise.all([
      getHorasTrabajables(),
      getEmpresasGrupo(),
      getDepartamentos(),
      getPersonas(),
    ])

  return (
    <HorasTrabajablesClient
      horasTrabajables={horasTrabajables}
      empresasGrupo={empresasGrupo}
      departamentos={departamentos}
      personas={personas}
    />
  )
}
