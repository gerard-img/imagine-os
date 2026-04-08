'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface MonthNavigatorProps {
  /** Date string in format "YYYY-MM-01" */
  value: string
  onChange: (value: string) => void
}

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

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

function parseValue(dateStr: string) {
  const date = new Date(dateStr + 'T00:00:00')
  return { year: date.getFullYear(), month: date.getMonth() }
}

export function MonthNavigator({ value, onChange }: MonthNavigatorProps) {
  const [open, setOpen] = useState(false)
  const { year, month } = parseValue(value)
  const [pickerYear, setPickerYear] = useState(year)
  const panelRef = useRef<HTMLDivElement>(null)

  // Sincronizar año del picker cuando cambia el value externo
  useEffect(() => {
    setPickerYear(parseValue(value).year)
  }, [value])

  // Cerrar al hacer click fuera
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  function selectMonth(m: number) {
    const mStr = String(m + 1).padStart(2, '0')
    onChange(`${pickerYear}-${mStr}-01`)
    setOpen(false)
  }

  return (
    <div className="relative" ref={panelRef}>
      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(shiftMonth(value, -1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <button
          onClick={() => { setPickerYear(year); setOpen((o) => !o) }}
          className="min-w-[110px] text-center text-sm font-semibold text-foreground rounded-md px-2 py-1 hover:bg-muted transition-colors cursor-pointer"
        >
          {formatMonthLabel(value)}
        </button>
        <button
          onClick={() => onChange(shiftMonth(value, 1))}
          className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 w-[240px] rounded-xl border bg-white p-3 shadow-lg">
          {/* Selector de año */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={() => setPickerYear((y) => y - 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-semibold">{pickerYear}</span>
            <button
              onClick={() => setPickerYear((y) => y + 1)}
              className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground hover:bg-muted transition-colors"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Grid de meses */}
          <div className="grid grid-cols-3 gap-1.5">
            {MESES.map((label, i) => {
              const isActive = pickerYear === year && i === month
              return (
                <button
                  key={i}
                  onClick={() => selectMonth(i)}
                  className={`rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500 text-white'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
