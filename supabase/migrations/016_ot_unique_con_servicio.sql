-- ============================================================
-- Migración 016: Ampliar UNIQUE de ordenes_trabajo para incluir servicio_id
--
-- Antes:  UNIQUE(proyecto_id, departamento_id, mes_anio)
--   → Un departamento solo podía tener 1 OT por proyecto/mes
--
-- Después: UNIQUE(proyecto_id, departamento_id, servicio_id, mes_anio)
--   → Un departamento puede tener varias OTs por proyecto/mes
--     siempre que sean servicios distintos
-- ============================================================

-- 1. Eliminar el constraint antiguo
ALTER TABLE ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_proyecto_id_departamento_id_mes_anio_key;

-- 2. Crear el nuevo constraint con servicio_id
ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT ordenes_trabajo_proyecto_depto_servicio_mes_key
  UNIQUE (proyecto_id, departamento_id, servicio_id, mes_anio);
