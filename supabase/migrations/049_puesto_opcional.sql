-- ============================================================
-- 049_puesto_opcional.sql
-- Hace puesto_id opcional en personas (no todas las personas
-- tienen un puesto definido al darse de alta).
-- ============================================================

alter table personas
  alter column puesto_id drop not null;
