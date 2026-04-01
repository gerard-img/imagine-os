-- 031_noura_rango_specialist.sql
-- Asigna rango Specialist (IMG) a NOURA CHACOR (rango_id era NULL)

UPDATE personas
SET rango_id = '40000000-0000-0000-0000-000000003005'
WHERE id = '90000000-0000-0000-0000-000000000058';
