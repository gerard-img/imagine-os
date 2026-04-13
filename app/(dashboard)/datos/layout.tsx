import { DatosNav } from './components/datos-nav'

export default function DatosLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      {/* Título de sección */}
      <div className="mb-4">
        <h1 className="text-xl font-bold text-foreground">Datos</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Análisis de ingresos, carga y concentración
        </p>
      </div>

      {/* Navegación Foco / Tiempo */}
      <DatosNav />

      {/* Contenido de la sub-página */}
      <div className="mt-4">
        {children}
      </div>
    </div>
  )
}
