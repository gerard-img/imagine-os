-- ============================================================
-- Migración 006: Añadir nombre_legal a empresas_grupo
-- ============================================================

ALTER TABLE empresas_grupo
  ADD COLUMN nombre_legal text;
