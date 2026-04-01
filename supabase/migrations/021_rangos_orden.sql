-- 021_rangos_orden.sql
--
-- Añade el campo 'orden' a rangos_internos para reflejar la jerarquía
-- de cada empresa del grupo (1 = más alto, 9 = más bajo).
-- Los rangos equivalentes entre empresas comparten el mismo número de orden,
-- aunque tengan nombres distintos (ej: Director / Chief / Dept Head → orden 2).

ALTER TABLE rangos_internos
  ADD COLUMN IF NOT EXISTS orden integer;
