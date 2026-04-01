'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Division } from '@/lib/supabase/types'
import { crearDivision, actualizarDivision } from './actions'
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

const divisionSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional().or(z.literal('')),
})
type DivisionFormData = z.infer<typeof divisionSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type DivisionSheetProps =
  | { modo: 'crear'; trigger: React.ReactElement }
  | { modo: 'editar'; division: Division; trigger: React.ReactElement }

function DivisionSheet(props: DivisionSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DivisionFormData>({
    resolver: zodResolver(divisionSchema),
    defaultValues: {
      nombre: esEdicion ? props.division.nombre : '',
      descripcion: esEdicion ? (props.division.descripcion ?? '') : '',
    },
  })

  async function onSubmit(data: DivisionFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarDivision(props.division.id, data)
      : await crearDivision(data)

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
          <SheetTitle>{esEdicion ? 'Editar Division' : 'Nueva Division'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos de la division.'
              : 'Introduce los datos para crear una nueva division.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: OPER, BDEV..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripcion breve..."
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Division'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la pagina ──

type Props = {
  divisiones: Division[]
}

export function DivisionesClient({ divisiones }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Divisiones</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Divisiones organizativas del grupo (BDEV, TALE, CONS, OPER, ADMI, DIRE)
          </p>
        </div>
        <DivisionSheet
          modo="crear"
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nueva Division
            </Button>
          }
        />
      </div>

      {/* Tabla */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        {divisiones.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aun no hay divisiones</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea la primera division usando el boton de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Descripcion</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {divisiones.map((division) => (
                <TableRow key={division.id}>
                  <TableCell className="font-medium">{division.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {division.descripcion ?? '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <DivisionSheet
                      modo="editar"
                      division={division}
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
