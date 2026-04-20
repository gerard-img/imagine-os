'use client'

import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import Link from 'next/link'

export default function ProyectoDetalleError({
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
        <h2 className="mt-4 text-lg font-bold text-foreground">
          Error al cargar el proyecto
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          {error.message || 'No se pudo cargar el detalle del proyecto.'}
        </p>
        <div className="mt-5 flex items-center justify-center gap-3">
          <Link
            href="/proyectos"
            className="inline-flex h-8 items-center rounded-lg border border-border bg-background px-2.5 text-sm font-medium hover:bg-muted"
          >
            Volver a proyectos
          </Link>
          <Button onClick={reset}>Reintentar</Button>
        </div>
      </div>
    </div>
  )
}
