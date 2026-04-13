'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Crosshair, Clock } from 'lucide-react'

const tabs = [
  { href: '/datos/foco', label: 'Foco', icon: Crosshair, description: 'Foto del periodo' },
  { href: '/datos/tiempo', label: 'Tiempo', icon: Clock, description: 'Evolución y tendencias' },
] as const

export function DatosNav() {
  const pathname = usePathname()

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {tabs.map((tab) => {
        const isActive = pathname.startsWith(tab.href)
        const Icon = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-[1px] ${
              isActive
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300'
            }`}
          >
            <Icon className="h-4 w-4" />
            {tab.label}
          </Link>
        )
      })}
    </div>
  )
}
