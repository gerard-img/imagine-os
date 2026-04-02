-- 036_cuotas_dmm_kau_bbd.sql
-- Duplicar cuotas vigentes de DME (Digital Menta España) para DMM, KAU y BBD.
-- Las cuotas vigentes son las que tienen fin_validez IS NULL.

BEGIN;

-- DMM (Digital Menta Mexico)
INSERT INTO cuotas_planificacion (empresa_grupo_id, nombre, precio_hora, inicio_validez, fin_validez, nota)
SELECT
  '10000000-0000-0000-0000-000000000001', -- DMM
  nombre,
  precio_hora,
  inicio_validez,
  NULL,
  'Copiada de DME'
FROM cuotas_planificacion
WHERE empresa_grupo_id = '10000000-0000-0000-0000-000000000002' -- DME
  AND fin_validez IS NULL;

-- KAU (Kauai Agency)
INSERT INTO cuotas_planificacion (empresa_grupo_id, nombre, precio_hora, inicio_validez, fin_validez, nota)
SELECT
  '10000000-0000-0000-0000-000000000004', -- KAU
  nombre,
  precio_hora,
  inicio_validez,
  NULL,
  'Copiada de DME'
FROM cuotas_planificacion
WHERE empresa_grupo_id = '10000000-0000-0000-0000-000000000002' -- DME
  AND fin_validez IS NULL;

-- BBD (BidBalance)
INSERT INTO cuotas_planificacion (empresa_grupo_id, nombre, precio_hora, inicio_validez, fin_validez, nota)
SELECT
  '10000000-0000-0000-0000-000000000005', -- BBD
  nombre,
  precio_hora,
  inicio_validez,
  NULL,
  'Copiada de DME'
FROM cuotas_planificacion
WHERE empresa_grupo_id = '10000000-0000-0000-0000-000000000002' -- DME
  AND fin_validez IS NULL;

COMMIT;
