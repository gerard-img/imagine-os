'use client'

import { ChevronUp, ChevronDown, ChevronRight, X, ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import {
  METRICAS,
  type NodoFila,
  type NodoColumna,
  type Metrica,
  formatearValor,
} from '@/lib/helpers-reportes'

// ── Chip de dimensión seleccionada ──────────────────────────

export function DimChip({ label, color, onMoveUp, onRemove }: {
  label: string; color: 'primary' | 'blue'
  onMoveUp?: () => void; onRemove?: () => void
}) {
  const bg = color === 'primary' ? 'bg-primary text-primary-foreground' : 'bg-blue-600 text-white'
  return (
    <span className={`inline-flex items-center gap-0.5 rounded-full pl-3 pr-1 py-0.5 text-xs font-medium ${bg}`}>
      {label}
      {onMoveUp && (
        <button type="button" onClick={onMoveUp} className="p-0.5 rounded-full hover:bg-white/20 transition-colors" title="Subir">
          <ChevronUp className="h-3 w-3" />
        </button>
      )}
      {onRemove && (
        <button type="button" onClick={onRemove} className="p-0.5 rounded-full hover:bg-white/20 transition-colors" title="Quitar">
          <X className="h-3 w-3" />
        </button>
      )}
    </span>
  )
}

// ── Botón de ordenación ─────────────────────────────────────

export function SortBtn({ label, col, sortCol, sortDir, onToggle, align = 'left', mini = false }: {
  label: string; col: string; sortCol: string | null; sortDir: 'asc' | 'desc'
  onToggle: (col: string) => void; align?: 'left' | 'right'; mini?: boolean
}) {
  const isActive = sortCol === col
  const Icon = isActive ? (sortDir === 'asc' ? ArrowUp : ArrowDown) : ChevronsUpDown
  return (
    <button type="button" onClick={() => onToggle(col)}
      className={`inline-flex items-center gap-0.5 uppercase tracking-wider transition-colors cursor-pointer select-none ${mini ? 'text-[9px]' : 'text-xs'} ${isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'} ${align === 'right' ? 'ml-auto flex-row-reverse' : ''}`}
    >
      {label}
      <Icon className={`shrink-0 ${isActive ? 'h-3 w-3' : 'h-2.5 w-2.5 opacity-50'}`} />
    </button>
  )
}

// ── Badge de variación % ───────────────────────────────────

export function DeltaBadge({ actual, anterior }: { actual: number; anterior: number }) {
  if (anterior === 0 && actual === 0) return null
  if (anterior === 0) return <span className="block text-[9px] font-medium text-blue-500 mt-0.5">nuevo</span>

  const pct = ((actual - anterior) / Math.abs(anterior)) * 100
  if (Math.abs(pct) < 0.1) return null

  const esPositivo = pct > 0
  const color = esPositivo ? 'text-emerald-600' : 'text-red-500'
  const signo = esPositivo ? '+' : ''

  return (
    <span className={`block text-[9px] font-medium ${color} mt-0.5`}>
      {signo}{pct.toFixed(1)}%
    </span>
  )
}

// ── Helpers UI ──────────────────────────────────────────────

export function valorClase(valor: number, formato: string): string {
  if (formato === 'money' && valor > 0) return 'font-medium text-foreground'
  if (formato === 'pct' && valor >= 100) return 'font-medium text-emerald-600'
  if (formato === 'pct' && valor > 0) return 'font-medium text-amber-600'
  return 'text-muted-foreground'
}

export function metricaLabelCorto(m: (typeof METRICAS)[number]): string {
  return m.label.replace(/ \(€\)/, '').replace(/ efectivo/, '')
}

export function metricaLabelMini(m: (typeof METRICAS)[number]): string {
  return m.label
    .replace(/ \(€\)/, '').replace(/ efectivo/, '')
    .replace(/ planificadas/, '').replace(/ reales/, '')
    .replace(/Ingresos /, '')
}

// ── Sort recursivo del árbol ────────────────────────────────

export function sortTree(filas: NodoFila[], sortCol: string, sortDir: 'asc' | 'desc'): NodoFila[] {
  const sorted = [...filas].sort((a, b) => {
    if (sortCol === '_label') {
      return sortDir === 'asc' ? a.label.localeCompare(b.label) : b.label.localeCompare(a.label)
    }
    let va = 0, vb = 0
    if (sortCol.startsWith('total_')) {
      const m = sortCol.replace('total_', '') as Metrica
      va = a.totalesFila[m]; vb = b.totalesFila[m]
    } else {
      const parts = sortCol.split('__')
      if (parts.length === 2) {
        const [colKey, m] = parts
        va = a.celdas.get(colKey)?.[m as Metrica] ?? 0
        vb = b.celdas.get(colKey)?.[m as Metrica] ?? 0
      }
    }
    return sortDir === 'asc' ? va - vb : vb - va
  })
  return sorted.map((f) => f.children.length > 0 ? { ...f, children: sortTree(f.children, sortCol, sortDir) } : f)
}

// ── Cabecera de tabla ───────────────────────────────────────

export function TablaHead({ columnasArbol, columnasHoja, nivelesColumna, tieneColumnas, metricasMeta, filaLabel, sortCol, sortDir, onToggleSort }: {
  columnasArbol: NodoColumna[]; columnasHoja: { key: string; label: string }[]
  nivelesColumna: number; tieneColumnas: boolean
  metricasMeta: (typeof METRICAS)[number][]
  filaLabel: string; sortCol: string | null; sortDir: 'asc' | 'desc'
  onToggleSort: (col: string) => void
}) {
  const soloUnaMetrica = metricasMeta.length === 1
  const totalHeaderRows = tieneColumnas ? nivelesColumna + (soloUnaMetrica ? 0 : 1) : 1
  const numMetricas = metricasMeta.length

  if (!tieneColumnas) {
    return (
      <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
        <tr className="border-b border-border">
          <th className="px-4 py-3 text-left">
            <SortBtn label={filaLabel} col="_label" sortCol={sortCol} sortDir={sortDir} onToggle={onToggleSort} />
          </th>
          {metricasMeta.map((m) => (
            <th key={m.value} className="px-4 py-3 text-right">
              <SortBtn label={metricaLabelCorto(m)} col={`total_${m.value}`} sortCol={sortCol} sortDir={sortDir} onToggle={onToggleSort} align="right" />
            </th>
          ))}
        </tr>
      </thead>
    )
  }

  // Columnas jerárquicas: renderizar N filas de header
  const headerRows: NodoColumna[][] = []
  const collectLevel = (nodes: NodoColumna[], level: number) => {
    if (!headerRows[level]) headerRows[level] = []
    for (const n of nodes) {
      headerRows[level].push(n)
      if (n.children.length > 0) collectLevel(n.children, level + 1)
    }
  }
  collectLevel(columnasArbol, 0)

  return (
    <thead className="sticky top-0 z-10 bg-muted/40 backdrop-blur-sm">
      {/* Filas de agrupación de columnas */}
      {headerRows.map((nodes, lvl) => (
        <tr key={lvl} className="border-b border-border/50">
          {lvl === 0 && (
            <th className="px-4 py-1.5 text-left" rowSpan={totalHeaderRows}>
              <SortBtn label={filaLabel} col="_label" sortCol={sortCol} sortDir={sortDir} onToggle={onToggleSort} />
            </th>
          )}
          {nodes.map((node) => {
            const isLeaf = node.children.length === 0
            const colSpan = node.span * numMetricas
            const rowSpan = isLeaf && !soloUnaMetrica ? 1 : isLeaf ? (totalHeaderRows - lvl) : 1
            return (
              <th key={node.key} colSpan={colSpan} rowSpan={rowSpan}
                className="px-2 py-1.5 text-center text-[11px] font-semibold uppercase tracking-wider text-muted-foreground border-l border-border/30"
              >{node.label}</th>
            )
          })}
          {lvl === 0 && (
            <th colSpan={numMetricas} rowSpan={soloUnaMetrica ? totalHeaderRows : 1}
              className="px-2 py-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-foreground border-l-2 border-border"
            >Total</th>
          )}
        </tr>
      ))}
      {/* Fila de métricas (solo si hay > 1 métrica) */}
      {!soloUnaMetrica && (
        <tr className="border-b border-border">
          {columnasHoja.map((col) =>
            metricasMeta.map((m) => (
              <th key={`${col.key}-${m.value}`} className="px-2 py-1.5 text-right border-l border-border/10">
                <SortBtn label={metricaLabelMini(m)} col={`${col.key}__${m.value}`} sortCol={sortCol} sortDir={sortDir} onToggle={onToggleSort} align="right" mini />
              </th>
            )),
          )}
          {metricasMeta.map((m) => (
            <th key={`total-${m.value}`} className="px-2 py-1.5 text-right border-l-2 border-border">
              <SortBtn label={metricaLabelMini(m)} col={`total_${m.value}`} sortCol={sortCol} sortDir={sortDir} onToggle={onToggleSort} align="right" mini />
            </th>
          ))}
        </tr>
      )}
    </thead>
  )
}

// ── Fila jerárquica recursiva ───────────────────────────────

export function FilaJerarquica({ fila, expandedKeys, onToggle, tieneColumnas, colHojaKeys, metricasMeta, tieneHijos, mostrarVariacion, prevColMap }: {
  fila: NodoFila; expandedKeys: Set<string>; onToggle: (key: string) => void
  tieneColumnas: boolean; colHojaKeys: string[]
  metricasMeta: (typeof METRICAS)[number][]; tieneHijos: boolean
  mostrarVariacion: boolean; prevColMap: Map<string, string>
}) {
  const hasChildren = fila.children.length > 0
  const expanded = expandedKeys.has(fila.key)
  const indent = fila.nivel * 20

  const rowBg = fila.nivel === 0 ? 'bg-white hover:bg-muted/30'
    : fila.nivel === 1 ? 'bg-gray-50/50 hover:bg-muted/20'
    : 'bg-gray-50/30 hover:bg-muted/10'
  const fontWeight = fila.nivel === 0 ? 'font-semibold' : fila.nivel === 1 ? 'font-medium' : 'font-normal'
  const textSize = fila.nivel === 0 ? 'text-sm' : 'text-[13px]'

  return (
    <>
      <tr className={`${rowBg} transition-colors border-b border-border/50`}>
        <td className="py-2 pr-2 whitespace-nowrap" style={{ paddingLeft: `${12 + indent}px` }}>
          <div className="flex items-center gap-1">
            {hasChildren ? (
              <button onClick={() => onToggle(fila.key)} className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors">
                {expanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
              </button>
            ) : tieneHijos ? <span className="w-5 shrink-0" /> : null}
            <span className={`${textSize} ${fontWeight} text-foreground truncate`}>{fila.label}</span>
          </div>
        </td>
        {tieneColumnas && colHojaKeys.map((colKey) => {
          const celda = fila.celdas.get(colKey)
          const prevKey = prevColMap.get(colKey)
          const prevCelda = prevKey ? fila.celdas.get(prevKey) : undefined
          return metricasMeta.map((m) => (
            <td key={`${colKey}-${m.value}`} className={`py-2 px-2 text-right tabular-nums ${textSize} border-l border-border/10`}>
              <span className={valorClase(celda?.[m.value] ?? 0, m.format)}>{formatearValor(celda?.[m.value] ?? 0, m.format)}</span>
              {mostrarVariacion && prevCelda && <DeltaBadge actual={celda?.[m.value] ?? 0} anterior={prevCelda[m.value]} />}
            </td>
          ))
        })}
        {metricasMeta.map((m) => (
          <td key={`total-${m.value}`} className={`py-2 px-2 text-right tabular-nums ${textSize} ${fila.nivel === 0 ? 'font-semibold' : ''} ${tieneColumnas ? 'border-l-2 border-border' : ''}`}>
            <span className={valorClase(fila.totalesFila[m.value], m.format)}>{formatearValor(fila.totalesFila[m.value], m.format)}</span>
          </td>
        ))}
      </tr>
      {expanded && fila.children.map((child) => (
        <FilaJerarquica key={child.key} fila={child}
          expandedKeys={expandedKeys} onToggle={onToggle}
          tieneColumnas={tieneColumnas} colHojaKeys={colHojaKeys}
          metricasMeta={metricasMeta} tieneHijos={tieneHijos}
          mostrarVariacion={mostrarVariacion} prevColMap={prevColMap}
        />
      ))}
    </>
  )
}
