-- 048: Corregir FK personas.auth_user_id → auth.users(id)
-- Añade ON DELETE SET NULL para que al borrar un usuario de auth,
-- la persona se desvincule automáticamente sin error de FK.

ALTER TABLE personas
  DROP CONSTRAINT IF EXISTS personas_auth_user_id_fkey;

ALTER TABLE personas
  ADD CONSTRAINT personas_auth_user_id_fkey
    FOREIGN KEY (auth_user_id) REFERENCES auth.users(id)
    ON DELETE SET NULL;
