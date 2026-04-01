-- ============================================================
-- Migración 005: Políticas RLS permisivas para MVP
--
-- Permite lectura y escritura con anon key (sin autenticación).
-- TEMPORAL: reemplazar por políticas con auth.uid() + roles
-- cuando se implemente autenticación.
--
-- Políticas aplicadas a roles: anon, authenticated
-- (explícito para no afectar a service_role ni otros roles)
--
-- Tablas pendientes de crear (no incluidas aquí):
--   condiciones, ausencias, evolucion,
--   contactos_empresas, historial_estado_empresa,
--   historial_estado_proyecto
-- ============================================================

DO $$
DECLARE
  t text;
  tables text[] := ARRAY[
    'empresas_grupo',
    'catalogo_servicios',
    'departamentos',
    'servicios_y_depts',
    'rangos_internos',
    'puestos',
    'divisiones',
    'roles',
    'ciudades',
    'oficinas',
    'personas',
    'personas_departamentos',
    'empresas',
    'proyectos',
    'proyectos_departamentos',
    'ordenes_trabajo',
    'asignaciones',
    'ordenes_trabajo_personas',
    'cuotas_por_rango',
    'horas_trabajables'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);

    EXECUTE format('DROP POLICY IF EXISTS "mvp_select_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "mvp_select_%1$s" ON public.%1$I FOR SELECT TO anon, authenticated USING (true)', t
    );

    EXECUTE format('DROP POLICY IF EXISTS "mvp_insert_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "mvp_insert_%1$s" ON public.%1$I FOR INSERT TO anon, authenticated WITH CHECK (true)', t
    );

    EXECUTE format('DROP POLICY IF EXISTS "mvp_update_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "mvp_update_%1$s" ON public.%1$I FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true)', t
    );

    EXECUTE format('DROP POLICY IF EXISTS "mvp_delete_%1$s" ON public.%1$I', t);
    EXECUTE format(
      'CREATE POLICY "mvp_delete_%1$s" ON public.%1$I FOR DELETE TO anon, authenticated USING (true)', t
    );
  END LOOP;
END
$$;
