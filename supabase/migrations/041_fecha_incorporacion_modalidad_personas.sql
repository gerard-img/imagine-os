-- =============================================================================
-- 041: Cargar fecha_incorporacion en personas + tipo_contrato en condiciones
--      usando DNI como referencia. Datos del CSV de RRHH.
-- =============================================================================

BEGIN;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Ampliar CHECK constraint de tipo_contrato para incluir 'Sustitución'
-- ─────────────────────────────────────────────────────────────────────────────
ALTER TABLE condiciones
  DROP CONSTRAINT IF EXISTS condiciones_tipo_contrato_check;

ALTER TABLE condiciones
  ADD CONSTRAINT condiciones_tipo_contrato_check
  CHECK (tipo_contrato IN (
    'Indefinido', 'Temporal', 'Prácticas', 'Autónomo', 'Becario', 'Sustitución'
  ));

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Actualizar fecha_incorporacion en personas por DNI
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE personas SET fecha_incorporacion = '2019-11-01' WHERE TRIM(dni) = '45910110V';
UPDATE personas SET fecha_incorporacion = '2018-02-26' WHERE TRIM(dni) = '35594558B';
UPDATE personas SET fecha_incorporacion = '2019-10-01' WHERE TRIM(dni) = '23325063G';
UPDATE personas SET fecha_incorporacion = '2022-01-17' WHERE TRIM(dni) = '49220530R';
UPDATE personas SET fecha_incorporacion = '2025-04-01' WHERE TRIM(dni) = '43471011E';
UPDATE personas SET fecha_incorporacion = '2021-06-15' WHERE TRIM(dni) = '18455322F';
UPDATE personas SET fecha_incorporacion = '2023-05-08' WHERE TRIM(dni) = '20912831N';
UPDATE personas SET fecha_incorporacion = '2023-06-01' WHERE TRIM(dni) = '48713074V';
UPDATE personas SET fecha_incorporacion = '2025-01-13' WHERE TRIM(dni) = '48772306R';
UPDATE personas SET fecha_incorporacion = '2019-10-01' WHERE TRIM(dni) = '44922104E';
UPDATE personas SET fecha_incorporacion = '2023-12-18' WHERE TRIM(dni) = '48721670B';
UPDATE personas SET fecha_incorporacion = '2025-04-01' WHERE TRIM(dni) = '21790038E';
UPDATE personas SET fecha_incorporacion = '2025-04-29' WHERE TRIM(dni) = '47277899L';
UPDATE personas SET fecha_incorporacion = '2025-06-05' WHERE TRIM(dni) = 'Z1706591L';
UPDATE personas SET fecha_incorporacion = '2026-02-02' WHERE TRIM(dni) = '23941375P';
UPDATE personas SET fecha_incorporacion = '2026-02-17' WHERE TRIM(dni) = '05721575A';
UPDATE personas SET fecha_incorporacion = '2026-04-20' WHERE TRIM(dni) = '20913991E';
UPDATE personas SET fecha_incorporacion = '2026-03-09' WHERE TRIM(dni) = '23318272K';
UPDATE personas SET fecha_incorporacion = '2022-03-31' WHERE TRIM(dni) = '20496261H';
UPDATE personas SET fecha_incorporacion = '2022-03-08' WHERE TRIM(dni) = '48711775Y';
UPDATE personas SET fecha_incorporacion = '2023-10-23' WHERE TRIM(dni) = '26828322H';
UPDATE personas SET fecha_incorporacion = '2024-04-29' WHERE TRIM(dni) = '49158201W';
UPDATE personas SET fecha_incorporacion = '2022-03-14' WHERE TRIM(dni) = '47471920N';
UPDATE personas SET fecha_incorporacion = '2021-01-18' WHERE TRIM(dni) = '74384919K';
UPDATE personas SET fecha_incorporacion = '2023-01-09' WHERE TRIM(dni) = '71030508E';
UPDATE personas SET fecha_incorporacion = '2025-09-23' WHERE TRIM(dni) = '44883946K';
UPDATE personas SET fecha_incorporacion = '2024-06-17' WHERE TRIM(dni) = '75925524V';
UPDATE personas SET fecha_incorporacion = '2024-11-04' WHERE TRIM(dni) = '32092283S';
UPDATE personas SET fecha_incorporacion = '2025-04-29' WHERE TRIM(dni) = '20864106R';
UPDATE personas SET fecha_incorporacion = '2025-10-13' WHERE TRIM(dni) = '48852523V';
UPDATE personas SET fecha_incorporacion = '2026-02-23' WHERE TRIM(dni) = '77192897K';
UPDATE personas SET fecha_incorporacion = '2026-01-07' WHERE TRIM(dni) = '03953243A';
UPDATE personas SET fecha_incorporacion = '2024-07-29' WHERE TRIM(dni) = '49469752H';
UPDATE personas SET fecha_incorporacion = '2026-04-14' WHERE TRIM(dni) = '71461995Y';
UPDATE personas SET fecha_incorporacion = '2025-01-13' WHERE TRIM(dni) = '48707089N';
UPDATE personas SET fecha_incorporacion = '2022-02-22' WHERE TRIM(dni) = '48687331B';
UPDATE personas SET fecha_incorporacion = '2022-09-26' WHERE TRIM(dni) = '48747569N';
UPDATE personas SET fecha_incorporacion = '2024-08-26' WHERE TRIM(dni) = '29217326N';
UPDATE personas SET fecha_incorporacion = '2022-02-21' WHERE TRIM(dni) = '73660492W';
UPDATE personas SET fecha_incorporacion = '2025-12-22' WHERE TRIM(dni) = '54015016E';
UPDATE personas SET fecha_incorporacion = '2025-09-08' WHERE TRIM(dni) = '47407101F';
UPDATE personas SET fecha_incorporacion = '2020-10-19' WHERE TRIM(dni) = 'Y6457552V';
UPDATE personas SET fecha_incorporacion = '2021-05-03' WHERE TRIM(dni) = '48606120J';
UPDATE personas SET fecha_incorporacion = '2025-09-29' WHERE TRIM(dni) = '23320031D';
UPDATE personas SET fecha_incorporacion = '2025-10-06' WHERE TRIM(dni) = '23327481F';
UPDATE personas SET fecha_incorporacion = '2019-01-02' WHERE TRIM(dni) = '48975394E';
UPDATE personas SET fecha_incorporacion = '2021-11-02' WHERE TRIM(dni) = '53947263G';
UPDATE personas SET fecha_incorporacion = '2022-02-22' WHERE TRIM(dni) = '15490820K';
UPDATE personas SET fecha_incorporacion = '2023-04-03' WHERE TRIM(dni) = '44535954L';
UPDATE personas SET fecha_incorporacion = '2024-04-02' WHERE TRIM(dni) = '54414033N';
UPDATE personas SET fecha_incorporacion = '2025-12-15' WHERE TRIM(dni) = '20514017H';
UPDATE personas SET fecha_incorporacion = '2019-11-18' WHERE TRIM(dni) = '44874973H';
UPDATE personas SET fecha_incorporacion = '2017-12-11' WHERE TRIM(dni) = '26746522Y';
UPDATE personas SET fecha_incorporacion = '2019-10-01' WHERE TRIM(dni) = '53760430T';
UPDATE personas SET fecha_incorporacion = '2018-10-01' WHERE TRIM(dni) = '29220619Q';
UPDATE personas SET fecha_incorporacion = '2021-09-06' WHERE TRIM(dni) = '53775370J';
UPDATE personas SET fecha_incorporacion = '2022-04-04' WHERE TRIM(dni) = '21701268D';
UPDATE personas SET fecha_incorporacion = '2026-02-02' WHERE TRIM(dni) = 'X2666916C';
UPDATE personas SET fecha_incorporacion = '2025-02-01' WHERE TRIM(dni) = '48033186D';
UPDATE personas SET fecha_incorporacion = '2025-01-02' WHERE TRIM(dni) = '47257497H';
UPDATE personas SET fecha_incorporacion = '2025-09-01' WHERE TRIM(dni) = '25624610B';
UPDATE personas SET fecha_incorporacion = '2025-01-10' WHERE TRIM(dni) = '48977429X';
UPDATE personas SET fecha_incorporacion = '2025-02-04' WHERE TRIM(dni) = '46577282M';
UPDATE personas SET fecha_incorporacion = '2025-02-01' WHERE TRIM(dni) = '46230623W';
UPDATE personas SET fecha_incorporacion = '2025-02-01' WHERE TRIM(dni) = '77121131S';
UPDATE personas SET fecha_incorporacion = '2025-02-01' WHERE TRIM(dni) = '30359784Z';
UPDATE personas SET fecha_incorporacion = '2025-01-03' WHERE TRIM(dni) = 'Y5380478X';
UPDATE personas SET fecha_incorporacion = '2025-01-03' WHERE TRIM(dni) = '53635477Y';
UPDATE personas SET fecha_incorporacion = '2025-02-01' WHERE TRIM(dni) = '77921966J';
UPDATE personas SET fecha_incorporacion = '2025-01-01' WHERE TRIM(dni) = '73398760X';
UPDATE personas SET fecha_incorporacion = '2024-11-13' WHERE TRIM(dni) = '53653890L';
UPDATE personas SET fecha_incorporacion = '2025-01-01' WHERE TRIM(dni) = '45127170C';
UPDATE personas SET fecha_incorporacion = '2025-01-03' WHERE TRIM(dni) = '45897877C';
UPDATE personas SET fecha_incorporacion = '2025-01-07' WHERE TRIM(dni) = '21756156L';
UPDATE personas SET fecha_incorporacion = '2025-01-10' WHERE TRIM(dni) = 'Y9920167M';
UPDATE personas SET fecha_incorporacion = '2025-02-03' WHERE TRIM(dni) = '47961836M';
UPDATE personas SET fecha_incorporacion = '2025-02-03' WHERE TRIM(dni) = '49935327G';
UPDATE personas SET fecha_incorporacion = '2025-02-19' WHERE TRIM(dni) = '49240652K';
UPDATE personas SET fecha_incorporacion = '2025-03-03' WHERE TRIM(dni) = '23844123T';
UPDATE personas SET fecha_incorporacion = '2025-07-28' WHERE TRIM(dni) = '48170937J';
UPDATE personas SET fecha_incorporacion = '2025-05-19' WHERE TRIM(dni) = '72996211F';
UPDATE personas SET fecha_incorporacion = '2025-11-24' WHERE TRIM(dni) = '20554888H';
UPDATE personas SET fecha_incorporacion = '2025-12-01' WHERE TRIM(dni) = '46376905G';
UPDATE personas SET fecha_incorporacion = '2026-01-02' WHERE TRIM(dni) = 'Y8082411H';
UPDATE personas SET fecha_incorporacion = '2026-01-07' WHERE TRIM(dni) = '72753320L';
UPDATE personas SET fecha_incorporacion = '2026-03-02' WHERE TRIM(dni) = '74396512E';
UPDATE personas SET fecha_incorporacion = '2026-03-19' WHERE TRIM(dni) = '46422152X';
UPDATE personas SET fecha_incorporacion = '2025-09-23' WHERE TRIM(dni) = '79030612J';
UPDATE personas SET fecha_incorporacion = '2026-03-30' WHERE TRIM(dni) = '76037531Z';
UPDATE personas SET fecha_incorporacion = '2022-11-28' WHERE TRIM(dni) = '00930616J';
UPDATE personas SET fecha_incorporacion = '2023-07-18' WHERE TRIM(dni) = '00970712C';
UPDATE personas SET fecha_incorporacion = '2025-12-01' WHERE TRIM(dni) = '56003095G';
UPDATE personas SET fecha_incorporacion = '2026-03-17' WHERE TRIM(dni) = '48216696W';
UPDATE personas SET fecha_incorporacion = '2024-03-04' WHERE TRIM(dni) = '00970612N';
UPDATE personas SET fecha_incorporacion = '2026-01-19' WHERE TRIM(dni) = '80395875L';
UPDATE personas SET fecha_incorporacion = '2024-02-08' WHERE TRIM(dni) = '00991111H';
UPDATE personas SET fecha_incorporacion = '2025-05-06' WHERE TRIM(dni) = '27996060T';
UPDATE personas SET fecha_incorporacion = '2022-04-01' WHERE TRIM(dni) = '00920614Q';
UPDATE personas SET fecha_incorporacion = '2022-12-29' WHERE TRIM(dni) = '00980327K';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '45514010T';
UPDATE personas SET fecha_incorporacion = '2026-06-09' WHERE TRIM(dni) = '61186276C';
UPDATE personas SET fecha_incorporacion = '2026-02-23' WHERE TRIM(dni) = '58069617E';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '92694247S';
UPDATE personas SET fecha_incorporacion = '2026-01-07' WHERE TRIM(dni) = '38310985T';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '97090500W';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '29170638Z';
UPDATE personas SET fecha_incorporacion = '2026-02-23' WHERE TRIM(dni) = '54629598K';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '00630619M';
UPDATE personas SET fecha_incorporacion = '2017-04-11' WHERE TRIM(dni) = '20048179E';
UPDATE personas SET fecha_incorporacion = '2025-10-01' WHERE TRIM(dni) = '49686939Q';
UPDATE personas SET fecha_incorporacion = '2026-02-16' WHERE TRIM(dni) = '53472441V';
UPDATE personas SET fecha_incorporacion = '2026-02-17' WHERE TRIM(dni) = '70079162W';
UPDATE personas SET fecha_incorporacion = '2026-02-20' WHERE TRIM(dni) = '70268836H';
UPDATE personas SET fecha_incorporacion = '2026-02-23' WHERE TRIM(dni) = '71295831V';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '12417181X';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '35603469K';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '72514539R';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '22599986W';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '49310753H';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '50748367V';
UPDATE personas SET fecha_incorporacion = '2026-01-01' WHERE TRIM(dni) = '20884358J';

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Actualizar tipo_contrato en condiciones (condición vigente, sin fecha_fin)
--    Solo para los DNIs que tienen modalidad en el CSV.
-- ─────────────────────────────────────────────────────────────────────────────
UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '45910110V');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '35594558B');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23325063G');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49220530R');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '43471011E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '18455322F');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20912831N');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48713074V');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48772306R');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '44922104E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48721670B');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '21790038E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '47277899L');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'Z1706591L');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23941375P');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '05721575A');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20913991E');

UPDATE condiciones SET tipo_contrato = 'Prácticas'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23318272K');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20496261H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48711775Y');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '26828322H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49158201W');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '47471920N');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '74384919K');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '71030508E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '44883946K');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '75925524V');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '32092283S');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20864106R');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48852523V');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '77192897K');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '03953243A');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49469752H');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '71461995Y');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48707089N');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48687331B');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48747569N');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '29217326N');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '73660492W');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '54015016E');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '47407101F');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'Y6457552V');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48606120J');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23320031D');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23327481F');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48975394E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53947263G');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '15490820K');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '44535954L');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '54414033N');

UPDATE condiciones SET tipo_contrato = 'Temporal'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20514017H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '44874973H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '26746522Y');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53760430T');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '29220619Q');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53775370J');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '21701268D');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'X2666916C');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48033186D');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '47257497H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '25624610B');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48977429X');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '46577282M');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '46230623W');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '77121131S');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '30359784Z');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'Y5380478X');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53635477Y');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '77921966J');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '73398760X');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53653890L');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '45127170C');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '45897877C');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '21756156L');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'Y9920167M');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '47961836M');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49935327G');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49240652K');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '23844123T');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '48170937J');

-- 72996211F: modalidad vacía en CSV → no se toca tipo_contrato

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20554888H');

UPDATE condiciones SET tipo_contrato = 'Prácticas'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '46376905G');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = 'Y8082411H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '72753320L');

UPDATE condiciones SET tipo_contrato = 'Prácticas'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '74396512E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '46422152X');

UPDATE condiciones SET tipo_contrato = 'Becario'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '79030612J');

UPDATE condiciones SET tipo_contrato = 'Sustitución'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '76037531Z');

-- DNIs con modalidad vacía en CSV → solo se actualizó fecha_incorporacion arriba
-- 00930616J, 00970712C, 56003095G, 48216696W, 00970612N, 80395875L,
-- 00991111H, 27996060T, 00920614Q, 00980327K, 45514010T, 61186276C,
-- 58069617E, 92694247S, 38310985T, 97090500W, 29170638Z, 54629598K,
-- 00630619M, 12417181X, 35603469K, 72514539R, 22599986W, 49310753H,
-- 50748367V, 20884358J

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '20048179E');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '49686939Q');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '53472441V');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '70079162W');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '70268836H');

UPDATE condiciones SET tipo_contrato = 'Indefinido'
WHERE fecha_fin IS NULL AND persona_id IN (SELECT id FROM personas WHERE TRIM(dni) = '71295831V');

-- DNIs con modalidad vacía (formato 1/1/26) → solo fecha_incorporacion
-- 12417181X, 35603469K, 72514539R, 22599986W, 49310753H, 50748367V, 20884358J

COMMIT;
