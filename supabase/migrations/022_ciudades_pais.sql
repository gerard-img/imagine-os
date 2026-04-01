-- 022_ciudades_pais.sql
-- Añade el campo 'pais' a ciudades para distinguir España / México / etc.

ALTER TABLE ciudades
  ADD COLUMN IF NOT EXISTS pais text;
