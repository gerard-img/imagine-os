-- 050: Tabla de auditoría para registrar operaciones desde Server Actions.
-- Permite saber quién hizo qué, cuándo y sobre qué registro.

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  persona_id    UUID REFERENCES personas(id) ON DELETE SET NULL,
  accion        TEXT NOT NULL,          -- 'crear', 'actualizar', 'eliminar', 'archivar', 'restaurar', 'cambiar_estado', 'otro'
  tabla         TEXT NOT NULL,           -- nombre de la tabla afectada
  registro_id   TEXT,                    -- id del registro afectado (TEXT para flexibilidad)
  datos_extra   JSONB,                  -- info adicional (estado anterior/nuevo, campos cambiados, etc.)
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices para consultas frecuentes
CREATE INDEX idx_audit_log_persona   ON audit_log (persona_id);
CREATE INDEX idx_audit_log_tabla     ON audit_log (tabla, created_at DESC);
CREATE INDEX idx_audit_log_registro  ON audit_log (tabla, registro_id);
CREATE INDEX idx_audit_log_fecha     ON audit_log (created_at DESC);

-- RLS: solo lectura para admins (nivel global), inserción desde server actions (authenticated)
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Los admins pueden leer todo el audit log
CREATE POLICY "audit_log_select_admin" ON audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM personas p
      JOIN roles r ON r.id = p.rol_id
      WHERE p.auth_user_id = auth.uid()
        AND r.nivel_acceso = 'global'
    )
  );

-- Cualquier usuario autenticado puede insertar (las server actions validan permisos antes)
CREATE POLICY "audit_log_insert_authenticated" ON audit_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Nadie puede actualizar ni borrar registros de auditoría
-- (no se crean policies de UPDATE/DELETE = denegado por defecto con RLS)
