'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  contactoSchema,
  type ContactoFormData,
  ROLES_INFLUENCIA,
} from '@/lib/schemas/contacto'
import { crearContacto, actualizarContacto } from './actions'
import type { ContactoEmpresa, Empresa } from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Loader2, Pencil } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function NativeSelect({
  options, placeholder, value, onChange,
}: {
  options: readonly string[]
  placeholder: string
  value: string
  onChange: (v: string) => void
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
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
  contacto?: ContactoEmpresa
  preselectedEmpresaId?: string
  trigger?: React.ReactElement
  onCreated?: (id: string) => void
}

export function ContactoFormSheet({
  empresas, contacto, preselectedEmpresaId, trigger, onCreated,
}: Props) {
  const router = useRouter()
  const isEditMode = !!contacto
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const defaults: ContactoFormData = isEditMode ? {
    empresa_id: contacto.empresa_id,
    nombre: contacto.nombre,
    apellidos: contacto.apellidos ?? '',
    email: contacto.email ?? '',
    telefono_directo: contacto.telefono_directo ?? '',
    movil: contacto.movil ?? '',
    cargo: contacto.cargo ?? '',
    departamento: contacto.departamento ?? '',
    es_decisor: contacto.es_decisor,
    es_contacto_principal: contacto.es_contacto_principal,
    notas: contacto.notas ?? '',
    activo: contacto.activo,
    linkedin_url: contacto.linkedin_url ?? '',
    rol_influencia: contacto.rol_influencia ?? '',
    fecha_ultimo_contacto: contacto.fecha_ultimo_contacto ?? '',
    idioma_preferido: contacto.idioma_preferido ?? '',
    fecha_cumpleanos: contacto.fecha_cumpleanos ?? '',
    assistant_nombre: contacto.assistant_nombre ?? '',
    assistant_email: contacto.assistant_email ?? '',
  } : {
    empresa_id: preselectedEmpresaId ?? '',
    nombre: '', apellidos: '', email: '', telefono_directo: '', movil: '',
    cargo: '', departamento: '', es_decisor: false, es_contacto_principal: false,
    notas: '', activo: true, linkedin_url: '', rol_influencia: '',
    fecha_ultimo_contacto: '', idioma_preferido: '', fecha_cumpleanos: '',
    assistant_nombre: '', assistant_email: '',
  }

  const {
    register, handleSubmit, watch, setValue, reset, formState: { errors },
  } = useForm<ContactoFormData>({
    resolver: zodResolver(contactoSchema),
    defaultValues: defaults,
  })

  async function onSubmit(data: ContactoFormData) {
    setSubmitting(true)
    setServerError('')
    const result = isEditMode
      ? await actualizarContacto(contacto!.id, data)
      : await crearContacto(data)

    if (result.success) {
      if (!isEditMode) reset(defaults)
      setOpen(false)
      router.refresh()
      if (!isEditMode && result.id && onCreated) onCreated(result.id)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      if (!isEditMode) reset(defaults)
      setServerError('')
    }
  }

  const empresaOptions = empresas.map((e) => ({
    value: e.id,
    label: e.nombre_interno ?? e.nombre_legal,
  }))

  const defaultTrigger = isEditMode ? (
    <button className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="Editar contacto">
      <Pencil className="h-3 w-3" />
    </button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nuevo Contacto
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent side="right" className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Contacto' : 'Nuevo Contacto'}</SheetTitle>
          <SheetDescription>
            {isEditMode
              ? `Modifica los datos de ${contacto.nombre}.`
              : 'Añade un nuevo contacto de empresa.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Empresa */}
          <div className="space-y-1.5">
            <Label>Empresa *</Label>
            <SearchableSelect
              options={empresaOptions}
              placeholder="Seleccionar empresa..."
              value={watch('empresa_id')}
              onChange={(v) => setValue('empresa_id', v, { shouldValidate: true })}
              error={!!errors.empresa_id}
              disabled={!!preselectedEmpresaId || isEditMode}
            />
            <FieldError message={errors.empresa_id?.message} />
          </div>

          {/* ── Identidad ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-1">
            Identidad
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c_nombre">Nombre *</Label>
              <Input id="c_nombre" aria-invalid={!!errors.nombre} {...register('nombre')} />
              <FieldError message={errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_apellidos">Apellidos</Label>
              <Input id="c_apellidos" {...register('apellidos')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c_cargo">Cargo</Label>
              <Input id="c_cargo" placeholder="Director de Marketing..." {...register('cargo')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_depto">Departamento</Label>
              <Input id="c_depto" placeholder="Marketing, Compras..." {...register('departamento')} />
            </div>
          </div>

          {/* ── Contacto ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Datos de contacto
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="c_email">Email</Label>
            <Input id="c_email" type="email" placeholder="nombre@empresa.com" {...register('email')} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c_telefono">Teléfono directo</Label>
              <Input id="c_telefono" placeholder="+34 ..." {...register('telefono_directo')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_movil">Móvil</Label>
              <Input id="c_movil" placeholder="+34 ..." {...register('movil')} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="c_linkedin">LinkedIn URL</Label>
            <Input id="c_linkedin" placeholder="https://linkedin.com/in/..." {...register('linkedin_url')} />
          </div>

          {/* ── Clasificación ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Clasificación
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rol de influencia</Label>
              <NativeSelect
                options={ROLES_INFLUENCIA}
                placeholder="Sin especificar"
                value={watch('rol_influencia')}
                onChange={(v) => setValue('rol_influencia', v)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_idioma">Idioma preferido</Label>
              <Input id="c_idioma" placeholder="Español" {...register('idioma_preferido')} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                {...register('es_contacto_principal')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Principal
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                {...register('es_decisor')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Decisor
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-sm">
              <input
                type="checkbox"
                {...register('activo')}
                className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              Activo
            </label>
          </div>

          {/* ── Fechas ── */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c_ultimo_contacto">Último contacto</Label>
              <Input id="c_ultimo_contacto" type="date" {...register('fecha_ultimo_contacto')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_cumple">Cumpleaños</Label>
              <Input id="c_cumple" type="date" {...register('fecha_cumpleanos')} />
            </div>
          </div>

          {/* ── Asistente ── */}
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground pt-3">
            Asistente
          </p>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c_asst_nombre">Nombre asistente</Label>
              <Input id="c_asst_nombre" {...register('assistant_nombre')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c_asst_email">Email asistente</Label>
              <Input id="c_asst_email" type="email" {...register('assistant_email')} />
            </div>
          </div>

          {/* Notas */}
          <div className="space-y-1.5">
            <Label htmlFor="c_notas">Notas</Label>
            <Textarea id="c_notas" placeholder="Información adicional..." {...register('notas')} />
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
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear Contacto'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
