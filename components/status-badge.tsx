import { cn } from '@/lib/utils'
import type { UrgenciaNivel } from '@/lib/helpers'

const statusStyles: Record<string, string> = {
  // Empresas
  'Cliente': 'bg-emerald-50 text-emerald-700',
  'Prospecto': 'bg-amber-50 text-amber-700',
  'Conocido': 'bg-blue-50 text-blue-700',
  'Baja': 'bg-red-50 text-red-700',
  'Otros': 'bg-gray-100 text-gray-600',
  // Personas
  'Activo': 'bg-emerald-50 text-emerald-700',
  'Inactivo': 'bg-red-50 text-red-700',
  // Proyectos
  'Propuesta': 'bg-amber-50 text-amber-700',
  'Confirmado': 'bg-purple-50 text-purple-700',
  'Pausado': 'bg-blue-50 text-blue-700',
  'Finalizado': 'bg-gray-100 text-gray-600',
  'Cancelado': 'bg-red-50 text-red-700',
  // Ordenes
  'Propuesto': 'bg-gray-100 text-gray-600',
  'Planificado': 'bg-amber-50 text-amber-700',
  'Facturado': 'bg-emerald-50 text-emerald-700',
  // Ausencias
  'Solicitada': 'bg-amber-50 text-amber-700',
  'Aprobada': 'bg-emerald-50 text-emerald-700',
  'Rechazada': 'bg-red-50 text-red-700',
}

interface StatusBadgeProps {
  status: string
  className?: string
}

const urgenciaConfig: Record<UrgenciaNivel, { dot: string; text: string; tooltip: string }> = {
  baja: {
    dot: 'bg-amber-400',
    text: 'text-amber-600',
    tooltip: 'Planificado desde hace más de una semana — pendiente de confirmar',
  },
  media: {
    dot: 'bg-orange-500',
    text: 'text-orange-600',
    tooltip: 'Más de 2 semanas en Planificado — confirmar cuanto antes',
  },
  alta: {
    dot: 'bg-red-500 animate-pulse',
    text: 'text-red-600',
    tooltip: 'Confirmación urgente — más de 3 semanas o mes ya pasado',
  },
}

export function UrgenciaIndicador({ nivel }: { nivel: UrgenciaNivel }) {
  const { dot, text, tooltip } = urgenciaConfig[nivel]
  return (
    <span
      className={cn('flex items-center gap-1 text-[10px] font-semibold', text)}
      title={tooltip}
    >
      <span className={cn('inline-block h-1.5 w-1.5 rounded-full', dot)} />
      Confirmar
    </span>
  )
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const style = statusStyles[status] ?? 'bg-gray-100 text-gray-600'
  return (
    <span className={cn('inline-flex rounded-full px-3 py-0.5 text-xs font-semibold', style, className)}>
      {status.toUpperCase()}
    </span>
  )
}
