'use client'

import { useState, useEffect } from 'react'
import type { Proyecto } from '@/lib/supabase/types'

function calcularProgresoTiempo(proyecto: Proyecto): number | null {
  if (!proyecto.fecha_activacion || !proyecto.fecha_cierre) return null
  const inicio = new Date(proyecto.fecha_activacion).getTime()
  const fin = new Date(proyecto.fecha_cierre).getTime()
  const hoy = Date.now()
  if (fin <= inicio) return null
  return Math.min(Math.max(((hoy - inicio) / (fin - inicio)) * 100, 0), 110)
}

export function BarraTiempo({ proyecto }: { proyecto: Proyecto }) {
  const [pct, setPct] = useState<number | null>(null)

  useEffect(() => {
    if (proyecto.tipo_partida === 'Puntual') {
      setPct(calcularProgresoTiempo(proyecto))
    }
  }, [proyecto])

  if (pct === null) return null

  const color = pct > 100 ? 'bg-red-500' : pct > 85 ? 'bg-amber-400' : 'bg-emerald-500'
  const vencido = pct > 100

  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="relative h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color}`}
          style={{ width: `${Math.min(pct, 100)}%` }}
        />
      </div>
      <span className={`text-[10px] font-semibold shrink-0 tabular-nums ${vencido ? 'text-red-600' : 'text-muted-foreground'}`}>
        {Math.round(pct)}%{vencido ? ' ⚠' : ''}
      </span>
    </div>
  )
}
