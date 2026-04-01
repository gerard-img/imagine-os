'use client'

import { Search } from 'lucide-react'

interface SearchBarProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function SearchBar({ placeholder = 'Buscar...', value, onChange }: SearchBarProps) {
  return (
    <div className="relative flex-1">
      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-border bg-white py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/30"
      />
    </div>
  )
}
