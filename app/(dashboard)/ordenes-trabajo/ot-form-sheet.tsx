'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  ordenTrabajoSchema,
  type OrdenTrabajoFormData,
  ESTADOS_OT,
} from '@/lib/schemas/orden-trabajo'
import { crearOrdenTrabajo, actualizarOrdenTrabajo, eliminarOrdenTrabajo } from './actions'
import type { Proyecto, CatalogoServicio, Departamento, Persona, Empresa, OrdenTrabajo } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Pencil, Trash2, AlertTriangle } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'
import { formatMoney } from '@/lib/helpers'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function SimpleSelect({
  options, placeholder, value, onChange, error,
}: {
  options: readonly string[]
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-invalid={error}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

type Props = {
  proyectos: Proyecto[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  ordenesTrabajo?: OrdenTrabajo[]
  preselectedProyectoId?: string
  // Edición: pasar la OT existente
  ot?: OrdenTrabajo
  trigger?: React.ReactElement
  // Callback tras crear una OT nueva (recibe el id)
  onCreated?: (id: string) => void
}

export function OtFormSheet({ proyectos, servicios, departamentos, personas, empresas, ordenesTrabajo = [], preselectedProyectoId, ot, trigger, onCreated }: Props) {
  const isEditMode = !!ot
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [deleting, setDeleting] = useState(false)

  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const createDefaults = {
    proyecto_id: preselectedProyectoId ?? '',
    servicio_id: '', departamento_id: '', mes_anio: '',
    titulo: '', porcentaje_ppto_mes: 100, partida_prevista: 0,
    partida_real: null,
    aprobador_id: '', estado: 'Propuesto' as OrdenTrabajoFormData['estado'],
    notas: '',
  }

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<OrdenTrabajoFormData>({
    resolver: zodResolver(ordenTrabajoSchema),
    defaultValues: isEditMode ? {
      proyecto_id: ot.proyecto_id,
      servicio_id: ot.servicio_id ?? '',
      departamento_id: ot.departamento_id,
      mes_anio: ot.mes_anio,
      titulo: ot.titulo ?? '',
      porcentaje_ppto_mes: ot.porcentaje_ppto_mes,
      partida_prevista: ot.partida_prevista,
      partida_real: ot.partida_real ?? null,
      aprobador_id: ot.aprobador_id,
      estado: ot.estado as OrdenTrabajoFormData['estado'],
      notas: ot.notas ?? '',
    } : createDefaults,
  })

  const selectedProyectoId = watch('proyecto_id')
  const porcentaje = watch('porcentaje_ppto_mes')
  const mesAnio = watch('mes_anio')

  // Proyecto seleccionado → derivar empresa_grupo_id
  const selectedProyecto = useMemo(
    () => proyectos.find((p) => p.id === selectedProyectoId),
    [proyectos, selectedProyectoId]
  )
  const egId = selectedProyecto?.empresa_grupo_id

  // Calcular partida_prevista en tiempo real
  const partidaCalculada = selectedProyecto && porcentaje > 0
    ? (selectedProyecto.ppto_estimado * porcentaje) / 100
    : 0

  // Suma de % ppto de OTs hermanas (excluye la OT actual si estamos editando)
  const sumaPctHermanas = useMemo(() => {
    if (!selectedProyectoId || !selectedProyecto) return 0
    const isPuntual = selectedProyecto.tipo_partida === 'Puntual'
    return ordenesTrabajo
      .filter((o) => {
        if (o.proyecto_id !== selectedProyectoId) return false
        if (o.deleted_at) return false
        if (isEditMode && o.id === ot!.id) return false
        // Recurrente: solo OTs del mismo mes
        if (!isPuntual && mesAnio && o.mes_anio !== mesAnio) return false
        return true
      })
      .reduce((sum, o) => sum + (o.porcentaje_ppto_mes ?? 0), 0)
  }, [ordenesTrabajo, selectedProyectoId, selectedProyecto, mesAnio, isEditMode, ot])

  const sumaPctTotal = sumaPctHermanas + (porcentaje || 0)
  const sumaPctNoSuma100 = selectedProyectoId && selectedProyecto && sumaPctTotal !== 100

  // Filtrar servicios, departamentos y aprobadores por empresa_grupo del proyecto
  const serviciosFiltrados = useMemo(
    () => servicios.filter((s) => s.empresa_grupo_id === egId),
    [servicios, egId]
  )
  const deptosFiltrados = useMemo(
    () => departamentos.filter((d) => d.empresa_grupo_id === egId),
    [departamentos, egId]
  )
  const aprobadoresFiltrados = useMemo(
    () => personas
      .filter((p) => p.empresa_grupo_id === egId && p.activo)
      .sort((a, b) => a.persona.localeCompare(b.persona)),
    [personas, egId]
  )

  const proyectoOptions = proyectos.map((p) => {
    const cliente = p.empresa_id
      ? (empresaMap.get(p.empresa_id)?.nombre_interno ?? empresaMap.get(p.empresa_id)?.nombre_legal ?? '?')
      : 'Interno'
    return { value: p.id, label: `${cliente} — ${p.titulo}` }
  })

  async function onSubmit(data: OrdenTrabajoFormData) {
    setSubmitting(true)
    setServerError('')
    const result = isEditMode
      ? await actualizarOrdenTrabajo(ot!.id, data)
      : await crearOrdenTrabajo(data)
    if (result.success) {
      if (!isEditMode) {
        reset(createDefaults)
        if (result.id) onCreated?.(result.id)
      }
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  async function handleDelete() {
    if (!confirmDelete) { setConfirmDelete(true); return }
    setDeleting(true)
    const result = await eliminarOrdenTrabajo(ot!.id)
    if (result.success) { handleOpenChange(false) }
    else setServerError(result.error ?? 'Error al eliminar')
    setDeleting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next && !isEditMode && preselectedProyectoId) {
      setValue('proyecto_id', preselectedProyectoId)
    }
    if (!next) {
      if (!isEditMode) reset(createDefaults)
      setServerError('')
      setConfirmDelete(false)
    }
  }

  // Sync partida_prevista cuando cambia el % o el proyecto
  const partidaActual = watch('partida_prevista')
  if (partidaActual === 0 && partidaCalculada > 0) {
    setValue('partida_prevista', Math.round(partidaCalculada))
  }

  const defaultTrigger = isEditMode ? (
    <button className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
      <Pencil className="h-3.5 w-3.5" />
    </button>
  ) : preselectedProyectoId ? (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Plus className="h-3.5 w-3.5" />
      Añadir OT
    </Button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nueva OT
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent side="right" className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Modifica los datos de esta orden de trabajo.' : 'Define el trabajo planificado para un proyecto, servicio y mes.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Proyecto */}
          <div className="space-y-1.5">
            <Label>Proyecto *</Label>
            <SearchableSelect
              options={proyectoOptions}
              placeholder="Seleccionar proyecto..."
              value={watch('proyecto_id')}
              onChange={(v) => {
                setValue('proyecto_id', v, { shouldValidate: true })
                // Limpiar selecciones dependientes
                setValue('servicio_id', '')
                setValue('departamento_id', '')
                setValue('aprobador_id', '')
                setValue('partida_prevista', 0)
              }}
              error={!!errors.proyecto_id}
            />
            <FieldError message={errors.proyecto_id?.message} />
            {selectedProyecto && (
              <p className="text-[11px] text-muted-foreground">
                Ppto: {formatMoney(selectedProyecto.ppto_estimado)} ·{' '}
                {selectedProyecto.tipo_partida} · {selectedProyecto.estado}
              </p>
            )}
          </div>

          {/* Servicio + Departamento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Servicio <span className="text-muted-foreground font-normal">(opcional)</span></Label>
              <SearchableSelect
                options={serviciosFiltrados.map((s) => ({ value: s.id, label: s.nombre }))}
                placeholder={egId ? 'Sin servicio' : 'Primero elige proyecto'}
                value={watch('servicio_id')}
                onChange={(v) => setValue('servicio_id', v, { shouldValidate: true })}
                error={!!errors.servicio_id}
                disabled={!egId}
              />
              <FieldError message={errors.servicio_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Departamento *</Label>
              <SearchableSelect
                options={deptosFiltrados.map((d) => ({ value: d.id, label: d.nombre }))}
                placeholder={egId ? 'Seleccionar...' : 'Primero elige proyecto'}
                value={watch('departamento_id')}
                onChange={(v) => setValue('departamento_id', v, { shouldValidate: true })}
                error={!!errors.departamento_id}
                disabled={!egId}
              />
              <FieldError message={errors.departamento_id?.message} />
            </div>
          </div>

          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo">
              Título <span className="text-muted-foreground font-normal">(opcional)</span>
            </Label>
            <Input
              id="titulo"
              placeholder="Ej. España, Francia, Q1…"
              {...register('titulo')}
            />
            <p className="text-[11px] text-muted-foreground">
              Diferencia OTs del mismo proyecto, departamento y servicio en el mismo mes.
            </p>
          </div>

          {/* Mes */}
          <div className="space-y-1.5">
            <Label htmlFor="mes_anio">Mes *</Label>
            <input
              id="mes_anio"
              type="month"
              aria-invalid={!!errors.mes_anio}
              value={watch('mes_anio') ? watch('mes_anio').substring(0, 7) : ''}
              onChange={(e) => {
                const val = e.target.value
                setValue('mes_anio', val ? `${val}-01` : '', { shouldValidate: true })
              }}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
            />
            <FieldError message={errors.mes_anio?.message} />
          </div>

          {/* Porcentaje presupuesto + Partida prevista */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="porcentaje_ppto_mes">% Presupuesto *</Label>
              <Input
                id="porcentaje_ppto_mes"
                type="number"
                min={0.01}
                max={100}
                step={0.01}
                aria-invalid={!!errors.porcentaje_ppto_mes}
                {...register('porcentaje_ppto_mes', {
                  valueAsNumber: true,
                  onChange: (e) => {
                    const pct = parseFloat(e.target.value)
                    if (selectedProyecto && pct > 0) {
                      setValue('partida_prevista', Math.round((selectedProyecto.ppto_estimado * pct) / 100))
                    }
                  },
                })}
              />
              <FieldError message={errors.porcentaje_ppto_mes?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="partida_prevista">Partida prevista (€) *</Label>
              <Input
                id="partida_prevista"
                type="number"
                min={0}
                step={1}
                aria-invalid={!!errors.partida_prevista}
                {...register('partida_prevista', { valueAsNumber: true })}
              />
              <p className="text-[11px] text-muted-foreground">
                Calculado: {formatMoney(partidaCalculada)}
              </p>
              <FieldError message={errors.partida_prevista?.message} />
            </div>
          </div>
          {/* Aviso suma % ≠ 100 */}
          {sumaPctNoSuma100 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <p className="text-xs text-amber-800">
                La suma de % presupuesto de las OTs de este proyecto
                {selectedProyecto!.tipo_partida === 'Recurrente' && mesAnio
                  ? ` en ${mesAnio.substring(0, 7)}`
                  : ' (todas las OTs)'}
                {' '}es <span className="font-semibold">{sumaPctTotal.toFixed(1)}%</span> (debería ser 100%).
              </p>
            </div>
          )}

          {/* Partida real (facturación) */}
          <div className="space-y-1.5">
            <Label htmlFor="partida_real">Partida real (€)</Label>
            <Input
              id="partida_real"
              type="number"
              min={0}
              step={1}
              placeholder="Importe facturado"
              {...register('partida_real', { valueAsNumber: true })}
            />
            <p className="text-[11px] text-muted-foreground">
              Importe real a facturar. Dejar vacío si aún no se conoce.
            </p>
          </div>

          {/* Estado + Aprobador */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <SimpleSelect
                options={ESTADOS_OT}
                placeholder="Seleccionar..."
                value={watch('estado') ?? ''}
                onChange={(v) => setValue('estado', v as OrdenTrabajoFormData['estado'], { shouldValidate: true })}
                error={!!errors.estado}
              />
              <FieldError message={errors.estado?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Aprobador *</Label>
              <SearchableSelect
                options={aprobadoresFiltrados.map((p) => ({ value: p.id, label: p.persona }))}
                placeholder={egId ? 'Seleccionar...' : 'Primero elige proyecto'}
                value={watch('aprobador_id')}
                onChange={(v) => setValue('aprobador_id', v, { shouldValidate: true })}
                error={!!errors.aprobador_id}
                disabled={!egId}
              />
              <FieldError message={errors.aprobador_id?.message} />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea id="notas" placeholder="Contexto o instrucciones..." {...register('notas')} />
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
                {confirmDelete ? '¿Eliminar OT y asignaciones?' : 'Eliminar'}
              </Button>
            )}
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting || deleting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting || deleting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear OT'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
