'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { formatMoney } from '@/lib/helpers'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { SortableHeader } from '@/components/sortable-header'
import type {
  OrdenTrabajo,
  OrdenTrabajoPersona,
  Proyecto,
  CatalogoServicio,
  Empresa,
  Departamento,
  Persona,
  Asignacion,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { MonthNavigator } from '@/components/month-navigator'
import { UrgenciaIndicador } from '@/components/status-badge'
import { getUrgenciaPlanificado } from '@/lib/helpers'
import { CambiarEstadoOT } from '@/components/cambiar-estado-ot'
import { OtFormSheet } from './ot-form-sheet'
import { GenerarOtsButton } from './generar-ots-button'
import { confirmarOTsBulk } from './actions'
import { AsignacionFormSheet } from '../asignaciones/asignacion-form-sheet'
import { CheckCheck, X, Loader2, Users } from 'lucide-react'
import { ServicioPill } from '@/components/servicio-pill'

// ── Filter dropdown component ──
function FilterSelect({
  label, value, options, onChange,
}: {
  label: string; value: string; options: string[]; onChange: (v: string) => void
}) {
  const isActive = value !== 'Todos'
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`rounded-full px-3 py-1.5 text-xs font-semibold outline-none transition-colors cursor-pointer ${
        isActive
          ? 'bg-primary text-primary-foreground'
          : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
      }`}
      aria-label={label}
    >
      {options.map((opt) => (
        <option key={opt} value={opt} className="bg-white text-foreground">
          {opt === 'Todos' ? `${label}: Todos` : opt}
        </option>
      ))}
    </select>
  )
}

interface OrdenesTrabajoClientProps {
  ordenesTrabajo: OrdenTrabajo[]
  ordenesPersonas: OrdenTrabajoPersona[]
  proyectos: Proyecto[]
  servicios: CatalogoServicio[]
  empresas: Empresa[]
  departamentos: Departamento[]
  personas: Persona[]
  asignaciones: Asignacion[]
  cuotas: CuotaPlanificacion[]
}

export function OrdenesTrabajoClient(props: OrdenesTrabajoClientProps) {
  return (
    <Suspense>
      <OrdenesTrabajoContent {...props} />
    </Suspense>
  )
}

function OrdenesTrabajoContent({
  ordenesTrabajo,
  ordenesPersonas,
  proyectos,
  servicios,
  empresas,
  departamentos,
  personas,
  asignaciones,
  cuotas,
}: OrdenesTrabajoClientProps) {
  // Build lookup maps for efficient access
  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const departamentoMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])
  const personaMap = useMemo(() => new Map(personas.map((p) => [p.id, p])), [personas])

  // Get unique months from ordenes_trabajo
  const availableMonths = useMemo(() => {
    const months = [...new Set(ordenesTrabajo.map((ot) => ot.mes_anio))].sort()
    return months.length > 0 ? months : ['2026-01-01']
  }, [ordenesTrabajo])

  // ── URL params para filtros y sorting ──
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'proyectoTitulo', dir: 'asc' },
  })
  const month = getParam('mes', availableMonths[0])!
  const estadoFilter = getParam('estado', 'Todos')!
  const deptoFilter = getParam('depto', 'Todos')!
  const servicioFilter = getParam('servicio', 'Todos')!
  const tipoPartidaFilter = getParam('tipoPartida', 'Todos')!

  // Search permanece local (evitar demasiadas entradas de URL al teclear)
  const [search, setSearch] = useState('')

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [isConfirming, setIsConfirming] = useState(false)

  // OT → Asignación integrated flow
  const [pendingOtId, setPendingOtId] = useState<string | null>(null)

  function handleMonthChange(m: string) { setParams({ mes: m }); setSelectedIds([]) }
  function handleSearchChange(s: string) { setSearch(s) }

  // Build filter options from data
  const filterOptions = useMemo(() => {
    const estados = ['Todos', ...new Set(ordenesTrabajo.map((o) => o.estado))]
    const deptos = ['Todos', ...new Set(departamentos.map((d) => d.nombre))]
    const srvs = ['Todos', ...new Set(servicios.map((s) => s.nombre))]
    const tiposPartida = ['Todos', 'Puntual', 'Recurrente']
    return { estados, deptos, servicios: srvs, tiposPartida }
  }, [ordenesTrabajo, departamentos, servicios])

  const rows = useMemo(() => {
    return ordenesTrabajo.map((ot) => {
      const proyecto = proyectoMap.get(ot.proyecto_id)
      const servicio = ot.servicio_id ? servicioMap.get(ot.servicio_id) : null
      const empresa = proyecto?.empresa_id ? empresaMap.get(proyecto.empresa_id) : null
      const dept = departamentoMap.get(ot.departamento_id)

      const personasAsignar = ordenesPersonas
        .filter((otp) => otp.orden_trabajo_id === ot.id)
        .map((otp) => personaMap.get(otp.persona_id)?.persona)
        .filter(Boolean) as string[]

      return {
        ...ot,
        proyectoTitulo: proyecto?.titulo ?? '—',
        servicioNombre: servicio?.nombre ?? null,
        clienteNombre: empresa?.nombre_interno ?? empresa?.nombre_legal ?? 'Interno',
        departamentoNombre: dept?.nombre ?? '—',
        personasAsignar,
      }
    })
  }, [ordenesTrabajo, ordenesPersonas, proyectoMap, servicioMap, empresaMap, departamentoMap, personaMap])

  const filtered = rows.filter((r) => {
    if (r.mes_anio !== month) return false
    if (estadoFilter !== 'Todos' && r.estado !== estadoFilter) return false
    if (deptoFilter !== 'Todos' && r.departamentoNombre !== deptoFilter) return false
    if (servicioFilter !== 'Todos' && r.servicioNombre !== servicioFilter) return false
    if (tipoPartidaFilter !== 'Todos') {
      const proyecto = proyectoMap.get(r.proyecto_id)
      if (proyecto?.tipo_partida !== tipoPartidaFilter) return false
    }
    if (search) {
      const q = search.toLowerCase()
      const hayMatch =
        r.proyectoTitulo.toLowerCase().includes(q) ||
        (r.servicioNombre ?? '').toLowerCase().includes(q) ||
        r.clienteNombre.toLowerCase().includes(q) ||
        r.departamentoNombre.toLowerCase().includes(q)
      if (!hayMatch) return false
    }
    return true
  })

  // Aplicar ordenación
  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    proyectoTitulo: (r) => r.proyectoTitulo,
    clienteNombre: (r) => r.clienteNombre,
    servicioNombre: (r) => r.servicioNombre ?? '',
    departamentoNombre: (r) => r.departamentoNombre,
    porcentaje_ppto_mes: (r) => r.porcentaje_ppto_mes,
    partida_prevista: (r) => r.partida_prevista,
    partida_real: (r) => r.partida_real ?? 0,
    estado: (r) => r.estado,
  }), [filtered, sortCol, sortDir])

  const totalPrevisto = filtered.reduce((sum, r) => sum + r.partida_prevista, 0)
  const totalReal = filtered.reduce((sum, r) => sum + (r.partida_real ?? 0), 0)
  const ordenesCount = filtered.length

  // Bulk selection helpers
  const allSelected = filtered.length > 0 && filtered.every((r) => selectedIds.includes(r.id))
  const someSelected = selectedIds.length > 0

  function toggleId(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  function toggleAll() {
    if (allSelected) setSelectedIds([])
    else setSelectedIds(filtered.map((r) => r.id))
  }

  async function handleBulkConfirm() {
    setIsConfirming(true)
    const result = await confirmarOTsBulk(selectedIds)
    if (result.success) setSelectedIds([])
    setIsConfirming(false)
  }

  // Service pill colors — centralizado en components/servicio-pill.tsx

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Órdenes de Trabajo</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Desglose mensual de trabajo por proyecto y servicio
          </p>
        </div>
        <div className="flex items-center gap-3">
          <GenerarOtsButton
              currentMonth={month}
              ordenesTrabajo={ordenesTrabajo}
              proyectos={proyectos}
              servicios={servicios}
              empresas={empresas}
              departamentos={departamentos}
              deptoFilter={deptoFilter}
            />
          <OtFormSheet
            proyectos={proyectos}
            servicios={servicios}
            departamentos={departamentos}
            personas={personas}
            empresas={empresas}
            onCreated={(id) => setPendingOtId(id)}
          />
          <MonthNavigator value={month} onChange={handleMonthChange} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Órdenes" value={ordenesCount} borderColor="border-t-blue-500" />
        <KpiCard label="Partida prevista" value={formatMoney(totalPrevisto)} borderColor="border-t-purple-500" />
        <KpiCard label="Partida real" value={formatMoney(totalReal)} borderColor="border-t-amber-500" />
      </div>

      {/* Search + Filters */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        <div className="w-64">
          <SearchBar placeholder="Buscar proyecto, servicio, cliente..." value={search} onChange={handleSearchChange} />
        </div>
        <FilterSelect label="Estado" value={estadoFilter} options={filterOptions.estados} onChange={(v) => setParams({ estado: v === 'Todos' ? null : v })} />
        <FilterSelect label="Departamento" value={deptoFilter} options={filterOptions.deptos} onChange={(v) => setParams({ depto: v === 'Todos' ? null : v })} />
        <FilterSelect label="Servicio" value={servicioFilter} options={filterOptions.servicios} onChange={(v) => setParams({ servicio: v === 'Todos' ? null : v })} />
        <FilterSelect label="Tipo partida" value={tipoPartidaFilter} options={filterOptions.tiposPartida} onChange={(v) => setParams({ tipoPartida: v === 'Todos' ? null : v })} />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-sm text-muted-foreground mb-4">
              No hay órdenes de trabajo para este mes con esos filtros.
            </p>
            <div className="flex justify-center">
              <GenerarOtsButton
              currentMonth={month}
              ordenesTrabajo={ordenesTrabajo}
              proyectos={proyectos}
              servicios={servicios}
              empresas={empresas}
              departamentos={departamentos}
              deptoFilter={deptoFilter}
            />
            </div>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-8 pr-0">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleAll}
                    className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                    title="Seleccionar todas"
                  />
                </TableHead>
                <TableHead><SortableHeader label="Proyecto" column="proyectoTitulo" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Cliente" column="clienteNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Servicio" column="servicioNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Depto" column="departamentoNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="% Ppto" column="porcentaje_ppto_mes" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Prevista" column="partida_prevista" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Real" column="partida_real" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Estado" column="estado" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Personas</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => {
                const isSelected = selectedIds.includes(r.id)
                return (
                  <TableRow key={r.id} className={isSelected ? 'bg-emerald-50' : undefined}>
                    <TableCell className="pr-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleId(r.id)}
                        className="h-4 w-4 cursor-pointer rounded border-gray-300 accent-emerald-500"
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      <Link href={`/proyectos/${r.proyecto_id}`} className="hover:text-primary hover:underline transition-colors">
                        {r.proyectoTitulo}
                      </Link>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{r.clienteNombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        {r.servicioNombre ? (
                          <ServicioPill name={r.servicioNombre} />
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700">
                            ⚠ Sin servicio
                          </span>
                        )}
                        {r.titulo && (
                          <span className="text-[11px] text-muted-foreground">{r.titulo}</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-semibold text-gray-600">
                        {r.departamentoNombre}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">{r.porcentaje_ppto_mes}%</TableCell>
                    <TableCell className="text-right font-medium text-blue-600">{formatMoney(r.partida_prevista)}</TableCell>
                    <TableCell className="text-right">{r.partida_real !== null ? formatMoney(r.partida_real) : '—'}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CambiarEstadoOT otId={r.id} estadoActual={r.estado} />
                        {(() => {
                          const u = getUrgenciaPlanificado(r.estado, r.mes_anio)
                          return u ? <UrgenciaIndicador nivel={u} /> : null
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {r.personasAsignar.map((name) => (
                          <span key={name} className="text-xs text-muted-foreground">{name}</span>
                        ))}
                        {r.personasAsignar.length === 0 && <span className="text-xs text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <OtFormSheet
                        proyectos={proyectos}
                        servicios={servicios}
                        departamentos={departamentos}
                        personas={personas}
                        empresas={empresas}
                        ot={ordenesTrabajo.find((o) => o.id === r.id)}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Floating bulk action bar */}
      {someSelected && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 flex items-center gap-3 rounded-xl bg-gray-900 px-4 py-2.5 shadow-xl text-white">
          <span className="text-sm font-medium">
            {selectedIds.length} OT{selectedIds.length > 1 ? 's' : ''} seleccionada{selectedIds.length > 1 ? 's' : ''}
          </span>
          <button
            onClick={handleBulkConfirm}
            disabled={isConfirming}
            className="flex items-center gap-1.5 rounded-lg bg-emerald-500 px-3 py-1.5 text-sm font-semibold hover:bg-emerald-400 transition-colors disabled:opacity-50"
          >
            {isConfirming ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCheck className="h-3.5 w-3.5" />}
            Confirmar todas
          </button>
          <button
            onClick={() => setSelectedIds([])}
            className="rounded p-1 hover:bg-white/10 transition-colors"
            title="Cancelar selección"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* OT → Asignación integrated flow: opens automatically after creating an OT */}
      {pendingOtId && (
        <AsignacionFormSheet
          key={pendingOtId}
          externalOpen={true}
          onExternalOpenChange={(open) => { if (!open) setPendingOtId(null) }}
          preselectedOrdenId={pendingOtId}
          ordenesTrabajo={ordenesTrabajo}
          proyectos={proyectos}
          empresas={empresas}
          personas={personas}
          cuotas={cuotas}
          asignaciones={asignaciones}
          servicios={servicios}
          departamentos={departamentos}
        />
      )}
    </div>
  )
}
