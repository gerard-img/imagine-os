'use client'

import { formatMoney } from '@/lib/helpers'

export type ClienteSparklineData = {
  nombre: string
  datos: number[] // 12 meses
  totalAnio: number
  mesesLabels: string[] // e.g. ['Ene', 'Feb', ...]
}

type Props = {
  clientes: ClienteSparklineData[]
}

function SparklineSVG({ data, width = 140, height = 40 }: { data: number[]; width?: number; height?: number }) {
  if (data.length < 2 || data.every((v) => v === 0)) {
    return <div style={{ width, height }} className="flex items-center justify-center text-[10px] text-muted-foreground">Sin datos</div>
  }

  const max = Math.max(...data)
  if (max === 0) return null

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width
    const y = height - 2 - (v / max) * (height - 4)
    return `${x},${y}`
  })

  // Área bajo la curva
  const areaPoints = [
    `0,${height}`,
    ...points,
    `${width},${height}`,
  ].join(' ')

  const firstNonZero = data.find((v) => v > 0) ?? 0
  const last = data[data.length - 1]
  const color = last >= firstNonZero ? '#10B981' : '#EF4444'
  const areaColor = last >= firstNonZero ? '#10B98115' : '#EF444415'

  return (
    <svg width={width} height={height} className="shrink-0">
      <polygon points={areaPoints} fill={areaColor} />
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={width}
        cy={height - 2 - (last / max) * (height - 4)}
        r={2.5}
        fill={color}
      />
    </svg>
  )
}

export function SparklineClientes({ clientes }: Props) {
  if (clientes.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border flex items-center justify-center h-[200px]">
        <p className="text-sm text-muted-foreground">Sin datos de clientes</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Evolución por cliente
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Tendencia de ingresos mensuales — Top clientes del año
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {clientes.map((c) => (
          <div key={c.nombre} className="rounded-lg border border-border/50 p-3 hover:bg-muted/20 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[13px] font-semibold text-foreground truncate">{c.nombre}</span>
              <span className="text-[12px] tabular-nums font-medium text-muted-foreground shrink-0 ml-2">
                {formatMoney(c.totalAnio)}
              </span>
            </div>
            <SparklineSVG data={c.datos} width={200} height={36} />
          </div>
        ))}
      </div>
    </div>
  )
}
