-- ============================================================
-- 001_create_tables.sql
-- Company OS — Planificacion module (18 tables)
-- Created: 2026-03-25
-- ============================================================

-- --------------------------------------------------------
-- Trigger function for updated_at
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. empresas_grupo (maestra)
-- ============================================================
CREATE TABLE empresas_grupo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL UNIQUE,
  cif TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE empresas_grupo ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_empresas_grupo_updated_at
  BEFORE UPDATE ON empresas_grupo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 2. catalogo_servicios (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE catalogo_servicios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_grupo_id, codigo)
);

ALTER TABLE catalogo_servicios ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_catalogo_servicios_updated_at
  BEFORE UPDATE ON catalogo_servicios
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 3. departamentos (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_grupo_id, codigo)
);

ALTER TABLE departamentos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_departamentos_updated_at
  BEFORE UPDATE ON departamentos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 4. servicios_y_depts (intermedia N:M)
-- ============================================================
CREATE TABLE servicios_y_depts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  servicio_id UUID NOT NULL REFERENCES catalogo_servicios(id),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE servicios_y_depts ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. rangos_internos (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE rangos_internos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_grupo_id, codigo)
);

ALTER TABLE rangos_internos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_rangos_internos_updated_at
  BEFORE UPDATE ON rangos_internos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 6. puestos (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE puestos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  codigo TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (empresa_grupo_id, codigo)
);

ALTER TABLE puestos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_puestos_updated_at
  BEFORE UPDATE ON puestos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 7. divisiones (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE divisiones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE divisiones ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_divisiones_updated_at
  BEFORE UPDATE ON divisiones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 8. roles (lookup -> empresas_grupo)
-- ============================================================
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  nombre TEXT NOT NULL,
  descripcion TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE roles ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_roles_updated_at
  BEFORE UPDATE ON roles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 9. ciudades (lookup global)
-- ============================================================
CREATE TABLE ciudades (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ciudades ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_ciudades_updated_at
  BEFORE UPDATE ON ciudades
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 10. oficinas (lookup global)
-- ============================================================
CREATE TABLE oficinas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE oficinas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_oficinas_updated_at
  BEFORE UPDATE ON oficinas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 11. personas (entidad -> empresas_grupo + lookups)
-- ============================================================
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona TEXT NOT NULL,
  dni TEXT NOT NULL UNIQUE,
  nombre TEXT NOT NULL,
  apellido_primero TEXT NOT NULL,
  apellido_segundo TEXT,
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  ciudad_id UUID NOT NULL REFERENCES ciudades(id),
  oficina_id UUID REFERENCES oficinas(id),
  rango_id UUID NOT NULL REFERENCES rangos_internos(id),
  puesto_id UUID NOT NULL REFERENCES puestos(id),
  division_id UUID NOT NULL REFERENCES divisiones(id),
  rol_id UUID NOT NULL REFERENCES roles(id),
  fecha_incorporacion DATE NOT NULL,
  fecha_baja DATE,
  activo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE personas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 12. empresas (maestra — clientes)
-- ============================================================
CREATE TABLE empresas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nombre_legal TEXT NOT NULL,
  cif TEXT NOT NULL UNIQUE,
  nombre_interno TEXT,
  estado TEXT NOT NULL CHECK (estado IN ('Conocido', 'Prospecto', 'Cliente', 'Baja', 'Otros')),
  tipo TEXT NOT NULL CHECK (tipo IN ('Marca', 'Fabricante', 'Fondo', 'Agencia', 'Tecnología')),
  tipo_conocido TEXT CHECK (tipo_conocido IN ('Branding', 'Inbound', 'Outbound', 'Eventos propios', 'Eventos externos', 'Cercanos')),
  tipo_cliente TEXT CHECK (tipo_cliente IN ('Consultoria', 'Servicio', 'Solucion')),
  estado_prospecto TEXT CHECK (estado_prospecto IN ('Prospección', 'Propuesta', 'Negociación', 'Activación')),
  fecha_primer_contrato DATE,
  direccion TEXT,
  sector TEXT,
  web TEXT,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_empresas_updated_at
  BEFORE UPDATE ON empresas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 13. proyectos (entidad -> empresas + empresas_grupo)
-- ============================================================
CREATE TABLE proyectos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id UUID REFERENCES empresas(id),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  servicio_principal_id UUID REFERENCES catalogo_servicios(id),
  departamento_id UUID NOT NULL REFERENCES departamentos(id),
  titulo TEXT NOT NULL,
  descripcion TEXT,
  tipo_proyecto TEXT NOT NULL CHECK (tipo_proyecto IN ('Interno', 'Externo', 'Facturable')),
  tipo_partida TEXT NOT NULL CHECK (tipo_partida IN ('Puntual', 'Recurrente')),
  estado TEXT NOT NULL CHECK (estado IN ('Propuesta', 'Confirmado', 'Activo', 'Pausado', 'Finalizado', 'Cancelado')),
  aprobador_final_id UUID NOT NULL REFERENCES personas(id),
  ppto_estimado NUMERIC NOT NULL,
  explicacion_presupuestos TEXT,
  fecha_activacion DATE,
  fecha_cierre DATE,
  notas TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE proyectos ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_proyectos_updated_at
  BEFORE UPDATE ON proyectos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 14. ordenes_trabajo (entidad -> proyectos)
-- ============================================================
CREATE TABLE ordenes_trabajo (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id),
  servicio_id UUID NOT NULL REFERENCES catalogo_servicios(id),
  mes_anio DATE NOT NULL,
  porcentaje_ppto_mes NUMERIC NOT NULL,
  partida_prevista NUMERIC NOT NULL,
  partida_real NUMERIC,
  aprobador_id UUID NOT NULL REFERENCES personas(id),
  estado TEXT NOT NULL CHECK (estado IN ('Propuesto', 'Planificado', 'Confirmado', 'Facturado')),
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE,
  notas TEXT,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (proyecto_id, servicio_id, mes_anio)
);

ALTER TABLE ordenes_trabajo ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_ordenes_trabajo_updated_at
  BEFORE UPDATE ON ordenes_trabajo
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 15. ordenes_trabajo_personas (intermedia N:M — personas preseleccionadas)
-- ============================================================
CREATE TABLE ordenes_trabajo_personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_trabajo_id UUID NOT NULL REFERENCES ordenes_trabajo(id),
  persona_id UUID NOT NULL REFERENCES personas(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ordenes_trabajo_personas ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 16. cuotas_por_rango (lookup temporal -> empresas_grupo)
-- Note: created before asignaciones because asignaciones references it
-- ============================================================
CREATE TABLE cuotas_por_rango (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  rango_id UUID NOT NULL REFERENCES rangos_internos(id),
  precio_hora NUMERIC NOT NULL,
  inicio_validez DATE NOT NULL,
  fin_validez DATE,
  nota TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE cuotas_por_rango ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_cuotas_por_rango_updated_at
  BEFORE UPDATE ON cuotas_por_rango
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 17. asignaciones (entidad -> ordenes_trabajo)
-- Note: numbered 17 in the list but depends on cuotas_por_rango
-- ============================================================
CREATE TABLE asignaciones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  orden_trabajo_id UUID NOT NULL REFERENCES ordenes_trabajo(id),
  persona_id UUID NOT NULL REFERENCES personas(id),
  porcentaje_ppto_tm NUMERIC NOT NULL,
  cuota_rango_id UUID NOT NULL REFERENCES cuotas_por_rango(id),
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (orden_trabajo_id, persona_id)
);

ALTER TABLE asignaciones ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_asignaciones_updated_at
  BEFORE UPDATE ON asignaciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- 18. horas_trabajables (lookup con overrides -> empresas_grupo)
-- ============================================================
CREATE TABLE horas_trabajables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_grupo_id UUID NOT NULL REFERENCES empresas_grupo(id),
  mes_trabajo DATE NOT NULL,
  horas NUMERIC NOT NULL,
  servicio_id UUID REFERENCES catalogo_servicios(id),
  persona_id UUID REFERENCES personas(id),
  comentarios TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE horas_trabajables ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_horas_trabajables_updated_at
  BEFORE UPDATE ON horas_trabajables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
