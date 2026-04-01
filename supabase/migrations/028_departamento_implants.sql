-- 028_departamento_implants.sql
-- Añade el departamento "Implants" a las 7 empresas del grupo.
-- Código: IMP. UUIDs: 30000000-0000-0000-0000-0000000000XX (60-66)

INSERT INTO departamentos (id, empresa_grupo_id, nombre, codigo, descripcion) VALUES
  ('30000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000001', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- DMM
  ('30000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-000000000002', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- DME
  ('30000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-000000000003', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- IMG
  ('30000000-0000-0000-0000-000000000063', '10000000-0000-0000-0000-000000000004', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- KAU
  ('30000000-0000-0000-0000-000000000064', '10000000-0000-0000-0000-000000000005', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- BBD
  ('30000000-0000-0000-0000-000000000065', '10000000-0000-0000-0000-000000000006', 'Implants', 'IMP', 'Personas implantadas en cliente'),  -- DRR
  ('30000000-0000-0000-0000-000000000066', '10000000-0000-0000-0000-000000000007', 'Implants', 'IMP', 'Personas implantadas en cliente');   -- AUR
