-- Primero eliminar el constraint existente para poder actualizar los datos
ALTER TABLE proyectos DROP CONSTRAINT IF EXISTS chk_tipo_facturacion;
ALTER TABLE proyectos DROP CONSTRAINT IF EXISTS proyectos_tipo_facturacion_check;

-- Renombrar 'Retainer' → 'Fee mensual'
UPDATE proyectos SET tipo_facturacion = 'Fee mensual' WHERE tipo_facturacion = 'Retainer';

-- Recrear el constraint con el nuevo valor
ALTER TABLE proyectos ADD CONSTRAINT chk_tipo_facturacion
  CHECK (tipo_facturacion IN ('Precio fijo', 'Por horas', 'Fee mensual', 'Éxito'));
