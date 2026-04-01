-- 026_rangos_senior.sql
--
-- Añade el rango "Senior" a las 7 empresas del grupo,
-- posicionado entre Team Head/Lead (orden 4) y Miembro (orden 5).
--
-- Cambios de orden resultantes:
--   1 Socio
--   2 Director / Chief
--   3 Studio Head / Head / Dept Head
--   4 Team Head / Lead
--   5 Senior  ← NUEVO
--   6 Miembro
--   7 Junior
--   8 Intern
--   9 Externo
--  10 Implant

BEGIN;

-- 1. Desplazar hacia abajo los rangos existentes desde Miembro (5→10)
UPDATE rangos_internos SET orden = orden + 1
WHERE orden >= 5;

-- 2. Insertar Senior en orden 5 para las 7 empresas
-- UUID: 40000000-0000-0000-0000-0000000E0050 (E = nº empresa)
INSERT INTO rangos_internos (id, empresa_grupo_id, nombre, codigo, orden) VALUES
  ('40000000-0000-0000-0000-000000001050', '10000000-0000-0000-0000-000000000001', 'Senior', 'SR', 5), -- DMM
  ('40000000-0000-0000-0000-000000002050', '10000000-0000-0000-0000-000000000002', 'Senior', 'SR', 5), -- DME
  ('40000000-0000-0000-0000-000000003050', '10000000-0000-0000-0000-000000000003', 'Senior', 'SR', 5), -- IMG
  ('40000000-0000-0000-0000-000000004050', '10000000-0000-0000-0000-000000000004', 'Senior', 'SR', 5), -- KAU
  ('40000000-0000-0000-0000-000000005050', '10000000-0000-0000-0000-000000000005', 'Senior', 'SR', 5), -- BBD
  ('40000000-0000-0000-0000-000000006050', '10000000-0000-0000-0000-000000000006', 'Senior', 'SR', 5), -- DRR
  ('40000000-0000-0000-0000-000000007050', '10000000-0000-0000-0000-000000000007', 'Senior', 'SR', 5); -- AUR

COMMIT;
