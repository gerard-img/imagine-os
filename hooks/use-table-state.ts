'use client'

import { useCallback } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'

export type SortDir = 'asc' | 'desc'

// ── Hook ────────────────────────────────────────────────────────────────────────

type UseTableStateConfig = {
  /** Columna y dirección por defecto al cargar la página */
  defaultSort?: { col: string; dir: SortDir }
  /** Nombres de los parámetros en la URL (por defecto 'orden' y 'dir') */
  sortParam?: string
  dirParam?: string
}

/**
 * Centraliza sorting y filtros en URL search params.
 * Al cambiar un parámetro, la URL se actualiza sin recargar la página,
 * lo que permite compartir/guardar el estado con un simple enlace.
 */
export function useTableState(config?: UseTableStateConfig) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const sortParam = config?.sortParam ?? 'orden'
  const dirParam = config?.dirParam ?? 'dir'
  const defaultCol = config?.defaultSort?.col ?? null
  const defaultDir = config?.defaultSort?.dir ?? 'desc'

  // Leer sort desde la URL
  const sortCol = searchParams.get(sortParam) ?? defaultCol
  const sortDir = (searchParams.get(dirParam) as SortDir) ?? defaultDir

  /** Actualiza uno o más parámetros en la URL sin recargar la página */
  const setParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString())
      for (const [key, value] of Object.entries(updates)) {
        if (value === null || value === '') params.delete(key)
        else params.set(key, value)
      }
      router.replace(`${pathname}?${params.toString()}`, { scroll: false })
    },
    [searchParams, router, pathname],
  )

  /** Cambia la columna de ordenación; si es la misma, invierte dirección */
  const toggleSort = useCallback(
    (col: string) => {
      const newDir: SortDir =
        sortCol === col ? (sortDir === 'asc' ? 'desc' : 'asc') : 'desc'
      setParams({
        [sortParam]: col === defaultCol ? null : col,
        [dirParam]: newDir === defaultDir ? null : newDir,
      })
    },
    [sortCol, sortDir, defaultCol, defaultDir, sortParam, dirParam, setParams],
  )

  /** Establece columna y dirección explícitamente */
  const setSort = useCallback(
    (col: string, dir: SortDir = 'desc') => {
      setParams({
        [sortParam]: col === defaultCol ? null : col,
        [dirParam]: dir === defaultDir ? null : dir,
      })
    },
    [defaultCol, defaultDir, sortParam, dirParam, setParams],
  )

  /** Lee cualquier parámetro de la URL con un fallback opcional */
  const getParam = useCallback(
    (key: string, fallback?: string) => searchParams.get(key) ?? fallback ?? null,
    [searchParams],
  )

  return { sortCol, sortDir, toggleSort, setSort, setParams, getParam, searchParams }
}

// ── Utilidad de ordenación genérica ─────────────────────────────────────────────

/**
 * Ordena un array usando un mapa de accessors por columna.
 *
 * Ejemplo:
 *   sortData(filas, 'horas', 'desc', {
 *     nombre: (f) => f.nombre,
 *     horas:  (f) => f.horas,
 *   })
 */
export function sortData<T extends Record<string, unknown>>(
  data: T[],
  col: string | null,
  dir: SortDir,
  accessors: Record<string, (item: T) => string | number | null>,
): T[] {
  if (!col || !accessors[col]) return data
  const accessor = accessors[col]
  const multiplier = dir === 'asc' ? 1 : -1
  return [...data].sort((a, b) => {
    const va = accessor(a)
    const vb = accessor(b)
    if (va === null && vb === null) return 0
    if (va === null) return 1
    if (vb === null) return -1
    let cmp: number
    if (typeof va === 'string' && typeof vb === 'string') {
      cmp = va.localeCompare(vb) * multiplier
    } else {
      cmp = ((va as number) - (vb as number)) * multiplier
    }
    // Tiebreaker estable por id para evitar saltos al refrescar datos
    if (cmp !== 0) return cmp
    const aId = (a as Record<string, unknown>).id as string ?? ''
    const bId = (b as Record<string, unknown>).id as string ?? ''
    return aId.localeCompare(bId)
  })
}
