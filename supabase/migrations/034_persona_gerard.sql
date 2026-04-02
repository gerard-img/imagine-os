-- 034_persona_gerard.sql
-- Añade el puesto "CEO / Fundador" para IMG e inserta a Gerard como persona.

BEGIN;

-- Puesto CEO / Fundador para Imagine Group (IMG)
INSERT INTO puestos (id, empresa_grupo_id, nombre, codigo)
VALUES (
  '50000000-0000-0000-0000-000000030010',
  '10000000-0000-0000-0000-000000000003',  -- IMG
  'CEO / Fundador',
  'P10'
)
ON CONFLICT DO NOTHING;

-- Persona: Gerard Hoogeveen Gonzalez
INSERT INTO personas (
  id, persona, dni, nombre, apellido_primero, apellido_segundo,
  empresa_grupo_id, ciudad_id, rango_id, puesto_id, division_id, rol_id,
  fecha_incorporacion, activo, rango_es_interino, email_corporativo
) VALUES (
  gen_random_uuid(),
  'Gerard H',
  '00000000G',                                   -- DNI placeholder
  'Gerard',
  'Hoogeveen',
  'Gonzalez',
  '10000000-0000-0000-0000-000000000003',        -- IMG
  '80000000-0000-0000-0000-000000000001',        -- Valencia
  '40000000-0000-0000-0000-000000003001',        -- Rango: Socio (IMG)
  '50000000-0000-0000-0000-000000030010',        -- Puesto: CEO / Fundador (IMG)
  '60000000-0000-0000-0000-000000000006',        -- División: DIRE
  '70000000-0000-0000-0000-000000000001',        -- Rol: Fundador
  '2020-01-01',
  true,
  false,
  'gerard@imagine.partners'
)
ON CONFLICT DO NOTHING;

COMMIT;
