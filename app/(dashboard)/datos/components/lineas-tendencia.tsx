'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { formatMoney } from '@/lib/helpers'

export type DatoTendenciaMes = {
  mesCorto: string
  facturado: number
  pctCarga: number
  euroHora: number
}

type Props = {
  datos: DatoTendenciaMes[]
}

const SERIES = [
  { key: 'facturado', label: 'Facturado', color: '#00C896', yAxisId: 'left', formatter: (v: number) => formatMoney(v) },
  { key: 'euroHora', label: '€/hora', color: '#F59E0B', yAxisId: 'right', formatter: (v: number) => `${v.toFixed(1)} €/h` },
  { key: 'pctCarga', label: '% Carga', color: '#8B5CF6', yAxisId: 'right', formatter: (v: number) => `${Math.round(v)}%` },
] as const

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string; color: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => {
        const serie = SERIES.find((s) => s.key === p.dataKey)
        return (
          <p key={p.dataKey} className="text-xs text-muted-foreground">
            <span className="inline-block w-2 h-2 rounded-full mr-1.5" style={{ backgroundColor: p.color }} />
            {serie?.label ?? p.dataKey}:{' '}
            <span className="font-semibold text-foreground">{serie?.formatter(p.value) ?? p.value}</span>
          </p>
        )
      })}
    </div>
  )
}

export function LineasTendencia({ datos }: Props) {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border flex items-center justify-center h-[300px]">
        <p className="text-sm text-muted-foreground">Sin datos para mostrar tendencias</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Tendencia de KPIs
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Facturado, €/hora y % Carga — evolución mensual
        </p>
      </div>

      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={datos}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis
            dataKey="mesCorto"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11, fill: '#9CA3AF' }}
          />
          <YAxis
            yAxisId="left"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            width={50}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickFormatter={(v: number) => `${Math.round(v)}`}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          />
          <Line
            yAxisId="left"
            type="monotone"
            dataKey="facturado"
            name="Facturado"
            stroke="#00C896"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="euroHora"
            name="€/hora"
            stroke="#F59E0B"
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
          <Line
            yAxisId="right"
            type="monotone"
            dataKey="pctCarga"
            name="% Carga"
            stroke="#8B5CF6"
            strokeWidth={2}
            strokeDasharray="5 3"
            dot={{ r: 3 }}
            activeDot={{ r: 5 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
