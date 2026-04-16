'use client'

import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus, Trash2, Loader2, Save } from 'lucide-react'
import type {
  OrdenTrabajo,
  Proyecto,
  CatalogoServicio,
  Departamento,
  Persona,
  PersonaDepartamento,
  HorasTrabajables,
  CuotaPlanificacion,
} from '@/lib/supabase/types'
import { safeDivide, clamp, formatMoney } from '@/lib/helpers'
import { resolverHorasTrabajables } from '@/lib/horas-trabajables'
import { CambiarEstadoOT } from '@/components/cambiar-estado-ot'
import { ServicioPill } from '@/components/servicio-pill'
import { ClientePill } from '@/components/cliente-pill'
import { DeptPill } from '@/components/dept-pill'
import { NumberInput } from '@/components/number-input'
import { SinServicioSelector } from './sin-servicio-selector'
import type { AsignacionLocal } from './planificador-client'

const ORDEN_CUOTAS = ['Senior', 'Specialist', 'Junior', 'Intern', 'Coordinador']

type OtCardProps = {
  ot: OrdenTrabajo
  month: string
  expanded: boolean
  onToggleExpand: () => void
  // Datos resueltos del OT
  proyecto: Proyecto | undefined
  clienteNombre: string
  servicio: CatalogoServicio | undefined
  serviciosEg: CatalogoServicio[]
  depto: Departamento | undefined
  // Asignaciones con edits locales aplicados
  asignaciones: AsignacionLocal[]
  personasDepto: Persona[]
  // Lookups para cálculos en asignaciones
  personasMap: Map<string, Persona>
  personasDepartamentos: PersonaDepartamento[]
  horasTrabajables: HorasTrabajables[]
  cuotasMap: Map<string, CuotaPlanificacion>
  cuotasVigentes: CuotaPlanificacion[]
  // Valores editables del OT
  pptoPct: number
  partidaPrevista: number
  partidaReal: number | null
  // Estado de UI
  hasLocalEdits: boolean
  isSaving: boolean
  saveError: string | undefined
  confirmDelete: boolean
  isDeletingOt: boolean
  // Callbacks
  onUpdatePpto: (pct: number) => void
  onUpdatePartidaPrevista: (val: number) => void
  onUpdatePartidaReal: (val: number | null) => void
  onUpdateAsignacion: (asigId: string, field: keyof AsignacionLocal, value: string | number) => void
  onDeleteAsignacion: (asigId: string) => void
  onAddAsignacion: () => void
  onGuardar: () => void
  onDeleteOt: () => void
}

export function OtCard({
  ot, month, expanded, onToggleExpand,
  proyecto, clienteNombre, servicio, serviciosEg, depto,
  asignaciones, personasDepto,
  personasMap, personasDepartamentos, horasTrabajables,
  cuotasMap, cuotasVigentes,
  pptoPct, partidaPrevista, partidaReal,
  hasLocalEdits, isSaving, saveError, confirmDelete, isDeletingOt,
  onUpdatePpto, onUpdatePartidaPrevista, onUpdatePartidaReal,
  onUpdateAsignacion, onDeleteAsignacion, onAddAsignacion,
  onGuardar, onDeleteOt,
}: OtCardProps) {
  const router = useRouter()

  const totalPctAsig = asignaciones.reduce((sum, a) => sum + a.porcentaje_ppto_tm, 0)
  const pctColor = totalPctAsig === 100
    ? 'text-emerald-600'
    : totalPctAsig > 100
    ? 'text-red-600'
    : 'text-amber-600'

  return (
    <div className="rounded-xl bg-white shadow-sm relative">
      {/* ── Header ── */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggleExpand() } }}
        className="w-full flex items-center gap-3 px-5 py-3.5 text-left hover:bg-muted/30 transition-colors cursor-pointer"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        )}

        <ClientePill name={clienteNombre} />
        <span
          className="text-sm font-bold text-foreground min-w-0 hover:text-primary hover:underline transition-colors cursor-pointer"
          onClick={(e) => { e.stopPropagation(); router.push(`/proyectos/${ot.proyecto_id}?mes=${month}`) }}
        >
          {proyecto?.titulo ?? '—'}
        </span>

        <CambiarEstadoOT otId={ot.id} estadoActual={ot.estado} />
        {hasLocalEdits && (
          <span className="inline-flex h-2 w-2 rounded-full bg-amber-400 shrink-0" title="Cambios sin guardar" />
        )}

        <span onClick={(e) => e.stopPropagation()}>
          {servicio ? (
            <ServicioPill name={servicio.nombre} />
          ) : (
            <SinServicioSelector otId={ot.id} servicios={serviciosEg} />
          )}
        </span>
        {depto && <DeptPill name={depto.nombre} label={depto.codigo} />}

        <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <NumberInput
            min={0} max={100}
            value={pptoPct}
            onChange={(e) => onUpdatePpto(clamp(Number(e.target.value), 0, 100))}
            className="w-14 text-foreground"
          />
          <span className="text-[10px] text-muted-foreground">% ppto</span>
        </span>

        <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <NumberInput
            min={0} step={1}
            value={partidaPrevista}
            onChange={(e) => onUpdatePartidaPrevista(Math.max(0, Number(e.target.value)))}
            className="w-20 text-blue-600"
          />
          <span className="text-[10px] text-muted-foreground">€</span>
        </span>

        <span className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <NumberInput
            min={0}
            value={partidaReal ?? ''}
            onChange={(e) => onUpdatePartidaReal(e.target.value === '' ? null : Number(e.target.value))}
            className="w-20 text-emerald-600"
            placeholder="—"
          />
          <span className="text-[10px] text-muted-foreground">real</span>
        </span>

        <span className={`text-xs font-bold shrink-0 tabular-nums w-16 text-right ${pctColor}`}>
          {totalPctAsig}% asig.
        </span>
        <span className="text-[10px] text-muted-foreground shrink-0 w-16 text-right">
          {proyecto?.tipo_partida ?? '—'}
        </span>
      </div>

      {/* ── Expanded: Asignaciones ── */}
      {expanded && (
        <div className="border-t border-border/50 px-5 pb-4 pt-3">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Asignaciones
            </p>
            {totalPctAsig !== 100 && (
              <span className="text-[10px] text-muted-foreground">(debe sumar 100%)</span>
            )}
          </div>

          {/* Cabecera de tabla */}
          <div className="grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 px-2 mb-1">
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Persona</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground">Cuota</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">% Asig.</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">Ingresos</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">Horas</span>
            <span className="text-[10px] font-semibold uppercase text-muted-foreground text-right">% Carga</span>
            <span />
          </div>

          {/* Filas */}
          {asignaciones.length === 0 ? (
            <p className="py-3 text-center text-xs text-muted-foreground">
              Sin asignaciones. Añade personas del departamento.
            </p>
          ) : (
            <div className="space-y-1">
              {asignaciones.map((a) => {
                const cuota = cuotasMap.get(a.cuota_planificacion_id)
                const ingresosAsignados = partidaPrevista * (a.porcentaje_ppto_tm / 100)
                const horasADedicar = safeDivide(ingresosAsignados, cuota?.precio_hora ?? 0)
                const horasTrab = resolverHorasTrabajables(
                  a.persona_id, month, personasMap, personasDepartamentos, horasTrabajables
                )
                const pctCarga = safeDivide(horasADedicar, horasTrab) * 100
                const cargaColor = pctCarga > 100 ? 'text-red-600' : pctCarga > 80 ? 'text-amber-600' : 'text-foreground'

                return (
                  <div
                    key={a.id}
                    className="grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 items-center rounded-lg px-2 py-1.5 hover:bg-muted/30"
                  >
                    <select
                      value={a.persona_id}
                      onChange={(e) => onUpdateAsignacion(a.id, 'persona_id', e.target.value)}
                      className="rounded border border-border bg-white px-2 py-1 text-sm outline-none focus:border-primary truncate"
                    >
                      {personasDepto.map((p) => (
                        <option key={p.id} value={p.id}>{p.persona}</option>
                      ))}
                      {!personasDepto.find((p) => p.id === a.persona_id) && (
                        <option value={a.persona_id}>
                          {personasMap.get(a.persona_id)?.persona ?? '—'}
                        </option>
                      )}
                    </select>

                    <select
                      value={a.cuota_planificacion_id}
                      onChange={(e) => onUpdateAsignacion(a.id, 'cuota_planificacion_id', e.target.value)}
                      className="rounded border border-border bg-white px-2 py-1 text-xs outline-none focus:border-primary"
                    >
                      {(() => {
                        const pEgId = personasMap.get(a.persona_id)?.empresa_grupo_id
                        return cuotasVigentes
                          .filter((c) => c.empresa_grupo_id === pEgId)
                          .sort((a, b) => {
                            const ia = ORDEN_CUOTAS.indexOf(a.nombre)
                            const ib = ORDEN_CUOTAS.indexOf(b.nombre)
                            return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib)
                          })
                          .map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nombre} ({c.precio_hora}€/h)
                            </option>
                          ))
                      })()}
                    </select>

                    <NumberInput
                      min={0} max={100}
                      value={a.porcentaje_ppto_tm}
                      onChange={(e) => onUpdateAsignacion(a.id, 'porcentaje_ppto_tm', clamp(Number(e.target.value), 0, 100))}
                      className="w-full px-2 py-1"
                    />
                    <span className="text-xs font-medium text-blue-600 text-right">
                      {formatMoney(ingresosAsignados)}
                    </span>
                    <span className="text-xs font-medium text-right">
                      {Math.round(horasADedicar)}h
                    </span>
                    <span className={`text-xs font-bold text-right ${cargaColor}`}>
                      {Math.round(pctCarga)}%
                    </span>
                    <button
                      onClick={() => onDeleteAsignacion(a.id)}
                      className="flex h-6 w-6 items-center justify-center rounded text-red-400 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}

          <button
            onClick={onAddAsignacion}
            className="mt-3 flex items-center gap-1.5 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground hover:border-foreground hover:text-foreground transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            Añadir persona
          </button>

          <div className="mt-3 flex items-center gap-3">
            {hasLocalEdits && (
              <button
                onClick={onGuardar}
                disabled={isSaving}
                className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-white hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                {isSaving
                  ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Guardando...</>
                  : <><Save className="h-3.5 w-3.5" /> Guardar cambios</>
                }
              </button>
            )}
            <button
              onClick={onDeleteOt}
              disabled={isDeletingOt}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ml-auto ${
                confirmDelete
                  ? 'bg-red-600 text-white hover:bg-red-700'
                  : 'text-red-500 hover:bg-red-50'
              }`}
            >
              {isDeletingOt
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Trash2 className="h-3.5 w-3.5" />
              }
              {confirmDelete ? '¿Eliminar OT y asignaciones?' : 'Eliminar OT'}
            </button>
            {saveError && <p className="text-xs text-destructive">{saveError}</p>}
          </div>

          {/* Fila de totales */}
          {asignaciones.length > 0 && (
            <div className="mt-3 border-t border-border pt-2 grid grid-cols-[1fr_100px_80px_100px_90px_90px_40px] gap-2 px-2">
              <span className="text-[10px] font-bold uppercase text-muted-foreground">TOTAL</span>
              <span />
              <span className={`text-xs font-bold text-right ${pctColor}`}>{totalPctAsig}%</span>
              <span className="text-xs font-bold text-blue-600 text-right">
                {formatMoney(asignaciones.reduce((sum, a) => sum + partidaPrevista * (a.porcentaje_ppto_tm / 100), 0))}
              </span>
              <span className="text-xs font-bold text-right">
                {Math.round(
                  asignaciones.reduce((sum, a) => {
                    const cuota = cuotasMap.get(a.cuota_planificacion_id)
                    const ing = partidaPrevista * (a.porcentaje_ppto_tm / 100)
                    return sum + safeDivide(ing, cuota?.precio_hora ?? 0)
                  }, 0)
                )}h
              </span>
              <span /><span />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
