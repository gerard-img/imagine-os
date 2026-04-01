-- 027_rangos_specialist.sql
-- Renombra el rango "Miembro" → "Specialist" en las 7 empresas del grupo.
-- El código cambia de MBR → SPEC. El orden (6) no varía.

UPDATE rangos_internos
SET nombre = 'Specialist', codigo = 'SPEC'
WHERE nombre = 'Miembro';
