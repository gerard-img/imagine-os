'use client'

import { useState, useMemo, Suspense } from 'react'
import Link from 'next/link'
import type { Empresa } from '@/lib/supabase/types'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { FilterPills } from '@/components/filter-pills'
import { StatusBadge } from '@/components/status-badge'
import { SortControl } from '@/components/sortable-header'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { EmpresaFormSheet } from './empresa-form-sheet'

const FILTER_OPTIONS = ['Todos', 'Cliente', 'Prospecto', 'Conocido', 'Baja']

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'estado', label: 'Estado' },
  { value: 'tipo', label: 'Tipo' },
  { value: 'sector', label: 'Sector' },
]

interface EmpresasClientProps {
  empresas: Empresa[]
}

export function EmpresasClient({ empresas }: EmpresasClientProps) {
  return (
    <Suspense>
      <EmpresasContent empresas={empresas} />
    </Suspense>
  )
}

function EmpresasContent({ empresas }: EmpresasClientProps) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'nombre', dir: 'asc' },
  })
  const filter = getParam('estado', 'Todos')!
  const [search, setSearch] = useState('')

  const filtered = empresas.filter((e) => {
    const matchesSearch =
      search === '' ||
      (e.nombre_interno ?? '').toLowerCase().includes(search.toLowerCase()) ||
      e.nombre_legal.toLowerCase().includes(search.toLowerCase()) ||
      (e.cif ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesFilter = filter === 'Todos' || e.estado === filter
    return matchesSearch && matchesFilter
  })

  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    nombre: (e) => (e.nombre_interno ?? e.nombre_legal).toLowerCase(),
    estado: (e) => e.estado,
    tipo: (e) => e.tipo ?? '',
    sector: (e) => e.sector ?? '',
  }), [filtered, sortCol, sortDir])

  const clientes = empresas.filter((e) => e.estado === 'Cliente').length
  const prospectos = empresas.filter((e) => e.estado === 'Prospecto').length
  const inactivos = empresas.filter((e) => e.estado === 'Baja').length

  // Dynamic title based on filter
  const pageTitle =
    filter === 'Cliente'
      ? 'Clientes'
      : filter === 'Prospecto'
        ? 'Prospectos'
        : 'Empresas'
  const pageSubtitle =
    filter === 'Cliente'
      ? 'Empresas con estado Cliente'
      : filter === 'Prospecto'
        ? 'Empresas en fase de prospección'
        : 'Gestión de empresas'

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">{pageTitle}</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">{pageSubtitle}</p>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Clientes" value={clientes} borderColor="border-t-emerald-500" />
        <KpiCard label="Prospectos" value={prospectos} borderColor="border-t-amber-500" />
        <KpiCard label="Bajas" value={inactivos} borderColor="border-t-red-400" />
      </div>

      {/* Search + Filters + Sort + Action */}
      <div className="mt-5 flex items-center gap-3">
        <SearchBar
          placeholder="Buscar empresa..."
          value={search}
          onChange={setSearch}
        />
        <FilterPills options={FILTER_OPTIONS} active={filter} onChange={(v) => setParams({ estado: v === 'Todos' ? null : v })} />
        <div className="ml-auto flex items-center gap-3">
          <SortControl options={SORT_OPTIONS} currentCol={sortCol} currentDir={sortDir} onSort={toggleSort} />
          <EmpresaFormSheet />
        </div>
      </div>

      {/* Enterprise cards */}
      <div className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">
              No se encontraron empresas con esos filtros.
            </p>
          </div>
        )}
        {sorted.map((e) => {
          const subestado =
            e.estado === 'Conocido'
              ? e.tipo_conocido
              : e.estado === 'Cliente'
                ? e.tipo_cliente
                : e.estado === 'Prospecto'
                  ? e.estado_prospecto
                  : null

          return (
            <Link
              key={e.id}
              href={`/empresas/${e.id}`}
              className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm border border-transparent hover:border-primary/20 transition-colors cursor-pointer"
            >
              <div>
                <p className="text-sm font-bold text-foreground">
                  {(e.nombre_interno ?? e.nombre_legal).toUpperCase()}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {[e.tipo, e.cif, e.sector].filter(Boolean).join(' · ')}
                </p>
                {subestado && (
                  <p className="mt-0.5 text-xs text-muted-foreground">{subestado}</p>
                )}
              </div>
              <StatusBadge status={e.estado} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
