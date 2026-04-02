'use client'

import { useState } from 'react'
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generarOTsMes } from './generar-ots-mes'

type Props = {
  currentMonth: string  // YYYY-MM-01
}

export function GenerarOtsButton({ currentMonth }: Props) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ creadas: number; omitidas: number } | null>(null)
  const [error, setError] = useState('')

  async function handleGenerar() {
    setLoading(true)
    setResult(null)
    setError('')
    const res = await generarOTsMes(currentMonth)
    if (res.success) {
      setResult({ creadas: res.creadas, omitidas: res.omitidas })
    } else {
      setError(res.error ?? 'Error desconocido')
    }
    setLoading(false)
    // Limpiar feedback tras 5s
    setTimeout(() => { setResult(null); setError('') }, 5000)
  }

  // Formatear el mes para mostrarlo legible
  const [year, month] = currentMonth.split('-')
  const mesLabel = new Date(Number(year), Number(month) - 1, 1)
    .toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })

  return (
    <div className="flex items-center gap-2">
      {result && (
        <span className="flex items-center gap-1.5 text-xs text-emerald-700 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5" />
          {result.creadas} OT{result.creadas !== 1 ? 's' : ''} creada{result.creadas !== 1 ? 's' : ''}
          {result.omitidas > 0 && `, ${result.omitidas} ya existían`}
        </span>
      )}
      {error && (
        <span className="flex items-center gap-1.5 text-xs text-destructive font-medium">
          <AlertCircle className="h-3.5 w-3.5" />
          {error}
        </span>
      )}
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleGenerar}
        disabled={loading}
        title={`Generar OTs recurrentes para ${mesLabel}`}
      >
        {loading
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando...</>
          : <><Zap className="h-3.5 w-3.5" />Generar OTs del mes</>
        }
      </Button>
    </div>
  )
}
