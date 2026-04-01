-- 032_horas_trabajables_unique.sql
-- Restricción UNIQUE parcial: solo un registro General (sin depto ni persona)
-- por empresa y mes. Permite múltiples overrides de depto/persona.

CREATE UNIQUE INDEX uq_horas_trabajables_general
ON horas_trabajables (empresa_grupo_id, mes_trabajo)
WHERE departamento_id IS NULL AND persona_id IS NULL;
