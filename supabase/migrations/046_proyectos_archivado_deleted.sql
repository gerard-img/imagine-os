-- Añadir archivado_at y deleted_at a proyectos
ALTER TABLE proyectos
  ADD COLUMN archivado_at TIMESTAMPTZ,
  ADD COLUMN deleted_at TIMESTAMPTZ;

-- Índice para filtrar rápido por estado de archivo/borrado
CREATE INDEX idx_proyectos_archivado ON proyectos (archivado_at) WHERE archivado_at IS NOT NULL;
CREATE INDEX idx_proyectos_deleted ON proyectos (deleted_at) WHERE deleted_at IS NOT NULL;
