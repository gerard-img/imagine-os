'use client'

import { useState, useMemo } from 'react'
import type { CuotaPlanificacion, EmpresaGrupo } from '@/lib/supabase/types'
import { formatMoney, formatDate, safeDivide } from '@/lib/helpers'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import { KpiCard } from '@/components/kpi-card'
import { FilterPills } from '@/components/filter-pills'

type Props = {
  cuotas: CuotaPlanificacion[]
  empresasGrupo: EmpresaGrupo[]
}

export function CuotasClient({ cuotas, empresasGrupo }: Props) {
  const [empresaFilter, setEmpresaFilter] = useState('Todos')

  const egMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])

  const empresaOptions = useMemo(() => {
    const names = empresasGrupo.map((eg) => eg.codigo)
    return ['Todos', ...names]
  }, [empresasGrupo])

  const filtered = cuotas.filter((c) => {
    if (empresaFilter === 'Todos') return true
    return egMap.get(c.empresa_grupo_id)?.codigo === empresaFilter
  })

  const vigentes = cuotas.filter((c) => !c.fin_validez).length
  const precioMedio = safeDivide(
    cuotas.reduce((sum, c) => sum + c.precio_hora, 0),
    cuotas.length
  )

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Cuotas de Planificación</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Tarifas horarias por categoría y empresa del grupo
      </p>

      <div className="mt-5 grid grid-cols-3 gap-4">
        <KpiCard label="Total cuotas" value={cuotas.length} borderColor="border-t-blue-500" />
        <KpiCard label="Vigentes" value={vigentes} borderColor="border-t-emerald-500" />
        <KpiCard label="Precio medio/h" value={formatMoney(precioMedio)} borderColor="border-t-primary" />
      </div>

      <div className="mt-5">
        <FilterPills options={empresaOptions} active={empresaFilter} onChange={setEmpresaFilter} />
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {filtered.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No hay cuotas con esos filtros.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Categoría</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground text-right">Precio/hora</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Inicio validez</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Fin validez</TableHead>
                <TableHead className="text-xs uppercase text-muted-foreground">Nota</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{egMap.get(c.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell>{c.nombre}</TableCell>
                  <TableCell className="text-right font-medium text-blue-600">{formatMoney(c.precio_hora)}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(c.inicio_validez)}</TableCell>
                  <TableCell>
                    {c.fin_validez ? (
                      <span className="text-muted-foreground">{formatDate(c.fin_validez)}</span>
                    ) : (
                      <span className="inline-flex rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                        Vigente
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">{c.nota ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
