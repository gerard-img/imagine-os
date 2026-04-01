'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center py-20">
      <div className="rounded-xl bg-white p-8 shadow-sm text-center max-w-md">
        <AlertTriangle className="mx-auto h-10 w-10 text-amber-500" />
        <h2 className="mt-4 text-lg font-bold text-foreground">Algo salió mal</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'Ha ocurrido un error inesperado al cargar esta página.'}
        </p>
        <Button onClick={reset} className="mt-5">
          Reintentar
        </Button>
      </div>
    </div>
  )
}
