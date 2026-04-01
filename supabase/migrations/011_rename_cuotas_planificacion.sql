-- ============================================================
-- Migración 011: Renombrar cuotas_por_rango → cuotas_planificacion
--
-- Las cuotas de planificación NO están relacionadas con los
-- rangos internos (RRHH). Tienen sus propios nombres
-- (Intern, Junior, Specialist, Senior, Coordinador) y cada
-- empresa del grupo define las suyas con precio/hora.
--
-- Cambios:
--   - Renombrar tabla cuotas_por_rango → cuotas_planificacion
--   - Quitar columna rango_id (FK a rangos_internos)
--   - Añadir columna nombre (text, NOT NULL)
--   - Renombrar FK en asignaciones
--   - Insertar datos reales de DME (2 periodos)
-- ============================================================

-- ── 1. Quitar FK de asignaciones que apunta a cuotas_por_rango ──

ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS asignaciones_cuota_rango_id_fkey;

-- ── 2. Renombrar la tabla ──

ALTER TABLE cuotas_por_rango RENAME TO cuotas_planificacion;

-- ── 3. Renombrar trigger ──

ALTER TRIGGER trg_cuotas_por_rango_updated_at ON cuotas_planificacion
  RENAME TO trg_cuotas_planificacion_updated_at;

-- ── 4. Quitar rango_id y añadir nombre ──

-- Primero añadimos nombre con default temporal para los datos existentes
ALTER TABLE cuotas_planificacion ADD COLUMN nombre TEXT;

-- Rellenar nombre a partir del rango_id existente (para no perder datos)
UPDATE cuotas_planificacion cp
SET nombre = ri.nombre
FROM rangos_internos ri
WHERE cp.rango_id = ri.id;

-- Los que no hayan encontrado match
UPDATE cuotas_planificacion
SET nombre = 'Sin nombre'
WHERE nombre IS NULL;

-- Ahora sí, NOT NULL
ALTER TABLE cuotas_planificacion ALTER COLUMN nombre SET NOT NULL;

-- Quitar FK y columna rango_id
ALTER TABLE cuotas_planificacion DROP CONSTRAINT IF EXISTS cuotas_por_rango_rango_id_fkey;
ALTER TABLE cuotas_planificacion DROP COLUMN IF EXISTS rango_id;

-- ── 5. Renombrar columna en asignaciones ──

ALTER TABLE asignaciones RENAME COLUMN cuota_rango_id TO cuota_planificacion_id;

-- ── 6. Restaurar FK de asignaciones ──

ALTER TABLE asignaciones
  ADD CONSTRAINT asignaciones_cuota_planificacion_id_fkey
  FOREIGN KEY (cuota_planificacion_id) REFERENCES cuotas_planificacion(id) ON DELETE RESTRICT;

-- ── 7. Borrar datos ficticios e insertar datos reales DME ──

-- Primero quitar FK temporalmente para poder borrar cuotas referenciadas
ALTER TABLE asignaciones DROP CONSTRAINT IF EXISTS asignaciones_cuota_planificacion_id_fkey;

-- Borrar asignaciones ficticias (apuntan a cuotas que vamos a borrar)
DELETE FROM asignaciones;

-- Borrar cuotas ficticias
DELETE FROM cuotas_planificacion;

-- Insertar datos reales DME — periodo vigente (2026)
INSERT INTO cuotas_planificacion (id, empresa_grupo_id, nombre, precio_hora, inicio_validez, fin_validez, nota) VALUES
  ('d0000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000002', 'Intern',       27.5,  '2026-01-01', NULL, NULL),
  ('d0000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Junior',       42.9,  '2026-01-01', NULL, NULL),
  ('d0000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Specialist',   52.8,  '2026-01-01', NULL, NULL),
  ('d0000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'Senior',       71.5,  '2026-01-01', NULL, NULL),
  ('d0000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Coordinador',  82.5,  '2026-01-01', NULL, NULL);

-- Insertar datos reales DME — periodo anterior (abr 2025 – dic 2025)
INSERT INTO cuotas_planificacion (id, empresa_grupo_id, nombre, precio_hora, inicio_validez, fin_validez, nota) VALUES
  ('d0000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'Intern',       25,    '2025-04-01', '2025-12-31', 'Tarifa anterior'),
  ('d0000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000002', 'Junior',       39,    '2025-04-01', '2025-12-31', 'Tarifa anterior'),
  ('d0000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000002', 'Specialist',   48,    '2025-04-01', '2025-12-31', 'Tarifa anterior'),
  ('d0000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'Senior',       65,    '2025-04-01', '2025-12-31', 'Tarifa anterior'),
  ('d0000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'Coordinador',  75,    '2025-04-01', '2025-12-31', 'Tarifa anterior');

-- Restaurar FK
ALTER TABLE asignaciones
  ADD CONSTRAINT asignaciones_cuota_planificacion_id_fkey
  FOREIGN KEY (cuota_planificacion_id) REFERENCES cuotas_planificacion(id) ON DELETE RESTRICT;

-- ── 8. RLS (mantener permisiva como el resto del MVP) ──

-- La tabla ya tiene RLS habilitado desde la migración original.
-- Solo necesitamos renombrar la policy si existe.
DROP POLICY IF EXISTS "Allow all authenticated" ON cuotas_planificacion;
CREATE POLICY "Allow all authenticated" ON cuotas_planificacion
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
