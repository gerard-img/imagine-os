/**
 * ClientePill — pill con color asignado por hash del nombre.
 * Cada cliente siempre tendrá el mismo color en toda la app.
 */

const PALETTE: string[] = [
  'bg-amber-200 text-amber-900',
  'bg-emerald-200 text-emerald-900',
  'bg-rose-200 text-rose-900',
  'bg-cyan-200 text-cyan-900',
  'bg-orange-200 text-orange-900',
  'bg-teal-200 text-teal-900',
  'bg-lime-200 text-lime-900',
  'bg-pink-200 text-pink-900',
  'bg-fuchsia-200 text-fuchsia-900',
  'bg-sky-200 text-sky-900',
  'bg-violet-200 text-violet-900',
  'bg-indigo-200 text-indigo-900',
  'bg-purple-200 text-purple-900',
  'bg-red-200 text-red-900',
  'bg-yellow-200 text-yellow-900',
]

// Overrides manuales para colisiones de hash
const OVERRIDES: Record<string, string> = {}

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getClienteColor(name: string): string {
  return OVERRIDES[name] ?? PALETTE[hashName(name) % PALETTE.length]
}

export function ClientePill({ name }: { name: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${getClienteColor(name)}`}>
      {name}
    </span>
  )
}
