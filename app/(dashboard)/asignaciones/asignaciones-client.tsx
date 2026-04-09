'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import { Pencil, AlertTriangle } from 'lucide-react'
import { formatMoney } from '@/lib/helpers'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { SortableHeader } from '@/components/sortable-header'
import type { AsignacionRow } from './page'
import type { OrdenTrabajo, Proyecto, Empresa, Persona, CuotaPlanificacion, Asignacion, CatalogoServicio, Departamento } from '@/lib/supabase/types'
import { AsignacionFormSheet } from './asignacion-form-sheet'
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from '@/components/ui/table'
import { ServicioPill } from '@/components/servicio-pill'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { FilterPills } from '@/components/filter-pills'
import { MonthNavigator } from '@/components/month-navigator'

interface AsignacionesClientProps {
  rows: AsignacionRow[]
  availableMonths: string[]
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  personas: Persona[]
  cuotas: CuotaPlanificacion[]
  asignaciones: Asignacion[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
}

export function AsignacionesClient(props: AsignacionesClientProps) {
  return (
    <Suspense>
      <AsignacionesContent {...props} />
    </Suspense>
  )
}

function AsignacionesContent({
  rows, availableMonths,
  ordenesTrabajo, proyectos, empresas, personas, cuotas, asignaciones,
  servicios, departamentos,
}: AsignacionesClientProps) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'clienteNombre', dir: 'asc' },
  })
  const month = getParam('mes', availableMonths[0])!
  const servicioFilter = getParam('servicio', 'Todos')!
  const [search, setSearch] = useState('')

  // Unique servicios for filter pills
  const servicioOptions = useMemo(() => {
    const names = [...new Set(rows.map((r) => r.servicioNombre).filter(Boolean))]
    return ['Todos', ...names.sort()]
  }, [rows])

  // Apply filters
  const filtered = rows.filter((r) => {
    const matchesMonth = r.mes === month
    const matchesSearch =
      search === '' ||
      r.proyectoTitulo.toLowerCase().includes(search.toLowerCase()) ||
      r.personaNombre.toLowerCase().includes(search.toLowerCase()) ||
      r.servicioNombre.toLowerCase().includes(search.toLowerCase())
    const matchesServicio = servicioFilter === 'Todos' || r.servicioNombre === servicioFilter
    return matchesMonth && matchesSearch && matchesServicio
  })

  // Aplicar ordenación
  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    proyectoTitulo: (r) => r.proyectoTitulo,
    clienteNombre: (r) => r.clienteNombre,
    servicioNombre: (r) => r.servicioNombre,
    personaNombre: (r) => r.personaNombre,
    cuotaNombre: (r) => r.cuotaNombre,
    porcentaje: (r) => r.porcentaje,
    ingresosAsignados: (r) => r.ingresosAsignados,
    ingresosReales: (r) => r.ingresosReales ?? 0,
    horasDedicar: (r) => r.horasDedicar,
  }), [filtered, sortCol, sortDir])

  // KPIs for filtered data
  const totalIngresos = filtered.reduce((sum, r) => sum + r.ingresosAsignados, 0)
  const totalHoras = filtered.reduce((sum, r) => sum + r.horasDedicar, 0)
  const personasActivas = new Set(filtered.map((r) => r.personaNombre)).size

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Asignaciones</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Asignación de personas a órdenes de trabajo
          </p>
        </div>
        <div className="flex items-center gap-3">
          <AsignacionFormSheet
            ordenesTrabajo={ordenesTrabajo}
            proyectos={proyectos}
            empresas={empresas}
            personas={personas}
            cuotas={cuotas}
            asignaciones={asignaciones}
            servicios={servicios}
            departamentos={departamentos}
          />
          <MonthNavigator value={month} onChange={(v) => setParams({ mes: v })} />
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard
          label="Ingresos asignados"
          value={formatMoney(totalIngresos)}
          borderColor="border-t-primary"
        />
        <KpiCard
          label="Horas totales"
          value={`${Math.round(totalHoras)}h`}
          borderColor="border-t-blue-500"
        />
        <KpiCard
          label="Personas activas"
          value={personasActivas}
          borderColor="border-t-emerald-500"
        />
      </div>

      {/* Search + Filters */}
      <div className="mt-5 flex items-center gap-3">
        <SearchBar
          placeholder="Buscar por proyecto, persona o servicio..."
          value={search}
          onChange={setSearch}
        />
        <FilterPills options={servicioOptions} active={servicioFilter} onChange={(v) => setParams({ servicio: v === 'Todos' ? null : v })} />
      </div>

      {/* Table */}
      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay asignaciones para este mes con esos filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead><SortableHeader label="Proyecto" column="proyectoTitulo" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Servicio" column="servicioNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Persona" column="personaNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="Cuota" column="cuotaNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} /></TableHead>
                <TableHead><SortableHeader label="%" column="porcentaje" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Ingr. Asign." column="ingresosAsignados" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Ingr. Reales" column="ingresosReales" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead><SortableHeader label="Horas" column="horasDedicar" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" /></TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Carga</TableHead>
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {sorted.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">
                    <Link href={`/proyectos/${r.proyectoId}`} className="hover:text-primary hover:underline transition-colors">
                      {r.proyectoTitulo}
                    </Link>
                  </TableCell>
                  <TableCell>
                    <ServicioPill name={r.servicioNombre} />
                  </TableCell>
                  <TableCell>{r.personaNombre}</TableCell>
                  <TableCell className="text-muted-foreground">{r.cuotaNombre}</TableCell>
                  <TableCell className="text-right">{r.porcentaje}%</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">{formatMoney(r.ingresosAsignados)}</TableCell>
                  <TableCell className="text-right">{r.ingresosReales !== null ? formatMoney(r.ingresosReales) : '—'}</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">{r.horasDedicar.toFixed(1)}h</TableCell>
                  <TableCell className="text-right">
                    {r.horasDisponibles > 0 ? (() => {
                      const pct = (r.horasPersonaMes / r.horasDisponibles) * 100
                      const exceso = pct > 110
                      const color = pct === 0 || exceso
                        ? 'text-red-600'
                        : pct > 90
                          ? 'text-emerald-600'
                          : pct > 75
                            ? 'text-amber-600'
                            : 'text-orange-500'
                      return (
                        <span className={`inline-flex items-center gap-1 text-xs font-bold tabular-nums ${color}`}>
                          {exceso && <AlertTriangle className="h-3 w-3 shrink-0" />}
                          {Math.round(pct)}%
                        </span>
                      )
                    })() : <span className="text-xs text-muted-foreground">—</span>}
                  </TableCell>
                  <TableCell>
                    <AsignacionFormSheet
                      ordenesTrabajo={ordenesTrabajo}
                      proyectos={proyectos}
                      empresas={empresas}
                      personas={personas}
                      cuotas={cuotas}
                      asignaciones={asignaciones}
                      servicios={servicios}
                      departamentos={departamentos}
                      asignacion={asignaciones.find((a) => a.id === r.id)}
                      trigger={
                        <button className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
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
