/**
 * InfoRow — fila label/valor para cards de detalle (persona, empresa, EG, etc.).
 * Si se pasa `children`, se renderizan en lugar de `value`.
 */

export function InfoRow({ label, value, children }: {
  label: string
  value?: string | null
  children?: React.ReactNode
}) {
  return (
    <div className="flex justify-between">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-semibold text-right">{children ?? value ?? '—'}</dd>
    </div>
  )
}
