-- 017_bloque1_mejoras_campos.sql
-- Bloque 1: mejoras de campos en tablas existentes + creación de condiciones y ausencias.
-- Las tablas condiciones y ausencias estaban documentadas pero nunca se crearon en SQL.
-- Todos los campos nuevos en tablas existentes son nullable (o tienen DEFAULT seguro).
-- Los CHECK constraints sobre columnas ya existentes usan NOT VALID para no rechazar filas históricas.

BEGIN;

-- =====================================================================
-- 1. empresas_grupo — datos de empresa del holding
-- =====================================================================
ALTER TABLE empresas_grupo
  ADD COLUMN IF NOT EXISTS pais          text,
  ADD COLUMN IF NOT EXISTS moneda_base   text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS web           text,
  ADD COLUMN IF NOT EXISTS email_general text,
  ADD COLUMN IF NOT EXISTS telefono      text,
  ADD COLUMN IF NOT EXISTS logo_url      text,
  ADD COLUMN IF NOT EXISTS color_marca   text;   -- hex, ej: '#00C896'

-- =====================================================================
-- 2. empresas — dirección estructurada + datos de cuenta
-- =====================================================================

-- 2a. Añadir campos de dirección estructurada
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS calle         text,
  ADD COLUMN IF NOT EXISTS codigo_postal text,
  ADD COLUMN IF NOT EXISTS ciudad        text,
  ADD COLUMN IF NOT EXISTS provincia     text,
  ADD COLUMN IF NOT EXISTS pais          text;

-- 2b. Migrar datos existentes del campo libre al nuevo campo calle
UPDATE empresas
SET calle = direccion
WHERE direccion IS NOT NULL AND calle IS NULL;

-- 2c. Eliminar campo libre original
ALTER TABLE empresas DROP COLUMN IF EXISTS direccion;

-- 2d. Campos adicionales de cuenta y segmentación
ALTER TABLE empresas
  ADD COLUMN IF NOT EXISTS linkedin_url               text,
  ADD COLUMN IF NOT EXISTS telefono                   text,
  ADD COLUMN IF NOT EXISTS num_empleados              integer,
  ADD COLUMN IF NOT EXISTS facturacion_anual_estimada numeric,
  ADD COLUMN IF NOT EXISTS clasificacion_cuenta       text
    CONSTRAINT chk_clasificacion_cuenta
      CHECK (clasificacion_cuenta IN ('A', 'B', 'C')),
  ADD COLUMN IF NOT EXISTS moneda                     text NOT NULL DEFAULT 'EUR',
  ADD COLUMN IF NOT EXISTS idioma_preferido           text,
  ADD COLUMN IF NOT EXISTS fuente_captacion           text
    CONSTRAINT chk_fuente_captacion
      CHECK (fuente_captacion IN (
        'Inbound', 'Outbound', 'Referido', 'Evento', 'Red propia', 'Otro'
      )),
  ADD COLUMN IF NOT EXISTS responsable_cuenta_id      uuid REFERENCES personas(id);

-- =====================================================================
-- 3. contactos_empresas — teléfono estructurado + perfil de stakeholder
-- =====================================================================

-- 3a. Renombrar telefono → telefono_directo (solo si aún existe con el nombre antiguo)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'contactos_empresas' AND column_name = 'telefono'
  ) THEN
    ALTER TABLE contactos_empresas RENAME COLUMN telefono TO telefono_directo;
  END IF;
END $$;

-- 3b. Campos adicionales
ALTER TABLE contactos_empresas
  ADD COLUMN IF NOT EXISTS movil                 text,
  ADD COLUMN IF NOT EXISTS linkedin_url          text,
  ADD COLUMN IF NOT EXISTS rol_influencia        text
    CONSTRAINT chk_rol_influencia
      CHECK (rol_influencia IN (
        'Champion', 'Decision Maker', 'Economic Buyer', 'Influencer', 'Blocker'
      )),
  ADD COLUMN IF NOT EXISTS fecha_ultimo_contacto date,
  ADD COLUMN IF NOT EXISTS idioma_preferido      text,
  ADD COLUMN IF NOT EXISTS fecha_cumpleanos      date,
  ADD COLUMN IF NOT EXISTS assistant_nombre      text,
  ADD COLUMN IF NOT EXISTS assistant_email       text;

-- =====================================================================
-- 4. personas — datos de contacto, perfil profesional y competencias
-- =====================================================================
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS email_corporativo  text,
  ADD COLUMN IF NOT EXISTS email_personal     text,
  ADD COLUMN IF NOT EXISTS telefono           text,
  ADD COLUMN IF NOT EXISTS linkedin_url       text,
  ADD COLUMN IF NOT EXISTS fecha_nacimiento   date,
  ADD COLUMN IF NOT EXISTS foto_url           text,
  ADD COLUMN IF NOT EXISTS modalidad_trabajo  text
    CONSTRAINT chk_modalidad_trabajo_personas
      CHECK (modalidad_trabajo IN ('Presencial', 'Híbrido', 'Remoto')),
  ADD COLUMN IF NOT EXISTS nivel_ingles       text
    CONSTRAINT chk_nivel_ingles
      CHECK (nivel_ingles IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Nativo')),
  ADD COLUMN IF NOT EXISTS skills_tags        text[];

-- =====================================================================
-- 5. condiciones — creada con todos los campos (original + nuevos de 017)
-- Esta tabla estaba en el modelo pero nunca se creó en SQL.
-- =====================================================================
CREATE TABLE IF NOT EXISTS condiciones (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id              UUID NOT NULL REFERENCES personas(id),
  fecha_inicio            DATE NOT NULL,
  fecha_fin               DATE,
  empresa_grupo_id        UUID NOT NULL REFERENCES empresas_grupo(id),
  departamento_id         UUID NOT NULL REFERENCES departamentos(id),
  rango_id                UUID NOT NULL REFERENCES rangos_internos(id),
  puesto_id               UUID NOT NULL REFERENCES puestos(id),
  division_id             UUID NOT NULL REFERENCES divisiones(id),
  rol_id                  UUID NOT NULL REFERENCES roles(id),
  salario_bruto_anual     NUMERIC NOT NULL,
  tipo_contrato           TEXT NOT NULL
    CHECK (tipo_contrato IN ('Indefinido', 'Temporal', 'Prácticas', 'Autónomo', 'Becario')),
  jornada                 TEXT NOT NULL
    CHECK (jornada IN ('Completa', 'Parcial', 'Media jornada')),
  horas_semana            NUMERIC NOT NULL,
  benefits                TEXT,
  coste_seguridad_social  NUMERIC,
  notas                   TEXT,
  -- Nuevos — migración 017
  salario_variable_anual  NUMERIC,
  porcentaje_variable     NUMERIC
    CHECK (porcentaje_variable BETWEEN 0 AND 100),
  dias_vacaciones         INTEGER,
  periodo_prueba_fin      DATE,
  modalidad_trabajo       TEXT
    CHECK (modalidad_trabajo IN ('Presencial', 'Híbrido', 'Remoto')),
  coste_hora_calculado    NUMERIC,
  deleted_at              TIMESTAMPTZ,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE condiciones ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_condiciones_updated_at
  BEFORE UPDATE ON condiciones
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Si la tabla ya existía sin los campos nuevos, los añadimos igualmente
ALTER TABLE condiciones
  ADD COLUMN IF NOT EXISTS salario_variable_anual numeric,
  ADD COLUMN IF NOT EXISTS porcentaje_variable    numeric
    CONSTRAINT chk_porcentaje_variable CHECK (porcentaje_variable BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS dias_vacaciones        integer,
  ADD COLUMN IF NOT EXISTS periodo_prueba_fin     date,
  ADD COLUMN IF NOT EXISTS modalidad_trabajo      text
    CONSTRAINT chk_modalidad_trabajo_condiciones
      CHECK (modalidad_trabajo IN ('Presencial', 'Híbrido', 'Remoto')),
  ADD COLUMN IF NOT EXISTS coste_hora_calculado   numeric;

-- =====================================================================
-- 6. ausencias — creada con todos los campos (original + nuevos de 017)
-- Esta tabla estaba en el modelo pero nunca se creó en SQL.
-- =====================================================================
CREATE TABLE IF NOT EXISTS ausencias (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id       UUID NOT NULL REFERENCES personas(id),
  tipo             TEXT NOT NULL
    CHECK (tipo IN (
      'Vacaciones', 'Baja médica', 'Permiso personal',
      'Maternidad/Paternidad', 'Formación', 'Asunto propio', 'Festivo'
    )),
  fecha_inicio     DATE NOT NULL,
  fecha_fin        DATE NOT NULL,
  notas            TEXT,
  -- Nuevos — migración 017
  estado           TEXT NOT NULL DEFAULT 'Aprobada'
    CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada')),
  aprobado_por_id  UUID REFERENCES personas(id),
  dias_habiles     INTEGER,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE ausencias ENABLE ROW LEVEL SECURITY;

CREATE TRIGGER trg_ausencias_updated_at
  BEFORE UPDATE ON ausencias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Si la tabla ya existía sin los campos nuevos, los añadimos igualmente
ALTER TABLE ausencias
  ADD COLUMN IF NOT EXISTS estado          text NOT NULL DEFAULT 'Aprobada'
    CONSTRAINT chk_estado_ausencia
      CHECK (estado IN ('Solicitada', 'Aprobada', 'Rechazada')),
  ADD COLUMN IF NOT EXISTS aprobado_por_id uuid REFERENCES personas(id),
  ADD COLUMN IF NOT EXISTS dias_habiles    integer;

-- =====================================================================
-- 7. proyectos — datos comerciales y de gestión de cuenta
-- =====================================================================
ALTER TABLE proyectos
  ADD COLUMN IF NOT EXISTS codigo_proyecto       text,
  ADD COLUMN IF NOT EXISTS contacto_principal_id uuid REFERENCES contactos_empresas(id),
  ADD COLUMN IF NOT EXISTS probabilidad_cierre   integer
    CONSTRAINT chk_probabilidad_cierre CHECK (probabilidad_cierre BETWEEN 0 AND 100),
  ADD COLUMN IF NOT EXISTS valor_estimado_total  numeric,
  ADD COLUMN IF NOT EXISTS margen_objetivo_pct   numeric,
  ADD COLUMN IF NOT EXISTS tipo_facturacion      text
    CONSTRAINT chk_tipo_facturacion
      CHECK (tipo_facturacion IN ('Precio fijo', 'Por horas', 'Retainer', 'Éxito')),
  ADD COLUMN IF NOT EXISTS tags                  text[],
  ADD COLUMN IF NOT EXISTS fecha_propuesta       date;

-- =====================================================================
-- 8. ordenes_trabajo — horas y notas de cierre
-- =====================================================================
ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS horas_planificadas numeric,
  ADD COLUMN IF NOT EXISTS horas_reales       numeric,
  ADD COLUMN IF NOT EXISTS notas_cierre       text;

-- =====================================================================
-- 9. asignaciones — seguimiento de horas reales y notas
-- =====================================================================
ALTER TABLE asignaciones
  ADD COLUMN IF NOT EXISTS horas_reales numeric,
  ADD COLUMN IF NOT EXISTS notas        text;

COMMIT;
