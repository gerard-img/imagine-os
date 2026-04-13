'use client'

import { useState, useMemo, type ReactNode } from 'react'
import { ChevronRight, ChevronDown, ChevronsUpDown, ChevronsDownUp } from 'lucide-react'
import { useTableState } from '@/hooks/use-table-state'
import { SortableHeader } from '@/components/sortable-header'
import { formatMoney } from '@/lib/helpers'
import type { FilaInforme } from '@/lib/helpers-informes'
import { formatHoras, formatEuroHora, realizacionColor, cargaColor } from './helpers-ui'
import { BarraCargaMini } from './barra-carga-mini'
import { MiniSparkline } from './mini-sparkline'

type SortColumn = 'label' | 'ingresosReal' | 'ingresosPrev' | 'pctRealizacion' | 'horasAsignadas' | 'pctCarga' | 'euroHoraEfectivo' | 'horasNoAsignadas'

// ── Fila colapsable ──

function FilaColapsable({
  fila, nivel, expanded, onToggle, expandedKeys,
}: {
  fila: FilaInforme; nivel: number; expanded: boolean
  onToggle: (key: string) => void; expandedKeys: Set<string>
}) {
  const hasChildren = fila.children && fila.children.length > 0
  const indent = nivel * 24

  const rowBg =
    nivel === 0 ? 'bg-white hover:bg-muted/30' :
    nivel === 1 ? 'bg-gray-50/50 hover:bg-muted/20' :
    'bg-gray-50/30 hover:bg-muted/10'

  const fontWeight = nivel === 0 ? 'font-semibold' : nivel === 1 ? 'font-medium' : 'font-normal'
  const textSize = nivel === 0 ? 'text-sm' : 'text-[13px]'

  return (
    <>
      <tr className={`${rowBg} transition-colors border-b border-border/50`}>
        <td className="py-3 pr-2" style={{ paddingLeft: `${12 + indent}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => onToggle(fila.key)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
              >
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={`${textSize} ${fontWeight} text-foreground truncate`}>{fila.label}</span>
            {nivel === 0 && fila.sparkline && <MiniSparkline data={fila.sparkline} />}
          </div>
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums font-medium text-foreground`}>
          {fila.ingresosReal > 0 ? formatMoney(fila.ingresosReal) : <span className="text-muted-foreground">—</span>}
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-muted-foreground`}>
          {formatMoney(fila.ingresosPrev)}
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.ingresosPrev > 0 && fila.ingresosReal > 0 ? (
            <span className={`font-medium ${realizacionColor(fila.pctRealizacion)}`}>{Math.round(fila.pctRealizacion)}%</span>
          ) : <span className="text-muted-foreground">—</span>}
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {formatHoras(fila.horasAsignadas)}
        </td>
        <td className="py-3 px-3">
          {fila.horasTrabajables > 0 ? (
            <div className="flex items-center justify-end gap-2">
              <BarraCargaMini pct={fila.pctCarga} />
              <span className={`${textSize} tabular-nums font-medium ${cargaColor(fila.pctCarga).text}`}>{Math.round(fila.pctCarga)}%</span>
            </div>
          ) : <span className="text-right block text-muted-foreground text-[13px]">—</span>}
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {fila.horasAsignadas > 0 ? formatEuroHora(fila.euroHoraEfectivo) : <span className="text-muted-foreground">—</span>}
        </td>
        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.horasTrabajables > 0 ? (
            <span className={fila.horasNoAsignadas > 0 ? 'text-amber-600' : 'text-muted-foreground'}>{formatHoras(fila.horasNoAsignadas)}</span>
          ) : <span className="text-muted-foreground">—</span>}
        </td>
      </tr>
      {expanded && hasChildren && fila.children!.map((child) => (
        <FilaColapsable
          key={child.key} fila={child} nivel={nivel + 1}
          expanded={expandedKeys.has(child.key)} onToggle={onToggle} expandedKeys={expandedKeys}
        />
      ))}
    </>
  )
}

// ── Tabla de informe reutilizable ──

type TablaInformeProps = {
  filas: FilaInforme[]
  totales: FilaInforme
  firstColumnLabel: string
  /** Contenido extra antes de la tabla (ej: pestañas) */
  header?: ReactNode
}

export function TablaInforme({ filas, totales, firstColumnLabel, header }: TablaInformeProps) {
  const { sortCol: sortColRaw, sortDir, setParams } = useTableState({
    defaultSort: { col: 'ingresosReal', dir: 'desc' },
  })
  const sortCol = (sortColRaw ?? 'ingresosReal') as SortColumn
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set())

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const toggleSort = (col: SortColumn) => {
    const newDir = sortCol === col ? (sortDir === 'asc' ? 'desc' : 'asc') : (col === 'label' ? 'asc' : 'desc')
    setParams({ orden: col === 'ingresosReal' ? null : col, dir: newDir === 'desc' ? null : newDir })
  }

  const filasOrdenadas = useMemo(() => {
    const sorted = [...filas]
    sorted.sort((a, b) => {
      const valA = sortCol === 'label' ? a.label : a[sortCol]
      const valB = sortCol === 'label' ? b.label : b[sortCol]
      if (typeof valA === 'string' && typeof valB === 'string') {
        return sortDir === 'asc' ? valA.localeCompare(valB) : valB.localeCompare(valA)
      }
      return sortDir === 'asc' ? (valA as number) - (valB as number) : (valB as number) - (valA as number)
    })
    return sorted
  }, [filas, sortCol, sortDir])

  return (
    <div>
      {/* Header con expand/collapse */}
      <div className="flex items-end gap-1">
        {header}
        {filasOrdenadas.length > 0 && (
          <button
            onClick={() => {
              if (expandedKeys.size > 0) {
                setExpandedKeys(new Set())
              } else {
                const allKeys = new Set<string>()
                for (const fila of filasOrdenadas) {
                  allKeys.add(fila.key)
                  if (fila.children) for (const child of fila.children) allKeys.add(child.key)
                }
                setExpandedKeys(allKeys)
              }
            }}
            className="ml-auto mb-1 flex items-center gap-1 rounded-lg px-2.5 py-1.5 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title={expandedKeys.size > 0 ? 'Colapsar todos' : 'Expandir todos'}
          >
            {expandedKeys.size > 0 ? (
              <><ChevronsDownUp className="h-3.5 w-3.5" /> Colapsar</>
            ) : (
              <><ChevronsUpDown className="h-3.5 w-3.5" /> Expandir</>
            )}
          </button>
        )}
      </div>

      <div className="rounded-b-xl rounded-tr-xl bg-white shadow-sm overflow-hidden border border-border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
              <tr className="border-b border-border">
                {([
                  { key: 'label' as SortColumn, label: firstColumnLabel, align: 'left' as const, className: 'pl-4 pr-2 w-[220px]' },
                  { key: 'ingresosReal' as SortColumn, label: 'Facturado', align: 'right' as const, className: 'px-3' },
                  { key: 'ingresosPrev' as SortColumn, label: 'Planificado', align: 'right' as const, className: 'px-3' },
                  { key: 'pctRealizacion' as SortColumn, label: '% Realiz.', align: 'right' as const, className: 'px-3' },
                  { key: 'horasAsignadas' as SortColumn, label: 'Horas', align: 'right' as const, className: 'px-3' },
                  { key: 'pctCarga' as SortColumn, label: '% Carga', align: 'right' as const, className: 'px-3' },
                  { key: 'euroHoraEfectivo' as SortColumn, label: '€/h efect.', align: 'right' as const, className: 'px-3' },
                  { key: 'horasNoAsignadas' as SortColumn, label: 'H. no asig.', align: 'right' as const, className: 'px-3' },
                ]).map((col) => (
                  <th key={col.key} className={`py-2.5 ${col.className}`}>
                    <SortableHeader
                      label={col.label} column={col.key} currentCol={sortCol}
                      currentDir={sortDir} onToggle={(c) => toggleSort(c as SortColumn)} align={col.align}
                    />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filasOrdenadas.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-sm text-muted-foreground">
                    No hay datos para este periodo con los filtros seleccionados.
                    <br /><span className="text-xs">Prueba a cambiar el mes o los filtros.</span>
                  </td>
                </tr>
              ) : (
                filasOrdenadas.map((fila) => (
                  <FilaColapsable
                    key={fila.key} fila={fila} nivel={0}
                    expanded={expandedKeys.has(fila.key)} onToggle={toggleExpand} expandedKeys={expandedKeys}
                  />
                ))
              )}
            </tbody>
            {filasOrdenadas.length > 0 && (
              <tfoot className="sticky bottom-0 z-10 bg-white border-t-2 border-border">
                <tr>
                  <td className="py-3 pl-4 pr-2 text-sm font-bold text-foreground">Total</td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {totales.ingresosReal > 0 ? formatMoney(totales.ingresosReal) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-muted-foreground">
                    {formatMoney(totales.ingresosPrev)}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums">
                    {totales.ingresosPrev > 0 && totales.ingresosReal > 0 ? (
                      <span className={realizacionColor(totales.pctRealizacion)}>{Math.round(totales.pctRealizacion)}%</span>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {formatHoras(totales.horasAsignadas)}
                  </td>
                  <td className="py-3 px-3">
                    {totales.horasTrabajables > 0 ? (
                      <div className="flex items-center justify-end gap-2">
                        <BarraCargaMini pct={totales.pctCarga} />
                        <span className={`text-sm tabular-nums font-bold ${cargaColor(totales.pctCarga).text}`}>{Math.round(totales.pctCarga)}%</span>
                      </div>
                    ) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-foreground">
                    {totales.horasAsignadas > 0 ? formatEuroHora(totales.euroHoraEfectivo) : '—'}
                  </td>
                  <td className="py-3 px-3 text-right text-sm font-bold tabular-nums text-amber-600">
                    {totales.horasTrabajables > 0 ? formatHoras(totales.horasNoAsignadas) : '—'}
                  </td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  )
}
