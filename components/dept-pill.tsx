/**
 * DeptPill — pill con color consistente para departamentos.
 * Acepta label opcional para mostrar código en vez de nombre completo.
 */

const DEPT_COLORS: Record<string, string> = {
  'Paid Media': 'bg-blue-100 text-blue-700',
  'SEO GEO': 'bg-emerald-100 text-emerald-700',
  'Growth': 'bg-lime-100 text-lime-700',
  'Automation': 'bg-violet-100 text-violet-700',
  'Comunicación': 'bg-amber-100 text-amber-700',
  'Consultoría Accounts': 'bg-orange-100 text-orange-700',
  'Diseño': 'bg-purple-100 text-purple-700',
  'Desarrollo': 'bg-indigo-100 text-indigo-700',
  'Programática': 'bg-sky-100 text-sky-700',
  'Creativo': 'bg-fuchsia-100 text-fuchsia-700',
  'Producción Audiovisual': 'bg-rose-100 text-rose-700',
  'Consultoría IA': 'bg-cyan-100 text-cyan-700',
  'Dirección': 'bg-slate-100 text-slate-700',
  'UXUI': 'bg-teal-100 text-teal-700',
  'Trading': 'bg-yellow-100 text-yellow-700',
  'Administración': 'bg-stone-100 text-stone-700',
  'Talento': 'bg-pink-100 text-pink-700',
  'Outbound': 'bg-red-100 text-red-700',
  'Mentoring': 'bg-emerald-100 text-emerald-700',
  'Selección Personal': 'bg-pink-100 text-pink-700',
  'Formación': 'bg-amber-100 text-amber-700',
}

export function getDeptColor(name: string): string {
  return DEPT_COLORS[name] ?? 'bg-gray-100 text-gray-700'
}

export function DeptPill({ name, label }: { name: string; label?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${getDeptColor(name)}`}>
      {label ?? name}
    </span>
  )
}
