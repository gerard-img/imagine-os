'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Cell,
} from 'recharts'
import { formatMoney } from '@/lib/helpers'
import type { DatoMensualBarras } from '@/lib/helpers-informes'

type Props = {
  datos: DatoMensualBarras[]
  mesActual: string
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) {
  if (!active || !payload) return null
  return (
    <div className="rounded-lg border border-border bg-white px-3 py-2 shadow-md">
      <p className="text-xs font-semibold text-foreground mb-1">{label}</p>
      {payload.map((p) => (
        <p key={p.dataKey} className="text-xs text-muted-foreground">
          <span
            className="inline-block w-2 h-2 rounded-full mr-1.5"
            style={{ backgroundColor: p.dataKey === 'ingresosPrev' ? '#93C5FD' : '#00C896' }}
          />
          {p.dataKey === 'ingresosPrev' ? 'Previsto' : 'Real'}:{' '}
          <span className="font-semibold text-foreground">{formatMoney(p.value)}</span>
        </p>
      ))}
    </div>
  )
}

// Colores: normal vs mes seleccionado
const COLOR_PREV = '#93C5FD'
const COLOR_PREV_ACTIVE = '#3B82F6'
const COLOR_REAL = '#86EFAC'
const COLOR_REAL_ACTIVE = '#00C896'

export function GraficoIngresos({ datos, mesActual }: Props) {
  const hayDatosReales = datos.some((d) => d.ingresosReal > 0)

  const mesesConDatos = datos.filter((d) => d.ingresosPrev > 0)
  const mediaPrev = mesesConDatos.length > 0
    ? mesesConDatos.reduce((s, d) => s + d.ingresosPrev, 0) / mesesConDatos.length
    : 0

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Ingresos por mes
          </p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Previsto vs real — año completo
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_PREV_ACTIVE }} />
            <span className="text-[11px] text-muted-foreground">Previsto</span>
          </div>
          {hayDatosReales && (
            <div className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_REAL_ACTIVE }} />
              <span className="text-[11px] text-muted-foreground">Real</span>
            </div>
          )}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        <BarChart data={datos} barGap={2} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
          <XAxis
            dataKey="mesCorto"
            tickLine={false}
            axisLine={false}
            tick={(props: Record<string, unknown>) => {
              const x = props.x as number
              const y = props.y as number
              const payload = props.payload as { value: string; index: number }
              const isActive = datos[payload.index]?.mes === mesActual
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor="middle"
                  fontSize={11}
                  fontWeight={isActive ? 700 : 400}
                  fill={isActive ? '#111827' : '#9CA3AF'}
                >
                  {payload.value}
                </text>
              )
            }}
          />
          <YAxis
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 10, fill: '#9CA3AF' }}
            tickFormatter={(v: number) => v >= 1000 ? `${Math.round(v / 1000)}k` : String(v)}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ fill: '#F9FAFB' }} />

          {mediaPrev > 0 && (
            <ReferenceLine
              y={mediaPrev}
              stroke="#D1D5DB"
              strokeDasharray="4 4"
              strokeWidth={1}
            />
          )}

          <Bar dataKey="ingresosPrev" radius={[3, 3, 0, 0]} name="Previsto">
            {datos.map((d, i) => (
              <Cell key={i} fill={d.mes === mesActual ? COLOR_PREV_ACTIVE : COLOR_PREV} />
            ))}
          </Bar>
          {hayDatosReales && (
            <Bar dataKey="ingresosReal" radius={[3, 3, 0, 0]} name="Real">
              {datos.map((d, i) => (
                <Cell key={i} fill={d.mes === mesActual ? COLOR_REAL_ACTIVE : COLOR_REAL} />
              ))}
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
