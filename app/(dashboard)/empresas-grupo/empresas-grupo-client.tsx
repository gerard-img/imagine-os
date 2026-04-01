'use client'

import { useState, useMemo } from 'react'
import type {
  EmpresaGrupo,
  CatalogoServicio,
  Departamento,
  RangoInterno,
  Puesto,
  Division,
  Rol,
  Persona,
} from '@/lib/supabase/types'
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from '@/components/ui/table'
import { KpiCard } from '@/components/kpi-card'
import { FilterPills } from '@/components/filter-pills'

const SECTIONS = ['Empresas', 'Servicios', 'Departamentos', 'Rangos', 'Puestos', 'Divisiones', 'Roles'] as const
type Section = (typeof SECTIONS)[number]

type Props = {
  empresasGrupo: EmpresaGrupo[]
  catalogoServicios: CatalogoServicio[]
  departamentos: Departamento[]
  rangosInternos: RangoInterno[]
  puestos: Puesto[]
  divisiones: Division[]
  roles: Rol[]
  personas: Persona[]
}

export function EmpresasGrupoClient({
  empresasGrupo, catalogoServicios, departamentos, rangosInternos, puestos, divisiones, roles, personas,
}: Props) {
  const [section, setSection] = useState<Section>('Empresas')
  const egMap = useMemo(() => new Map(empresasGrupo.map((e) => [e.id, e])), [empresasGrupo])
  const totalPersonas = personas.filter((p) => p.activo).length

  return (
    <div>
      <h1 className="text-xl font-bold text-foreground">Empresas del Grupo</h1>
      <p className="mt-0.5 text-sm text-muted-foreground">Empresas del holding y sus catálogos asociados</p>

      <div className="mt-5 grid grid-cols-4 gap-4">
        <KpiCard label="Empresas" value={empresasGrupo.length} borderColor="border-t-primary" />
        <KpiCard label="Servicios" value={catalogoServicios.length} borderColor="border-t-blue-500" />
        <KpiCard label="Departamentos" value={departamentos.length} borderColor="border-t-amber-500" />
        <KpiCard label="Personas activas" value={totalPersonas} borderColor="border-t-emerald-500" />
      </div>

      <div className="mt-5">
        <FilterPills options={[...SECTIONS]} active={section} onChange={(v) => setSection(v as Section)} />
      </div>

      <div className="mt-4 rounded-xl bg-white p-4 shadow-sm">
        {section === 'Empresas' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">CIF</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {empresasGrupo.map((eg) => (
                <TableRow key={eg.id}>
                  <TableCell className="font-medium">{eg.codigo}</TableCell>
                  <TableCell>{eg.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{eg.cif}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Servicios' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {catalogoServicios.map((s) => (
                <TableRow key={s.id}>
                  <TableCell className="font-medium">{s.codigo}</TableCell>
                  <TableCell>{s.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{egMap.get(s.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{s.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Departamentos' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {departamentos.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.codigo}</TableCell>
                  <TableCell>{d.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{egMap.get(d.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{d.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Rangos' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {rangosInternos.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.codigo}</TableCell>
                  <TableCell>{r.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{egMap.get(r.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{r.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Puestos' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Código</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {puestos.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="font-medium">{p.codigo}</TableCell>
                  <TableCell>{p.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">{egMap.get(p.empresa_grupo_id)?.codigo ?? '—'}</TableCell>
                  <TableCell className="text-muted-foreground">{p.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Divisiones' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {divisiones.map((d) => (
                <TableRow key={d.id}>
                  <TableCell className="font-medium">{d.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">Todas</TableCell>
                  <TableCell className="text-muted-foreground">{d.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        {section === 'Roles' && (
          <Table>
            <TableHeader><TableRow>
              <TableHead className="text-xs uppercase text-muted-foreground">Nombre</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Empresa</TableHead>
              <TableHead className="text-xs uppercase text-muted-foreground">Descripción</TableHead>
            </TableRow></TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.nombre}</TableCell>
                  <TableCell className="text-muted-foreground">Todas</TableCell>
                  <TableCell className="text-muted-foreground">{r.descripcion ?? '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  )
}
