-- 018_servicio_id_nullable_ot.sql
-- El servicio de una OT se define al revisarla, no al generarla automáticamente.
-- Al generar OTs de proyectos Puntuales o Recurrentes, el servicio se rellena después.

ALTER TABLE ordenes_trabajo
  ALTER COLUMN servicio_id DROP NOT NULL;
