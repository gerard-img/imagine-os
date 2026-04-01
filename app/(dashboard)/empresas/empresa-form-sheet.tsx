'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  empresaSchema,
  type EmpresaFormData,
  ESTADOS_EMPRESA,
  TIPOS_EMPRESA,
  TIPOS_CONOCIDO,
  TIPOS_CLIENTE,
  ESTADOS_PROSPECTO,
} from '@/lib/schemas/empresa'
import { crearEmpresa } from './actions'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2 } from 'lucide-react'

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

export function EmpresaFormSheet() {
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
  } = useForm<EmpresaFormData>({
    resolver: zodResolver(empresaSchema),
    defaultValues: {
      nombre_legal: '',
      cif: '',
      nombre_interno: '',
      estado: undefined,
      tipo: undefined,
      tipo_conocido: '',
      tipo_cliente: '',
      estado_prospecto: '',
      fecha_primer_contrato: '',
      direccion: '',
      sector: '',
      web: '',
      notas: '',
    },
  })

  const estado = watch('estado')

  async function onSubmit(data: EmpresaFormData) {
    setSubmitting(true)
    setServerError('')

    const result = await crearEmpresa(data)

    if (result.success) {
      reset()
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }

    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      reset()
      setServerError('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button size="default" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Nueva Empresa
          </Button>
        }
      />

      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nueva Empresa</SheetTitle>
          <SheetDescription>
            Rellena los datos para crear una nueva empresa.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          {/* Nombre Legal */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre_legal">Nombre legal *</Label>
            <Input
              id="nombre_legal"
              placeholder="Razón social de la empresa"
              aria-invalid={!!errors.nombre_legal}
              {...register('nombre_legal')}
            />
            <FieldError message={errors.nombre_legal?.message} />
          </div>

          {/* CIF */}
          <div className="space-y-1.5">
            <Label htmlFor="cif">CIF *</Label>
            <Input
              id="cif"
              placeholder="B12345678"
              aria-invalid={!!errors.cif}
              {...register('cif')}
            />
            <FieldError message={errors.cif?.message} />
          </div>

          {/* Nombre Interno */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre_interno">Nombre interno</Label>
            <Input
              id="nombre_interno"
              placeholder="Cómo la llamas internamente"
              {...register('nombre_interno')}
            />
          </div>

          {/* Estado + Tipo (2 columnas) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <NativeSelect
                options={ESTADOS_EMPRESA}
                placeholder="Seleccionar..."
                value={estado ?? ''}
                onChange={(v) => {
                  setValue('estado', v as EmpresaFormData['estado'], { shouldValidate: true })
                  // Limpiar subestados al cambiar
                  setValue('tipo_conocido', '')
                  setValue('tipo_cliente', '')
                  setValue('estado_prospecto', '')
                }}
                error={!!errors.estado}
              />
              <FieldError message={errors.estado?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo *</Label>
              <NativeSelect
                options={TIPOS_EMPRESA}
                placeholder="Seleccionar..."
                value={watch('tipo') ?? ''}
                onChange={(v) => setValue('tipo', v as EmpresaFormData['tipo'], { shouldValidate: true })}
                error={!!errors.tipo}
              />
              <FieldError message={errors.tipo?.message} />
            </div>
          </div>

          {/* Campos condicionales según estado */}
          {estado === 'Conocido' && (
            <div className="space-y-1.5">
              <Label>Tipo de conocido *</Label>
              <NativeSelect
                options={TIPOS_CONOCIDO}
                placeholder="Seleccionar..."
                value={watch('tipo_conocido') ?? ''}
                onChange={(v) => setValue('tipo_conocido', v, { shouldValidate: true })}
                error={!!errors.tipo_conocido}
              />
              <FieldError message={errors.tipo_conocido?.message} />
            </div>
          )}

          {estado === 'Cliente' && (
            <div className="space-y-1.5">
              <Label>Tipo de cliente *</Label>
              <NativeSelect
                options={TIPOS_CLIENTE}
                placeholder="Seleccionar..."
                value={watch('tipo_cliente') ?? ''}
                onChange={(v) => setValue('tipo_cliente', v, { shouldValidate: true })}
                error={!!errors.tipo_cliente}
              />
              <FieldError message={errors.tipo_cliente?.message} />
            </div>
          )}

          {estado === 'Prospecto' && (
            <div className="space-y-1.5">
              <Label>Estado del prospecto *</Label>
              <NativeSelect
                options={ESTADOS_PROSPECTO}
                placeholder="Seleccionar..."
                value={watch('estado_prospecto') ?? ''}
                onChange={(v) => setValue('estado_prospecto', v, { shouldValidate: true })}
                error={!!errors.estado_prospecto}
              />
              <FieldError message={errors.estado_prospecto?.message} />
            </div>
          )}

          {/* Sector */}
          <div className="space-y-1.5">
            <Label htmlFor="sector">Sector</Label>
            <Input
              id="sector"
              placeholder="Ej: Alimentación, Moda, Tecnología..."
              {...register('sector')}
            />
          </div>

          {/* Fecha primer contrato */}
          {(estado === 'Cliente' || estado === 'Prospecto') && (
            <div className="space-y-1.5">
              <Label htmlFor="fecha_primer_contrato">Fecha primer contrato</Label>
              <Input
                id="fecha_primer_contrato"
                type="date"
                {...register('fecha_primer_contrato')}
              />
            </div>
          )}

          {/* Dirección */}
          <div className="space-y-1.5">
            <Label htmlFor="direccion">Dirección</Label>
            <Input
              id="direccion"
              placeholder="Calle, número, ciudad..."
              {...register('direccion')}
            />
          </div>

          {/* Web */}
          <div className="space-y-1.5">
            <Label htmlFor="web">Web</Label>
            <Input
              id="web"
              placeholder="https://..."
              {...register('web')}
            />
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

          {/* Footer con botones */}
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
              {submitting ? 'Guardando...' : 'Crear Empresa'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
