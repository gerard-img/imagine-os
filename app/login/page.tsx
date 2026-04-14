'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import { login, register } from './actions'

type Mode = 'login' | 'register'

export default function LoginPage() {
  const searchParams = useSearchParams()
  const urlError = searchParams.get('error')
  const [mode, setMode] = useState<Mode>('login')
  const [error, setError] = useState<string | null>(
    urlError === 'enlace-invalido'
      ? 'El enlace ha expirado o no es válido. Solicita uno nuevo.'
      : null
  )
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const formData = new FormData(e.currentTarget)
    const action = mode === 'login' ? login : register
    const result = await action(formData)

    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F9FAFB]">
      <div className="w-full max-w-sm">
        {/* Logo / Título */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Imagine OS</h1>
          <p className="text-sm text-gray-500 mt-1">
            {mode === 'login'
              ? 'Inicia sesión para continuar'
              : 'Crea tu cuenta para acceder'}
          </p>
        </div>

        {/* Card del formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Tabs login / registro */}
          <div className="flex mb-5 border-b border-gray-200">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null) }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
                mode === 'login'
                  ? 'border-[#00C896] text-[#00C896]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null) }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors border-b-2 ${
                mode === 'register'
                  ? 'border-[#00C896] text-[#00C896]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              Registrarse
            </button>
          </div>

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
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                placeholder={mode === 'register' ? 'Mínimo 6 caracteres' : '••••••••'}
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
              {loading
                ? (mode === 'login' ? 'Entrando...' : 'Creando cuenta...')
                : (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
