-- 040: Renombrar aprobador_final_id → responsable_id en proyectos
--
-- El concepto "aprobador" se usa en OTs. En proyectos el campo representa
-- la persona interna responsable del proyecto.
-- No usar contacto_principal_id porque ya existe (FK a contactos_empresas,
-- añadido en migración 017).

ALTER TABLE proyectos
  RENAME COLUMN aprobador_final_id TO responsable_id;
