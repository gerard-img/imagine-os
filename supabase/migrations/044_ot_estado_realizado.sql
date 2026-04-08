-- 044_ot_estado_realizado.sql
--
-- Añade el estado 'Realizado' a ordenes_trabajo.
-- Flujo completo: Propuesto → Planificado → Realizado → Confirmado → Facturado

ALTER TABLE ordenes_trabajo
  DROP CONSTRAINT IF EXISTS ordenes_trabajo_estado_check;

ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT ordenes_trabajo_estado_check
  CHECK (estado IN ('Propuesto', 'Planificado', 'Realizado', 'Confirmado', 'Facturado'));
