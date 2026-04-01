'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavigatorProps {
  /** Date string in format "YYYY-MM-01" */
  value: string
  onChange: (value: string) => void
}

function formatMonthLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  return date.toLocaleDateString('es-ES', { month: 'short', year: 'numeric' }).toUpperCase()
}

function shiftMonth(dateStr: string, delta: number): string {
  const date = new Date(dateStr + 'T00:00:00')
  date.setMonth(date.getMonth() + delta)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export function MonthNavigator({ value, onChange }: MonthNavigatorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange(shiftMonth(value, -1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[110px] text-center text-sm font-semibold text-foreground">
        {formatMonthLabel(value)}
      </span>
      <button
        onClick={() => onChange(shiftMonth(value, 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}
