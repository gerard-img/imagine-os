'use client'

export function MiniSparkline({ data }: { data: number[] }) {
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
        cx={w}
        cy={h - (last / max) * (h - 2) - 1}
        r={2}
        fill={color}
      />
    </svg>
  )
}
