'use client'

import { formatHoras } from './helpers-ui'

export type DeptoCarga = {
  nombre: string
  pctCarga: number
  horasAsignadas: number
  horasTrabajables: number
}

type Props = {
  datos: DeptoCarga[]
}

function barColor(pct: number): string {
  if (pct > 90) return 'bg-red-500'
  if (pct >= 80) return 'bg-emerald-500'
  if (pct >= 60) return 'bg-amber-400'
  return 'bg-red-400'
}

function textColor(pct: number): string {
  if (pct > 90) return 'text-red-600'
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-red-600'
}

export function BarrasCargaDepto({ datos }: Props) {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border flex items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin datos de departamentos</p>
      </div>
    )
  }

  // Ordenar por carga desc
  const sorted = [...datos].sort((a, b) => b.pctCarga - a.pctCarga)

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
        Carga por departamento
      </p>
      <p className="text-[11px] text-muted-foreground mb-4">
        % utilización del periodo seleccionado
      </p>

      <div className="space-y-3">
        {sorted.map((d) => {
          const fill = Math.min(d.pctCarga, 100)
          return (
            <div key={d.nombre}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[13px] font-medium text-foreground truncate">
                  {d.nombre}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-muted-foreground">
                    {formatHoras(d.horasAsignadas)} / {formatHoras(d.horasTrabajables)}
                  </span>
                  <span className={`text-sm font-bold tabular-nums ${textColor(d.pctCarga)}`}>
                    {Math.round(d.pctCarga)}%
                  </span>
                </div>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${barColor(d.pctCarga)}`}
                  style={{ width: `${fill}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
