import {
  getEmpresasGrupo,
  getPersonas,
  getEmpresas,
  getProyectos,
  getOrdenesTrabajo,
  getAsignaciones,
  getCuotasPlanificacion,
} from '@/lib/supabase/queries'
import { safeDivide, formatMoney } from '@/lib/helpers'
import { KpiCard } from '@/components/kpi-card'
import { Building2, Users, Briefcase, FolderKanban, TrendingUp, Clock } from 'lucide-react'

export default async function DashboardPage() {
  // Todas las queries se lanzan en paralelo (no secuencial)
  const [empresasGrupo, personas, empresas, proyectos, ordenesTrabajo, asignacionesData, cuotas] =
    await Promise.all([
      getEmpresasGrupo(),
      getPersonas(),
      getEmpresas(),
      getProyectos(),
      getOrdenesTrabajo(),
      getAsignaciones(),
      getCuotasPlanificacion(),
    ])

  const totalEmpresas = empresasGrupo.length
  const personasActivas = personas.filter((p) => p.activo).length
  const clientes = empresas.filter((e) => e.estado === 'Cliente').length
  const proyectosActivos = proyectos.filter((p) => p.estado === 'Activo').length

  const ingresosMensuales = ordenesTrabajo.reduce((sum, ot) => sum + ot.partida_prevista, 0)

  const cuotasMap = new Map(cuotas.map((c) => [c.id, c]))
  const ordenesMap = new Map(ordenesTrabajo.map((ot) => [ot.id, ot]))

  const horasTotales = asignacionesData.reduce((sum, a) => {
    const orden = ordenesMap.get(a.orden_trabajo_id)
    const cuota = cuotasMap.get(a.cuota_planificacion_id)
    if (!orden || !cuota) return sum
    const ingresos = orden.partida_prevista * (a.porcentaje_ppto_tm / 100)
    return sum + safeDivide(ingresos, cuota.precio_hora)
  }, 0)

  const empresasMap = new Map(empresas.map((e) => [e.id, e]))
  const proyectosRecientes = proyectos
    .filter((p) => p.estado === 'Activo')
    .slice(0, 5)
    .map((p) => {
      const emp = p.empresa_id ? empresasMap.get(p.empresa_id) : null
      return {
        titulo: p.titulo,
        cliente: emp ? (emp.nombre_interno ?? emp.nombre_legal) : 'Interno',
        presupuesto: p.ppto_estimado,
      }
    })

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Dashboard</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">
        Vista general de Company OS
      </p>

      {/* KPI Cards */}
      <div className="mt-5 grid grid-cols-3 gap-4 lg:grid-cols-6">
        <KpiCard label="Empresas Grupo" value={totalEmpresas} borderColor="border-t-primary" />
        <KpiCard label="Personas activas" value={personasActivas} borderColor="border-t-blue-500" />
        <KpiCard label="Clientes" value={clientes} borderColor="border-t-emerald-500" />
        <KpiCard label="Proyectos activos" value={proyectosActivos} borderColor="border-t-amber-500" />
        <KpiCard label="Ingresos previstos" value={formatMoney(ingresosMensuales)} borderColor="border-t-primary" />
        <KpiCard label="Horas asignadas" value={`${Math.round(horasTotales)}h`} borderColor="border-t-indigo-500" />
      </div>

      {/* Two-column layout */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        {/* Proyectos activos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Proyectos Activos
          </p>
          {proyectosRecientes.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">Sin proyectos activos.</p>
          ) : (
            <div className="space-y-3">
              {proyectosRecientes.map((p) => (
                <div key={p.titulo} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{p.cliente} - {p.titulo}</p>
                  </div>
                  <span className="text-sm font-bold text-blue-600">{formatMoney(p.presupuesto)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Resumen rápido */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-4">
            Resumen Rápido
          </p>
          <dl className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-4 w-4" /> Empresas del grupo
              </dt>
              <dd className="font-bold">{totalEmpresas}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Users className="h-4 w-4" /> Miembros del equipo
              </dt>
              <dd className="font-bold">{personasActivas}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Briefcase className="h-4 w-4" /> Clientes activos
              </dt>
              <dd className="font-bold">{clientes}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <FolderKanban className="h-4 w-4" /> Proyectos activos
              </dt>
              <dd className="font-bold">{proyectosActivos}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="h-4 w-4" /> Ingresos previstos
              </dt>
              <dd className="font-bold text-blue-600">{formatMoney(ingresosMensuales)}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Clock className="h-4 w-4" /> Horas asignadas
              </dt>
              <dd className="font-bold text-blue-600">{Math.round(horasTotales)}h</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
