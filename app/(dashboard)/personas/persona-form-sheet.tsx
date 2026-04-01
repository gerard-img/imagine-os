'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaSchema, type PersonaFormData, MODALIDADES_TRABAJO } from '@/lib/schemas/persona'
import { crearPersona } from './actions'
import type {
  EmpresaGrupo, Rol, Division, Puesto, RangoInterno, Ciudad, Oficina,
} from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2 } from 'lucide-react'

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
  empresasGrupo: EmpresaGrupo[]
  roles: Rol[]
  divisiones: Division[]
  puestos: Puesto[]
  rangos: RangoInterno[]
  ciudades: Ciudad[]
  oficinas: Oficina[]
}

export function PersonaFormSheet({
  empresasGrupo, roles, divisiones, puestos, rangos, ciudades, oficinas,
}: Props) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const defaults: PersonaFormData = {
    nombre: '', apellido_primero: '', apellido_segundo: '', dni: '',
    empresa_grupo_id: '', rol_id: '', division_id: '', puesto_id: '',
    rango_id: '', ciudad_id: '', oficina_id: '', fecha_incorporacion: '',
    email_corporativo: '', email_personal: '', telefono: '', modalidad_trabajo: '',
  }

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: defaults,
  })

  const egId = watch('empresa_grupo_id')

  // Filtrar puestos y rangos por empresa_grupo seleccionada
  const puestosFiltrados = useMemo(
    () => egId ? puestos.filter((p) => p.empresa_grupo_id === egId) : puestos,
    [puestos, egId]
  )
  const rangosFiltrados = useMemo(
    () => egId ? rangos.filter((r) => r.empresa_grupo_id === egId) : rangos,
    [rangos, egId]
  )

  async function onSubmit(data: PersonaFormData) {
    setSubmitting(true)
    setServerError('')
    const result = await crearPersona(data)
    if (result.success) {
      reset(defaults)
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) { reset(defaults); setServerError('') }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        render={
          <Button size="default" className="gap-1.5 shrink-0">
            <Plus className="h-4 w-4" />
            Nuevo Miembro
          </Button>
        }
      />

      <SheetContent side="right" className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Nuevo Miembro</SheetTitle>
          <SheetDescription>
            Rellena los datos para añadir una persona al equipo.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Nombre + Primer Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" placeholder="Ej: María" aria-invalid={!!errors.nombre} {...register('nombre')} />
              <FieldError message={errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido_primero">Primer apellido *</Label>
              <Input id="apellido_primero" placeholder="Ej: García" aria-invalid={!!errors.apellido_primero} {...register('apellido_primero')} />
              <FieldError message={errors.apellido_primero?.message} />
            </div>
          </div>

          {/* Segundo Apellido + DNI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apellido_segundo">Segundo apellido</Label>
              <Input id="apellido_segundo" placeholder="Opcional" {...register('apellido_segundo')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI *</Label>
              <Input id="dni" placeholder="12345678A" aria-invalid={!!errors.dni} {...register('dni')} />
              <FieldError message={errors.dni?.message} />
            </div>
          </div>

          {/* Empresa Grupo */}
          <div className="space-y-1.5">
            <Label>Empresa grupo *</Label>
            <NativeSelect
              options={empresasGrupo.map((eg) => ({ value: eg.id, label: `${eg.codigo} — ${eg.nombre}` }))}
              placeholder="Seleccionar empresa grupo..."
              value={egId}
              onChange={(v) => {
                setValue('empresa_grupo_id', v, { shouldValidate: true })
                setValue('puesto_id', '')
                setValue('rango_id', '')
              }}
              error={!!errors.empresa_grupo_id}
            />
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          {/* Rol + División */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <NativeSelect
                options={roles.map((r) => ({ value: r.id, label: r.nombre }))}
                placeholder="Seleccionar..."
                value={watch('rol_id')}
                onChange={(v) => setValue('rol_id', v, { shouldValidate: true })}
                error={!!errors.rol_id}
              />
              <FieldError message={errors.rol_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>División *</Label>
              <NativeSelect
                options={divisiones.map((d) => ({ value: d.id, label: d.nombre }))}
                placeholder="Seleccionar..."
                value={watch('division_id')}
                onChange={(v) => setValue('division_id', v, { shouldValidate: true })}
                error={!!errors.division_id}
              />
              <FieldError message={errors.division_id?.message} />
            </div>
          </div>

          {/* Puesto + Rango */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Puesto *</Label>
              <NativeSelect
                options={puestosFiltrados.map((p) => ({ value: p.id, label: p.nombre }))}
                placeholder={egId ? 'Seleccionar...' : 'Elige empresa primero'}
                value={watch('puesto_id')}
                onChange={(v) => setValue('puesto_id', v, { shouldValidate: true })}
                error={!!errors.puesto_id}
                disabled={!egId}
              />
              <FieldError message={errors.puesto_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Rango *</Label>
              <NativeSelect
                options={rangosFiltrados.map((r) => ({ value: r.id, label: r.nombre }))}
                placeholder={egId ? 'Seleccionar...' : 'Elige empresa primero'}
                value={watch('rango_id')}
                onChange={(v) => setValue('rango_id', v, { shouldValidate: true })}
                error={!!errors.rango_id}
                disabled={!egId}
              />
              <FieldError message={errors.rango_id?.message} />
            </div>
          </div>

          {/* Ciudad + Oficina */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ciudad *</Label>
              <NativeSelect
                options={ciudades.map((c) => ({ value: c.id, label: c.nombre }))}
                placeholder="Seleccionar..."
                value={watch('ciudad_id')}
                onChange={(v) => setValue('ciudad_id', v, { shouldValidate: true })}
                error={!!errors.ciudad_id}
              />
              <FieldError message={errors.ciudad_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Oficina</Label>
              <NativeSelect
                options={oficinas.map((o) => ({ value: o.id, label: o.nombre }))}
                placeholder="Sin oficina"
                value={watch('oficina_id')}
                onChange={(v) => setValue('oficina_id', v)}
              />
            </div>
          </div>

          {/* Fecha incorporación + Modalidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_incorporacion">Fecha incorporación *</Label>
              <Input
                id="fecha_incorporacion"
                type="date"
                aria-invalid={!!errors.fecha_incorporacion}
                {...register('fecha_incorporacion')}
              />
              <FieldError message={errors.fecha_incorporacion?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <NativeSelect
                options={MODALIDADES_TRABAJO.map((m) => ({ value: m, label: m }))}
                placeholder="Sin especificar"
                value={watch('modalidad_trabajo')}
                onChange={(v) => setValue('modalidad_trabajo', v)}
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1.5">
            <Label htmlFor="email_corporativo">Email corporativo</Label>
            <Input id="email_corporativo" type="email" placeholder="nombre@empresa.com" {...register('email_corporativo')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email_personal">Email personal</Label>
              <Input id="email_personal" type="email" placeholder="nombre@gmail.com" {...register('email_personal')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" placeholder="+34 600 000 000" {...register('telefono')} />
            </div>
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
              {submitting ? 'Guardando...' : 'Crear Miembro'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
