'use client'

import { useState, useRef, useEffect } from 'react'
import { Loader2, Check } from 'lucide-react'
import { cambiarEstadoOT } from '@/app/(dashboard)/ordenes-trabajo/actions'
import { ESTADOS_OT } from '@/lib/schemas/orden-trabajo'
import { cn } from '@/lib/utils'

const statusStyles: Record<string, { badge: string; item: string }> = {
  'Propuesto':   { badge: 'bg-gray-100 text-gray-600 border border-gray-400',         item: 'text-gray-600' },
  'Planificado': { badge: 'bg-amber-50 text-amber-700 border border-amber-400',       item: 'text-amber-700' },
  'Realizado':   { badge: 'bg-blue-50 text-blue-700 border border-blue-400',           item: 'text-blue-700' },
  'Confirmado':  { badge: 'bg-purple-50 text-purple-700 border border-purple-400',     item: 'text-purple-700' },
  'Facturado':   { badge: 'bg-emerald-50 text-emerald-700 border border-emerald-400', item: 'text-emerald-700' },
}

type Props = {
  otId: string
  estadoActual: string
}

export function CambiarEstadoOT({ otId, estadoActual }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  async function handleChange(nuevoEstado: string) {
    if (nuevoEstado === estadoActual) { setOpen(false); return }
    setLoading(true)
    setError('')
    setOpen(false)
    const result = await cambiarEstadoOT(otId, nuevoEstado)
    if (!result.success) setError(result.error ?? 'Error')
    setLoading(false)
  }

  const current = statusStyles[estadoActual] ?? { badge: 'bg-gray-100 text-gray-600', item: 'text-gray-600' }

  return (
    <div className="relative" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        onClick={() => { setOpen(!open); setError('') }}
        disabled={loading}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-xs font-semibold transition-all cursor-pointer',
          'hover:ring-2 hover:ring-offset-1 hover:ring-current/20',
          'disabled:opacity-60',
          current.badge,
        )}
      >
        {loading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : null}
        {estadoActual.toUpperCase()}
      </button>

      {error && (
        <div className="absolute left-0 top-full mt-1 z-50 max-w-[220px] rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 shadow-lg">
          {error}
        </div>
      )}

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[150px] rounded-lg border border-border bg-white py-1 shadow-lg">
          {ESTADOS_OT.map((estado) => {
            const style = statusStyles[estado] ?? { item: 'text-gray-600' }
            const isActive = estado === estadoActual
            return (
              <button
                key={estado}
                onClick={() => handleChange(estado)}
                className={cn(
                  'flex w-full items-center justify-between px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted/50',
                  style.item,
                  isActive && 'font-bold',
                )}
              >
                {estado}
                {isActive && <Check className="h-3.5 w-3.5" />}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
