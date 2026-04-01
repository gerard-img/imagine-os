-- 019_ot_unique_parcial_servicio_nullable.sql
--
-- Problema: migración 016 creó UNIQUE(proyecto_id, departamento_id, servicio_id, mes_anio)
-- asumiendo que servicio_id era NOT NULL. La migración 018 lo hizo nullable.
--
-- En PostgreSQL, NULL ≠ NULL en UNIQUE constraints: múltiples filas con servicio_id = NULL
-- para el mismo proyecto/depto/mes pasarían el constraint, lo que permite duplicados
-- en las OTs generadas automáticamente.
--
-- Solución: dos índices únicos parciales que juntos cubren todos los casos:
--   1. Con servicio: UNIQUE por (proyecto, depto, servicio, mes) donde servicio IS NOT NULL
--   2. Sin servicio: UNIQUE por (proyecto, depto, mes)           donde servicio IS NULL
--   Ambos excluyen filas soft-deleted (deleted_at IS NOT NULL).

-- 1. Eliminar el constraint antiguo (creado en migración 016)
ALTER TABLE ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_proyecto_depto_servicio_mes_key;

-- 2. Índice único para OTs CON servicio asignado
CREATE UNIQUE INDEX IF NOT EXISTS uq_ot_con_servicio
  ON ordenes_trabajo (proyecto_id, departamento_id, servicio_id, mes_anio)
  WHERE servicio_id IS NOT NULL
    AND deleted_at IS NULL;

-- 3. Índice único para OTs SIN servicio (generadas automáticamente)
--    Solo puede existir una OT sin servicio por proyecto × departamento × mes.
CREATE UNIQUE INDEX IF NOT EXISTS uq_ot_sin_servicio
  ON ordenes_trabajo (proyecto_id, departamento_id, mes_anio)
  WHERE servicio_id IS NULL
    AND deleted_at IS NULL;
