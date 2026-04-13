'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { asignacionSchema, type AsignacionFormData } from '@/lib/schemas/asignacion'
import { crearAsignacion, actualizarAsignacion, eliminarAsignacion } from './actions'
import type {
  OrdenTrabajo, Proyecto, Persona, CuotaPlanificacion, Asignacion, Empresa,
  CatalogoServicio, Departamento,
} from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Trash2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { formatMoney, formatMonth, safeDivide } from '@/lib/helpers'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

type Props = {
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  personas: Persona[]
  cuotas: CuotaPlanificacion[]
  asignaciones: Asignacion[]
  servicios?: CatalogoServicio[]
  departamentos?: Departamento[]
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
  servicios = [], departamentos = [],
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
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const departamentoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<AsignacionFormData>({
    resolver: zodResolver(asignacionSchema),
    defaultValues: {
      orden_trabajo_id: asignacion?.orden_trabajo_id ?? preselectedOrdenId ?? '',
      persona_id: asignacion?.persona_id ?? '',
      porcentaje_ppto_tm: asignacion?.porcentaje_ppto_tm ?? 100,
      cuota_planificacion_id: asignacion?.cuota_planificacion_id ?? '',
      horas_reales: asignacion?.horas_reales?.toString() ?? '',
      notas: asignacion?.notas ?? '',
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

  // Filtrar personas por empresa_grupo de la OT
  const personasFiltradas = useMemo(
    () => personas
      .filter((p) => p.empresa_grupo_id === egId && p.activo)
      .sort((a, b) => a.persona.localeCompare(b.persona)),
    [personas, egId]
  )

  // Filtrar cuotas por empresa_grupo de la persona seleccionada
  const selectedPersona = personas.find((p) => p.id === selectedPersonaId)
  const personaEgId = selectedPersona?.empresa_grupo_id
  const cuotasFiltradas = useMemo(
    () => cuotas.filter((c) => c.empresa_grupo_id === personaEgId && !c.fin_validez),
    [cuotas, personaEgId]
  )

  // Preview de horas calculadas
  const selectedCuota = cuotas.find((c) => c.id === selectedCuotaId)
  const ingresosEstimados = selectedOrden
    ? (selectedOrden.partida_prevista * (porcentaje || 0)) / 100
    : 0
  const horasEstimadas = safeDivide(ingresosEstimados, selectedCuota?.precio_hora ?? 0)

  // Opciones de OT: mes · proyecto — servicio · depto · cliente
  const otOptions = useMemo(() => {
    return ordenesTrabajo.map((ot) => {
      const proyecto = proyectoMap.get(ot.proyecto_id)
      const cliente = proyecto?.empresa_id
        ? (empresaMap.get(proyecto.empresa_id)?.nombre_interno
            ?? empresaMap.get(proyecto.empresa_id)?.nombre_legal
            ?? '?')
        : 'Interno'
      const servicio = ot.servicio_id ? servicioMap.get(ot.servicio_id)?.nombre : null
      const depto = ot.departamento_id ? departamentoMap.get(ot.departamento_id)?.nombre : null
      const parts = [
        formatMonth(ot.mes_anio),
        proyecto?.titulo ?? '?',
        servicio,
        depto,
        cliente,
      ].filter(Boolean)
      return {
        value: ot.id,
        label: parts.join(' · '),
      }
    })
  }, [ordenesTrabajo, proyectoMap, empresaMap, servicioMap, departamentoMap])

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

        {ordenesTrabajo.length === 0 && !isEditMode ? (
          <div className="px-6 py-8 text-center space-y-3">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50">
              <Plus className="h-5 w-5 text-amber-600" />
            </div>
            <p className="text-sm font-medium text-foreground">No hay OTs disponibles</p>
            <p className="text-xs text-muted-foreground">
              Primero crea una orden de trabajo para este mes antes de asignar personas.
            </p>
            <Button variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
              Cerrar
            </Button>
          </div>
        ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Orden de Trabajo */}
          <div className="space-y-1.5">
            <Label>Orden de trabajo *</Label>
            <SearchableSelect
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
                  <span className="font-semibold text-blue-600">{pctDisponible}%</span>
                </div>
              </div>
            )}
          </div>

          {/* Persona */}
          <div className="space-y-1.5">
            <Label>Persona *</Label>
            <SearchableSelect
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
            <SearchableSelect
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
                  <span className="font-semibold text-blue-600">{formatMoney(ingresosEstimados)}</span>
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

          {/* Horas reales */}
          <div className="space-y-1.5">
            <Label htmlFor="horas_reales">Horas reales</Label>
            <Input
              id="horas_reales"
              type="number"
              min={0}
              step={0.5}
              placeholder="0"
              {...register('horas_reales')}
            />
            <p className="text-[11px] text-muted-foreground">
              Horas reales dedicadas por esta persona a esta OT.
            </p>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="asig_notas">Notas</Label>
            <Textarea id="asig_notas" placeholder="Observaciones..." {...register('notas')} />
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
        )}
      </SheetContent>
    </Sheet>
  )
}
