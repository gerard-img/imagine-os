'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Puesto, EmpresaGrupo } from '@/lib/supabase/types'
import { crearPuesto, actualizarPuesto } from './actions'
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

const puestoSchema = z.object({
  empresa_grupo_id: z.string().min(1, 'La empresa es obligatoria'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(200, 'El nombre no puede superar los 200 caracteres'),
  descripcion: z.string().max(500).optional(),
})
type PuestoFormData = z.infer<typeof puestoSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type PuestoSheetProps =
  | { modo: 'crear'; empresas: EmpresaGrupo[]; trigger: React.ReactElement }
  | { modo: 'editar'; puesto: Puesto; empresas: EmpresaGrupo[]; trigger: React.ReactElement }

function PuestoSheet(props: PuestoSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PuestoFormData>({
    resolver: zodResolver(puestoSchema),
    defaultValues: {
      empresa_grupo_id: esEdicion ? props.puesto.empresa_grupo_id : '',
      nombre: esEdicion ? props.puesto.nombre : '',
      descripcion: esEdicion ? (props.puesto.descripcion ?? '') : '',
    },
  })

  async function onSubmit(data: PuestoFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarPuesto(props.puesto.id, data)
      : await crearPuesto(data)

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
          <SheetTitle>{esEdicion ? 'Editar Puesto' : 'Nuevo Puesto'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos del puesto.'
              : 'Introduce los datos para crear un nuevo puesto.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          <div className="space-y-1.5">
            <Label htmlFor="empresa_grupo_id">Empresa *</Label>
            <select
              id="empresa_grupo_id"
              disabled={esEdicion}
              aria-invalid={!!errors.empresa_grupo_id}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 disabled:cursor-not-allowed aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              {...register('empresa_grupo_id')}
            >
              <option value="">Selecciona una empresa</option>
              {props.empresas.map((eg) => (
                <option key={eg.id} value={eg.id}>{eg.nombre} ({eg.codigo})</option>
              ))}
            </select>
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Senior Technical Consultant"
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripción</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripción del puesto..."
              {...register('descripcion')}
            />
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Puesto'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la pagina ──

type Props = {
  puestos: Puesto[]
  empresas: EmpresaGrupo[]
}

export function PuestosClient({ puestos, empresas }: Props) {
  const [filtroEmpresa, setFiltroEmpresa] = useState<string | null>(null)

  const egMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const filtered = puestos.filter((p) => {
    if (!filtroEmpresa) return true
    return p.empresa_grupo_id === filtroEmpresa
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Puestos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Cargos y posiciones por empresa del grupo
          </p>
        </div>
        <PuestoSheet
          modo="crear"
          empresas={empresas}
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo Puesto
            </Button>
          }
        />
      </div>

      {/* Filter pills */}
      <div className="mt-5 flex items-center gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setFiltroEmpresa(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            !filtroEmpresa ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
          }`}
        >
          Todas
        </button>
        {empresas.map((e) => (
          <button
            key={e.id}
            type="button"
            onClick={() => setFiltroEmpresa(e.id)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filtroEmpresa === e.id ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {e.codigo}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-4 rounded-xl bg-white shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aun no hay puestos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer puesto usando el boton de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Codigo</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((puesto) => {
                const empresa = egMap.get(puesto.empresa_grupo_id)
                return (
                  <TableRow key={puesto.id}>
                    <TableCell className="font-medium">{empresa?.nombre ?? '—'}</TableCell>
                    <TableCell className="font-medium">{puesto.nombre}</TableCell>
                    <TableCell>{puesto.codigo}</TableCell>
                    <TableCell className="text-muted-foreground">{puesto.descripcion ?? '—'}</TableCell>
                    <TableCell className="text-right">
                      <PuestoSheet
                        modo="editar"
                        puesto={puesto}
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
