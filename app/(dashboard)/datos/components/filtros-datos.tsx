'use client'

import { useMemo } from 'react'
import { MultiSelectFilter, type FilterOption } from '@/components/multi-select-filter'
import { FilterBar } from '@/components/filter-bar'
import type { EmpresaGrupo, Departamento, CatalogoServicio } from '@/lib/supabase/types'
import type { TipoProyectoFiltro } from '@/lib/helpers-informes'

export const TIPO_PROYECTO_OPTIONS: FilterOption[] = [
  { value: 'facturable', label: 'Facturable' },
  { value: 'externo', label: 'Externo' },
  { value: 'interno', label: 'Interno' },
]

export const ESTADO_OT_OPTIONS: FilterOption[] = [
  { value: 'Planificado', label: 'Planificado' },
  { value: 'Realizado', label: 'Realizado' },
  { value: 'Confirmado', label: 'Confirmado' },
  { value: 'Facturado', label: 'Facturado' },
]

// ── Hook para leer/escribir filtros desde URL params ──

type UseFiltersDatos = {
  searchParams: URLSearchParams
  setParams: (updates: Record<string, string | null>) => void
  departamentos: Departamento[]
  catalogoServicios?: CatalogoServicio[]
}

export function useFiltersDatos({ searchParams, setParams, departamentos, catalogoServicios = [] }: UseFiltersDatos) {
  const filtroEgs = useMemo(() => {
    const v = searchParams.get('eg')
    return v ? v.split(',') : []
  }, [searchParams])

  const filtroTipos = useMemo(() => {
    const v = searchParams.get('tipo')
    return v ? (v.split(',') as TipoProyectoFiltro[]) : []
  }, [searchParams])

  const filtroEstadosOT = useMemo(() => {
    const v = searchParams.get('estadoOT')
    return v ? v.split(',') : []
  }, [searchParams])

  const filtroDeptos = useMemo(() => {
    const v = searchParams.get('depto')
    return v ? v.split(',') : []
  }, [searchParams])

  const filtroServicios = useMemo(() => {
    const v = searchParams.get('servicio')
    return v ? v.split(',') : []
  }, [searchParams])

  const setArrayParam = (key: string, values: string[]) => {
    setParams({ [key]: values.length > 0 ? values.join(',') : null })
  }

  const setFiltroEgs = (vals: string[]) => {
    // Al cambiar EG: limpiar deptos y servicios que ya no pertenecen a las EGs seleccionadas
    const deptosValidos = vals.length === 0
      ? filtroDeptos
      : filtroDeptos.filter((dId) => {
          const d = departamentos.find((x) => x.id === dId)
          return d && vals.includes(d.empresa_grupo_id)
        })
    const serviciosValidos = vals.length === 0
      ? filtroServicios
      : filtroServicios.filter((sId) => {
          const s = catalogoServicios.find((x) => x.id === sId)
          return s && vals.includes(s.empresa_grupo_id)
        })
    setParams({
      eg: vals.length > 0 ? vals.join(',') : null,
      depto: deptosValidos.length > 0 ? deptosValidos.join(',') : null,
      servicio: serviciosValidos.length > 0 ? serviciosValidos.join(',') : null,
    })
  }

  const setFiltroTipos = (vals: string[]) => setArrayParam('tipo', vals)
  const setFiltroEstadosOT = (vals: string[]) => setArrayParam('estadoOT', vals)
  const setFiltroDeptos = (vals: string[]) => setArrayParam('depto', vals)
  const setFiltroServicios = (vals: string[]) => setArrayParam('servicio', vals)

  return {
    filtroEgs, filtroTipos, filtroEstadosOT, filtroDeptos, filtroServicios,
    setFiltroEgs, setFiltroTipos, setFiltroEstadosOT, setFiltroDeptos, setFiltroServicios,
  }
}

// ── Barra de filtros renderizada ──

type FiltrosDatosBarraProps = {
  empresasGrupo: EmpresaGrupo[]
  departamentos: Departamento[]
  catalogoServicios: CatalogoServicio[]
  filtroEgs: string[]
  filtroTipos: TipoProyectoFiltro[]
  filtroEstadosOT: string[]
  filtroDeptos: string[]
  filtroServicios: string[]
  setFiltroEgs: (v: string[]) => void
  setFiltroTipos: (v: string[]) => void
  setFiltroEstadosOT: (v: string[]) => void
  setFiltroDeptos: (v: string[]) => void
  setFiltroServicios: (v: string[]) => void
}

export function FiltrosDatosBarra({
  empresasGrupo, departamentos, catalogoServicios,
  filtroEgs, filtroTipos, filtroEstadosOT, filtroDeptos, filtroServicios,
  setFiltroEgs, setFiltroTipos, setFiltroEstadosOT, setFiltroDeptos, setFiltroServicios,
}: FiltrosDatosBarraProps) {
  const empresaGrupoOptions: FilterOption[] = useMemo(
    () => empresasGrupo.map((eg) => ({ value: eg.id, label: eg.nombre })),
    [empresasGrupo],
  )

  const departamentoOptions: FilterOption[] = useMemo(() => {
    const filtered = filtroEgs.length > 0
      ? departamentos.filter((d) => filtroEgs.includes(d.empresa_grupo_id))
      : departamentos
    return filtered
      .map((d) => ({ value: d.id, label: d.nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [departamentos, filtroEgs])

  const servicioOptions: FilterOption[] = useMemo(() => {
    const filtered = filtroEgs.length > 0
      ? catalogoServicios.filter((s) => filtroEgs.includes(s.empresa_grupo_id))
      : catalogoServicios
    return filtered
      .map((s) => ({ value: s.id, label: s.nombre }))
      .sort((a, b) => a.label.localeCompare(b.label))
  }, [catalogoServicios, filtroEgs])

  return (
    <FilterBar>
      <MultiSelectFilter
        label="Empresa"
        options={empresaGrupoOptions}
        selected={filtroEgs}
        onChange={setFiltroEgs}
        searchable
      />
      <MultiSelectFilter
        label="Departamento"
        options={departamentoOptions}
        selected={filtroDeptos}
        onChange={setFiltroDeptos}
        searchable
      />
      <MultiSelectFilter
        label="Servicio"
        options={servicioOptions}
        selected={filtroServicios}
        onChange={setFiltroServicios}
        searchable
      />
      <MultiSelectFilter
        label="Tipo proyecto"
        options={TIPO_PROYECTO_OPTIONS}
        selected={filtroTipos}
        onChange={(v) => setFiltroTipos(v as TipoProyectoFiltro[])}
      />
      <MultiSelectFilter
        label="Estado OT"
        options={ESTADO_OT_OPTIONS}
        selected={filtroEstadosOT}
        onChange={setFiltroEstadosOT}
      />
    </FilterBar>
  )
}
