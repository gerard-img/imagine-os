/**
 * ServicioPill — componente centralizado para mostrar nombres de servicio
 * con colores consistentes en toda la app.
 *
 * Usa matching por prefijo para cubrir variantes (ej: "SEO GEO", "SEO Local").
 * Si no hay match, usa gris neutro.
 */

const SERVICIO_COLORS: [string, string][] = [
  ['SEO', 'bg-emerald-100 text-emerald-700'],
  ['SEM', 'bg-blue-100 text-blue-700'],
  ['PPC', 'bg-blue-100 text-blue-700'],
  ['SM', 'bg-pink-100 text-pink-700'],
  ['Social', 'bg-pink-100 text-pink-700'],
  ['PM', 'bg-orange-100 text-orange-700'],
  ['PR', 'bg-rose-100 text-rose-700'],
  ['CRM', 'bg-cyan-100 text-cyan-700'],
  ['AUT', 'bg-violet-100 text-violet-700'],
  ['Automation', 'bg-violet-100 text-violet-700'],
  ['LOY', 'bg-teal-100 text-teal-700'],
  ['PRO', 'bg-sky-100 text-sky-700'],
  ['Programática', 'bg-sky-100 text-sky-700'],
  ['Web', 'bg-purple-100 text-purple-700'],
  ['Diseño', 'bg-purple-100 text-purple-700'],
  ['DIS', 'bg-purple-100 text-purple-700'],
  ['UXUI', 'bg-teal-100 text-teal-700'],
  ['Creas', 'bg-fuchsia-100 text-fuchsia-700'],
  ['Creativo', 'bg-fuchsia-100 text-fuchsia-700'],
  ['Branding', 'bg-amber-100 text-amber-700'],
  ['Contenido', 'bg-amber-100 text-amber-700'],
  ['Redacción', 'bg-amber-100 text-amber-700'],
  ['DATA', 'bg-indigo-100 text-indigo-700'],
  ['Analítica', 'bg-indigo-100 text-indigo-700'],
  ['Estrategia', 'bg-orange-100 text-orange-700'],
  ['Consultoría', 'bg-slate-100 text-slate-700'],
  ['Desarrollo', 'bg-indigo-100 text-indigo-700'],
]

export function getServicioColor(name: string): string {
  const match = SERVICIO_COLORS.find(([prefix]) => name.startsWith(prefix))
  return match?.[1] ?? 'bg-gray-100 text-gray-700'
}

export function ServicioPill({ name }: { name: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getServicioColor(name)}`}>
      {name}
    </span>
  )
}
