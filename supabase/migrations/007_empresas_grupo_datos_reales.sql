-- ============================================================
-- Migración 007: Datos reales de empresas_grupo
--
-- Actualiza los 3 registros existentes del seed y añade 4 nuevos.
-- ============================================================

-- Actualizar registros existentes
UPDATE empresas_grupo SET nombre = 'Digital Menta Mexico', nombre_legal = 'DIGITAL MENTA MEXICO SA DE CV', codigo = 'DMM', cif = 'DMM220217727' WHERE id = '10000000-0000-0000-0000-000000000001';
UPDATE empresas_grupo SET nombre = 'Digital Menta España', nombre_legal = 'DIGITALMENTA MARKETING SL', codigo = 'DME', cif = 'B42777821' WHERE id = '10000000-0000-0000-0000-000000000002';
UPDATE empresas_grupo SET nombre = 'Imagine Group', nombre_legal = 'IMAGINE FOREVER SL', codigo = 'IMG', cif = 'B24902843' WHERE id = '10000000-0000-0000-0000-000000000003';

-- Insertar nuevos registros
INSERT INTO empresas_grupo (id, nombre, nombre_legal, codigo, cif) VALUES
  ('10000000-0000-0000-0000-000000000004', 'Kauai Agency', 'CREATIVE JUMP LAB SL', 'KAU', 'B16399404'),
  ('10000000-0000-0000-0000-000000000005', 'BidBalance', 'ZAZEN DIGITAL SL', 'BBD', 'B88249529'),
  ('10000000-0000-0000-0000-000000000006', 'Dr Roberts', 'DR ROBERTS STRATEGY AND AI STUDIO SL', 'DRR', 'B22838494'),
  ('10000000-0000-0000-0000-000000000007', 'Aurea People', 'MENTA MAKERS SL', 'AUR', 'B40610214');
