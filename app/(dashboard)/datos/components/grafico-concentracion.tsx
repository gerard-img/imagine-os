'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { formatMoney } from '@/lib/helpers'
import type { DatoConcentracionCliente } from '@/lib/helpers-informes'

type Props = {
  datos: DatoConcentracionCliente[]
  hhi: number
  hhiNivel: 'diversificado' | 'moderado' | 'concentrado'
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: DatoConcentracionCliente }> }) {
  if (!active || !payload?.[0]) return null
  const d = payload[0].payload
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground">{d.nombre}</p>
      <p className="text-xs text-muted-foreground mt-0.5">
        {formatMoney(d.ingresos)} · {d.porcentaje}%
      </p>
    </div>
  )
}

export function GraficoConcentracion({ datos, hhi, hhiNivel }: Props) {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border flex items-center justify-center h-[300px]">
        <p className="text-sm text-muted-foreground">Sin datos de clientes para este periodo</p>
      </div>
    )
  }

  const hhiStyles = {
    diversificado: { text: 'text-emerald-700', bg: 'bg-emerald-50', label: 'Diversificado' },
    moderado: { text: 'text-amber-700', bg: 'bg-amber-50', label: 'Moderado' },
    concentrado: { text: 'text-red-700', bg: 'bg-red-50', label: 'Concentrado' },
  }
  const style = hhiStyles[hhiNivel]

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Concentración de clientes
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Distribución de ingresos previstos
          </p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-foreground">HHI {hhi}</p>
          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${style.text} ${style.bg}`}>
            {style.label}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Donut */}
        <div className="w-[160px] h-[160px] shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={datos}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={72}
                dataKey="ingresos"
                nameKey="nombre"
                stroke="white"
                strokeWidth={2}
              >
                {datos.map((d, i) => (
                  <Cell key={i} fill={d.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Leyenda */}
        <div className="flex-1 space-y-1.5 min-w-0">
          {datos.map((d, i) => (
            <div key={i} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: d.color }}
              />
              <span className="text-[12px] text-foreground truncate flex-1">{d.nombre}</span>
              <span className="text-[12px] tabular-nums font-medium text-muted-foreground shrink-0">
                {d.porcentaje}%
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
