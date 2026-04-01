-- ============================================================
-- Migración 015: Validar coherencia empresa_grupo en departamentos
--
-- Problema: las tablas personas_departamentos y proyectos_departamentos
-- no validan que el departamento pertenezca a la misma empresa_grupo
-- que la persona o el proyecto. Esto permite datos incoherentes.
--
-- Solución: triggers BEFORE INSERT OR UPDATE que verifican la relación.
-- ============================================================

-- ── 1. Trigger para personas_departamentos ──
-- Verifica que departamento.empresa_grupo_id = persona.empresa_grupo_id

CREATE OR REPLACE FUNCTION validar_persona_departamento_empresa_grupo()
RETURNS TRIGGER AS $$
DECLARE
  v_persona_eg UUID;
  v_depto_eg   UUID;
BEGIN
  SELECT empresa_grupo_id INTO v_persona_eg
    FROM personas WHERE id = NEW.persona_id;

  SELECT empresa_grupo_id INTO v_depto_eg
    FROM departamentos WHERE id = NEW.departamento_id;

  IF v_persona_eg IS DISTINCT FROM v_depto_eg THEN
    RAISE EXCEPTION
      'El departamento no pertenece a la misma empresa del grupo que la persona. '
      'Persona empresa_grupo_id=%, Departamento empresa_grupo_id=%',
      v_persona_eg, v_depto_eg;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_persona_depto_eg
  BEFORE INSERT OR UPDATE ON personas_departamentos
  FOR EACH ROW
  EXECUTE FUNCTION validar_persona_departamento_empresa_grupo();


-- ── 2. Trigger para proyectos_departamentos ──
-- Verifica que departamento.empresa_grupo_id = proyecto.empresa_grupo_id

CREATE OR REPLACE FUNCTION validar_proyecto_departamento_empresa_grupo()
RETURNS TRIGGER AS $$
DECLARE
  v_proyecto_eg UUID;
  v_depto_eg    UUID;
BEGIN
  SELECT empresa_grupo_id INTO v_proyecto_eg
    FROM proyectos WHERE id = NEW.proyecto_id;

  SELECT empresa_grupo_id INTO v_depto_eg
    FROM departamentos WHERE id = NEW.departamento_id;

  IF v_proyecto_eg IS DISTINCT FROM v_depto_eg THEN
    RAISE EXCEPTION
      'El departamento no pertenece a la misma empresa del grupo que el proyecto. '
      'Proyecto empresa_grupo_id=%, Departamento empresa_grupo_id=%',
      v_proyecto_eg, v_depto_eg;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validar_proyecto_depto_eg
  BEFORE INSERT OR UPDATE ON proyectos_departamentos
  FOR EACH ROW
  EXECUTE FUNCTION validar_proyecto_departamento_empresa_grupo();


-- ── 3. Verificar datos existentes ──
-- Estas queries detectan filas incoherentes ya existentes.
-- Si devuelven resultados, hay que corregirlos manualmente.

DO $$
DECLARE
  v_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO v_count
  FROM personas_departamentos pd
  JOIN personas p ON p.id = pd.persona_id
  JOIN departamentos d ON d.id = pd.departamento_id
  WHERE p.empresa_grupo_id <> d.empresa_grupo_id;

  IF v_count > 0 THEN
    RAISE WARNING '⚠ Hay % filas incoherentes en personas_departamentos (empresa_grupo no coincide)', v_count;
  END IF;

  SELECT COUNT(*) INTO v_count
  FROM proyectos_departamentos pd
  JOIN proyectos p ON p.id = pd.proyecto_id
  JOIN departamentos d ON d.id = pd.departamento_id
  WHERE p.empresa_grupo_id <> d.empresa_grupo_id;

  IF v_count > 0 THEN
    RAISE WARNING '⚠ Hay % filas incoherentes en proyectos_departamentos (empresa_grupo no coincide)', v_count;
  END IF;
END;
$$;
