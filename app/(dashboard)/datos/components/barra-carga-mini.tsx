'use client'

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
