-- 023_personas_es_interino.sql
-- Añade 'rango_es_interino' a personas.
-- Indica que la persona ocupa su rango_id de forma temporal (interinidad).
-- El rango sigue siendo el de referencia para cálculos; este flag solo documenta que es provisional.

ALTER TABLE personas
  ADD COLUMN IF NOT EXISTS rango_es_interino boolean NOT NULL DEFAULT false;
