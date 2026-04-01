import { getEmpresas } from '@/lib/supabase/queries'
import { getContactosEmpresas } from '@/lib/supabase/queries'
import { ContactosClient } from './contactos-client'

export default async function ContactosPage() {
  const [contactos, empresas] = await Promise.all([
    getContactosEmpresas(),
    getEmpresas(),
  ])

  return <ContactosClient contactos={contactos} empresas={empresas} />
}
