/**
 * ServicioPill — componente centralizado para mostrar nombres de servicio
 * con colores consistentes en toda la app.
 *
 * Usa matching por prefijo para cubrir variantes (ej: "SEO GEO", "SEO Local").
 * Si no hay match, usa gris neutro.
 */

const SERVICIO_COLORS: [string, string][] = [
  ['SEO', 'bg-emerald-50 text-emerald-700'],
  ['SEM', 'bg-blue-50 text-blue-700'],
  ['PPC', 'bg-blue-50 text-blue-700'],
  ['SM', 'bg-pink-50 text-pink-700'],
  ['Social', 'bg-pink-50 text-pink-700'],
  ['PM', 'bg-orange-50 text-orange-700'],
  ['PR', 'bg-rose-50 text-rose-700'],
  ['CRM', 'bg-cyan-50 text-cyan-700'],
  ['AUT', 'bg-violet-50 text-violet-700'],
  ['Automation', 'bg-violet-50 text-violet-700'],
  ['LOY', 'bg-teal-50 text-teal-700'],
  ['PRO', 'bg-sky-50 text-sky-700'],
  ['Programática', 'bg-sky-50 text-sky-700'],
  ['Web', 'bg-purple-50 text-purple-700'],
  ['Diseño', 'bg-purple-50 text-purple-700'],
  ['DIS', 'bg-purple-50 text-purple-700'],
  ['UXUI', 'bg-teal-50 text-teal-700'],
  ['Creas', 'bg-fuchsia-50 text-fuchsia-700'],
  ['Creativo', 'bg-fuchsia-50 text-fuchsia-700'],
  ['Branding', 'bg-amber-50 text-amber-700'],
  ['Contenido', 'bg-amber-50 text-amber-700'],
  ['Redacción', 'bg-amber-50 text-amber-700'],
  ['DATA', 'bg-indigo-50 text-indigo-700'],
  ['Analítica', 'bg-indigo-50 text-indigo-700'],
  ['Estrategia', 'bg-orange-50 text-orange-700'],
  ['Consultoría', 'bg-slate-50 text-slate-700'],
  ['Desarrollo', 'bg-indigo-50 text-indigo-700'],
]

export function getServicioColor(name: string): string {
  const match = SERVICIO_COLORS.find(([prefix]) => name.startsWith(prefix))
  return match?.[1] ?? 'bg-gray-50 text-gray-600'
}

export function ServicioPill({ name }: { name: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${getServicioColor(name)}`}>
      {name}
    </span>
  )
}
