'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  empresaEditSchema,
  type EmpresaEditFormData,
  ESTADOS_EMPRESA,
  TIPOS_EMPRESA,
  TIPOS_CONOCIDO,
  TIPOS_CLIENTE,
  ESTADOS_PROSPECTO,
  CLASIFICACIONES_CUENTA,
  FUENTES_CAPTACION,
} from '@/lib/schemas/empresa'
import { actualizarEmpresa } from '../actions'
import type { Empresa, Persona } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Pencil, Loader2 } from 'lucide-react'

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

type Props = {
  empresa: Empresa
  personas: Persona[]
}

export function EmpresaEditSheet({ empresa, personas }: Props) {
  const router = useRouter()
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
  } = useForm<EmpresaEditFormData>({
    resolver: zodResolver(empresaEditSchema),
    defaultValues: {
      nombre_legal: empresa.nombre_legal,
      cif: empresa.cif ?? '',
      nombre_interno: empresa.nombre_interno ?? '',
      estado: empresa.estado,
      tipo: empresa.tipo ?? undefined,
      tipo_conocido: empresa.tipo_conocido ?? '',
      tipo_cliente: empresa.tipo_cliente ?? '',
      estado_prospecto: empresa.estado_prospecto ?? '',
      fecha_primer_contrato: empresa.fecha_primer_contrato ?? '',
      sector: empresa.sector ?? '',
      web: empresa.web ?? '',
      notas: empresa.notas ?? '',
      calle: empresa.calle ?? '',
      codigo_postal: empresa.codigo_postal ?? '',
      ciudad: empresa.ciudad ?? '',
      provincia: empresa.provincia ?? '',
      pais: empresa.pais ?? '',
      linkedin_url: empresa.linkedin_url ?? '',
      telefono: empresa.telefono ?? '',
      num_empleados: empresa.num_empleados?.toString() ?? '',
      facturacion_anual_estimada: empresa.facturacion_anual_estimada?.toString() ?? '',
      clasificacion_cuenta: empresa.clasificacion_cuenta ?? '',
      moneda: empresa.moneda ?? 'EUR',
      idioma_preferido: empresa.idioma_preferido ?? '',
      fuente_captacion: empresa.fuente_captacion ?? '',
      responsable_cuenta_id: empresa.responsable_cuenta_id ?? '',
    },
  })

  const estado = watch('estado')

  async function onSubmit(data: EmpresaEditFormData) {
    setSubmitting(true)
    setServerError('')

    const result = await actualizarEmpresa(empresa.id, data)

    if (result.success) {
      setOpen(false)
      router.refresh()
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
          <Button variant="outline" size="sm" className="gap-1.5">
            <Pencil className="h-3.5 w-3.5" />
            Editar
          </Button>
        }
      />

      <SheetContent side="right" className="w-[520px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Editar Empresa</SheetTitle>
          <SheetDescription>
            Modifica los datos de {empresa.nombre_interno ?? empresa.nombre_legal}.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* ── Identificación ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-1">
            Identificación
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="edit_nombre_legal">Nombre legal *</Label>
            <Input id="edit_nombre_legal" aria-invalid={!!errors.nombre_legal} {...register('nombre_legal')} />
            <FieldError message={errors.nombre_legal?.message} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_cif">CIF</Label>
              <Input id="edit_cif" aria-invalid={!!errors.cif} {...register('cif')} />
              <FieldError message={errors.cif?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_nombre_interno">Nombre interno</Label>
              <Input id="edit_nombre_interno" {...register('nombre_interno')} />
            </div>
          </div>

          {/* ── Clasificación ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Clasificación
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Estado *</Label>
              <NativeSelect
                options={ESTADOS_EMPRESA}
                placeholder="Seleccionar..."
                value={estado ?? ''}
                onChange={(v) => {
                  setValue('estado', v as EmpresaEditFormData['estado'], { shouldValidate: true })
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
                onChange={(v) => setValue('tipo', v as EmpresaEditFormData['tipo'], { shouldValidate: true })}
                error={!!errors.tipo}
              />
              <FieldError message={errors.tipo?.message} />
            </div>
          </div>

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

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Clasificación cuenta</Label>
              <NativeSelect
                options={CLASIFICACIONES_CUENTA}
                placeholder="Sin clasificar"
                value={watch('clasificacion_cuenta') ?? ''}
                onChange={(v) => setValue('clasificacion_cuenta', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_sector">Sector</Label>
              <Input id="edit_sector" placeholder="Ej: Alimentación, Moda..." {...register('sector')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Fuente de captación</Label>
              <NativeSelect
                options={FUENTES_CAPTACION}
                placeholder="Seleccionar..."
                value={watch('fuente_captacion') ?? ''}
                onChange={(v) => setValue('fuente_captacion', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_fecha">Fecha primer contrato</Label>
              <Input id="edit_fecha" type="date" {...register('fecha_primer_contrato')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Responsable de cuenta</Label>
            <select
              value={watch('responsable_cuenta_id') ?? ''}
              onChange={(e) => setValue('responsable_cuenta_id', e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <option value="">Sin asignar</option>
              {personas
                .sort((a, b) => a.persona.localeCompare(b.persona))
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.persona}</option>
                ))}
            </select>
          </div>

          {/* ── Datos Comerciales ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Datos Comerciales
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_num_empleados">Nº empleados</Label>
              <Input id="edit_num_empleados" type="number" placeholder="0" {...register('num_empleados')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_facturacion">Facturación anual est.</Label>
              <Input id="edit_facturacion" type="number" step="0.01" placeholder="0.00" {...register('facturacion_anual_estimada')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_moneda">Moneda</Label>
              <Input id="edit_moneda" placeholder="EUR" {...register('moneda')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_idioma">Idioma preferido</Label>
              <Input id="edit_idioma" placeholder="Español" {...register('idioma_preferido')} />
            </div>
          </div>

          {/* ── Contacto y Web ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Contacto y Web
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_telefono">Teléfono</Label>
              <Input id="edit_telefono" placeholder="+34 ..." {...register('telefono')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_web">Web</Label>
              <Input id="edit_web" placeholder="https://..." {...register('web')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_linkedin">LinkedIn URL</Label>
            <Input id="edit_linkedin" placeholder="https://linkedin.com/company/..." {...register('linkedin_url')} />
          </div>

          {/* ── Dirección ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Dirección
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="edit_calle">Calle</Label>
            <Input id="edit_calle" placeholder="Calle, número..." {...register('calle')} />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="edit_ciudad">Ciudad</Label>
              <Input id="edit_ciudad" {...register('ciudad')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_provincia">Provincia</Label>
              <Input id="edit_provincia" {...register('provincia')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="edit_cp">C.P.</Label>
              <Input id="edit_cp" {...register('codigo_postal')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="edit_pais">País</Label>
            <Input id="edit_pais" {...register('pais')} />
          </div>

          {/* ── Notas ── */}
          <div className="space-y-1.5 pt-3">
            <Label htmlFor="edit_notas">Notas</Label>
            <Textarea id="edit_notas" placeholder="Información adicional..." {...register('notas')} />
          </div>

          {/* Error del servidor */}
          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

          {/* Footer */}
          <SheetFooter className="flex gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => handleOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" disabled={submitting} className="gap-1.5">
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {submitting ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
