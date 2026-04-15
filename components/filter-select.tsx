'use client'

import { ChevronDown } from 'lucide-react'

interface FilterSelectProps {
  label: string
  options: string[]
  active: string
  onChange: (value: string) => void
}

export function FilterSelect({ label, options, active, onChange }: FilterSelectProps) {
  const isFiltered = active !== 'Todos'

  return (
    <div className="relative">
      <select
        value={active}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none rounded-full py-1.5 pl-3 pr-8 text-xs font-semibold transition-colors cursor-pointer ${
          isFiltered
            ? 'bg-primary text-primary-foreground'
            : 'bg-white text-muted-foreground hover:bg-gray-50 border border-border'
        }`}
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option === 'Todos' ? `${label}: Todos` : option}
          </option>
        ))}
      </select>
      <ChevronDown className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 h-3 w-3 ${
        isFiltered ? 'text-primary-foreground' : 'text-muted-foreground'
      }`} />
    </div>
  )
}
