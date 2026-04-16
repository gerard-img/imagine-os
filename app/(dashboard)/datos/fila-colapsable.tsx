'use client'

import { ChevronRight, ChevronDown } from 'lucide-react'
import { formatMoney } from '@/lib/helpers'
import type { FilaInforme } from '@/lib/helpers-informes'

// ── Helpers de formato y color (exportados para uso en padre) ─

export function formatHoras(value: number): string {
  return `${Math.round(value)}h`
}

export function formatEuroHora(value: number): string {
  return `${value.toFixed(1)} €/h`
}

// ── Colores condicionales ─────────────────────────────────────

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

// ── Sparkline SVG mini ────────────────────────────────────────

function MiniSparkline({ data }: { data: number[] }) {
  if (data.length < 2 || data.every((v) => v === 0)) return null

  const w = 64
  const h = 20
  const max = Math.max(...data)
  if (max === 0) return null

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w
    const y = h - (v / max) * (h - 2) - 1
    return `${x},${y}`
  })

  const firstNonZero = data.find((v) => v > 0) ?? 0
  const last = data[data.length - 1]
  const color = last >= firstNonZero ? '#10B981' : '#EF4444'

  return (
    <svg width={w} height={h} className="shrink-0">
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx={(data.length - 1) / (data.length - 1) * w}
        cy={h - (last / max) * (h - 2) - 1}
        r={2}
        fill={color}
      />
    </svg>
  )
}

// ── Barra de carga mini ───────────────────────────────────────

export function BarraCargaMini({ pct }: { pct: number }) {
  if (pct === 0) return null
  const fill = Math.min(pct, 100)
  const color =
    pct > 90 ? 'bg-red-500' :
    pct >= 80 ? 'bg-emerald-500' :
    pct >= 60 ? 'bg-amber-400' :
    'bg-red-400'

  return (
    <div className="h-1.5 w-16 rounded-full bg-gray-100 overflow-hidden">
      <div className={`h-full rounded-full ${color}`} style={{ width: `${fill}%` }} />
    </div>
  )
}

// ── Fila colapsable ───────────────────────────────────────────

export function FilaColapsable({
  fila,
  nivel,
  expanded,
  onToggle,
  expandedKeys,
}: {
  fila: FilaInforme
  nivel: number
  expanded: boolean
  onToggle: (key: string) => void
  expandedKeys: Set<string>
}) {
  const hasChildren = fila.children && fila.children.length > 0
  const indent = nivel * 24

  const rowBg =
    nivel === 0 ? 'bg-white hover:bg-muted/30' :
    nivel === 1 ? 'bg-gray-50/50 hover:bg-muted/20' :
    'bg-gray-50/30 hover:bg-muted/10'

  const fontWeight = nivel === 0 ? 'font-semibold' : nivel === 1 ? 'font-medium' : 'font-normal'
  const textSize = nivel === 0 ? 'text-sm' : 'text-[13px]'

  return (
    <>
      <tr className={`${rowBg} transition-colors border-b border-border/50`}>
        <td className="py-3 pr-2" style={{ paddingLeft: `${12 + indent}px` }}>
          <div className="flex items-center gap-1.5">
            {hasChildren ? (
              <button
                onClick={() => onToggle(fila.key)}
                className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-muted-foreground hover:bg-muted transition-colors"
              >
                {expanded ? (
                  <ChevronDown className="h-3.5 w-3.5" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5" />
                )}
              </button>
            ) : (
              <span className="w-5 shrink-0" />
            )}
            <span className={`${textSize} ${fontWeight} text-foreground truncate`}>
              {fila.label}
            </span>
            {nivel === 0 && fila.sparkline && (
              <MiniSparkline data={fila.sparkline} />
            )}
          </div>
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums font-medium text-foreground`}>
          {fila.ingresosReal > 0 ? formatMoney(fila.ingresosReal) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-muted-foreground`}>
          {formatMoney(fila.ingresosPrev)}
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.ingresosPrev > 0 && fila.ingresosReal > 0 ? (
            <span className={`font-medium ${realizacionColor(fila.pctRealizacion)}`}>
              {Math.round(fila.pctRealizacion)}%
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {formatHoras(fila.horasAsignadas)}
        </td>

        <td className="py-3 px-3">
          {fila.horasTrabajables > 0 ? (
            <div className="flex items-center justify-end gap-2">
              <BarraCargaMini pct={fila.pctCarga} />
              <span className={`${textSize} tabular-nums font-medium ${cargaColor(fila.pctCarga).text}`}>
                {Math.round(fila.pctCarga)}%
              </span>
            </div>
          ) : (
            <span className="text-right block text-muted-foreground text-[13px]">—</span>
          )}
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums text-foreground`}>
          {fila.horasAsignadas > 0 ? formatEuroHora(fila.euroHoraEfectivo) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>

        <td className={`py-3 px-3 text-right ${textSize} tabular-nums`}>
          {fila.horasTrabajables > 0 ? (
            <span className={fila.horasNoAsignadas > 0 ? 'text-amber-600' : 'text-muted-foreground'}>
              {formatHoras(fila.horasNoAsignadas)}
            </span>
          ) : (
            <span className="text-muted-foreground">—</span>
          )}
        </td>
      </tr>

      {expanded && hasChildren && fila.children!.map((child) => {
        const childExpanded = expandedKeys.has(child.key)
        return (
          <FilaColapsable
            key={child.key}
            fila={child}
            nivel={nivel + 1}
            expanded={childExpanded}
            onToggle={onToggle}
            expandedKeys={expandedKeys}
          />
        )
      })}
    </>
  )
}
