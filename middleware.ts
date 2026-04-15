import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas permitidas para nivel 'personal' (Miembro, Intern, Externo, Implant)
const RUTAS_PERSONAL = ['/dashboard-personal']

// Rutas que no requieren comprobación de nivel (login, sin-acceso, etc.)
const RUTAS_PUBLICAS = ['/login', '/sin-acceso', '/auth/callback', '/update-password', '/api/import']

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refrescar la sesión (importante para mantenerla activa)
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const isPublicRoute = RUTAS_PUBLICAS.some((r) => pathname.startsWith(r))

  // --- 1. Autenticación ---

  // Si no hay usuario y no está en ruta pública → redirigir a /login
  if (!user && !isPublicRoute) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Si hay usuario y está en /login → redirigir al dashboard
  if (user && pathname === '/login') {
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // --- 2. Autorización por nivel de acceso ---

  if (user && !isPublicRoute) {
    // Obtener nivel_acceso: primero de cookie, si no, consultar DB y guardar cookie
    let nivelAcceso = request.cookies.get('nivel_acceso')?.value

    if (!nivelAcceso) {
      type PersonaConRol = {
        roles:
          | { nivel_acceso: string }
          | { nivel_acceso: string }[]
          | null
      }
      const { data: persona } = await supabase
        .from('personas')
        .select('roles(nivel_acceso)')
        .eq('auth_user_id', user.id)
        .single<PersonaConRol>()

      const rol = Array.isArray(persona?.roles) ? persona?.roles[0] : persona?.roles
      nivelAcceso = rol?.nivel_acceso ?? undefined

      if (nivelAcceso) {
        supabaseResponse.cookies.set('nivel_acceso', nivelAcceso, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          path: '/',
          maxAge: 60 * 60 * 24,
        })
      }
    }

    // Si el nivel es 'personal', solo puede acceder a RUTAS_PERSONAL
    if (nivelAcceso === 'personal') {
      const permitida = RUTAS_PERSONAL.some((r) => pathname.startsWith(r))
      if (!permitida) {
        const url = request.nextUrl.clone()
        url.pathname = '/dashboard-personal'
        return NextResponse.redirect(url)
      }
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
