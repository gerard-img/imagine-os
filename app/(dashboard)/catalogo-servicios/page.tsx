import { getCatalogoServicios, getEmpresasGrupo } from '@/lib/supabase/queries'
import { CatalogoClient } from './catalogo-client'

export default async function CatalogoServiciosPage() {
  const [servicios, empresas] = await Promise.all([getCatalogoServicios(), getEmpresasGrupo()])

  return <CatalogoClient servicios={servicios} empresas={empresas} />
}
