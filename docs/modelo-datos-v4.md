# Modelo de Datos v4 — Company OS

Última actualización: 2026-03-25

---

## Convenciones generales

- `id`: UUID PK, DEFAULT gen_random_uuid()
- `created_at`: timestamptz, DEFAULT now()
- `updated_at`: timestamptz, actualizado vía trigger o app
- `deleted_at`: timestamptz, nullable — solo en tablas financieras (soft delete)
- Nombres de tablas y columnas en español, snake_case
- FKs nombradas como `tabla_id` (ej: `empresa_grupo_id`)
- Códigos con restricción UNIQUE(empresa_grupo_id, codigo) en lookups por empresa

---

## BLOQUE 1 — INTERNO (Holding)

### `empresas_grupo` (maestra)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre` | text | Nombre interno |
| `nombre_legal` | text, nullable | Razón social |
| `codigo` | text, unique | Código interno |
| `cif` | text | CIF |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `catalogo_servicios` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | Nombre del servicio |
| `codigo` | text | UNIQUE(empresa_grupo_id, codigo) |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `departamentos` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | |
| `codigo` | text | UNIQUE(empresa_grupo_id, codigo) |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `servicios_y_depts` (intermedia N:M)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `servicio_id` | UUID FK | → catalogo_servicios |
| `departamento_id` | UUID FK | → departamentos |
| `created_at` | timestamptz | Auto |

---

### `rangos_internos` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | |
| `codigo` | text | UNIQUE(empresa_grupo_id, codigo) |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `puestos` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | |
| `codigo` | text | UNIQUE(empresa_grupo_id, codigo) |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `divisiones` (lookup global)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre` | text | BDEV, TALE, CONS, OPER, ADMI, DIRE |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Universales: las mismas divisiones aplican a todas las empresas del grupo.

---

### `roles` (lookup global)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre` | text | Fundador, Administrador, Socio, Director, Coordinador, Responsable, Miembro, Intern, Externo, Implant |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Universales: los mismos roles aplican a todas las personas del grupo.

---

### `ciudades` (lookup global)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre` | text | Valencia, Madrid, Barcelona, Guadalajara, Puebla |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `oficinas` (lookup global)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre` | text | San Valero, Ramon Turro, Mendez Alvaro, Av America |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `personas` (entidad → empresas_grupo + lookups)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `persona` | text | Alias / identificador informal |
| `dni` | text, unique | DNI/NIE |
| `nombre` | text | |
| `apellido_primero` | text | |
| `apellido_segundo` | text, nullable | |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `ciudad_id` | UUID FK | → ciudades |
| `oficina_id` | UUID FK, nullable | → oficinas (nullable: remoto o implant) |
| `rango_id` | UUID FK | → rangos_internos |
| `puesto_id` | UUID FK | → puestos |
| `division_id` | UUID FK | → divisiones |
| `rol_id` | UUID FK | → roles |
| `fecha_incorporacion` | date | Fecha de alta |
| `fecha_baja` | date, nullable | Null = sigue activo |
| `activo` | boolean | Default true |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Los campos organizativos (empresa_grupo_id, rango_id, puesto_id, division_id, rol_id) son el valor actual. Los departamentos de cada persona se definen en `personas_departamentos` (N:M con % de tiempo). La fuente de verdad histórica es `condiciones`. El campo `persona` es un alias informal (ej: "Marta G."), no el nombre legal.

---

### `personas_departamentos` (intermedia N:M — reparto de tiempo por departamento)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `persona_id` | UUID FK | → personas |
| `departamento_id` | UUID FK | → departamentos |
| `porcentaje_tiempo` | numeric | % del tiempo dedicado (ej: 100, 70, 30). La suma por persona debe ser 100 |
| `created_at` | timestamptz | Auto |

> UNIQUE(persona_id, departamento_id). Permite que una persona reparta su tiempo entre varios departamentos. Las horas disponibles por departamento = horas_trabajables × porcentaje_tiempo / 100.

---

### `condiciones` (entidad → personas — foto completa histórica)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `persona_id` | UUID FK | → personas |
| `fecha_inicio` | date | Inicio de vigencia |
| `fecha_fin` | date, nullable | Null = vigente |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `departamento_id` | UUID FK | → departamentos |
| `rango_id` | UUID FK | → rangos_internos |
| `puesto_id` | UUID FK | → puestos |
| `division_id` | UUID FK | → divisiones |
| `rol_id` | UUID FK | → roles |
| `salario_bruto_anual` | numeric | |
| `tipo_contrato` | text | Indefinido, temporal, prácticas, autónomo... |
| `jornada` | text | Completa, parcial, media jornada... |
| `horas_semana` | numeric | Ej: 40, 30, 20 |
| `benefits` | text, nullable | Descripción libre |
| `coste_seguridad_social` | numeric, nullable | Coste SS anual |
| `notas` | text, nullable | Motivo del cambio |
| `deleted_at` | timestamptz, nullable | Soft delete |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Fuente de verdad para cálculo de costes históricos. Cada fila = un periodo con unas condiciones. Al cambiar cualquier campo, se cierra la fila actual (fecha_fin) y se abre una nueva.

---

### `ausencias` (entidad → personas)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `persona_id` | UUID FK | → personas |
| `tipo` | text | Vacaciones, baja médica, permiso... |
| `fecha_inicio` | date | |
| `fecha_fin` | date | |
| `notas` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `evolucion` (entidad → personas — evaluaciones de desempeño)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `persona_id` | UUID FK | → personas |
| `fecha` | date | |
| `tipo_evento` | text | Promoción, cambio departamento, evaluación... |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Registra evaluaciones de desempeño (notas, objetivos, rendimiento). Los cambios económicos derivados se registran siempre en `condiciones`.

---

## BLOQUE 2 — CLIENTES Y PROYECTOS

### `empresas` (maestra — clientes, independiente de empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre_legal` | text | Razón social |
| `cif` | text, unique | |
| `nombre_interno` | text, nullable | |
| `estado` | text, check | Conocido, Prospecto, Cliente, Baja, Otros |
| `tipo` | text, check | Marca, Fabricante, Fondo, Agencia, Tecnología |
| `tipo_conocido` | text, nullable, check | Solo si estado=Conocido. Branding, Inbound, Outbound, Eventos propios, Eventos externos, Cercanos |
| `tipo_cliente` | text, nullable, check | Solo si estado=Cliente. Consultoria, Servicio, Solucion |
| `estado_prospecto` | text, nullable, check | Solo si estado=Prospecto. Prospección, Propuesta, Negociación, Activación |
| `fecha_primer_contrato` | date, nullable | |
| `direccion` | text, nullable | |
| `sector` | text, nullable | |
| `web` | text, nullable | |
| `notas` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Campos condicionales (tipo_conocido, tipo_cliente, estado_prospecto): la coherencia se valida en la Server Action con zod, no en la DB. Múltiples empresas del grupo pueden trabajar un mismo cliente.

---

### `contactos_empresas` (entidad → empresas)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_id` | UUID FK | → empresas |
| `nombre` | text | |
| `apellidos` | text, nullable | |
| `email` | text, nullable | |
| `telefono` | text, nullable | |
| `cargo` | text, nullable | |
| `departamento` | text, nullable | Depto dentro de la empresa cliente |
| `es_decisor` | boolean | Default false |
| `es_contacto_principal` | boolean | Default false |
| `notas` | text, nullable | |
| `activo` | boolean | Default true |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `historial_estado_empresa` (historial → empresas)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_id` | UUID FK | → empresas |
| `estado_anterior` | text | Conocido, Prospecto, Cliente, Baja, Otros |
| `estado_nuevo` | text | Conocido, Prospecto, Cliente, Baja, Otros |
| `subestado_anterior` | text, nullable | Valor anterior de tipo_conocido / tipo_cliente / estado_prospecto |
| `subestado_nuevo` | text, nullable | Nuevo valor |
| `fecha` | date | Cuándo ocurrió |
| `notas` | text, nullable | Motivo del cambio |
| `created_at` | timestamptz | Auto |

---

### `proyectos` (entidad → empresas + empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_id` | UUID FK, nullable | → empresas (nullable para proyectos internos) |
| `empresa_grupo_id` | UUID FK | → empresas_grupo (qué empresa del holding ejecuta) |
| `titulo` | text | |
| `descripcion` | text, nullable | |
| `tipo_proyecto` | text, check | Interno, Externo, Facturable |
| `tipo_partida` | text, check | Puntual, Recurrente |
| `estado` | text, check | Propuesta, Confirmado, Activo, Pausado, Finalizado, Cancelado |
| `aprobador_final_id` | UUID FK | → personas |
| `ppto_estimado` | numeric | Presupuesto estimado en euros (mensual para Recurrente, total para Puntual) |
| `explicacion_presupuestos` | text, nullable | |
| `fecha_activacion` | date, nullable | |
| `fecha_cierre` | date, nullable | |
| `notas` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Nombre para mostrar (computado en app): empresa.nombre_interno - proyecto.titulo. Los servicios se definen a nivel de orden de trabajo, no de proyecto.
> El ciclo de vida se gestiona con `estado`. Los cambios se documentan en `historial_estado_proyecto`.
> Los departamentos que participan en un proyecto se definen en `proyectos_departamentos` (N:M).

---

### `proyectos_departamentos` (intermedia N:M — departamentos por proyecto)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `proyecto_id` | UUID FK | → proyectos |
| `departamento_id` | UUID FK | → departamentos |
| `created_at` | timestamptz | Auto |

> UNIQUE(proyecto_id, departamento_id). Un proyecto puede involucrar a varios departamentos. Cada orden de trabajo del proyecto tiene un único departamento.

---

### `historial_estado_proyecto` (historial → proyectos)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `proyecto_id` | UUID FK | → proyectos |
| `estado_anterior` | text | Propuesta, Confirmado, Activo, Pausado, Finalizado, Cancelado |
| `estado_nuevo` | text | Propuesta, Confirmado, Activo, Pausado, Finalizado, Cancelado |
| `fecha` | date | Cuándo ocurrió |
| `notas` | text, nullable | Motivo del cambio |
| `created_at` | timestamptz | Auto |

---

### `ordenes_trabajo` (entidad → proyectos)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `proyecto_id` | UUID FK | → proyectos |
| `servicio_id` | UUID FK | → catalogo_servicios (el servicio de esta orden) |
| `departamento_id` | UUID FK | → departamentos (departamento que ejecuta esta orden) |
| `mes_anio` | date | Primer día del mes (ej: 2026-03-01) |
| `porcentaje_ppto_mes` | numeric | % del ppto estimado del proyecto para esta orden. Puntual: reparte el ppto total entre órdenes. Recurrente: reparte el ppto mensual entre órdenes del mismo mes |
| `partida_prevista` | numeric | Puede calcularse (ppto x %), pero almacenado para override manual |
| `partida_real` | numeric, nullable | Obligatorio antes de confirmar |
| `aprobador_id` | UUID FK | → personas |
| `estado` | text, check | Propuesto, Planificado, Confirmado, Facturado |
| `fecha_inicio` | date | |
| `fecha_fin` | date, nullable | |
| `notas` | text, nullable | |
| `deleted_at` | timestamptz, nullable | Soft delete |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Constraint: UNIQUE(proyecto_id, departamento_id, servicio_id, mes_anio). Un departamento puede tener varias órdenes por proyecto y mes, una por cada servicio distinto.

---

### `ordenes_trabajo_personas` (intermedia N:M — personas preseleccionadas)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `orden_trabajo_id` | UUID FK | → ordenes_trabajo |
| `persona_id` | UUID FK | → personas (persona preseleccionada) |
| `created_at` | timestamptz | Auto |

> Preselección de personas para una orden. Se usa para generar asignaciones automáticamente. La fuente de verdad final de quién trabaja en qué es `asignaciones`.

---

### `asignaciones` (entidad → ordenes_trabajo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `orden_trabajo_id` | UUID FK | → ordenes_trabajo |
| `persona_id` | UUID FK | → personas (persona asignada) |
| `porcentaje_ppto_tm` | numeric | % de la partida asignado a esta persona |
| `cuota_planificacion_id` | UUID FK | → cuotas_planificacion (tarifa congelada para esta asignación) |
| `deleted_at` | timestamptz, nullable | Soft delete |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Constraint: UNIQUE(orden_trabajo_id, persona_id)

Campos calculados (en queries, no almacenados):
- **Ingresos asignados** = partida_prevista x porcentaje_ppto_tm
- **Ingresos reales** = partida_real x porcentaje_ppto_tm
- **Horas a dedicar** = ingresos_asignados / cuota_planificacion.precio_hora
- **Utilización** = horas_asignadas_total / horas_trabajables

---

### `cuotas_planificacion` (lookup temporal → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | Nombre de la categoría de tarifa (ej: Intern, Junior, Specialist, Senior, Coordinador) |
| `precio_hora` | numeric | Euros por hora |
| `inicio_validez` | date | |
| `fin_validez` | date, nullable | Null = tarifa vigente |
| `nota` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Se usa para planificación (cálculo de horas desde presupuesto). **No está relacionada con `rangos_internos`** (RRHH). Cada empresa del grupo define sus propias categorías de tarifa con nombres y precios/hora independientes. Cada asignación apunta a una cuota concreta, así los informes históricos muestran la tarifa que aplicaba en ese momento. El `rango_id` en `condiciones`/`personas` apunta a `rangos_internos` y se usa para costes internos (RRHH), no para planificación.

---

### `horas_trabajables` (lookup con overrides → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `mes_trabajo` | date | Primer día del mes |
| `horas` | numeric | Horas trabajables |
| `departamento_id` | UUID FK, nullable | → departamentos (override por departamento) |
| `persona_id` | UUID FK, nullable | → personas (override por persona) |
| `comentarios` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Lógica de resolución (prioridad): persona > departamento > empresa (general).
> Se puede crear una fila por departamento con horas específicas si difieren de la empresa.

---

## RESUMEN — 26 tablas

| # | Tabla | Tipo | Depende de |
|---|---|---|---|
| 1 | `empresas_grupo` | Maestra | — |
| 2 | `catalogo_servicios` | Lookup | 1 |
| 3 | `departamentos` | Lookup | 1 |
| 4 | `servicios_y_depts` | Intermedia N:M | 2, 3 |
| 5 | `rangos_internos` | Lookup | 1 |
| 6 | `puestos` | Lookup | 1 |
| 7 | `divisiones` | Lookup global | — |
| 8 | `roles` | Lookup global | — |
| 9 | `ciudades` | Lookup global | — |
| 10 | `oficinas` | Lookup global | — |
| 11 | `personas` | Entidad | 1, 5, 6, 7, 8, 9, 10 |
| 11b | `personas_departamentos` | Intermedia N:M | 11, 3 |
| 12 | `condiciones` | Entidad histórica | 11, 1, 3, 5, 6, 7, 8 |
| 13 | `ausencias` | Entidad | 11 |
| 14 | `evolucion` | Entidad | 11 |
| 15 | `empresas` | Maestra | — |
| 16 | `contactos_empresas` | Entidad | 15 |
| 17 | `historial_estado_empresa` | Historial | 15 |
| 18 | `proyectos` | Entidad | 15, 1, 11 |
| 18b | `proyectos_departamentos` | Intermedia N:M | 18, 3 |
| 19 | `historial_estado_proyecto` | Historial | 18 |
| 20 | `ordenes_trabajo` | Entidad | 18, 2, 3, 11 |
| 21 | `asignaciones` | Entidad | 20, 11, 22 |
| 21b | `ordenes_trabajo_personas` | Intermedia N:M | 20, 11 |
| 22 | `cuotas_planificacion` | Lookup temporal | 1 |
| 23 | `horas_trabajables` | Lookup con overrides | 1, 3, 11 |
