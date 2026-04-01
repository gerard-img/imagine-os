import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'
import { getPersonaAutenticada } from '@/lib/supabase/auth-helpers'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const persona = await getPersonaAutenticada()

  // Si el usuario está logueado pero su email no está en personas → sin acceso
  if (!persona) {
    redirect('/sin-acceso')
  }

  return (
    <div className="flex min-h-screen">
      <Suspense>
        <Sidebar />
      </Suspense>
      <div className="ml-[220px] flex-1 flex flex-col">
        <Header />
        <main className="flex-1 bg-[#F9FAFB] p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
