-- 039_drop_constraint_ot_fantasma.sql
--
-- Bug: la migración 003 creó el constraint:
--   ordenes_trabajo_proyecto_dept_mes_key  UNIQUE(proyecto_id, departamento_id, mes_anio)
--
-- La migración 016 intentó eliminarlo pero usó un nombre distinto:
--   ordenes_trabajo_proyecto_id_departamento_id_mes_anio_key  (no existía)
--
-- Como se usó IF EXISTS, no hubo error, pero el constraint original nunca se borró.
-- Esto impide crear varias OTs para el mismo proyecto + departamento + mes
-- aunque tengan distinto servicio o título.
--
-- Fix: eliminar el constraint fantasma que sigue activo.

ALTER TABLE ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_proyecto_dept_mes_key;
