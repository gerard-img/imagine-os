'use client'

import { useState } from 'react'
import { ChevronRight, Loader2, Check } from 'lucide-react'
import { avanzarEstadoOT } from './actions'

const SIGUIENTE: Record<string, string> = {
  'Propuesto':   'Planificado',
  'Planificado': 'Realizado',
  'Realizado':   'Confirmado',
  'Confirmado':  'Facturado',
}

// Color del label del siguiente estado
const SIGUIENTE_COLOR: Record<string, string> = {
  'Planificado': 'text-amber-600',
  'Realizado':   'text-blue-600',
  'Confirmado':  'text-purple-600',
  'Facturado':   'text-emerald-600',
}

type Props = { otId: string; estadoActual: string }

export function AvanzarEstadoButton({ otId, estadoActual }: Props) {
  const siguienteEstado = SIGUIENTE[estadoActual]
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  if (!siguienteEstado) return null // Facturado: estado final

  async function handleClick() {
    setLoading(true)
    await avanzarEstadoOT(otId)
    setDone(true)
    setLoading(false)
    // El revalidatePath refresca los datos; el componente se desmonta al remontar la tabla
  }

  const color = SIGUIENTE_COLOR[siguienteEstado] ?? 'text-muted-foreground'

  return (
    <button
      onClick={handleClick}
      disabled={loading || done}
      title={`Pasar a ${siguienteEstado}`}
      className={`flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-semibold transition-colors hover:bg-muted disabled:opacity-60 ${color}`}
    >
      {loading ? (
        <Loader2 className="h-3 w-3 animate-spin" />
      ) : done ? (
        <Check className="h-3 w-3" />
      ) : (
        <>
          <ChevronRight className="h-3 w-3" />
          {siguienteEstado}
        </>
      )}
    </button>
  )
}
