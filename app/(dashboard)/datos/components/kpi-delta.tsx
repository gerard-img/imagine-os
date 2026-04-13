'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'
import { formatPct } from './helpers-ui'

export function KpiDelta({ actual, anterior, invertir = false }: { actual: number; anterior: number; invertir?: boolean }) {
  if (anterior === 0) return <span className="text-[11px] text-muted-foreground">sin datos previos</span>

  const delta = ((actual - anterior) / anterior) * 100
  const positivo = delta > 0
  const esBueno = invertir ? !positivo : positivo
  const color = Math.abs(delta) < 1 ? 'text-muted-foreground' : esBueno ? 'text-emerald-600' : 'text-red-500'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPct(delta)} vs ant.
    </span>
  )
}
