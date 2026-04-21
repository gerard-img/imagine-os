'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Email y contraseña son obligatorios' }
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    return { error: 'Email o contraseña incorrectos' }
  }

  // Limpiar cookies de sesión cacheadas para que reflejen el rol actual del usuario
  // que acaba de loguearse (evita arrastrar valores de una sesión previa).
  const cookieStore = await cookies()
  cookieStore.delete('nivel_acceso')
  cookieStore.delete('rol_nombre')

  redirect('/')
}

export async function logout() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  const cookieStore = await cookies()
  cookieStore.delete('nivel_acceso')
  cookieStore.delete('rol_nombre')

  redirect('/login')
}
