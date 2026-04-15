'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { Suspense } from 'react'

/**
 * Página que recibe el redirect de Supabase después de que el usuario
 * hace clic en un enlace de invitación, recovery o magic link.
 *
 * Supabase puede enviar tokens de dos formas:
 * 1. PKCE: ?code=... en la query string (server-side)
 * 2. Implícito: #access_token=... en el hash fragment (solo client-side)
 *
 * Esta página maneja ambos flujos.
 */
function AuthCallbackHandler() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function handleCallback() {
      const supabase = createClient()

      // Flujo 1: PKCE — Supabase envía ?code=...
      const code = searchParams.get('code')
      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
        if (exchangeError) {
          router.replace('/login?error=enlace-invalido')
          return
        }

        const type = searchParams.get('type')
        if (type === 'recovery' || type === 'invite') {
          router.replace('/update-password')
        } else {
          router.replace('/')
        }
        return
      }

      // Flujo 2: Implícito — Supabase envía #access_token=...
      const hash = window.location.hash
      if (hash) {
        const params = new URLSearchParams(hash.substring(1))
        const accessToken = params.get('access_token')
        const refreshToken = params.get('refresh_token')
        const type = params.get('type')

        if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          })

          if (sessionError) {
            router.replace('/login?error=enlace-invalido')
            return
          }

          if (type === 'recovery' || type === 'invite') {
            router.replace('/update-password')
          } else {
            router.replace('/')
          }
          return
        }
      }

      // Si no hay ni code ni hash con tokens, error
      router.replace('/login?error=enlace-invalido')
    }

    handleCallback()
  }, [router, searchParams])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C896] mx-auto" />
        <p className="text-sm text-gray-500 mt-4">Verificando acceso...</p>
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C896] mx-auto" />
        </div>
      }
    >
      <AuthCallbackHandler />
    </Suspense>
  )
}
