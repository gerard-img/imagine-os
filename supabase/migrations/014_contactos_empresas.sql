-- ============================================================
-- 014 — Crear tabla contactos_empresas
-- ============================================================

CREATE TABLE IF NOT EXISTS contactos_empresas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  empresa_id    UUID NOT NULL REFERENCES empresas(id),
  nombre        TEXT NOT NULL,
  apellidos     TEXT,
  email         TEXT,
  telefono      TEXT,
  cargo         TEXT,
  departamento  TEXT,
  es_decisor    BOOLEAN NOT NULL DEFAULT false,
  es_contacto_principal BOOLEAN NOT NULL DEFAULT false,
  notas         TEXT,
  activo        BOOLEAN NOT NULL DEFAULT true,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice por empresa
CREATE INDEX IF NOT EXISTS idx_contactos_empresas_empresa
  ON contactos_empresas(empresa_id);

-- RLS permisivo para MVP (igual que las demás tablas)
ALTER TABLE contactos_empresas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contactos_empresas_select_all"
  ON contactos_empresas FOR SELECT
  USING (true);

CREATE POLICY "contactos_empresas_insert_all"
  ON contactos_empresas FOR INSERT
  WITH CHECK (true);

CREATE POLICY "contactos_empresas_update_all"
  ON contactos_empresas FOR UPDATE
  USING (true);

CREATE POLICY "contactos_empresas_delete_all"
  ON contactos_empresas FOR DELETE
  USING (true);
