'use client'

import { Suspense, useMemo } from 'react'
import { KpiCard } from '@/components/kpi-card'
import { MonthNavigator } from '@/components/month-navigator'
import { ServicioPill } from '@/components/servicio-pill'
import { SortableHeader } from '@/components/sortable-header'
import { useTableState, sortData } from '@/hooks/use-table-state'
import { safeDivide, resolverHoras } from '@/lib/helpers'
import type {
  Asignacion,
  OrdenTrabajo,
  Proyecto,
  Empresa,
  CatalogoServicio,
  CuotaPlanificacion,
  HorasTrabajables,
  PersonaDepartamento,
} from '@/lib/supabase/types'

type Props = {
  personaId: string
  personaNombre: string
  empresaGrupoId: string
  asignaciones: Asignacion[]
  ordenesTrabajo: OrdenTrabajo[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  servicios: CatalogoServicio[]
  cuotas: CuotaPlanificacion[]
  horasTrabajables: HorasTrabajables[]
  personasDepartamentos: PersonaDepartamento[]
}

function getCurrentMonth(): string {
  const now = new Date()
  const y = now.getFullYear()
  const m = String(now.getMonth() + 1).padStart(2, '0')
  return `${y}-${m}-01`
}

export default function DashboardPersonalClient(props: Props) {
  return (
    <Suspense>
      <DashboardPersonalContent {...props} />
    </Suspense>
  )
}

function DashboardPersonalContent({
  personaId, personaNombre, empresaGrupoId,
  asignaciones, ordenesTrabajo, proyectos, empresas,
  servicios, cuotas, horasTrabajables, personasDepartamentos,
}: Props) {
  const { sortCol, sortDir, toggleSort, setParams, getParam } = useTableState({
    defaultSort: { col: 'clienteNombre', dir: 'asc' },
  })

  const mes = getParam('mes', getCurrentMonth())!
  const setMes = (v: string) => setParams({ mes: v })

  // Lookup maps
  const otMap = useMemo(() => new Map(ordenesTrabajo.map((o) => [o.id, o])), [ordenesTrabajo])
  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const cuotaMap = useMemo(() => new Map(cuotas.map((c) => [c.id, c])), [cuotas])

  // Asignaciones de esta persona para el mes seleccionado
  const misAsignaciones = useMemo(() => {
    return asignaciones.filter((a) => {
      if (a.persona_id !== personaId) return false
      const ot = otMap.get(a.orden_trabajo_id)
      return ot?.mes_anio === mes
    })
  }, [asignaciones, personaId, mes, otMap])

  // Filas de la tabla: enriquecer cada asignación con datos de negocio
  const filasBase = useMemo(() => {
    return misAsignaciones.map((a) => {
      const ot = otMap.get(a.orden_trabajo_id)!
      const proyecto = proyectoMap.get(ot.proyecto_id)
      const empresa = proyecto?.empresa_id ? empresaMap.get(proyecto.empresa_id) : null
      const servicio = ot.servicio_id ? servicioMap.get(ot.servicio_id) : null
      const cuota = cuotaMap.get(a.cuota_planificacion_id)

      const ingresos = ot.partida_prevista * (a.porcentaje_ppto_tm / 100)
      const horas = safeDivide(ingresos, cuota?.precio_hora ?? 0)
      const clienteNombre = empresa
        ? (empresa.nombre_interno ?? empresa.nombre_legal ?? '—')
        : 'Interno'

      return {
        id: a.id,
        clienteNombre,
        proyectoTitulo: proyecto?.titulo ?? '—',
        servicioNombre: servicio?.nombre ?? null,
        horas,
        porcentaje: a.porcentaje_ppto_tm,
      }
    })
  }, [misAsignaciones, otMap, proyectoMap, empresaMap, servicioMap, cuotaMap])

  // Ordenar según columna activa
  const filas = useMemo(() => sortData(filasBase, sortCol, sortDir, {
    clienteNombre: (f) => f.clienteNombre,
    proyectoTitulo: (f) => f.proyectoTitulo,
    servicioNombre: (f) => f.servicioNombre,
    porcentaje: (f) => f.porcentaje,
    horas: (f) => f.horas,
  }), [filasBase, sortCol, sortDir])

  // KPIs
  const totalHoras = filas.reduce((sum, f) => sum + f.horas, 0)
  const clientesUnicos = new Set(filas.map((f) => f.clienteNombre)).size
  const proyectosUnicos = new Set(filas.map((f) => f.proyectoTitulo)).size

  // Horas disponibles (trabajables) para calcular ocupación
  const horasDisponibles = useMemo(() => {
    const deptIds = personasDepartamentos
      .filter((pd) => pd.persona_id === personaId)
      .map((pd) => pd.departamento_id)
    return resolverHoras(personaId, mes, empresaGrupoId, deptIds, horasTrabajables)
  }, [personaId, mes, empresaGrupoId, personasDepartamentos, horasTrabajables])

  const pctOcupacion = horasDisponibles > 0
    ? Math.round((totalHoras / horasDisponibles) * 100)
    : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">
            Hola, {personaNombre}
          </h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Tu resumen de trabajo del mes
          </p>
        </div>
        <MonthNavigator value={mes} onChange={setMes} />
      </div>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard
          label="Horas asignadas"
          value={`${Math.round(totalHoras)}h`}
          borderColor="border-t-primary"
        />
        <KpiCard
          label="Proyectos"
          value={proyectosUnicos}
          borderColor="border-t-blue-500"
        />
        <KpiCard
          label="Clientes"
          value={clientesUnicos}
          borderColor="border-t-purple-500"
        />
        <KpiCard
          label="Ocupación"
          value={`${pctOcupacion}%`}
          borderColor={
            pctOcupacion > 100 ? 'border-t-red-500'
              : pctOcupacion >= 85 ? 'border-t-emerald-500'
              : 'border-t-amber-500'
          }
        />
      </div>

      {/* Tabla de asignaciones */}
      <div className="mt-6 rounded-xl bg-white p-5 shadow-sm">
        <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Tus asignaciones
        </p>

        {filas.length === 0 ? (
          <div className="py-10 text-center">
            <p className="text-sm text-muted-foreground">
              No tienes asignaciones para este mes.
            </p>
            <p className="mt-1 text-xs text-muted-foreground/70">
              Prueba a navegar a otro mes con las flechas de arriba.
            </p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-2.5 text-left">
                  <SortableHeader label="Cliente" column="clienteNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} />
                </th>
                <th className="pb-2.5 text-left">
                  <SortableHeader label="Proyecto" column="proyectoTitulo" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} />
                </th>
                <th className="pb-2.5 text-left">
                  <SortableHeader label="Servicio" column="servicioNombre" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} />
                </th>
                <th className="pb-2.5">
                  <SortableHeader label="% Partida" column="porcentaje" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" />
                </th>
                <th className="pb-2.5">
                  <SortableHeader label="Horas" column="horas" currentCol={sortCol} currentDir={sortDir} onToggle={toggleSort} align="right" />
                </th>
              </tr>
            </thead>
            <tbody>
              {filas.map((r) => (
                <tr key={r.id} className="border-t border-border/50">
                  <td className="py-2.5 text-muted-foreground">{r.clienteNombre}</td>
                  <td className="py-2.5 font-medium">{r.proyectoTitulo}</td>
                  <td className="py-2.5">
                    {r.servicioNombre
                      ? <ServicioPill name={r.servicioNombre} />
                      : <span className="text-xs text-muted-foreground">—</span>
                    }
                  </td>
                  <td className="py-2.5 text-right text-muted-foreground">
                    {r.porcentaje}%
                  </td>
                  <td className="py-2.5 text-right font-semibold text-blue-600">
                    {r.horas.toFixed(1)}h
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Resumen total */}
        {filas.length > 0 && (
          <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Total
            </span>
            <span className="text-sm font-bold text-blue-600">
              {Math.round(totalHoras)}h / {horasDisponibles}h disponibles
            </span>
          </div>
        )}
      </div>
    </div>
  )
}
