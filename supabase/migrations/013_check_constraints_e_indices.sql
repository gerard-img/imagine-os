-- ============================================================
-- Migración 013: CHECK constraints, índices FK y corrección CASCADE
--
-- Protecciones contra errores de datos:
--   1. CHECK constraints en campos numéricos (no negativos, rangos válidos)
--   2. Índices en foreign keys más consultadas (rendimiento)
--   3. Cambiar ON DELETE CASCADE → RESTRICT en proyectos_departamentos
--   4. UNIQUE en lookups globales (ciudades, oficinas, roles, divisiones)
-- ============================================================

BEGIN;

-- ============================================================
-- 1. CHECK CONSTRAINTS — Campos numéricos
-- ============================================================

-- proyectos.ppto_estimado: no puede ser negativo
ALTER TABLE proyectos
  ADD CONSTRAINT chk_proyectos_ppto_no_negativo
  CHECK (ppto_estimado >= 0);

-- ordenes_trabajo.porcentaje_ppto_mes: entre 0 y 100
ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT chk_ot_porcentaje_ppto_mes_rango
  CHECK (porcentaje_ppto_mes >= 0 AND porcentaje_ppto_mes <= 100);

-- ordenes_trabajo.partida_prevista: no puede ser negativa
ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT chk_ot_partida_prevista_no_negativa
  CHECK (partida_prevista >= 0);

-- ordenes_trabajo.partida_real: no puede ser negativa (cuando tiene valor)
ALTER TABLE ordenes_trabajo
  ADD CONSTRAINT chk_ot_partida_real_no_negativa
  CHECK (partida_real IS NULL OR partida_real >= 0);

-- asignaciones.porcentaje_ppto_tm: entre 0 y 100
ALTER TABLE asignaciones
  ADD CONSTRAINT chk_asig_porcentaje_rango
  CHECK (porcentaje_ppto_tm >= 0 AND porcentaje_ppto_tm <= 100);

-- cuotas_planificacion.precio_hora: debe ser mayor que 0
ALTER TABLE cuotas_planificacion
  ADD CONSTRAINT chk_cuota_precio_hora_positivo
  CHECK (precio_hora > 0);

-- horas_trabajables.horas: debe ser mayor que 0
ALTER TABLE horas_trabajables
  ADD CONSTRAINT chk_horas_trabajables_positivas
  CHECK (horas > 0);

-- personas_departamentos.porcentaje_tiempo ya tiene CHECK (migración 003) ✓

-- ============================================================
-- 2. ÍNDICES en foreign keys más consultadas
-- ============================================================

-- asignaciones: se consultan por orden, persona y cuota
CREATE INDEX IF NOT EXISTS idx_asignaciones_orden_trabajo
  ON asignaciones(orden_trabajo_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_persona
  ON asignaciones(persona_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_cuota
  ON asignaciones(cuota_planificacion_id);

-- ordenes_trabajo: se consultan por proyecto, servicio y mes
CREATE INDEX IF NOT EXISTS idx_ordenes_trabajo_proyecto
  ON ordenes_trabajo(proyecto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_trabajo_servicio
  ON ordenes_trabajo(servicio_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_trabajo_mes
  ON ordenes_trabajo(mes_anio);

-- ordenes_trabajo_personas: se consultan por orden y persona
CREATE INDEX IF NOT EXISTS idx_ot_personas_orden
  ON ordenes_trabajo_personas(orden_trabajo_id);
CREATE INDEX IF NOT EXISTS idx_ot_personas_persona
  ON ordenes_trabajo_personas(persona_id);

-- personas: se consultan por empresa_grupo
CREATE INDEX IF NOT EXISTS idx_personas_empresa_grupo
  ON personas(empresa_grupo_id);

-- proyectos: se consultan por empresa y empresa_grupo
CREATE INDEX IF NOT EXISTS idx_proyectos_empresa
  ON proyectos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_empresa_grupo
  ON proyectos(empresa_grupo_id);

-- catalogo_servicios y departamentos: por empresa_grupo
CREATE INDEX IF NOT EXISTS idx_catalogo_servicios_empresa_grupo
  ON catalogo_servicios(empresa_grupo_id);
CREATE INDEX IF NOT EXISTS idx_departamentos_empresa_grupo
  ON departamentos(empresa_grupo_id);

-- horas_trabajables: por empresa_grupo y mes
CREATE INDEX IF NOT EXISTS idx_horas_trabajables_empresa_mes
  ON horas_trabajables(empresa_grupo_id, mes_trabajo);

-- cuotas_planificacion: por empresa_grupo
CREATE INDEX IF NOT EXISTS idx_cuotas_planificacion_empresa_grupo
  ON cuotas_planificacion(empresa_grupo_id);

-- ============================================================
-- 3. Corregir ON DELETE CASCADE en proyectos_departamentos
-- ============================================================

-- Quitar la FK actual con CASCADE y recrear con RESTRICT.
-- Esto impide borrar un proyecto si tiene departamentos asignados
-- (obliga a limpiar relaciones antes de borrar).
ALTER TABLE proyectos_departamentos
  DROP CONSTRAINT IF EXISTS proyectos_departamentos_proyecto_id_fkey;

ALTER TABLE proyectos_departamentos
  ADD CONSTRAINT proyectos_departamentos_proyecto_id_fkey
  FOREIGN KEY (proyecto_id) REFERENCES proyectos(id) ON DELETE RESTRICT;

-- personas_departamentos ya tiene ON DELETE CASCADE en persona_id,
-- lo cual es aceptable (si se borra una persona, sus asignaciones
-- a departamentos se van también). departamento_id ya es RESTRICT. ✓

-- ============================================================
-- 4. UNIQUE en lookups globales
-- ============================================================

-- Evitar nombres duplicados en catálogos globales
ALTER TABLE ciudades
  ADD CONSTRAINT uq_ciudades_nombre UNIQUE (nombre);

ALTER TABLE oficinas
  ADD CONSTRAINT uq_oficinas_nombre UNIQUE (nombre);

-- roles y divisiones ya no tienen empresa_grupo_id (migración 010),
-- así que el nombre debe ser único globalmente
ALTER TABLE roles
  ADD CONSTRAINT uq_roles_nombre UNIQUE (nombre);

ALTER TABLE divisiones
  ADD CONSTRAINT uq_divisiones_nombre UNIQUE (nombre);

COMMIT;
