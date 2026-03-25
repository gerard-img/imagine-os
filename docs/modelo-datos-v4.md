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

### `divisiones` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | BDEV, TALE, CONS, OPER, ADMI, DIRE |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `roles` (lookup → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `nombre` | text | Fundador, Administrador, Socio, Director, Coordinador, Responsable, Miembro, Intern, Externo, Implant |
| `descripcion` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

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

### `equipo` (entidad → empresas_grupo + lookups)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `nombre_interno` | text | Identificador informal |
| `dni` | text, unique | DNI/NIE |
| `nombre` | text | |
| `apellido_primero` | text | |
| `apellido_segundo` | text, nullable | |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `departamento_id` | UUID FK | → departamentos |
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

> Los campos organizativos (empresa_grupo_id, departamento_id, rango_id, puesto_id, division_id, rol_id) son el valor actual. La fuente de verdad histórica es `condiciones`.

---

### `condiciones` (entidad → equipo — foto completa histórica)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `equipo_id` | UUID FK | → equipo |
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

### `ausencias` (entidad → equipo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `equipo_id` | UUID FK | → equipo |
| `tipo` | text | Vacaciones, baja médica, permiso... |
| `fecha_inicio` | date | |
| `fecha_fin` | date | |
| `notas` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

---

### `evolucion` (entidad → equipo — evaluaciones de desempeño)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `equipo_id` | UUID FK | → equipo |
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
| `servicio_principal_id` | UUID FK, nullable | → catalogo_servicios (studio principal, para display) |
| `titulo` | text | |
| `descripcion` | text, nullable | |
| `tipo_proyecto` | text, check | Interno, Externo, Facturable |
| `tipo_partida` | text, check | Puntual, Recurrente |
| `estado` | text, check | Propuesta, Confirmado, Activo, Pausado, Finalizado, Cancelado |
| `aprobador_final_id` | UUID FK | → equipo |
| `ppto_mensual_esperado` | numeric | Presupuesto mensual en euros |
| `explicacion_presupuestos` | text, nullable | |
| `fecha_activacion` | date, nullable | |
| `fecha_cierre` | date, nullable | |
| `notas` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Nombre para mostrar (computado en app): empresa.nombre_interno + servicio_principal + titulo.
> El ciclo de vida se gestiona con `estado`. Los cambios se documentan en `historial_estado_proyecto`.

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
| `servicio_id` | UUID FK | → catalogo_servicios (el studio de esta orden) |
| `mes_anio` | date | Primer día del mes (ej: 2026-03-01) |
| `porcentaje_ppto_mes` | numeric | % del ppto mensual del proyecto para esta orden |
| `partida_prevista` | numeric | Puede calcularse (ppto x %), pero almacenado para override manual |
| `partida_real` | numeric, nullable | Obligatorio antes de confirmar |
| `aprobador_id` | UUID FK | → equipo |
| `estado` | text, check | Propuesto, Planificado, Confirmado, Facturado |
| `fecha_inicio` | date | |
| `fecha_fin` | date, nullable | |
| `notas` | text, nullable | |
| `deleted_at` | timestamptz, nullable | Soft delete |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Constraint: UNIQUE(proyecto_id, servicio_id, mes_anio)

---

### `asignaciones` (entidad → ordenes_trabajo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `orden_trabajo_id` | UUID FK | → ordenes_trabajo |
| `equipo_id` | UUID FK | → equipo (persona asignada) |
| `porcentaje_ppto_tm` | numeric | % de la partida asignado a esta persona |
| `cuota_rango_id` | UUID FK | → cuotas_por_rango (tarifa congelada para esta asignación) |
| `deleted_at` | timestamptz, nullable | Soft delete |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Constraint: UNIQUE(orden_trabajo_id, equipo_id)

Campos calculados (en queries, no almacenados):
- **Ingresos asignados** = partida_prevista x porcentaje_ppto_tm
- **Ingresos reales** = partida_real x porcentaje_ppto_tm
- **Horas a dedicar** = ingresos_asignados / cuota_rango.precio_hora
- **Utilización** = horas_asignadas_total / horas_trabajables

---

### `cuotas_por_rango` (lookup temporal → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `rango_id` | UUID FK | → rangos_internos |
| `precio_hora` | numeric | Euros por hora |
| `inicio_validez` | date | |
| `fin_validez` | date, nullable | Null = tarifa vigente |
| `nota` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Se usa para planificación (ingresos). El rango_id en condiciones/equipo se usará para costes internos. Cada asignación apunta a una cuota concreta, así los informes históricos muestran la tarifa que aplicaba en ese momento.

---

### `horas_trabajables` (lookup con overrides → empresas_grupo)

| Campo | Tipo | Nota |
|---|---|---|
| `id` | UUID PK | Auto |
| `empresa_grupo_id` | UUID FK | → empresas_grupo |
| `mes_trabajo` | date | Primer día del mes |
| `horas` | numeric | Horas trabajables |
| `servicio_id` | UUID FK, nullable | → catalogo_servicios (override por studio) |
| `equipo_id` | UUID FK, nullable | → equipo (override por persona) |
| `comentarios` | text, nullable | |
| `created_at` | timestamptz | Auto |
| `updated_at` | timestamptz | Auto |

> Lógica de resolución (prioridad): persona > studio > empresa (general).
> El multi-select de studios de Coda se resuelve creando una fila por studio con las mismas horas.

---

## RESUMEN — 23 tablas

| # | Tabla | Tipo | Depende de |
|---|---|---|---|
| 1 | `empresas_grupo` | Maestra | — |
| 2 | `catalogo_servicios` | Lookup | 1 |
| 3 | `departamentos` | Lookup | 1 |
| 4 | `servicios_y_depts` | Intermedia N:M | 2, 3 |
| 5 | `rangos_internos` | Lookup | 1 |
| 6 | `puestos` | Lookup | 1 |
| 7 | `divisiones` | Lookup | 1 |
| 8 | `roles` | Lookup | 1 |
| 9 | `ciudades` | Lookup global | — |
| 10 | `oficinas` | Lookup global | — |
| 11 | `equipo` | Entidad | 1, 3, 5, 6, 7, 8, 9, 10 |
| 12 | `condiciones` | Entidad histórica | 11, 1, 3, 5, 6, 7, 8 |
| 13 | `ausencias` | Entidad | 11 |
| 14 | `evolucion` | Entidad | 11 |
| 15 | `empresas` | Maestra | — |
| 16 | `contactos_empresas` | Entidad | 15 |
| 17 | `historial_estado_empresa` | Historial | 15 |
| 18 | `proyectos` | Entidad | 15, 1, 2, 11 |
| 19 | `historial_estado_proyecto` | Historial | 18 |
| 20 | `ordenes_trabajo` | Entidad | 18, 2, 11 |
| 21 | `asignaciones` | Entidad | 20, 11, 22 |
| 22 | `cuotas_por_rango` | Lookup temporal | 1, 5 |
| 23 | `horas_trabajables` | Lookup con overrides | 1, 2, 11 |
