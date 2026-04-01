'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { HorasTrabajables, EmpresaGrupo, Departamento, Persona } from '@/lib/supabase/types'
import { crearHorasTrabajables, actualizarHorasTrabajables } from './actions'
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
import { KpiCard } from '@/components/kpi-card'
import { FilterPills } from '@/components/filter-pills'
import { MonthNavigator } from '@/components/month-navigator'
import { Plus, Pencil, Loader2 } from 'lucide-react'

// ── Schema local ──

const horasSchema = z.object({
  empresa_grupo_id: z.string().min(1, 'Selecciona una empresa'),
  mes_trabajo: z.string().min(1, 'El mes es obligatorio'),
  horas: z.number().min(0, 'Las horas deben ser >= 0').max(744, 'Máximo 744h'),
  departamento_id: z.string().optional(),
  persona_id: z.string().optional(),
  comentarios: z.string().optional(),
})
type HorasFormData = z.infer<typeof horasSchema>

// ── Helpers ──

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function OverrideBadge({ row }: { row: { departamento_id: string | null; persona_id: string | null } }) {
  if (row.persona_id)
    return (
      <span className="inline-flex rounded-full bg-purple-50 px-2.5 py-0.5 text-[11px] font-semibold text-purple-700">
        Persona
      </span>
    )
  if (row.departamento_id)
    return (
      <span className="inline-flex rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
        Departamento
      </span>
    )
  return (
    <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-gray-700">
      General
    </span>
  )
}

// ── Sheet reutilizable ──

type HorasSheetProps = {
  empresas: EmpresaGrupo[]
  departamentos: Departamento[]
  personas: Persona[]
  defaultMonth: string
} & (
  | { modo: 'crear'; trigger: React.ReactElement }
  | { modo: 'editar'; registro: HorasTrabajables; trigger: React.ReactElement }
)

function HorasSheet(props: HorasSheetProps) {
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const esEdicion = props.modo === 'editar'

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<HorasFormData>({
    resolver: zodResolver(horasSchema),
    defaultValues: {
      empresa_grupo_id: esEdicion ? props.registro.empresa_grupo_id : '',
      mes_trabajo: esEdicion ? props.registro.mes_trabajo : props.defaultMonth,
      horas: esEdicion ? props.registro.horas : 0,
      departamento_id: esEdicion ? (props.registro.departamento_id ?? '') : '',
      persona_id: esEdicion ? (props.registro.persona_id ?? '') : '',
      comentarios: esEdicion ? (props.registro.comentarios ?? '') : '',
    },
  })

  const selectedEmpresa = watch('empresa_grupo_id')

  const deptsFiltrados = props.departamentos.filter(
    (d) => !selectedEmpresa || d.empresa_grupo_id === selectedEmpresa
  )
  const personasFiltradas = props.personas
    .filter((p) => !selectedEmpresa || p.empresa_grupo_id === selectedEmpresa)
    .sort((a, b) => a.persona.localeCompare(b.persona))

  async function onSubmit(data: HorasFormData) {
    setSubmitting(true)
    setServerError('')

    // DEBUG: ver qué valores envía el formulario
    console.log('FORM DATA:', JSON.stringify(data, null, 2))

    const result = esEdicion
      ? await actualizarHorasTrabajables(props.registro.id, data)
      : await crearHorasTrabajables(data)

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
    if (next) {
      // Reset form al abrir para sincronizar select nativo con react-hook-form
      reset({
        empresa_grupo_id: esEdicion ? props.registro.empresa_grupo_id : '',
        mes_trabajo: esEdicion ? props.registro.mes_trabajo : props.defaultMonth,
        horas: esEdicion ? props.registro.horas : 0,
        departamento_id: esEdicion ? (props.registro.departamento_id ?? '') : '',
        persona_id: esEdicion ? (props.registro.persona_id ?? '') : '',
        comentarios: esEdicion ? (props.registro.comentarios ?? '') : '',
      })
      setServerError('')
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={props.trigger} />

      <SheetContent side="right" className="w-[440px]">
        <SheetHeader>
          <SheetTitle>{esEdicion ? 'Editar Horas' : 'Nuevas Horas Trabajables'}</SheetTitle>
          <SheetDescription>
            {esEdicion
              ? 'Modifica el registro de horas trabajables.'
              : 'Define las horas trabajables para un mes, empresa y opcionalmente un departamento o persona.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 px-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="empresa_grupo_id">Empresa *</Label>
              <select
                id="empresa_grupo_id"
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                value={watch('empresa_grupo_id')}
                onChange={(e) => setValue('empresa_grupo_id', e.target.value, { shouldValidate: true })}
              >
                <option value="">Seleccionar...</option>
                {props.empresas.map((eg) => (
                  <option key={eg.id} value={eg.id}>{eg.codigo}</option>
                ))}
              </select>
              <FieldError message={errors.empresa_grupo_id?.message} />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mes_trabajo">Mes *</Label>
              <Input id="mes_trabajo" type="date" {...register('mes_trabajo')} />
              <FieldError message={errors.mes_trabajo?.message} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="horas">Horas *</Label>
            <Input id="horas" type="number" step="0.5" placeholder="Ej: 168" {...register('horas', { valueAsNumber: true })} />
            <FieldError message={errors.horas?.message} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="departamento_id">Departamento (opcional)</Label>
            <select
              id="departamento_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={watch('departamento_id') ?? ''}
              onChange={(e) => setValue('departamento_id', e.target.value)}
            >
              <option value="">— General (sin departamento) —</option>
              {deptsFiltrados.map((d) => (
                <option key={d.id} value={d.id}>{d.nombre} ({d.codigo})</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="persona_id">Persona (opcional)</Label>
            <select
              id="persona_id"
              className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
              value={watch('persona_id') ?? ''}
              onChange={(e) => setValue('persona_id', e.target.value)}
            >
              <option value="">— Sin persona —</option>
              {personasFiltradas.map((p) => (
                <option key={p.id} value={p.id}>{p.persona}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comentarios">Comentarios</Label>
            <Textarea id="comentarios" placeholder="Notas opcionales..." {...register('comentarios')} />
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
              {submitting ? 'Guardando...' : esEdicion ? 'Guardar cambios' : 'Crear'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

// ── Componente principal ──

type Props = {
  horasTrabajables: HorasTrabajables[]
  empresasGrupo: EmpresaGrupo[]
  departamentos: Departamento[]
  personas: Persona[]
}

export function HorasTrabajablesClient({ horasTrabajables, empresasGrupo, departamentos, personas }: Props) {
  const availableMonths = useMemo(() => {
    const months = [...new Set(horasTrabajables.map((h) => h.mes_trabajo))].sort()
    return months.length > 0 ? months : ['2026-01-01']
  }, [horasTrabajables])

  const [month, setMonth] = useState(availableMonths[0])
  const [empresaFilter, setEmpresaFilter] = useState('Todos')

  const egMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])

  const empresaOptions = useMemo(() => {
    const names = empresasGrupo.map((eg) => eg.codigo)
    return ['Todos', ...names]
  }, [empresasGrupo])

  const filtered = horasTrabajables.filter((h) => {
    const matchesMonth = h.mes_trabajo === month
    const matchesEmpresa =
      empresaFilter === 'Todos' || egMap.get(h.empresa_grupo_id)?.codigo === empresaFilter
    return matchesMonth && matchesEmpresa
  })

  const totalHoras = filtered.reduce((sum, h) => sum + h.horas, 0)
  const overridesPersona = filtered.filter((h) => h.persona_id).length
  const overridesDepto = filtered.filter((h) => h.departamento_id && !h.persona_id).length

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Horas Trabajables</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Horas disponibles por mes, empresa y overrides
          </p>
        </div>
        <div className="flex items-center gap-3">
          <MonthNavigator value={month} onChange={setMonth} />
          <HorasSheet
            modo="crear"
            empresas={empresasGrupo}
            departamentos={departamentos}
            personas={personas}
            defaultMonth={month}
            trigger={
              <Button size="default" className="gap-1.5 shrink-0">
                <Plus className="h-4 w-4" />
                Nuevo
              </Button>
            }
          />
        </div>
      </div>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Total horas" value={`${totalHoras}h`} borderColor="border-t-primary" />
        <KpiCard label="Overrides persona" value={overridesPersona} borderColor="border-t-purple-500" />
        <KpiCard label="Overrides departamento" value={overridesDepto} borderColor="border-t-blue-500" />
      </div>

      <div className="mt-5">
        <FilterPills options={empresaOptions} active={empresaFilter} onChange={setEmpresaFilter} />
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm font-medium text-foreground">No hay registros para este mes</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Usa el botón &quot;Nuevo&quot; para añadir horas trabajables.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Horas</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Tipo</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Departamento</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Persona</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Comentarios</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground w-16 text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((h) => (
                <TableRow key={h.id}>
                  <TableCell className="font-medium">{egMap.get(h.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-right font-medium text-primary">{h.horas}h</TableCell>
                  <TableCell><OverrideBadge row={h} /></TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.departamento_id ? deptMap.get(h.departamento_id)?.nombre ?? '—' : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {h.persona_id ? personaMap.get(h.persona_id)?.persona ?? '—' : '—'}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{h.comentarios ?? '—'}</TableCell>
                  <TableCell className="text-right">
                    <HorasSheet
                      modo="editar"
                      registro={h}
                      empresas={empresasGrupo}
                      departamentos={departamentos}
                      personas={personas}
                      defaultMonth={month}
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
