'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronDown, ChevronRight, Plus, Loader2, AlertTriangle } from 'lucide-react'
import type {
  Proyecto,
  Empresa,
  CatalogoServicio,
  Departamento,
  Persona,
  OrdenTrabajo,
} from '@/lib/supabase/types'
import { ClientePill } from '@/components/cliente-pill'
import { OtFormSheet } from '../ordenes-trabajo/ot-form-sheet'
import { generarOTsProyectoMes } from '../ordenes-trabajo/generar-ots-mes'

type Props = {
  proyectosSinOTs: Proyecto[]
  month: string
  empresasMap: Map<string, Empresa>
  // Datos para OtFormSheet (proyectos puntuales)
  proyectos: Proyecto[]
  catalogoServicios: CatalogoServicio[]
  departamentos: Departamento[]
  personas: Persona[]
  empresas: Empresa[]
  ordenesTrabajo: OrdenTrabajo[]
}

export function ProyectosSinOtsAlert({
  proyectosSinOTs,
  month,
  empresasMap,
  proyectos,
  catalogoServicios,
  departamentos,
  personas,
  empresas,
  ordenesTrabajo,
}: Props) {
  const router = useRouter()
  const [alertaOpen, setAlertaOpen] = useState(true)
  const [generandoIds, setGenerandoIds] = useState<Set<string>>(new Set())

  async function handleGenerarOTs(proyectoId: string) {
    setGenerandoIds((prev) => new Set(prev).add(proyectoId))
    await generarOTsProyectoMes(proyectoId, month)
    setGenerandoIds((prev) => {
      const n = new Set(prev)
      n.delete(proyectoId)
      return n
    })
  }

  if (proyectosSinOTs.length === 0) return null

  return (
    <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 shadow-sm">
      <button
        onClick={() => setAlertaOpen(!alertaOpen)}
        className="flex w-full items-center gap-2 px-4 py-3 text-left"
      >
        {alertaOpen ? (
          <ChevronDown className="h-4 w-4 text-amber-600 shrink-0" />
        ) : (
          <ChevronRight className="h-4 w-4 text-amber-600 shrink-0" />
        )}
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-sm font-semibold text-amber-800">
          {proyectosSinOTs.length} proyecto{proyectosSinOTs.length > 1 ? 's' : ''} activo
          {proyectosSinOTs.length > 1 ? 's' : ''} sin OTs este mes
        </span>
      </button>

      {alertaOpen && (
        <div className="border-t border-amber-200 px-4 pb-3 pt-2 space-y-2">
          {proyectosSinOTs.map((p) => {
            const empresa = p.empresa_id ? empresasMap.get(p.empresa_id) : undefined
            const clienteNombre = empresa?.nombre_interno ?? empresa?.nombre_legal ?? 'Interno'
            const isGenerando = generandoIds.has(p.id)

            return (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 rounded-lg bg-white/70 px-3 py-2"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <ClientePill name={clienteNombre} />
                  <span
                    className="text-sm font-semibold text-foreground truncate hover:text-primary hover:underline cursor-pointer"
                    onClick={() => router.push(`/proyectos/${p.id}`)}
                  >
                    {p.titulo}
                  </span>
                  <span className="text-[10px] text-muted-foreground shrink-0">
                    {p.tipo_partida}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {p.tipo_partida === 'Recurrente' ? (
                    <button
                      onClick={() => handleGenerarOTs(p.id)}
                      disabled={isGenerando}
                      className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition-colors"
                    >
                      {isGenerando ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <Plus className="h-3 w-3" />
                      )}
                      Generar OTs
                    </button>
                  ) : (
                    <OtFormSheet
                      proyectos={proyectos}
                      servicios={catalogoServicios}
                      departamentos={departamentos}
                      personas={personas}
                      empresas={empresas}
                      ordenesTrabajo={ordenesTrabajo}
                      preselectedProyectoId={p.id}
                    />
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
