import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Ruta que recibe el redirect de Supabase después de que el usuario
 * hace clic en un enlace de invitación, recovery o magic link.
 *
 * Supabase redirige aquí con un ?code=... que intercambiamos por una sesión.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          },
        },
      }
    )

    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Si es un recovery/invite, redirigir a cambiar contraseña
      const type = searchParams.get('type')
      if (type === 'recovery' || type === 'invite') {
        return NextResponse.redirect(`${origin}/update-password`)
      }
      return NextResponse.redirect(`${origin}${next}`)
    }
  }

  // Si falla, redirigir a login con mensaje de error
  return NextResponse.redirect(`${origin}/login?error=enlace-invalido`)
}
