'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { CatalogoServicio, EmpresaGrupo } from '@/lib/supabase/types'
import { crearServicio, actualizarServicio } from './actions'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Loader2 } from 'lucide-react'

// ── Schema local ──

// Nota: empresa_grupo_id es permisivo a nivel cliente porque en edición se
// inyecta desde props en onSubmit. El servidor sigue validando con .uuid() estricto.
const servicioSchema = z.object({
  empresa_grupo_id: z.string(),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede superar los 200 caracteres'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(20, 'El codigo no puede superar los 20 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional().or(z.literal('')),
})
type ServicioFormData = z.infer<typeof servicioSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type ServicioSheetProps =
  | { modo: 'crear'; empresas: EmpresaGrupo[]; trigger: React.ReactElement }
  | { modo: 'editar'; servicio: CatalogoServicio; empresas: EmpresaGrupo[]; trigger: React.ReactElement }

function ServicioSheet(props: ServicioSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    watch,
    formState: { errors },
  } = useForm<ServicioFormData>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      empresa_grupo_id: esEdicion ? props.servicio.empresa_grupo_id : '',
      nombre: esEdicion ? props.servicio.nombre : '',
      codigo: esEdicion ? props.servicio.codigo : '',
      descripcion: esEdicion ? (props.servicio.descripcion ?? '') : '',
    },
  })

  const selectedEmpresa = watch('empresa_grupo_id')

  async function onSubmit(data: ServicioFormData) {
    setSubmitting(true)
    setServerError('')

    if (!esEdicion && !data.empresa_grupo_id) {
      setError('empresa_grupo_id', { message: 'La empresa es obligatoria' })
      setSubmitting(false)
      return
    }

    const finalData = esEdicion
      ? { ...data, empresa_grupo_id: props.servicio.empresa_grupo_id }
      : data

    const result = esEdicion
      ? await actualizarServicio(props.servicio.id, finalData)
      : await crearServicio(finalData)

    if (result.success) {
      if (!esEdicion) reset()
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }

    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      if (!esEdicion) reset()
      setServerError('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={props.trigger} />

      <SheetContent side="right" className="w-[400px]">
        <SheetHeader>
          <SheetTitle>{esEdicion ? 'Editar Servicio' : 'Nuevo Servicio'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos del servicio.'
              : 'Introduce los datos para crear un nuevo servicio.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="empresa_grupo_id">Empresa *</Label>
            {esEdicion ? (
              <p className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                {(() => {
                  const eg = props.empresas.find((x) => x.id === props.servicio.empresa_grupo_id)
                  return eg ? `${eg.nombre} (${eg.codigo})` : '—'
                })()}
              </p>
            ) : (
              <select
                id="empresa_grupo_id"
                value={selectedEmpresa}
                onChange={(e) => setValue('empresa_grupo_id', e.target.value, { shouldValidate: true })}
                aria-invalid={!!errors.empresa_grupo_id}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              >
                <option value="">Selecciona una empresa</option>
                {props.empresas.map((eg) => (
                  <option key={eg.id} value={eg.id}>{eg.nombre} ({eg.codigo})</option>
                ))}
              </select>
            )}
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: SEO Local, Google Ads..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="codigo">Codigo *</Label>
            <Input
              id="codigo"
              placeholder="Ej: SEOLOCAL, GADS..."
              aria-invalid={!!errors.codigo}
              {...register('codigo')}
            />
            <FieldError message={errors.codigo?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripcion del servicio..."
              aria-invalid={!!errors.descripcion}
              {...register('descripcion')}
            />
            <FieldError message={errors.descripcion?.message} />
          </div>

          {serverError && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/20 px-3 py-2">
              <p className="text-sm text-destructive">{serverError}</p>
            </div>
          )}

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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Servicio'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la pagina ──

type Props = {
  servicios: CatalogoServicio[]
  empresas: EmpresaGrupo[]
}

export function CatalogoClient({ servicios, empresas }: Props) {
  const [empresaFilter, setEmpresaFilter] = useState('Todas')

  const egMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const empresaOptions = useMemo(() => {
    const codigos = empresas.map((eg) => eg.codigo)
    return ['Todas', ...codigos]
  }, [empresas])

  const filtered = servicios.filter((s) => {
    if (empresaFilter === 'Todas') return true
    return egMap.get(s.empresa_grupo_id)?.codigo === empresaFilter
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Catalogo de Servicios</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Servicios que ofrecen las empresas del grupo
          </p>
        </div>
        <ServicioSheet
          modo="crear"
          empresas={empresas}
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo Servicio
            </Button>
          }
        />
      </div>

      {/* Filter pills */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        {empresaOptions.map((option) => (
          <button
            key={option}
            type="button"
            onClick={() => setEmpresaFilter(option)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              empresaFilter === option
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {option}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-4 rounded-xl bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aun no hay servicios</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer servicio usando el boton de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Codigo</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Descripcion</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((servicio) => {
                const empresa = egMap.get(servicio.empresa_grupo_id)
                return (
                  <TableRow key={servicio.id}>
                    <TableCell className="font-medium">{empresa?.nombre ?? '—'}</TableCell>
                    <TableCell className="font-medium">{servicio.nombre}</TableCell>
                    <TableCell>{servicio.codigo}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {servicio.descripcion ?? '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <ServicioSheet
                        modo="editar"
                        servicio={servicio}
                        empresas={empresas}
                        trigger={
                          <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar">
                            <Pencil className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        }
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
