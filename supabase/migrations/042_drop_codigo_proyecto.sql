-- 042: Eliminar columna codigo_proyecto (no se usa en ninguna parte de la app)
ALTER TABLE proyectos DROP COLUMN IF EXISTS codigo_proyecto;
