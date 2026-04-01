'use client'

import { useState } from 'react'
import type { PersonaDepartamento, Departamento } from '@/lib/supabase/types'
import { actualizarDepartamentosPersona } from './actions'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Pencil, Plus, Trash2, Loader2 } from 'lucide-react'

type Entry = { departamento_id: string; porcentaje_tiempo: number }

type Props = {
  personaId: string
  personaEmpresaGrupoId: string
  currentDepts: PersonaDepartamento[]
  departamentos: Departamento[]
}

export function PersonaDeptSheet({ personaId, personaEmpresaGrupoId, currentDepts, departamentos }: Props) {
  const [open, setOpen] = useState(false)
  const [entries, setEntries] = useState<Entry[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const deptsFiltrados = departamentos.filter((d) => d.empresa_grupo_id === personaEmpresaGrupoId)

  function handleOpen(next: boolean) {
    setOpen(next)
    if (next) {
      setEntries(
        currentDepts
          .filter((pd) => pd.persona_id === personaId)
          .map((pd) => ({ departamento_id: pd.departamento_id, porcentaje_tiempo: pd.porcentaje_tiempo }))
          .sort((a, b) => b.porcentaje_tiempo - a.porcentaje_tiempo)
      )
      setServerError('')
    }
  }

  function updatePct(idx: number, value: number) {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, porcentaje_tiempo: value } : e))
  }

  function updateDept(idx: number, deptId: string) {
    setEntries((prev) => prev.map((e, i) => i === idx ? { ...e, departamento_id: deptId } : e))
  }

  function removeEntry(idx: number) {
    setEntries((prev) => prev.filter((_, i) => i !== idx))
  }

  function addEntry() {
    // Pick a dept not yet used
    const usedIds = new Set(entries.map((e) => e.departamento_id))
    const available = deptsFiltrados.find((d) => !usedIds.has(d.id))
    if (!available) return
    setEntries((prev) => [...prev, { departamento_id: available.id, porcentaje_tiempo: 0 }])
  }

  const total = entries.reduce((sum, e) => sum + (e.porcentaje_tiempo || 0), 0)
  const totalOk = Math.abs(total - 100) <= 0.01
  const canAddMore = deptsFiltrados.length > entries.length

  async function handleSubmit() {
    setSubmitting(true)
    setServerError('')
    const result = await actualizarDepartamentosPersona(personaId, entries)
    if (result.success) {
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  return (
    <Sheet open={open} onOpenChange={handleOpen}>
      <SheetTrigger
        render={
          <button className="flex h-7 w-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted/50 transition-colors">
            <Pencil className="h-3.5 w-3.5" />
          </button>
        }
      />

      <SheetContent side="right" className="w-[420px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Dedicación por Departamento</SheetTitle>
          <SheetDescription>
            Asigna los departamentos de esta persona y el % de tiempo dedicado a cada uno. La suma debe ser 100%.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-3 px-6 py-4">
          {entries.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              Sin departamentos asignados. Añade al menos uno.
            </p>
          )}

          {entries.map((entry, idx) => {
            const usedIds = new Set(entries.filter((_, i) => i !== idx).map((e) => e.departamento_id))
            const availableForRow = deptsFiltrados.filter((d) => !usedIds.has(d.id))
            const deptNombre = departamentos.find((d) => d.id === entry.departamento_id)?.nombre ?? ''

            return (
              <div key={idx} className="flex items-center gap-2">
                <select
                  value={entry.departamento_id}
                  onChange={(e) => updateDept(idx, e.target.value)}
                  className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                >
                  {/* Include current value even if it's not in available */}
                  {entry.departamento_id && !availableForRow.find((d) => d.id === entry.departamento_id) && (
                    <option value={entry.departamento_id}>{deptNombre}</option>
                  )}
                  {availableForRow.map((d) => (
                    <option key={d.id} value={d.id}>{d.nombre}</option>
                  ))}
                </select>

                <div className="relative w-24 shrink-0">
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    step={1}
                    value={entry.porcentaje_tiempo || ''}
                    onChange={(e) => updatePct(idx, parseFloat(e.target.value) || 0)}
                    className="h-8 pr-6 text-right text-sm"
                  />
                  <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">
                    %
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => removeEntry(idx)}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}

          {canAddMore && (
            <button
              type="button"
              onClick={addEntry}
              className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-primary hover:text-primary transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Añadir departamento
            </button>
          )}

          {/* Total indicator */}
          {entries.length > 0 && (
            <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${totalOk ? 'bg-emerald-50' : 'bg-amber-50'}`}>
              <span className={`font-medium ${totalOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                Total dedicación
              </span>
              <span className={`font-bold tabular-nums ${totalOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                {total}% {totalOk ? '✓' : `— faltan ${100 - total}%`}
              </span>
            </div>
          )}

          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}
        </div>

        <SheetFooter className="px-6 pb-6 flex gap-2">
          <Button type="button" variant="outline" onClick={() => handleOpen(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || !totalOk || entries.length === 0}
            className="gap-1.5"
          >
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {submitting ? 'Guardando...' : 'Guardar'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
