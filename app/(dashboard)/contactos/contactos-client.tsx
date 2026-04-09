'use client'

import { useState, useMemo, Suspense } from 'react'
import type { ContactoEmpresa, Empresa } from '@/lib/supabase/types'
import { KpiCard } from '@/components/kpi-card'
import { SearchBar } from '@/components/search-bar'
import { FilterPills } from '@/components/filter-pills'
import { StatusBadge } from '@/components/status-badge'
import { SortControl } from '@/components/sortable-header'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { Mail, Phone, Star, ShieldCheck } from 'lucide-react'
import { ContactoFormSheet } from './contacto-form-sheet'

const SORT_OPTIONS = [
  { value: 'nombre', label: 'Nombre' },
  { value: 'empresa', label: 'Empresa' },
  { value: 'cargo', label: 'Cargo' },
]

type Props = {
  contactos: ContactoEmpresa[]
  empresas: Empresa[]
}

export function ContactosClient(props: Props) {
  return (
    <Suspense>
      <ContactosContent {...props} />
    </Suspense>
  )
}

function ContactosContent({ contactos, empresas }: Props) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'empresa', dir: 'asc' },
  })
  const empresaFilter = getParam('empresa', 'Todos')!
  const [search, setSearch] = useState('')

  const empresasMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])

  const empresaOptions = useMemo(() => {
    const names = [...new Set(
      contactos.map((c) => {
        const emp = empresasMap.get(c.empresa_id)
        return emp?.nombre_interno ?? emp?.nombre_legal ?? '—'
      })
    )].sort()
    return ['Todos', ...names]
  }, [contactos, empresasMap])

  const filtered = contactos.filter((c) => {
    const emp = empresasMap.get(c.empresa_id)
    const empName = emp?.nombre_interno ?? emp?.nombre_legal ?? '—'
    const fullName = `${c.nombre} ${c.apellidos ?? ''}`

    const matchesSearch =
      search === '' ||
      fullName.toLowerCase().includes(search.toLowerCase()) ||
      empName.toLowerCase().includes(search.toLowerCase()) ||
      (c.cargo ?? '').toLowerCase().includes(search.toLowerCase())
    const matchesEmpresa = empresaFilter === 'Todos' || empName === empresaFilter
    return matchesSearch && matchesEmpresa
  })

  const sorted = useMemo(() => sortData(filtered, sortCol, sortDir, {
    nombre: (c) => `${c.nombre} ${c.apellidos ?? ''}`.toLowerCase(),
    empresa: (c) => {
      const emp = empresasMap.get(c.empresa_id)
      return (emp?.nombre_interno ?? emp?.nombre_legal ?? '').toLowerCase()
    },
    cargo: (c) => (c.cargo ?? '').toLowerCase(),
  }), [filtered, sortCol, sortDir, empresasMap])

  const totalContactos = contactos.length
  const activos = contactos.filter((c) => c.activo).length
  const decisores = contactos.filter((c) => c.es_decisor).length

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Contactos</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Personas de contacto en empresas clientes
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Total contactos" value={totalContactos} borderColor="border-t-blue-500" />
        <KpiCard label="Activos" value={activos} borderColor="border-t-emerald-500" />
        <KpiCard label="Decisores" value={decisores} borderColor="border-t-amber-500" />
      </div>

      <div className="mt-5 flex items-center gap-3">
        <SearchBar placeholder="Buscar contacto, empresa o cargo..." value={search} onChange={setSearch} />
        <FilterPills options={empresaOptions} active={empresaFilter} onChange={(v) => setParams({ empresa: v === 'Todos' ? null : v })} />
        <div className="ml-auto flex items-center gap-3">
          <SortControl options={SORT_OPTIONS} currentCol={sortCol} currentDir={sortDir} onSort={toggleSort} />
          <ContactoFormSheet empresas={empresas} />
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {sorted.length === 0 && (
          <div className="rounded-xl bg-white p-8 text-center shadow-sm">
            <p className="text-sm text-muted-foreground">No se encontraron contactos con esos filtros.</p>
          </div>
        )}
        {sorted.map((c) => {
          const empresa = empresasMap.get(c.empresa_id)
          const empName = empresa?.nombre_interno ?? empresa?.nombre_legal ?? '—'

          return (
            <div
              key={c.id}
              className="flex items-center justify-between rounded-xl bg-white px-5 py-4 shadow-sm border border-transparent hover:border-primary/20 transition-colors"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold text-foreground">
                    {c.nombre} {c.apellidos ?? ''}
                  </p>
                  {c.es_contacto_principal && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-semibold text-blue-700">
                      <Star className="h-2.5 w-2.5" /> Principal
                    </span>
                  )}
                  {c.es_decisor && (
                    <span className="inline-flex items-center gap-0.5 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                      <ShieldCheck className="h-2.5 w-2.5" /> Decisor
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="font-medium">{empName}</span>
                  {c.cargo && (<><span>·</span><span>{c.cargo}</span></>)}
                  {c.departamento && (<><span>·</span><span>{c.departamento}</span></>)}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {c.email && (<span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {c.email}</span>)}
                  {(c.telefono_directo || c.movil) && (<span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {c.movil ?? c.telefono_directo}</span>)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ContactoFormSheet empresas={empresas} contacto={c} />
                <StatusBadge status={c.activo ? 'Activo' : 'Inactivo'} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
