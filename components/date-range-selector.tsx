'use client'

import { useState, useRef, useEffect } from 'react'
import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react'

export interface DateRange {
  desde: string // "YYYY-MM-01"
  hasta: string // "YYYY-MM-01"
}

interface DateRangeSelectorProps {
  value: DateRange
  onChange: (range: DateRange) => void
}

const MESES = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
]

// ── Helpers ───────────────────────────────────────────────────

function toMonthStr(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, '0')}-01`
}

function parseMonth(dateStr: string): { year: number; month: number } {
  const d = new Date(dateStr + 'T00:00:00')
  return { year: d.getFullYear(), month: d.getMonth() }
}

function formatLabel(dateStr: string): string {
  const { year, month } = parseMonth(dateStr)
  return `${MESES[month]} ${year}`
}

function formatRangeLabel(desde: string, hasta: string): string {
  if (desde === hasta) return formatLabel(desde)
  const d = parseMonth(desde)
  const h = parseMonth(hasta)
  if (d.year === h.year) {
    return `${MESES[d.month]} – ${MESES[h.month]} ${d.year}`
  }
  return `${MESES[d.month]} ${d.year} – ${MESES[h.month]} ${h.year}`
}

function currentMonthStr(): string {
  const now = new Date()
  return toMonthStr(now.getFullYear(), now.getMonth())
}

function shiftMonths(dateStr: string, delta: number): string {
  const d = new Date(dateStr + 'T00:00:00')
  d.setMonth(d.getMonth() + delta)
  return toMonthStr(d.getFullYear(), d.getMonth())
}

function monthsBetween(desde: string, hasta: string): number {
  const d = parseMonth(desde)
  const h = parseMonth(hasta)
  return (h.year - d.year) * 12 + (h.month - d.month)
}

// ── Presets ────────────────────────────────────────────────────

type PresetKey = 'este_mes' | 'mes_anterior' | 'trimestre' | 'semestre' | 'anio' | 'personalizado'

interface Preset {
  key: PresetKey
  label: string
  getRange: () => DateRange
}

function buildPresets(): Preset[] {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()

  return [
    {
      key: 'este_mes',
      label: 'Este mes',
      getRange: () => ({ desde: toMonthStr(y, m), hasta: toMonthStr(y, m) }),
    },
    {
      key: 'mes_anterior',
      label: 'Mes anterior',
      getRange: () => {
        const prev = shiftMonths(toMonthStr(y, m), -1)
        return { desde: prev, hasta: prev }
      },
    },
    {
      key: 'trimestre',
      label: 'Último trimestre',
      getRange: () => ({
        desde: shiftMonths(toMonthStr(y, m), -2),
        hasta: toMonthStr(y, m),
      }),
    },
    {
      key: 'semestre',
      label: 'Último semestre',
      getRange: () => ({
        desde: shiftMonths(toMonthStr(y, m), -5),
        hasta: toMonthStr(y, m),
      }),
    },
    {
      key: 'anio',
      label: `Año ${y}`,
      getRange: () => ({
        desde: toMonthStr(y, 0),
        hasta: toMonthStr(y, 11),
      }),
    },
  ]
}

function detectPreset(desde: string, hasta: string): PresetKey {
  const presets = buildPresets()
  for (const p of presets) {
    const r = p.getRange()
    if (r.desde === desde && r.hasta === hasta) return p.key
  }
  return 'personalizado'
}

// ── Componente ────────────────────────────────────────────────

export function DateRangeSelector({ value, onChange }: DateRangeSelectorProps) {
  const [open, setOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Estado interno para el picker: seleccionando "desde" o "hasta"
  const [selecting, setSelecting] = useState<'desde' | 'hasta'>('desde')
  const [tempDesde, setTempDesde] = useState(value.desde)
  const [tempHasta, setTempHasta] = useState(value.hasta)
  const [pickerYear, setPickerYear] = useState(() => parseMonth(value.desde).year)

  const presets = buildPresets()
  const activePreset = detectPreset(value.desde, value.hasta)

  // Sincronizar estado temporal cuando se abre
  useEffect(() => {
    if (open) {
      setTempDesde(value.desde)
      setTempHasta(value.hasta)
      setSelecting('desde')
      setPickerYear(parseMonth(value.desde).year)
    }
  }, [open, value.desde, value.hasta])

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

  function selectPreset(preset: Preset) {
    const range = preset.getRange()
    onChange(range)
    setOpen(false)
  }

  function handleMonthClick(monthIndex: number) {
    const clicked = toMonthStr(pickerYear, monthIndex)

    if (selecting === 'desde') {
      setTempDesde(clicked)
      // Si el "hasta" queda antes que "desde", ajustar
      if (clicked > tempHasta) {
        setTempHasta(clicked)
      }
      setSelecting('hasta')
    } else {
      // Seleccionando "hasta"
      if (clicked < tempDesde) {
        // Clic antes del desde → reiniciar desde aquí
        setTempDesde(clicked)
        setTempHasta(clicked)
        setSelecting('hasta')
      } else {
        setTempHasta(clicked)
        // Aplicar rango
        onChange({ desde: tempDesde, hasta: clicked })
        setOpen(false)
      }
    }
  }

  function getMonthState(monthIndex: number): 'start' | 'end' | 'in-range' | 'none' {
    const m = toMonthStr(pickerYear, monthIndex)
    if (m === tempDesde && m === tempHasta) return 'start'
    if (m === tempDesde) return 'start'
    if (m === tempHasta) return 'end'
    if (m > tempDesde && m < tempHasta) return 'in-range'
    return 'none'
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-lg border border-border bg-white px-3 py-1.5 text-sm font-semibold text-foreground hover:bg-muted/50 transition-colors"
      >
        <CalendarDays className="h-4 w-4 text-muted-foreground" />
        {formatRangeLabel(value.desde, value.hasta)}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute right-0 top-full z-50 mt-1 flex rounded-xl border bg-white shadow-lg">
          {/* Presets */}
          <div className="border-r border-border p-2 w-[150px]">
            <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Rango rápido
            </p>
            {presets.map((p) => (
              <button
                key={p.key}
                onClick={() => selectPreset(p)}
                className={`w-full rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                  activePreset === p.key
                    ? 'bg-emerald-50 text-emerald-700 font-semibold'
                    : 'text-foreground hover:bg-muted'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Month grid picker */}
          <div className="p-3 w-[250px]">
            {/* Indicador de selección */}
            <div className="mb-2 flex items-center gap-2 text-[11px]">
              <button
                onClick={() => setSelecting('desde')}
                className={`rounded-md px-2 py-1 transition-colors ${
                  selecting === 'desde'
                    ? 'bg-emerald-100 text-emerald-700 font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Desde: {formatLabel(tempDesde)}
              </button>
              <span className="text-muted-foreground">→</span>
              <button
                onClick={() => setSelecting('hasta')}
                className={`rounded-md px-2 py-1 transition-colors ${
                  selecting === 'hasta'
                    ? 'bg-emerald-100 text-emerald-700 font-semibold'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                Hasta: {formatLabel(tempHasta)}
              </button>
            </div>

            {/* Selector de año */}
            <div className="flex items-center justify-between mb-2">
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
            <div className="grid grid-cols-3 gap-1">
              {MESES.map((label, i) => {
                const state = getMonthState(i)
                let classes = 'rounded-lg px-2 py-1.5 text-xs font-medium transition-colors '
                if (state === 'start' || state === 'end') {
                  classes += 'bg-emerald-500 text-white'
                } else if (state === 'in-range') {
                  classes += 'bg-emerald-50 text-emerald-700'
                } else {
                  classes += 'text-foreground hover:bg-muted'
                }
                return (
                  <button
                    key={i}
                    onClick={() => handleMonthClick(i)}
                    className={classes}
                  >
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Utilidades exportadas ─────────────────────────────────────

/** Genera array de meses entre desde y hasta (inclusivos) */
export function generateMonthRange(desde: string, hasta: string): string[] {
  const meses: string[] = []
  const d = parseMonth(desde)
  const h = parseMonth(hasta)
  let year = d.year
  let month = d.month

  while (year < h.year || (year === h.year && month <= h.month)) {
    meses.push(toMonthStr(year, month))
    month++
    if (month > 11) { month = 0; year++ }
  }

  return meses
}

/** Calcula el rango "anterior equivalente" para comparación de KPIs */
export function rangoPrevioEquivalente(desde: string, hasta: string): DateRange {
  const nMeses = monthsBetween(desde, hasta) + 1
  const nuevaHasta = shiftMonths(desde, -1)
  const nuevaDesde = shiftMonths(nuevaHasta, -(nMeses - 1))
  return { desde: nuevaDesde, hasta: nuevaHasta }
}

/** Devuelve el mes actual como rango por defecto */
export function defaultDateRange(): DateRange {
  const mes = currentMonthStr()
  return { desde: mes, hasta: mes }
}
