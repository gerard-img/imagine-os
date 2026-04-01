'use client'

import type { FilaHeatmap } from '@/lib/helpers-informes'

type Props = {
  datos: FilaHeatmap[]
  mesActual: string
}

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

/** Color de fondo según porcentaje de carga */
function celdaStyle(pct: number, ht: number): { bg: string; text: string } {
  if (ht === 0) return { bg: 'bg-gray-50', text: 'text-gray-300' }
  if (pct === 0) return { bg: 'bg-gray-50', text: 'text-gray-400' }
  if (pct > 100) return { bg: 'bg-red-100', text: 'text-red-700' }
  if (pct >= 90) return { bg: 'bg-red-50', text: 'text-red-600' }
  if (pct >= 80) return { bg: 'bg-emerald-100', text: 'text-emerald-700' }
  if (pct >= 60) return { bg: 'bg-emerald-50', text: 'text-emerald-600' }
  if (pct >= 40) return { bg: 'bg-amber-50', text: 'text-amber-600' }
  return { bg: 'bg-orange-50', text: 'text-orange-600' }
}

function mediaStyle(pct: number): string {
  if (pct === 0) return 'text-muted-foreground'
  if (pct > 90) return 'text-red-600'
  if (pct >= 80) return 'text-emerald-600'
  if (pct >= 60) return 'text-amber-600'
  return 'text-orange-500'
}

export function HeatmapCarga({ datos, mesActual }: Props) {
  if (datos.length === 0) {
    return (
      <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
          Carga por departamento
        </p>
        <p className="py-8 text-center text-sm text-muted-foreground">
          No hay datos de departamentos para este año.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm border border-border">
      <div className="mb-4">
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Carga por departamento
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          % utilización mensual — año completo
        </p>
      </div>

      {/* Leyenda */}
      <div className="flex items-center gap-3 mb-3">
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-orange-50 border border-orange-200" />
          <span className="text-[10px] text-muted-foreground">&lt;40%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-amber-50 border border-amber-200" />
          <span className="text-[10px] text-muted-foreground">40-60%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-emerald-50 border border-emerald-200" />
          <span className="text-[10px] text-muted-foreground">60-80%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-emerald-100 border border-emerald-300" />
          <span className="text-[10px] text-muted-foreground">80-90%</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="h-3 w-3 rounded-sm bg-red-50 border border-red-200" />
          <span className="text-[10px] text-muted-foreground">&gt;90%</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr>
              <th className="py-1.5 pr-3 text-left text-[10px] font-semibold uppercase tracking-wider text-muted-foreground w-[140px] sticky left-0 bg-white z-10">
                Departamento
              </th>
              {MESES_CORTOS.map((m, i) => {
                const mesFmt = `${mesActual.slice(0, 4)}-${String(i + 1).padStart(2, '0')}-01`
                const esActual = mesFmt === mesActual
                return (
                  <th
                    key={m}
                    className={`py-1.5 px-0.5 text-center text-[10px] font-semibold uppercase tracking-wider ${
                      esActual ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {m}
                  </th>
                )
              })}
              <th className="py-1.5 pl-3 text-right text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                Media
              </th>
            </tr>
          </thead>
          <tbody>
            {datos.map((fila) => (
              <tr key={fila.departamentoId}>
                <td className="py-1 pr-3 text-[12px] font-medium text-foreground truncate max-w-[140px] sticky left-0 bg-white z-10">
                  {fila.departamentoNombre}
                </td>
                {fila.celdas.map((celda, i) => {
                  const style = celdaStyle(celda.pctCarga, celda.horasTrabajables)
                  const mesFmt = `${mesActual.slice(0, 4)}-${String(i + 1).padStart(2, '0')}-01`
                  const esActual = mesFmt === mesActual
                  return (
                    <td key={celda.mes} className="py-1 px-0.5">
                      <div
                        className={`rounded px-1 py-1.5 text-center text-[11px] tabular-nums font-medium ${style.bg} ${style.text} ${
                          esActual ? 'ring-2 ring-primary/30' : ''
                        }`}
                        title={`${fila.departamentoNombre} · ${MESES_CORTOS[i]}: ${Math.round(celda.horasAsignadas)}h / ${Math.round(celda.horasTrabajables)}h`}
                      >
                        {celda.horasTrabajables > 0 ? `${Math.round(celda.pctCarga)}` : '—'}
                      </div>
                    </td>
                  )
                })}
                <td className={`py-1 pl-3 text-right text-[12px] tabular-nums font-bold ${mediaStyle(fila.mediaAnual)}`}>
                  {Math.round(fila.mediaAnual)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
