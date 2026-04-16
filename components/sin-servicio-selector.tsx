'use client'

import { useState, useRef, useEffect } from 'react'
import type { CatalogoServicio } from '@/lib/supabase/types'
import { ServicioPill } from '@/components/servicio-pill'
import { asignarServicioOT } from '@/app/(dashboard)/ordenes-trabajo/actions'

type Props = {
  otId: string
  servicios: CatalogoServicio[]
}

export function SinServicioSelector({ otId, servicios }: Props) {
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  async function handleSelect(servicioId: string) {
    setSaving(true)
    await asignarServicioOT(otId, servicioId)
    setSaving(false)
    setOpen(false)
  }

  if (saving) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
        Guardando…
      </span>
    )
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-semibold text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
      >
        ⚠ Sin servicio
      </button>

      {open && (
        <div className="absolute left-0 top-full mt-1 z-50 min-w-[200px] rounded-lg border border-border bg-white py-1 shadow-lg">
          {servicios.length === 0 ? (
            <p className="px-3 py-2 text-xs text-muted-foreground">No hay servicios configurados</p>
          ) : (
            servicios.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => handleSelect(s.id)}
                className="flex w-full items-center px-3 py-1.5 text-sm transition-colors hover:bg-muted/50 text-left"
              >
                <ServicioPill name={s.nombre} />
              </button>
            ))
          )}
        </div>
      )}
    </div>
  )
}
