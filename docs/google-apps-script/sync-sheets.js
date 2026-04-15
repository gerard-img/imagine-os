// ============================================================
// Google Apps Script — Sync Imagine OS ↔ Google Sheets
//
// Configuración:
//   1. En Google Sheets: Extensiones → Apps Script
//   2. Pegar este código
//   3. Ir a Configuración del proyecto (engranaje izquierda)
//      → Propiedades del script → Añadir:
//        SUPABASE_URL  = https://mwaojuyjszwzxtixoewo.supabase.co
//        SUPABASE_KEY  = (tu Service Role Key)
//        APP_URL       = https://imagine-os-theta.vercel.app
//   4. Guardar y volver a la hoja
//   5. Recargar la hoja — aparecerá menú "Imagine OS"
// ============================================================

// --- Configuración ---

function getConfig() {
  var props = PropertiesService.getScriptProperties();
  return {
    supabaseUrl: props.getProperty('SUPABASE_URL'),
    supabaseKey: props.getProperty('SUPABASE_KEY'),
    appUrl: props.getProperty('APP_URL'),
  };
}

// --- Menú personalizado ---

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('🟢 Imagine OS')
    .addItem('⬇️ Descargar TODO', 'descargarTodo')
    .addSeparator()
    .addItem('⬇️ Personas', 'descargarPersonas')
    .addItem('⬇️ Empresas', 'descargarEmpresas')
    .addItem('⬇️ Proyectos', 'descargarProyectos')
    .addItem('⬇️ Órdenes de Trabajo', 'descargarOrdenesTrabajo')
    .addItem('⬇️ Asignaciones', 'descargarAsignaciones')
    .addItem('⬇️ Condiciones', 'descargarCondiciones')
    .addItem('⬇️ Contactos', 'descargarContactos')
    .addSeparator()
    .addItem('⬆️ Subir Personas', 'subirPersonas')
    .addItem('⬆️ Subir Empresas', 'subirEmpresas')
    .addItem('⬆️ Subir Proyectos', 'subirProyectos')
    .addItem('⬆️ Subir Órdenes de Trabajo', 'subirOrdenesTrabajo')
    .addItem('⬆️ Subir Asignaciones', 'subirAsignaciones')
    .addSeparator()
    .addSubMenu(
      SpreadsheetApp.getUi()
        .createMenu('📋 Lookups')
        .addItem('Empresas Grupo', 'descargarEmpresasGrupo')
        .addItem('Departamentos', 'descargarDepartamentos')
        .addItem('Catálogo Servicios', 'descargarCatalogoServicios')
        .addItem('Rangos Internos', 'descargarRangosInternos')
        .addItem('Puestos', 'descargarPuestos')
        .addItem('Cuotas Planificación', 'descargarCuotasPlanificacion')
        .addItem('Divisiones', 'descargarDivisiones')
        .addItem('Roles', 'descargarRoles')
        .addItem('Ciudades', 'descargarCiudades')
        .addItem('Oficinas', 'descargarOficinas')
    )
    .addToUi();
}

// ============================================================
// DESCARGAS — con nombres legibles en vez de UUIDs
// ============================================================

function descargarPersonas() {
  descargarConJoins(
    'personas',
    'Personas',
    'id,persona,dni,nombre,apellido_primero,apellido_segundo,empresas_grupo(codigo),ciudades(nombre),oficinas(nombre),rangos_internos(nombre),puestos(nombre),divisiones(nombre),roles(nombre),fecha_incorporacion,fecha_baja,activo,rango_es_interino,email_corporativo,email_personal,telefono,modalidad_trabajo,nivel_ingles',
    ['id','persona','dni','nombre','apellido_primero','apellido_segundo','empresa_grupo','ciudad','oficina','rango','puesto','division','rol','fecha_incorporacion','fecha_baja','activo','rango_es_interino','email_corporativo','email_personal','telefono','modalidad_trabajo','nivel_ingles'],
    {
      'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' },
      'ciudades':       { col: 'ciudad',        field: 'nombre' },
      'oficinas':       { col: 'oficina',        field: 'nombre' },
      'rangos_internos':{ col: 'rango',          field: 'nombre' },
      'puestos':        { col: 'puesto',         field: 'nombre' },
      'divisiones':     { col: 'division',       field: 'nombre' },
      'roles':          { col: 'rol',            field: 'nombre' },
    }
  );
}

function descargarEmpresas() {
  descargarConJoins(
    'empresas',
    'Empresas',
    'id,nombre_legal,cif,nombre_interno,estado,tipo,tipo_cliente,tipo_conocido,estado_prospecto,sector,web,calle,codigo_postal,ciudad,provincia,pais,telefono,clasificacion_cuenta,fuente_captacion,responsable:personas!responsable_cuenta_id(persona),notas',
    ['id','nombre_legal','cif','nombre_interno','estado','tipo','tipo_cliente','tipo_conocido','estado_prospecto','sector','web','calle','codigo_postal','ciudad','provincia','pais','telefono','clasificacion_cuenta','fuente_captacion','responsable_cuenta','notas'],
    {
      'responsable': { col: 'responsable_cuenta', field: 'persona' },
    }
  );
}

function descargarProyectos() {
  descargarConJoins(
    'proyectos',
    'Proyectos',
    'id,cliente:empresas(nombre_interno),empresas_grupo(codigo),titulo,descripcion,tipo_proyecto,tipo_partida,estado,responsable:personas!responsable_id(persona),ppto_estimado,fecha_activacion,fecha_cierre,tipo_facturacion,probabilidad_cierre,valor_estimado_total,notas',
    ['id','empresa','empresa_grupo','titulo','descripcion','tipo_proyecto','tipo_partida','estado','responsable','ppto_estimado','fecha_activacion','fecha_cierre','tipo_facturacion','probabilidad_cierre','valor_estimado_total','notas'],
    {
      'cliente':        { col: 'empresa',        field: 'nombre_interno' },
      'empresas_grupo': { col: 'empresa_grupo',  field: 'codigo' },
      'responsable':    { col: 'responsable',    field: 'persona' },
    }
  );
}

function descargarOrdenesTrabajo() {
  descargarConJoins(
    'ordenes_trabajo',
    'Órdenes Trabajo',
    'id,proyectos(titulo),catalogo_servicios(codigo),departamentos(nombre),aprobador:personas!aprobador_id(persona),mes_anio,porcentaje_ppto_mes,partida_prevista,partida_real,estado,fecha_inicio,fecha_fin,titulo,horas_planificadas,horas_reales,notas',
    ['id','proyecto','servicio','departamento','aprobador','mes_anio','porcentaje_ppto_mes','partida_prevista','partida_real','estado','fecha_inicio','fecha_fin','titulo','horas_planificadas','horas_reales','notas'],
    {
      'proyectos':            { col: 'proyecto',     field: 'titulo' },
      'catalogo_servicios':   { col: 'servicio',     field: 'codigo' },
      'departamentos':        { col: 'departamento', field: 'nombre' },
      'aprobador':            { col: 'aprobador',    field: 'persona' },
    }
  );
}

function descargarAsignaciones() {
  descargarConJoins(
    'asignaciones',
    'Asignaciones',
    'id,orden_trabajo_id,personas(persona),cuotas_planificacion(nombre),porcentaje_ppto_tm,horas_reales,notas',
    ['id','orden_trabajo_id','persona','cuota','porcentaje_ppto_tm','horas_reales','notas'],
    {
      'personas':              { col: 'persona', field: 'persona' },
      'cuotas_planificacion':  { col: 'cuota',   field: 'nombre' },
    }
  );
}

function descargarCondiciones() {
  descargarConJoins(
    'condiciones',
    'Condiciones',
    'id,personas(persona),fecha_inicio,fecha_fin,empresas_grupo(codigo),departamentos(nombre),rangos_internos(nombre),puestos(nombre),divisiones(nombre),roles(nombre),salario_bruto_anual,tipo_contrato,jornada,horas_semana,coste_seguridad_social,salario_variable_anual,porcentaje_variable,dias_vacaciones,modalidad_trabajo,notas',
    ['id','persona','fecha_inicio','fecha_fin','empresa_grupo','departamento','rango','puesto','division','rol','salario_bruto_anual','tipo_contrato','jornada','horas_semana','coste_seguridad_social','salario_variable_anual','porcentaje_variable','dias_vacaciones','modalidad_trabajo','notas'],
    {
      'personas':       { col: 'persona',       field: 'persona' },
      'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' },
      'departamentos':  { col: 'departamento',  field: 'nombre' },
      'rangos_internos':{ col: 'rango',         field: 'nombre' },
      'puestos':        { col: 'puesto',        field: 'nombre' },
      'divisiones':     { col: 'division',       field: 'nombre' },
      'roles':          { col: 'rol',            field: 'nombre' },
    }
  );
}

function descargarContactos() {
  descargarConJoins(
    'contactos_empresas',
    'Contactos',
    'id,empresas(nombre_interno),nombre,apellidos,email,telefono_directo,movil,cargo,departamento,es_decisor,es_contacto_principal,activo,linkedin_url,rol_influencia,notas',
    ['id','empresa','nombre','apellidos','email','telefono_directo','movil','cargo','departamento','es_decisor','es_contacto_principal','activo','linkedin_url','rol_influencia','notas'],
    {
      'empresas': { col: 'empresa', field: 'nombre_interno' },
    }
  );
}

// --- Lookups (sin joins, datos simples) ---

function descargarEmpresasGrupo() {
  descargarTablaSimple('empresas_grupo', 'LK Empresas Grupo', 'id,nombre,codigo,cif');
}
function descargarDepartamentos() {
  descargarConJoins(
    'departamentos',
    'LK Departamentos',
    'id,empresas_grupo(codigo),nombre,codigo',
    ['id','empresa_grupo','nombre','codigo'],
    { 'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' } }
  );
}
function descargarCatalogoServicios() {
  descargarConJoins(
    'catalogo_servicios',
    'LK Servicios',
    'id,empresas_grupo(codigo),nombre,codigo',
    ['id','empresa_grupo','nombre','codigo'],
    { 'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' } }
  );
}
function descargarRangosInternos() {
  descargarConJoins(
    'rangos_internos',
    'LK Rangos',
    'id,empresas_grupo(codigo),nombre,codigo,orden',
    ['id','empresa_grupo','nombre','codigo','orden'],
    { 'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' } }
  );
}
function descargarPuestos() {
  descargarConJoins(
    'puestos',
    'LK Puestos',
    'id,empresas_grupo(codigo),nombre,codigo',
    ['id','empresa_grupo','nombre','codigo'],
    { 'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' } }
  );
}
function descargarCuotasPlanificacion() {
  descargarConJoins(
    'cuotas_planificacion',
    'LK Cuotas',
    'id,empresas_grupo(codigo),nombre,precio_hora,inicio_validez,fin_validez',
    ['id','empresa_grupo','nombre','precio_hora','inicio_validez','fin_validez'],
    { 'empresas_grupo': { col: 'empresa_grupo', field: 'codigo' } }
  );
}
function descargarDivisiones() {
  descargarTablaSimple('divisiones', 'LK Divisiones', 'id,nombre,descripcion');
}
function descargarRoles() {
  descargarTablaSimple('roles', 'LK Roles', 'id,nombre,nivel_acceso');
}
function descargarCiudades() {
  descargarTablaSimple('ciudades', 'LK Ciudades', 'id,nombre,pais');
}
function descargarOficinas() {
  descargarTablaSimple('oficinas', 'LK Oficinas', 'id,nombre');
}

// --- Descargar TODO ---

function descargarTodo() {
  var ui = SpreadsheetApp.getUi();

  descargarEmpresasGrupo();
  descargarDivisiones();
  descargarRoles();
  descargarCiudades();
  descargarOficinas();
  descargarDepartamentos();
  descargarRangosInternos();
  descargarPuestos();
  descargarCatalogoServicios();
  descargarCuotasPlanificacion();
  descargarPersonas();
  descargarEmpresas();
  descargarProyectos();
  descargarOrdenesTrabajo();
  descargarAsignaciones();
  descargarCondiciones();
  descargarContactos();

  ui.alert('✅ Descarga completada', 'Todas las pestañas se han actualizado.', ui.ButtonSet.OK);
}


// ============================================================
// SUBIDAS — envía datos de Sheets a Imagine OS
// ============================================================

function subirPersonas()       { subirTabla('Personas', 'personas'); }
function subirEmpresas()       { subirTabla('Empresas', 'empresas'); }
function subirProyectos()      { subirTabla('Proyectos', 'proyectos'); }
function subirOrdenesTrabajo() { subirTabla('Órdenes Trabajo', 'ordenes_trabajo'); }
function subirAsignaciones()   { subirTabla('Asignaciones', 'asignaciones'); }


// ============================================================
// MOTOR DE DESCARGA
// ============================================================

/**
 * Descarga una tabla con joins de Supabase y muestra nombres legibles.
 */
function descargarConJoins(tabla, nombrePestana, selectQuery, columnas, joins) {
  var config = getConfig();
  if (!config.supabaseUrl || !config.supabaseKey) {
    SpreadsheetApp.getUi().alert('❌ Falta configurar SUPABASE_URL o SUPABASE_KEY.');
    return;
  }

  var url = config.supabaseUrl + '/rest/v1/' + tabla
    + '?select=' + encodeURIComponent(selectQuery)
    + '&order=created_at.desc&limit=5000';

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'apikey': config.supabaseKey,
      'Authorization': 'Bearer ' + config.supabaseKey,
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    SpreadsheetApp.getUi().alert('❌ Error al descargar ' + tabla + ':\n' + response.getContentText().substring(0, 300));
    return;
  }

  var data = JSON.parse(response.getContentText());
  var sheet = obtenerOCrearPestana(nombrePestana);
  sheet.clearContents();

  // Cabeceras
  sheet.getRange(1, 1, 1, columnas.length).setValues([columnas]);
  sheet.getRange(1, 1, 1, columnas.length).setFontWeight('bold').setBackground('#f3f4f6');

  if (data.length === 0) return;

  // Construir mapa inverso: columna del sheet → cómo obtenerla del JSON
  var colMap = {};
  for (var joinKey in joins) {
    colMap[joins[joinKey].col] = { jsonKey: joinKey, field: joins[joinKey].field };
  }

  // Escribir datos
  var rows = data.map(function(row) {
    return columnas.map(function(col) {
      // ¿Es un campo con join?
      if (colMap[col]) {
        var nested = row[colMap[col].jsonKey];
        if (nested && typeof nested === 'object') {
          return nested[colMap[col].field] || '';
        }
        return '';
      }
      // Campo directo
      var val = row[col];
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return val.join(', ');
      return val;
    });
  });

  sheet.getRange(2, 1, rows.length, columnas.length).setValues(rows);

  for (var i = 1; i <= columnas.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

/**
 * Descarga una tabla simple (lookups, sin joins).
 */
function descargarTablaSimple(tabla, nombrePestana, columnas) {
  var config = getConfig();
  if (!config.supabaseUrl || !config.supabaseKey) {
    SpreadsheetApp.getUi().alert('❌ Falta configurar SUPABASE_URL o SUPABASE_KEY.');
    return;
  }

  var url = config.supabaseUrl + '/rest/v1/' + tabla
    + '?select=' + encodeURIComponent(columnas)
    + '&order=created_at.desc&limit=5000';

  var response = UrlFetchApp.fetch(url, {
    method: 'get',
    headers: {
      'apikey': config.supabaseKey,
      'Authorization': 'Bearer ' + config.supabaseKey,
    },
    muteHttpExceptions: true,
  });

  if (response.getResponseCode() !== 200) {
    SpreadsheetApp.getUi().alert('❌ Error al descargar ' + tabla + ':\n' + response.getContentText().substring(0, 300));
    return;
  }

  var data = JSON.parse(response.getContentText());
  var headers = columnas.split(',');
  var sheet = obtenerOCrearPestana(nombrePestana);
  sheet.clearContents();

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#f3f4f6');

  if (data.length === 0) return;

  var rows = data.map(function(row) {
    return headers.map(function(col) {
      var val = row[col];
      if (val === null || val === undefined) return '';
      if (Array.isArray(val)) return val.join(', ');
      return val;
    });
  });

  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);

  for (var i = 1; i <= headers.length; i++) {
    sheet.autoResizeColumn(i);
  }
}


// ============================================================
// MOTOR DE SUBIDA
// ============================================================

/**
 * Lee una pestaña y envía los datos al API de Imagine OS.
 * Las filas con id se actualizan, las filas sin id se crean nuevas.
 */
function subirTabla(nombrePestana, tabla) {
  var config = getConfig();
  if (!config.appUrl || !config.supabaseKey) {
    SpreadsheetApp.getUi().alert('❌ Falta configurar APP_URL o SUPABASE_KEY.');
    return;
  }

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombrePestana);
  if (!sheet) {
    SpreadsheetApp.getUi().alert('❌ No se encontró la pestaña "' + nombrePestana + '".');
    return;
  }

  var data = sheet.getDataRange().getValues();
  if (data.length < 2) {
    SpreadsheetApp.getUi().alert('No hay datos para subir.');
    return;
  }

  var headers = data[0];
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var row = data[i];
    var obj = {};
    var hasData = false;

    for (var j = 0; j < headers.length; j++) {
      var val = row[j];
      var header = headers[j];

      // Saltar celdas vacías
      if (val === '' || val === null || val === undefined) continue;

      hasData = true;

      // Convertir Date de Sheets a string ISO (YYYY-MM-DD)
      if (val instanceof Date) {
        var yyyy = val.getFullYear();
        var mm = ('0' + (val.getMonth() + 1)).slice(-2);
        var dd = ('0' + val.getDate()).slice(-2);
        obj[header] = yyyy + '-' + mm + '-' + dd;
        continue;
      }

      obj[header] = val;
    }

    if (hasData) rows.push(obj);
  }

  if (rows.length === 0) {
    SpreadsheetApp.getUi().alert('No hay filas con datos para subir.');
    return;
  }

  // Confirmar
  var ui = SpreadsheetApp.getUi();
  var confirm = ui.alert(
    'Confirmar subida',
    'Se van a enviar ' + rows.length + ' filas de "' + nombrePestana + '" a Imagine OS.\n\n¿Continuar?',
    ui.ButtonSet.YES_NO
  );

  if (confirm !== ui.Button.YES) return;

  // Enviar al API
  var apiUrl = config.appUrl + '/api/import/' + tabla;
  var response = UrlFetchApp.fetch(apiUrl, {
    method: 'post',
    contentType: 'application/json',
    headers: {
      'Authorization': 'Bearer ' + config.supabaseKey,
    },
    payload: JSON.stringify(rows),
    muteHttpExceptions: true,
  });

  var code = response.getResponseCode();
  var text = response.getContentText();

  if (code !== 200) {
    ui.alert('❌ Error del servidor (HTTP ' + code + '):\n' + (text || '(respuesta vacía)').substring(0, 500));
    return;
  }

  var body;
  try {
    body = JSON.parse(text);
  } catch (e) {
    ui.alert('❌ Respuesta inválida del servidor:\n' + (text || '(vacía)').substring(0, 500));
    return;
  }

  // Mostrar resultados
  var msg = '✅ ' + body.ok + ' filas procesadas correctamente.';
  if (body.errores && body.errores.length > 0) {
    msg += '\n\n❌ ' + body.errores.length + ' errores:\n';
    body.errores.forEach(function(err) {
      msg += '  Fila ' + err.fila + ': ' + err.error + '\n';
    });
  }

  ui.alert('Resultado', msg, ui.ButtonSet.OK);
}


// ============================================================
// UTILIDADES
// ============================================================

function obtenerOCrearPestana(nombre) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(nombre);
  if (!sheet) {
    sheet = ss.insertSheet(nombre);
  }
  return sheet;
}
