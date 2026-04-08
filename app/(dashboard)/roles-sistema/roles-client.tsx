'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Rol } from '@/lib/supabase/types'
import { crearRol, actualizarRol } from './actions'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Plus, Pencil, Loader2 } from 'lucide-react'

// ── Schema local ──

const rolSchema = z.object({
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  descripcion: z.string().max(500, 'La descripción no puede superar los 500 caracteres').optional(),
})
type RolFormData = z.infer<typeof rolSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type RolSheetProps =
  | { modo: 'crear'; trigger: React.ReactElement }
  | { modo: 'editar'; rol: Rol; trigger: React.ReactElement }

function RolSheet(props: RolSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RolFormData>({
    resolver: zodResolver(rolSchema),
    defaultValues: {
      nombre: esEdicion ? props.rol.nombre : '',
      descripcion: esEdicion ? (props.rol.descripcion ?? '') : '',
    },
  })

  async function onSubmit(data: RolFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarRol(props.rol.id, data)
      : await crearRol(data)

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
          <SheetTitle>{esEdicion ? 'Editar Rol' : 'Nuevo Rol'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos del rol.'
              : 'Introduce los datos para crear un nuevo rol.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Administrador, Director..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del rol..."
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Rol'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la página ──

type Props = {
  roles: Rol[]
}

export function RolesClient({ roles }: Props) {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Roles del Sistema</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Roles de acceso a la aplicación (Fundador, Administrador, Socio, Director, etc.)
          </p>
        </div>
        <RolSheet
          modo="crear"
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo Rol
            </Button>
          }
        />
      </div>

      {/* Tabla */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        {roles.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aún no hay roles</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer rol usando el botón de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Nivel acceso</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((rol) => (
                <TableRow key={rol.id}>
                  <TableCell className="font-medium">{rol.nombre}</TableCell>
                  <TableCell>
                    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                      rol.nivel_acceso === 'global' ? 'bg-emerald-50 text-emerald-700' :
                      rol.nivel_acceso === 'empresa' ? 'bg-blue-50 text-blue-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {rol.nivel_acceso}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{rol.descripcion ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <RolSheet
                      modo="editar"
                      rol={rol}
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
