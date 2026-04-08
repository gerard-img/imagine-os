'use client'

import { useState, useMemo } from 'react'
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { formatMoney } from '@/lib/helpers'
import { clonarOTsMes } from './generar-ots-mes'
import { ServicioPill } from '@/components/servicio-pill'
import type { OrdenTrabajo, Proyecto, Empresa, Departamento, CatalogoServicio } from '@/lib/supabase/types'

type Props = {
  currentMonth: string  // YYYY-MM-01
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  servicios: CatalogoServicio[]
  empresas: Empresa[]
  departamentos: Departamento[]
  deptoFilter: string   // 'Todos' o nombre del departamento activo
}

/** Calcula el mes anterior a un mes dado en formato YYYY-MM-01 */
function mesAnterior(mes: string): string {
  const [y, m] = mes.split('-').map(Number)
  const d = new Date(y, m - 2, 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`
}

export function GenerarOtsButton({
  currentMonth, ordenesTrabajo, proyectos, servicios, empresas, departamentos, deptoFilter,
}: Props) {
  const [open, setOpen] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<{ creadas: number; omitidas: number } | null>(null)
  const [error, setError] = useState('')

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])

  // OTs del mes anterior — son las que se pueden clonar al mes seleccionado
  const mesRef = mesAnterior(currentMonth)

  const otsReferencia = useMemo(() => {
    return ordenesTrabajo.filter((ot) => {
      if (ot.mes_anio !== mesRef) return false
      if (ot.deleted_at) return false
      // Filtro por departamento si hay uno activo
      if (deptoFilter !== 'Todos') {
        const deptNombre = deptMap.get(ot.departamento_id)?.nombre
        if (deptNombre !== deptoFilter) return false
      }
      return true
    })
  }, [ordenesTrabajo, mesRef, deptoFilter, deptMap])

  // Agrupar OTs por proyecto para mostrar agrupado
  const otsPorProyecto = useMemo(() => {
    const groups = new Map<string, OrdenTrabajo[]>()
    for (const ot of otsReferencia) {
      const arr = groups.get(ot.proyecto_id) ?? []
      arr.push(ot)
      groups.set(ot.proyecto_id, arr)
    }
    // Ordenar por nombre de cliente + título de proyecto
    return [...groups.entries()].sort(([idA], [idB]) => {
      const pA = proyectoMap.get(idA)
      const pB = proyectoMap.get(idB)
      const clienteA = pA?.empresa_id ? (empresaMap.get(pA.empresa_id)?.nombre_interno ?? '') : 'ZZZ'
      const clienteB = pB?.empresa_id ? (empresaMap.get(pB.empresa_id)?.nombre_interno ?? '') : 'ZZZ'
      return clienteA.localeCompare(clienteB) || (pA?.titulo ?? '').localeCompare(pB?.titulo ?? '')
    })
  }, [otsReferencia, proyectoMap, empresaMap])

  // Formatear meses para mostrar
  const formatMes = (mes: string) => {
    const [y, m] = mes.split('-').map(Number)
    return new Date(y, m - 1, 1).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })
  }
  const mesDestinoLabel = formatMes(currentMonth)
  const mesRefLabel = formatMes(mesRef)

  function handleOpen(next: boolean) {
    setOpen(next)
    if (next) {
      // Al abrir, seleccionar todas las OTs por defecto
      setSelectedIds(new Set(otsReferencia.map((ot) => ot.id)))
      setResult(null)
      setError('')
    }
  }

  function toggleId(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleProyecto(proyectoId: string) {
    const ots = otsPorProyecto.find(([id]) => id === proyectoId)?.[1] ?? []
    const otIds = ots.map((ot) => ot.id)
    const allSelected = otIds.every((id) => selectedIds.has(id))
    setSelectedIds((prev) => {
      const next = new Set(prev)
      for (const id of otIds) {
        if (allSelected) next.delete(id)
        else next.add(id)
      }
      return next
    })
  }

  function toggleAll() {
    if (selectedIds.size === otsReferencia.length) {
      setSelectedIds(new Set())
    } else {
      setSelectedIds(new Set(otsReferencia.map((ot) => ot.id)))
    }
  }

  async function handleGenerar() {
    if (selectedIds.size === 0) return
    setLoading(true)
    setResult(null)
    setError('')
    const res = await clonarOTsMes(currentMonth, [...selectedIds])
    if (res.success) {
      setResult({ creadas: res.creadas, omitidas: res.omitidas })
      if (res.creadas > 0) {
        setTimeout(() => setOpen(false), 1500)
      }
    } else {
      setError(res.error ?? 'Error desconocido')
    }
    setLoading(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger
        render={
          <Button variant="outline" size="sm" className="gap-1.5">
            <Zap className="h-3.5 w-3.5" />
            Generar OTs del mes
          </Button>
        }
      />

      <SheetContent side="right" className="w-[560px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Generar OTs — {mesDestinoLabel}</SheetTitle>
          <SheetDescription>
            Clona las OTs <span className="font-medium text-foreground">recurrentes</span> del mes anterior al mes seleccionado.
            Cada OT recurrente se duplica con sus mismos datos (servicio, departamento, partida).
            {deptoFilter !== 'Todos' && (
              <span className="block mt-1 font-medium text-foreground">
                Filtrado por departamento: {deptoFilter}
              </span>
            )}
          </SheetDescription>
        </SheetHeader>

        <div className="px-6 py-4 space-y-3">
          {otsReferencia.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No hay OTs en {mesRefLabel}
              {deptoFilter !== 'Todos' ? ` para el departamento "${deptoFilter}"` : ''} que clonar.
            </p>
          ) : (
            <>
              {/* Seleccionar/deseleccionar todos */}
              <label className="flex items-center gap-2 cursor-pointer text-sm font-medium text-muted-foreground border-b border-border pb-2">
                <input
                  type="checkbox"
                  checked={selectedIds.size === otsReferencia.length}
                  onChange={toggleAll}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                {selectedIds.size === otsReferencia.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
                <span className="ml-auto text-xs">{selectedIds.size} de {otsReferencia.length} OTs</span>
              </label>

              {/* OTs agrupadas por proyecto */}
              {otsPorProyecto.map(([proyectoId, ots]) => {
                const proyecto = proyectoMap.get(proyectoId)
                const cliente = proyecto?.empresa_id
                  ? (empresaMap.get(proyecto.empresa_id)?.nombre_interno ?? '—')
                  : 'Interno'
                const allChecked = ots.every((ot) => selectedIds.has(ot.id))
                const someChecked = ots.some((ot) => selectedIds.has(ot.id))

                return (
                  <div key={proyectoId} className="rounded-lg border border-border overflow-hidden">
                    {/* Cabecera del proyecto */}
                    <label
                      className={`flex items-center gap-3 px-3 py-2 cursor-pointer transition-colors ${
                        someChecked ? 'bg-primary/5' : 'bg-gray-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={allChecked}
                        ref={(el) => { if (el) el.indeterminate = someChecked && !allChecked }}
                        onChange={() => toggleProyecto(proyectoId)}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-foreground truncate block">
                          {proyecto?.titulo ?? 'Proyecto desconocido'}
                        </span>
                        <span className="text-xs text-muted-foreground">{cliente}</span>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {ots.length} OT{ots.length !== 1 ? 's' : ''}
                      </span>
                    </label>

                    {/* OTs individuales */}
                    <div className="divide-y divide-border">
                      {ots.map((ot) => {
                        const checked = selectedIds.has(ot.id)
                        const depto = deptMap.get(ot.departamento_id)
                        const servicio = ot.servicio_id ? servicioMap.get(ot.servicio_id) : null

                        return (
                          <label
                            key={ot.id}
                            className={`flex items-center gap-3 px-3 py-2 pl-9 cursor-pointer transition-colors ${
                              checked ? 'bg-primary/5' : 'hover:bg-gray-50/50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleId(ot.id)}
                              className="h-3.5 w-3.5 rounded border-gray-300 text-primary focus:ring-primary shrink-0"
                            />
                            <div className="flex-1 min-w-0 flex items-center gap-2">
                              <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] text-gray-600 shrink-0">
                                {depto?.nombre ?? '—'}
                              </span>
                              {servicio && (
                                <ServicioPill name={servicio.nombre} />
                              )}
                              {ot.titulo && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {ot.titulo}
                                </span>
                              )}
                            </div>
                            <span className="text-xs font-semibold text-primary shrink-0">
                              {formatMoney(ot.partida_prevista)}
                            </span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </>
          )}

          {/* Feedback */}
          {result && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {result.creadas} OT{result.creadas !== 1 ? 's' : ''} creada{result.creadas !== 1 ? 's' : ''}
              {result.omitidas > 0 && `, ${result.omitidas} ya existían`}
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
              <AlertCircle className="h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
        </div>

        <SheetFooter className="px-6 pb-6 flex gap-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            onClick={handleGenerar}
            disabled={loading || selectedIds.size === 0 || otsReferencia.length === 0}
            className="gap-1.5"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 animate-spin" />Clonando...</>
            ) : (
              <><Zap className="h-4 w-4" />Clonar {selectedIds.size} OT{selectedIds.size !== 1 ? 's' : ''}</>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
