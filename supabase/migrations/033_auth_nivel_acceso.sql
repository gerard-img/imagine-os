-- 033_auth_nivel_acceso.sql
-- Paso 1 de autenticación: conectar auth.users con personas + niveles de acceso.
--
-- 1. Añade auth_user_id a personas (vincula login ↔ persona).
-- 2. Añade nivel_acceso a roles (global / empresa / personal).
-- 3. Crea función helper get_mi_nivel_acceso() para usar en RLS.

BEGIN;

-- =====================================================================
-- 1. personas.auth_user_id — vincula cada persona con su cuenta de login
-- =====================================================================
ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE REFERENCES auth.users(id);

-- Índice para buscar persona por auth_user_id rápidamente
CREATE INDEX IF NOT EXISTS idx_personas_auth_user_id ON personas(auth_user_id);

-- =====================================================================
-- 2. roles.nivel_acceso — define qué nivel de datos puede ver cada rol
--    'global'   → todo el holding (Fundador, Socio, Administrador)
--    'empresa'  → solo su empresa_grupo (Director, Coordinador, Responsable)
--    'personal' → solo sus horas asignadas (Miembro, Intern, Externo, Implant)
-- =====================================================================
ALTER TABLE roles
  ADD COLUMN IF NOT EXISTS nivel_acceso TEXT NOT NULL DEFAULT 'personal'
    CONSTRAINT chk_nivel_acceso CHECK (nivel_acceso IN ('global', 'empresa', 'personal'));

-- Asignar niveles a los roles existentes
UPDATE roles SET nivel_acceso = 'global'   WHERE nombre IN ('Fundador', 'Socio', 'Administrador');
UPDATE roles SET nivel_acceso = 'empresa'  WHERE nombre IN ('Director', 'Coordinador', 'Responsable');
UPDATE roles SET nivel_acceso = 'personal' WHERE nombre IN ('Miembro', 'Intern', 'Externo', 'Implant');

-- =====================================================================
-- 3. Función helper: get_mi_nivel_acceso()
--    Devuelve el nivel_acceso del usuario autenticado.
--    Uso en RLS: WHERE get_mi_nivel_acceso() = 'global' ...
-- =====================================================================
CREATE OR REPLACE FUNCTION get_mi_nivel_acceso()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT r.nivel_acceso
  FROM personas p
  JOIN roles r ON r.id = p.rol_id
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================================
-- 4. Función helper: get_mi_empresa_grupo_id()
--    Devuelve la empresa_grupo_id del usuario autenticado.
--    Uso en RLS para filtrar por empresa.
-- =====================================================================
CREATE OR REPLACE FUNCTION get_mi_empresa_grupo_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.empresa_grupo_id
  FROM personas p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

-- =====================================================================
-- 5. Función helper: get_mi_persona_id()
--    Devuelve el id de persona del usuario autenticado.
--    Uso en RLS para nivel 'personal'.
-- =====================================================================
CREATE OR REPLACE FUNCTION get_mi_persona_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT p.id
  FROM personas p
  WHERE p.auth_user_id = auth.uid()
  LIMIT 1;
$$;

COMMIT;
