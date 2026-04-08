'use client'

import { ArrowUp, ArrowDown, ChevronsUpDown } from 'lucide-react'
import type { SortDir } from '@/hooks/use-table-state'

// ── Para cabeceras de tabla ─────────────────────────────────────────────────────

type SortableHeaderProps = {
  /** Texto visible de la cabecera */
  label: string
  /** Identificador de la columna (debe coincidir con la key del accessor) */
  column: string
  /** Columna actualmente ordenada */
  currentCol: string | null
  /** Dirección actual */
  currentDir: SortDir
  /** Callback al hacer clic */
  onToggle: (col: string) => void
  /** Clases extra */
  className?: string
  /** Alinear a la derecha (para columnas numéricas) */
  align?: 'left' | 'right'
}

export function SortableHeader({
  label,
  column,
  currentCol,
  currentDir,
  onToggle,
  className = '',
  align = 'left',
}: SortableHeaderProps) {
  const isActive = currentCol === column
  const Icon = isActive
    ? currentDir === 'asc'
      ? ArrowUp
      : ArrowDown
    : ChevronsUpDown

  return (
    <button
      type="button"
      onClick={() => onToggle(column)}
      className={`inline-flex items-center gap-1 text-xs uppercase tracking-wider transition-colors cursor-pointer select-none ${
        isActive ? 'text-foreground font-semibold' : 'text-muted-foreground hover:text-foreground'
      } ${align === 'right' ? 'ml-auto flex-row-reverse' : ''} ${className}`}
    >
      {label}
      <Icon className={`shrink-0 ${isActive ? 'h-3.5 w-3.5' : 'h-3 w-3 opacity-50'}`} />
    </button>
  )
}

// ── Para vistas de cards (dropdown de ordenación) ───────────────────────────────

type SortOption = { value: string; label: string }

type SortControlProps = {
  /** Opciones de columna disponibles */
  options: SortOption[]
  /** Columna actualmente seleccionada */
  currentCol: string | null
  /** Dirección actual */
  currentDir: SortDir
  /** Llamado al seleccionar una columna o alternar dirección */
  onSort: (col: string) => void
}

/**
 * Control de ordenación para vistas de cards/listados.
 * Muestra un <select> con las columnas y un botón para invertir la dirección.
 */
export function SortControl({ options, currentCol, currentDir, onSort }: SortControlProps) {
  const Icon = currentDir === 'asc' ? ArrowUp : ArrowDown

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-xs text-muted-foreground whitespace-nowrap">Ordenar:</span>
      <select
        value={currentCol ?? options[0]?.value ?? ''}
        onChange={(e) => onSort(e.target.value)}
        className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={() => onSort(currentCol ?? options[0]?.value ?? '')}
        className="rounded-lg border border-border bg-white p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
        title={currentDir === 'asc' ? 'Ascendente → Descendente' : 'Descendente → Ascendente'}
      >
        <Icon className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
