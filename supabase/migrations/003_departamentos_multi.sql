-- ============================================================
-- Migración 003: Departamentos multi-asignación
--
-- Cambios:
--   1. Nueva tabla proyectos_departamentos (N:M)
--   2. Nueva tabla personas_departamentos (N:M con % tiempo)
--   3. Añadir departamento_id a ordenes_trabajo
--   4. Eliminar departamento_id de proyectos y personas
--
-- Operaciones destructivas (intencionadas):
--   - DROP COLUMN departamento_id en proyectos (datos migrados a N:M)
--   - DROP COLUMN departamento_id en personas (datos migrados a N:M)
--   - DROP CONSTRAINT en ordenes_trabajo (reemplazada por nueva UNIQUE)
-- ============================================================

BEGIN;

-- Habilitar extensión moddatetime (para triggers updated_at)
CREATE EXTENSION IF NOT EXISTS moddatetime SCHEMA extensions;

-- =====================
-- 1. proyectos_departamentos
-- =====================
CREATE TABLE proyectos_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  proyecto_id UUID NOT NULL REFERENCES proyectos(id) ON DELETE CASCADE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(proyecto_id, departamento_id)
);

CREATE INDEX idx_proyectos_departamentos_proyecto ON proyectos_departamentos(proyecto_id);
CREATE INDEX idx_proyectos_departamentos_depto ON proyectos_departamentos(departamento_id);

-- Migrar: cada proyecto tenía un único departamento_id
INSERT INTO proyectos_departamentos (proyecto_id, departamento_id)
SELECT id, departamento_id
FROM proyectos
WHERE departamento_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Eliminar columna original
ALTER TABLE proyectos DROP COLUMN departamento_id;

-- =====================
-- 2. personas_departamentos
-- =====================
CREATE TABLE personas_departamentos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id UUID NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  departamento_id UUID NOT NULL REFERENCES departamentos(id) ON DELETE RESTRICT,
  porcentaje_tiempo NUMERIC NOT NULL DEFAULT 100
    CHECK (porcentaje_tiempo > 0 AND porcentaje_tiempo <= 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(persona_id, departamento_id)
);

CREATE INDEX idx_personas_departamentos_persona ON personas_departamentos(persona_id);
CREATE INDEX idx_personas_departamentos_depto ON personas_departamentos(departamento_id);

-- Trigger updated_at
CREATE TRIGGER trg_personas_departamentos_updated_at
  BEFORE UPDATE ON personas_departamentos
  FOR EACH ROW
  EXECUTE FUNCTION extensions.moddatetime(updated_at);

-- Migrar: cada persona tenía un único departamento_id al 100%
INSERT INTO personas_departamentos (persona_id, departamento_id, porcentaje_tiempo)
SELECT id, departamento_id, 100
FROM personas
WHERE departamento_id IS NOT NULL
ON CONFLICT DO NOTHING;

-- Eliminar columna original
ALTER TABLE personas DROP COLUMN departamento_id;

-- =====================
-- 3. departamento_id en ordenes_trabajo
-- =====================
ALTER TABLE ordenes_trabajo
  ADD COLUMN departamento_id UUID REFERENCES departamentos(id) ON DELETE RESTRICT;

-- Migrar: asignar el primer departamento del proyecto a cada orden.
-- Usamos DISTINCT ON para evitar duplicados si un proyecto ya tiene varios deptos.
UPDATE ordenes_trabajo ot
SET departamento_id = sub.departamento_id
FROM (
  SELECT DISTINCT ON (proyecto_id) proyecto_id, departamento_id
  FROM proyectos_departamentos
  ORDER BY proyecto_id, created_at
) sub
WHERE ot.proyecto_id = sub.proyecto_id;

-- Hacer NOT NULL tras migrar datos
ALTER TABLE ordenes_trabajo
  ALTER COLUMN departamento_id SET NOT NULL;

CREATE INDEX idx_ordenes_trabajo_depto ON ordenes_trabajo(departamento_id);

-- Reemplazar constraint UNIQUE
ALTER TABLE ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_proyecto_id_servicio_id_mes_anio_key;

ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT ordenes_trabajo_proyecto_dept_mes_key
  UNIQUE(proyecto_id, departamento_id, mes_anio);

COMMIT;
