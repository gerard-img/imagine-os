/**
 * ClientePill — pill con color asignado por hash del nombre.
 * Cada cliente siempre tendrá el mismo color en toda la app.
 */

const PALETTE: string[] = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-pink-100 text-pink-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
  'bg-indigo-100 text-indigo-700',
  'bg-rose-100 text-rose-700',
  'bg-teal-100 text-teal-700',
  'bg-lime-100 text-lime-700',
  'bg-fuchsia-100 text-fuchsia-700',
  'bg-sky-100 text-sky-700',
  'bg-violet-100 text-violet-700',
  'bg-red-100 text-red-700',
]

function hashName(name: string): number {
  let hash = 0
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash + name.charCodeAt(i)) | 0
  }
  return Math.abs(hash)
}

export function getClienteColor(name: string): string {
  return PALETTE[hashName(name) % PALETTE.length]
}

export function ClientePill({ name }: { name: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${getClienteColor(name)}`}>
      {name}
    </span>
  )
}
