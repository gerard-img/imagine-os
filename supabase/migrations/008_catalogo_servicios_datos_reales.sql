-- ============================================================
-- Migración 008: Datos reales de catalogo_servicios
--
-- 1. Limpia datos de test en tablas que referencian servicios
-- 2. Borra servicios de test
-- 3. Inserta 91 servicios reales (41 servicios × empresas)
--
-- Nota: KAA del listado original se interpreta como KAU (Kauai)
-- ============================================================

-- 1. Limpiar tablas que referencian catalogo_servicios (datos de test)
DELETE FROM asignaciones;
DELETE FROM ordenes_trabajo_personas;
DELETE FROM ordenes_trabajo;
DELETE FROM servicios_y_depts;
UPDATE proyectos SET servicio_principal_id = NULL;

-- 2. Borrar servicios de test
DELETE FROM catalogo_servicios;

-- 3. Insertar servicios reales
-- Empresas: DMM=...001, DME=...002, KAU=...004, BBD=...005, DRR=...006, AUR=...007

INSERT INTO catalogo_servicios (id, empresa_grupo_id, nombre, codigo, descripcion) VALUES
  -- SEO gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SEO gestion', 'SEO-GESTION', 'Servicio ongoing de gestión de SEO para webs de ecommerce, lead generation, blogs, apps y cualquier otro proyecto que lo solicite.'),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SEO gestion', 'SEO-GESTION', 'Servicio ongoing de gestión de SEO para webs de ecommerce, lead generation, blogs, apps y cualquier otro proyecto que lo solicite.'),
  -- SEO audit (DMM, DME)
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'SEO audit', 'SEO-AUDIT', 'Auditoría SEO o primera fase de cualquier proyecto SEO.'),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000002', 'SEO audit', 'SEO-AUDIT', 'Auditoría SEO o primera fase de cualquier proyecto SEO.'),
  -- PM AUT (DMM, DME, KAU, BBD, DRR)
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000002', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000004', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000005', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000006', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  -- SM gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000001', 'SM gestion', 'SM-GESTION', 'Servicio de gestión de presencia en redes sociales.'),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'SM gestion', 'SM-GESTION', 'Servicio de gestión de presencia en redes sociales.'),
  -- PM SEO (DMM, DME)
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000001', 'PM SEO', 'PM-SEO', 'Project management para proyectos mono-servicio de SEO.'),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000002', 'PM SEO', 'PM-SEO', 'Project management para proyectos mono-servicio de SEO.'),
  -- PM PPC (DMM, DME)
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000001', 'PM PPC', 'PM-PPC', 'Project management para proyectos mono-servicio de PPC.'),
  ('20000000-0000-0000-0000-000000000015', '10000000-0000-0000-0000-000000000002', 'PM PPC', 'PM-PPC', 'Project management para proyectos mono-servicio de PPC.'),
  -- SEO local (DMM, DME)
  ('20000000-0000-0000-0000-000000000016', '10000000-0000-0000-0000-000000000001', 'SEO local', 'SEO-LOCAL', 'Servicio dirigido a mejorar posicionamiento de tiendas físicas o cuentas de GMB.'),
  ('20000000-0000-0000-0000-000000000017', '10000000-0000-0000-0000-000000000002', 'SEO local', 'SEO-LOCAL', 'Servicio dirigido a mejorar posicionamiento de tiendas físicas o cuentas de GMB.'),
  -- PM DIS (DMM, DME)
  ('20000000-0000-0000-0000-000000000018', '10000000-0000-0000-0000-000000000001', 'PM DIS', 'PM-DIS', 'Project management para proyectos mono-servicio de Diseño.'),
  ('20000000-0000-0000-0000-000000000019', '10000000-0000-0000-0000-000000000002', 'PM DIS', 'PM-DIS', 'Project management para proyectos mono-servicio de Diseño.'),
  -- PM gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000020', '10000000-0000-0000-0000-000000000001', 'PM gestion', 'PM-GESTION', 'Coordinación y gestión de proyectos digitales multi-servicio.'),
  ('20000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000002', 'PM gestion', 'PM-GESTION', 'Coordinación y gestión de proyectos digitales multi-servicio.'),
  -- SEO linkbuilding (DMM, DME)
  ('20000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001', 'SEO linkbuilding', 'SEO-LINKBUILDING', 'Servicio diferenciado de link building.'),
  ('20000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002', 'SEO linkbuilding', 'SEO-LINKBUILDING', 'Servicio diferenciado de link building.'),
  -- Redacción (DMM, DME)
  ('20000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000001', 'Redacción', 'REDACCION', 'Servicio de redacción de contenidos de todo tipo.'),
  ('20000000-0000-0000-0000-000000000025', '10000000-0000-0000-0000-000000000002', 'Redacción', 'REDACCION', 'Servicio de redacción de contenidos de todo tipo.'),
  -- Branding (DMM, DME, BBD, KAU)
  ('20000000-0000-0000-0000-000000000026', '10000000-0000-0000-0000-000000000001', 'Branding', 'BRANDING', 'Diseño de marcas, logos, brand books, etc.'),
  ('20000000-0000-0000-0000-000000000027', '10000000-0000-0000-0000-000000000002', 'Branding', 'BRANDING', 'Diseño de marcas, logos, brand books, etc.'),
  ('20000000-0000-0000-0000-000000000028', '10000000-0000-0000-0000-000000000005', 'Branding', 'BRANDING', 'Diseño de marcas, logos, brand books, etc.'),
  ('20000000-0000-0000-0000-000000000029', '10000000-0000-0000-0000-000000000004', 'Branding', 'BRANDING', 'Diseño de marcas, logos, brand books, etc.'),
  -- PR: país (DMM, DME)
  ('20000000-0000-0000-0000-000000000030', '10000000-0000-0000-0000-000000000001', 'PR: país', 'PR-PAIS', 'Servicio de gestión PR diferenciado en cada mercado.'),
  ('20000000-0000-0000-0000-000000000031', '10000000-0000-0000-0000-000000000002', 'PR: país', 'PR-PAIS', 'Servicio de gestión PR diferenciado en cada mercado.'),
  -- SM estrategia (DMM, DME)
  ('20000000-0000-0000-0000-000000000032', '10000000-0000-0000-0000-000000000001', 'SM estrategia', 'SM-ESTRATEGIA', 'Conceptualización y planificación de toda la estrategia digital.'),
  ('20000000-0000-0000-0000-000000000033', '10000000-0000-0000-0000-000000000002', 'SM estrategia', 'SM-ESTRATEGIA', 'Conceptualización y planificación de toda la estrategia digital.'),
  -- PR estrategia (DMM, DME)
  ('20000000-0000-0000-0000-000000000034', '10000000-0000-0000-0000-000000000001', 'PR estrategia', 'PR-ESTRATEGIA', 'Conceptualización y planificación de toda la estrategia PR.'),
  ('20000000-0000-0000-0000-000000000035', '10000000-0000-0000-0000-000000000002', 'PR estrategia', 'PR-ESTRATEGIA', 'Conceptualización y planificación de toda la estrategia PR.'),
  -- PPC setup (DMM, DME)
  ('20000000-0000-0000-0000-000000000036', '10000000-0000-0000-0000-000000000001', 'PPC setup', 'PPC-SETUP', 'Servicio de activación de plataformas, cuentas y campañas al inicio de un proyecto de PPC.'),
  ('20000000-0000-0000-0000-000000000037', '10000000-0000-0000-0000-000000000002', 'PPC setup', 'PPC-SETUP', 'Servicio de activación de plataformas, cuentas y campañas al inicio de un proyecto de PPC.'),
  -- Web (DMM, DME, BBD)
  ('20000000-0000-0000-0000-000000000038', '10000000-0000-0000-0000-000000000001', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),
  ('20000000-0000-0000-0000-000000000039', '10000000-0000-0000-0000-000000000002', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),
  ('20000000-0000-0000-0000-000000000040', '10000000-0000-0000-0000-000000000005', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),
  -- PPC gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000041', '10000000-0000-0000-0000-000000000001', 'PPC gestion', 'PPC-GESTION', 'Servicio de gestión de inversión publicitaria de PPC.'),
  ('20000000-0000-0000-0000-000000000042', '10000000-0000-0000-0000-000000000002', 'PPC gestion', 'PPC-GESTION', 'Servicio de gestión de inversión publicitaria de PPC.'),
  -- PR gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000043', '10000000-0000-0000-0000-000000000001', 'PR gestion', 'PR-GESTION', 'Servicio de gestión de earned media, así como colaboraciones pagadas.'),
  ('20000000-0000-0000-0000-000000000044', '10000000-0000-0000-0000-000000000002', 'PR gestion', 'PR-GESTION', 'Servicio de gestión de earned media, así como colaboraciones pagadas.'),
  -- SM influencers (DMM, DME)
  ('20000000-0000-0000-0000-000000000045', '10000000-0000-0000-0000-000000000001', 'SM influencers', 'SM-INFLUENCERS', 'Servicio de gestión de influencers.'),
  ('20000000-0000-0000-0000-000000000046', '10000000-0000-0000-0000-000000000002', 'SM influencers', 'SM-INFLUENCERS', 'Servicio de gestión de influencers.'),
  -- AUT mails (DMM, DME)
  ('20000000-0000-0000-0000-000000000047', '10000000-0000-0000-0000-000000000001', 'AUT mails', 'AUT-MAILS', 'Redacción, preparación, maquetación y envío de emails puntuales o recurrentes.'),
  ('20000000-0000-0000-0000-000000000048', '10000000-0000-0000-0000-000000000002', 'AUT mails', 'AUT-MAILS', 'Redacción, preparación, maquetación y envío de emails puntuales o recurrentes.'),
  -- Integración (DMM, DME)
  ('20000000-0000-0000-0000-000000000049', '10000000-0000-0000-0000-000000000001', 'Integración', 'INTEGRACION', 'Investigación, planteamiento y desarrollo de integraciones entre el CRM y plataformas de terceros.'),
  ('20000000-0000-0000-0000-000000000050', '10000000-0000-0000-0000-000000000002', 'Integración', 'INTEGRACION', 'Investigación, planteamiento y desarrollo de integraciones entre el CRM y plataformas de terceros.'),
  -- CRM activ (DMM, DME)
  ('20000000-0000-0000-0000-000000000051', '10000000-0000-0000-0000-000000000001', 'CRM activ', 'CRM-ACTIV', 'Preparación, configuración y mejora de un CRM ya implementado.'),
  ('20000000-0000-0000-0000-000000000052', '10000000-0000-0000-0000-000000000002', 'CRM activ', 'CRM-ACTIV', 'Preparación, configuración y mejora de un CRM ya implementado.'),
  -- CRM sales (DMM, DME)
  ('20000000-0000-0000-0000-000000000053', '10000000-0000-0000-0000-000000000001', 'CRM sales', 'CRM-SALES', 'Gestión de CRM dedicado a prospectos, negociaciones, tratos y comunicaciones.'),
  ('20000000-0000-0000-0000-000000000054', '10000000-0000-0000-0000-000000000002', 'CRM sales', 'CRM-SALES', 'Gestión de CRM dedicado a prospectos, negociaciones, tratos y comunicaciones.'),
  -- LOY estr (DMM, DME)
  ('20000000-0000-0000-0000-000000000055', '10000000-0000-0000-0000-000000000001', 'LOY estr', 'LOY-ESTR', 'Definición estratégica y conceptualización de un programa de fidelización.'),
  ('20000000-0000-0000-0000-000000000056', '10000000-0000-0000-0000-000000000002', 'LOY estr', 'LOY-ESTR', 'Definición estratégica y conceptualización de un programa de fidelización.'),
  -- CRM audit (DMM, DME)
  ('20000000-0000-0000-0000-000000000057', '10000000-0000-0000-0000-000000000001', 'CRM audit', 'CRM-AUDIT', 'Auditoría de un CRM, su estado, las funcionalidades implementadas y recomendaciones.'),
  ('20000000-0000-0000-0000-000000000058', '10000000-0000-0000-0000-000000000002', 'CRM audit', 'CRM-AUDIT', 'Auditoría de un CRM, su estado, las funcionalidades implementadas y recomendaciones.'),
  -- CRM implem (DMM, DME)
  ('20000000-0000-0000-0000-000000000059', '10000000-0000-0000-0000-000000000001', 'CRM implem', 'CRM-IMPLEM', 'Investigación, selección y acompañamiento sobre la implementación técnica de un CRM.'),
  ('20000000-0000-0000-0000-000000000060', '10000000-0000-0000-0000-000000000002', 'CRM implem', 'CRM-IMPLEM', 'Investigación, selección y acompañamiento sobre la implementación técnica de un CRM.'),
  -- Creas (DMM, DME, KAU)
  ('20000000-0000-0000-0000-000000000061', '10000000-0000-0000-0000-000000000001', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),
  ('20000000-0000-0000-0000-000000000062', '10000000-0000-0000-0000-000000000002', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),
  ('20000000-0000-0000-0000-000000000063', '10000000-0000-0000-0000-000000000004', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),
  -- AUT gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000064', '10000000-0000-0000-0000-000000000001', 'AUT gestion', 'AUT-GESTION', 'Planteamiento estratégico y ejecución de marketing automation.'),
  ('20000000-0000-0000-0000-000000000065', '10000000-0000-0000-0000-000000000002', 'AUT gestion', 'AUT-GESTION', 'Planteamiento estratégico y ejecución de marketing automation.'),
  -- DIS (DMM, DME, KAU)
  ('20000000-0000-0000-0000-000000000066', '10000000-0000-0000-0000-000000000001', 'DIS', 'DIS', 'Proyectos especiales de diseño.'),
  ('20000000-0000-0000-0000-000000000067', '10000000-0000-0000-0000-000000000002', 'DIS', 'DIS', 'Proyectos especiales de diseño.'),
  ('20000000-0000-0000-0000-000000000068', '10000000-0000-0000-0000-000000000004', 'DIS', 'DIS', 'Proyectos especiales de diseño.'),
  -- Afiliación (DMM, DME)
  ('20000000-0000-0000-0000-000000000069', '10000000-0000-0000-0000-000000000001', 'Afiliación', 'AFILIACION', 'Servicio de gestión de programas de afiliados.'),
  ('20000000-0000-0000-0000-000000000070', '10000000-0000-0000-0000-000000000002', 'Afiliación', 'AFILIACION', 'Servicio de gestión de programas de afiliados.'),
  -- LOY implem (DMM, DME)
  ('20000000-0000-0000-0000-000000000071', '10000000-0000-0000-0000-000000000001', 'LOY implem', 'LOY-IMPLEM', 'Configuración técnica y puesta en marcha de la tecnología de fidelización.'),
  ('20000000-0000-0000-0000-000000000072', '10000000-0000-0000-0000-000000000002', 'LOY implem', 'LOY-IMPLEM', 'Configuración técnica y puesta en marcha de la tecnología de fidelización.'),
  -- LOY gestion (DMM, DME)
  ('20000000-0000-0000-0000-000000000073', '10000000-0000-0000-0000-000000000001', 'LOY gestion', 'LOY-GESTION', 'Optimización continua de la estrategia de fidelización y reporting.'),
  ('20000000-0000-0000-0000-000000000074', '10000000-0000-0000-0000-000000000002', 'LOY gestion', 'LOY-GESTION', 'Optimización continua de la estrategia de fidelización y reporting.'),
  -- Desarrollo (DMM, DME)
  ('20000000-0000-0000-0000-000000000075', '10000000-0000-0000-0000-000000000001', 'Desarrollo', 'DESARROLLO', 'Creación y/o mantenimiento de plugins/herramientas/aplicaciones.'),
  ('20000000-0000-0000-0000-000000000076', '10000000-0000-0000-0000-000000000002', 'Desarrollo', 'DESARROLLO', 'Creación y/o mantenimiento de plugins/herramientas/aplicaciones.'),
  -- Mantenimiento (DMM, DME)
  ('20000000-0000-0000-0000-000000000077', '10000000-0000-0000-0000-000000000001', 'Mantenimiento', 'MANTENIMIENTO', 'Mantenimiento de PLESK y sitios web corporativos.'),
  ('20000000-0000-0000-0000-000000000078', '10000000-0000-0000-0000-000000000002', 'Mantenimiento', 'MANTENIMIENTO', 'Mantenimiento de PLESK y sitios web corporativos.'),
  -- DATA (DMM, DME)
  ('20000000-0000-0000-0000-000000000079', '10000000-0000-0000-0000-000000000001', 'DATA', 'DATA', 'Servicios relacionados con la gestión de datos: GA4, dashboards, data layer, etc.'),
  ('20000000-0000-0000-0000-000000000080', '10000000-0000-0000-0000-000000000002', 'DATA', 'DATA', 'Servicios relacionados con la gestión de datos: GA4, dashboards, data layer, etc.'),
  -- PRO (DMM, DME, BBD)
  ('20000000-0000-0000-0000-000000000081', '10000000-0000-0000-0000-000000000001', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),
  ('20000000-0000-0000-0000-000000000082', '10000000-0000-0000-0000-000000000002', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),
  ('20000000-0000-0000-0000-000000000083', '10000000-0000-0000-0000-000000000005', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),
  -- PRO activ (DMM, DME, BBD)
  ('20000000-0000-0000-0000-000000000084', '10000000-0000-0000-0000-000000000001', 'PRO activ', 'PRO-ACTIV', 'Servicio de activación de plataformas al inicio de un proyecto de Programática.'),
  ('20000000-0000-0000-0000-000000000085', '10000000-0000-0000-0000-000000000002', 'PRO activ', 'PRO-ACTIV', 'Servicio de activación de plataformas al inicio de un proyecto de Programática.'),
  ('20000000-0000-0000-0000-000000000086', '10000000-0000-0000-0000-000000000005', 'PRO activ', 'PRO-ACTIV', 'Servicio de activación de plataformas al inicio de un proyecto de Programática.'),
  -- IT (DMM, DME, KAU)
  ('20000000-0000-0000-0000-000000000087', '10000000-0000-0000-0000-000000000001', 'IT', 'IT', 'Proyectos especiales de desarrollo.'),
  ('20000000-0000-0000-0000-000000000088', '10000000-0000-0000-0000-000000000002', 'IT', 'IT', 'Proyectos especiales de desarrollo.'),
  ('20000000-0000-0000-0000-000000000089', '10000000-0000-0000-0000-000000000004', 'IT', 'IT', 'Proyectos especiales de desarrollo.'),
  -- Reclutamiento (AUR)
  ('20000000-0000-0000-0000-000000000090', '10000000-0000-0000-0000-000000000007', 'Reclutamiento', 'RECLUTAMIENTO', 'Servicios de reclutamiento para clientes.'),
  -- Formación (AUR)
  ('20000000-0000-0000-0000-000000000091', '10000000-0000-0000-0000-000000000007', 'Formación', 'FORMACION', 'Servicios de formación a equipos de clientes.');
