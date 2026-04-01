interface KpiCardProps {
  label: string
  value: string | number
  subtitle?: string
  borderColor?: string
}

export function KpiCard({ label, value, subtitle, borderColor = 'border-t-primary' }: KpiCardProps) {
  return (
    <div className={`rounded-xl bg-white p-5 shadow-sm border-t-4 ${borderColor}`}>
      <p className="text-[10px] font-semibold tracking-widest uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-3xl font-bold text-foreground">{value}</p>
      {subtitle && (
        <p className="mt-0.5 text-xs text-muted-foreground">{subtitle}</p>
      )}
    </div>
  )
}
