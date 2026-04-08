/**
 * DeptPill — pill con color consistente para departamentos.
 * Acepta label opcional para mostrar código en vez de nombre completo.
 */

const DEPT_COLORS: Record<string, string> = {
  'Paid Media': 'bg-blue-50 text-blue-700',
  'SEO GEO': 'bg-emerald-50 text-emerald-700',
  'Growth': 'bg-lime-50 text-lime-700',
  'Automation': 'bg-violet-50 text-violet-700',
  'Comunicación': 'bg-amber-50 text-amber-700',
  'Consultoría Accounts': 'bg-orange-50 text-orange-700',
  'Diseño': 'bg-purple-50 text-purple-700',
  'Desarrollo': 'bg-indigo-50 text-indigo-700',
  'Programática': 'bg-sky-50 text-sky-700',
  'Creativo': 'bg-fuchsia-50 text-fuchsia-700',
  'Producción Audiovisual': 'bg-rose-50 text-rose-700',
  'Consultoría IA': 'bg-cyan-50 text-cyan-700',
  'Dirección': 'bg-slate-50 text-slate-700',
  'UXUI': 'bg-teal-50 text-teal-700',
  'Trading': 'bg-yellow-50 text-yellow-700',
  'Administración': 'bg-stone-50 text-stone-700',
  'Talento': 'bg-pink-50 text-pink-700',
  'Outbound': 'bg-red-50 text-red-700',
  'Mentoring': 'bg-emerald-50 text-emerald-700',
  'Selección Personal': 'bg-pink-50 text-pink-700',
  'Formación': 'bg-amber-50 text-amber-700',
}

export function getDeptColor(name: string): string {
  return DEPT_COLORS[name] ?? 'bg-gray-50 text-gray-600'
}

export function DeptPill({ name, label }: { name: string; label?: string }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-semibold shrink-0 ${getDeptColor(name)}`}>
      {label ?? name}
    </span>
  )
}
