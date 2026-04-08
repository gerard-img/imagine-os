-- Permite asignar la misma persona a una OT con cuotas distintas.
-- Antes: UNIQUE(orden_trabajo_id, persona_id)
-- Ahora: UNIQUE(orden_trabajo_id, persona_id, cuota_planificacion_id)

ALTER TABLE asignaciones
  DROP CONSTRAINT IF EXISTS asignaciones_orden_trabajo_id_persona_id_key;

ALTER TABLE asignaciones
  ADD CONSTRAINT asignaciones_ot_persona_cuota_key
  UNIQUE (orden_trabajo_id, persona_id, cuota_planificacion_id);
