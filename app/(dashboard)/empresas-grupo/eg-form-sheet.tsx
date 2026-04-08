'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { crearEmpresaGrupo, actualizarEmpresaGrupo } from './actions'
import type { EmpresaGrupo } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Pencil } from 'lucide-react'

const egSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio'),
  nombre_legal: z.string(),
  codigo: z.string().min(1, 'El código es obligatorio'),
  cif: z.string().min(1, 'El CIF es obligatorio'),
  pais: z.string(),
  moneda_base: z.string(),
  web: z.string(),
  email_general: z.string(),
  telefono: z.string(),
  logo_url: z.string(),
  color_marca: z.string(),
})
type EGFormData = z.infer<typeof egSchema>

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

type Props = {
  eg?: EmpresaGrupo
  trigger?: React.ReactElement
}

export function EGFormSheet({ eg, trigger }: Props) {
  const router = useRouter()
  const isEdit = !!eg
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const { register, handleSubmit, reset, formState: { errors } } = useForm<EGFormData>({
    resolver: zodResolver(egSchema),
    defaultValues: isEdit ? {
      nombre: eg.nombre,
      nombre_legal: eg.nombre_legal ?? '',
      codigo: eg.codigo,
      cif: eg.cif,
      pais: eg.pais ?? '',
      moneda_base: eg.moneda_base ?? 'EUR',
      web: eg.web ?? '',
      email_general: eg.email_general ?? '',
      telefono: eg.telefono ?? '',
      logo_url: eg.logo_url ?? '',
      color_marca: eg.color_marca ?? '',
    } : {
      nombre: '', nombre_legal: '', codigo: '', cif: '', pais: 'España',
      moneda_base: 'EUR', web: '', email_general: '', telefono: '',
      logo_url: '', color_marca: '',
    },
  })

  async function onSubmit(data: EGFormData) {
    setSubmitting(true)
    setServerError('')
    const result = isEdit
      ? await actualizarEmpresaGrupo(eg!.id, data)
      : await crearEmpresaGrupo(data)
    if (result.success) {
      if (!isEdit) reset()
      setOpen(false)
      router.refresh()
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) { if (!isEdit) reset(); setServerError('') }
  }

  const defaultTrigger = isEdit ? (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Pencil className="h-3.5 w-3.5" />
      Editar
    </Button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nueva Empresa Grupo
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />
      <SheetContent side="right" className="w-[480px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? 'Editar Empresa del Grupo' : 'Nueva Empresa del Grupo'}</SheetTitle>
          <SheetDescription>
            {isEdit ? `Modifica los datos de ${eg.nombre}.` : 'Rellena los datos de la nueva empresa del holding.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">Identificación</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg_nombre">Nombre *</Label>
              <Input id="eg_nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
              <FieldError message={errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg_codigo">Código *</Label>
              <Input id="eg_codigo" placeholder="DME, IMG..." aria-invalid={!!errors.codigo} {...register('codigo')} />
              <FieldError message={errors.codigo?.message} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg_nombre_legal">Nombre legal</Label>
              <Input id="eg_nombre_legal" {...register('nombre_legal')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg_cif">CIF *</Label>
              <Input id="eg_cif" aria-invalid={!!errors.cif} {...register('cif')} />
              <FieldError message={errors.cif?.message} />
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">Contacto</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg_email">Email general</Label>
              <Input id="eg_email" type="email" {...register('email_general')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg_telefono">Teléfono</Label>
              <Input id="eg_telefono" {...register('telefono')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="eg_web">Web</Label>
            <Input id="eg_web" placeholder="https://..." {...register('web')} />
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">Configuración</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg_pais">País</Label>
              <Input id="eg_pais" {...register('pais')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg_moneda">Moneda base</Label>
              <Input id="eg_moneda" placeholder="EUR" {...register('moneda_base')} />
            </div>
          </div>

          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">Marca</p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="eg_logo">URL logo</Label>
              <Input id="eg_logo" placeholder="https://..." {...register('logo_url')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="eg_color">Color marca</Label>
              <Input id="eg_color" placeholder="#00C896" {...register('color_marca')} />
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
              {submitting ? 'Guardando...' : isEdit ? 'Guardar cambios' : 'Crear Empresa'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
