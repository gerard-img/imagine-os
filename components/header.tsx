'use client'

import { User } from 'lucide-react'

function getFormattedDate() {
  const now = new Date()
  const options: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }
  return now.toLocaleDateString('es-ES', options)
}

export function Header() {
  return (
    <header className="flex items-center justify-end gap-4 px-6 py-3 bg-white border-b border-border">
      <span className="text-xs text-muted-foreground">{getFormattedDate()}</span>
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4 w-4" />
      </div>
    </header>
  )
}
