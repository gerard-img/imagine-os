# Company OS — Briefing completo para planificación de sprints

Fecha: 2026-04-14

---

## 1. Qué es Company OS

Company OS es un sistema tipo **PSA (Professional Services Automation)** interno para un **holding de agencias de marketing y digital**. No es un producto SaaS para terceros: es una herramienta interna usada por los equipos del holding.

### Objetivo principal

Dar visibilidad financiera y operativa a la dirección del holding para tomar decisiones sobre:

- **Rentabilidad**: qué clientes, proyectos y personas generan margen y cuáles no.
- **Capacidad**: quién está sobrecargado, quién tiene horas libres, dónde se puede asumir más trabajo.
- **Concentración de riesgo**: cuánto depende una empresa del grupo de un solo cliente (índice HHI).
- **Planificación**: cuántas horas se necesitan por proyecto/mes y a qué tarifa se facturan.

### Qué NO hace (todavía)

- No registra horas directamente (el time tracking se hace en Clockify → Google Sheets → Company OS).
- No calcula márgenes reales (falta implementar el coste/hora por persona desde `condiciones`).
- No genera facturas ni conecta con sistemas contables.
- No tiene notificaciones, workflows automáticos ni integraciones externas.

---

## 2. Modelo de holding y multi-empresa

El holding tiene varias **empresas grupo** (ej: DME, DMM, IMG, KAU, DRR). Cada empresa grupo:

- Tiene sus propias personas, departamentos, servicios y tarifas.
- Trabaja con sus propios clientes y proyectos.
- Tiene sus propias cuotas de planificación (tarifas €/hora).

Las tablas lookup globales (divisiones, roles, ciudades, oficinas) son compartidas por todas las empresas del grupo.

---

## 3. Modelo de datos — 26 tablas

### 3.1 Bloque interno (holding y personas)

| Tabla | Tipo | Para qué sirve |
|---|---|---|
| `empresas_grupo` | Maestra | Cada empresa del holding (DME, DMM, etc.) |
| `catalogo_servicios` | Lookup → EG | Servicios que ofrece cada empresa (SEO, Paid Media, etc.) |
| `departamentos` | Lookup → EG | Departamentos internos por empresa |
| `servicios_y_depts` | N:M | Qué departamentos ejecutan qué servicios |
| `rangos_internos` | Lookup → EG | Niveles salariales/seniority (RRHH, NO planificación) |
| `puestos` | Lookup → EG | Puesto de trabajo (Account Manager, Diseñador, etc.) |
| `divisiones` | Lookup global | Áreas transversales (BDEV, TALE, CONS, OPER, ADMI, DIRE) |
| `roles` | Lookup global | Rol en la app (Fundador, Director, Coordinador, Miembro, Intern, Externo, Implant). Controla acceso al sidebar |
| `ciudades` | Lookup global | Valencia, Madrid, Barcelona, Guadalajara, Puebla |
| `oficinas` | Lookup global | Oficinas físicas |
| `personas` | Entidad | Cada trabajador del holding. Campos actuales: empresa_grupo, rango, puesto, división, rol, ciudad, oficina, departamentos (N:M con %) |
| `personas_departamentos` | N:M | Reparto de tiempo de una persona entre departamentos (ej: 70% Paid Media, 30% SEO). La suma debe ser 100% |
| `condiciones` | Entidad histórica | Foto completa de las condiciones laborales de una persona en un periodo: salario, tipo contrato, jornada, horas/semana, coste SS. Cada cambio cierra la fila anterior y abre una nueva |
| `ausencias` | Entidad | Vacaciones, bajas médicas, permisos |
| `evolucion` | Entidad | Evaluaciones de desempeño, promociones, cambios |

**Detalle importante — `personas`**:
- `persona` es un alias informal (ej: "Marta G."), no el nombre legal.
- Los campos organizativos en `personas` son el valor **actual**. La fuente de verdad histórica es `condiciones`.
- Una persona puede pertenecer a varios departamentos con % de tiempo distintos.

**Detalle importante — `condiciones`**:
- Tiene un campo `coste_hora_calculado` que **aún no tiene trigger ni cálculo implementado**. Se necesita resolver antes de construir el módulo de costes/márgenes.
- `salario_bruto_anual` + `coste_seguridad_social` + `horas_semana` son los inputs para calcular el coste/hora.

### 3.2 Bloque clientes y proyectos

| Tabla | Tipo | Para qué sirve |
|---|---|---|
| `empresas` | Maestra | Empresas externas (clientes, prospectos, conocidos). Estados: Conocido → Prospecto → Cliente → Baja |
| `contactos_empresas` | Entidad | Personas de contacto en cada empresa cliente. Flags: es_decisor, es_contacto_principal |
| `historial_estado_empresa` | Historial | Log de cambios de estado de una empresa |
| `proyectos` | Entidad | Proyectos vinculados a un cliente + una empresa del grupo que lo ejecuta |
| `proyectos_departamentos` | N:M | Qué departamentos participan en un proyecto |
| `historial_estado_proyecto` | Historial | Log de cambios de estado de un proyecto |
| `ordenes_trabajo` (OT) | Entidad | Unidad mínima de trabajo facturable: un servicio × un departamento × un mes × un proyecto |
| `ordenes_trabajo_personas` | N:M | Personas preseleccionadas para una OT (para generar asignaciones) |
| `asignaciones` | Entidad | Quién trabaja en qué OT, con qué % del presupuesto y a qué tarifa |
| `cuotas_planificacion` | Lookup temporal → EG | Tarifas €/hora por categoría (Intern, Junior, Senior, etc.). **No es lo mismo que `rangos_internos`** (RRHH). Cada asignación apunta a una cuota concreta para congelar la tarifa histórica |
| `horas_trabajables` | Lookup con overrides → EG | Horas trabajables por mes. Prioridad: persona > departamento > empresa grupo (default) |

### 3.3 Relaciones clave (jerarquía de negocio)

```
empresas_grupo (holding)
  └── personas (trabajadores)
        └── personas_departamentos (% tiempo por depto)
        └── condiciones (histórico laboral)
        └── asignaciones (en qué trabaja)
  └── departamentos
  └── catalogo_servicios
  └── cuotas_planificacion (tarifas €/h)
  └── horas_trabajables (capacidad mensual)

empresas (clientes)
  └── contactos_empresas
  └── proyectos
        └── proyectos_departamentos
        └── ordenes_trabajo (OT)
              └── ordenes_trabajo_personas (preselección)
              └── asignaciones
                    └── cuota_planificacion (tarifa congelada)
```

### 3.4 Tipos de proyecto

| Tipo | Significado | Efecto en métricas |
|---|---|---|
| **Facturable** | Se cobra al cliente | Genera ingresos. Aparece en KPIs de facturación |
| **Externo** | Para terceros pero sin cobro | No genera ingresos. Cuenta como horas asignadas |
| **Interno** | Proyecto interno del holding | No genera ingresos. Cuenta como horas asignadas |

### 3.5 Tipos de partida

| Tipo | Significado |
|---|---|
| **Recurrente** | Fee mensual. `ppto_estimado` = importe mensual |
| **Puntual** | Proyecto cerrado. `ppto_estimado` = importe total |

### 3.6 Estados de OT (workflow)

```
Propuesto → Planificado → Realizado → Confirmado → Facturado
```

- **Propuesto**: OT creada, sin planificar.
- **Planificado**: Horas y personas asignadas.
- **Realizado**: Trabajo ejecutado.
- **Confirmado**: Validado por el aprobador.
- **Facturado**: Incluido en factura al cliente.

### 3.7 Estados de proyecto

```
Propuesta → Confirmado → Activo → Pausado → Finalizado → Cancelado
```

### 3.8 Estados de empresa (CRM)

```
Conocido → Prospecto → Cliente → Baja
```

Con subestados condicionales:
- Si Conocido: tipo_conocido (Branding, Inbound, Outbound, Eventos propios/externos, Cercanos)
- Si Prospecto: estado_prospecto (Prospección, Propuesta, Negociación, Activación)
- Si Cliente: tipo_cliente (Consultoria, Servicio, Solucion)

---

## 4. Cálculos de negocio implementados

### 4.1 Cálculos por asignación (no almacenados, calculados en queries)

| Métrica | Fórmula |
|---|---|
| Ingresos asignados | `OT.partida_prevista × asignacion.porcentaje_ppto_tm / 100` |
| Ingresos reales | `OT.partida_real × asignacion.porcentaje_ppto_tm / 100` |
| Horas a dedicar | `ingresos_asignados / cuota_planificacion.precio_hora` |
| Utilización persona | `sum(horas_asignadas) / horas_trabajables` |

### 4.2 KPIs del módulo de informes (Datos en Foco)

| KPI | Cálculo |
|---|---|
| Ingresos reales | Suma de `partida_real × %` de todas las asignaciones en rango |
| Ingresos previstos | Suma de `partida_prevista × %` |
| % Realización | `ingresos_reales / ingresos_previstos × 100` |
| Horas asignadas | Suma de horas calculadas desde asignaciones |
| €/hora efectivo | `mejor_ingreso / horas_asignadas` (usa real si existe, si no previsto) |
| HHI (concentración) | Índice Herfindahl: suma de cuadrados de % de ingresos por cliente. <1500=diversificado, >2500=concentrado |
| % Carga | `horas_asignadas / horas_trabajables × 100` |
| Horas trabajables | Resueltas con prioridad: persona > departamento > empresa grupo |

### 4.3 Vistas de datos implementadas

**Datos en Foco** — Vista analítica por rango de fechas con:
- KPIs con delta vs periodo anterior equivalente
- Donut de concentración de clientes
- Top/Bottom 5 clientes por €/hora
- Barras de carga por departamento
- Tabla de informe detallado con columnas personalizables
- Dos tabs: por Cliente y por Departamento

**Datos en Tiempo** — Vista similar pero orientada a evolución temporal (mes a mes).

**Reportes** — Tabla pivot jerárquica configurable:
- Dimensiones de fila: Cliente, Proyecto, Persona, Departamento, Empresa Grupo
- Dimensiones de columna: Año, Trimestre, Mes
- Métricas: Ingresos Real/Previsto, Horas Plan/Real, % Realización, €/hora, Nº OTs
- 6 plantillas predefinidas
- Exportación CSV
- Vista de variación (delta mes a mes)

### 4.4 Urgencia de OTs (calculada automáticamente)

Para OTs en estado "Planificado", se calcula urgencia según días transcurridos del mes:
- < 7 días: sin urgencia
- 7-13 días: baja (ámbar)
- 14-20 días: media (naranja)
- ≥ 21 días: alta (rojo)
- Mes pasado sin confirmar: siempre alta

---

## 5. Páginas de la aplicación y funcionalidades

### 5.1 Navegación (sidebar)

El sidebar tiene **control de acceso por rol**:
- **Acceso completo** (Fundador, Administrador, Socio, Director, Coordinador, Responsable): ven todas las secciones.
- **Acceso limitado** (Miembro, Intern, Externo, Implant): solo ven Dashboard Personal.

Secciones del sidebar:

```
GESTIÓN
  ├── Proyectos
  └── Planificador

MANDOS
  ├── Dashboard Personal
  ├── Cargas de trabajo
  ├── Datos en Foco
  ├── Datos en Tiempo
  └── Reportes

CRM
  ├── Personas
  ├── Empresas (Clientes / Prospectos)
  └── Contactos

ADMIN
  ├── Empresas Grupo
  ├── Órdenes de trabajo
  └── Asignaciones

CONFIG
  ├── Talento: Ciudades, Divisiones, Oficinas, Puestos, Rangos
  ├── Operaciones: Catálogo Servicios, Cuotas planificación, Departamentos, Horas Trabajables
  └── App: Usuarios, Roles Sistema
```

### 5.2 Dashboard principal (`/`)

- 6 KPI cards: Empresas Grupo, Personas activas, Clientes, Proyectos activos, Ingresos previstos, Horas asignadas.
- Panel de Proyectos Activos + Resumen rápido.
- Solo lectura.

### 5.3 Proyectos (`/proyectos`)

- **Vista lista y kanban** (switchable).
- **Filtros**: estado (pills), departamentos (multi-select), búsqueda por título.
- **Ordenación**: título, cliente, presupuesto, estado, fecha.
- **KPIs**: total, activos, archivados, eliminados.
- **CRUD completo**: crear, editar, archivar/desarchivar, eliminar (soft delete con cascada a OTs y asignaciones).
- **Detalle de proyecto** (`/proyectos/[id]`): metadata, OTs asociadas, asignaciones, contactos del cliente.
- **Generación de OTs**: desde el detalle se pueden generar OTs para un mes, clonando de un mes de referencia.
- **Restricción**: solo Director o superior puede eliminar proyectos con OTs facturadas.

### 5.4 Planificador (`/planificador`)

- **Vista de grid mensual** con proyectos agrupados jerárquicamente.
- **Edición inline**: porcentaje de presupuesto, partida prevista, partida real por OT.
- **Asignación de personas**: inline con cuota y % de presupuesto.
- **Generación de OTs**: para combinaciones proyecto×mes.
- **Indicadores de carga**: colores por % de disponibilidad (rojo >110%, verde 80-100%, ámbar 75-90%, naranja <50%).
- **Guardado en bloque**: todas las ediciones de una OT se guardan juntas.

### 5.5 Dashboard Personal (`/dashboard-personal`)

- Vista mensual de las asignaciones del usuario logueado.
- Para cada asignación: Cliente, Proyecto, Servicio, Horas, %.
- KPIs: Horas asignadas, Horas disponibles, Proyectos activos, Ingresos.
- **Es la única página visible para roles limitados** (Miembro, Intern, Externo, Implant).

### 5.6 Cargas de Trabajo (`/cargas-trabajo`)

- **Análisis mensual por persona**: barra de carga (horas asignadas / horas disponibles).
- **Expandible**: detalle de proyectos por persona con horas y %.
- **KPIs**: Total personas, Sobrecargadas, En límite, Disponibles.
- **Filtros**: mes, empresa grupo, departamento, búsqueda.
- **Colores de carga**: rojo (>110%), verde (80-100%), ámbar (75-90%), naranja (<75%).
- Solo lectura.

### 5.7 Datos en Foco (`/datos/foco`)

- **Dashboard analítico** con selector de rango de fechas.
- **KPIs con delta** vs periodo anterior equivalente.
- **Tabs**: por Cliente y por Departamento.
- **Gráficos**: donut de concentración, barras de carga por departamento.
- **Top/Bottom 5** clientes por €/hora.
- **Tabla detallada** con columnas personalizables.
- **Filtros**: empresa grupo, departamentos, estados OT, tipos proyecto, rango de fechas.

### 5.8 Datos en Tiempo (`/datos/tiempo`)

- Similar a Datos en Foco pero orientado a evolución temporal.
- Desglose mes a mes y trimestre a trimestre.
- Análisis de tendencias.

### 5.9 Reportes (`/reportes`)

- **Tabla pivot jerárquica** con drill-down expandible.
- **6 plantillas predefinidas**:
  1. Ingresos por cliente × mes
  2. Cliente > proyecto × trimestre
  3. Horas por persona × mes
  4. Depto > persona
  5. Ingresos por proyecto
  6. Empresa grupo × año
- **Personalizable**: filas, columnas y métricas configurables.
- **Filtros**: mes rango, empresa grupo, tipo proyecto, estado OT, departamento, cliente.
- **Exportación CSV**.
- **Vista variación**: delta mes a mes.

### 5.10 Personas (`/personas`)

- **Lista con filtros**: empresa grupo, división, puesto, rango, departamento, estado (activo/archivado).
- **KPIs**: total, activos, archivados.
- **CRUD completo**: crear, editar, archivar, restaurar, eliminar.
- **Asignación de departamentos** con % de tiempo (multi-departamento).
- **Detalle** (`/personas/[id]`): perfil completo, condiciones laborales, ausencias, asignaciones, proyectos.
- **Campos**: nombre, apellidos, DNI, empresa grupo, rol, división, puesto, rango, ciudad, oficina, fecha incorporación/baja, emails, teléfono, modalidad trabajo, LinkedIn, foto, fecha nacimiento, nivel inglés, skills.

### 5.11 Empresas (`/empresas`)

- **Lista con filtro por estado** (Clientes, Prospectos, Conocidos, Bajas).
- **KPIs**: clientes, prospectos, bajas.
- **CRUD completo** con campos condicionales según estado.
- **Detalle** (`/empresas/[id]`): metadata, contactos, proyectos asociados, OTs, asignaciones.
- **Detección de CIF duplicado**.

### 5.12 Contactos (`/contactos`)

- **Lista** con filtro por empresa y búsqueda.
- **KPIs**: total, activos, decisores.
- **CRUD completo**: vinculados a una empresa.
- **Campos**: nombre, apellidos, empresa, cargo, email, teléfono, es_decisor, es_contacto_principal, rol_influencia (Champion, Decision Maker, Economic Buyer, Influencer, Blocker).

### 5.13 Órdenes de Trabajo (`/ordenes-trabajo`)

- **Lista mensual** con filtros: mes, estado, departamento, servicio, tipo partida.
- **CRUD completo** + cambio de estado (workflow).
- **Generación bulk** desde proyectos (clonar OTs de un mes de referencia).
- **Confirmación bulk** de múltiples OTs.
- **Indicador de urgencia** (animado) para OTs sin confirmar.

### 5.14 Asignaciones (`/asignaciones`)

- **Lista** con filtros: mes, servicio, búsqueda.
- **KPIs**: total asignaciones, ingresos totales, horas totales.
- **CRUD completo** con validación de que la suma de % por OT no supere 100%.
- **Campos**: orden de trabajo, persona, % presupuesto, cuota planificación, horas reales.

### 5.15 Páginas de configuración

Todas siguen el mismo patrón: lista + CRUD en modal lateral (Sheet).

| Página | Tabla | Campos principales |
|---|---|---|
| Empresas Grupo | `empresas_grupo` | Nombre, código, CIF, nombre legal |
| Ciudades | `ciudades` | Nombre |
| Divisiones | `divisiones` | Nombre, descripción |
| Oficinas | `oficinas` | Nombre |
| Puestos | `puestos` | Nombre, código, descripción, empresa_grupo |
| Rangos | `rangos_internos` | Nombre, código, descripción, empresa_grupo |
| Catálogo Servicios | `catalogo_servicios` | Nombre, código, descripción, empresa_grupo |
| Cuotas Planificación | `cuotas_planificacion` | Nombre, precio/hora, empresa_grupo, validez |
| Departamentos | `departamentos` | Nombre, código, descripción, empresa_grupo |
| Horas Trabajables | `horas_trabajables` | Mes, horas, empresa_grupo, departamento (opt), persona (opt) |
| Roles Sistema | `roles` | Nombre, descripción |
| Usuarios | — | Invitar, desactivar, reactivar, reset password, cambiar rol |

---

## 6. Stack técnico

| Capa | Tecnología | Versión |
|---|---|---|
| Framework | Next.js (App Router) | 16.2.1 |
| UI Library | React | 19 |
| Lenguaje | TypeScript (strict) | — |
| Base de datos | Supabase (PostgreSQL) | — |
| Auth | Supabase Auth | @supabase/ssr ^0.9 |
| Estilos | Tailwind CSS | v4 (config en CSS, no tailwind.config.js) |
| Componentes UI | shadcn/ui | Último |
| Formularios | react-hook-form + zod | — |
| Deploy | Vercel | — |

### Componentes shadcn/ui instalados

button, badge, input, label, textarea, select, searchable-select, table, scroll-area, sheet, separator.

### Patrón arquitectónico

```
app/(dashboard)/[pagina]/
  ├── page.tsx              ← Server Component: fetch de datos en paralelo
  ├── [pagina]-client.tsx   ← Client Component: filtros, sort, búsqueda, UI
  ├── [pagina]-form-sheet.tsx ← Client Component: formulario en Sheet lateral
  └── actions.ts            ← Server Actions: CRUD con validación zod
```

- **Server Components** hacen las queries y pasan datos como props.
- **Client Components** manejan estado de UI (filtros, sort, modales).
- **Server Actions** validan con zod y ejecutan CRUD en Supabase.
- **URL params** para filtros persistentes (no useState para filtros de negocio).
- **revalidatePath()** después de cada mutación para refrescar datos.

### Componentes compartidos reutilizables

| Componente | Uso |
|---|---|
| `KpiCard` | Cards de métricas en todas las páginas (23 usos) |
| `SearchBar` | Input de búsqueda (8 páginas) |
| `FilterPills` | Filtros single-select tipo pills (7 páginas) |
| `MultiSelectFilter` | Filtros multi-select con checkboxes (3 páginas) |
| `MonthNavigator` | Selector de mes con navegación (10 páginas) |
| `DateRangeSelector` | Selector de rango de fechas con presets (2 páginas) |
| `StatusBadge` | Badge de estado con colores (6 páginas) |
| `UrgenciaIndicador` | Punto animado de urgencia en OTs |
| `SortableHeader` | Cabecera de tabla con sort (6 páginas) |
| `SortControl` | Dropdown de ordenación (6 páginas) |
| `NumberInput` | Input numérico con auto-select (2 páginas) |
| `ClientePill` | Badge de color por cliente (3 páginas) |
| `DeptPill` | Badge de color por departamento (2 páginas) |
| `ServicioPill` | Badge de color por servicio (6 páginas) |
| `CambiarEstadoOT` | Dropdown para cambiar estado de OT (3 páginas) |
| `CambiarEstadoProyecto` | Dropdown para cambiar estado de proyecto (2 páginas) |

---

## 7. Autenticación y control de acceso

- **Supabase Auth** con email/password.
- **Vinculación persona ↔ usuario**: al loguearse, se busca la persona por `auth_user_id` o por `email_corporativo`. Si coincide email, se vincula automáticamente.
- **Roles**: el campo `rol_id` en `personas` determina qué ve cada usuario en el sidebar.
- **Acceso limitado**: roles Miembro, Intern, Externo, Implant solo ven Dashboard Personal.
- **Acceso completo**: Fundador, Administrador, Socio, Director, Coordinador, Responsable ven todo.
- **Restricciones especiales**: solo Director o superior puede eliminar proyectos con OTs facturadas.
- **RLS activado** en Supabase pero las políticas específicas están en evolución.
- **Gestión de usuarios**: invitación, desactivación, reactivación, reset de password, cambio de rol.

---

## 8. Flujo de datos de horas (time tracking)

```
Clockify (registro real) → Google Sheets (transformación) → Company OS (visualización/planificación)
```

Company OS **no registra horas directamente**. Las horas planificadas se calculan desde:
```
horas = (partida × porcentaje_asignación) / cuota.precio_hora
```

Las `horas_reales` son un campo opcional en asignaciones para override manual.

---

## 9. Convenciones de código

### Naming
- **Base de datos**: snake_case en español (`empresa_grupo_id`, `tarifa_hora`)
- **TypeScript**: camelCase en español (`empresaGrupoId`, `tarifaHora`)
- **Tablas**: snake_case en español (`ordenes_trabajo`, `cuotas_planificacion`)

### Interfaz
- **Todo en español**: labels, mensajes de error, estados vacíos, botones.
- **Paleta**: fondo blanco, acento verde menta (#00C896), estados con colores consistentes (verde=OK, naranja=pendiente, rojo=error, morado=recurrente, azul=en curso).
- **Cards**: blancas, shadow-sm, rounded-xl, borde superior de color.
- **Badges**: rounded-full, fondo suave del color de estado, texto al 100%.
- **Tablas**: cabecera en mayúsculas gris, filas con línea sutil, números alineados a la derecha.

### Borrados
- Tablas financieras: **soft delete** con `deleted_at`.
- Proyectos: soft delete con cascada a OTs y asignaciones.
- Tablas de config: borrado físico (con restricción si hay dependencias).

---

## 10. Lo que falta por construir (backlog conocido)

### Deuda técnica y funcionalidades pendientes

| Área | Estado | Detalle |
|---|---|---|
| **Coste/hora por persona** | ❌ Pendiente | `condiciones.coste_hora_calculado` existe pero sin trigger ni cálculo. Bloquea el módulo de márgenes |
| **Márgenes por cliente/proyecto/persona** | ❌ Pendiente | Depende de coste/hora. Es una métrica clave de negocio |
| **Datos seed completos** | ⚠️ Parcial | Solo DME tiene datos cargados. Faltan DMM, IMG, KAU, DRR |
| **RLS policies** | ⚠️ Básicas | Activado pero políticas específicas por rol en evolución |
| **Importación desde Clockify/Sheets** | ❌ Pendiente | Hoy es manual. Se necesita automatizar |
| **Facturación** | ❌ No previsto aún | No genera facturas ni conecta con contabilidad |
| **Notificaciones** | ❌ No previsto | No hay alertas automáticas |
| **Responsive** | ⚠️ Desktop-first | Prioridad desktop (herramienta interna). No debe romperse en tablet |
| **Tests** | ❌ No hay | Sin tests unitarios ni e2e |
| **Dedicaciones (horas reales detalladas)** | ❌ No implementado | La tabla no existe. Se contempla en modelo futuro |

### Datos que se recogen pero no se explotan aún

- `condiciones`: salario, tipo contrato, jornada, horas/semana, coste SS → sin cálculo de coste/hora ni reporting.
- `ausencias`: se registran pero no descuentan de horas trabajables.
- `evolucion`: evaluaciones registradas sin vista de reporting.
- `historial_estado_empresa` / `historial_estado_proyecto`: se registran pero sin vista de timeline.
- `contactos_empresas.rol_influencia`: se recoge pero no se visualiza en ningún funnel.

---

## 11. Glosario de términos clave

| Término | Significado en Company OS |
|---|---|
| **Empresa Grupo (EG)** | Cada empresa del holding (DME, DMM, etc.) |
| **Empresa** | Empresa externa (cliente, prospecto, etc.) |
| **Proyecto** | Encargo de un cliente a una empresa del grupo |
| **OT (Orden de Trabajo)** | Unidad mínima: 1 servicio × 1 departamento × 1 mes × 1 proyecto |
| **Asignación** | Persona asignada a una OT con un % del presupuesto y una tarifa |
| **Cuota de Planificación** | Tarifa €/hora por categoría (para calcular horas desde presupuesto) |
| **Rango Interno** | Nivel de seniority en RRHH (NO es la cuota de planificación) |
| **Partida Prevista** | Importe presupuestado para una OT |
| **Partida Real** | Importe real facturado/cobrado de una OT (dato primario de negocio) |
| **Horas Trabajables** | Capacidad mensual de una persona/depto/empresa |
| **HHI** | Índice de concentración de ingresos por cliente (0-10000) |
| **Condiciones** | Snapshot histórico de las condiciones laborales de una persona |

---

## 12. Reglas de negocio críticas para no romper nada

1. **Partida real es primaria**: `partida_real` (facturación) es el dato de negocio principal. `partida_prevista` es solo para planificación de horas.

2. **Cuotas ≠ Rangos**: `cuotas_planificacion` (tarifas €/h para planificación) y `rangos_internos` (niveles RRHH) son tablas completamente independientes aunque los nombres se parezcan.

3. **Suma de % por OT ≤ 100%**: Las asignaciones de una misma OT no pueden sumar más de 100% del presupuesto.

4. **Horas trabajables con prioridad**: persona override > departamento override > empresa grupo default.

5. **Roles controlan acceso**: el `rol_id` en personas determina qué ve el usuario en la app.

6. **Soft delete en cascada**: eliminar un proyecto hace soft delete de sus OTs y asignaciones.

7. **OTs facturadas protegidas**: solo Director o superior puede eliminar proyectos con OTs en estado "Facturado".

8. **3 tipos de proyecto**: Facturable (se cobra), Externo (a terceros sin cobrar), Interno (sin cobro). Solo Facturable genera ingresos en KPIs.

9. **Persona puede estar en varios departamentos**: con porcentaje_tiempo que debe sumar 100%.

10. **Condiciones es histórico**: no se editan, se cierran y se abren nuevas. Cada fila = un periodo.
