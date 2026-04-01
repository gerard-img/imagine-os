'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Oficina } from '@/lib/supabase/types'
import { crearOficina, actualizarOficina } from './actions'
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

// ── Schema local (solo el campo nombre) ──

const oficinaSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
})
type OficinaFormData = z.infer<typeof oficinaSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type OficinaSheetProps =
  | { modo: 'crear'; trigger: React.ReactElement }
  | { modo: 'editar'; oficina: Oficina; trigger: React.ReactElement }

function OficinaSheet(props: OficinaSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<OficinaFormData>({
    resolver: zodResolver(oficinaSchema),
    defaultValues: {
      nombre: esEdicion ? props.oficina.nombre : '',
    },
  })

  async function onSubmit(data: OficinaFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarOficina(props.oficina.id, data)
      : await crearOficina(data)

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
          <SheetTitle>{esEdicion ? 'Editar Oficina' : 'Nueva Oficina'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica el nombre de la oficina.'
              : 'Introduce el nombre para crear una nueva oficina.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Madrid, Barcelona, Remoto..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Oficina'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la página ──

type Props = {
  oficinas: Oficina[]
}

export function OficinasClient({ oficinas }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Oficinas</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ubicaciones físicas o virtuales donde trabajan las personas del equipo
          </p>
        </div>
        <OficinaSheet
          modo="crear"
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nueva Oficina
            </Button>
          }
        />
      </div>

      {/* Tabla */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        {oficinas.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aún no hay oficinas</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera oficina usando el botón de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {oficinas.map((oficina) => (
                <TableRow key={oficina.id}>
                  <TableCell className="font-medium">{oficina.nombre}</TableCell>
                  <TableCell className="text-right">
                    <OficinaSheet
                      modo="editar"
                      oficina={oficina}
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
