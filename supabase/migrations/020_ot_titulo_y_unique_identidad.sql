-- 020_ot_titulo_y_unique_identidad.sql
--
-- Contexto de negocio:
--   Un departamento puede tener varias OTs para el mismo proyecto y mes,
--   diferenciadas por servicio. Incluso el mismo servicio puede aparecer
--   varias veces (ej. SEO España + SEO Francia), en cuyo caso se usa
--   el campo 'titulo' como discriminador opcional.
--
-- Cambios:
--   1. Añadir columna 'titulo' (text, nullable) a ordenes_trabajo.
--   2. Eliminar los dos índices parciales de la migración 019
--      (uq_ot_con_servicio y uq_ot_sin_servicio), que no cubrían
--      el caso de mismo servicio + título distinto.
--   3. Crear un único índice de expresión que trata NULLs como ''
--      mediante COALESCE, garantizando unicidad en todos los casos.
--
-- Lógica de unicidad resultante (deleted_at IS NULL):
--   (proyecto, depto, mes, '') + ('') → una sola OT sin servicio ni título
--   (proyecto, depto, mes, SEO-id) + ('') → una sola OT de SEO sin título
--   (proyecto, depto, mes, SEO-id) + ('España') → OT de SEO para España
--   (proyecto, depto, mes, SEO-id) + ('Francia') → compatible con la anterior

-- 1. Nueva columna
ALTER TABLE ordenes_trabajo
  ADD COLUMN IF NOT EXISTS titulo text;

-- 2. Eliminar índices anteriores (migración 019)
DROP INDEX IF EXISTS uq_ot_con_servicio;
DROP INDEX IF EXISTS uq_ot_sin_servicio;

-- 3. Índice unificado con expresión COALESCE
CREATE UNIQUE INDEX IF NOT EXISTS uq_ot_identidad
  ON ordenes_trabajo (
    proyecto_id,
    departamento_id,
    mes_anio,
    COALESCE(servicio_id::text, ''),
    COALESCE(titulo, '')
  )
  WHERE deleted_at IS NULL;
