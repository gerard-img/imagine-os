'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Departamento, EmpresaGrupo } from '@/lib/supabase/types'
import { crearDepartamento, actualizarDepartamento } from './actions'
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

// -- Schema local --

const departamentoSchema = z.object({
  empresa_grupo_id: z.string().uuid('Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  codigo: z.string().min(1, 'El codigo es obligatorio').max(20, 'El codigo no puede superar los 20 caracteres'),
  descripcion: z.string().max(500, 'La descripcion no puede superar los 500 caracteres').optional(),
})
type DepartamentoFormData = z.infer<typeof departamentoSchema>

// -- Helper de error de campo --

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// -- Sheet reutilizable (crear y editar) --

type DepartamentoSheetProps =
  | { modo: 'crear'; empresas: EmpresaGrupo[]; trigger: React.ReactElement }
  | { modo: 'editar'; departamento: Departamento; empresas: EmpresaGrupo[]; trigger: React.ReactElement }

function DepartamentoSheet(props: DepartamentoSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DepartamentoFormData>({
    resolver: zodResolver(departamentoSchema),
    defaultValues: {
      empresa_grupo_id: esEdicion ? props.departamento.empresa_grupo_id : (props.empresas.length === 1 ? props.empresas[0].id : ''),
      nombre: esEdicion ? props.departamento.nombre : '',
      codigo: esEdicion ? props.departamento.codigo : '',
      descripcion: esEdicion ? (props.departamento.descripcion ?? '') : '',
    },
  })

  async function onSubmit(data: DepartamentoFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarDepartamento(props.departamento.id, data)
      : await crearDepartamento(data)

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
          <SheetTitle>{esEdicion ? 'Editar Departamento' : 'Nuevo Departamento'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos del departamento.'
              : 'Introduce los datos para crear un nuevo departamento.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          {/* Empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="empresa_grupo_id">Empresa *</Label>
            {esEdicion ? (
              <>
                {/* En edición, la empresa no se puede cambiar. Se muestra como texto
                    y se mantiene el valor en un input hidden (los <select disabled> de
                    RHF se envían como undefined y rompen la validación). */}
                <p className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                  {props.empresas.find((e) => e.id === props.departamento.empresa_grupo_id)?.nombre ?? '—'}
                </p>
                <input
                  type="hidden"
                  defaultValue={props.departamento.empresa_grupo_id}
                  {...register('empresa_grupo_id')}
                />
              </>
            ) : (
              <select
                id="empresa_grupo_id"
                aria-invalid={!!errors.empresa_grupo_id}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                {...register('empresa_grupo_id')}
              >
                <option value="">Selecciona una empresa</option>
                {props.empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.nombre}</option>
                ))}
              </select>
            )}
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          {/* Nombre */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Ej: Paid Media, SEO GEO..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          {/* Codigo */}
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Codigo *</Label>
            <Input
              id="codigo"
              placeholder="Ej: PPC, SEO..."
              aria-invalid={!!errors.codigo}
              {...register('codigo')}
            />
            <FieldError message={errors.codigo?.message} />
          </div>

          {/* Descripcion */}
          <div className="space-y-1.5">
            <Label htmlFor="descripcion">Descripcion</Label>
            <Textarea
              id="descripcion"
              placeholder="Descripcion del departamento..."
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Departamento'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// -- Componente principal de la pagina --

type Props = {
  departamentos: Departamento[]
  empresas: EmpresaGrupo[]
}

export function DepartamentosClient({ departamentos, empresas }: Props) {
  const [filtroEmpresa, setFiltroEmpresa] = useState<string | null>(null)

  const egMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const departamentosFiltrados = useMemo(() => {
    if (!filtroEmpresa) return departamentos
    return departamentos.filter((d) => d.empresa_grupo_id === filtroEmpresa)
  }, [departamentos, filtroEmpresa])

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Departamentos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Departamentos organizativos por empresa del grupo
          </p>
        </div>
        <DepartamentoSheet
          modo="crear"
          empresas={empresas}
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo Departamento
            </Button>
          }
        />
      </div>

      {/* Filter pills */}
      <div className="mt-5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setFiltroEmpresa(null)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
            filtroEmpresa === null
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground'
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
              filtroEmpresa === e.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            {e.codigo}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="mt-6 rounded-xl bg-white shadow-sm">
        {departamentosFiltrados.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aun no hay departamentos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer departamento usando el boton de arriba.
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
              {departamentosFiltrados.map((dep) => (
                <TableRow key={dep.id}>
                  <TableCell className="font-medium">
                    {egMap.get(dep.empresa_grupo_id)?.nombre ?? '-'}
                  </TableCell>
                  <TableCell>{dep.nombre}</TableCell>
                  <TableCell className="font-medium">{dep.codigo}</TableCell>
                  <TableCell className="text-muted-foreground">{dep.descripcion ?? '-'}</TableCell>
                  <TableCell className="text-right">
                    <DepartamentoSheet
                      modo="editar"
                      departamento={dep}
                      empresas={empresas}
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
