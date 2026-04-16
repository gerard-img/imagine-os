'use client'

import { Pencil, Plus } from 'lucide-react'
import { formatMoney, safeDivide } from '@/lib/helpers'
import { OtFormSheet } from '../../ordenes-trabajo/ot-form-sheet'
import { AsignacionFormSheet } from '../../asignaciones/asignacion-form-sheet'
import { ServicioPill } from '@/components/servicio-pill'
import { SinServicioSelector } from '@/components/sin-servicio-selector'
import type {
  OrdenTrabajo,
  Asignacion,
  CatalogoServicio,
  CuotaPlanificacion,
  Persona,
  Proyecto,
  Departamento,
  Empresa,
} from '@/lib/supabase/types'

type Props = {
  ot: OrdenTrabajo
  servicio: CatalogoServicio | undefined
  otAsignaciones: Asignacion[]
  pctAsignado: number
  personaMap: Map<string, Persona>
  cuotaMap: Map<string, CuotaPlanificacion>
  proyecto: Proyecto
  proyectos: Proyecto[]
  ordenes: OrdenTrabajo[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  cuotas: CuotaPlanificacion[]
  asignacionesProyecto: Asignacion[]
}

export function OtRowWithAsignaciones({
  ot,
  servicio,
  otAsignaciones,
  pctAsignado,
  personaMap,
  cuotaMap,
  proyecto,
  proyectos,
  ordenes,
  servicios,
  departamentos,
  personas,
  empresas,
  cuotas,
  asignacionesProyecto,
}: Props) {
  return (
    <>
      {/* Fila de la OT */}
      <tr className="border-t border-border/50">
        <td className="py-2.5">
          <div className="flex items-center gap-1.5">
            {servicio ? (
              <ServicioPill name={servicio.nombre} />
            ) : (
              <SinServicioSelector
                otId={ot.id}
                servicios={servicios.filter((s) => s.empresa_grupo_id === proyecto.empresa_grupo_id)}
              />
            )}
            {ot.titulo && (
              <span className="text-[11px] text-muted-foreground truncate">{ot.titulo}</span>
            )}
          </div>
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {ot.porcentaje_ppto_mes}%
        </td>
        <td className="py-2.5 text-right font-medium text-blue-600">
          {formatMoney(ot.partida_prevista)}
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {ot.partida_real !== null ? formatMoney(ot.partida_real) : '—'}
        </td>
        <td className="py-2.5 text-right text-muted-foreground">
          {(() => {
            const hPlan = otAsignaciones.reduce((sum, a) => {
              const cuota = cuotaMap.get(a.cuota_planificacion_id)
              if (!cuota || cuota.precio_hora <= 0) return sum
              const ingresos = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
              return sum + safeDivide(ingresos, cuota.precio_hora)
            }, 0)
            return hPlan > 0 ? `${Math.round(hPlan)}h` : '—'
          })()}
        </td>
        <td className="py-2.5 text-right font-medium text-emerald-600">
          {(() => {
            const hReal = otAsignaciones.reduce((sum, a) => sum + (a.horas_reales ?? 0), 0)
            return hReal > 0 ? `${hReal}h` : '—'
          })()}
        </td>
        <td className="py-2.5">
          <div className="flex items-center justify-end gap-1">
            <OtFormSheet
              proyectos={proyectos}
              servicios={servicios}
              departamentos={departamentos}
              personas={personas}
              empresas={empresas}
              ordenesTrabajo={ordenes}
              ot={ot}
            />
            <AsignacionFormSheet
              ordenesTrabajo={ordenes}
              proyectos={proyectos}
              empresas={empresas}
              personas={personas}
              cuotas={cuotas}
              asignaciones={asignacionesProyecto}
              servicios={servicios}
              departamentos={departamentos}
              preselectedOrdenId={ot.id}
              trigger={
                <button
                  className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors"
                  title="Añadir asignación"
                >
                  <Plus className="h-3.5 w-3.5" />
                </button>
              }
            />
          </div>
        </td>
      </tr>

      {/* Sub-filas: asignaciones de esta OT */}
      {otAsignaciones.map((a) => {
        const persona = personaMap.get(a.persona_id)
        const cuota = cuotaMap.get(a.cuota_planificacion_id)
        const ingresos = (ot.partida_prevista * a.porcentaje_ppto_tm) / 100
        const horas = safeDivide(ingresos, cuota?.precio_hora ?? 0)

        return (
          <tr key={a.id} className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
            <td className="py-1.5 pl-6">
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground/50">└</span>
                <span className="inline-flex rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-semibold text-blue-700">
                  {persona?.persona ?? '—'}
                </span>
                <span className="text-[11px] text-muted-foreground">
                  {cuota?.nombre ?? '—'}
                </span>
              </div>
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {a.porcentaje_ppto_tm}%
            </td>
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {formatMoney(ingresos)}
            </td>
            <td className="py-1.5" />
            <td className="py-1.5 text-right text-[11px] text-muted-foreground">
              {horas.toFixed(1)}h
            </td>
            <td className="py-1.5 text-right text-[11px] font-medium text-emerald-600">
              {a.horas_reales != null ? `${a.horas_reales}h` : '—'}
            </td>
            <td className="py-1.5">
              <div className="flex items-center justify-end">
                <AsignacionFormSheet
                  ordenesTrabajo={ordenes}
                  proyectos={proyectos}
                  empresas={empresas}
                  personas={personas}
                  cuotas={cuotas}
                  asignaciones={asignacionesProyecto}
                  servicios={servicios}
                  departamentos={departamentos}
                  asignacion={a}
                  trigger={
                    <button className="rounded p-1 text-muted-foreground hover:text-primary hover:bg-muted transition-colors">
                      <Pencil className="h-3 w-3" />
                    </button>
                  }
                />
              </div>
            </td>
          </tr>
        )
      })}

      {/* Indicador de % asignado */}
      {otAsignaciones.length > 0 && (
        <tr className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
          <td colSpan={7} className="py-1 pl-6">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground/50">└</span>
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-muted-foreground">
                  Asignado: <span className={`font-bold ${pctAsignado >= 100 ? 'text-emerald-600' : 'text-amber-600'}`}>{pctAsignado}%</span>
                </span>
                {pctAsignado < 100 && (
                  <span className="text-[10px] text-muted-foreground">
                    Disponible: <span className="font-bold text-blue-600">{100 - pctAsignado}%</span>
                  </span>
                )}
              </div>
            </div>
          </td>
        </tr>
      )}

      {/* Mensaje si no hay asignaciones */}
      {otAsignaciones.length === 0 && (
        <tr className="border-t border-dashed border-border/30 bg-[#F9FAFB]">
          <td colSpan={7} className="py-1.5 pl-6">
            <span className="text-[11px] text-muted-foreground/60 italic">Sin asignaciones</span>
          </td>
        </tr>
      )}
    </>
  )
}
