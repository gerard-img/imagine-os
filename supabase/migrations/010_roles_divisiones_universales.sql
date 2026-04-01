-- ============================================================
-- Migración 010: Roles y Divisiones universales
--
-- Roles y Divisiones son iguales para todas las personas,
-- independientes de la empresa del grupo.
--
-- Cambios de esquema:
--   - DROP COLUMN empresa_grupo_id de roles y divisiones
--
-- Datos:
--   - 10 roles reales
--   - 6 divisiones reales
-- ============================================================

-- ── 1. Quitar FKs que apuntan a roles y divisiones ──
--    (intentamos ambos nombres posibles: personas_* y equipo_*)

ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_rol_id_fkey;
ALTER TABLE personas DROP CONSTRAINT IF EXISTS equipo_rol_id_fkey;
ALTER TABLE personas DROP CONSTRAINT IF EXISTS personas_division_id_fkey;
ALTER TABLE personas DROP CONSTRAINT IF EXISTS equipo_division_id_fkey;

-- ── 2. ROLES: borrar datos viejos, insertar nuevos, quitar empresa_grupo_id ──

DELETE FROM roles;

-- Quitar FK y columna empresa_grupo_id
ALTER TABLE roles DROP CONSTRAINT IF EXISTS roles_empresa_grupo_id_fkey;
ALTER TABLE roles DROP COLUMN IF EXISTS empresa_grupo_id;

INSERT INTO roles (id, nombre, descripcion) VALUES
  ('70000000-0000-0000-0000-000000000001', 'Fundador', 'Socio fundador del grupo'),
  ('70000000-0000-0000-0000-000000000002', 'Administrador', 'Administración y finanzas'),
  ('70000000-0000-0000-0000-000000000003', 'Socio', 'Socio del grupo o empresa'),
  ('70000000-0000-0000-0000-000000000004', 'Director', 'Director de área o departamento'),
  ('70000000-0000-0000-0000-000000000005', 'Coordinador', 'Coordinador de equipo'),
  ('70000000-0000-0000-0000-000000000006', 'Responsable', 'Responsable de departamento o cuenta'),
  ('70000000-0000-0000-0000-000000000007', 'Miembro', 'Miembro del equipo'),
  ('70000000-0000-0000-0000-000000000008', 'Intern', 'Becario o persona en prácticas'),
  ('70000000-0000-0000-0000-000000000009', 'Externo', 'Colaborador externo o freelance'),
  ('70000000-0000-0000-0000-000000000010', 'Implant', 'Persona implantada en cliente');

-- ── 3. DIVISIONES: borrar datos viejos, insertar nuevos, quitar empresa_grupo_id ──

DELETE FROM divisiones;

-- Quitar FK y columna empresa_grupo_id
ALTER TABLE divisiones DROP CONSTRAINT IF EXISTS divisiones_empresa_grupo_id_fkey;
ALTER TABLE divisiones DROP COLUMN IF EXISTS empresa_grupo_id;

INSERT INTO divisiones (id, nombre, descripcion) VALUES
  ('60000000-0000-0000-0000-000000000001', 'BDEV', 'Business Development'),
  ('60000000-0000-0000-0000-000000000002', 'TALE', 'Talento y personas'),
  ('60000000-0000-0000-0000-000000000003', 'CONS', 'Consultoría'),
  ('60000000-0000-0000-0000-000000000004', 'OPER', 'Operaciones'),
  ('60000000-0000-0000-0000-000000000005', 'ADMI', 'Administración'),
  ('60000000-0000-0000-0000-000000000006', 'DIRE', 'Dirección');

-- ── 4. Actualizar personas a IDs válidos ──

-- Roles: las que apuntan a IDs inválidos → Miembro
UPDATE personas SET rol_id = '70000000-0000-0000-0000-000000000007'
WHERE rol_id NOT IN (SELECT id FROM roles);

-- Divisiones: las que apuntan a IDs inválidos → BDEV como fallback
UPDATE personas SET division_id = '60000000-0000-0000-0000-000000000001'
WHERE division_id NOT IN (SELECT id FROM divisiones);

-- ── 5. Restaurar FKs ──

ALTER TABLE personas
  ADD CONSTRAINT personas_rol_id_fkey
  FOREIGN KEY (rol_id) REFERENCES roles(id) ON DELETE RESTRICT;

ALTER TABLE personas
  ADD CONSTRAINT personas_division_id_fkey
  FOREIGN KEY (division_id) REFERENCES divisiones(id) ON DELETE RESTRICT;
