-- ============================================================
-- Migración 009: Datos reales de departamentos
--
-- 1. Limpia tablas que referencian departamentos
-- 2. Borra departamentos de test
-- 3. Inserta 49 departamentos reales (21 tipos × empresas)
--
-- Nota: "Aministración" del listado se corrige a "Administración"
-- ============================================================

-- 1. Limpiar tablas que referencian departamentos (datos de test)
DELETE FROM asignaciones;
DELETE FROM ordenes_trabajo_personas;
DELETE FROM ordenes_trabajo;
DELETE FROM servicios_y_depts;
DELETE FROM personas_departamentos;
DELETE FROM proyectos_departamentos;
UPDATE horas_trabajables SET departamento_id = NULL;
UPDATE proyectos SET servicio_principal_id = NULL;

-- 2. Borrar departamentos de test
DELETE FROM departamentos;

-- 3. Insertar departamentos reales
-- Empresas: IMG=...003, DMM=...001, DME=...002, KAU=...004, BBD=...005, DRR=...006, AUR=...007

INSERT INTO departamentos (id, empresa_grupo_id, nombre, codigo, descripcion) VALUES
  -- Administración (IMG)
  ('30000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000003', 'Administración', 'ADM', 'Administración del holding'),
  -- Talento (IMG)
  ('30000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000003', 'Talento', 'TAL', 'Gestión de talento y personas'),
  -- Outbound (IMG)
  ('30000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000003', 'Outbound', 'OUB', 'Desarrollo de negocio y captación'),
  -- Paid Media (DMM, DME, KAU, DRR)
  ('30000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'Paid Media', 'PPC', 'Gestión de campañas de pago'),
  ('30000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000002', 'Paid Media', 'PPC', 'Gestión de campañas de pago'),
  ('30000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000004', 'Paid Media', 'PPC', 'Gestión de campañas de pago'),
  ('30000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000006', 'Paid Media', 'PPC', 'Gestión de campañas de pago'),
  -- SEO GEO (DMM, DME, KAU)
  ('30000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'SEO GEO', 'SEO', 'SEO y geolocalización'),
  ('30000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'SEO GEO', 'SEO', 'SEO y geolocalización'),
  ('30000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000004', 'SEO GEO', 'SEO', 'SEO y geolocalización'),
  -- Growth (DMM, DME)
  ('30000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000001', 'Growth', 'GRO', 'Estrategia y crecimiento'),
  ('30000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'Growth', 'GRO', 'Estrategia y crecimiento'),
  -- Automation (DMM, DME, KAU)
  ('30000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'Automation', 'AUT', 'Marketing automation y CRM'),
  ('30000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000002', 'Automation', 'AUT', 'Marketing automation y CRM'),
  ('30000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000004', 'Automation', 'AUT', 'Marketing automation y CRM'),
  -- Comunicación (DMM, DME, KAU)
  ('30000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'Comunicación', 'COM', 'PR, contenido y comunicación'),
  ('30000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000002', 'Comunicación', 'COM', 'PR, contenido y comunicación'),
  ('30000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000004', 'Comunicación', 'COM', 'PR, contenido y comunicación'),
  -- Consultoría Accounts (DMM, DME, KAU, BBD)
  ('30000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000001', 'Consultoría Accounts', 'CAM', 'Gestión de cuentas y consultoría'),
  ('30000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000002', 'Consultoría Accounts', 'CAM', 'Gestión de cuentas y consultoría'),
  ('30000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000004', 'Consultoría Accounts', 'CAM', 'Gestión de cuentas y consultoría'),
  ('30000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000005', 'Consultoría Accounts', 'CAM', 'Gestión de cuentas y consultoría'),
  -- Diseño (DMM, DME, KAU, DRR)
  ('30000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000001', 'Diseño', 'DIS', 'Diseño gráfico, web y UX/UI'),
  ('30000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000002', 'Diseño', 'DIS', 'Diseño gráfico, web y UX/UI'),
  ('30000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000004', 'Diseño', 'DIS', 'Diseño gráfico, web y UX/UI'),
  ('30000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000006', 'Diseño', 'DIS', 'Diseño gráfico, web y UX/UI'),
  -- Desarrollo (DMM, DME)
  ('30000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000001', 'Desarrollo', 'DEV', 'Desarrollo de software y web'),
  ('30000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000002', 'Desarrollo', 'DEV', 'Desarrollo de software y web'),
  -- Programática (BBD, DME, DMM)
  ('30000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000005', 'Programática', 'PRO', 'Compra programática de medios'),
  ('30000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000002', 'Programática', 'PRO', 'Compra programática de medios'),
  ('30000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000001', 'Programática', 'PRO', 'Compra programática de medios'),
  -- Creativo (KAU)
  ('30000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000004', 'Creativo', 'CRE', 'Dirección creativa y conceptualización'),
  -- Producción Audiovisual (KAU)
  ('30000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000004', 'Producción Audiovisual', 'PAU', 'Producción de vídeo y audio'),
  -- Mentoring (KAU)
  ('30000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000004', 'Mentoring', 'MEN', 'Mentoría y acompañamiento a clientes'),
  -- Consultoría IA (KAU, DME)
  ('30000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000004', 'Consultoría IA', 'CIA', 'Consultoría de inteligencia artificial'),
  ('30000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000002', 'Consultoría IA', 'CIA', 'Consultoría de inteligencia artificial'),
  -- Dirección (IMG, DME, DMM, KAU, BBD, DRR, AUR)
  ('30000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000003', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000002', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000001', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000004', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000005', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000006', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  ('30000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000007', 'Dirección', 'DIR', 'Dirección y liderazgo'),
  -- Trading (BBD)
  ('30000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000005', 'Trading', 'TRD', 'Trading de medios'),
  -- UXUI (DMM, DME, DRR)
  ('30000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000001', 'UXUI', 'UXI', 'Diseño de experiencia e interfaz'),
  ('30000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000002', 'UXUI', 'UXI', 'Diseño de experiencia e interfaz'),
  ('30000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000006', 'UXUI', 'UXI', 'Diseño de experiencia e interfaz'),
  -- Selección Personal (AUR)
  ('30000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000007', 'Selección Personal', 'SEP', 'Reclutamiento y selección'),
  -- Formación (AUR)
  ('30000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000007', 'Formación', 'FOR', 'Formación y capacitación');
