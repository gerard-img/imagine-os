-- 025_catalogo_servicios_reales.sql
--
-- Reemplaza el catálogo de servicios ficticio por los servicios reales.
-- Cada servicio puede pertenecer a varias empresas del grupo → una fila por (servicio, empresa).
--
-- UUID pattern: 20SS0000-0000-0000-0000-00000000000E
--   SS = número de servicio en hex (01–29), E = empresa (1–7)
--
-- Empresas: DMM=1, DME=2, IMG=3, KAU=4, BBD=5, DRR=6, AUR=7

BEGIN;

-- Limpiar referencias y datos ficticios
DELETE FROM servicios_y_depts;
DELETE FROM catalogo_servicios;

-- ================================================================
-- Servicios reales
-- ================================================================
INSERT INTO catalogo_servicios (id, empresa_grupo_id, nombre, codigo, descripcion) VALUES

  -- 01. SEO gestion — DMM, DME
  ('20010000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SEO gestion', 'SEO-GES', 'Servicio ongoing de gestión de SEO para webs de ecommerce, lead generation, blogs, apps y cualquier otro proyecto que lo solicite.'),
  ('20010000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SEO gestion', 'SEO-GES', 'Servicio ongoing de gestión de SEO para webs de ecommerce, lead generation, blogs, apps y cualquier otro proyecto que lo solicite.'),

  -- 02. SEO audit — DMM, DME
  ('20020000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SEO audit', 'SEO-AUD', 'Auditoría SEO o primera fase de cualquier proyecto SEO. Solo tiene Tarea de Gestión.'),
  ('20020000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SEO audit', 'SEO-AUD', 'Auditoría SEO o primera fase de cualquier proyecto SEO. Solo tiene Tarea de Gestión.'),

  -- 03. PM AUT — DMM, DME, KAU, BBD, DRR
  ('20030000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20030000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20030000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20030000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),
  ('20030000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000006', 'PM AUT', 'PM-AUT', 'Project management para proyectos mono-servicio de Automation.'),

  -- 04. SM gestion — DMM, DME
  ('20040000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SM gestion', 'SM-GES', 'Servicio de gestión de presencia en redes sociales.'),
  ('20040000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SM gestion', 'SM-GES', 'Servicio de gestión de presencia en redes sociales.'),

  -- 05. PM SEO — DMM, DME
  ('20050000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PM SEO', 'PM-SEO', 'Project management para proyectos mono-servicio de SEO.'),
  ('20050000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PM SEO', 'PM-SEO', 'Project management para proyectos mono-servicio de SEO.'),

  -- 06. PM PPC — DMM, DME
  ('20060000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PM PPC', 'PM-PPC', 'Project management para proyectos mono-servicio de PPC.'),
  ('20060000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PM PPC', 'PM-PPC', 'Project management para proyectos mono-servicio de PPC.'),

  -- 07. SEO local — DMM, DME
  ('20070000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SEO local', 'SEO-LOC', 'Servicio dirigido a mejorar posicionamiento de tiendas físicas o cuentas de GMB y estrategias similares. Solo tiene Tarea de Gestión.'),
  ('20070000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SEO local', 'SEO-LOC', 'Servicio dirigido a mejorar posicionamiento de tiendas físicas o cuentas de GMB y estrategias similares. Solo tiene Tarea de Gestión.'),

  -- 08. PM DIS — DMM, DME
  ('20080000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PM DIS', 'PM-DIS', 'Project management para proyectos mono-servicio de Diseño.'),
  ('20080000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PM DIS', 'PM-DIS', 'Project management para proyectos mono-servicio de Diseño.'),

  -- 09. PM gestion — DMM, DME
  ('20090000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PM gestion', 'PM-GES', 'Coordinación y gestión de proyectos digitales multi-servicio. Puede ser contratado para un único servicio o para un proyecto multi-servicio.'),
  ('20090000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PM gestion', 'PM-GES', 'Coordinación y gestión de proyectos digitales multi-servicio. Puede ser contratado para un único servicio o para un proyecto multi-servicio.'),

  -- 0a (10). SEO linkbuilding — DMM, DME
  ('200a0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SEO linkbuilding', 'SEO-LNK', 'Servicio diferenciado de link building. Solo tiene Tarea de Gestión.'),
  ('200a0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SEO linkbuilding', 'SEO-LNK', 'Servicio diferenciado de link building. Solo tiene Tarea de Gestión.'),

  -- 0b (11). Redacción — DMM, DME
  ('200b0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Redacción', 'REDAC', 'Servicio de redacción de contenidos de todo tipo.'),
  ('200b0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Redacción', 'REDAC', 'Servicio de redacción de contenidos de todo tipo.'),

  -- 0c (12). Branding — DMM, DME, BBD, KAU
  ('200c0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Branding', 'BRAND', 'Diseño de marcas, logos, brand books, etc.'),
  ('200c0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Branding', 'BRAND', 'Diseño de marcas, logos, brand books, etc.'),
  ('200c0000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Branding', 'BRAND', 'Diseño de marcas, logos, brand books, etc.'),
  ('200c0000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Branding', 'BRAND', 'Diseño de marcas, logos, brand books, etc.'),

  -- 0d (13). PR: país — DMM, DME
  ('200d0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PR: país', 'PR-PAIS', 'Servicio de gestión PR diferenciado en cada mercado, en caso de ser necesario por tipología de proyecto. El detalle del país se añade en el Tiquet de Trabajo/Presupuesto.'),
  ('200d0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PR: país', 'PR-PAIS', 'Servicio de gestión PR diferenciado en cada mercado, en caso de ser necesario por tipología de proyecto. El detalle del país se añade en el Tiquet de Trabajo/Presupuesto.'),

  -- 0e (14). SM estrategia — DMM, DME
  ('200e0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SM estrategia', 'SM-EST', 'Conceptualización y planificación de toda la estrategia digital, sea al principio de un proyecto o una revisión/renovación a lo largo del proyecto.'),
  ('200e0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SM estrategia', 'SM-EST', 'Conceptualización y planificación de toda la estrategia digital, sea al principio de un proyecto o una revisión/renovación a lo largo del proyecto.'),

  -- 0f (15). PR estrategia — DMM, DME
  ('200f0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PR estrategia', 'PR-EST', 'Conceptualización y planificación de toda la estrategia PR, sea al principio de un proyecto o una revisión/renovación a lo largo del proyecto.'),
  ('200f0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PR estrategia', 'PR-EST', 'Conceptualización y planificación de toda la estrategia PR, sea al principio de un proyecto o una revisión/renovación a lo largo del proyecto.'),

  -- 10 (16). PPC setup — DMM, DME
  ('20100000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PPC setup', 'PPC-SET', 'Servicio de activación de las plataformas, cuentas y campañas al inicio de un proyecto de PPC.'),
  ('20100000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PPC setup', 'PPC-SET', 'Servicio de activación de las plataformas, cuentas y campañas al inicio de un proyecto de PPC.'),

  -- 11 (17). Web — DMM, DME, BBD
  ('20110000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),
  ('20110000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),
  ('20110000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'Web', 'WEB', 'Diseños de webs, landings y otros assets similares.'),

  -- 12 (18). PPC gestion — DMM, DME
  ('20120000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PPC gestion', 'PPC-GES', 'Servicio de gestión de inversión publicitaria de PPC.'),
  ('20120000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PPC gestion', 'PPC-GES', 'Servicio de gestión de inversión publicitaria de PPC.'),

  -- 13 (19). PR gestion — DMM, DME
  ('20130000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PR gestion', 'PR-GES', 'Servicio de gestión de earned media, así como colaboraciones pagadas.'),
  ('20130000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PR gestion', 'PR-GES', 'Servicio de gestión de earned media, así como colaboraciones pagadas.'),

  -- 14 (20). SM influencers — DMM, DME
  ('20140000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'SM influencers', 'SM-INF', 'Servicio de gestión de influencers.'),
  ('20140000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'SM influencers', 'SM-INF', 'Servicio de gestión de influencers.'),

  -- 15 (21). AUT mails — DMM, DME
  ('20150000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'AUT mails', 'AUT-MAI', 'Redacción, preparación, maquetación y envío de emails puntuales o recurrentes, pero no escalables ni automatizados. Incluye estrategia de email marketing, planificación, segmentos, diseño, programación, test AB, análisis y reporting.'),
  ('20150000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'AUT mails', 'AUT-MAI', 'Redacción, preparación, maquetación y envío de emails puntuales o recurrentes, pero no escalables ni automatizados. Incluye estrategia de email marketing, planificación, segmentos, diseño, programación, test AB, análisis y reporting.'),

  -- 16 (22). Integración — DMM, DME
  ('20160000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Integración', 'INTEG', 'Investigación, planteamiento y desarrollo de integraciones entre el CRM y cualquier plataforma de terceros en un proyecto ya activo (ej: Zapier, WhatsApp, Calendly). No incluye las integraciones iniciales para poner en marcha un proyecto nuevo.'),
  ('20160000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Integración', 'INTEG', 'Investigación, planteamiento y desarrollo de integraciones entre el CRM y cualquier plataforma de terceros en un proyecto ya activo (ej: Zapier, WhatsApp, Calendly). No incluye las integraciones iniciales para poner en marcha un proyecto nuevo.'),

  -- 17 (23). CRM activ — DMM, DME
  ('20170000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CRM activ', 'CRM-ACT', 'Preparación, configuración y mejora de un CRM ya implementado para que ejecute funciones básicas y sea posible empezar a desarrollar automatizaciones más avanzadas.'),
  ('20170000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CRM activ', 'CRM-ACT', 'Preparación, configuración y mejora de un CRM ya implementado para que ejecute funciones básicas y sea posible empezar a desarrollar automatizaciones más avanzadas.'),

  -- 18 (24). CRM sales — DMM, DME
  ('20180000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CRM sales', 'CRM-SAL', 'Gestión de CRM dedicado a prospectos, negociaciones, tratos y comunicaciones para automatizar, segmentar y gestionar oportunidades de ventas y procesos operativos internos. Aplica a proyectos B2B o que no se basan en compra online.'),
  ('20180000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CRM sales', 'CRM-SAL', 'Gestión de CRM dedicado a prospectos, negociaciones, tratos y comunicaciones para automatizar, segmentar y gestionar oportunidades de ventas y procesos operativos internos. Aplica a proyectos B2B o que no se basan en compra online.'),

  -- 19 (25). LOY estr — DMM, DME
  ('20190000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LOY estr', 'LOY-EST', 'Definición estratégica y conceptualización de un programa de fidelización.'),
  ('20190000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'LOY estr', 'LOY-EST', 'Definición estratégica y conceptualización de un programa de fidelización.'),

  -- 1a (26). CRM audit — DMM, DME
  ('201a0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CRM audit', 'CRM-AUD', 'Auditoría de un CRM, su estado, las funcionalidades implementadas y recomendaciones.'),
  ('201a0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CRM audit', 'CRM-AUD', 'Auditoría de un CRM, su estado, las funcionalidades implementadas y recomendaciones.'),

  -- 1b (27). CRM implem — DMM, DME
  ('201b0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'CRM implem', 'CRM-IMP', 'Investigación, selección y acompañamiento sobre la implementación técnica de un CRM.'),
  ('201b0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'CRM implem', 'CRM-IMP', 'Investigación, selección y acompañamiento sobre la implementación técnica de un CRM.'),

  -- 1c (28). Creas — DMM, DME, KAU
  ('201c0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),
  ('201c0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),
  ('201c0000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'Creas', 'CREAS', 'Diseño de creatividades y artes para RRSS, PPC, Programática, etc.'),

  -- 1d (29). AUT gestion — DMM, DME
  ('201d0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'AUT gestion', 'AUT-GES', 'Planteamiento estratégico y ejecución de marketing automation: estrategia, workflows, segmentos, diseño de contenidos, formularios, catálogo de productos, modelo de datos, configuración de plataforma, análisis y reporting.'),
  ('201d0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'AUT gestion', 'AUT-GES', 'Planteamiento estratégico y ejecución de marketing automation: estrategia, workflows, segmentos, diseño de contenidos, formularios, catálogo de productos, modelo de datos, configuración de plataforma, análisis y reporting.'),

  -- 1e (30). DIS — DMM, DME, KAU
  ('201e0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'DIS', 'DIS', 'Proyectos especiales de diseño al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''DIS: infografías''.'),
  ('201e0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'DIS', 'DIS', 'Proyectos especiales de diseño al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''DIS: infografías''.'),
  ('201e0000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'DIS', 'DIS', 'Proyectos especiales de diseño al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''DIS: infografías''.'),

  -- 1f (31). Afiliación — DMM, DME
  ('201f0000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Afiliación', 'AFIL', 'Servicio de gestión de programas de afiliados.'),
  ('201f0000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Afiliación', 'AFIL', 'Servicio de gestión de programas de afiliados.'),

  -- 20 (32). LOY implem — DMM, DME
  ('20200000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LOY implem', 'LOY-IMP', 'Configuración técnica y tareas relacionadas con la implementación y puesta en marcha de la tecnología de fidelización.'),
  ('20200000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'LOY implem', 'LOY-IMP', 'Configuración técnica y tareas relacionadas con la implementación y puesta en marcha de la tecnología de fidelización.'),

  -- 21 (33). LOY gestion — DMM, DME
  ('20210000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'LOY gestion', 'LOY-GES', 'Optimización continua de la estrategia de fidelización, la activación de acciones relacionadas y la monitorización y reporting de resultados de esta área estratégica.'),
  ('20210000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'LOY gestion', 'LOY-GES', 'Optimización continua de la estrategia de fidelización, la activación de acciones relacionadas y la monitorización y reporting de resultados de esta área estratégica.'),

  -- 22 (34). Desarrollo — DMM, DME
  ('20220000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Desarrollo', 'DEV', 'Creación y/o mantenimiento de plugins/herramientas/aplicaciones para ofrecer servicios y/o cubrir necesidades internas corporativas.'),
  ('20220000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Desarrollo', 'DEV', 'Creación y/o mantenimiento de plugins/herramientas/aplicaciones para ofrecer servicios y/o cubrir necesidades internas corporativas.'),

  -- 23 (35). Mantenimiento — DMM, DME
  ('20230000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Mantenimiento', 'MANT', 'Mantenimiento de PLESK y sitios web corporativos.'),
  ('20230000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'Mantenimiento', 'MANT', 'Mantenimiento de PLESK y sitios web corporativos.'),

  -- 24 (36). DATA — DMM, DME
  ('20240000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'DATA', 'DATA', 'Servicios relacionados con la gestión de datos en todos sus aspectos. Los subproyectos varían según el trabajo: DATA GA4, DATA dashboards, DATA data layer, Auditoría de píxeles y etiquetas, revisión de GTM, etc.'),
  ('20240000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'DATA', 'DATA', 'Servicios relacionados con la gestión de datos en todos sus aspectos. Los subproyectos varían según el trabajo: DATA GA4, DATA dashboards, DATA data layer, Auditoría de píxeles y etiquetas, revisión de GTM, etc.'),

  -- 25 (37). PRO — DMM, DME, BBD
  ('20250000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),
  ('20250000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),
  ('20250000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'PRO', 'PRO', 'Servicio de gestión de inversión publicitaria de Programática.'),

  -- 26 (38). PRO activ — DMM, DME, BBD
  ('20260000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'PRO activ', 'PRO-ACT', 'Servicio de activación de las plataformas, cuentas y campañas al inicio de un proyecto de Programática.'),
  ('20260000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'PRO activ', 'PRO-ACT', 'Servicio de activación de las plataformas, cuentas y campañas al inicio de un proyecto de Programática.'),
  ('20260000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000005', 'PRO activ', 'PRO-ACT', 'Servicio de activación de las plataformas, cuentas y campañas al inicio de un proyecto de Programática.'),

  -- 27 (39). IT — DMM, DME, KAU
  ('20270000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'IT', 'IT', 'Proyectos especiales de desarrollo al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''IT: accesibilidad''. El detalle después de los dos puntos se añade en el Tiquet de Trabajo/Presupuesto.'),
  ('20270000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000002', 'IT', 'IT', 'Proyectos especiales de desarrollo al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''IT: accesibilidad''. El detalle después de los dos puntos se añade en el Tiquet de Trabajo/Presupuesto.'),
  ('20270000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000004', 'IT', 'IT', 'Proyectos especiales de desarrollo al que no aplican las categorías anteriores, o que agrega varios tipos en un solo proyecto. Requiere incluir '':'' para indicar qué proyecto especial es, por ej: ''IT: accesibilidad''. El detalle después de los dos puntos se añade en el Tiquet de Trabajo/Presupuesto.'),

  -- 28 (40). Reclutamiento — AUR
  ('20280000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Reclutamiento', 'RECL', 'Servicios de reclutamiento para clientes.'),

  -- 29 (41). Formación — AUR
  ('20290000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000007', 'Formación', 'FORM', 'Servicios de formación a equipos de clientes.');

COMMIT;
