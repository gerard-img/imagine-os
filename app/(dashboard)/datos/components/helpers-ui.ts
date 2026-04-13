// Helpers de formato y colores compartidos entre Datos Foco y Datos Tiempo

import type { KpisInformes } from '@/lib/helpers-informes'

export function formatPct(value: number): string {
  return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`
}

export function formatHoras(value: number): string {
  return `${Math.round(value)}h`
}

export function formatEuroHora(value: number): string {
  return `${value.toFixed(1)} €/h`
}

export function realizacionColor(pct: number): string {
  if (pct === 0) return 'text-muted-foreground'
  if (pct >= 100) return 'text-emerald-600'
  if (pct >= 90) return 'text-amber-600'
  return 'text-red-600'
}

export function cargaColor(pct: number): { text: string; border: string } {
  if (pct === 0) return { text: 'text-muted-foreground', border: 'border-t-gray-300' }
  if (pct > 90) return { text: 'text-red-600', border: 'border-t-red-500' }
  if (pct >= 80) return { text: 'text-emerald-600', border: 'border-t-emerald-500' }
  if (pct >= 60) return { text: 'text-amber-600', border: 'border-t-amber-500' }
  return { text: 'text-red-600', border: 'border-t-red-500' }
}

export function hhiColor(nivel: KpisInformes['hhiNivel']): { text: string; bg: string; label: string } {
  if (nivel === 'diversificado') return { text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Diversificado' }
  if (nivel === 'moderado') return { text: 'text-amber-700', bg: 'bg-amber-50', label: 'Moderado' }
  return { text: 'text-red-700', bg: 'bg-red-50', label: 'Concentrado' }
}
