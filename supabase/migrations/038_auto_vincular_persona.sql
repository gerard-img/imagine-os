-- 038: Función SECURITY DEFINER para auto-vincular auth_user_id a persona por email.
-- Resuelve el problema huevo/gallina: sin auth_user_id no se puede pasar RLS,
-- y sin pasar RLS no se puede asignar auth_user_id.

CREATE OR REPLACE FUNCTION vincular_persona_por_email(p_auth_user_id UUID, p_email TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE personas
  SET auth_user_id = p_auth_user_id
  WHERE email_corporativo = p_email
    AND auth_user_id IS NULL;
END;
$$;
