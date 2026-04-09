'use client'

import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import {
  Building2,
  Users,
  Briefcase,
  Contact,
  FolderKanban,
  ClipboardList,
  LayoutGrid,
  Settings,
  Clock,
  UserCheck,
  UserSearch,
  CalendarCog,
  BarChart3,
  Activity,
  MapPin,
  Globe2,
  Layers,
  Shield,
  Crown,
  Network,
  Tag,
  BookOpen,
  Home,
  KeyRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

type NavItem = {
  name: string
  href: string
  icon: LucideIcon
  children?: { name: string; href: string; icon: LucideIcon }[]
}

type NavSection = {
  label: string
  items: NavItem[]
}

// Navegación completa para roles con acceso amplio
const allSections: NavSection[] = [
  {
    label: 'GESTIÓN',
    items: [
      { name: 'Proyectos', href: '/proyectos', icon: FolderKanban },
      { name: 'Planificador', href: '/planificador', icon: CalendarCog },
    ],
  },
  {
    label: 'MANDOS',
    items: [
      { name: 'Dashboard Personal', href: '/dashboard-personal', icon: Home },
      { name: 'Cargas de Trabajo', href: '/cargas-trabajo', icon: Activity },
      { name: 'Datos', href: '/informes', icon: BarChart3 },
      { name: 'Informes', href: '/reportes', icon: ClipboardList },
    ],
  },
  {
    label: 'CRM',
    items: [
      { name: 'Personas', href: '/personas', icon: Users },
      {
        name: 'Empresas',
        href: '/empresas',
        icon: Briefcase,
        children: [
          { name: 'Clientes', href: '/empresas?estado=Cliente', icon: UserCheck },
          { name: 'Prospectos', href: '/empresas?estado=Prospecto', icon: UserSearch },
        ],
      },
      { name: 'Contactos', href: '/contactos', icon: Contact },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { name: 'Empresas Grupo', href: '/empresas-grupo', icon: Building2 },
      { name: 'Órdenes de Trabajo', href: '/ordenes-trabajo', icon: ClipboardList },
      { name: 'Asignaciones', href: '/asignaciones', icon: LayoutGrid },
    ],
  },
  {
    label: 'CONFIG',
    items: [
      {
        name: 'Talento',
        href: '/ciudades',
        icon: Users,
        children: [
          { name: 'Ciudades', href: '/ciudades', icon: Globe2 },
          { name: 'Divisiones', href: '/divisiones', icon: Layers },
          { name: 'Oficinas', href: '/oficinas', icon: MapPin },
          { name: 'Puestos', href: '/puestos', icon: Tag },
          { name: 'Rangos', href: '/rangos', icon: Crown },
          { name: 'Usuarios', href: '/usuarios', icon: KeyRound },
        ],
      },
      {
        name: 'Operaciones',
        href: '/catalogo-servicios',
        icon: Settings,
        children: [
          { name: 'Catálogo Servicios', href: '/catalogo-servicios', icon: BookOpen },
          { name: 'Cuotas Planificación', href: '/cuotas-por-rango', icon: Settings },
          { name: 'Departamentos', href: '/departamentos-config', icon: Network },
          { name: 'Horas Trabajables', href: '/horas-trabajables', icon: Clock },
        ],
      },
      {
        name: 'App',
        href: '/usuarios',
        icon: Shield,
        children: [
          { name: 'Usuarios', href: '/usuarios', icon: KeyRound },
          { name: 'Roles', href: '/roles-sistema', icon: Shield },
        ],
      },
    ],
  },
]

// Navegación reducida para roles con acceso limitado
const limitedSections: NavSection[] = [
  {
    label: 'MI ESPACIO',
    items: [
      { name: 'Dashboard Personal', href: '/dashboard-personal', icon: Home },
    ],
  },
]

// Roles que solo ven el dashboard personal (nivel 'personal')
const ROLES_LIMITADOS = ['Miembro', 'Intern', 'Externo', 'Implant']

type SidebarProps = {
  rolNombre?: string
}

export function Sidebar({ rolNombre }: SidebarProps) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const fullUrl = searchParams.toString() ? `${pathname}?${searchParams.toString()}` : pathname

  const navSections = rolNombre && ROLES_LIMITADOS.includes(rolNombre)
    ? limitedSections
    : allSections

  function isActive(href: string) {
    if (href.includes('?')) return fullUrl === href
    return pathname === href || pathname.startsWith(href + '/')
  }

  function isParentActive(item: NavItem) {
    if (isActive(item.href)) return true
    return item.children?.some((child) => isActive(child.href)) ?? false
  }

  return (
    <aside className="fixed left-0 top-0 h-full w-[220px] border-r border-border bg-white flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">
          CO
        </div>
        <div className="leading-tight">
          <p className="text-sm font-bold text-foreground">COMPANY OS</p>
          <p className="text-[10px] text-muted-foreground tracking-wide">PSA SYSTEM</p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 pb-4">
        {navSections.map((section) => (
          <div key={section.label} className="mb-5">
            <p className="px-2 mb-1.5 text-[10px] font-semibold tracking-widest text-muted-foreground">
              {section.label}
            </p>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const active = isActive(item.href) && !item.children
                const parentActive = isParentActive(item)
                const Icon = item.icon
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] transition-colors ${
                        active || (parentActive && !item.children)
                          ? 'font-semibold text-primary bg-primary/5'
                          : parentActive
                            ? 'font-semibold text-foreground'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      <Icon className="h-4 w-4 shrink-0" />
                      {item.name}
                    </Link>
                    {item.children && (
                      <ul className="mt-0.5 ml-4 space-y-0.5">
                        {item.children.map((child) => {
                          const childActive = isActive(child.href)
                          const ChildIcon = child.icon
                          return (
                            <li key={child.href}>
                              <Link
                                href={child.href}
                                className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[12px] transition-colors ${
                                  childActive
                                    ? 'font-semibold text-primary bg-primary/5'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                              >
                                <ChildIcon className="h-3.5 w-3.5 shrink-0" />
                                {child.name}
                              </Link>
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  )
}
