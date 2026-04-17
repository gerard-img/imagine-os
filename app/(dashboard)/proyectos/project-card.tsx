'use client'

import { useRouter } from 'next/navigation'
import { formatMoney, formatDate } from '@/lib/helpers'
import { CambiarEstadoProyecto } from '@/components/cambiar-estado-proyecto'
import { ClientePill } from '@/components/cliente-pill'
import { DeptPill } from '@/components/dept-pill'
import { BarraTiempo } from './barra-tiempo'
import { ProyectoFormSheet } from './proyecto-form-sheet'
import { ProyectoOtAction } from './proyecto-ot-action'
import { Archive, ArchiveRestore, Trash2, RotateCcw, Loader2 } from 'lucide-react'
import type {
  Proyecto,
  Empresa,
  EmpresaGrupo,
  Departamento,
  Persona,
  CatalogoServicio,
} from '@/lib/supabase/types'

type ArchivoVista = 'activos' | 'archivados' | 'eliminados'

type ProjectCardProps = {
  p: Proyecto
  compact?: boolean
  archivoVista: ArchivoVista
  empresaMap: Map<string, Empresa>
  empresaGrupoMap: Map<string, EmpresaGrupo>
  proyectoDeptIds: Map<string, string[]>
  departamentoMap: Map<string, Departamento>
  // Para ProyectoOtAction y ProyectoFormSheet
  proyectos: Proyecto[]
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  empresasGrupo: EmpresaGrupo[]
  // Estado de acciones
  actionLoading: string | null
  confirmDeleteId: string | null
  onArchivar: (id: string) => void
  onDesarchivar: (id: string) => void
  onEliminar: (id: string) => void
  onRestaurar: (id: string) => void
}

export function ProjectCard({
  p, compact = false, archivoVista,
  empresaMap, empresaGrupoMap, proyectoDeptIds, departamentoMap,
  proyectos, servicios, departamentos, personas, empresas, empresasGrupo,
  actionLoading, confirmDeleteId,
  onArchivar, onDesarchivar, onEliminar, onRestaurar,
}: ProjectCardProps) {
  const router = useRouter()

  const empresa = p.empresa_id ? empresaMap.get(p.empresa_id) : null
  const cliente = empresa ? (empresa.nombre_interno ?? empresa.nombre_legal ?? '—') : 'Interno'
  const empresaGrupo = empresaGrupoMap.get(p.empresa_grupo_id)
  const deptIds = proyectoDeptIds.get(p.id) ?? []
  const depts = deptIds.map((id) => departamentoMap.get(id)).filter(Boolean)

  return (
    <div
      onClick={() => router.push(`/proyectos/${p.id}`)}
      className={`rounded-xl bg-white shadow-sm border border-transparent hover:border-primary/20 transition-colors cursor-pointer ${compact ? 'px-4 py-3' : 'px-5 py-4'}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className={`flex items-center gap-2 ${compact ? '' : 'flex-wrap'}`}>
            <ClientePill name={cliente} />
            <p className={`font-bold text-foreground truncate ${compact ? 'text-xs' : 'text-sm'}`}>
              {p.titulo}
            </p>
            {!compact && depts.map((d) => (
              <DeptPill key={d!.id} name={d!.nombre} label={d!.codigo} />
            ))}
          </div>
          {!compact && (
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span>{empresaGrupo?.codigo ?? '—'}</span>
              <span>·</span>
              <span>{p.tipo_proyecto}</span>
              <span>·</span>
              <span>{p.tipo_partida}</span>
              {p.fecha_activacion && (
                <>
                  <span>·</span>
                  <span>Desde {formatDate(p.fecha_activacion!)}</span>
                </>
              )}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className={`font-bold text-blue-600 ${compact ? 'text-xs' : 'text-sm'}`}>
            {formatMoney(p.ppto_estimado)}
          </span>
          {!compact && <CambiarEstadoProyecto proyectoId={p.id} estadoActual={p.estado} />}
        </div>
      </div>

      <BarraTiempo proyecto={p} />

      {!compact && (
        <div className="mt-2 flex items-center gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
          {archivoVista === 'activos' && (
            <>
              <ProyectoOtAction
                proyecto={p}
                proyectos={proyectos}
                servicios={servicios}
                departamentos={departamentos}
                personas={personas}
                empresas={empresas}
              />
              <ProyectoFormSheet
                empresas={empresas}
                empresasGrupo={empresasGrupo}
                personas={personas}
                departamentos={departamentos}
                proyecto={p}
                proyectoDepartamentoIds={deptIds}
              />
              <button
                onClick={() => onArchivar(p.id)}
                disabled={actionLoading === p.id}
                title="Archivar"
                className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Archive className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onEliminar(p.id)}
                disabled={actionLoading === p.id}
                title="Eliminar"
                className={`flex items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  confirmDeleteId === p.id ? 'bg-red-600 text-white px-2.5' : 'text-red-500 hover:bg-red-50 px-1.5'
                }`}
              >
                {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {confirmDeleteId === p.id && '¿Eliminar proyecto, OTs y asignaciones?'}
              </button>
            </>
          )}
          {archivoVista === 'archivados' && (
            <>
              <button
                onClick={() => onDesarchivar(p.id)}
                disabled={actionLoading === p.id}
                title="Desarchivar"
                className="flex items-center justify-center rounded-lg p-1.5 text-muted-foreground hover:bg-muted transition-colors"
              >
                {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ArchiveRestore className="h-3.5 w-3.5" />}
              </button>
              <button
                onClick={() => onEliminar(p.id)}
                disabled={actionLoading === p.id}
                title="Eliminar"
                className={`flex items-center gap-1 rounded-lg py-1.5 text-xs font-medium transition-colors ${
                  confirmDeleteId === p.id ? 'bg-red-600 text-white px-2.5' : 'text-red-500 hover:bg-red-50 px-1.5'
                }`}
              >
                {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                {confirmDeleteId === p.id && '¿Eliminar proyecto, OTs y asignaciones?'}
              </button>
            </>
          )}
          {archivoVista === 'eliminados' && (
            <button
              onClick={() => onRestaurar(p.id)}
              disabled={actionLoading === p.id}
              title="Restaurar"
              className="flex items-center justify-center rounded-lg p-1.5 text-emerald-600 hover:bg-emerald-50 transition-colors"
            >
              {actionLoading === p.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCcw className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
