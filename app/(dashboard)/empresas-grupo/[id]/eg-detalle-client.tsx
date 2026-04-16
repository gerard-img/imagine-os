'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Globe, Mail, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InfoRow } from '@/components/info-row'
import { EGFormSheet } from '../eg-form-sheet'
import type {
  EmpresaGrupo, CatalogoServicio, Departamento, RangoInterno, Puesto, Persona,
} from '@/lib/supabase/types'

type Props = {
  eg: EmpresaGrupo
  servicios: CatalogoServicio[]
  departamentos: Departamento[]
  rangos: RangoInterno[]
  puestos: Puesto[]
  personas: Persona[]
}

export function EGDetalleClient({ eg, servicios, departamentos, rangos, puestos, personas }: Props) {
  const router = useRouter()
  const personasActivas = personas.filter((p) => p.activo)

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => router.back()} className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{eg.nombre}</h1>
            <p className="text-sm text-muted-foreground">
              {eg.codigo}{eg.cif ? ` · ${eg.cif}` : ''}
            </p>
          </div>
        </div>
        <EGFormSheet eg={eg} />
      </div>

      {/* KPIs */}
      <div className="mt-5 grid grid-cols-4 gap-4">
        {[
          { label: 'Personas activas', value: personasActivas.length, color: 'border-t-emerald-500' },
          { label: 'Servicios', value: servicios.length, color: 'border-t-blue-500' },
          { label: 'Departamentos', value: departamentos.length, color: 'border-t-amber-500' },
          { label: 'Puestos', value: puestos.length, color: 'border-t-purple-500' },
        ].map((kpi) => (
          <div key={kpi.label} className={`rounded-xl bg-white p-5 shadow-sm border-t-4 ${kpi.color}`}>
            <p className="text-2xl font-bold text-foreground">{kpi.value}</p>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">{kpi.label}</p>
          </div>
        ))}
      </div>

      {/* Info cards */}
      <div className="mt-5 grid grid-cols-3 gap-4">
        {/* Datos generales */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Datos Generales
          </p>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="Nombre legal" value={eg.nombre_legal} />
            <InfoRow label="CIF" value={eg.cif} />
            <InfoRow label="País" value={eg.pais} />
            <InfoRow label="Moneda base" value={eg.moneda_base} />
          </dl>
        </div>

        {/* Contacto */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Contacto
          </p>
          <dl className="space-y-2.5 text-sm">
            {eg.email_general && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{eg.email_general}</span>
              </div>
            )}
            {eg.telefono && (
              <div className="flex items-center gap-2 text-sm">
                <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{eg.telefono}</span>
              </div>
            )}
            {eg.web && (
              <div className="flex items-center gap-2 text-sm">
                <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="truncate">{eg.web}</span>
              </div>
            )}
            {!eg.email_general && !eg.telefono && !eg.web && (
              <p className="text-sm text-muted-foreground">Sin datos de contacto.</p>
            )}
          </dl>
        </div>

        {/* Marca */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Marca
          </p>
          <dl className="space-y-2.5 text-sm">
            <InfoRow label="URL logo" value={eg.logo_url} />
            <div className="flex justify-between items-center">
              <dt className="text-muted-foreground">Color marca</dt>
              <dd className="flex items-center gap-2 font-semibold">
                {eg.color_marca ? (
                  <>
                    <span className="inline-block h-4 w-4 rounded-full border" style={{ backgroundColor: eg.color_marca }} />
                    {eg.color_marca}
                  </>
                ) : '—'}
              </dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Catálogos */}
      <div className="mt-5 grid grid-cols-2 gap-4">
        {/* Servicios */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Servicios ({servicios.length})
          </p>
          {servicios.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin servicios.</p>
          ) : (
            <div className="space-y-1.5">
              {servicios.map((s) => (
                <div key={s.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{s.nombre}</span>
                  <span className="text-xs text-muted-foreground">{s.codigo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Departamentos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Departamentos ({departamentos.length})
          </p>
          {departamentos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin departamentos.</p>
          ) : (
            <div className="space-y-1.5">
              {departamentos.map((d) => (
                <div key={d.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{d.nombre}</span>
                  <span className="text-xs text-muted-foreground">{d.codigo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Rangos */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Rangos ({rangos.length})
          </p>
          {rangos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin rangos.</p>
          ) : (
            <div className="space-y-1.5">
              {rangos.map((r) => (
                <div key={r.id} className="flex items-center justify-between text-sm">
                  <span className="font-medium">{r.nombre}</span>
                  <span className="text-xs text-muted-foreground">{r.codigo}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Personas activas */}
        <div className="rounded-xl bg-white p-5 shadow-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Personas activas ({personasActivas.length})
          </p>
          {personasActivas.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin personas.</p>
          ) : (
            <div className="space-y-1.5">
              {personasActivas.map((p) => (
                <div key={p.id} className="text-sm">
                  <Link href={`/personas/${p.id}`} className="font-medium hover:text-primary transition-colors">
                    {p.persona}
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
