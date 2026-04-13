'use client'

import { ArrowUp, ArrowDown } from 'lucide-react'
import { formatMoney } from '@/lib/helpers'
import { formatEuroHora, formatHoras } from './helpers-ui'

export type ClienteEuroHora = {
  nombre: string
  euroHora: number
  horas: number
  ingresos: number
}

type Props = {
  top: ClienteEuroHora[]
  bottom: ClienteEuroHora[]
}

function FilaRanking({ item, rank, variante }: { item: ClienteEuroHora; rank: number; variante: 'top' | 'bottom' }) {
  const color = variante === 'top' ? 'text-emerald-600' : 'text-amber-600'
  const bg = variante === 'top' ? 'bg-emerald-50' : 'bg-amber-50'

  return (
    <div className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/30 transition-colors">
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${bg} ${color}`}>
        {rank}
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{item.nombre}</p>
        <p className="text-[11px] text-muted-foreground">
          {formatHoras(item.horas)} · {formatMoney(item.ingresos)}
        </p>
      </div>
      <span className={`text-sm font-bold tabular-nums ${color}`}>
        {formatEuroHora(item.euroHora)}
      </span>
    </div>
  )
}

export function RankingEuroHora({ top, bottom }: Props) {
  if (top.length === 0 && bottom.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border flex items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin datos suficientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        €/hora efectivo por cliente
      </p>
      <p className="text-[11px] text-muted-foreground mb-4">
        Rentabilidad por hora trabajada
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowUp className="h-3.5 w-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-600">Más rentables</span>
          </div>
          <div className="space-y-0.5">
            {top.map((item, i) => (
              <FilaRanking key={item.nombre} item={item} rank={i + 1} variante="top" />
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <ArrowDown className="h-3.5 w-3.5 text-amber-600" />
            <span className="text-xs font-semibold text-amber-600">Menos rentables</span>
          </div>
          <div className="space-y-0.5">
            {bottom.map((item, i) => (
              <FilaRanking key={item.nombre} item={item} rank={i + 1} variante="bottom" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
