'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Ciudad } from '@/lib/supabase/types'
import { crearCiudad, actualizarCiudad } from './actions'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Pencil, Loader2 } from 'lucide-react'

// ── Schema local (nombre + pais) ──

const ciudadSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  pais: z.string().min(1, 'El país es obligatorio').max(100, 'El país no puede superar los 100 caracteres'),
})
type CiudadFormData = z.infer<typeof ciudadSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type CiudadSheetProps =
  | { modo: 'crear'; trigger: React.ReactElement }
  | { modo: 'editar'; ciudad: Ciudad; trigger: React.ReactElement }

function CiudadSheet(props: CiudadSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CiudadFormData>({
    resolver: zodResolver(ciudadSchema),
    defaultValues: {
      nombre: esEdicion ? props.ciudad.nombre : '',
      pais: esEdicion ? (props.ciudad.pais ?? '') : '',
    },
  })

  async function onSubmit(data: CiudadFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarCiudad(props.ciudad.id, data)
      : await crearCiudad(data)

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
          <SheetTitle>{esEdicion ? 'Editar Ciudad' : 'Nueva Ciudad'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos de la ciudad.'
              : 'Introduce los datos para crear una nueva ciudad.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Valencia, Madrid, Barcelona..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="pais">País *</Label>
            <Input
              id="pais"
              placeholder="Ej: España, México..."
              aria-invalid={!!errors.pais}
              {...register('pais')}
            />
            <FieldError message={errors.pais?.message} />
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Ciudad'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la página ──

type Props = {
  ciudades: Ciudad[]
}

export function CiudadesClient({ ciudades }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Ciudades</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ciudades donde trabajan o residen las personas del equipo
          </p>
        </div>
        <CiudadSheet
          modo="crear"
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nueva Ciudad
            </Button>
          }
        />
      </div>

      {/* Tabla */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        {ciudades.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aún no hay ciudades</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera ciudad usando el botón de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">País</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ciudades.map((ciudad) => (
                <TableRow key={ciudad.id}>
                  <TableCell className="font-medium">{ciudad.nombre}</TableCell>
                  <TableCell>{ciudad.pais}</TableCell>
                  <TableCell className="text-right">
                    <CiudadSheet
                      modo="editar"
                      ciudad={ciudad}
                      trigger={
                        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Editar">
                          <Pencil className="h-4 w-4 text-muted-foreground" />
                        </Button>
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
