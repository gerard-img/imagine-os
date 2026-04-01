'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { asignacionSchema, type AsignacionFormData } from '@/lib/schemas/asignacion'
import { crearAsignacion, actualizarAsignacion, eliminarAsignacion } from './actions'
import type {
  OrdenTrabajo, Proyecto, Persona, CuotaPlanificacion, Asignacion, Empresa,
} from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { formatMoney, formatMonth, safeDivide } from '@/lib/helpers'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function NativeSelect({
  options, placeholder, value, onChange, error, disabled,
}: {
  options: { value: string; label: string }[]
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: boolean
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={error}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

type Props = {
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  personas: Persona[]
  cuotas: CuotaPlanificacion[]
  asignaciones: Asignacion[]
  // Para edición: pasar la asignación existente
  asignacion?: Asignacion
  // Trigger personalizado (ej: icono de editar por fila)
  trigger?: React.ReactElement
  // Opcional: pre-seleccionar una OT al abrir desde otro contexto
  preselectedOrdenId?: string
  // Control externo del estado open (para abrir desde fuera sin trigger)
  externalOpen?: boolean
  onExternalOpenChange?: (open: boolean) => void
}

export function AsignacionFormSheet({
  ordenesTrabajo, proyectos, empresas, personas, cuotas, asignaciones,
  asignacion, trigger, preselectedOrdenId, externalOpen, onExternalOpenChange,
}: Props) {
  const isEditMode = !!asignacion
  const isControlled = externalOpen !== undefined
  const [internalOpen, setInternalOpen] = useState(false)
  const open = isControlled ? externalOpen! : internalOpen
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: {
      orden_trabajo_id: asignacion?.orden_trabajo_id ?? preselectedOrdenId ?? '',
      persona_id: asignacion?.persona_id ?? '',
      porcentaje_ppto_tm: asignacion?.porcentaje_ppto_tm ?? 100,
      cuota_planificacion_id: asignacion?.cuota_planificacion_id ?? '',
    },
  })

  const selectedOrdenId = watch('orden_trabajo_id')
  const selectedPersonaId = watch('persona_id')
  const selectedCuotaId = watch('cuota_planificacion_id')
  const porcentaje = watch('porcentaje_ppto_tm')

  // Datos de la OT seleccionada
  const selectedOrden = useMemo(
    () => ordenesTrabajo.find((o) => o.id === selectedOrdenId),
    [ordenesTrabajo, selectedOrdenId]
  )
  const selectedProyecto = selectedOrden ? proyectoMap.get(selectedOrden.proyecto_id) : undefined
  const egId = selectedProyecto?.empresa_grupo_id

  // % ya asignado a esta OT — en edición, excluye la asignación actual
  const pctAsignado = useMemo(() => {
    return asignaciones
      .filter((a) => a.orden_trabajo_id === selectedOrdenId && (!isEditMode || a.id !== asignacion?.id))
      .reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
  }, [asignaciones, selectedOrdenId, isEditMode, asignacion])

  const pctDisponible = Math.max(0, 100 - pctAsignado)

  // Filtrar personas y cuotas por empresa_grupo de la OT
  const personasFiltradas = useMemo(
    () => personas.filter((p) => p.empresa_grupo_id === egId && p.activo),
    [personas, egId]
  )
  const cuotasFiltradas = useMemo(
    () => cuotas.filter((c) => c.empresa_grupo_id === egId && !c.fin_validez),
    [cuotas, egId]
  )

  // Preview de horas calculadas
  const selectedCuota = cuotas.find((c) => c.id === selectedCuotaId)
  const ingresosEstimados = selectedOrden
    ? (selectedOrden.partida_prevista * (porcentaje || 0)) / 100
    : 0
  const horasEstimadas = safeDivide(ingresosEstimados, selectedCuota?.precio_hora ?? 0)

  // Opciones de OT: agrupadas por mes con contexto de proyecto y servicio
  const otOptions = useMemo(() => {
    return ordenesTrabajo.map((ot) => {
      const proyecto = proyectoMap.get(ot.proyecto_id)
      const cliente = proyecto?.empresa_id
        ? (empresaMap.get(proyecto.empresa_id)?.nombre_interno
            ?? empresaMap.get(proyecto.empresa_id)?.nombre_legal
            ?? '?')
        : 'Interno'
      return {
        value: ot.id,
        label: `${formatMonth(ot.mes_anio)} · ${cliente} — ${proyecto?.titulo ?? '?'} (${ot.estado})`,
      }
    })
  }, [ordenesTrabajo, proyectoMap, empresaMap])

  async function onSubmit(data: AsignacionFormData) {
    setSubmitting(true)
    setServerError('')
    const result = isEditMode
      ? await actualizarAsignacion(asignacion!.id, data)
      : await crearAsignacion(data)
    if (result.success) { reset(); handleOpenChange(false) }
    else setServerError(result.error ?? 'Error desconocido')
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const result = await eliminarAsignacion(asignacion!.id)
    if (result.success) { handleOpenChange(false) }
    else setServerError(result.error ?? 'Error al eliminar')
    setDeleting(false)
  }

  function handleOpenChange(next: boolean) {
    if (!isControlled) setInternalOpen(next)
    onExternalOpenChange?.(next)
    if (!next) {
      reset()
      setServerError('')
      setConfirmDelete(false)
    }
  }

  const defaultTrigger = (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nueva Asignación
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      {!isControlled && <SheetTrigger render={trigger ?? defaultTrigger} />}

      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Asignación' : 'Asignar personas'}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? 'Modifica la orden de trabajo, persona, cuota o porcentaje.'
              : preselectedOrdenId
                ? 'OT creada. ¿Quién trabaja en esto? Asigna una persona con su cuota y porcentaje.'
                : 'Asigna una persona a una orden de trabajo con su cuota y porcentaje.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Orden de Trabajo */}
          <div className="space-y-1.5">
            <Label>Orden de trabajo *</Label>
            <NativeSelect
              options={otOptions}
              placeholder="Seleccionar OT..."
              value={watch('orden_trabajo_id')}
              onChange={(v) => {
                setValue('orden_trabajo_id', v, { shouldValidate: true })
                setValue('persona_id', '')
                setValue('cuota_planificacion_id', '')
              }}
              error={!!errors.orden_trabajo_id}
            />
            <FieldError message={errors.orden_trabajo_id?.message} />

            {/* Contexto de la OT seleccionada */}
            {selectedOrden && (
              <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Partida prevista</span>
                  <span className="font-semibold">{formatMoney(selectedOrden.partida_prevista)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">% ya asignado (otros)</span>
                  <span className={pctAsignado >= 100 ? 'font-semibold text-destructive' : 'font-semibold'}>
                    {pctAsignado}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">% disponible</span>
                  <span className="font-semibold text-primary">{pctDisponible}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Persona */}
          <div className="space-y-1.5">
            <Label>Persona *</Label>
            <NativeSelect
              options={personasFiltradas.map((p) => ({ value: p.id, label: p.persona }))}
              placeholder={egId ? 'Seleccionar...' : 'Primero elige una OT'}
              value={watch('persona_id')}
              onChange={(v) => setValue('persona_id', v, { shouldValidate: true })}
              error={!!errors.persona_id}
              disabled={!egId}
            />
            <FieldError message={errors.persona_id?.message} />
          </div>

          {/* Cuota */}
          <div className="space-y-1.5">
            <Label>Cuota de planificación *</Label>
            <NativeSelect
              options={cuotasFiltradas.map((c) => ({
                value: c.id,
                label: `${c.nombre} — ${formatMoney(c.precio_hora)}/h`,
              }))}
              placeholder={egId ? 'Seleccionar...' : 'Primero elige una OT'}
              value={watch('cuota_planificacion_id')}
              onChange={(v) => setValue('cuota_planificacion_id', v, { shouldValidate: true })}
              error={!!errors.cuota_planificacion_id}
              disabled={!egId}
            />
            <FieldError message={errors.cuota_planificacion_id?.message} />
          </div>

          {/* Porcentaje */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label htmlFor="porcentaje_ppto_tm">% de la partida *</Label>
              {pctDisponible < 100 && (
                <button
                  type="button"
                  onClick={() => setValue('porcentaje_ppto_tm', pctDisponible)}
                  className="text-[11px] text-primary hover:underline"
                >
                  Usar disponible ({pctDisponible}%)
                </button>
              )}
            </div>
            <Input
              id="porcentaje_ppto_tm"
              type="number"
              min={0.01}
              max={100}
              step={0.01}
              aria-invalid={!!errors.porcentaje_ppto_tm}
              {...register('porcentaje_ppto_tm', { valueAsNumber: true })}
            />
            <FieldError message={errors.porcentaje_ppto_tm?.message} />

            {/* Preview de ingresos y horas estimadas */}
            {selectedOrden && porcentaje > 0 && (
              <div className="rounded-lg bg-[#F9FAFB] px-3 py-2 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ingresos asignados</span>
                  <span className="font-semibold text-primary">{formatMoney(ingresosEstimados)}</span>
                </div>
                {selectedCuota && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Horas a dedicar</span>
                    <span className="font-semibold text-blue-600">{horasEstimadas.toFixed(1)}h</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <SheetFooter className="flex gap-2 pt-2">
            {isEditMode && (
              <Button
                type="button"
                variant={confirmDelete ? 'destructive' : 'outline'}
                size="sm"
                onClick={handleDelete}
                disabled={deleting || submitting}
                className="gap-1.5 mr-auto"
              >
                {deleting ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Trash2 className="h-3.5 w-3.5" />
                )}
                {confirmDelete ? '¿Confirmar?' : 'Eliminar'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting || deleting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || deleting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear Asignación'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
