'use client'

import { TrendingUp, TrendingDown } from 'lucide-react'

function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

function calcDelta(actual: number, anterior: number): number | null {
  if (anterior === 0) return null
  return ((actual - anterior) / anterior) * 100
}

/** Mini indicador de tendencia vs periodo anterior */
export function KpiDelta({
  actual,
  anterior,
  invertir = false,
}: {
  actual: number
  anterior: number
  invertir?: boolean
}) {
  const delta = calcDelta(actual, anterior)
  if (delta === null) return <span className="text-[11px] text-muted-foreground">sin datos previos</span>

  const positivo = delta > 0
  const esBueno = invertir ? !positivo : positivo
  const color = Math.abs(delta) < 1
    ? 'text-muted-foreground'
    : esBueno ? 'text-emerald-600' : 'text-red-500'

  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] font-medium ${color}`}>
      {positivo ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {formatPct(delta)} vs ant.
    </span>
  )
}
