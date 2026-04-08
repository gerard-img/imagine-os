'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, X } from 'lucide-react'

export interface FilterOption {
  value: string
  label: string
}

interface MultiSelectFilterProps {
  label: string
  options: FilterOption[]
  selected: string[]
  onChange: (selected: string[]) => void
  /** Muestra un input de búsqueda dentro del dropdown (útil para listas largas) */
  searchable?: boolean
}

export function MultiSelectFilter({
  label,
  options,
  selected,
  onChange,
  searchable = false,
}: MultiSelectFilterProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  // Cerrar al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
        setSearch('')
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [open])

  const filteredOptions = searchable && search
    ? options.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const allSelected = selected.length === options.length && options.length > 0
  const hasSelection = selected.length > 0

  function toggleOption(value: string) {
    if (selected.includes(value)) {
      onChange(selected.filter((v) => v !== value))
    } else {
      onChange([...selected, value])
    }
  }

  function toggleAll() {
    if (allSelected) {
      onChange([])
    } else {
      onChange(options.map((o) => o.value))
    }
  }

  function clear(e: React.MouseEvent) {
    e.stopPropagation()
    onChange([])
  }

  return (
    <div ref={ref} className="relative">
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
          hasSelection
            ? 'bg-primary text-primary-foreground'
            : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
        }`}
      >
        <span>{label}</span>
        {hasSelection && (
          <span className={`flex h-4 min-w-4 items-center justify-center rounded-full text-[10px] font-bold ${
            hasSelection ? 'bg-white/25 text-primary-foreground' : ''
          }`}>
            {selected.length}
          </span>
        )}
        {hasSelection ? (
          <X className="h-3 w-3 shrink-0" onClick={clear} />
        ) : (
          <ChevronDown className={`h-3 w-3 shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute left-0 top-full z-50 mt-1 min-w-52 max-w-72 rounded-xl border border-border bg-white shadow-lg">
          {/* Búsqueda */}
          {searchable && (
            <div className="border-b border-border px-3 py-2">
              <input
                type="text"
                placeholder="Buscar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full text-xs outline-none placeholder:text-muted-foreground"
                autoFocus
              />
            </div>
          )}

          {/* Opciones */}
          <div className="max-h-56 overflow-y-auto p-1.5">
            {/* Toggle Todos */}
            {!search && options.length > 2 && (
              <label className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleAll}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary accent-primary"
                />
                <span className="font-semibold text-muted-foreground">Todos</span>
              </label>
            )}

            {filteredOptions.map((option) => (
              <label
                key={option.value}
                className="flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={selected.includes(option.value)}
                  onChange={() => toggleOption(option.value)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary accent-primary"
                />
                <span className="truncate">{option.label}</span>
              </label>
            ))}

            {filteredOptions.length === 0 && (
              <p className="px-2.5 py-2 text-xs text-muted-foreground">Sin resultados</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
