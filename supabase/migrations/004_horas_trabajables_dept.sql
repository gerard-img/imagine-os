-- ============================================================
-- Migración 004: horas_trabajables — servicio_id → departamento_id
--
-- Cambios:
--   1. Renombrar columna servicio_id a departamento_id
--   2. Actualizar FK para apuntar a departamentos en vez de catalogo_servicios
--   3. Migrar datos: mapear servicio_id → departamento_id vía servicios_y_depts
--
-- Operaciones destructivas (intencionadas):
--   - DROP CONSTRAINT FK original (servicio_id → catalogo_servicios)
--   - RENAME COLUMN servicio_id → departamento_id
-- ============================================================

BEGIN;

-- 1. Eliminar FK antigua PRIMERO (antes de tocar datos)
ALTER TABLE horas_trabajables
  DROP CONSTRAINT IF EXISTS horas_trabajables_servicio_id_fkey;

-- 2. Migrar valores existentes: convertir servicio_id a su departamento correspondiente
--    usando la tabla intermedia servicios_y_depts
UPDATE horas_trabajables ht
SET servicio_id = sd.departamento_id
FROM servicios_y_depts sd
WHERE ht.servicio_id IS NOT NULL
  AND ht.servicio_id = sd.servicio_id;

-- 3. Renombrar columna
ALTER TABLE horas_trabajables
  RENAME COLUMN servicio_id TO departamento_id;

-- 4. Crear nueva FK (departamento_id → departamentos)
ALTER TABLE horas_trabajables
  ADD CONSTRAINT horas_trabajables_departamento_id_fkey
  FOREIGN KEY (departamento_id) REFERENCES departamentos(id) ON DELETE RESTRICT;

-- 5. Crear índice para la nueva FK
CREATE INDEX IF NOT EXISTS idx_horas_trabajables_depto
  ON horas_trabajables(departamento_id);

COMMIT;
