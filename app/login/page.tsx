'use client'

import { Suspense, useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/browser'
import { login } from './actions'

function LoginForm() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const urlError = searchParams.get('error')
  const [error, setError] = useState<string | null>(
    urlError === 'enlace-invalido'
      ? 'El enlace ha expirado o no es válido. Solicita uno nuevo.'
      : null
  )
  const [loading, setLoading] = useState(false)

  // Detectar tokens de invitación/recovery en el hash fragment
  // Supabase envía #access_token=...&type=invite cuando usa flujo implícito
  useEffect(() => {
    const hash = window.location.hash
    if (!hash) return

    const params = new URLSearchParams(hash.substring(1))
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')
    const type = params.get('type')

    if (accessToken && refreshToken) {
      setLoading(true)
      setError(null)
      const supabase = createClient()
      supabase.auth
        .setSession({ access_token: accessToken, refresh_token: refreshToken })
        .then(({ error: sessionError }) => {
          if (sessionError) {
            setError('El enlace ha expirado o no es válido. Solicita uno nuevo.')
            setLoading(false)
            return
          }
          if (type === 'recovery' || type === 'invite') {
            router.replace('/update-password')
          } else {
            router.replace('/')
          }
        })
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const result = await login(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="w-full max-w-sm">
      {/* Logo / Título */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Imagine OS</h1>
        <p className="text-sm text-gray-500 mt-1">
          Inicia sesión para continuar
        </p>
      </div>

      {/* Card del formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email corporativo
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              placeholder="tu@empresa.com"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-[#00C896] focus:border-transparent"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm
                         placeholder:text-gray-400 focus:outline-none focus:ring-2
                         focus:ring-[#00C896] focus:border-transparent"
            />
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-[#00C896] px-4 py-2 text-sm font-medium
                       text-white hover:bg-[#00B385] transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Entrando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>

      <p className="text-center text-xs text-gray-400 mt-4">
        El acceso se gestiona por invitación. Contacta con tu administrador si no tienes cuenta.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
