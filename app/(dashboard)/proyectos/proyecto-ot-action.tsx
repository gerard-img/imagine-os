'use client'

import { useState } from 'react'
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { generarOTsPuntual, type GenerarPuntualResult } from '../ordenes-trabajo/generar-ots-puntual'
import { generarOTsProyectoMes, type GenerarResult } from '../ordenes-trabajo/generar-ots-mes'
import { OtFormSheet } from '../ordenes-trabajo/ot-form-sheet'
import type { Proyecto, CatalogoServicio, Departamento, Persona, Empresa } from '@/lib/supabase/types'

type Props = {
  proyecto: Proyecto
  proyectos: Proyecto[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  /** Si se proporciona, muestra también "Generar OT del mes" para proyectos Recurrentes */
  currentMonth?: string
  /** Callback tras crear una OT nueva (recibe el id). Permite encadenar la creación de asignaciones. */
  onCreated?: (id: string) => void
}

function Feedback({ result, error }: { result: { creadas: number; omitidas: number; meses?: number } | null; error: string }) {
  if (result) return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-emerald-700">
      <CheckCircle2 className="h-3.5 w-3.5" />
      {result.creadas} OT{result.creadas !== 1 ? 's' : ''} creada{result.creadas !== 1 ? 's' : ''}
      {result.omitidas > 0 && `, ${result.omitidas} ya existían`}
      {result.meses != null && ` (${result.meses} mes${result.meses !== 1 ? 'es' : ''})`}
    </span>
  )
  if (error) return (
    <span className="flex items-center gap-1.5 text-xs font-medium text-destructive">
      <AlertCircle className="h-3.5 w-3.5" />
      {error}
    </span>
  )
  return null
}

/**
 * Botón adaptativo según el tipo de partida del proyecto:
 *  - Puntual:    "Generar OTs" one-click → genera todas las OTs del rango de fechas
 *  - Recurrente: "Nueva OT" (form) + opcionalmente "Generar OT del mes" one-click
 *                si se pasa currentMonth (usado desde la página de detalle)
 */
export function ProyectoOtAction({
  proyecto, proyectos, servicios, departamentos, personas, empresas, currentMonth, onCreated,
}: Props) {
  const [loadingPuntual, setLoadingPuntual] = useState(false)
  const [resultPuntual, setResultPuntual] = useState<GenerarPuntualResult | null>(null)
  const [errorPuntual, setErrorPuntual] = useState('')

  const [loadingMes, setLoadingMes] = useState(false)
  const [resultMes, setResultMes] = useState<GenerarResult | null>(null)
  const [errorMes, setErrorMes] = useState('')

  function clearAfter(
    setResult: (v: null) => void,
    setError: (v: string) => void,
  ) {
    setTimeout(() => { setResult(null); setError('') }, 6000)
  }

  async function handleGenerarPuntual() {
    setLoadingPuntual(true)
    setResultPuntual(null)
    setErrorPuntual('')
    const res = await generarOTsPuntual(proyecto.id)
    res.success ? setResultPuntual(res) : setErrorPuntual(res.error ?? 'Error desconocido')
    setLoadingPuntual(false)
    clearAfter(setResultPuntual, setErrorPuntual)
  }

  async function handleGenerarMes() {
    if (!currentMonth) return
    setLoadingMes(true)
    setResultMes(null)
    setErrorMes('')
    const res = await generarOTsProyectoMes(proyecto.id, currentMonth)
    res.success ? setResultMes(res) : setErrorMes(res.error ?? 'Error desconocido')
    setLoadingMes(false)
    clearAfter(setResultMes, setErrorMes)
  }

  const mesLabel = currentMonth
    ? new Date(currentMonth + 'T00:00:00').toLocaleDateString('es-ES', { month: 'short', year: 'numeric' })
    : ''

  if (proyecto.tipo_partida === 'Recurrente') {
    return (
      <div className="flex items-center gap-2">
        <Feedback result={resultMes} error={errorMes} />
        {currentMonth && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={handleGenerarMes}
            disabled={loadingMes}
            title={`Generar OTs de este proyecto para ${mesLabel}`}
          >
            {loadingMes
              ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando...</>
              : <><Zap className="h-3.5 w-3.5" />Generar OT {mesLabel}</>
            }
          </Button>
        )}
        <OtFormSheet
          proyectos={proyectos}
          servicios={servicios}
          departamentos={departamentos}
          personas={personas}
          empresas={empresas}
          preselectedProyectoId={proyecto.id}
          onCreated={onCreated}
        />
      </div>
    )
  }

  // Puntual
  return (
    <div className="flex items-center gap-2">
      <Feedback result={resultPuntual} error={errorPuntual} />
      <Button
        variant="outline"
        size="sm"
        className="gap-1.5"
        onClick={handleGenerarPuntual}
        disabled={loadingPuntual}
        title="Generar todas las OTs del rango de fechas del proyecto"
      >
        {loadingPuntual
          ? <><Loader2 className="h-3.5 w-3.5 animate-spin" />Generando...</>
          : <><Zap className="h-3.5 w-3.5" />Generar OTs</>
        }
      </Button>
    </div>
  )
}
