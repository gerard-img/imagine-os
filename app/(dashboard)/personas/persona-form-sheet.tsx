'use client'

import { useState, useMemo } from 'react'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personaSchema, type PersonaFormData, MODALIDADES_TRABAJO, NIVELES_INGLES } from '@/lib/schemas/persona'
import { crearPersona, actualizarPersona, crearPuestoRapido } from './actions'
import type {
  EmpresaGrupo, Rol, Division, Puesto, RangoInterno, Ciudad, Oficina, Persona,
  Departamento, PersonaDepartamento,
} from '@/lib/supabase/types'
import {
  Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetFooter,
} from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, Loader2, Pencil, Trash2 } from 'lucide-react'
import { SearchableSelect } from '@/components/ui/searchable-select'

function FieldError({ message }: { message?: string }) {
  if (!message) return null
  return <p className="text-xs text-destructive mt-1">{message}</p>
}

function NativeSelect({
  options, placeholder, value, onChange, error, disabled,
}: {
  options: { value: string; label: string }[]
  placeholder: string
  value: string
  onChange: (v: string) => void
  error?: boolean
  disabled?: boolean
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      aria-invalid={error}
      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive disabled:cursor-not-allowed disabled:opacity-50"
    >
      <option value="">{placeholder}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
  )
}

type Props = {
  empresasGrupo: EmpresaGrupo[]
  roles: Rol[]
  divisiones: Division[]
  puestos: Puesto[]
  rangos: RangoInterno[]
  ciudades: Ciudad[]
  oficinas: Oficina[]
  departamentos?: Departamento[]
  personasDepts?: PersonaDepartamento[]
  persona?: Persona
  trigger?: React.ReactElement
}

export function PersonaFormSheet({
  empresasGrupo, roles, divisiones, puestos, rangos, ciudades, oficinas,
  departamentos = [], personasDepts = [],
  persona, trigger,
}: Props) {
  const isEditMode = !!persona
  const [open, setOpen] = useState(false)
  const [serverError, setServerError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [creandoPuesto, setCreandoPuesto] = useState(false)
  const [nuevoPuestoNombre, setNuevoPuestoNombre] = useState('')
  const [puestoError, setPuestoError] = useState('')
  const [puestosLocales, setPuestosLocales] = useState<Puesto[]>([])

  const currentDepts = isEditMode
    ? personasDepts
        .filter((pd) => pd.persona_id === persona.id)
        .map((pd) => ({ departamento_id: pd.departamento_id, porcentaje_tiempo: pd.porcentaje_tiempo }))
    : []

  const createDefaults: PersonaFormData = {
    nombre: '', apellido_primero: '', apellido_segundo: '', nombre_interno: '', dni: '',
    empresa_grupo_id: '', rol_id: '', division_id: '', puesto_id: '',
    rango_id: '', ciudad_id: '', oficina_id: '', fecha_incorporacion: '',
    email_corporativo: '', email_personal: '', telefono: '', modalidad_trabajo: '',
    departamentos: [],
    fecha_baja: '', activo: true, linkedin_url: '', fecha_nacimiento: '',
    nivel_ingles: '', skills_tags: '', foto_url: '',
  }

  const {
    register, handleSubmit, watch, setValue, reset, control, formState: { errors },
  } = useForm<PersonaFormData>({
    resolver: zodResolver(personaSchema),
    defaultValues: isEditMode ? {
      nombre: persona.nombre,
      apellido_primero: persona.apellido_primero,
      apellido_segundo: persona.apellido_segundo ?? '',
      nombre_interno: persona.persona ?? '',
      dni: persona.dni,
      empresa_grupo_id: persona.empresa_grupo_id,
      rol_id: persona.rol_id,
      division_id: persona.division_id,
      puesto_id: persona.puesto_id ?? '',
      rango_id: persona.rango_id ?? '',
      ciudad_id: persona.ciudad_id,
      oficina_id: persona.oficina_id ?? '',
      fecha_incorporacion: persona.fecha_incorporacion ?? '',
      email_corporativo: persona.email_corporativo ?? '',
      email_personal: persona.email_personal ?? '',
      telefono: persona.telefono ?? '',
      modalidad_trabajo: persona.modalidad_trabajo ?? '',
      departamentos: currentDepts,
      fecha_baja: persona.fecha_baja ?? '',
      activo: persona.activo,
      linkedin_url: persona.linkedin_url ?? '',
      fecha_nacimiento: persona.fecha_nacimiento ?? '',
      nivel_ingles: persona.nivel_ingles ?? '',
      skills_tags: persona.skills_tags?.join(', ') ?? '',
      foto_url: persona.foto_url ?? '',
    } : createDefaults,
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'departamentos' })

  const egId = watch('empresa_grupo_id')
  const deptEntries = watch('departamentos')

  const todosPuestos = useMemo(() => [...puestos, ...puestosLocales], [puestos, puestosLocales])
  const puestosFiltrados = useMemo(
    () => egId ? todosPuestos.filter((p) => p.empresa_grupo_id === egId) : todosPuestos,
    [todosPuestos, egId]
  )
  const rangosFiltrados = useMemo(
    () => egId ? rangos.filter((r) => r.empresa_grupo_id === egId) : rangos,
    [rangos, egId]
  )
  const deptsFiltrados = useMemo(
    () => egId ? departamentos.filter((d) => d.empresa_grupo_id === egId) : departamentos,
    [departamentos, egId]
  )

  const deptTotal = deptEntries.reduce((sum, e) => sum + (e.porcentaje_tiempo || 0), 0)
  const deptTotalOk = Math.abs(deptTotal - 100) <= 0.01

  function addDept() {
    const usedIds = new Set(deptEntries.map((e) => e.departamento_id))
    const available = deptsFiltrados.find((d) => !usedIds.has(d.id))
    if (!available) return
    append({ departamento_id: available.id, porcentaje_tiempo: 0 })
  }

  async function onSubmit(data: PersonaFormData) {
    if (data.departamentos.length > 0 && !deptTotalOk) {
      setServerError(`La suma de departamentos debe ser 100%. Actualmente: ${deptTotal}%`)
      return
    }
    setSubmitting(true)
    setServerError('')
    const result = isEditMode
      ? await actualizarPersona(persona!.id, data)
      : await crearPersona(data)
    if (result.success) {
      if (!isEditMode) reset(createDefaults)
      setOpen(false)
    } else {
      setServerError(result.error ?? 'Error desconocido')
    }
    setSubmitting(false)
  }

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) {
      if (!isEditMode) reset(createDefaults)
      setServerError('')
    }
  }

  const defaultTrigger = isEditMode ? (
    <Button variant="outline" size="sm" className="gap-1.5">
      <Pencil className="h-3.5 w-3.5" />
      Editar
    </Button>
  ) : (
    <Button size="default" className="gap-1.5 shrink-0">
      <Plus className="h-4 w-4" />
      Nuevo Miembro
    </Button>
  )

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger render={trigger ?? defaultTrigger} />

      <SheetContent side="right" className="w-[500px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEditMode ? 'Editar Miembro' : 'Nuevo Miembro'}</SheetTitle>
          <SheetDescription>
            {isEditMode ? 'Modifica los datos de esta persona.' : 'Rellena los datos para añadir una persona al equipo.'}
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 px-6 py-4">

          {/* Nombre + Primer Apellido */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="nombre">Nombre *</Label>
              <Input id="nombre" placeholder="Ej: María" aria-invalid={!!errors.nombre} {...register('nombre')} />
              <FieldError message={errors.nombre?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="apellido_primero">Primer apellido *</Label>
              <Input id="apellido_primero" placeholder="Ej: García" aria-invalid={!!errors.apellido_primero} {...register('apellido_primero')} />
              <FieldError message={errors.apellido_primero?.message} />
            </div>
          </div>

          {/* Segundo Apellido + DNI */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="apellido_segundo">Segundo apellido</Label>
              <Input id="apellido_segundo" placeholder="Opcional" {...register('apellido_segundo')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="dni">DNI *</Label>
              <Input id="dni" placeholder="12345678A" aria-invalid={!!errors.dni} {...register('dni')} />
              <FieldError message={errors.dni?.message} />
            </div>
          </div>

          {/* Nombre interno */}
          <div className="space-y-1.5">
            <Label htmlFor="nombre_interno">Nombre interno</Label>
            <Input
              id="nombre_interno"
              placeholder="Se genera automáticamente si lo dejas vacío"
              {...register('nombre_interno')}
            />
            <p className="text-[11px] text-muted-foreground">
              El nombre que aparece en listados y asignaciones. Por defecto: nombre + apellidos.
            </p>
          </div>

          {/* Empresa Grupo */}
          <div className="space-y-1.5">
            <Label>Empresa grupo *</Label>
            <SearchableSelect
              options={empresasGrupo.map((eg) => ({ value: eg.id, label: `${eg.codigo} — ${eg.nombre}` }))}
              placeholder="Seleccionar empresa grupo..."
              value={egId}
              onChange={(v) => {
                setValue('empresa_grupo_id', v, { shouldValidate: true })
                setValue('puesto_id', '')
                setValue('rango_id', '')
              }}
              error={!!errors.empresa_grupo_id}
            />
            <FieldError message={errors.empresa_grupo_id?.message} />
          </div>

          {/* Rol + División */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Rol *</Label>
              <SearchableSelect
                options={(() => {
                  const ORDEN_ROLES = ['Miembro', 'Responsable', 'Coordinador', 'Intern', 'Externo', 'Implant', 'Director', 'Administrador', 'Socio', 'Fundador']
                  return [...roles]
                    .sort((a, b) => {
                      const ia = ORDEN_ROLES.indexOf(a.nombre)
                      const ib = ORDEN_ROLES.indexOf(b.nombre)
                      return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
                    })
                    .map((r) => ({ value: r.id, label: r.nombre }))
                })()}
                placeholder="Seleccionar..."
                value={watch('rol_id')}
                onChange={(v) => setValue('rol_id', v, { shouldValidate: true })}
                error={!!errors.rol_id}
              />
              <FieldError message={errors.rol_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>División *</Label>
              <SearchableSelect
                options={divisiones.map((d) => ({ value: d.id, label: d.nombre }))}
                placeholder="Seleccionar..."
                value={watch('division_id')}
                onChange={(v) => setValue('division_id', v, { shouldValidate: true })}
                error={!!errors.division_id}
              />
              <FieldError message={errors.division_id?.message} />
            </div>
          </div>

          {/* Puesto + Rango */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Puesto</Label>
                {egId && !creandoPuesto && (
                  <button
                    type="button"
                    onClick={() => { setCreandoPuesto(true); setPuestoError('') }}
                    className="text-[11px] font-medium text-primary hover:underline"
                  >
                    + Crear puesto
                  </button>
                )}
              </div>
              {creandoPuesto ? (
                <div className="flex gap-1.5">
                  <Input
                    value={nuevoPuestoNombre}
                    onChange={(e) => setNuevoPuestoNombre(e.target.value)}
                    placeholder="Nombre del puesto"
                    className="flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') { setCreandoPuesto(false); setNuevoPuestoNombre('') }
                    }}
                  />
                  <Button
                    type="button"
                    size="sm"
                    disabled={!nuevoPuestoNombre.trim()}
                    onClick={async () => {
                      setPuestoError('')
                      const res = await crearPuestoRapido(egId, nuevoPuestoNombre)
                      if (res.success && res.id) {
                        const nuevo: Puesto = {
                          id: res.id,
                          empresa_grupo_id: egId,
                          nombre: nuevoPuestoNombre.trim(),
                          codigo: nuevoPuestoNombre.trim().substring(0, 10).toUpperCase().replace(/\s+/g, '_'),
                          descripcion: null,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        }
                        setPuestosLocales((prev) => [...prev, nuevo])
                        setValue('puesto_id', res.id, { shouldValidate: true })
                        setCreandoPuesto(false)
                        setNuevoPuestoNombre('')
                      } else {
                        setPuestoError(res.error ?? 'Error al crear')
                      }
                    }}
                  >
                    Crear
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => { setCreandoPuesto(false); setNuevoPuestoNombre(''); setPuestoError('') }}
                  >
                    ✕
                  </Button>
                </div>
              ) : (
                <SearchableSelect
                  options={puestosFiltrados.map((p) => ({ value: p.id, label: p.nombre }))}
                  placeholder={egId ? 'Seleccionar...' : 'Elige empresa primero'}
                  value={watch('puesto_id')}
                  onChange={(v) => setValue('puesto_id', v, { shouldValidate: true })}
                  error={!!errors.puesto_id}
                  disabled={!egId}
                />
              )}
              {puestoError && <p className="text-xs text-destructive">{puestoError}</p>}
              <FieldError message={errors.puesto_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Rango *</Label>
              <SearchableSelect
                options={rangosFiltrados.map((r) => ({ value: r.id, label: r.nombre }))}
                placeholder={egId ? 'Seleccionar...' : 'Elige empresa primero'}
                value={watch('rango_id')}
                onChange={(v) => setValue('rango_id', v, { shouldValidate: true })}
                error={!!errors.rango_id}
                disabled={!egId}
              />
              <FieldError message={errors.rango_id?.message} />
            </div>
          </div>

          {/* Departamentos */}
          {egId && deptsFiltrados.length > 0 && (
            <div className="space-y-2">
              <Label>Departamentos</Label>
              {fields.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">
                  Sin departamentos asignados.
                </p>
              )}
              {fields.map((field, idx) => {
                const usedIds = new Set(deptEntries.filter((_, i) => i !== idx).map((e) => e.departamento_id))
                const availableForRow = deptsFiltrados.filter((d) => !usedIds.has(d.id))
                const deptNombre = departamentos.find((d) => d.id === deptEntries[idx]?.departamento_id)?.nombre ?? ''

                return (
                  <div key={field.id} className="flex items-center gap-2">
                    <select
                      value={deptEntries[idx]?.departamento_id ?? ''}
                      onChange={(e) => setValue(`departamentos.${idx}.departamento_id`, e.target.value)}
                      className="h-8 flex-1 rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm outline-none focus-visible:border-ring"
                    >
                      {deptEntries[idx]?.departamento_id && !availableForRow.find((d) => d.id === deptEntries[idx].departamento_id) && (
                        <option value={deptEntries[idx].departamento_id}>{deptNombre}</option>
                      )}
                      {availableForRow.map((d) => (
                        <option key={d.id} value={d.id}>{d.nombre}</option>
                      ))}
                    </select>
                    <div className="relative w-20 shrink-0">
                      <Input
                        type="number"
                        min={0}
                        max={100}
                        step={1}
                        value={deptEntries[idx]?.porcentaje_tiempo ?? ''}
                        onChange={(e) => setValue(`departamentos.${idx}.porcentaje_tiempo`, parseFloat(e.target.value) || 0)}
                        className="h-8 pr-6 text-right text-sm"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none">%</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
              {deptsFiltrados.length > fields.length && (
                <button
                  type="button"
                  onClick={addDept}
                  className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-dashed border-border py-2 text-xs text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Añadir departamento
                </button>
              )}
              {fields.length > 0 && (
                <div className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${deptTotalOk ? 'bg-emerald-50' : 'bg-amber-50'}`}>
                  <span className={`font-medium ${deptTotalOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                    Total dedicación
                  </span>
                  <span className={`font-bold tabular-nums ${deptTotalOk ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {deptTotal}% {deptTotalOk ? '✓' : `— faltan ${100 - deptTotal}%`}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Ciudad + Oficina */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Ciudad *</Label>
              <SearchableSelect
                options={ciudades.map((c) => ({ value: c.id, label: c.nombre }))}
                placeholder="Seleccionar..."
                value={watch('ciudad_id')}
                onChange={(v) => setValue('ciudad_id', v, { shouldValidate: true })}
                error={!!errors.ciudad_id}
              />
              <FieldError message={errors.ciudad_id?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Oficina</Label>
              <SearchableSelect
                options={oficinas.map((o) => ({ value: o.id, label: o.nombre }))}
                placeholder="Sin oficina"
                value={watch('oficina_id')}
                onChange={(v) => setValue('oficina_id', v)}
              />
            </div>
          </div>

          {/* Fecha incorporación + Modalidad */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_incorporacion">Fecha incorporación *</Label>
              <Input
                id="fecha_incorporacion"
                type="date"
                aria-invalid={!!errors.fecha_incorporacion}
                {...register('fecha_incorporacion')}
              />
              <FieldError message={errors.fecha_incorporacion?.message} />
            </div>
            <div className="space-y-1.5">
              <Label>Modalidad</Label>
              <NativeSelect
                options={MODALIDADES_TRABAJO.map((m) => ({ value: m, label: m }))}
                placeholder="Sin especificar"
                value={watch('modalidad_trabajo')}
                onChange={(v) => setValue('modalidad_trabajo', v)}
              />
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-1.5">
            <Label htmlFor="email_corporativo">Email corporativo</Label>
            <Input id="email_corporativo" type="email" placeholder="nombre@empresa.com" {...register('email_corporativo')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="email_personal">Email personal</Label>
              <Input id="email_personal" type="email" placeholder="nombre@gmail.com" {...register('email_personal')} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input id="telefono" placeholder="+34 600 000 000" {...register('telefono')} />
            </div>
          </div>

          {/* Estado + Fecha baja */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Activo</Label>
              <NativeSelect
                options={[{ value: 'true', label: 'Sí' }, { value: 'false', label: 'No (Baja)' }]}
                placeholder=""
                value={watch('activo') ? 'true' : 'false'}
                onChange={(v) => setValue('activo', v === 'true')}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="fecha_baja">Fecha baja</Label>
              <Input id="fecha_baja" type="date" {...register('fecha_baja')} />
            </div>
          </div>

          {/* Fecha nacimiento + Nivel inglés */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="fecha_nacimiento">Fecha nacimiento</Label>
              <Input id="fecha_nacimiento" type="date" {...register('fecha_nacimiento')} />
            </div>
            <div className="space-y-1.5">
              <Label>Nivel inglés</Label>
              <NativeSelect
                options={NIVELES_INGLES.map((n) => ({ value: n, label: n }))}
                placeholder="Sin especificar"
                value={watch('nivel_ingles')}
                onChange={(v) => setValue('nivel_ingles', v)}
              />
            </div>
          </div>

          {/* LinkedIn + Foto URL */}
          <div className="space-y-1.5">
            <Label htmlFor="linkedin_url">LinkedIn URL</Label>
            <Input id="linkedin_url" placeholder="https://linkedin.com/in/..." {...register('linkedin_url')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="foto_url">URL foto</Label>
            <Input id="foto_url" placeholder="https://..." {...register('foto_url')} />
          </div>

          {/* Skills / Tags */}
          <div className="space-y-1.5">
            <Label htmlFor="skills_tags">Skills / Tags</Label>
            <Input id="skills_tags" placeholder="SEO, PPC, Diseño..." {...register('skills_tags')} />
            <p className="text-[11px] text-muted-foreground">Separar con comas</p>
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
              {submitting ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Crear Miembro'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
