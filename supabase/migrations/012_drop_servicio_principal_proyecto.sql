-- ============================================================
-- Migración 012: Quitar servicio_principal_id de proyectos
--
-- Los servicios se definen a nivel de orden de trabajo, no de
-- proyecto. El nombre compuesto del proyecto pasa a ser:
--   empresa.nombre_interno - proyecto.titulo
--
-- Cambios:
--   - DROP COLUMN servicio_principal_id de proyectos
--   - DROP FK asociada
-- ============================================================

-- ── 1. Quitar FK ──
ALTER TABLE proyectos DROP CONSTRAINT IF EXISTS proyectos_servicio_principal_id_fkey;

-- ── 2. Quitar columna ──
ALTER TABLE proyectos DROP COLUMN IF EXISTS servicio_principal_id;
