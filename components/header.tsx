'use client'

import { User, LogOut } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/browser'
import { logout } from '@/app/login/actions'

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
  const [userEmail, setUserEmail] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      setUserEmail(data.user?.email ?? null)
    })
  }, [])

  return (
    <header className="flex items-center justify-end gap-4 px-6 py-3 bg-white border-b border-border">
      <span className="text-xs text-muted-foreground">{getFormattedDate()}</span>

      {userEmail && (
        <span className="text-xs text-gray-600">{userEmail}</span>
      )}

      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <User className="h-4 w-4" />
      </div>

      <form action={logout}>
        <button
          type="submit"
          className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
          title="Cerrar sesión"
        >
          <LogOut className="h-3.5 w-3.5" />
        </button>
      </form>
    </header>
  )
}
