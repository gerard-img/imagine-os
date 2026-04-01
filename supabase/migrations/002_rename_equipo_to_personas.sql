-- ============================================================
-- Migración: Renombrar "equipo" → "personas"
--            Renombrar "nombre_interno" → "persona" (solo en personas)
--            Renombrar "equipo_id" → "persona_id" en todas las tablas
--            Renombrar "ordenes_trabajo_equipo" → "ordenes_trabajo_personas"
-- ============================================================

-- 1. Renombrar la tabla principal
ALTER TABLE equipo RENAME TO personas;

-- 2. Renombrar la columna nombre_interno → persona en la tabla personas
ALTER TABLE personas RENAME COLUMN nombre_interno TO persona;

-- 3. Renombrar equipo_id → persona_id en las tablas que existen
-- NOTA: condiciones, ausencias y evolucion no se crearon en 001, se renombrarán cuando se creen.
ALTER TABLE asignaciones RENAME COLUMN equipo_id TO persona_id;
ALTER TABLE horas_trabajables RENAME COLUMN equipo_id TO persona_id;

-- 4. Renombrar la tabla intermedia
ALTER TABLE ordenes_trabajo_equipo RENAME TO ordenes_trabajo_personas;

-- 5. Renombrar equipo_id → persona_id en la tabla intermedia renombrada
ALTER TABLE ordenes_trabajo_personas RENAME COLUMN equipo_id TO persona_id;

-- 6. Renombrar el trigger (opcional pero mantiene consistencia)
ALTER TRIGGER trg_equipo_updated_at ON personas RENAME TO trg_personas_updated_at;

-- 7. Renombrar la constraint UNIQUE en asignaciones
-- (la constraint original es: UNIQUE (orden_trabajo_id, equipo_id))
-- PostgreSQL renombró la columna pero el nombre de la constraint queda viejo.
-- Renombramos para consistencia:
ALTER INDEX IF EXISTS asignaciones_orden_trabajo_id_equipo_id_key
  RENAME TO asignaciones_orden_trabajo_id_persona_id_key;
