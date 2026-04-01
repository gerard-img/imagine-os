import { Suspense } from 'react'
import { Sidebar } from '@/components/sidebar'
import { Header } from '@/components/header'

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
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
