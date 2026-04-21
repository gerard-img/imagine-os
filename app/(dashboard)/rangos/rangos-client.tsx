'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { RangoInterno, EmpresaGrupo } from '@/lib/supabase/types'
import { crearRango, actualizarRango } from './actions'
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

// ── Schema local ──

const rangoSchema = z.object({
  empresa_grupo_id: z.string().uuid('Selecciona una empresa'),
  nombre: z.string().min(1, 'El nombre es obligatorio').max(100, 'El nombre no puede superar los 100 caracteres'),
  codigo: z.string().min(1, 'El código es obligatorio').max(20, 'El código no puede superar los 20 caracteres'),
  orden: z.number().min(1, 'El orden debe ser al menos 1'),
})
type RangoFormData = z.infer<typeof rangoSchema>

// ── Helper de error de campo ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

// ── Sheet reutilizable (crear y editar) ──

type RangoSheetProps =
  | { modo: 'crear'; empresas: EmpresaGrupo[]; trigger: React.ReactElement }
  | { modo: 'editar'; rango: RangoInterno; empresas: EmpresaGrupo[]; trigger: React.ReactElement }

function RangoSheet(props: RangoSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RangoFormData>({
    resolver: zodResolver(rangoSchema),
    defaultValues: {
      empresa_grupo_id: esEdicion ? props.rango.empresa_grupo_id : '',
      nombre: esEdicion ? props.rango.nombre : '',
      codigo: esEdicion ? props.rango.codigo : '',
      orden: esEdicion ? ((props.rango as any).orden ?? 1) : 1,
    },
  })

  async function onSubmit(data: RangoFormData) {
    setSubmitting(true)
    setServerError('')

    const result = esEdicion
      ? await actualizarRango(props.rango.id, data)
      : await crearRango(data)

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
          <SheetTitle>{esEdicion ? 'Editar Rango' : 'Nuevo Rango'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica los datos del rango interno.'
              : 'Introduce los datos para crear un nuevo rango interno.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">
          {/* Empresa */}
          <div className="space-y-1.5">
            <Label htmlFor="empresa_grupo_id">Empresa *</Label>
            {esEdicion ? (
              <>
                {/* En edición, la empresa no se puede cambiar. Los <select disabled>
                    de RHF se envían como undefined y rompen la validación. */}
                <p className="flex h-8 items-center rounded-lg border border-input bg-muted/30 px-2.5 text-sm text-muted-foreground">
                  {(() => {
                    const e = props.empresas.find((x) => x.id === props.rango.empresa_grupo_id)
                    return e ? `${e.codigo} — ${e.nombre}` : '—'
                  })()}
                </p>
                <input type="hidden" {...register('empresa_grupo_id')} />
              </>
            ) : (
              <select
                id="empresa_grupo_id"
                aria-invalid={!!errors.empresa_grupo_id}
                {...register('empresa_grupo_id')}
                className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20"
              >
                <option value="">Selecciona una empresa</option>
                {props.empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.codigo} — {e.nombre}</option>
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
              placeholder="Ej: Senior, Specialist..."
              aria-invalid={!!errors.nombre}
              {...register('nombre')}
            />
            <FieldError message={errors.nombre?.message} />
          </div>

          {/* Código */}
          <div className="space-y-1.5">
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              placeholder="Ej: SR, SPEC..."
              aria-invalid={!!errors.codigo}
              {...register('codigo')}
            />
            <FieldError message={errors.codigo?.message} />
          </div>

          {/* Orden */}
          <div className="space-y-1.5">
            <Label htmlFor="orden">Orden *</Label>
            <Input
              id="orden"
              type="number"
              placeholder="Ej: 1, 2, 3..."
              aria-invalid={!!errors.orden}
              {...register('orden', { valueAsNumber: true })}
            />
            <FieldError message={errors.orden?.message} />
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear Rango'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal de la página ──

type Props = {
  rangos: RangoInterno[]
  empresas: EmpresaGrupo[]
}

export function RangosClient({ rangos, empresas }: Props) {
  const [empresaFilter, setEmpresaFilter] = useState('Todos')

  const egMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const empresaOptions = useMemo(() => {
    const codes = empresas.map((e) => e.codigo)
    return ['Todos', ...codes]
  }, [empresas])

  const filtered = rangos.filter((r) => {
    if (empresaFilter === 'Todos') return true
    return egMap.get(r.empresa_grupo_id)?.codigo === empresaFilter
  })

  // Ordenar por empresa y luego por orden ascendente
  const sorted = [...filtered].sort((a, b) => {
    const empA = egMap.get(a.empresa_grupo_id)?.codigo ?? ''
    const empB = egMap.get(b.empresa_grupo_id)?.codigo ?? ''
    if (empA !== empB) return empA.localeCompare(empB)
    return ((a as any).orden ?? 0) - ((b as any).orden ?? 0)
  })

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Rangos Internos</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Niveles jerárquicos por empresa (Socio, Director, Senior, Specialist...)
          </p>
        </div>
        <RangoSheet
          modo="crear"
          empresas={empresas}
          trigger={
            <Button size="default" className="gap-1.5 shrink-0">
              <Plus className="h-4 w-4" />
              Nuevo Rango
            </Button>
          }
        />
      </div>

      {/* Filter pills */}
      <div className="mt-5 flex items-center gap-1.5">
        {empresaOptions.map((option) => {
          const isActive = empresaFilter === option
          return (
            <button
              key={option}
              onClick={() => setEmpresaFilter(option)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {option}
            </button>
          )
        })}
      </div>

      {/* Tabla */}
      <div className="mt-4 rounded-xl bg-white shadow-sm">
        {sorted.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-foreground">Aún no hay rangos internos</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Crea el primer rango usando el botón de arriba.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Orden</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-20 text-right">
                  Acciones
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((rango) => (
                <TableRow key={rango.id}>
                  <TableCell className="font-medium">
                    {egMap.get(rango.empresa_grupo_id)?.codigo ?? '—'}
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {(rango as any).orden ?? '—'}
                  </TableCell>
                  <TableCell>{rango.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{rango.codigo}</TableCell>
                  <TableCell className="text-right">
                    <RangoSheet
                      modo="editar"
                      rango={rango}
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
