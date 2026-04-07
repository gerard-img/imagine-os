'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { AlertTriangle } from 'lucide-react'
import { safeDivide, formatMoney, resolverHoras } from '@/lib/helpers'
import { MonthNavigator } from '@/components/month-navigator'
import { getClienteColor } from '@/components/cliente-pill'
import { KpiCard } from '@/components/kpi-card'
import type {
  OrdenTrabajo, Asignacion, Persona, Proyecto, Empresa,
  CuotaPlanificacion, HorasTrabajables, PersonaDepartamento,
  EmpresaGrupo, CatalogoServicio, Departamento,
} from '@/lib/supabase/types'

// ── Tipos ──────────────────────────────────────────────────────────────────────

type ProyectoDetalle = {
  proyectoId: string
  titulo: string
  clienteNombre: string
  servicioNombre: string
  horas: number
}

type CargaPersona = {
  personaId: string
  personaNombre: string
  empresaGrupoId: string
  departamentoId: string | null
  subtitulo: string
  horasDisponibles: number
  horasAsignadas: number
  pctCarga: number
  proyectos: ProyectoDetalle[]
}

type EstadoCarga = 'Todos' | 'Sobrecargado' | 'En límite' | 'Disponible' | 'Sin asignar'

type Props = {
  ordenesTrabajo: OrdenTrabajo[]
  asignaciones: Asignacion[]
  personas: Persona[]
  proyectos: Proyecto[]
  empresas: Empresa[]
  cuotas: CuotaPlanificacion[]
  horasTrabajables: HorasTrabajables[]
  personasDepartamentos: PersonaDepartamento[]
  empresasGrupo: EmpresaGrupo[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
}

// ── Barra de carga ─────────────────────────────────────────────────────────────

function cargaColor(pct: number): { text: string; bg: string } {
  if (pct === 0 || pct > 110) return { text: 'text-red-600', bg: 'bg-red-500' }
  if (pct > 90) return { text: 'text-emerald-600', bg: 'bg-emerald-500' }
  if (pct > 75) return { text: 'text-amber-600', bg: 'bg-amber-400' }
  return { text: 'text-orange-500', bg: 'bg-orange-400' }
}

function BarraCarga({ pct, horas, disponibles }: { pct: number; horas: number; disponibles: number }) {
  const exceso = pct > 110
  const fillPct = Math.min(pct, 100)
  const { bg } = cargaColor(pct)
  return (
    <div className="flex items-center gap-2 min-w-[140px]">
      <div className="relative h-2 flex-1 rounded-full bg-muted overflow-hidden">
        <div className={`h-full rounded-full transition-all ${bg}`} style={{ width: `${fillPct}%` }} />
      </div>
      {exceso && (
        <span className="text-[10px] font-bold text-red-600 shrink-0">
          +{Math.round(horas - disponibles)}h
        </span>
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function CargasClient({
  ordenesTrabajo, asignaciones, personas, proyectos, empresas,
  cuotas, horasTrabajables, personasDepartamentos, empresasGrupo, servicios, departamentos,
}: Props) {
  // Lookup maps
  const ordenMap = useMemo(() => new Map(ordenesTrabajo.map((o) => [o.id, o])), [ordenesTrabajo])
  const proyectoMap = useMemo(() => new Map(proyectos.map((p) => [p.id, p])), [proyectos])
  const empresaMap = useMemo(() => new Map(empresas.map((e) => [e.id, e])), [empresas])
  const cuotaMap = useMemo(() => new Map(cuotas.map((c) => [c.id, c])), [cuotas])
  const servicioMap = useMemo(() => new Map(servicios.map((s) => [s.id, s])), [servicios])
  const egMap = useMemo(() => new Map(empresasGrupo.map((eg) => [eg.id, eg])), [empresasGrupo])

  // Meses disponibles
  const mesesDisponibles = useMemo(() => {
    const meses = [...new Set(ordenesTrabajo.map((o) => o.mes_anio))].sort()
    return meses.length > 0 ? meses : ['2026-01-01']
  }, [ordenesTrabajo])

  const [month, setMonth] = useState(mesesDisponibles[mesesDisponibles.length - 1])
  const [egFilter, setEgFilter] = useState('Todos')
  const [deptFilter, setDeptFilter] = useState('Todos')
  const [estadoCargaFilter, setEstadoCargaFilter] = useState<EstadoCarga>('Todos')
  const [estadoOTFilter, setEstadoOTFilter] = useState('Todos')
  const [soloConAsignacion, setSoloConAsignacion] = useState(false)
  const [ordenarPor, setOrdenarPor] = useState<'carga' | 'nombre'>('carga')

  // Departamentos filtrados por empresa seleccionada
  const deptosFiltrados = useMemo(() => {
    if (egFilter === 'Todos') return departamentos
    return departamentos.filter((d) => d.empresa_grupo_id === egFilter)
  }, [departamentos, egFilter])

  // Mapa departamento → objeto
  const deptMap = useMemo(() => new Map(departamentos.map((d) => [d.id, d])), [departamentos])

  // Cálculo principal: una fila por persona × departamento
  const cargas = useMemo<CargaPersona[]>(() => {
    const activas = personas.filter((p) => p.activo)

    // Función auxiliar que construye una CargaPersona
    function buildCarga(persona: Persona, deptId: string | null, subtitulo: string): CargaPersona {
      const deptIds = personasDepartamentos
        .filter((pd) => pd.persona_id === persona.id)
        .map((pd) => pd.departamento_id)
      const horasDisponibles = resolverHoras(
        persona.id, month, persona.empresa_grupo_id, deptIds, horasTrabajables
      )

      // Asignaciones de esta persona en este mes (con filtro de estado OT)
      const asigsMes = asignaciones.filter((a) => {
        const orden = ordenMap.get(a.orden_trabajo_id)
        if (!orden || orden.mes_anio !== month || a.persona_id !== persona.id) return false
        if (estadoOTFilter !== 'Todos' && orden.estado !== estadoOTFilter) return false
        return true
      })

      // Calcular horas y desglose por proyecto
      let horasAsignadas = 0
      const proyectosDetalle: ProyectoDetalle[] = []

      for (const a of asigsMes) {
        const orden = ordenMap.get(a.orden_trabajo_id)
        const cuota = cuotaMap.get(a.cuota_planificacion_id)
        if (!orden || !cuota) continue

        const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
        const horas = safeDivide(ingresos, cuota.precio_hora)
        horasAsignadas += horas

        const proyecto = proyectoMap.get(orden.proyecto_id)
        const empresa = proyecto?.empresa_id ? empresaMap.get(proyecto.empresa_id) : undefined
        const servicio = orden.servicio_id ? servicioMap.get(orden.servicio_id) : undefined

        proyectosDetalle.push({
          proyectoId: orden.proyecto_id,
          titulo: proyecto?.titulo ?? '—',
          clienteNombre: empresa?.nombre_interno ?? empresa?.nombre_legal ?? 'Interno',
          servicioNombre: servicio?.nombre ?? '—',
          horas,
        })
      }

      proyectosDetalle.sort((a, b) => b.horas - a.horas)

      return {
        personaId: persona.id,
        personaNombre: persona.persona,
        empresaGrupoId: persona.empresa_grupo_id,
        departamentoId: deptId,
        subtitulo,
        horasDisponibles,
        horasAsignadas,
        pctCarga: horasDisponibles > 0 ? safeDivide(horasAsignadas, horasDisponibles) * 100 : 0,
        proyectos: proyectosDetalle,
      }
    }

    const filas: CargaPersona[] = []

    for (const persona of activas) {
      const eg = egMap.get(persona.empresa_grupo_id)
      const codigoEg = eg?.codigo ?? '—'
      const deptIdsPersona = personasDepartamentos
        .filter((pd) => pd.persona_id === persona.id)
        .map((pd) => pd.departamento_id)

      if (deptIdsPersona.length === 0) {
        // Sin departamento: mostrar solo código empresa
        filas.push(buildCarga(persona, null, codigoEg))
      } else {
        // Una fila por departamento
        for (const dId of deptIdsPersona) {
          const dept = deptMap.get(dId)
          const sub = `${codigoEg} — ${dept?.codigo ?? '—'}`
          filas.push(buildCarga(persona, dId, sub))
        }
      }
    }

    return filas
      .filter((c) => {
        if (egFilter !== 'Todos' && c.empresaGrupoId !== egFilter) return false
        if (deptFilter !== 'Todos' && c.departamentoId !== deptFilter) return false
        if (estadoCargaFilter !== 'Todos') {
          if (estadoCargaFilter === 'Sobrecargado' && c.pctCarga <= 110) return false
          if (estadoCargaFilter === 'En límite' && (c.pctCarga <= 75 || c.pctCarga > 110)) return false
          if (estadoCargaFilter === 'Disponible' && (c.pctCarga <= 0 || c.pctCarga > 75)) return false
          if (estadoCargaFilter === 'Sin asignar' && c.horasAsignadas > 0) return false
        }
        if (soloConAsignacion && c.horasAsignadas === 0) return false
        return true
      })
      .sort((a, b) =>
        ordenarPor === 'carga' ? b.pctCarga - a.pctCarga : a.personaNombre.localeCompare(b.personaNombre)
      )
  }, [
    personas, month, asignaciones, ordenMap, cuotaMap, proyectoMap, empresaMap, servicioMap,
    personasDepartamentos, horasTrabajables, egMap, deptMap,
    egFilter, deptFilter, estadoCargaFilter, estadoOTFilter, soloConAsignacion, ordenarPor,
  ])

  // KPIs
  const kpis = useMemo(() => {
    const conHoras = cargas.filter((c) => c.horasDisponibles > 0)
    const mediaCarga = conHoras.length > 0
      ? Math.round(conHoras.reduce((s, c) => s + c.pctCarga, 0) / conHoras.length)
      : 0
    const sobrecargadas = cargas.filter((c) => c.pctCarga > 110).length
    const sinAsignar = cargas.filter((c) => c.horasAsignadas === 0).length
    const capacidadLibre = cargas.reduce((s, c) => s + Math.max(0, c.horasDisponibles - c.horasAsignadas), 0)
    return { total: cargas.length, mediaCarga, sobrecargadas, sinAsignar, capacidadLibre }
  }, [cargas])

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground">Cargas de Trabajo</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Ocupación y disponibilidad de cada persona por mes
          </p>
        </div>
        <MonthNavigator value={month} onChange={setMonth} />
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Media % carga"     value={`${kpis.mediaCarga}%`}               borderColor="border-t-primary" />
        <KpiCard label="Personas"          value={kpis.total}                           borderColor="border-t-blue-500" />
        <KpiCard label="Sobrecargadas"     value={kpis.sobrecargadas}                   borderColor="border-t-purple-500" />
        <KpiCard label="Capacidad libre"   value={`${Math.round(kpis.capacidadLibre)}h`} borderColor="border-t-amber-500" />
      </div>

      {/* Filtros */}
      <div className="mt-5 flex flex-wrap items-center gap-3">
        {/* Empresa grupo */}
        <select
          value={egFilter}
          onChange={(e) => { setEgFilter(e.target.value); setDeptFilter('Todos') }}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">Empresa: Todas</option>
          {empresasGrupo.map((eg) => (
            <option key={eg.id} value={eg.id}>{eg.nombre}</option>
          ))}
        </select>

        {/* Departamento / Equipo */}
        <select
          value={deptFilter}
          onChange={(e) => setDeptFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">Equipo: Todos</option>
          {deptosFiltrados.map((d) => (
            <option key={d.id} value={d.id}>{d.nombre}</option>
          ))}
        </select>

        {/* Estado OT */}
        <select
          value={estadoOTFilter}
          onChange={(e) => setEstadoOTFilter(e.target.value)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">OT: Todas</option>
          <option value="Propuesto">Propuesto</option>
          <option value="Planificado">Planificado</option>
          <option value="Confirmado">Confirmado</option>
          <option value="Facturado">Facturado</option>
        </select>

        {/* Estado de carga */}
        <select
          value={estadoCargaFilter}
          onChange={(e) => setEstadoCargaFilter(e.target.value as EstadoCarga)}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="Todos">Estado: Todos</option>
          <option value="Sobrecargado">Sobrecargado (&gt;100%)</option>
          <option value="En límite">En límite (80–100%)</option>
          <option value="Disponible">Disponible (&lt;80%)</option>
          <option value="Sin asignar">Sin asignar</option>
        </select>

        {/* Ordenar */}
        <select
          value={ordenarPor}
          onChange={(e) => setOrdenarPor(e.target.value as 'carga' | 'nombre')}
          className="rounded-lg border border-border bg-white px-3 py-2 text-sm outline-none focus:border-primary"
        >
          <option value="carga">Ordenar: Mayor carga</option>
          <option value="nombre">Ordenar: Nombre</option>
        </select>

        {/* Solo con asignaciones */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={soloConAsignacion}
            onChange={(e) => setSoloConAsignacion(e.target.checked)}
            className="h-4 w-4 rounded border-border accent-primary"
          />
          <span className="text-sm text-muted-foreground">Solo con asignaciones</span>
        </label>
      </div>

      {/* Tabla */}
      <div className="mt-4 rounded-xl bg-white shadow-sm overflow-hidden">
        {/* Cabecera */}
        <div className="grid grid-cols-[200px_80px_80px_72px_160px_1fr] gap-4 px-5 py-2.5 border-b border-border bg-muted/30">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Persona</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Disponible</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Asignado</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground text-right">% Carga</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Ocupación</span>
          <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Proyectos</span>
        </div>

        {cargas.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No hay personas para este mes con los filtros seleccionados.
          </p>
        ) : (
          <div className="divide-y divide-border">
            {cargas.map((c) => {
              const exceso = c.pctCarga > 110
              const { text: pctColor } = cargaColor(c.pctCarga)

              return (
                <div
                  key={`${c.personaId}-${c.departamentoId ?? 'sin-dept'}`}
                  className={`grid grid-cols-[200px_80px_80px_72px_160px_1fr] gap-4 px-5 py-3.5 items-center transition-colors hover:bg-muted/20 ${exceso ? 'bg-red-50/40' : ''}`}
                >
                  {/* Persona */}
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <Link
                      href={`/planificador?mes=${month}`}
                      className="group inline-flex items-center gap-1 text-sm font-semibold text-foreground hover:text-primary transition-colors truncate"
                      title="Ver en Planificador"
                    >
                      {c.personaNombre}
                      <ArrowUpRight className="h-3 w-3 shrink-0 opacity-0 group-hover:opacity-60 transition-opacity" />
                    </Link>
                    <span className="text-[10px] text-muted-foreground truncate">{c.subtitulo}</span>
                  </div>

                  {/* Horas disponibles */}
                  <span className="text-sm text-muted-foreground text-right">
                    {c.horasDisponibles > 0 ? `${Math.round(c.horasDisponibles)}h` : '—'}
                  </span>

                  {/* Horas asignadas */}
                  <span className={`text-sm text-right ${c.horasAsignadas > 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                    {c.horasAsignadas > 0 ? `${Math.round(c.horasAsignadas)}h` : '—'}
                  </span>

                  {/* % Carga */}
                  <div className="flex items-center justify-end gap-1">
                    {exceso && <AlertTriangle className="h-3.5 w-3.5 text-red-500 shrink-0" />}
                    <span className={`text-sm tabular-nums font-bold ${pctColor}`}>
                      {c.horasDisponibles > 0 ? `${Math.round(c.pctCarga)}%` : '—'}
                    </span>
                  </div>

                  {/* Barra */}
                  {c.horasDisponibles > 0 ? (
                    <BarraCarga pct={c.pctCarga} horas={c.horasAsignadas} disponibles={c.horasDisponibles} />
                  ) : (
                    <span className="text-[11px] text-muted-foreground italic">Sin horas configuradas</span>
                  )}

                  {/* Desglose proyectos */}
                  <div className="flex flex-wrap gap-1.5 min-w-0">
                    {c.proyectos.length === 0 ? (
                      <span className="text-xs text-muted-foreground italic">Sin asignaciones</span>
                    ) : (
                      c.proyectos.slice(0, 4).map((p, i) => (
                        <Link
                          key={i}
                          href={`/proyectos/${p.proyectoId}`}
                          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold transition-opacity hover:opacity-80 ${getClienteColor(p.clienteNombre)}`}
                          title={`${p.titulo} · ${p.servicioNombre}`}
                        >
                          <span className="max-w-[100px] truncate">{p.clienteNombre}</span>
                          <span className="opacity-70 shrink-0">{Math.round(p.horas)}h</span>
                        </Link>
                      ))
                    )}
                    {c.proyectos.length > 4 && (
                      <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        +{c.proyectos.length - 4} más
                      </span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
