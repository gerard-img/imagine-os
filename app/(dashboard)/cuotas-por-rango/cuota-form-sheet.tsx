'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { cuotaSchema, type CuotaFormData } from '@/lib/schemas/cuota-planificacion'
import { crearCuota, actualizarCuota } from './actions'
import type { EmpresaGrupo, CuotaPlanificacion } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Loader2 } from 'lucide-react'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

type Props = {
  empresasGrupo: EmpresaGrupo[]
  cuota?: CuotaPlanificacion
  trigger?: React.ReactElement
}

export function CuotaFormSheet({ empresasGrupo, cuota, trigger }: Props) {
  const isEdit = !!cuota
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const defaults: CuotaFormData = {
    empresa_grupo_id: cuota?.empresa_grupo_id ?? '',
    nombre: cuota?.nombre ?? '',
    precio_hora: cuota?.precio_hora ?? 0,
    inicio_validez: cuota?.inicio_validez ?? '',
    fin_validez: cuota?.fin_validez ?? '',
    nota: cuota?.nota ?? '',
  }

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<CuotaFormData>({
    resolver: zodResolver(cuotaSchema),
    defaultValues: defaults,
  })

  async function onSubmit(data: CuotaFormData) {
    setSubmitting(true)
    setServerError('')
    const result = isEdit
      ? await actualizarCuota(cuota!.id, data)
      : await crearCuota(data)
    if (result.success) {
      if (!isEdit) reset(defaults)
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (next) {
      reset(defaults)
      setServerError('')
    }
  }

  const defaultTrigger = isEdit ? (
    <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar">
      <Pencil className="h-4 w-4 text-muted-foreground" />
    </Button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nueva Cuota
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent side="right" className="w-[440px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Cuota' : 'Nueva Cuota de Planificación'}</SheetTitle>
          <SheetDescription>
            {isEdit
              ? 'Modifica los datos de esta cuota.'
              : 'Define una tarifa horaria por categoría y empresa.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          {/* Empresa grupo */}
          <div className="space-y-1.5">
            <Label>Empresa grupo *</Label>
            <select
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={watch('empresa_grupo_id')}
              onChange={(e) => setValue('empresa_grupo_id', e.target.value, { shouldValidate: true })}
            >
              <option value="">Seleccionar...</option>
              {empresasGrupo.map((eg) => (
                <option key={eg.id} value={eg.id}>{eg.codigo} — {eg.nombre}</option>
              ))}
            </select>
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          {/* Nombre / Categoría */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Categoría *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Junior, Specialist, Senior..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          {/* Precio hora */}
          <div className="space-y-1.5">
            <Label htmlFor="precio_hora">Precio/hora (€) *</Label>
            <Input
              id="precio_hora"
              type="number"
              step="0.01"
              min={0}
              placeholder="Ej: 52.80"
              aria-invalid={!!errors.precio_hora}
              {...register('precio_hora', { valueAsNumber: true })}
            />
            <FieldError message={errors.precio_hora?.message} />
          </div>

          {/* Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="inicio_validez">Inicio validez *</Label>
              <Input
                id="inicio_validez"
                type="date"
                aria-invalid={!!errors.inicio_validez}
                {...register('inicio_validez')}
              />
              <FieldError message={errors.inicio_validez?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fin_validez">Fin validez</Label>
              <Input id="fin_validez" type="date" {...register('fin_validez')} />
              <p className="text-[10px] text-muted-foreground">Dejar vacío = vigente</p>
            </div>
          </div>

          {/* Nota */}
          <div className="space-y-1.5">
            <Label htmlFor="nota">Nota</Label>
            <Textarea id="nota" placeholder="Opcional..." {...register('nota')} />
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          <SheetFooter className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Cuota'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
