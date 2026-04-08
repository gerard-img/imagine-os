-- 043: Eliminar columna notas_cierre de ordenes_trabajo (no se utiliza)
ALTER TABLE ordenes_trabajo DROP COLUMN IF EXISTS notas_cierre;
