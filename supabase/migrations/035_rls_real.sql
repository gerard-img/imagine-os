-- 035_rls_real.sql
-- Reemplaza las políticas RLS permisivas (005) por políticas reales basadas en roles.
--
-- Usa las funciones helper de 033_auth_nivel_acceso.sql:
--   get_mi_nivel_acceso()     → 'global' | 'empresa' | 'personal'
--   get_mi_empresa_grupo_id() → UUID de la empresa_grupo del usuario
--   get_mi_persona_id()       → UUID de la persona del usuario
--
-- Niveles:
--   global   (Fundador, Socio, Administrador)  → lee y escribe todo
--   empresa  (Director, Coordinador, Responsable) → lee y escribe solo su empresa_grupo
--   personal (Miembro, Intern, Externo, Implant) → lee su empresa_grupo, no escribe

BEGIN;

-- =====================================================================
-- HELPER: función reutilizable para condiciones de nivel
-- =====================================================================

-- Lectura: global ve todo, empresa y personal ven su empresa_grupo
-- Parámetro: empresa_grupo_id de la fila
CREATE OR REPLACE FUNCTION puede_leer_por_empresa(eg_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    get_mi_nivel_acceso() = 'global'
    OR eg_id = get_mi_empresa_grupo_id();
$$;

-- Escritura: global escribe todo, empresa escribe su empresa_grupo, personal no escribe
CREATE OR REPLACE FUNCTION puede_escribir_por_empresa(eg_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND eg_id = get_mi_empresa_grupo_id());
$$;


-- =====================================================================
-- 1. TABLAS UNIVERSALES (sin empresa_grupo_id)
--    divisiones, roles, ciudades, oficinas
--    Lectura: todos los autenticados
--    Escritura: solo global
-- =====================================================================

-- Macro: borrar políticas MVP de una tabla y crear las nuevas
-- No se puede parametrizar con DO $$ porque necesitamos SQL puro para policies,
-- así que las hacemos una a una.

-- ── divisiones ──
DROP POLICY IF EXISTS "mvp_select_divisiones" ON divisiones;
DROP POLICY IF EXISTS "mvp_insert_divisiones" ON divisiones;
DROP POLICY IF EXISTS "mvp_update_divisiones" ON divisiones;
DROP POLICY IF EXISTS "mvp_delete_divisiones" ON divisiones;

CREATE POLICY "sel_divisiones" ON divisiones
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_divisiones" ON divisiones
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() = 'global');
CREATE POLICY "upd_divisiones" ON divisiones
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() = 'global');
CREATE POLICY "del_divisiones" ON divisiones
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── roles ──
DROP POLICY IF EXISTS "mvp_select_roles" ON roles;
DROP POLICY IF EXISTS "mvp_insert_roles" ON roles;
DROP POLICY IF EXISTS "mvp_update_roles" ON roles;
DROP POLICY IF EXISTS "mvp_delete_roles" ON roles;

CREATE POLICY "sel_roles" ON roles
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_roles" ON roles
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() = 'global');
CREATE POLICY "upd_roles" ON roles
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() = 'global');
CREATE POLICY "del_roles" ON roles
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── ciudades ──
DROP POLICY IF EXISTS "mvp_select_ciudades" ON ciudades;
DROP POLICY IF EXISTS "mvp_insert_ciudades" ON ciudades;
DROP POLICY IF EXISTS "mvp_update_ciudades" ON ciudades;
DROP POLICY IF EXISTS "mvp_delete_ciudades" ON ciudades;

CREATE POLICY "sel_ciudades" ON ciudades
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_ciudades" ON ciudades
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() = 'global');
CREATE POLICY "upd_ciudades" ON ciudades
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() = 'global');
CREATE POLICY "del_ciudades" ON ciudades
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── oficinas ──
DROP POLICY IF EXISTS "mvp_select_oficinas" ON oficinas;
DROP POLICY IF EXISTS "mvp_insert_oficinas" ON oficinas;
DROP POLICY IF EXISTS "mvp_update_oficinas" ON oficinas;
DROP POLICY IF EXISTS "mvp_delete_oficinas" ON oficinas;

CREATE POLICY "sel_oficinas" ON oficinas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_oficinas" ON oficinas
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() = 'global');
CREATE POLICY "upd_oficinas" ON oficinas
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() = 'global');
CREATE POLICY "del_oficinas" ON oficinas
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');


-- =====================================================================
-- 2. TABLAS CON empresa_grupo_id DIRECTA
--    Lectura: global = todo, empresa/personal = su empresa_grupo
--    Escritura: global = todo, empresa = su empresa_grupo, personal = nada
-- =====================================================================

-- ── empresas_grupo ──
DROP POLICY IF EXISTS "mvp_select_empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "mvp_insert_empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "mvp_update_empresas_grupo" ON empresas_grupo;
DROP POLICY IF EXISTS "mvp_delete_empresas_grupo" ON empresas_grupo;

CREATE POLICY "sel_empresas_grupo" ON empresas_grupo
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(id));
CREATE POLICY "ins_empresas_grupo" ON empresas_grupo
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() = 'global');
CREATE POLICY "upd_empresas_grupo" ON empresas_grupo
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() = 'global');
CREATE POLICY "del_empresas_grupo" ON empresas_grupo
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── catalogo_servicios ──
DROP POLICY IF EXISTS "mvp_select_catalogo_servicios" ON catalogo_servicios;
DROP POLICY IF EXISTS "mvp_insert_catalogo_servicios" ON catalogo_servicios;
DROP POLICY IF EXISTS "mvp_update_catalogo_servicios" ON catalogo_servicios;
DROP POLICY IF EXISTS "mvp_delete_catalogo_servicios" ON catalogo_servicios;

CREATE POLICY "sel_catalogo_servicios" ON catalogo_servicios
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_catalogo_servicios" ON catalogo_servicios
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_catalogo_servicios" ON catalogo_servicios
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_catalogo_servicios" ON catalogo_servicios
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── departamentos ──
DROP POLICY IF EXISTS "mvp_select_departamentos" ON departamentos;
DROP POLICY IF EXISTS "mvp_insert_departamentos" ON departamentos;
DROP POLICY IF EXISTS "mvp_update_departamentos" ON departamentos;
DROP POLICY IF EXISTS "mvp_delete_departamentos" ON departamentos;

CREATE POLICY "sel_departamentos" ON departamentos
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_departamentos" ON departamentos
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_departamentos" ON departamentos
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_departamentos" ON departamentos
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── rangos_internos ──
DROP POLICY IF EXISTS "mvp_select_rangos_internos" ON rangos_internos;
DROP POLICY IF EXISTS "mvp_insert_rangos_internos" ON rangos_internos;
DROP POLICY IF EXISTS "mvp_update_rangos_internos" ON rangos_internos;
DROP POLICY IF EXISTS "mvp_delete_rangos_internos" ON rangos_internos;

CREATE POLICY "sel_rangos_internos" ON rangos_internos
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_rangos_internos" ON rangos_internos
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_rangos_internos" ON rangos_internos
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_rangos_internos" ON rangos_internos
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── puestos ──
DROP POLICY IF EXISTS "mvp_select_puestos" ON puestos;
DROP POLICY IF EXISTS "mvp_insert_puestos" ON puestos;
DROP POLICY IF EXISTS "mvp_update_puestos" ON puestos;
DROP POLICY IF EXISTS "mvp_delete_puestos" ON puestos;

CREATE POLICY "sel_puestos" ON puestos
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_puestos" ON puestos
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_puestos" ON puestos
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_puestos" ON puestos
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── personas ──
DROP POLICY IF EXISTS "mvp_select_personas" ON personas;
DROP POLICY IF EXISTS "mvp_insert_personas" ON personas;
DROP POLICY IF EXISTS "mvp_update_personas" ON personas;
DROP POLICY IF EXISTS "mvp_delete_personas" ON personas;

CREATE POLICY "sel_personas" ON personas
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_personas" ON personas
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_personas" ON personas
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_personas" ON personas
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── proyectos ──
DROP POLICY IF EXISTS "mvp_select_proyectos" ON proyectos;
DROP POLICY IF EXISTS "mvp_insert_proyectos" ON proyectos;
DROP POLICY IF EXISTS "mvp_update_proyectos" ON proyectos;
DROP POLICY IF EXISTS "mvp_delete_proyectos" ON proyectos;

CREATE POLICY "sel_proyectos" ON proyectos
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_proyectos" ON proyectos
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_proyectos" ON proyectos
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_proyectos" ON proyectos
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── cuotas_planificacion (renombrada desde cuotas_por_rango en migración 011) ──
DROP POLICY IF EXISTS "mvp_select_cuotas_por_rango" ON cuotas_planificacion;
DROP POLICY IF EXISTS "mvp_insert_cuotas_por_rango" ON cuotas_planificacion;
DROP POLICY IF EXISTS "mvp_update_cuotas_por_rango" ON cuotas_planificacion;
DROP POLICY IF EXISTS "mvp_delete_cuotas_por_rango" ON cuotas_planificacion;
DROP POLICY IF EXISTS "Allow all authenticated" ON cuotas_planificacion;

CREATE POLICY "sel_cuotas_planificacion" ON cuotas_planificacion
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_cuotas_planificacion" ON cuotas_planificacion
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_cuotas_planificacion" ON cuotas_planificacion
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_cuotas_planificacion" ON cuotas_planificacion
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── horas_trabajables ──
DROP POLICY IF EXISTS "mvp_select_horas_trabajables" ON horas_trabajables;
DROP POLICY IF EXISTS "mvp_insert_horas_trabajables" ON horas_trabajables;
DROP POLICY IF EXISTS "mvp_update_horas_trabajables" ON horas_trabajables;
DROP POLICY IF EXISTS "mvp_delete_horas_trabajables" ON horas_trabajables;

CREATE POLICY "sel_horas_trabajables" ON horas_trabajables
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_horas_trabajables" ON horas_trabajables
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_horas_trabajables" ON horas_trabajables
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_horas_trabajables" ON horas_trabajables
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));

-- ── condiciones (tiene empresa_grupo_id) ──
CREATE POLICY "sel_condiciones" ON condiciones
  FOR SELECT TO authenticated USING (puede_leer_por_empresa(empresa_grupo_id));
CREATE POLICY "ins_condiciones" ON condiciones
  FOR INSERT TO authenticated WITH CHECK (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "upd_condiciones" ON condiciones
  FOR UPDATE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));
CREATE POLICY "del_condiciones" ON condiciones
  FOR DELETE TO authenticated USING (puede_escribir_por_empresa(empresa_grupo_id));


-- =====================================================================
-- 3. TABLAS SIN empresa_grupo_id (enlazadas por FK)
--    Filtramos mediante subquery al padre que sí tiene empresa_grupo_id.
-- =====================================================================

-- ── empresas (clientes — no tienen empresa_grupo_id) ──
-- Las empresas son clientes compartidos entre empresas del grupo.
-- Lectura: todos los autenticados. Escritura: global y empresa.
DROP POLICY IF EXISTS "mvp_select_empresas" ON empresas;
DROP POLICY IF EXISTS "mvp_insert_empresas" ON empresas;
DROP POLICY IF EXISTS "mvp_update_empresas" ON empresas;
DROP POLICY IF EXISTS "mvp_delete_empresas" ON empresas;

CREATE POLICY "sel_empresas" ON empresas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_empresas" ON empresas
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() IN ('global', 'empresa'));
CREATE POLICY "upd_empresas" ON empresas
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() IN ('global', 'empresa'));
CREATE POLICY "del_empresas" ON empresas
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── contactos_empresas (enlazada a empresas) ──
-- Misma lógica que empresas: lectura abierta, escritura global/empresa.
DROP POLICY IF EXISTS "contactos_empresas_select_all" ON contactos_empresas;
DROP POLICY IF EXISTS "contactos_empresas_insert_all" ON contactos_empresas;
DROP POLICY IF EXISTS "contactos_empresas_update_all" ON contactos_empresas;
DROP POLICY IF EXISTS "contactos_empresas_delete_all" ON contactos_empresas;

CREATE POLICY "sel_contactos_empresas" ON contactos_empresas
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "ins_contactos_empresas" ON contactos_empresas
  FOR INSERT TO authenticated WITH CHECK (get_mi_nivel_acceso() IN ('global', 'empresa'));
CREATE POLICY "upd_contactos_empresas" ON contactos_empresas
  FOR UPDATE TO authenticated USING (get_mi_nivel_acceso() IN ('global', 'empresa'));
CREATE POLICY "del_contactos_empresas" ON contactos_empresas
  FOR DELETE TO authenticated USING (get_mi_nivel_acceso() = 'global');

-- ── servicios_y_depts (intermedia: departamento → empresa_grupo_id) ──
DROP POLICY IF EXISTS "mvp_select_servicios_y_depts" ON servicios_y_depts;
DROP POLICY IF EXISTS "mvp_insert_servicios_y_depts" ON servicios_y_depts;
DROP POLICY IF EXISTS "mvp_update_servicios_y_depts" ON servicios_y_depts;
DROP POLICY IF EXISTS "mvp_delete_servicios_y_depts" ON servicios_y_depts;

CREATE POLICY "sel_servicios_y_depts" ON servicios_y_depts
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM departamentos d
      WHERE d.id = servicios_y_depts.departamento_id
        AND d.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_servicios_y_depts" ON servicios_y_depts
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM departamentos d
      WHERE d.id = servicios_y_depts.departamento_id
        AND d.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_servicios_y_depts" ON servicios_y_depts
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM departamentos d
      WHERE d.id = servicios_y_depts.departamento_id
        AND d.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── personas_departamentos (enlazada a personas → empresa_grupo_id) ──
DROP POLICY IF EXISTS "mvp_select_personas_departamentos" ON personas_departamentos;
DROP POLICY IF EXISTS "mvp_insert_personas_departamentos" ON personas_departamentos;
DROP POLICY IF EXISTS "mvp_update_personas_departamentos" ON personas_departamentos;
DROP POLICY IF EXISTS "mvp_delete_personas_departamentos" ON personas_departamentos;

CREATE POLICY "sel_personas_departamentos" ON personas_departamentos
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = personas_departamentos.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_personas_departamentos" ON personas_departamentos
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = personas_departamentos.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "upd_personas_departamentos" ON personas_departamentos
  FOR UPDATE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = personas_departamentos.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_personas_departamentos" ON personas_departamentos
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = personas_departamentos.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── proyectos_departamentos (enlazada a proyectos → empresa_grupo_id) ──
DROP POLICY IF EXISTS "mvp_select_proyectos_departamentos" ON proyectos_departamentos;
DROP POLICY IF EXISTS "mvp_insert_proyectos_departamentos" ON proyectos_departamentos;
DROP POLICY IF EXISTS "mvp_update_proyectos_departamentos" ON proyectos_departamentos;
DROP POLICY IF EXISTS "mvp_delete_proyectos_departamentos" ON proyectos_departamentos;

CREATE POLICY "sel_proyectos_departamentos" ON proyectos_departamentos
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = proyectos_departamentos.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_proyectos_departamentos" ON proyectos_departamentos
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = proyectos_departamentos.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_proyectos_departamentos" ON proyectos_departamentos
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = proyectos_departamentos.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── ordenes_trabajo (enlazada a proyectos → empresa_grupo_id) ──
DROP POLICY IF EXISTS "mvp_select_ordenes_trabajo" ON ordenes_trabajo;
DROP POLICY IF EXISTS "mvp_insert_ordenes_trabajo" ON ordenes_trabajo;
DROP POLICY IF EXISTS "mvp_update_ordenes_trabajo" ON ordenes_trabajo;
DROP POLICY IF EXISTS "mvp_delete_ordenes_trabajo" ON ordenes_trabajo;

CREATE POLICY "sel_ordenes_trabajo" ON ordenes_trabajo
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = ordenes_trabajo.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_ordenes_trabajo" ON ordenes_trabajo
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = ordenes_trabajo.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "upd_ordenes_trabajo" ON ordenes_trabajo
  FOR UPDATE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = ordenes_trabajo.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_ordenes_trabajo" ON ordenes_trabajo
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM proyectos p
      WHERE p.id = ordenes_trabajo.proyecto_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── ordenes_trabajo_personas (enlazada a ordenes_trabajo → proyectos) ──
DROP POLICY IF EXISTS "mvp_select_ordenes_trabajo_personas" ON ordenes_trabajo_personas;
DROP POLICY IF EXISTS "mvp_insert_ordenes_trabajo_personas" ON ordenes_trabajo_personas;
DROP POLICY IF EXISTS "mvp_update_ordenes_trabajo_personas" ON ordenes_trabajo_personas;
DROP POLICY IF EXISTS "mvp_delete_ordenes_trabajo_personas" ON ordenes_trabajo_personas;

CREATE POLICY "sel_ordenes_trabajo_personas" ON ordenes_trabajo_personas
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = ordenes_trabajo_personas.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_ordenes_trabajo_personas" ON ordenes_trabajo_personas
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = ordenes_trabajo_personas.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_ordenes_trabajo_personas" ON ordenes_trabajo_personas
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = ordenes_trabajo_personas.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── asignaciones (enlazada a ordenes_trabajo → proyectos) ──
DROP POLICY IF EXISTS "mvp_select_asignaciones" ON asignaciones;
DROP POLICY IF EXISTS "mvp_insert_asignaciones" ON asignaciones;
DROP POLICY IF EXISTS "mvp_update_asignaciones" ON asignaciones;
DROP POLICY IF EXISTS "mvp_delete_asignaciones" ON asignaciones;

CREATE POLICY "sel_asignaciones" ON asignaciones
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = asignaciones.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_asignaciones" ON asignaciones
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = asignaciones.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "upd_asignaciones" ON asignaciones
  FOR UPDATE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = asignaciones.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_asignaciones" ON asignaciones
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM ordenes_trabajo ot
      JOIN proyectos p ON p.id = ot.proyecto_id
      WHERE ot.id = asignaciones.orden_trabajo_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );

-- ── ausencias (enlazada a personas → empresa_grupo_id) ──
CREATE POLICY "sel_ausencias" ON ausencias
  FOR SELECT TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = ausencias.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    )
  );
CREATE POLICY "ins_ausencias" ON ausencias
  FOR INSERT TO authenticated WITH CHECK (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = ausencias.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "upd_ausencias" ON ausencias
  FOR UPDATE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
    OR (get_mi_nivel_acceso() = 'empresa' AND EXISTS (
      SELECT 1 FROM personas p
      WHERE p.id = ausencias.persona_id
        AND p.empresa_grupo_id = get_mi_empresa_grupo_id()
    ))
  );
CREATE POLICY "del_ausencias" ON ausencias
  FOR DELETE TO authenticated USING (
    get_mi_nivel_acceso() = 'global'
  );

COMMIT;
