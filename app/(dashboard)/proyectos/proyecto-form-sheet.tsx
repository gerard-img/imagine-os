'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  proyectoSchema,
  type ProyectoFormData,
  TIPOS_PROYECTO,
  TIPOS_PARTIDA,
  ESTADOS_PROYECTO,
} from '@/lib/schemas/proyecto'
import { crearProyecto, actualizarProyecto } from './actions'
import type { Empresa, EmpresaGrupo, Persona, Departamento, Proyecto } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Pencil } from 'lucide-react'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function NativeSelect({
  options,
  placeholder,
  value,
  onChange,
  error,
}: {
  options: { value: string; label: string }[]
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
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

function SimpleSelect({
  options,
  placeholder,
  value,
  onChange,
  error,
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
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o} value={o}>{o}</option>
      ))}
    </select>
  )
}

type Props = {
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
  personas: Persona[]
  departamentos: Departamento[]
  // Edición: pasar proyecto existente + sus departamento_ids actuales
  proyecto?: Proyecto
  proyectoDepartamentoIds?: string[]
  trigger?: React.ReactElement
}

export function ProyectoFormSheet({
  empresas, empresasGrupo, personas, departamentos,
  proyecto, proyectoDepartamentoIds, trigger,
}: Props) {
  const isEditMode = !!proyecto
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<ProyectoFormData>({
    resolver: zodResolver(proyectoSchema),
    defaultValues: isEditMode ? {
      titulo: proyecto.titulo,
      empresa_id: proyecto.empresa_id ?? '',
      empresa_grupo_id: proyecto.empresa_grupo_id,
      tipo_proyecto: proyecto.tipo_proyecto as ProyectoFormData['tipo_proyecto'],
      tipo_partida: proyecto.tipo_partida as ProyectoFormData['tipo_partida'],
      estado: proyecto.estado as ProyectoFormData['estado'],
      aprobador_final_id: proyecto.aprobador_final_id ?? '',
      ppto_estimado: proyecto.ppto_estimado,
      descripcion: proyecto.descripcion ?? '',
      explicacion_presupuestos: proyecto.explicacion_presupuestos ?? '',
      fecha_activacion: proyecto.fecha_activacion ?? '',
      fecha_cierre: proyecto.fecha_cierre ?? '',
      notas: proyecto.notas ?? '',
      departamento_ids: proyectoDepartamentoIds ?? [],
    } : {
      titulo: '',
      empresa_id: '',
      empresa_grupo_id: '',
      tipo_proyecto: undefined,
      tipo_partida: undefined,
      estado: 'Propuesta' as ProyectoFormData['estado'],
      aprobador_final_id: '',
      ppto_estimado: 0,
      descripcion: '',
      explicacion_presupuestos: '',
      fecha_activacion: '',
      fecha_cierre: '',
      notas: '',
      departamento_ids: [],
    },
  })

  const tipoProyecto = watch('tipo_proyecto')
  const selectedEgId = watch('empresa_grupo_id')
  const selectedDeptIds = watch('departamento_ids')

  // Solo mostrar departamentos de la empresa_grupo seleccionada
  const deptsFiltrados = useMemo(() => {
    if (!selectedEgId) return []
    return departamentos.filter((d) => d.empresa_grupo_id === selectedEgId)
  }, [departamentos, selectedEgId])

  const empresaOptions = empresas.map((e) => ({
    value: e.id,
    label: e.nombre_interno ?? e.nombre_legal,
  }))

  const egOptions = empresasGrupo.map((eg) => ({
    value: eg.id,
    label: `${eg.codigo} — ${eg.nombre}`,
  }))

  const personaOptions = personas
    .filter((p) => p.activo)
    .map((p) => ({
      value: p.id,
      label: p.persona,
    }))

  async function onSubmit(data: ProyectoFormData) {
    setSubmitting(true)
    setServerError('')

    const result = isEditMode
      ? await actualizarProyecto(proyecto!.id, data)
      : await crearProyecto(data)

    if (result.success) {
      if (!isEditMode) reset()
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }

    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      if (!isEditMode) reset()
      setServerError('')
    }
  }

  const defaultTrigger = isEditMode ? (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Pencil className="h-3.5 w-3.5" />
      Editar proyecto
    </Button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nuevo Proyecto
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Proyecto' : 'Nuevo Proyecto'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Modifica los datos del proyecto.' : 'Rellena los datos para crear un nuevo proyecto.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          {/* Título */}
          <div className="space-y-1.5">
            <Label htmlFor="titulo">Título *</Label>
            <Input
              id="titulo"
              placeholder="Nombre del proyecto"
              aria-invalid={!!errors.titulo}
              {...register('titulo')}
            />
            <FieldError message={errors.titulo?.message} />
          </div>

          {/* Empresa cliente (opcional para internos) */}
          <div className="space-y-1.5">
            <Label>Empresa cliente</Label>
            <NativeSelect
              options={empresaOptions}
              placeholder={tipoProyecto === 'Interno' ? 'N/A — Proyecto interno' : 'Seleccionar empresa...'}
              value={watch('empresa_id')}
              onChange={(v) => setValue('empresa_id', v)}
            />
            <p className="text-[11px] text-muted-foreground">Déjalo vacío para proyectos internos</p>
          </div>

          {/* Empresa grupo (quién ejecuta) */}
          <div className="space-y-1.5">
            <Label>Empresa del grupo *</Label>
            <NativeSelect
              options={egOptions}
              placeholder="Quién ejecuta..."
              value={watch('empresa_grupo_id')}
              onChange={(v) => {
                setValue('empresa_grupo_id', v, { shouldValidate: true })
                // Limpiar departamentos al cambiar empresa del grupo
                setValue('departamento_ids', [])
              }}
              error={!!errors.empresa_grupo_id}
            />
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          {/* Departamentos (filtrados por empresa_grupo) */}
          {selectedEgId && deptsFiltrados.length > 0 && (
            <div className="space-y-1.5">
              <Label>Departamentos</Label>
              <div className="rounded-lg border border-input p-3 space-y-2 max-h-40 overflow-y-auto">
                {deptsFiltrados.map((d) => {
                  const checked = selectedDeptIds.includes(d.id)
                  return (
                    <label key={d.id} className="flex items-center gap-2 cursor-pointer text-sm">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          const next = checked
                            ? selectedDeptIds.filter((id) => id !== d.id)
                            : [...selectedDeptIds, d.id]
                          setValue('departamento_ids', next)
                        }}
                        className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span>{d.nombre}</span>
                      <span className="text-xs text-muted-foreground">({d.codigo})</span>
                    </label>
                  )
                })}
              </div>
              <p className="text-[11px] text-muted-foreground">
                Solo departamentos de la empresa del grupo seleccionada
              </p>
            </div>
          )}

          {/* Tipo proyecto + Tipo partida */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Tipo proyecto *</Label>
              <SimpleSelect
                options={TIPOS_PROYECTO}
                placeholder="Seleccionar..."
                value={watch('tipo_proyecto') ?? ''}
                onChange={(v) => setValue('tipo_proyecto', v as ProyectoFormData['tipo_proyecto'], { shouldValidate: true })}
                error={!!errors.tipo_proyecto}
              />
              <FieldError message={errors.tipo_proyecto?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo partida *</Label>
              <SimpleSelect
                options={TIPOS_PARTIDA}
                placeholder="Seleccionar..."
                value={watch('tipo_partida') ?? ''}
                onChange={(v) => setValue('tipo_partida', v as ProyectoFormData['tipo_partida'], { shouldValidate: true })}
                error={!!errors.tipo_partida}
              />
              <FieldError message={errors.tipo_partida?.message} />
            </div>
          </div>

          {/* Estado + Aprobador */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <SimpleSelect
                options={ESTADOS_PROYECTO}
                placeholder="Seleccionar..."
                value={watch('estado') ?? ''}
                onChange={(v) => setValue('estado', v as ProyectoFormData['estado'], { shouldValidate: true })}
                error={!!errors.estado}
              />
              <FieldError message={errors.estado?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Aprobador *</Label>
              <NativeSelect
                options={personaOptions}
                placeholder="Seleccionar..."
                value={watch('aprobador_final_id')}
                onChange={(v) => setValue('aprobador_final_id', v, { shouldValidate: true })}
                error={!!errors.aprobador_final_id}
              />
              <FieldError message={errors.aprobador_final_id?.message} />
            </div>
          </div>

          {/* Presupuesto */}
          <div className="space-y-1.5">
            <Label htmlFor="ppto_estimado">Presupuesto estimado (€) *</Label>
            <Input
              id="ppto_estimado"
              type="number"
              min={0}
              step={100}
              placeholder="0"
              aria-invalid={!!errors.ppto_estimado}
              {...register('ppto_estimado', { valueAsNumber: true })}
            />
            <p className="text-[11px] text-muted-foreground">
              Mensual para partidas recurrentes, total para puntuales
            </p>
            <FieldError message={errors.ppto_estimado?.message} />
          </div>

          {/* Descripción */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Describe el proyecto..."
              {...register('descripcion')}
            />
          </div>

          {/* Explicación presupuestos */}
          <div className="space-y-1.5">
            <Label htmlFor="explicacion_presupuestos">Explicación presupuestos</Label>
            <Textarea
              id="explicacion_presupuestos"
              placeholder="Desglose o contexto del presupuesto..."
              {...register('explicacion_presupuestos')}
            />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_activacion">Fecha activación</Label>
              <Input id="fecha_activacion" type="date" {...register('fecha_activacion')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_cierre">Fecha cierre</Label>
              <Input id="fecha_cierre" type="date" {...register('fecha_cierre')} />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="notas">Notas</Label>
            <Textarea
              id="notas"
              placeholder="Información adicional..."
              {...register('notas')}
            />
          </div>

          {/* Error del servidor */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Footer */}
          <SheetFooter className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={submitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear Proyecto'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
