'use client'

import { useState, useMemo } from 'react'
import type { Persona, EmpresaGrupo, Rol, Departamento, Division, PersonaDepartamento } from '@/lib/supabase/types'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { FilterPills } from '@/components/filter-pills'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import {
  invitarUsuario,
  desactivarUsuario,
  reactivarUsuario,
  resetearPassword,
  eliminarCuentaAuth,
  cambiarRol,
} from './actions'
import { Send, Ban, RotateCcw, KeyRound, Trash2, Loader2, Check, AlertCircle } from 'lucide-react'

// ── Estado de acceso derivado ──

type EstadoAcceso = 'Sin cuenta' | 'Activo' | 'Desactivado'

function getEstadoAcceso(p: Persona): EstadoAcceso {
  if (!p.auth_user_id) return 'Sin cuenta'
  return p.activo ? 'Activo' : 'Desactivado'
}

const ESTADO_COLORS: Record<EstadoAcceso, string> = {
  'Activo': 'bg-emerald-50 text-emerald-700',
  'Sin cuenta': 'bg-gray-100 text-gray-600',
  'Desactivado': 'bg-red-50 text-red-700',
}

function EstadoBadge({ estado }: { estado: EstadoAcceso }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${ESTADO_COLORS[estado]}`}>
      {estado}
    </span>
  )
}

// ── Botón de acción con feedback ──

function ActionButton({
  icon: Icon,
  label,
  confirmLabel,
  onClick,
  variant = 'ghost',
}: {
  icon: typeof Send
  label: string
  confirmLabel?: string
  onClick: () => Promise<{ success: boolean; error?: string }>
  variant?: 'ghost' | 'outline'
}) {
  const [status, setStatus] = useState<'idle' | 'confirming' | 'loading' | 'done' | 'error'>('idle')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleClick() {
    if (confirmLabel && status === 'idle') {
      setStatus('confirming')
      setTimeout(() => setStatus((s) => s === 'confirming' ? 'idle' : s), 4000)
      return
    }
    setStatus('loading')
    setErrorMsg('')
    const result = await onClick()
    if (result.success) {
      setStatus('done')
      setTimeout(() => setStatus('idle'), 2000)
    } else {
      setErrorMsg(result.error ?? 'Error')
      setStatus('error')
      setTimeout(() => setStatus('idle'), 4000)
    }
  }

  const isConfirming = status === 'confirming'

  return (
    <div className="relative">
      <Button
        variant={variant}
        size="sm"
        className={`gap-1.5 text-xs ${isConfirming ? 'text-destructive' : ''}`}
        onClick={handleClick}
        disabled={status === 'loading'}
        title={isConfirming ? confirmLabel : label}
      >
        {status === 'loading' ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : status === 'done' ? (
          <Check className="h-3.5 w-3.5 text-emerald-600" />
        ) : status === 'error' ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Icon className="h-3.5 w-3.5" />
        )}
        {isConfirming ? confirmLabel : status === 'done' ? 'Hecho' : status === 'error' ? errorMsg : label}
      </Button>
    </div>
  )
}

// ── Selector de rol inline ──

function RolSelect({ persona, roles }: { persona: Persona; roles: Rol[] }) {
  const [loading, setLoading] = useState(false)

  async function handleChange(rolId: string) {
    if (rolId === persona.rol_id) return
    setLoading(true)
    await cambiarRol(persona.id, rolId)
    setLoading(false)
  }

  return (
    <select
      value={persona.rol_id}
      onChange={(e) => handleChange(e.target.value)}
      disabled={loading}
      className="h-7 rounded-md border border-input bg-transparent px-2 text-xs outline-none focus:border-ring disabled:opacity-50"
    >
      {roles.map((r) => (
        <option key={r.id} value={r.id}>{r.nombre}</option>
      ))}
    </select>
  )
}

// ── Componente principal ──

type Props = {
  personas: Persona[]
  empresasGrupo: EmpresaGrupo[]
  roles: Rol[]
  departamentos: Departamento[]
  divisiones: Division[]
  personasDepartamentos: PersonaDepartamento[]
}

export default function UsuariosClient({ personas, empresasGrupo, roles, departamentos, divisiones, personasDepartamentos }: Props) {
  const [search, setSearch] = useState('')
  const [estadoFilter, setEstadoFilter] = useState('Todos')
  const [empresaFilter, setEmpresaFilter] = useState('Todos')
  const [rolFilter, setRolFilter] = useState('Todos')
  const [deptoFilter, setDeptoFilter] = useState('Todos')
  const [divisionFilter, setDivisionFilter] = useState('Todos')

  const egMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])
  const rolMap = useMemo(() => new Map(roles.map((r) => [r.id, r])), [roles])
  const deptoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const divisionMap = useMemo(() => new Map(divisiones.map((d) => [d.id, d])), [divisiones])

  // Mapa persona_id → departamento_ids (una persona puede estar en varios deptos)
  const personaDeptos = useMemo(() => {
    const map = new Map<string, string[]>()
    for (const pd of personasDepartamentos) {
      const arr = map.get(pd.persona_id) ?? []
      arr.push(pd.departamento_id)
      map.set(pd.persona_id, arr)
    }
    return map
  }, [personasDepartamentos])

  const empresaOptions = useMemo(
    () => ['Todos', ...empresasGrupo.map((eg) => eg.codigo)],
    [empresasGrupo]
  )
  const rolOptions = useMemo(
    () => ['Todos', ...roles.map((r) => r.nombre)],
    [roles]
  )
  const deptoOptions = useMemo(
    () => ['Todos', ...departamentos.map((d) => d.nombre)],
    [departamentos]
  )
  const divisionOptions = useMemo(
    () => ['Todos', ...divisiones.map((d) => d.nombre)],
    [divisiones]
  )

  const filtered = personas.filter((p) => {
    const q = search.toLowerCase()
    if (q && !p.persona.toLowerCase().includes(q) && !(p.email_corporativo ?? '').toLowerCase().includes(q)) return false
    if (estadoFilter !== 'Todos' && getEstadoAcceso(p) !== estadoFilter) return false
    if (empresaFilter !== 'Todos' && egMap.get(p.empresa_grupo_id)?.codigo !== empresaFilter) return false
    if (rolFilter !== 'Todos' && rolMap.get(p.rol_id)?.nombre !== rolFilter) return false
    if (divisionFilter !== 'Todos' && divisionMap.get(p.division_id)?.nombre !== divisionFilter) return false
    if (deptoFilter !== 'Todos') {
      const deptoIds = personaDeptos.get(p.id) ?? []
      const match = deptoIds.some((id) => deptoMap.get(id)?.nombre === deptoFilter)
      if (!match) return false
    }
    return true
  })

  const totalConCuenta = personas.filter((p) => p.auth_user_id).length
  const totalActivos = personas.filter((p) => p.auth_user_id && p.activo).length
  const totalSinCuenta = personas.filter((p) => !p.auth_user_id).length

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Usuarios</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Gestión de cuentas de acceso y roles
      </p>

      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Personas" value={personas.length} borderColor="border-t-blue-500" />
        <KpiCard label="Con cuenta" value={totalConCuenta} borderColor="border-t-emerald-500" />
        <KpiCard label="Activos" value={totalActivos} borderColor="border-t-indigo-500" />
        <KpiCard label="Sin cuenta" value={totalSinCuenta} borderColor="border-t-amber-500" />
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="w-56">
          <SearchBar placeholder="Buscar por nombre o email..." value={search} onChange={setSearch} />
        </div>
        <FilterPills
          options={['Todos', 'Activo', 'Sin cuenta', 'Desactivado']}
          active={estadoFilter}
          onChange={setEstadoFilter}
        />
        <FilterPills options={empresaOptions} active={empresaFilter} onChange={setEmpresaFilter} />
        <FilterPills options={rolOptions} active={rolFilter} onChange={setRolFilter} />
        <FilterPills options={divisionOptions} active={divisionFilter} onChange={setDivisionFilter} />
        <FilterPills options={deptoOptions} active={deptoFilter} onChange={setDeptoFilter} />
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No se encontraron usuarios con esos filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Persona</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Email</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Rol</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Acceso</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => {
                const estado = getEstadoAcceso(p)
                const eg = egMap.get(p.empresa_grupo_id)

                return (
                  <TableRow key={p.id}>
                    <TableCell className="font-medium">{p.persona}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {p.email_corporativo ?? <span className="italic">Sin email</span>}
                    </TableCell>
                    <TableCell>{eg?.codigo ?? '—'}</TableCell>
                    <TableCell>
                      <RolSelect persona={p} roles={roles} />
                    </TableCell>
                    <TableCell>
                      <EstadoBadge estado={estado} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {estado === 'Sin cuenta' && p.email_corporativo && (
                          <ActionButton
                            icon={Send}
                            label="Invitar"
                            onClick={() => invitarUsuario(p.id)}
                          />
                        )}
                        {estado === 'Activo' && (
                          <>
                            <ActionButton
                              icon={KeyRound}
                              label="Reset password"
                              onClick={() => resetearPassword(p.id)}
                            />
                            <ActionButton
                              icon={Ban}
                              label="Desactivar"
                              confirmLabel="¿Confirmar?"
                              onClick={() => desactivarUsuario(p.id)}
                            />
                          </>
                        )}
                        {estado === 'Desactivado' && (
                          <>
                            <ActionButton
                              icon={RotateCcw}
                              label="Reactivar"
                              onClick={() => reactivarUsuario(p.id)}
                            />
                            <ActionButton
                              icon={Trash2}
                              label="Eliminar cuenta"
                              confirmLabel="¿Seguro?"
                              onClick={() => eliminarCuentaAuth(p.id)}
                            />
                          </>
                        )}
                      </div>
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
