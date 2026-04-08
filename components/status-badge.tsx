import { cn } from '@/lib/utils'
import type { UrgenciaNivel } from '@/lib/helpers'

const statusStyles: Record<string, string> = {
  // Empresas
  'Cliente': 'bg-emerald-50/60 text-emerald-600',
  'Prospecto': 'bg-amber-50/60 text-amber-600',
  'Conocido': 'bg-blue-50/60 text-blue-600',
  'Baja': 'bg-red-50/60 text-red-600',
  'Otros': 'bg-gray-50 text-gray-500',
  // Personas
  'Activo': 'bg-emerald-50/60 text-emerald-600',
  'Inactivo': 'bg-red-50/60 text-red-600',
  // Proyectos
  'Propuesta': 'bg-amber-50/60 text-amber-600',
  'Confirmado': 'bg-purple-50/60 text-purple-600',
  'Pausado': 'bg-blue-50/60 text-blue-600',
  'Finalizado': 'bg-gray-50 text-gray-500',
  'Cancelado': 'bg-red-50/60 text-red-600',
  // Ordenes
  'Propuesto': 'bg-gray-50 text-gray-500',
  'Planificado': 'bg-amber-50/60 text-amber-600',
  'Realizado': 'bg-blue-50/60 text-blue-600',
  'Facturado': 'bg-emerald-50/60 text-emerald-600',
  // Ausencias
  'Solicitada': 'bg-amber-50/60 text-amber-600',
  'Aprobada': 'bg-emerald-50/60 text-emerald-600',
  'Rechazada': 'bg-red-50/60 text-red-600',
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
  const style = statusStyles[status] ?? 'bg-gray-50 text-gray-500'
  return (
    <span className={cn('inline-flex rounded-full px-3 py-0.5 text-xs font-semibold', style, className)}>
      {status.toUpperCase()}
    </span>
  )
}
