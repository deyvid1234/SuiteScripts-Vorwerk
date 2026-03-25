/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 * @description Módulo compartido: lógica del reporte de rentabilidad (Suitelet + Map/Reduce de precarga).
 * El Suitelet delgado y el Map/Reduce importan este archivo.
 *
 * --- VERSION ESTABLE 2026-03-11 ---
 * Incluye: facturas/NC, costos por línea (EPA + cuenta 5100), match por cantidad cuando OV tiene varias EPAs
 * (precarga cantidades EPA en Paso 2a, una búsqueda por EPA), comisiones gerentes y Otros, export Excel.
 * Logs EPA filtrables por OV (EPA_LOG_SO_FILTER). Sin SuiteQL; sin record.load para EPA.
 * ---
 * 
 * CONFIGURACIÓN REQUERIDA:
 * 
 * 1. Custom Record Type: "Parámetros de Comisión"
 *    - ID Interno: customrecord_parametros_comision (ajustar según tu configuración)
 *    - Campos requeridos:
 *      * custrecord_margen_minimo (Number/Decimal) - Margen mínimo del rango
 *      * custrecord_margen_maximo (Number/Decimal) - Margen máximo del rango
 *      * custrecord_porcentaje_comision (Percent) - Porcentaje de comisión para ese rango
 * 
 * 2. Ejemplo de registros en el Custom Record:
 *    - Rango 1: Min: 20, Max: 100, Porcentaje: 0.50%
 *    - Rango 2: Min: 15, Max: 20, Porcentaje: 0.47%
 *    - Rango 3: Min: 10, Max: 15, Porcentaje: 0.27%
 *    - Rango 4: Min: 5, Max: 10, Porcentaje: 0.20%
 *    - Rango 5: Min: 0, Max: 5, Porcentaje: 0.12%
 *    - Rango 6: Min: -100, Max: 0, Porcentaje: 0%
 * 
 * NOTA: Si no se configura el Custom Record, el script usará valores por defecto basados
 * en el análisis del Excel proporcionado.
 *
 * 3. Custom Record Type: "Descuento Proveedor" (Nota Crédito Proveedor simulada)
 *    - ID Interno: customrecord_descuento_proveedor (ajustar según tu configuración)
 *    - Uso: Descuento simulado donde el proveedor 'descuenta' solo si se vende a cierto cliente.
 *    - Campos requeridos:
 *      * custrecord_dp_articulo (List/Record - Item, multi-select) - Artículos aplicables
 *      * custrecord_dp_cliente (List/Record - Customer) - Cliente
 *      * custrecord_dp_proveedor (List/Record - Vendor, opcional) - Proveedor; vacío = factor aplica a todos los proveedores
 *      * custrecord_dp_factor (Decimal) - Factor Descuento (ej. 0.05 = 5% sobre el costo)
 *      * custrecord_dp_fecha_inicio (Date) - Fecha Inicio Vigencia
 *      * custrecord_dp_fecha_fin (Date) - Fecha Fin Vigencia
 *    - Lógica: Por cada línea se buscan registros donde Artículo y Cliente coincidan, la fecha de la
 *      factura esté entre Fecha Inicio y Fecha Fin, y además: si el registro tiene proveedor, debe
 *      coincidir con el proveedor de la línea; si el registro deja proveedor vacío, aplica a cualquier
 *      proveedor (misma idea que artículos en compensación Otros). Si hay varios válidos,
 *      gana el de fecha inicio más reciente. Si existe, se aplica
 *      Nota Crédito Proveedor = Tipo de Cambio × Cantidad × Factor Descuento; si no, 0.
 * 
 * 4. Campos Custom en Employee: "Comisiones de Gerentes"
 *    - Ubicación: Registro Employee (Representante de Ventas)
 *    - Campos requeridos (tipo Percent):
 *      * custentity_comision_rosario - Porcentaje de comisión para ROSARIO (ej. 0.18 = 18%)
 *      * custentity_comision_alhely - Porcentaje de comisión para ALHELY
 *      * custentity_comision_gabriela - Porcentaje de comisión para GABRIELA
 *      * custentity_comision_mineria - Porcentaje de comisión para MINERIA
 *      * custentity_comision_agro - Porcentaje de comisión para AGRO
 *      * custentity_comision_prieto - Porcentaje de comisión para PRIETO
 *      * custentity_comision_otros - NO se usa para % Otros; ver punto 5.
 *      * custentity_comision_total - Suma de todos los porcentajes (para validación, debe ser 100%)
 *    - Lógica: Por cada línea del reporte se obtiene el Representante de Ventas (salesrep) y se
 *      leen los porcentajes de comisión de ese Employee. Se calcula: Comisión Gerente = Comisión Total × Porcentaje del Gerente.
 *      Las comisiones se muestran en columnas separadas por cada gerente en el reporte.
 *
 * 5. Custom Record Type: "Compensación Cliente-Artículo" (determina % Otros por línea)
 *    - ID interno: customrecord_compensacion_cliente_articulo (ajustar RECORD_TYPE_OTROS si en tu cuenta es otro, ej. customrecord_comisiones_otros)
 *    - Campos: custrecord_comisionista (Employee), custrecord_cliente (Customer), custrecord_articulo (Item, multi-select),
 *      custrecord_porcentajecomision (Percent), custrecord_fecha_desde, custrecord_fecha_hasta
 *    - Lógica: Por cada línea del reporte se busca un registro donde comisionista = Representante de Ventas, cliente = Cliente de la línea,
 *      el ítem de la línea esté en custrecord_articulo, y la fecha de la transacción esté entre fecha_desde y fecha_hasta.
 *      Se toma custrecord_porcentajecomision como % Otros. El monto Otros = (% Otros / 100) × Ingreso Casa.
 *      Si aplica custrecord_costo_fijo_ton (monto por tonelada): Otros = (cantidad en kg / 1000) × costo fijo por tonelada × tipo de cambio interno
 *      (el costo fijo se guarda/ingresa en USD y el reporte trabaja en "moneda casa").
 *      % Otros participa en Comisión Total y Utilidad después de comisiones de gerencia igual que el resto de gerentes.
 *
 * 6. Map/Reduce de precarga (ReporteRentabilidadPrecacheMR.js)
 *    - Programado (sin parámetros de rango): ~2 años móviles hasta hoy (un map/mes). Sin tope fijo en 2025.
 *    - Lectura de JSON en el Suitelet: intenta meses desde 1/1/2010 hasta hoy para poder fusionar histórico generado a mano.
 *    - Histórico semi-manual: rellenar custscript_reporte_precache_hist_start y _hist_end, ejecutar; puede dejarlos vacíos
 *      después para no reprocesar ese rango al pulsar “Ejecutar” en el deployment (FULL ~2 años).
 *    - Encolado Suitelet con LAST_MONTH tiene prioridad sobre fechas históricas en el mismo deployment (solo último mes).
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/encode', 'N/log', 'N/record', 'N/https', 'N/format', 'N/runtime', 'N/task'],
    function(serverWidget, search, file, encode, log, record, https, format, runtime, task) {
    
        /**
         * Suitelet que solo recibe datos y genera el CSV. Use la misma URL que en el deploy:
         * /app/site/hosting/scriptlet.nl?script=2504&deploy=1
         */
        var EXPORT_SUITELET_SCRIPT_ID = 2504;
        var EXPORT_SUITELET_DEPLOY_ID = 1;

        /** Un archivo por mes (gobierno por map y límite 10 MB): ReporteRentabilidad_precache_AAAA-MM.json */
        var REPORT_PRECACHE_FILE_PREFIX = 'ReporteRentabilidad_precache_';
        /** Archivo monolítico antiguo; solo se usa si existe y no hay trozos por mes. */
        var REPORT_PRECACHE_LEGACY_FILE = 'ReporteRentabilidad_precache.json';
        /**
         * Script ID y deployment ID del Map/Reduce de precarga (enteros o script ids).
         * Rellenar tras crear el script en NetSuite; la ejecución suele ser por programación o MR manual.
         */
        var MR_PRECACHE_SCRIPT_ID = 'customscript_reporte_rentabilidad_mr';
        /**
         * Deployment Manual del MR: usado por submitPrecacheMrTask si se invoca (p. ej. POST con action=refresh_precache).
         * El deployment agendado lo ejecuta la programación de NetSuite sobre ese deploy.
         */
        var MR_PRECACHE_DEPLOY_ID = 'customdeploy_reporte_rentabilidad_map';
        /** Solo referencia (documentación): ID del deployment con programación nocturna; no se usa en task.create del Suitelet. */
        var MR_PRECACHE_DEPLOY_SCHEDULED_ID_REF = 'customdeployreporte_rentabilidad_map';
        /**
         * Opcional: deployment del MR solo para “último mes” (sin parámetro LAST_MONTH).
         * Si vacío, submitPrecacheMrTask usa MR_PRECACHE_DEPLOY_ID + custscript_reporte_precache_scope.
         */
        var MR_PRECACHE_DEPLOY_LAST_MONTH_ID = '';
        /** Parámetro: FULL (defecto) | LAST_MONTH (Suitelet). */
        var MR_PRECACHE_SCOPE_PARAM = 'custscript_reporte_precache_scope';
        /**
         * Rango histórico semi-manual (ambos obligatorios para activar): fechas inclusive; un map por mes.
         * Tras la ejecución, vaciar en el deployment para volver al modo programado de 2 años.
         */
        var MR_PRECACHE_HIST_START_PARAM = 'custscript_reporte_precache_hist_start';
        var MR_PRECACHE_HIST_END_PARAM = 'custscript_reporte_precache_hist_end';
        /** Primer mes que el Suitelet intentará cargar al fusionar caché (histórico generado por MR manual). */
        var PRECACHE_READ_EARLIEST_YEAR = 2010;

        function getExportSuiteletUrl() {
            if (EXPORT_SUITELET_SCRIPT_ID != null && EXPORT_SUITELET_DEPLOY_ID != null) {
                return '/app/site/hosting/scriptlet.nl?script=' + EXPORT_SUITELET_SCRIPT_ID + '&deploy=' + EXPORT_SUITELET_DEPLOY_ID;
            }
            return null;
        }

        // --- Links generales (listas de custom records) ---
        var _netsuiteBaseUrlCache = null;
        function getNetsuiteBaseUrl() {
            if (_netsuiteBaseUrlCache !== null) return _netsuiteBaseUrlCache;
            try {
                _netsuiteBaseUrlCache = https.resolveDomain({ hostType: https.HostType.APPLICATION }) || '';
            } catch (e) {
                _netsuiteBaseUrlCache = '';
            }
            return _netsuiteBaseUrlCache;
        }

        var _customRecordTypeInternalIdCache = {};
        function getCustomRecordTypeInternalId(rectypeScriptId) {
            if (!rectypeScriptId) return '';
            if (_customRecordTypeInternalIdCache[rectypeScriptId]) return _customRecordTypeInternalIdCache[rectypeScriptId];
            // Fallback seguro: si la cuenta usa internal ids numéricos para rectype,
            // mantenemos un mapeo explícito (evita que el lookup falle y termine pasando el scriptid como rectype).
            // Valores proporcionados por el usuario/URL compartida:
            // - Descuento proveedor: rectype=1508
            // - Comisiones cliente-articulo/ubicacion: rectype=1511
            // - Comisiones por empleado: rectype=1510
            var rectypeByScript = {
                'customrecord_descuento_proveedor': '1508',
                'customrecord_comisiones_otros': '1511',
                'customrecord_comisiones_empleado': '1510',
                'customrecord_parametros_comision': '1507'
            };
            if (rectypeByScript.hasOwnProperty(rectypeScriptId)) {
                _customRecordTypeInternalIdCache[rectypeScriptId] = rectypeByScript[rectypeScriptId];
                return _customRecordTypeInternalIdCache[rectypeScriptId];
            }
            var out = '';
            try {
                // En la URL de NetSuite el parámetro "rectype" normalmente usa el internal id (entero) del Record Type.
                // Si el lookup falla, regresamos el script id para no romper el link.
                var s = search.create({
                    type: 'customrecordtype',
                    filters: [['scriptid', 'is', rectypeScriptId]],
                    columns: [search.createColumn({ name: 'internalid' })]
                });
                s.run().each(function(r) {
                    out = r.getValue({ name: 'internalid' }) || r.getValue('internalid') || '';
                    return false;
                });
            } catch (e) {
                out = '';
            }
            if (!out) out = rectypeScriptId;
            _customRecordTypeInternalIdCache[rectypeScriptId] = String(out);
            return _customRecordTypeInternalIdCache[rectypeScriptId];
        }

        function buildCustomRecordListUrl(rectypeScriptId) {
            var rectypeId = getCustomRecordTypeInternalId(rectypeScriptId);
            // Ruta correcta para la lista de registros de un Custom Record en NetSuite:
            // /app/common/custom/custrecordentrylist.nl?rectype=<id>
            // (la ruta varía vs "customrecordlist.nl", por eso antes regresaba "No se encuentra la página").
            var rel = '/app/common/custom/custrecordentrylist.nl?rectype=' + encodeURIComponent(String(rectypeId)) + '&whence=';
            var base = getNetsuiteBaseUrl();
            return base ? (base.replace(/\/$/, '') + rel) : rel;
        }
    
        /** Filas por archivo al guardar por trozos (evita memoria/gobierno en periodos largos). */
        var EXPORT_JSON_CHUNK_SIZE = 1500;
        /**
         * Guarda los resultados en archivos JSON (por trozos si hay muchos) y devuelve el ID del archivo
         * índice (lista de IDs). El Suitelet de exportación carga el índice y luego cada trozo.
         */
        function saveReportDataToTempFile(results) {
            if (!results) results = [];
            var folderId = getReportExportFolderId();
            var ts = new Date().getTime();
            var fileIds = [];
            try {
                if (results.length <= EXPORT_JSON_CHUNK_SIZE) {
                    var jsonStr = JSON.stringify(results);
                    var name = 'ReporteRentabilidad_data_' + ts + '.json';
                    var tempFile = file.create({ name: name, fileType: file.Type.PLAINTEXT, contents: jsonStr });
                    tempFile.folder = folderId;
                    fileIds.push(String(tempFile.save()));
                } else {
                    for (var i = 0; i < results.length; i += EXPORT_JSON_CHUNK_SIZE) {
                        var chunk = results.slice(i, i + EXPORT_JSON_CHUNK_SIZE);
                        var chunkStr = JSON.stringify(chunk);
                        var chunkName = 'ReporteRentabilidad_data_' + ts + '_' + (fileIds.length + 1) + '.json';
                        var chunkFile = file.create({ name: chunkName, fileType: file.Type.PLAINTEXT, contents: chunkStr });
                        chunkFile.folder = folderId;
                        fileIds.push(String(chunkFile.save()));
                    }
                }
                var indexContents = JSON.stringify(fileIds);
                var indexFile = file.create({ name: 'ReporteRentabilidad_index_' + ts + '.json', fileType: file.Type.PLAINTEXT, contents: indexContents });
                indexFile.folder = folderId;
                var indexId = indexFile.save();
                log.audit('ReporteRentabilidad', 'saveReportDataToTempFile OK indexId=' + indexId + ' chunks=' + fileIds.length + ' rows=' + results.length);
                return String(indexId);
            } catch (e) {
                log.error('ReporteRentabilidad saveReportDataToTempFile', e.message || e);
                return '';
            }
        }
    
        /** Objeto global de tiempos por paso (se rellena con _t() y se registra con _logTimings()) */
        var _timings = null;
        /** Marca un paso y registra ms desde el paso anterior (o desde inicio) */
        function _t(stepName) {
            var now = Date.now();
            if (!_timings) {
                _timings = { start: now, steps: {}, last: now };
            }
            _timings.steps[stepName] = now - _timings.last;
            _timings.last = now;
        }
        /** Escribe un solo log de auditoría con todos los tiempos y total; limpia _timings */
        function _logTimings(accion, registros) {
            if (!_timings) return;
            _timings.total_ms = Date.now() - _timings.start;
            _timings.accion = accion;
            if (registros != null) _timings.registros = registros;
            delete _timings._last;
            log.audit('ReporteRentabilidad Tiempos', JSON.stringify(_timings));
            _timings = null;
        }
        
        /**
         * Función principal del Suitelet
         */
        function onRequest(context) {
            var request = context.request;
            var response = context.response;
            
            var params = request.parameters;
            if ((request.method === 'GET' || request.method === 'POST') && params.action === 'export' && params.fileId) {
                if (EXPORT_SUITELET_SCRIPT_ID && EXPORT_SUITELET_DEPLOY_ID) {
                    context.response.sendRedirect({
                        type: https.RedirectType.SUITELET,
                        identifier: EXPORT_SUITELET_SCRIPT_ID,
                        id: EXPORT_SUITELET_DEPLOY_ID,
                        parameters: { fileId: params.fileId }
                    });
                    return;
                }
                context.response.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
                context.response.write('<html><head><meta charset="UTF-8"><title>Exportar</title></head><body style="font-family:sans-serif;padding:20px;">');
                context.response.write('<h2>Exportar a Excel</h2><p>Configure <strong>EXPORT_SUITELET_SCRIPT_ID</strong> y <strong>EXPORT_SUITELET_DEPLOY_ID</strong> en ReporteRentabilidadSuitelet.js (al inicio del script) y despliegue el Suitelet ReporteRentabilidadExportSuitelet.</p>');
                context.response.write('<p><a href="javascript:history.back()">Volver</a></p></body></html>');
                return;
            }
            if (request.method === 'GET') {
                showFilterForm(context);
            } else if (request.method === 'POST') {
                showReport(context);
            }
        }
        
        /**
         * Muestra el formulario de filtros
         */
        function showFilterForm(context) {
            var params = context.request.parameters;
            var form = serverWidget.createForm({
                title: 'Reporte de Rentabilidad'
            });
            
            // Grupo de filtros principales
            var filterGroupMain = form.addFieldGroup({
                id: 'filtergroup_main',
                label: 'Filtros Principales'
            });
            
            // Campo de fecha desde
            var fechaDesdeField = form.addField({
                id: 'fecha_desde',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha Desde',
                container: 'filtergroup_main'
            });
            if (params.fecha_desde) {
                fechaDesdeField.defaultValue = params.fecha_desde;
            }
            
            // Campo de fecha hasta
            var fechaHastaField = form.addField({
                id: 'fecha_hasta',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha Hasta',
                container: 'filtergroup_main'
            });
            if (params.fecha_hasta) {
                fechaHastaField.defaultValue = params.fecha_hasta;
            }
            
            // Grupo de filtros secundarios (colapsable)
            var filterGroupSec = form.addFieldGroup({
                id: 'filtergroup_sec',
                label: 'Filtros Adicionales (Opcional)'
            });
            filterGroupSec.isCollapsible = true;
            filterGroupSec.isCollapsed = true;
            
            // Campo de ID de Invoice / Nota de Crédito (filtro adicional; si Tipo = Nota de Crédito, usar ID de la NC)
            var invoiceIdField = form.addField({
                id: 'invoice_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ID Factura / Nota de Crédito (opcional)',
                container: 'filtergroup_main'
            });
            if (params.invoice_id) {
                invoiceIdField.defaultValue = params.invoice_id;
            }
            
            // Campo de Tipo de cambio Interno (modificable, default 18)
            var tipoCambioInternoField = form.addField({
                id: 'tipo_cambio_interno',
                type: serverWidget.FieldType.FLOAT,
                label: 'Tipo de cambio Interno',
                container: 'filtergroup_main'
            });
            tipoCambioInternoField.defaultValue = params.tipo_cambio_interno ? parseFloat(params.tipo_cambio_interno) : 18;
            
            // Campo de período (inicia en blanco -- Ninguno --)
            var periodoField = form.addField({
                id: 'periodo',
                type: serverWidget.FieldType.SELECT,
                label: 'Período',
                container: 'filtergroup_sec'
            });
            loadAccountingPeriodOptions().forEach(function(opt) {
                periodoField.addSelectOption({ value: opt.value, text: opt.text });
            });
            if (params.periodo) {
                periodoField.defaultValue = params.periodo;
            }
            
            // Campo de tipo
            var tipoField = form.addField({
                id: 'tipo',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo',
                container: 'filtergroup_sec'
            });
            tipoField.addSelectOption({ value: '', text: '-- Todos --' });
            tipoField.addSelectOption({ value: 'CustInvc', text: 'Factura de Venta' });
            tipoField.addSelectOption({ value: 'CustCred', text: 'Nota de Crédito' });
            if (params.tipo) {
                tipoField.defaultValue = params.tipo;
            }
            
            // Campo de clase
            var claseField = form.addField({
                id: 'clase',
                type: serverWidget.FieldType.SELECT,
                label: 'Clase',
                container: 'filtergroup_sec',
                source: 'classification'
            });
            if (params.clase) {
                claseField.defaultValue = params.clase;
            }
            
            // Campo de ubicación
            var ubicacionField = form.addField({
                id: 'ubicacion',
                type: serverWidget.FieldType.SELECT,
                label: 'Ubicación',
                container: 'filtergroup_sec',
                source: 'location'
            });
            if (params.ubicacion) {
                ubicacionField.defaultValue = params.ubicacion;
            }
            
            // Campo de cliente
            var clienteField = form.addField({
                id: 'cliente',
                type: serverWidget.FieldType.SELECT,
                label: 'Cliente',
                container: 'filtergroup_sec',
                source: 'customer'
            });
            if (params.cliente) {
                clienteField.defaultValue = params.cliente;
            }
            
            // Campo de GIRO INDUSTRIAL
            var giroField = form.addField({
                id: 'giro_industrial',
                type: serverWidget.FieldType.SELECT,
                label: 'GIRO INDUSTRIAL',
                container: 'filtergroup_sec',
                source: 'custcategory'
            });
            if (params.giro_industrial) {
                giroField.defaultValue = params.giro_industrial;
            }
            
            // Campo de representante de ventas
            var repVentasField = form.addField({
                id: 'representante_ventas',
                type: serverWidget.FieldType.SELECT,
                label: 'Representante de Ventas',
                container: 'filtergroup_sec',
                source: 'employee'
            });
            if (params.representante_ventas) {
                repVentasField.defaultValue = params.representante_ventas;
            }
            
            // Campo de artículo
            var articuloField = form.addField({
                id: 'articulo',
                type: serverWidget.FieldType.SELECT,
                label: 'Artículo',
                container: 'filtergroup_sec',
                source: 'item'
            });
            if (params.articulo) {
                articuloField.defaultValue = params.articulo;
            }
            
            // Botón de generar reporte
            form.addSubmitButton({
                label: 'Generar Reporte'
            });
            var scriptSl = runtime.getCurrentScript();
            var suiteletUrlEnc = '/app/site/hosting/scriptlet.nl?script=' + scriptSl.id + '&deploy=' + scriptSl.deploymentId;
            var refreshHtml = '<p style="margin-top:16px;padding:10px;background:#f5f5f5;border-radius:4px;font-size:12px;">';
            refreshHtml += 'Precarga nocturna (archivos <code>' + REPORT_PRECACHE_FILE_PREFIX + 'AAAA-MM.json</code>, un mes por archivo). ';
            refreshHtml += 'El botón siguiente encola el Map/Reduce y <strong>muestra el reporte de inmediato</strong> con la caché ya existente (no espera a que termine la tarea). ';
            refreshHtml += '<form method="POST" action="' + suiteletUrlEnc + '" style="display:inline;">';
            refreshHtml += '<input type="hidden" name="action" value="refresh_precache">';
            refreshHtml += '<button type="submit">Encolar actualización y ver reporte</button></form></p>';
            form.addField({
                id: 'custpage_precache_help',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: 'filtergroup_main'
            }).defaultValue = refreshHtml;
            context.response.writePage(form);
        }
        
        /**
         * Carga opciones de Período contable con primera opción en blanco (-- Ninguno --).
         * Permite que el filtro Período inicie en blanco.
         */
        function loadAccountingPeriodOptions() {
            var options = [{ value: '', text: '-- Ninguno --' }];
            try {
                var periodSearch = search.create({
                    type: 'accountingperiod',
                    filters: [],
                    columns: [search.createColumn({ name: 'internalid' }), search.createColumn({ name: 'periodname' })]
                });
                var colId = search.createColumn({ name: 'internalid' });
                var colName = search.createColumn({ name: 'periodname' });
                periodSearch.run().each(function(r) {
                    options.push({
                        value: r.getValue(colId),
                        text: r.getText(colName) || r.getValue(colName) || r.getValue(colId)
                    });
                    return true;
                });
            } catch (e) { /* períodos no disponibles */ }
            return options;
        }
        
        /**
         * Mapea el tipo de transacción a texto en español
         */
        function mapTransactionTypeToSpanish(typeId, typeText) {
            var typeMap = {
                'CustInvc': 'Factura de venta',
                'CustCred': 'Nota de crédito',
                'Invoice': 'Factura de venta',
                'Credit Memo': 'Nota de crédito'
            };
            
            // Si tenemos el texto en español, usarlo
            if (typeText && (typeText.indexOf('Factura') >= 0 || typeText.indexOf('Crédito') >= 0 || typeText.indexOf('Nota') >= 0)) {
                return typeText;
            }
            
            // Si no, usar el mapa
            return typeMap[typeId] || typeText || typeId;
        }
        
        /**
         * Filtros para búsqueda de Notas de Crédito (mismos criterios que facturas).
         * NC → createdfrom = Return Authorization → createdfrom = Factura → createdfrom = SO.
         */
        function buildCreditMemoSearchFilters(filters) {
            var f = [
                ['type', 'anyof', 'CustCred'],
                'AND',
                ['status', 'noneof', 'CustCred:V'],
                'AND',
                ['taxline', 'is', 'F'],
                'AND',
                ['cogs', 'is', 'F'],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['quantity', 'greaterthan', '0']
            ];
            if (filters.fechaDesde) { f.push('AND'); f.push(['trandate', 'onorafter', filters.fechaDesde]); }
            if (filters.fechaHasta) { f.push('AND'); f.push(['trandate', 'onorbefore', filters.fechaHasta]); }
            if (filters.periodo) { f.push('AND'); f.push(['postingperiod', 'anyof', filters.periodo]); }
            if (filters.clase) { f.push('AND'); f.push(['class', 'anyof', filters.clase, 'item']); }
            if (filters.ubicacion) { f.push('AND'); f.push(['location', 'anyof', filters.ubicacion]); }
            if (filters.cliente) { f.push('AND'); f.push(['entity', 'anyof', filters.cliente]); }
            if (filters.giroIndustrial) { f.push('AND'); f.push(['category', 'anyof', filters.giroIndustrial, 'customermain']); }
            if (filters.representanteVentas) { f.push('AND'); f.push(['salesrep', 'anyof', filters.representanteVentas]); }
            if (filters.articulo) { f.push('AND'); f.push(['item', 'anyof', filters.articulo]); }
            if (filters.creditMemoId) { f.push('AND'); f.push(['internalid', 'anyof', filters.creditMemoId]); }
            return f;
        }
        
        /**
         * Columnas para búsqueda de NC. Solo datos de la NC y createdfrom = Return Authorization (sin fórmulas anidadas).
         * RA se obtiene por join; Item Receipt se resuelve después por búsqueda (IR.createdfrom = RA).
         */
        function buildCreditMemoSearchColumns() {
            var cols = [
                search.createColumn({ name: 'internalid' }),
                search.createColumn({ name: 'customform' }),
                search.createColumn({ name: 'trandate', sort: search.Sort.DESC }),
                search.createColumn({ name: 'postingperiod' }),
                search.createColumn({ name: 'type' }),
                search.createColumn({ name: 'class', join: 'item' }),
                search.createColumn({ name: 'location' }),
                search.createColumn({ name: 'tranid' }),
                search.createColumn({ name: 'createdfrom' }),
                search.createColumn({ name: 'tranid', join: 'createdfrom' }),
                search.createColumn({ name: 'entity' }),
                search.createColumn({ name: 'category', join: 'customermain' }),
                search.createColumn({ name: 'item' }),
                search.createColumn({ name: 'salesrep' }),
                search.createColumn({ name: 'quantity' }),
                search.createColumn({ name: 'amount' }),
                search.createColumn({ name: 'custbodykop_metodo_entrega_ov' }),
                search.createColumn({ name: 'terms', join: 'customermain' }),
                search.createColumn({ name: 'custbody_drt_fecha_ajustada_venc' }),
                search.createColumn({ name: 'vendor', join: 'item' }),
                search.createColumn({ name: 'custcol_mx_txn_line_sat_tax_object' }),
                search.createColumn({ name: 'custbody_drt_exchangerate_custom' }),
                search.createColumn({ name: 'currency' }),
                search.createColumn({ name: 'taxcode' }),
                search.createColumn({ name: 'taxitem' })
            ];
            return {
                columns: cols,
                colInternalId: cols[0],
                colCustomForm: cols[1],
                colTranDate: cols[2],
                colPeriod: cols[3],
                colType: cols[4],
                colItemClassification: cols[5],
                colLocation: cols[6],
                colTranId: cols[7],
                colCreatedFrom: cols[8],
                colReturnAuthTranId: cols[9],
                colEntity: cols[10],
                colCustomerMainGIRO: cols[11],
                colItem: cols[12],
                colSalesRep: cols[13],
                colQuantity: cols[14],
                colAmount: cols[15],
                colMetodoEntrega: cols[16],
                colTerms: cols[17],
                colFechaAjustadaVenc: cols[18],
                colVendor: cols[19],
                colTaxObject: cols[20],
                colTipoCambio: cols[21],
                colCurrency: cols[22],
                colTaxCode: cols[23],
                colTaxItem: cols[24]
            };
        }
        
        /**
         * Orden de búsquedas globales (base = facturas por fecha y filtros usuario):
         * 1. Invoice: filtros de fechas + resto de filtros del Suitelet. Base del reporte; createdfrom = Sales Order ID (no hacemos búsqueda de SO).
         * 2. Con el arreglo de IDs de órdenes (createdfrom de las facturas), búsqueda de Item Fulfillment filtrada SOLO por createdfrom anyof [ids]. Sin más filtros.
         * 3. Con los fulfillments en cache, una pasada sobre resultados de factura: lookup fulfillments e impacto contable.
         * @param {Object} filters - Filtros de búsqueda
         * @param {number} [maxRows] - Si se indica, se dejan de procesar filas al llegar a este número (para no exceder gobierno en export).
         * @param {number} [startPage] - Índice de página por el que empezar (0-based). Para export encadenado: cada request procesa una porción.
         * @param {Object} [searchOptions] - Opciones: bypassViewCap (true) omite el tope de 12 páginas (Map/Reduce nocturno).
         */
        function executeInvoiceSearch(filters, maxRows, startPage, searchOptions) {
            startPage = startPage != null ? Math.max(0, startPage) : 0;
            searchOptions = searchOptions || {};
            var bypassViewCap = searchOptions.bypassViewCap === true;
            // --- Paso 1: Búsqueda de Facturas (solo CustInvc; estable). NC en búsqueda separada. ---
            var invoiceSearchFilters = [
                ['type', 'anyof', 'CustInvc'],
                'AND',
                ['status', 'noneof', 'CustInvc:D', 'CustInvc:E', 'CustInvc:V'],
                'AND',
                ['taxline', 'is', 'F'],
                'AND',
                ['cogs', 'is', 'F'],
                'AND',
                ['mainline', 'is', 'F'],
                'AND',
                ['quantity', 'greaterthan', '0']
            ];
            
            // Filtro adicional por ID de Invoice (si se especifica)
            if (filters.invoiceId) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['internalid', 'anyof', filters.invoiceId]);
            }
            
            // Filtros principales (obligatorios)
            if (filters.fechaDesde) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['trandate', 'onorafter', filters.fechaDesde]);
            }
            
            if (filters.fechaHasta) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['trandate', 'onorbefore', filters.fechaHasta]);
            }
            
            // Filtros secundarios (opcionales)
            if (filters.periodo) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['postingperiod', 'anyof', filters.periodo]);
            }
            
            // Tipo: solo filtrar si eligió solo Factura (CustInvc). "Todos" = facturas + NC (esta búsqueda solo facturas).
            if (filters.tipo === 'CustInvc') {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['type', 'anyof', 'CustInvc']);
            }
            
            if (filters.clase) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['class', 'anyof', filters.clase, 'item']);
            }
            
            if (filters.ubicacion) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['location', 'anyof', filters.ubicacion]);
            }
            
            if (filters.cliente) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['entity', 'anyof', filters.cliente]);
            }
            
            if (filters.giroIndustrial) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['category', 'anyof', filters.giroIndustrial, 'customermain']);
            }
            
            if (filters.representanteVentas) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['salesrep', 'anyof', filters.representanteVentas]);
            }
            
            if (filters.articulo) {
                invoiceSearchFilters.push('AND');
                invoiceSearchFilters.push(['item', 'anyof', filters.articulo]);
            }
            
            // Crear columnas de búsqueda de Invoice
            var invoiceSearchColInternalId = search.createColumn({ name: 'internalid' });
            var invoiceSearchColCustomForm = search.createColumn({ name: 'customform' });
            var invoiceSearchColTranDate = search.createColumn({ name: 'trandate', sort: search.Sort.DESC });
            var invoiceSearchColPeriod = search.createColumn({ name: 'postingperiod' });
            var invoiceSearchColType = search.createColumn({ name: 'type' });
            var invoiceSearchColItemClassification = search.createColumn({ name: 'class', join: 'item' });
            var invoiceSearchColLocation = search.createColumn({ name: 'location' });
            var invoiceSearchColTranId = search.createColumn({ name: 'tranid' });
            var invoiceSearchColEntity = search.createColumn({ name: 'entity' });
            var invoiceSearchColCustomerMainGIROINDUSTRIAL = search.createColumn({ name: 'category', join: 'customermain' });
            var invoiceSearchColItem = search.createColumn({ name: 'item' });
            var invoiceSearchColSalesRep = search.createColumn({ name: 'salesrep' });
            var invoiceSearchColQuantity = search.createColumn({ name: 'quantity' });
            var invoiceSearchColAmount = search.createColumn({ name: 'amount' });
            var invoiceSearchColMetodoDeEntrega = search.createColumn({ name: 'custbodykop_metodo_entrega_ov' });
            // Proveedor preferido (ítem), Términos (cliente), Fecha ajustada vencimiento, Objeto de impuesto
            var invoiceSearchColTerms = search.createColumn({ name: 'terms', join: 'customermain' });
            var invoiceSearchColFechaAjustadaVenc = search.createColumn({ name: 'custbody_drt_fecha_ajustada_venc' });
            var invoiceSearchColVendor = search.createColumn({ name: 'vendor', join: 'item' });
            var invoiceSearchColTaxObject = search.createColumn({ name: 'custcol_mx_txn_line_sat_tax_object' });
            // Tipo de cambio y moneda del invoice
            var invoiceSearchColTipoCambio = search.createColumn({ name: 'custbody_drt_exchangerate_custom' });
            var invoiceSearchColCurrency = search.createColumn({ name: 'currency' });
            // Tax Code y Tax Item (objeto de impuesto)
            var invoiceSearchColTaxCode = search.createColumn({ name: 'taxcode' });
            var invoiceSearchColTaxItem = search.createColumn({ name: 'taxitem' });
            // Createdfrom = Sales Order (solo facturas en esta búsqueda)
            var invoiceSearchColCreatedFrom = search.createColumn({ name: 'createdfrom' });
            var invoiceSearchColCreatedFromCostoTransporte = search.createColumn({ name: 'custbody_kop_costotransporte', join: 'createdfrom' });
            var invoiceSearchColCreatedFromTranId = search.createColumn({ name: 'tranid', join: 'createdfrom' });
            // Crear búsqueda de Invoice
            var invoiceSearch = search.create({
                type: 'transaction',
                filters: invoiceSearchFilters,
                columns: [
                    invoiceSearchColInternalId,
                    invoiceSearchColCustomForm,
                    invoiceSearchColTranDate,
                    invoiceSearchColPeriod,
                    invoiceSearchColType,
                    invoiceSearchColItemClassification,
                    invoiceSearchColLocation,
                    invoiceSearchColTranId,
                    invoiceSearchColEntity,
                    invoiceSearchColCustomerMainGIROINDUSTRIAL,
                    invoiceSearchColItem,
                    invoiceSearchColSalesRep,
                    invoiceSearchColQuantity,
                    invoiceSearchColAmount,
                    invoiceSearchColMetodoDeEntrega,
                    invoiceSearchColTerms,
                    invoiceSearchColFechaAjustadaVenc,
                    invoiceSearchColVendor,
                    invoiceSearchColTaxObject,
                    invoiceSearchColTipoCambio,
                    invoiceSearchColCurrency,
                    invoiceSearchColTaxCode,
                    invoiceSearchColTaxItem,
                    invoiceSearchColCreatedFrom,
                    invoiceSearchColCreatedFromCostoTransporte,
                    invoiceSearchColCreatedFromTranId
                ]
            });
            
            loadComisionesGerentesCache(filters.fechaDesde, filters.fechaHasta);
            loadOtrosCompensacionCache();
            fulfillmentsBySOCache = {};
            fulfillmentImpactCache = {};
            raToItemReceiptCache = {};
            itemReceiptImpactCache = {};
            var account5100Id = getAccount5100Id();
            var MAX_PAGES_VIEW = 12;
            var soIdsMap = {};
            var invoiceSearchPagedData = null;
            var totalPages = 0;
            var cappedForView = false;
            var numPagesToFetch = 0;
            var pageStart = 0;
            
            // --- Búsqueda de Facturas (solo si no se filtró solo por NC) ---
            if (filters.tipo !== 'CustCred') {
                if (filters.invoiceId) {
                    log.audit('ReporteRentabilidad', 'Paso 1a Search Facturas filtro internalid=' + filters.invoiceId);
                }
                invoiceSearchPagedData = invoiceSearch.runPaged({ pageSize: 1000 });
                totalPages = invoiceSearchPagedData.pageRanges.length;
                log.audit('ReporteRentabilidad', 'Paso 1a Search Facturas listo; páginas=' + totalPages);
                if (filters.invoiceId && totalPages > 0) {
                    var invSample = [];
                    var invPage0 = invoiceSearchPagedData.fetch({ index: 0 });
                    invPage0.data.slice(0, 10).forEach(function(r) {
                        invSample.push('id=' + r.getValue(invoiceSearchColInternalId) + ',' + r.getValue(invoiceSearchColTranId));
                    });
                    log.audit('ReporteRentabilidad', 'Paso 1a Facturas resultados (muestra): ' + invSample.join(' | '));
                }
                cappedForView = !bypassViewCap && (maxRows == null && totalPages > MAX_PAGES_VIEW);
                if (cappedForView) {
                    log.audit('ReporteRentabilidad', 'Vista limitada a ' + MAX_PAGES_VIEW + ' páginas facturas por tiempo');
                }
                pageStart = 0;
                numPagesToFetch = totalPages;
                if (maxRows != null && maxRows > 0) {
                    var pagesForChunk = Math.ceil(maxRows / 1000);
                    pageStart = startPage;
                    numPagesToFetch = Math.min(pagesForChunk, totalPages - pageStart);
                    if (numPagesToFetch < 1) numPagesToFetch = 0;
                } else if (cappedForView) {
                    numPagesToFetch = MAX_PAGES_VIEW;
                }
                for (var p = 0; p < numPagesToFetch; p++) {
                    var pageIndex = pageStart + p;
                    var pageSo = invoiceSearchPagedData.fetch({ index: pageIndex });
                    pageSo.data.forEach(function(r) {
                        var soId = r.getValue(invoiceSearchColCreatedFrom);
                        if (soId) soIdsMap[soId] = true;
                    });
                }
            }
            
            // --- Búsqueda de Notas de Crédito (NC → RA → Factura → SO); mismos filtros ---
            var ncSearchPagedData = null;
            var ncCols = null;
            var ncTotalPages = 0;
            var ncCappedForView = false;
            var ncNumPagesToFetch = 0;
            if (filters.tipo !== 'CustInvc') {
                var ncFilters = buildCreditMemoSearchFilters(filters);
                if (filters.creditMemoId) {
                    log.audit('ReporteRentabilidad', 'Paso 1b filtro NC por internalid=' + filters.creditMemoId);
                }
                ncCols = buildCreditMemoSearchColumns();
                var ncSearch = search.create({
                    type: 'transaction',
                    filters: ncFilters,
                    columns: ncCols.columns
                });
                ncSearchPagedData = ncSearch.runPaged({ pageSize: 1000 });
                ncTotalPages = ncSearchPagedData.pageRanges.length;
                log.audit('ReporteRentabilidad', 'Paso 1b Search NC listo; páginas=' + ncTotalPages);
                ncCappedForView = !bypassViewCap && (maxRows == null && ncTotalPages > MAX_PAGES_VIEW);
                ncNumPagesToFetch = ncCappedForView ? MAX_PAGES_VIEW : ncTotalPages;
                if (maxRows != null && maxRows > 0) {
                    ncNumPagesToFetch = Math.min(Math.ceil(maxRows / 1000), ncTotalPages);
                }
                var raIdsMap = {};
                var ncIdsSeen = {};
                var ncTranIdsSeen = {};
                for (var np = 0; np < ncNumPagesToFetch; np++) {
                    var ncPage = ncSearchPagedData.fetch({ index: np });
                    ncPage.data.forEach(function(r) {
                        var ncInternalId = r.getValue(ncCols.colInternalId);
                        var ncTranId = r.getValue(ncCols.colTranId);
                        if (ncInternalId) ncIdsSeen[String(ncInternalId)] = true;
                        if (ncTranId) ncTranIdsSeen[String(ncTranId)] = true;
                        var raId = r.getValue(ncCols.colCreatedFrom);
                        if (raId) raIdsMap[raId] = true;
                    });
                }
                var ncIdsList = Object.keys(ncIdsSeen);
                var ncTranIdsList = Object.keys(ncTranIdsSeen);
                log.audit('ReporteRentabilidad', 'Paso 1b NC resultados: count=' + ncIdsList.length + ' internalids=' + ncIdsList.slice(0, 15).join(',') + (ncIdsList.length > 15 ? '...' : ''));
                log.audit('ReporteRentabilidad', 'Paso 1b NC resultados tranids=' + ncTranIdsList.slice(0, 15).join(',') + (ncTranIdsList.length > 15 ? '...' : ''));
                var raIdList = Object.keys(raIdsMap);
                log.audit('ReporteRentabilidad', 'Paso 1b RAs únicos=' + raIdList.length + (raIdList.length > 0 ? ' primeros=' + raIdList.slice(0, 5).join(',') : ''));
                preloadItemReceiptsByReturnAuths(raIdList);
                var raWithIrCount = Object.keys(raToItemReceiptCache || {}).length;
                log.audit('ReporteRentabilidad', 'Paso 1c RAs con Item Receipt=' + raWithIrCount + ' de ' + raIdList.length);
                if (raWithIrCount > 0 && raToItemReceiptCache) {
                    var sampleRa = Object.keys(raToItemReceiptCache).slice(0, 3);
                    sampleRa.forEach(function(raid) {
                        var ir = raToItemReceiptCache[raid];
                        log.audit('ReporteRentabilidad', 'Paso 1c RA ' + raid + ' -> IR id=' + (ir ? ir.id : '') + ' tranid=' + (ir ? ir.tranid : ''));
                    });
                }
                var irIdsForImpact = [];
                Object.keys(raToItemReceiptCache || {}).forEach(function(raId) {
                    var ir = raToItemReceiptCache[raId];
                    if (ir && ir.id) irIdsForImpact.push(ir.id);
                });
                log.audit('ReporteRentabilidad', 'Paso 1c IR ids para impacto=' + irIdsForImpact.length + (irIdsForImpact.length > 0 ? ' primeros=' + irIdsForImpact.slice(0, 5).join(',') : ''));
                preloadItemReceiptAccountingImpact(irIdsForImpact, account5100Id);
                var irImpactCount = Object.keys(itemReceiptImpactCache || {}).length;
                log.audit('ReporteRentabilidad', 'Paso 1d IRs con impacto 5100=' + irImpactCount);
            }
            
            var soIdList = Object.keys(soIdsMap);
            log.audit('ReporteRentabilidad', 'Paso 1 SOs únicos=' + soIdList.length);
            preloadFulfillmentsBySalesOrders(soIdList);
            log.audit('ReporteRentabilidad', 'Paso 2 Fulfillments precargados');
            preloadFulfillmentLineQtyForMultiEPA();
            preloadFulfillmentAccountingImpact(account5100Id);
            log.audit('ReporteRentabilidad', 'Paso 2b Impacto 5100 precargado');
            
            var results = [];
            var hitMaxRows = false;
            
            // --- Filas de Facturas ---
            if (invoiceSearchPagedData) {
                var maxPageIndex = (cappedForView ? Math.min(startPage + MAX_PAGES_VIEW, totalPages) : totalPages);
                // Pre-pass: agrupar líneas por (factura, EPA) para repartir costo cuando hay varias líneas del mismo ítem (reparto proporcional por cantidad).
                var invFulfillLines = {};
                var invFulfillCost = {};
                var invFulfillCostIndex = {};
                for (var iPre = startPage; iPre < maxPageIndex; iPre++) {
                    var invoiceSearchPagePre = invoiceSearchPagedData.fetch({ index: iPre });
                    for (var dPre = 0; dPre < invoiceSearchPagePre.data.length; dPre++) {
                        var resultPre = invoiceSearchPagePre.data[dPre];
                        var invIdPre = resultPre.getValue(invoiceSearchColInternalId);
                        var salesOrderIdPre = resultPre.getValue(invoiceSearchColCreatedFrom);
                        var fulfillmentsPre = getItemFulfillmentsBySalesOrder(salesOrderIdPre);
                        var fulfillmentIdPre = '';
                        var itemIdPre = resultPre.getValue(invoiceSearchColItem) || '';
                        var qtyPre = Math.abs(parseFloat(resultPre.getValue(invoiceSearchColQuantity) || 0));
                        if (fulfillmentsPre && fulfillmentsPre.length > 1 && itemIdPre && qtyPre > 0) {
                            var fIdsPre = [];
                            var fIdsSeenPre = {};
                            for (var fxPre = 0; fxPre < fulfillmentsPre.length; fxPre++) {
                                var eidPre = fulfillmentsPre[fxPre].id;
                                if (eidPre && !fIdsSeenPre[eidPre]) { fIdsSeenPre[eidPre] = true; fIdsPre.push(eidPre); }
                            }
                            ensureFulfillmentLineQtyCache(fIdsPre, salesOrderIdPre);
                            var invQtyRoundedPre = Math.round(qtyPre * 1e4) / 1e4;
                            for (var fiPre = 0; fiPre < fulfillmentsPre.length; fiPre++) {
                                var fPre = fulfillmentsPre[fiPre];
                                var qtyFulfPre = getFulfillmentLineQtyByItem(fPre.id, itemIdPre);
                                var qtyFulfRoundedPre = Math.round(qtyFulfPre * 1e4) / 1e4;
                                if (qtyFulfRoundedPre > 0 && Math.abs(qtyFulfRoundedPre - invQtyRoundedPre) < 0.0001) {
                                    if ((getFulfillmentAccountingImpactByItem(fPre.id, itemIdPre, account5100Id) || 0) > 0) {
                                        fulfillmentIdPre = fPre.id || '';
                                        break;
                                    }
                                }
                            }
                        }
                        if (!fulfillmentIdPre && fulfillmentsPre && fulfillmentsPre.length > 0 && itemIdPre) {
                            for (var fiPre2 = 0; fiPre2 < fulfillmentsPre.length; fiPre2++) {
                                if ((getFulfillmentAccountingImpactByItem(fulfillmentsPre[fiPre2].id, itemIdPre, account5100Id) || 0) > 0) {
                                    fulfillmentIdPre = fulfillmentsPre[fiPre2].id || '';
                                    break;
                                }
                            }
                        }
                        if (!fulfillmentIdPre && fulfillmentsPre && fulfillmentsPre.length > 0) fulfillmentIdPre = fulfillmentsPre[0].id || '';
                        var keyPre = String(invIdPre) + '_' + String(fulfillmentIdPre);
                        if (!invFulfillLines[keyPre]) invFulfillLines[keyPre] = [];
                        invFulfillLines[keyPre].push({ itemId: itemIdPre, qty: qtyPre, amount: parseFloat(resultPre.getValue(invoiceSearchColAmount) || 0) });
                    }
                }
                for (var keyBuild in invFulfillLines) {
                    var linesBuild = invFulfillLines[keyBuild];
                    var partsBuild = keyBuild.split('_');
                    var fulfillmentIdBuild = partsBuild.length > 1 ? partsBuild.slice(1).join('_') : '';
                    var dataBuild = getFulfillmentAccountingImpact(fulfillmentIdBuild, account5100Id);
                    var totalQtyByItemBuild = {};
                    for (var lb = 0; lb < linesBuild.length; lb++) {
                        var itemKeyBuild = String(linesBuild[lb].itemId || '');
                        if (itemKeyBuild) totalQtyByItemBuild[itemKeyBuild] = (totalQtyByItemBuild[itemKeyBuild] || 0) + (linesBuild[lb].qty || 0);
                    }
                    var costArrBuild = [];
                    for (var lb2 = 0; lb2 < linesBuild.length; lb2++) {
                        var lineBuild = linesBuild[lb2];
                        var itemKeyBuild2 = String(lineBuild.itemId || '');
                        var totalCostItemBuild = (dataBuild && dataBuild.byItem && dataBuild.byItem[itemKeyBuild2]) ? dataBuild.byItem[itemKeyBuild2] : 0;
                        var totalQtyItemBuild = totalQtyByItemBuild[itemKeyBuild2] || 0;
                        var qtyBuild = lineBuild.qty || 0;
                        var costBuild = 0;
                        if (totalCostItemBuild && totalQtyItemBuild > 0 && qtyBuild > 0) {
                            costBuild = totalCostItemBuild * (qtyBuild / totalQtyItemBuild);
                        } else if (totalCostItemBuild) {
                            costBuild = totalCostItemBuild;
                        }
                        costArrBuild.push(costBuild);
                    }
                    invFulfillCost[keyBuild] = costArrBuild;
                    invFulfillCostIndex[keyBuild] = 0;
                }
                for (var i = startPage; i < maxPageIndex && !hitMaxRows; i++) {
                    var invoiceSearchPage = invoiceSearchPagedData.fetch({ index: i });
                for (var d = 0; d < invoiceSearchPage.data.length; d++) {
                    if (maxRows != null && results.length >= maxRows) { hitMaxRows = true; break; }
                    var result = invoiceSearchPage.data[d];
                    var invoiceId = result.getValue(invoiceSearchColInternalId);
                    var salesOrderId = result.getValue(invoiceSearchColCreatedFrom);
                    // Fulfillments ya cargados por búsqueda global; solo lectura del cache
                    var fulfillments = getItemFulfillmentsBySalesOrder(salesOrderId);
                    
                    var costoFulfillment = 0;
                    var fulfillmentTranId = '';
                    var fulfillmentIdUsed = '';
                    var invoiceLineItemId = result.getValue(invoiceSearchColItem) || '';
                    var invoiceQty = Math.abs(parseFloat(result.getValue(invoiceSearchColQuantity) || 0));
                    
                    // Solo cuando hay más de una EPA: match por cantidad factura = cantidad en la EPA (sublist item, quantity), no impacto
                    if (fulfillments && fulfillments.length > 1 && invoiceLineItemId && invoiceQty > 0) {
                        var fIds = [];
                        var fIdsSeen = {};
                        for (var fx = 0; fx < fulfillments.length; fx++) {
                            var eid = fulfillments[fx].id;
                            if (eid && !fIdsSeen[eid]) { fIdsSeen[eid] = true; fIds.push(eid); }
                        }
                        ensureFulfillmentLineQtyCache(fIds, salesOrderId);
                        var invQtyRounded = Math.round(invoiceQty * 1e4) / 1e4;
                        var logThisSO = !EPA_LOG_SO_FILTER || String(salesOrderId) === EPA_LOG_SO_FILTER;
                        for (var fiMatch = 0; fiMatch < fulfillments.length; fiMatch++) {
                            var fMatch = fulfillments[fiMatch];
                            var qtyFulfill = getFulfillmentLineQtyByItem(fMatch.id, invoiceLineItemId);
                            var qtyFulfillRounded = Math.round(qtyFulfill * 1e4) / 1e4;
                            if (qtyFulfillRounded > 0 && Math.abs(qtyFulfillRounded - invQtyRounded) < 0.0001) {
                                var costMatch = getFulfillmentAccountingImpactByItem(fMatch.id, invoiceLineItemId, account5100Id) || 0;
                                if (costMatch > 0) {
                                    costoFulfillment = costMatch;
                                    fulfillmentTranId = fMatch.tranid || '';
                                    fulfillmentIdUsed = fMatch.id || '';
                                    if (logThisSO && _epaLogCount < _epaLogLimit) {
                                        log.audit('ReporteRentabilidad EPA', 'Match cantidad SO=' + salesOrderId + ' item=' + invoiceLineItemId + ' qty=' + invQtyRounded + ' -> EPA id=' + fMatch.id + ' tranid=' + (fMatch.tranid || '') + ' cost=' + costMatch);
                                        _epaLogCount++;
                                    }
                                    break;
                                }
                            }
                        }
                        if (!costoFulfillment && logThisSO && _epaLogCount < _epaLogLimit) {
                            log.audit('ReporteRentabilidad EPA', 'Sin match por cantidad SO=' + salesOrderId + ' item=' + invoiceLineItemId + ' qtyInv=' + invQtyRounded + ' (qtys EPA: ' + fIds.map(function(id) { return id + '=' + getFulfillmentLineQtyByItem(id, invoiceLineItemId); }).join(', ') + ')');
                            _epaLogCount++;
                        }
                    }
                    
                    // Si no hubo match por cantidad (o solo hay una EPA), usar el flujo original: primer EPA con costo para ese ítem
                    if (!costoFulfillment && fulfillments && fulfillments.length > 0 && invoiceLineItemId) {
                        for (var fi = 0; fi < fulfillments.length; fi++) {
                            var costForItem = getFulfillmentAccountingImpactByItem(fulfillments[fi].id, invoiceLineItemId, account5100Id) || 0;
                            if (costForItem > 0) {
                                costoFulfillment = costForItem;
                                fulfillmentTranId = fulfillments[fi].tranid || '';
                                fulfillmentIdUsed = fulfillments[fi].id || '';
                                if (fulfillments.length > 1 && (!EPA_LOG_SO_FILTER || String(salesOrderId) === EPA_LOG_SO_FILTER) && _epaLogCount < _epaLogLimit) {
                                    log.audit('ReporteRentabilidad EPA', 'Fallback primer EPA con costo SO=' + salesOrderId + ' item=' + invoiceLineItemId + ' -> EPA id=' + fulfillments[fi].id + ' tranid=' + (fulfillments[fi].tranid || '') + ' cost=' + costForItem);
                                    _epaLogCount++;
                                }
                                break;
                            }
                        }
                    }
                    if (!fulfillmentIdUsed && fulfillments && fulfillments.length > 0) fulfillmentIdUsed = fulfillments[0].id || '';
                    var invFulfillKey = String(invoiceId) + '_' + String(fulfillmentIdUsed);
                    if (invFulfillCost[invFulfillKey] && invFulfillCostIndex[invFulfillKey] !== undefined && invFulfillCostIndex[invFulfillKey] < invFulfillCost[invFulfillKey].length) {
                        costoFulfillment = invFulfillCost[invFulfillKey][invFulfillCostIndex[invFulfillKey]++];
                    }
                    
                    // Crear una sola línea por línea de invoice
                    var row = {
                            // Campos de Invoice (según especificación)
                            customForm: result.getText(invoiceSearchColCustomForm) || result.getValue(invoiceSearchColCustomForm),
                            fecha: result.getValue(invoiceSearchColTranDate),
                            periodo: result.getText(invoiceSearchColPeriod) || result.getValue(invoiceSearchColPeriod),
                            postingPeriodId: result.getValue(invoiceSearchColPeriod) || '',
                            claseId: result.getValue(invoiceSearchColItemClassification) || '',
                            giroIndustrialId: result.getValue(invoiceSearchColCustomerMainGIROINDUSTRIAL) || '',
                            type: mapTransactionTypeToSpanish(result.getValue(invoiceSearchColType), result.getText(invoiceSearchColType)),
                            clase: result.getText(invoiceSearchColItemClassification) || result.getValue(invoiceSearchColItemClassification),
                            ubicacion: result.getText(invoiceSearchColLocation) || result.getValue(invoiceSearchColLocation),
                            ubicacionId: result.getValue(invoiceSearchColLocation) || '',
                            numeroDocumento: result.getValue(invoiceSearchColTranId),
                            notaCreditoNumero: '',
                            returnAuthorizationTranId: '',
                            itemReceiptTranId: '',
                            cliente: result.getText(invoiceSearchColEntity) || result.getValue(invoiceSearchColEntity),
                            giroIndustrial: result.getText(invoiceSearchColCustomerMainGIROINDUSTRIAL) || result.getValue(invoiceSearchColCustomerMainGIROINDUSTRIAL),
                            articulo: result.getText(invoiceSearchColItem) || result.getValue(invoiceSearchColItem),
                            representanteVenta: result.getText(invoiceSearchColSalesRep) || result.getValue(invoiceSearchColSalesRep),
                            representanteVentaId: result.getValue(invoiceSearchColSalesRep) || '', // ID del Employee para lookup en cache
                            cantidad: parseFloat(result.getValue(invoiceSearchColQuantity) || 0),
                            importe: parseFloat(result.getValue(invoiceSearchColAmount) || 0),
                            metodoEntrega: result.getText(invoiceSearchColMetodoDeEntrega) || result.getValue(invoiceSearchColMetodoDeEntrega),
                            terminos: result.getText(invoiceSearchColTerms) || result.getValue(invoiceSearchColTerms) || '',
                            fechaAjustadaVencimiento: result.getValue(invoiceSearchColFechaAjustadaVenc) || '',
                            proveedor: result.getText(invoiceSearchColVendor) || result.getValue(invoiceSearchColVendor) || '',
                            objetoImpuesto: result.getText(invoiceSearchColTaxObject) || result.getValue(invoiceSearchColTaxObject) || '',
                            tipoCambio: parseFloat(result.getValue(invoiceSearchColTipoCambio) || 0),
                            moneda: result.getText(invoiceSearchColCurrency) || result.getValue(invoiceSearchColCurrency),
                            taxCode: result.getText(invoiceSearchColTaxCode) || result.getValue(invoiceSearchColTaxCode),
                            taxItem: result.getText(invoiceSearchColTaxItem) || result.getValue(invoiceSearchColTaxItem),
                            costoTransporteCreated: parseFloat(result.getValue(invoiceSearchColCreatedFromCostoTransporte) || 0),
                            salesOrderTranId: result.getValue(invoiceSearchColCreatedFromTranId) || '',
                            fulfillmentTranId: fulfillmentTranId || '',
                            costo: costoFulfillment || 0, // Costo del EPA que contiene este ítem (cuenta 5100)
                            
                            articuloId: result.getValue(invoiceSearchColItem) || '',
                            clienteId: result.getValue(invoiceSearchColEntity) || '',
                            proveedorId: result.getValue(invoiceSearchColVendor) || '',
                            
                            // IDs para referencias
                            invoiceId: invoiceId,
                            salesOrderId: salesOrderId,
                            fulfillmentId: fulfillmentIdUsed || (fulfillments.length > 0 ? fulfillments[0].id : ''),
                            
                            // Impacto contable del fulfillment
                            accountingImpact: costoFulfillment
                        };
                        
                        // Descuento proveedor ya cargado en showReport; solo consultar cache
                        var factor = getFactorDescuentoProveedor(row);
                        row.factorDescuento = factor != null ? factor : 0;
                        
                        // Obtener porcentajes de comisión de gerentes del Employee desde el cache
                        // Convertir el ID a string para asegurar que coincida con las claves del cache
                        var employeeIdStr = String(row.representanteVentaId || '');
                        var comisionesGerentes = getComisionesGerentes(employeeIdStr);
                        if (comisionesGerentes) {
                            // Asignar valores TAL CUAL del registro Employee (rosario, alhely, ..., prieto)
                            row.porcentajeComisionRosario = comisionesGerentes.rosario || 0;
                            row.porcentajeComisionAlhely = comisionesGerentes.alhely || 0;
                            row.porcentajeComisionGabriela = comisionesGerentes.gabriela || 0;
                            row.porcentajeComisionMineria = comisionesGerentes.mineria || 0;
                            row.porcentajeComisionAgro = comisionesGerentes.agro || 0;
                            row.porcentajeComisionPrieto = comisionesGerentes.prieto || 0;
                            var otrosResult = getPorcentajeOtrosCompensacionClienteArticulo(row);
                            row.porcentajeComisionOtros = (otrosResult.tipo === 'porcentaje') ? otrosResult.valor : 0;
                            row.otrosCostoFijoTon = (otrosResult.tipo === 'costo_fijo') ? otrosResult.valor : null;
                            row.porcentajeComisionTotal = (row.porcentajeComisionRosario || 0) + (row.porcentajeComisionAlhely || 0) + (row.porcentajeComisionGabriela || 0) + (row.porcentajeComisionMineria || 0) + (row.porcentajeComisionAgro || 0) + (row.porcentajeComisionPrieto || 0) + (row.porcentajeComisionOtros || 0);
                        } else {
                            row.porcentajeComisionRosario = 0;
                            row.porcentajeComisionAlhely = 0;
                            row.porcentajeComisionGabriela = 0;
                            row.porcentajeComisionMineria = 0;
                            row.porcentajeComisionAgro = 0;
                            row.porcentajeComisionPrieto = 0;
                            var otrosResultElse = getPorcentajeOtrosCompensacionClienteArticulo(row);
                            row.porcentajeComisionOtros = (otrosResultElse.tipo === 'porcentaje') ? otrosResultElse.valor : 0;
                            row.otrosCostoFijoTon = (otrosResultElse.tipo === 'costo_fijo') ? otrosResultElse.valor : null;
                            row.porcentajeComisionTotal = row.porcentajeComisionOtros || 0;
                        }
                        // Nota Crédito Proveedor = Tipo de Cambio × Cantidad × Factor Descuento
                        row.notaCreditoProveedor = (row.tipoCambio || 0) * (row.cantidad || 0) * (row.factorDescuento || 0);
                        
                        // Transporte = Cantidad × Costo Transporte
                        row.transporte = (row.cantidad || 0) * (row.costoTransporteCreated || 0);
                        // Costo Total = Costo + Transporte - Nota Crédito Proveedor
                        row.costoTotal = (row.costo || 0) + (row.transporte || 0) - (row.notaCreditoProveedor || 0);
                        // Utilidad Bruta = Ingreso (importe) - Costo Total
                        row.utilidadBruta = (row.importe || 0) - (row.costoTotal || 0);
                        // Margen MN = Utilidad Bruta / Ingreso (ratio; si ingreso es 0, margen 0)
                        row.margenMN = (row.importe > 0) ? ((row.utilidadBruta || 0) / row.importe) : 0;
                        
                        // Campos en dólares (divididos por tipo de cambio)
                        var tipoCambio = row.tipoCambio || 0;
                        if (tipoCambio > 0) {
                            row.ingresoUSD = (row.importe || 0) / tipoCambio;
                            row.costoUSD = (row.costo || 0) / tipoCambio;
                            row.transporteUSD = (row.transporte || 0) / tipoCambio;
                            row.notaCreditoProveedorUSD = (row.notaCreditoProveedor || 0) / tipoCambio;
                            row.costoTotalUSD = (row.costoTotal || 0) / tipoCambio;
                            row.utilidadBrutaUSD = (row.utilidadBruta || 0) / tipoCambio;
                        } else {
                            row.ingresoUSD = 0;
                            row.costoUSD = 0;
                            row.transporteUSD = 0;
                            row.notaCreditoProveedorUSD = 0;
                            row.costoTotalUSD = 0;
                            row.utilidadBrutaUSD = 0;
                        }
                        
                        // Ingreso Casa = INGRESO USD × Tipo de cambio Interno
                        var tipoCambioInterno = filters.tipoCambioInterno || 18;
                        row.tipoCambioInterno = tipoCambioInterno;
                        row.ingresoCasa = (row.ingresoUSD || 0) * tipoCambioInterno;
                        
                        results.push(row);
                }
            }
            }
            
            // --- Filas de Notas de Crédito (NC → RA → Item Receipt; costo = impacto contable del IR, sin filtro cuenta) ---
            if (ncSearchPagedData && ncCols) {
                var ncMaxPage = ncCappedForView ? Math.min(MAX_PAGES_VIEW, ncTotalPages) : ncTotalPages;
                // Pre-pass: suma cantidades por (IR, ítem). Cuando la RA tiene dos o más líneas del mismo ítem,
                // todas suman al mismo key para poder repartir el costo del IR proporcionalmente por cantidad.
                var totalQtyByIrItem = {};
                for (var niPre = 0; niPre < ncMaxPage; niPre++) {
                    var ncPagePre = ncSearchPagedData.fetch({ index: niPre });
                    for (var ndPre = 0; ndPre < ncPagePre.data.length; ndPre++) {
                        var rPre = ncPagePre.data[ndPre];
                        var raIdPre = rPre.getValue(ncCols.colCreatedFrom);
                        var irInfoPre = (raToItemReceiptCache && raIdPre) ? raToItemReceiptCache[raIdPre] : null;
                        var irIdPre = (irInfoPre && irInfoPre.id) ? String(irInfoPre.id) : '';
                        var itemIdPre = rPre.getValue(ncCols.colItem) || '';
                        var qtyPre = Math.abs(parseFloat(rPre.getValue(ncCols.colQuantity) || 0));
                        if (irIdPre && itemIdPre !== '') {
                            var keyPre = irIdPre + '_' + String(itemIdPre);
                            totalQtyByIrItem[keyPre] = (totalQtyByIrItem[keyPre] || 0) + qtyPre;
                        }
                    }
                }
                if (NC_LOG_RA_FILTER && raToItemReceiptCache && raToItemReceiptCache[NC_LOG_RA_FILTER]) {
                    var irIdLog = raToItemReceiptCache[NC_LOG_RA_FILTER].id;
                    var prefix = String(irIdLog) + '_';
                    var parts = [];
                    for (var k in totalQtyByIrItem) { if (k.indexOf(prefix) === 0) parts.push(k.replace(prefix, 'item=') + ' totalQty=' + totalQtyByIrItem[k]); }
                    if (parts.length) log.audit('ReporteRentabilidad NC', 'RA=' + NC_LOG_RA_FILTER + ' IR=' + irIdLog + ' totalQty por item: ' + parts.join(', '));
                }
                for (var ni = 0; ni < ncMaxPage && !hitMaxRows; ni++) {
                    var ncPage = ncSearchPagedData.fetch({ index: ni });
                    for (var nd = 0; nd < ncPage.data.length; nd++) {
                        if (maxRows != null && results.length >= maxRows) { hitMaxRows = true; break; }
                        var ncResult = ncPage.data[nd];
                        var ncId = ncResult.getValue(ncCols.colInternalId);
                        if (filters.creditMemoId && String(ncId) !== String(filters.creditMemoId)) { continue; }
                        var raId = ncResult.getValue(ncCols.colCreatedFrom);
                        var raTranId = ncResult.getText(ncCols.colReturnAuthTranId) || ncResult.getValue(ncCols.colReturnAuthTranId) || '';
                        var irInfo = (raToItemReceiptCache && raId) ? raToItemReceiptCache[raId] : null;
                        var irTranId = (irInfo && irInfo.tranid) ? irInfo.tranid : '';
                        var irId = (irInfo && irInfo.id) ? irInfo.id : null;
                        var ncLineItemId = ncResult.getValue(ncCols.colItem) || '';
                        var ncLineQty = Math.abs(parseFloat(ncResult.getValue(ncCols.colQuantity) || 0));
                        var costoIr = 0;
                        var costoMetodo = '';
                        if (irId && itemReceiptImpactCache && itemReceiptImpactCache[irId] && ncLineItemId) {
                            var irData = itemReceiptImpactCache[irId];
                            var itemKey = String(ncLineItemId);
                            var qtyKey = String(Math.round(ncLineQty * 1e4) / 1e4);
                            if (irData.byItemQty && irData.byItemQty[itemKey] && irData.byItemQty[itemKey][qtyKey] != null) {
                                costoIr = irData.byItemQty[itemKey][qtyKey] || 0;
                                costoMetodo = 'byItemQty';
                            } else if (irData.byItem && irData.byItem[itemKey] != null) {
                                var totalCostItem = irData.byItem[itemKey] || 0;
                                var keyIrItem = String(irId) + '_' + itemKey;
                                var totalQtyItem = totalQtyByIrItem[keyIrItem] || 0;
                                // Reparto proporcional: cuando la RA tiene varias líneas del mismo ítem, cada línea
                                // recibe (totalCostItem * ncLineQty / totalQtyItem) para que los costos no se dupliquen.
                                if (totalQtyItem > 0 && ncLineQty > 0) {
                                    costoIr = totalCostItem * (ncLineQty / totalQtyItem);
                                    costoMetodo = 'proporcional';
                                } else {
                                    costoIr = totalCostItem;
                                    costoMetodo = 'byItem';
                                }
                            }
                        }
                        var logNcCost = (!NC_LOG_RA_FILTER || String(raId) === NC_LOG_RA_FILTER) && _ncCostLogCount < _ncCostLogLimit;
                        if (logNcCost && (irId || costoIr)) {
                            var irDataLog = (itemReceiptImpactCache && irId && itemReceiptImpactCache[irId]) ? itemReceiptImpactCache[irId] : null;
                            var totalCostItemLog = (irDataLog && irDataLog.byItem) ? (irDataLog.byItem[String(ncLineItemId)] || 0) : 0;
                            var totalQtyItemLog = totalQtyByIrItem[String(irId) + '_' + String(ncLineItemId)] || 0;
                            log.audit('ReporteRentabilidad NC', 'Costo NC raId=' + raId + ' irId=' + (irId || '') + ' item=' + ncLineItemId + ' ncLineQty=' + ncLineQty + ' totalQtyItem=' + totalQtyItemLog + ' totalCostItem=' + totalCostItemLog + ' metodo=' + (costoMetodo || '-') + ' costoIr=' + costoIr);
                            _ncCostLogCount++;
                        }
                        if (filters.creditMemoId && (String(ncId) === String(filters.creditMemoId) || results.length < 3)) {
                            log.audit('ReporteRentabilidad', 'NC fila ncId=' + ncId + ' raId=' + raId + ' raTranId=' + raTranId + ' irId=' + (irId || '') + ' irTranId=' + irTranId + ' itemId=' + ncLineItemId + ' costoIr=' + costoIr);
                        }
                        var rowNc = {
                            customForm: ncResult.getText(ncCols.colCustomForm) || ncResult.getValue(ncCols.colCustomForm),
                            fecha: ncResult.getValue(ncCols.colTranDate),
                            periodo: ncResult.getText(ncCols.colPeriod) || ncResult.getValue(ncCols.colPeriod),
                            postingPeriodId: ncResult.getValue(ncCols.colPeriod) || '',
                            claseId: ncResult.getValue(ncCols.colItemClassification) || '',
                            giroIndustrialId: ncResult.getValue(ncCols.colCustomerMainGIRO) || '',
                            type: 'Nota de crédito',
                            clase: ncResult.getText(ncCols.colItemClassification) || ncResult.getValue(ncCols.colItemClassification),
                            ubicacion: ncResult.getText(ncCols.colLocation) || ncResult.getValue(ncCols.colLocation),
                            ubicacionId: ncResult.getValue(ncCols.colLocation) || '',
                            numeroDocumento: '',
                            notaCreditoNumero: ncResult.getValue(ncCols.colTranId) || '',
                            returnAuthorizationTranId: raTranId,
                            itemReceiptTranId: irTranId,
                            cliente: ncResult.getText(ncCols.colEntity) || ncResult.getValue(ncCols.colEntity),
                            giroIndustrial: ncResult.getText(ncCols.colCustomerMainGIRO) || ncResult.getValue(ncCols.colCustomerMainGIRO),
                            articulo: ncResult.getText(ncCols.colItem) || ncResult.getValue(ncCols.colItem),
                            representanteVenta: ncResult.getText(ncCols.colSalesRep) || ncResult.getValue(ncCols.colSalesRep),
                            representanteVentaId: ncResult.getValue(ncCols.colSalesRep) || '',
                            cantidad: parseFloat(ncResult.getValue(ncCols.colQuantity) || 0),
                            importe: parseFloat(ncResult.getValue(ncCols.colAmount) || 0),
                            metodoEntrega: ncResult.getText(ncCols.colMetodoEntrega) || ncResult.getValue(ncCols.colMetodoEntrega),
                            terminos: ncResult.getText(ncCols.colTerms) || ncResult.getValue(ncCols.colTerms) || '',
                            fechaAjustadaVencimiento: ncResult.getValue(ncCols.colFechaAjustadaVenc) || '',
                            proveedor: ncResult.getText(ncCols.colVendor) || ncResult.getValue(ncCols.colVendor) || '',
                            objetoImpuesto: ncResult.getText(ncCols.colTaxObject) || ncResult.getValue(ncCols.colTaxObject) || '',
                            tipoCambio: parseFloat(ncResult.getValue(ncCols.colTipoCambio) || 0),
                            moneda: ncResult.getText(ncCols.colCurrency) || ncResult.getValue(ncCols.colCurrency),
                            taxCode: ncResult.getText(ncCols.colTaxCode) || ncResult.getValue(ncCols.colTaxCode),
                            taxItem: ncResult.getText(ncCols.colTaxItem) || ncResult.getValue(ncCols.colTaxItem),
                            costoTransporteCreated: 0,
                            salesOrderTranId: '',
                            fulfillmentTranId: '',
                            costo: costoIr ? -(Math.abs(costoIr)) : 0,
                            articuloId: ncResult.getValue(ncCols.colItem) || '',
                            clienteId: ncResult.getValue(ncCols.colEntity) || '',
                            proveedorId: ncResult.getValue(ncCols.colVendor) || '',
                            invoiceId: ncId,
                            salesOrderId: '',
                            fulfillmentId: '',
                            accountingImpact: costoIr ? -(Math.abs(costoIr)) : 0
                        };
                        var factorNc = getFactorDescuentoProveedor(rowNc);
                        rowNc.factorDescuento = factorNc != null ? factorNc : 0;
                        var empIdStrNc = String(rowNc.representanteVentaId || '');
                        var comGerNc = getComisionesGerentes(empIdStrNc);
                        if (comGerNc) {
                            rowNc.porcentajeComisionRosario = comGerNc.rosario || 0;
                            rowNc.porcentajeComisionAlhely = comGerNc.alhely || 0;
                            rowNc.porcentajeComisionGabriela = comGerNc.gabriela || 0;
                            rowNc.porcentajeComisionMineria = comGerNc.mineria || 0;
                            rowNc.porcentajeComisionAgro = comGerNc.agro || 0;
                            var otrosResultNc = getPorcentajeOtrosCompensacionClienteArticulo(rowNc);
                            rowNc.porcentajeComisionOtros = (otrosResultNc.tipo === 'porcentaje') ? otrosResultNc.valor : 0;
                            rowNc.otrosCostoFijoTon = (otrosResultNc.tipo === 'costo_fijo') ? otrosResultNc.valor : null;
                            rowNc.porcentajeComisionTotal = (rowNc.porcentajeComisionRosario || 0) + (rowNc.porcentajeComisionAlhely || 0) + (rowNc.porcentajeComisionGabriela || 0) + (rowNc.porcentajeComisionMineria || 0) + (rowNc.porcentajeComisionAgro || 0) + (rowNc.porcentajeComisionPrieto || 0) + (rowNc.porcentajeComisionOtros || 0);
                        } else {
                            rowNc.porcentajeComisionRosario = 0;
                            rowNc.porcentajeComisionAlhely = 0;
                            rowNc.porcentajeComisionGabriela = 0;
                            rowNc.porcentajeComisionMineria = 0;
                            rowNc.porcentajeComisionAgro = 0;
                            rowNc.porcentajeComisionPrieto = 0;
                            var otrosResultNcElse = getPorcentajeOtrosCompensacionClienteArticulo(rowNc);
                            rowNc.porcentajeComisionOtros = (otrosResultNcElse.tipo === 'porcentaje') ? otrosResultNcElse.valor : 0;
                            rowNc.otrosCostoFijoTon = (otrosResultNcElse.tipo === 'costo_fijo') ? otrosResultNcElse.valor : null;
                            rowNc.porcentajeComisionTotal = rowNc.porcentajeComisionOtros || 0;
                        }
                        rowNc.notaCreditoProveedor = (rowNc.tipoCambio || 0) * (rowNc.cantidad || 0) * (rowNc.factorDescuento || 0);
                        rowNc.transporte = (rowNc.cantidad || 0) * (rowNc.costoTransporteCreated || 0);
                        rowNc.costoTotal = (rowNc.costo || 0) + (rowNc.transporte || 0) - (rowNc.notaCreditoProveedor || 0);
                        rowNc.utilidadBruta = (rowNc.importe || 0) - (rowNc.costoTotal || 0);
                        rowNc.margenMN = (rowNc.importe > 0) ? ((rowNc.utilidadBruta || 0) / rowNc.importe) : 0;
                        var tcNc = rowNc.tipoCambio || 0;
                        if (tcNc > 0) {
                            rowNc.ingresoUSD = (rowNc.importe || 0) / tcNc;
                            rowNc.costoUSD = (rowNc.costo || 0) / tcNc;
                            rowNc.transporteUSD = (rowNc.transporte || 0) / tcNc;
                            rowNc.notaCreditoProveedorUSD = (rowNc.notaCreditoProveedor || 0) / tcNc;
                            rowNc.costoTotalUSD = (rowNc.costoTotal || 0) / tcNc;
                            rowNc.utilidadBrutaUSD = (rowNc.utilidadBruta || 0) / tcNc;
                        } else {
                            rowNc.ingresoUSD = 0;
                            rowNc.costoUSD = 0;
                            rowNc.transporteUSD = 0;
                            rowNc.notaCreditoProveedorUSD = 0;
                            rowNc.costoTotalUSD = 0;
                            rowNc.utilidadBrutaUSD = 0;
                        }
                        var tipoCambioInternoNc = filters.tipoCambioInterno || 18;
                        rowNc.tipoCambioInterno = tipoCambioInternoNc;
                        rowNc.ingresoCasa = (rowNc.ingresoUSD || 0) * tipoCambioInternoNc;
                        results.push(rowNc);
                    }
                }
            }
            
            log.audit('ReporteRentabilidad', 'Paso 3 results.length=' + results.length + (maxRows != null && hitMaxRows ? ' (límite ' + maxRows + ')' : ''));
            if (ncSearchPagedData && ncCappedForView) cappedForView = true;
            if (cappedForView) {
                return {
                    results: results,
                    partialView: true,
                    partialMessage: 'Se mostraron los primeros ' + (MAX_PAGES_VIEW * 1000) + ' registros por límite de tiempo. Use filtros más restrictivos o exportar CSV para ver todo.'
                };
            }
            return { results: results, partialView: false, partialMessage: '' };
        }
        
        /** Cache por Sales Order para no repetir búsqueda de fulfillments (mismo SO en muchas líneas) */
        var fulfillmentsBySOCache = null;
        
        /**
         * Obtiene los Item Fulfillments relacionados con un Sales Order (usa cache por request)
         */
        function getItemFulfillmentsBySalesOrder(salesOrderId) {
            if (!salesOrderId) {
                return [];
            }
            if (!fulfillmentsBySOCache) {
                fulfillmentsBySOCache = {};
            }
            if (fulfillmentsBySOCache[salesOrderId]) {
                return fulfillmentsBySOCache[salesOrderId];
            }
            var fulfillments = [];
            try {
                var fulfillmentSearch = search.create({
                    type: 'itemfulfillment',
                    filters: [['createdfrom', 'anyof', salesOrderId]],
                    columns: [
                        search.createColumn({ name: 'internalid' }),
                        search.createColumn({ name: 'tranid' })
                    ]
                });
                fulfillmentSearch.run().each(function(result) {
                    fulfillments.push({
                        id: result.getValue('internalid'),
                        tranid: result.getValue('tranid')
                    });
                    return true;
                });
            } catch (e) {
                // Sin log por cada fallo; las filas sin fulfillment siguen con costo 0
            }
            fulfillmentsBySOCache[salesOrderId] = fulfillments;
            return fulfillments;
        }
        
        /** Límite de páginas por lote en precarga de fulfillments (evita timeout si un SO tiene miles de IF) */
        var MAX_FULFILLMENT_PAGES_PER_BATCH = 20;
        
        /**
         * Precarga Item Fulfillments para una lista de Sales Order IDs (una o pocas búsquedas globales).
         * Filtro único: createdfrom anyof [ids]. Sin filtro de fecha; los IDs vienen de la búsqueda de facturas.
         */
        function preloadFulfillmentsBySalesOrders(salesOrderIds) {
            if (!salesOrderIds || salesOrderIds.length === 0) return;
            if (!fulfillmentsBySOCache) fulfillmentsBySOCache = {};
            var BATCH = 500;
            var numBatches = Math.ceil(salesOrderIds.length / BATCH);
            log.audit('ReporteRentabilidad', 'Paso 2 inicio preload fulfillments; SOs=' + salesOrderIds.length + ' batches=' + numBatches);
            for (var b = 0; b < salesOrderIds.length; b += BATCH) {
                var batch = salesOrderIds.slice(b, b + BATCH);
                var batchNum = Math.floor(b / BATCH) + 1;
                try {
                    var fulfillmentSearch = search.create({
                        type: 'itemfulfillment',
                        filters: [['createdfrom', 'anyof', batch]],
                        columns: [
                            search.createColumn({ name: 'createdfrom' }),
                            search.createColumn({ name: 'internalid' }),
                            search.createColumn({ name: 'tranid' })
                        ]
                    });
                    var paged = fulfillmentSearch.runPaged({ pageSize: 1000 });
                    var totalFulfillmentPages = paged.pageRanges.length;
                    var pagesToProcess = Math.min(totalFulfillmentPages, MAX_FULFILLMENT_PAGES_PER_BATCH);
                    if (totalFulfillmentPages > MAX_FULFILLMENT_PAGES_PER_BATCH) {
                        log.audit('ReporteRentabilidad', 'Paso 2 batch ' + batchNum + ' limitado a ' + pagesToProcess + ' de ' + totalFulfillmentPages + ' páginas (evitar timeout)');
                    }
                    for (var pi = 0; pi < pagesToProcess; pi++) {
                        var page = paged.fetch({ index: pi });
                        page.data.forEach(function(res) {
                            var soId = res.getValue('createdfrom');
                            if (!soId) return;
                            if (!fulfillmentsBySOCache[soId]) fulfillmentsBySOCache[soId] = [];
                            fulfillmentsBySOCache[soId].push({
                                id: res.getValue('internalid'),
                                tranid: res.getValue('tranid')
                            });
                        });
                    }
                    log.audit('ReporteRentabilidad', 'Paso 2 batch ' + batchNum + '/' + numBatches + ' listo; páginas=' + pagesToProcess);
                } catch (e) {
                    // Si falla un lote, ese lote queda sin fulfillments en cache
                }
            }
        }
        
        /**
         * Precarga el impacto contable (cuenta 5100) de muchos fulfillments en pocas búsquedas.
         * Reduce gobierno: 1 búsqueda por lote de fulfillments en lugar de 1 por fulfillment.
         */
        function preloadFulfillmentAccountingImpact(account5100Id) {
            if (!account5100Id || !fulfillmentsBySOCache) return;
            if (!fulfillmentImpactCache) fulfillmentImpactCache = {};
            var fulfillmentIds = [];
            Object.keys(fulfillmentsBySOCache).forEach(function(soId) {
                var list = fulfillmentsBySOCache[soId];
                if (list && list.length > 0) {
                    list.forEach(function(f) {
                        if (f && f.id) fulfillmentIds.push(f.id);
                    });
                }
            });
            var seen = {};
            fulfillmentIds = fulfillmentIds.filter(function(id) {
                if (seen[id]) return false;
                seen[id] = true;
                return true;
            });
            log.audit('ReporteRentabilidad', 'Paso 2b inicio impacto 5100; fulfillments=' + fulfillmentIds.length);
            var BATCH = 100;
            for (var b = 0; b < fulfillmentIds.length; b += BATCH) {
                var batch = fulfillmentIds.slice(b, b + BATCH);
                var batchNum = Math.floor(b / BATCH) + 1;
                try {
                    var postingSearch = search.create({
                        type: 'transaction',
                        filters: [
                            ['internalid', 'anyof', batch],
                            'AND', ['account', 'anyof', account5100Id],
                            'AND', ['posting', 'is', 'T'],
                            'AND', ['mainline', 'is', 'F']
                        ],
                        columns: [
                            search.createColumn({ name: 'internalid' }),
                            search.createColumn({ name: 'amount' }),
                            search.createColumn({ name: 'item' }),
                            search.createColumn({ name: 'quantity' })
                        ]
                    });
                    var byFulfillment = {};
                    batch.forEach(function(fid) {
                        byFulfillment[String(fid)] = { byItem: {}, total: 0 };
                    });
                    var paged = postingSearch.runPaged({ pageSize: 1000 });
                    var impactPages = paged.pageRanges.length;
                    var impactPagesToProcess = Math.min(impactPages, MAX_FULFILLMENT_PAGES_PER_BATCH);
                    for (var pi = 0; pi < impactPagesToProcess; pi++) {
                        var page = paged.fetch({ index: pi });
                        page.data.forEach(function(result) {
                            var fid = result.getValue('internalid');
                            var amount = parseFloat(result.getValue('amount') || 0);
                            var absAmount = Math.abs(amount);
                            var itemId = result.getValue('item');
                            var key = fid != null && fid !== '' ? String(fid) : null;
                            if (!key || !byFulfillment[key]) return;
                            byFulfillment[key].total += absAmount;
                            if (itemId != null && itemId !== '') {
                                var itemKey = String(itemId);
                                byFulfillment[key].byItem[itemKey] = (byFulfillment[key].byItem[itemKey] || 0) + absAmount;
                            }
                        });
                    }
                    Object.keys(byFulfillment).forEach(function(fid) {
                        fulfillmentImpactCache[fid] = byFulfillment[fid];
                    });
                    log.audit('ReporteRentabilidad', 'Paso 2b batch impacto ' + batchNum + ' listo');
                } catch (e) {
                    // Lote fallido: esos fulfillments se resolverán on-demand en getFulfillmentAccountingImpact
                }
            }
        }
        
        /**
         * Precarga cantidades por ítem (sublist) solo para EPAs de OVs que tienen más de una EPA.
         * Búsquedas por LOTES de internalid (no una por EPA): evita agotar gobierno cuando hay cientos de EPAs (p. ej. Map/Reduce mensual).
         */
        function preloadFulfillmentLineQtyForMultiEPA() {
            if (!fulfillmentsBySOCache || !fulfillmentLineQtyCache) return;
            var fulfillmentIds = [];
            Object.keys(fulfillmentsBySOCache).forEach(function(soId) {
                var list = fulfillmentsBySOCache[soId];
                if (list && list.length > 1) {
                    list.forEach(function(f) {
                        if (f && f.id && fulfillmentLineQtyCache[f.id] === undefined) fulfillmentIds.push(f.id);
                    });
                }
            });
            var seen = {};
            fulfillmentIds = fulfillmentIds.filter(function(id) {
                var s = String(id);
                if (seen[s]) return false;
                seen[s] = true;
                return true;
            });
            if (fulfillmentIds.length === 0) return;
            log.audit('ReporteRentabilidad', 'Paso 2a precarga cantidades EPA (OV con 2+ EPAs): ' + fulfillmentIds.length + ' EPA(s), por lotes');
            var colTrxId = search.createColumn({ name: 'internalid' });
            var colItem = search.createColumn({ name: 'item' });
            var colQty = search.createColumn({ name: 'quantity' });
            var i;
            for (i = 0; i < fulfillmentIds.length; i++) {
                fulfillmentLineQtyCache[String(fulfillmentIds[i])] = { byItemQty: {} };
            }
            var seenKeysByFid = {};
            var EPA_LINE_BATCH = 50;
            for (var b = 0; b < fulfillmentIds.length; b += EPA_LINE_BATCH) {
                var batch = fulfillmentIds.slice(b, b + EPA_LINE_BATCH);
                try {
                    var sBatch = search.create({
                        type: 'transaction',
                        filters: [
                            ['internalid', 'anyof', batch],
                            'AND', ['type', 'anyof', 'ItemShip'],
                            'AND', ['mainline', 'is', 'F']
                        ],
                        columns: [colTrxId, colItem, colQty]
                    });
                    sBatch.run().each(function(r) {
                        var trxId = String(r.getValue(colTrxId) || '');
                        if (!trxId || !fulfillmentLineQtyCache[trxId]) return true;
                        var sk = seenKeysByFid[trxId];
                        if (!sk) {
                            sk = {};
                            seenKeysByFid[trxId] = sk;
                        }
                        var it = r.getValue(colItem);
                        var q = parseFloat(r.getValue(colQty) || 0);
                        if (it == null || it === '' || isNaN(q)) return true;
                        var k = String(it);
                        var absQ = Math.abs(q);
                        var dedupKey = k + '_' + absQ;
                        if (sk[dedupKey]) return true;
                        sk[dedupKey] = true;
                        var bucket = fulfillmentLineQtyCache[trxId].byItemQty;
                        bucket[k] = (bucket[k] || 0) + absQ;
                        return true;
                    });
                } catch (e) {
                    log.error('ReporteRentabilidad preloadFulfillmentLineQtyForMultiEPA batch', (e.message || e) + ' batchStart=' + b);
                }
            }
            var withData = 0;
            for (var j = 0; j < fulfillmentIds.length; j++) {
                var fid2 = String(fulfillmentIds[j]);
                if (fulfillmentLineQtyCache[fid2] && Object.keys(fulfillmentLineQtyCache[fid2].byItemQty || {}).length > 0) withData++;
            }
            log.audit('ReporteRentabilidad', 'Paso 2a cantidades EPA precargadas: ' + withData + '/' + fulfillmentIds.length + ' EPAs con datos');
        }
        
        /** Cache del internalid de la cuenta 5100 (una búsqueda por request) */
        var account5100IdCache = null;
        /** Cache de costo por fulfillment (evita repetir búsqueda de posting para el mismo fulfillment) */
        var fulfillmentImpactCache = null;
        /** Cache RA id → Item Receipt { id, tranid } (para NC; IR.createdfrom = RA) */
        var raToItemReceiptCache = null;
        /** Cache impacto contable por Item Receipt (internalid → { byItem: {}, total }); sin filtro de cuenta */
        var itemReceiptImpactCache = null;
        
        /**
         * Precarga Item Receipts por Return Authorization (IR.createdfrom = RA). Un IR por RA (el primero).
         */
        function preloadItemReceiptsByReturnAuths(returnAuthIds) {
            if (!returnAuthIds || returnAuthIds.length === 0) return;
            if (!raToItemReceiptCache) raToItemReceiptCache = {};
            var BATCH = 500;
            log.audit('ReporteRentabilidad', 'Paso 1c Item Receipt search: type=ItemRcpt createdfrom anyof [' + returnAuthIds.length + ' RAs] primeros=' + returnAuthIds.slice(0, 5).join(','));
            for (var b = 0; b < returnAuthIds.length; b += BATCH) {
                var batch = returnAuthIds.slice(b, b + BATCH);
                try {
                    var irSearch = search.create({
                        type: 'transaction',
                        filters: [
                            ['type', 'anyof', 'ItemRcpt'],
                            'AND', ['createdfrom', 'anyof', batch]
                        ],
                        columns: [
                            search.createColumn({ name: 'createdfrom' }),
                            search.createColumn({ name: 'internalid' }),
                            search.createColumn({ name: 'tranid' }),
                            search.createColumn({ name: 'type' })
                        ]
                    });
                    var paged = irSearch.runPaged({ pageSize: 1000 });
                    var totalIrPages = paged.pageRanges.length;
                    var irResultsLog = [];
                    var pagesToProcess = Math.min(totalIrPages, MAX_FULFILLMENT_PAGES_PER_BATCH);
                    for (var pi = 0; pi < pagesToProcess; pi++) {
                        var page = paged.fetch({ index: pi });
                        page.data.forEach(function(res) {
                            var raId = res.getValue('createdfrom');
                            var irId = res.getValue('internalid');
                            var tranid = res.getValue('tranid') || '';
                            var txType = res.getValue('type') || '';
                            if (irResultsLog.length < 20) irResultsLog.push('IR id=' + irId + ' tranid=' + tranid + ' createdfrom=' + raId + ' type=' + txType);
                            if (!raId) return;
                            if (!raToItemReceiptCache[raId]) {
                                raToItemReceiptCache[raId] = {
                                    id: irId,
                                    tranid: tranid
                                };
                            }
                        });
                    }
                    if (irResultsLog.length > 0) {
                        log.audit('ReporteRentabilidad', 'Paso 1c Item Receipt resultados: totalPáginas=' + totalIrPages + ' filas (muestra): ' + irResultsLog.join(' | '));
                    }
                    if (totalIrPages === 0) {
                        log.audit('ReporteRentabilidad', 'Paso 1c Item Receipt 0 resultados para RA batch (primeros)=' + batch.slice(0, 5).join(','));
                        if (batch.length <= 10) {
                            try {
                                var diagSearch = search.create({
                                    type: 'transaction',
                                    filters: [['createdfrom', 'anyof', batch]],
                                    columns: [
                                        search.createColumn({ name: 'type' }),
                                        search.createColumn({ name: 'internalid' }),
                                        search.createColumn({ name: 'tranid' }),
                                        search.createColumn({ name: 'createdfrom' })
                                    ]
                                });
                                var diagPaged = diagSearch.runPaged({ pageSize: 100 });
                                var diagTypes = [];
                                var diagCount = 0;
                                diagPaged.pageRanges.forEach(function(_, idx) {
                                    if (idx >= 2) return;
                                    var p = diagPaged.fetch({ index: idx });
                                    p.data.forEach(function(row) {
                                        diagCount++;
                                        if (diagTypes.length < 15) diagTypes.push(row.getValue('type') + '(id=' + row.getValue('internalid') + ',from=' + row.getValue('createdfrom') + ')');
                                    });
                                });
                                log.audit('ReporteRentabilidad', 'Paso 1c diagnóstico: transacciones con createdfrom=RA (sin filtro type): count=' + diagCount + ' tipos=' + diagTypes.join(', '));
                            } catch (diagE) {
                                log.audit('ReporteRentabilidad', 'Paso 1c diagnóstico error: ' + (diagE.message || diagE));
                            }
                        }
                    }
                } catch (e) {
                    log.error('ReporteRentabilidad preloadItemReceiptsByReturnAuths', e.message || e);
                    log.audit('ReporteRentabilidad', 'Paso 1c Item Receipt search error batch RA (primeros 5)=' + batch.slice(0, 5).join(','));
                }
            }
        }
        
        /**
         * Precarga impacto contable (posting) de Item Receipts. Filtro por cuenta 5100 Materia Prima (igual que fulfillments).
         */
        function preloadItemReceiptAccountingImpact(itemReceiptIds, account5100Id) {
            if (!itemReceiptIds || itemReceiptIds.length === 0) return;
            if (!itemReceiptImpactCache) itemReceiptImpactCache = {};
            var BATCH = 100;
            for (var b = 0; b < itemReceiptIds.length; b += BATCH) {
                var batch = itemReceiptIds.slice(b, b + BATCH);
                var irFilters = [
                    ['internalid', 'anyof', batch],
                    'AND', ['posting', 'is', 'T'],
                    'AND', ['mainline', 'is', 'F']
                ];
                if (account5100Id) {
                    irFilters.push('AND');
                    irFilters.push(['account', 'anyof', account5100Id]);
                }
                try {
                    var colIrId = search.createColumn({ name: 'internalid' });
                    var colAmount = search.createColumn({ name: 'amount' });
                    var colItem = search.createColumn({ name: 'item' });
                    var colQty = search.createColumn({ name: 'quantity' });
                    var postingSearch = search.create({
                        type: 'transaction',
                        filters: irFilters,
                        columns: [colIrId, colAmount, colItem, colQty]
                    });
                    var byIr = {};
                    batch.forEach(function(irId) {
                        byIr[String(irId)] = { byItem: {}, byItemQty: {}, total: 0 };
                    });
                    var paged = postingSearch.runPaged({ pageSize: 1000 });
                    var pagesToProcess = Math.min(paged.pageRanges.length, MAX_FULFILLMENT_PAGES_PER_BATCH);
                    for (var pi = 0; pi < pagesToProcess; pi++) {
                        var page = paged.fetch({ index: pi });
                        page.data.forEach(function(result) {
                            var irId = result.getValue(colIrId);
                            var amount = parseFloat(result.getValue(colAmount) || 0);
                            var absAmount = Math.abs(amount);
                            var itemId = result.getValue(colItem);
                            var qty = parseFloat(result.getValue(colQty) || 0);
                            var key = irId != null && irId !== '' ? String(irId) : null;
                            if (!key || !byIr[key]) return;
                            byIr[key].total += absAmount;
                            if (itemId != null && itemId !== '') {
                                var itemKey = String(itemId);
                                byIr[key].byItem[itemKey] = (byIr[key].byItem[itemKey] || 0) + absAmount;
                                var qtyKey = isNaN(qty) ? '' : String(Math.round(qty * 1e4) / 1e4);
                                if (qtyKey !== '') {
                                    if (!byIr[key].byItemQty[itemKey]) byIr[key].byItemQty[itemKey] = {};
                                    byIr[key].byItemQty[itemKey][qtyKey] = (byIr[key].byItemQty[itemKey][qtyKey] || 0) + absAmount;
                                }
                            }
                        });
                    }
                    Object.keys(byIr).forEach(function(irId) {
                        itemReceiptImpactCache[irId] = byIr[irId];
                    });
                } catch (e) {
                    log.error('ReporteRentabilidad preloadItemReceiptAccountingImpact', e.message || e);
                }
            }
        }
        
        /**
         * Obtiene el internalid de la cuenta 5100 (Materia Prima). Una sola búsqueda por request.
         */
        function getAccount5100Id() {
            if (account5100IdCache !== null) {
                return account5100IdCache;
            }
            try {
                var accountSearch = search.create({
                    type: 'account',
                    filters: [['number', 'is', '5100']],
                    columns: [search.createColumn({ name: 'internalid' })]
                });
                var id = null;
                accountSearch.run().each(function(result) {
                    id = result.getValue('internalid');
                    return false;
                });
                account5100IdCache = id;
                return id;
            } catch (e) {
                account5100IdCache = '';
                return '';
            }
        }
        
        /**
         * Carga y cachea el impacto contable del Item Fulfillment por ítem (cuenta 5100).
         * Devuelve { byItem: { itemId: sumaMontos }, total: number }.
         * Así cada línea de factura puede tomar solo el costo del ítem correspondiente.
         */
        function getFulfillmentAccountingImpact(fulfillmentId, optionalAccountId) {
            if (!fulfillmentId) {
                return { byItem: {}, total: 0 };
            }
            if (!fulfillmentImpactCache) {
                fulfillmentImpactCache = {};
            }
            if (fulfillmentImpactCache[fulfillmentId] !== undefined) {
                return fulfillmentImpactCache[fulfillmentId];
            }
            try {
                var accountId = optionalAccountId || getAccount5100Id();
                if (!accountId) {
                    fulfillmentImpactCache[fulfillmentId] = { byItem: {}, total: 0 };
                    return fulfillmentImpactCache[fulfillmentId];
                }
                var postingSearch = search.create({
                    type: 'transaction',
                    filters: [
                        ['internalid', 'anyof', fulfillmentId],
                        'AND', ['account', 'anyof', accountId],
                        'AND', ['posting', 'is', 'T'],
                        'AND', ['mainline', 'is', 'F']
                    ],
                    columns: [
                        search.createColumn({ name: 'amount' }),
                        search.createColumn({ name: 'item' }),
                        search.createColumn({ name: 'quantity' })
                    ]
                });
                var byItem = {};
                var byItemQty = {};
                var totalCosto = 0;
                var paged = postingSearch.runPaged({ pageSize: 1000 });
                for (var pi = 0; pi < paged.pageRanges.length; pi++) {
                    var page = paged.fetch({ index: pi });
                    page.data.forEach(function(result) {
                        var amount = parseFloat(result.getValue('amount') || 0);
                        var absAmount = Math.abs(amount);
                        var itemId = result.getValue('item');
                        if (itemId != null && itemId !== '') {
                            var key = String(itemId);
                            byItem[key] = (byItem[key] || 0) + absAmount;
                            var qty = Math.abs(parseFloat(result.getValue('quantity') || 0));
                            byItemQty[key] = (byItemQty[key] || 0) + (isNaN(qty) ? 0 : qty);
                        }
                        totalCosto += absAmount;
                    });
                }
                fulfillmentImpactCache[fulfillmentId] = { byItem: byItem, byItemQty: byItemQty, total: totalCosto };
                return fulfillmentImpactCache[fulfillmentId];
            } catch (e) {
                // No cachear fallo: evita que un error (p. ej. gobierno) deje 0 en todas las filas que usan este fulfillment
                return { byItem: {}, total: 0 };
            }
        }
        
        /**
         * Devuelve el impacto contable (cuenta 5100) del fulfillment solo para el ítem indicado.
         * Así cada línea de factura lleva el costo correcto por ítem y no el total del fulfillment.
         */
        function getFulfillmentAccountingImpactByItem(fulfillmentId, itemId, optionalAccountId) {
            if (!fulfillmentId || itemId == null || itemId === '') {
                return 0;
            }
            var data = getFulfillmentAccountingImpact(fulfillmentId, optionalAccountId);
            if (!data || !data.byItem) {
                return 0;
            }
            return data.byItem[String(itemId)] || 0;
        }

        /** Devuelve la cantidad total del ítem en el fulfillment (usando el mismo cache del impacto contable). */
        function getFulfillmentQtyByItem(fulfillmentId, itemId, optionalAccountId) {
            if (!fulfillmentId || itemId == null || itemId === '') {
                return 0;
            }
            var data = getFulfillmentAccountingImpact(fulfillmentId, optionalAccountId);
            if (!data || !data.byItemQty) {
                return 0;
            }
            return data.byItemQty[String(itemId)] || 0;
        }

        /** Cache: por fulfillmentId, { byItemQty: { itemId: qty } }. Sublist item, campo quantity (igual que en factura). */
        var fulfillmentLineQtyCache = {};
        /** Contador para limitar logs EPA por ejecución (evitar saturar) */
        var _epaLogLimit = 50;
        var _epaLogCount = 0;
        /** Si está definido, solo se escriben logs EPA para esta orden de venta (ej: '1534167'). Dejar '' para loguear todas. */
        var EPA_LOG_SO_FILTER = '1534167';
        /** Si está definido, solo se escriben logs de costo NC para esta RA (ej: '1583900'). Dejar '' para loguear todas. */
        var NC_LOG_RA_FILTER = '1583900';
        var _ncCostLogCount = 0;
        var _ncCostLogLimit = 50;
        /**
         * Precarga cantidades por ítem desde la EPA (sublist item, quantity). Una búsqueda por EPA.
         * optionalSalesOrderId: si EPA_LOG_SO_FILTER está definido, solo se loguea cuando SO coincide.
         */
        function ensureFulfillmentLineQtyCache(fulfillmentIds, optionalSalesOrderId) {
            if (!fulfillmentIds || fulfillmentIds.length === 0) return;
            var missing = [];
            var seen = {};
            for (var m = 0; m < fulfillmentIds.length; m++) {
                var fid = String(fulfillmentIds[m]);
                if (fid && !seen[fid] && fulfillmentLineQtyCache[fid] === undefined) {
                    seen[fid] = true;
                    missing.push(fid);
                }
            }
            if (missing.length === 0) return;
            var logThisSO = !EPA_LOG_SO_FILTER || String(optionalSalesOrderId || '') === EPA_LOG_SO_FILTER;
            if (logThisSO) log.audit('ReporteRentabilidad EPA', 'Cargando cache cantidades EPA para SO=' + (optionalSalesOrderId || '') + ' ' + missing.length + ' EPA(s): ' + missing.join(', '));
            var idx;
            for (idx = 0; idx < missing.length; idx++) {
                fulfillmentLineQtyCache[missing[idx]] = { byItemQty: {} };
            }
            var colDocId = search.createColumn({ name: 'internalid' });
            var colItem = search.createColumn({ name: 'item' });
            var colQty = search.createColumn({ name: 'quantity' });
            var seenByDocItemQty = {};
            function runOneSearch(filters) {
                var s = search.create({ type: 'transaction', filters: filters, columns: [colDocId, colItem, colQty] });
                s.run().each(function(r) {
                    var docId = String(r.getValue(colDocId) || '');
                    if (!fulfillmentLineQtyCache[docId]) return true;
                    var it = r.getValue(colItem);
                    var q = parseFloat(r.getValue(colQty) || 0);
                    if (it == null || it === '' || isNaN(q)) return true;
                    var k = String(it);
                    var absQ = Math.abs(q);
                    var dedupKey = docId + '_' + k + '_' + absQ;
                    if (seenByDocItemQty[dedupKey]) return true;
                    seenByDocItemQty[dedupKey] = true;
                    fulfillmentLineQtyCache[docId].byItemQty[k] = (fulfillmentLineQtyCache[docId].byItemQty[k] || 0) + absQ;
                    return true;
                });
            }
            try {
                runOneSearch([
                    ['type', 'anyof', 'ItemFulfill'],
                    'AND', ['internalid', 'anyof', missing],
                    'AND', ['mainline', 'is', 'F']
                ]);
                var anyHasData = false;
                for (idx = 0; idx < missing.length; idx++) {
                    var byItem = fulfillmentLineQtyCache[missing[idx]].byItemQty;
                    if (Object.keys(byItem).length > 0) anyHasData = true;
                }
                if (!anyHasData) {
                    seenByDocItemQty = {};
                    runOneSearch([
                        ['internalid', 'anyof', missing],
                        'AND', ['mainline', 'is', 'F']
                    ]);
                }
            } catch (e) {
                try {
                    for (idx = 0; idx < missing.length; idx++) fulfillmentLineQtyCache[missing[idx]] = { byItemQty: {} };
                    seenByDocItemQty = {};
                    runOneSearch([
                        ['internalid', 'anyof', missing],
                        'AND', ['mainline', 'is', 'F']
                    ]);
                } catch (e2) {
                    for (idx = 0; idx < missing.length; idx++) fulfillmentLineQtyCache[missing[idx]] = { byItemQty: {} };
                    if (logThisSO && _epaLogCount < _epaLogLimit) log.audit('ReporteRentabilidad EPA', 'Error cargando EPAs ' + missing.join(',') + ': ' + (e.message || e2.message));
                }
            }
            for (idx = 0; idx < missing.length; idx++) {
                var fid = missing[idx];
                var byItem = fulfillmentLineQtyCache[fid].byItemQty;
                var itemCount = Object.keys(byItem).length;
                var totalQty = 0;
                var sample = [];
                for (var k in byItem) { totalQty += byItem[k]; sample.push(k + ':' + byItem[k]); if (sample.length >= 3) break; }
                if (logThisSO) log.audit('ReporteRentabilidad EPA', 'EPA id=' + fid + ' items=' + itemCount + ' totalQty=' + totalQty + (sample.length ? ' muestra=' + sample.join(', ') : ''));
            }
        }
        /**
         * Cantidad del ítem en el EPA (desde cache). El cache debe haberse llenado antes con ensureFulfillmentLineQtyCache.
         * Solo se usa cuando hay más de una EPA para matchear factura-EPA por cantidad.
         */
        function getFulfillmentLineQtyByItem(fulfillmentId, itemId) {
            if (!fulfillmentId || itemId == null || itemId === '') return 0;
            var data = fulfillmentLineQtyCache[String(fulfillmentId)];
            if (!data || !data.byItemQty) return 0;
            return data.byItemQty[String(itemId)] || 0;
        }

        /**
         * Calcula todas las fórmulas del Excel para cada fila
         */
        function calculateExcelFormulas(row) {
            // Según el Excel:
            // INGRESO = Importe (columna O)
            // Mapear campos del resultado de executeInvoiceSearch a los nombres usados en esta función
            row.amount = row.amount || row.importe || 0;
            row.quantity = row.quantity || row.cantidad || 0;
            row.tipoDeCambio = row.tipoDeCambio || row.tipoCambio || 0;
            row.costoUnitario = row.costoUnitario || (row.costoPorLineaV2 ? row.costoPorLineaV2 / (row.quantity || 1) : 0);
            row.costoPorLineaV2 = row.costoPorLineaV2 || row.costoPorLinea || 0;
            row.costoPorLinea = row.costoPorLinea || 0;
            row.montoBase = row.amount;
            
            // COSTO = Costo por línea (fulfillment cuenta 5100) o costo por línea de transacción
            row.costoBase = row.costo != null ? row.costo : (row.costoPorLinea || 0);
            
            // TRANSPORTE = total por línea (cantidad × unitario). Si ya viene row.transporte de la búsqueda, usarlo; si no, cantidad × costoTransporteCreated
            var qty = row.quantity != null ? row.quantity : (row.cantidad != null ? row.cantidad : 0);
            var unitTransport = row.costoTransportePorProducto != null ? row.costoTransportePorProducto : (row.costoTransporteCreated || 0);
            row.costoTransporteCalculado = (row.transporte != null && row.transporte !== undefined && !isNaN(row.transporte)) ? Number(row.transporte) : (qty * unitTransport);
            row.transporte = row.costoTransporteCalculado;
            
            // Nota Crédito Proveedor (descuento simulado): Tipo de Cambio × Cantidad × Factor Descuento
            row.notaCreditoProveedor = row.notaCreditoProveedor != null ? row.notaCreditoProveedor : 0;
            
            // COSTO TOTAL = COSTO + TRANSPORTE - notas credito proveedor
            row.costoTotal = row.costoBase + row.costoTransporteCalculado - row.notaCreditoProveedor;
            
            // UTILIDAD BRUTA = INGRESO - COSTO TOTAL
            row.utilidadBruta = row.montoBase - row.costoTotal;
            
            // Conversiones a USD
            // AS = AL / Y (conversión a USD)
            row.montoBaseUSD = row.tipoDeCambio > 0 ? row.montoBase / row.tipoDeCambio : 0;
            
            // AT = AM / Y (conversión a USD)
            row.costoBaseUSD = row.tipoDeCambio > 0 ? row.costoBase / row.tipoDeCambio : 0;
            
            // AN = N * Q (costo base por cantidad) - usando costoUnitario * quantity
            row.costoBasePorCantidad = (row.costoUnitario || row.costoPorLineaV2 / (row.quantity || 1)) * row.quantity;
            
            // AU = AN / Y (costo base por cantidad USD)
            row.costoBasePorCantidadUSD = row.tipoDeCambio > 0 ? row.costoBasePorCantidad / row.tipoDeCambio : 0;
            
            // AV = AO / Y (costo transporte USD)
            row.costoTransporteUSD = row.tipoDeCambio > 0 ? row.costoTransporteCalculado / row.tipoDeCambio : 0;
            
            // AW = COSTO USD + TRANSPORTE USD (costo total USD)
            // Según el Excel: COSTO TOTAL USD = COSTO USD + TRANSPORTE USD
            row.costoTotalUSD = row.costoBaseUSD + row.costoTransporteUSD;
            
            // AX = AS - AW (utilidad USD)
            // Utilidad USD = Monto Base USD - Costo Total USD
            row.utilidadUSD = row.montoBaseUSD - row.costoTotalUSD;
            
            // BH = BG / AL (margen) - donde BG = AQ - BF (utilidad después de comisiones)
            // Primero necesitamos calcular las comisiones
            var margen = row.montoBase > 0 ? row.utilidadBruta / row.montoBase : 0;
            row.margen = margen;
            
            // BI = LOOKUP(BH, PARAMETROS) - porcentaje de comisión según margen
            row.porcentajeComision = getComisionPorMargen(margen);
            
            // Comisión = % Comisión × Ingreso Casa (porcentaje en decimal: 0.75% → 0.0075)
            var pctComisionDec = (row.porcentajeComision || 0) > 0.02 ? (row.porcentajeComision / 100) : (row.porcentajeComision || 0);
            row.comisionTotal = pctComisionDec * (row.ingresoCasa || 0);
            
            // Para las comisiones por tipo (BK, BL, BM, BN) según el Excel:
            // BA, BB, BC, BD son porcentajes que vienen de otras reglas de negocio
            // Por ahora las dejamos en 0, pero se pueden configurar desde Custom Records
            row.porcentajeComisionTipoA = 0; // BA
            row.porcentajeComisionTipoB = 0; // BB
            row.porcentajeComisionTipoC = 0; // BC
            row.porcentajeComisionAdicional = 0; // BD
            
            // BK = BA * AZ (comisión tipo A)
            row.comisionTipoA = row.utilidadUSD * row.porcentajeComisionTipoA;
            
            // BL = BB * AZ (comisión tipo B)
            row.comisionTipoB = row.utilidadUSD * row.porcentajeComisionTipoB;
            
            // BM = BC * AZ (comisión tipo C)
            row.comisionTipoC = row.utilidadUSD * row.porcentajeComisionTipoC;
            
            // BN = BD * AZ (comisión adicional)
            row.comisionAdicional = row.utilidadUSD * row.porcentajeComisionAdicional;
            
            // BE = SUM(BA:BD) - suma de porcentajes
            row.sumaPorcentajesComision = row.porcentajeComisionTipoA + 
                                          row.porcentajeComisionTipoB + 
                                          row.porcentajeComisionTipoC + 
                                          row.porcentajeComisionAdicional;
            
            // BF = BE * AZ (comisión total por porcentajes)
            row.comisionTotalPorcentajes = row.sumaPorcentajesComision * row.utilidadUSD;
            
            // BG = AQ - BF (utilidad después de comisiones de gerencia)
            row.utilidadDespuesComisiones = row.utilidadBruta - row.comisionTotalPorcentajes;
            
            // Margen final después de comisiones
            row.margenFinal = row.montoBase > 0 ? row.utilidadDespuesComisiones / row.montoBase : 0;
            
            // Campos adicionales del Excel
            // VENTAS A 18.00 - podría ser un filtro o cálculo adicional
            row.ventasA18 = 0;
            
            // Montos de comisión por gerente: (porcentaje/100) × Ingreso Casa
            // El valor del campo Percent en NetSuite puede venir como "puntos porcentuales" (0.18 = 0.18%), por eso dividimos entre 100
            var ingresoCasa = row.ingresoCasa || 0;
            var pct = function(v) { var n = Number(v); return (n !== n || v == null) ? 0 : n; };
            row.comisionRosario = (pct(row.porcentajeComisionRosario) / 100) * ingresoCasa;
            row.comisionAlhely = (pct(row.porcentajeComisionAlhely) / 100) * ingresoCasa;
            row.comisionGabriela = (pct(row.porcentajeComisionGabriela) / 100) * ingresoCasa;
            row.comisionMineria = (pct(row.porcentajeComisionMineria) / 100) * ingresoCasa;
            row.comisionAgro = (pct(row.porcentajeComisionAgro) / 100) * ingresoCasa;
            row.comisionPrieto = (pct(row.porcentajeComisionPrieto) / 100) * ingresoCasa;
            var costoFijoOtros = Number(row.otrosCostoFijoTon);
            if (costoFijoOtros > 0 && !isNaN(costoFijoOtros)) {
                // custrecord_costo_fijo_ton viene en USD; convertir a "moneda casa" del reporte
                // usando el mismo tipo de cambio interno con el que se calcula Ingreso Casa.
                var tipoCambioInternoOtros = Number(row.tipoCambioInterno || 0);
                var tcFactor = tipoCambioInternoOtros > 0 ? tipoCambioInternoOtros : 1;
                row.comisionOtros = ((Number(row.cantidad) || 0) / 1000) * costoFijoOtros * tcFactor;
            } else {
                row.comisionOtros = (pct(row.porcentajeComisionOtros) / 100) * ingresoCasa;
            }
            // Total compensación = suma de las 7 comisiones (cuando Otros es costo fijo no está en porcentajeComisionTotal)
            row.comisionTotalGerentes = (row.comisionRosario || 0) + (row.comisionAlhely || 0) + (row.comisionGabriela || 0) + (row.comisionMineria || 0) + (row.comisionAgro || 0) + (row.comisionPrieto || 0) + (row.comisionOtros || 0);
            
            // Utilidad después de comisiones de gerencia = Utilidad Bruta - Comisión Total compensación
            row.utilidadDespuesComisionesGerencia = (row.utilidadBruta || 0) - (row.comisionTotalGerentes || 0);
            
            // % Margen = Utilidad después de comisiones de gerencia / Ingreso (importe)
            var ingreso = row.importe || row.montoBase || 0;
            row.margenDespuesComisionesGerencia = ingreso > 0 ? (row.utilidadDespuesComisionesGerencia || 0) / ingreso : 0;
            
            return row;
        }
        
        /**
         * Carga los parámetros de comisión desde un Custom Record
         * Si no existe, usa valores por defecto
         */
        var comisionParamsCache = null;
        function loadComisionParams() {
            if (comisionParamsCache) {
                return comisionParamsCache;
            }
            
            comisionParamsCache = [];
            
            try {
                // Búsqueda global del Custom Record: todos los parámetros de comisión por margen (sin filtro isinactive para evitar errores)
                var colMin = search.createColumn({ name: 'custrecord_margen_minimo' });
                var colMax = search.createColumn({ name: 'custrecord_margen_maximo' });
                var colPct = search.createColumn({ name: 'custrecord_porcentaje_comision' });
                var paramSearch = search.create({
                    type: 'customrecord_parametros_comision',
                    filters: [],
                    columns: [colMin, colMax, colPct]
                });
                var runSearch = paramSearch.run();
                var start = 0;
                var pageSize = 100;
                var results;
                do {
                    results = runSearch.getRange({ start: start, end: start + pageSize });
                    for (var i = 0; i < results.length; i++) {
                        var result = results[i];
                        try {
                            var minVal = parseFloat(result.getValue(colMin) || 0);
                            var maxVal = parseFloat(result.getValue(colMax) || 100);
                            var pctRaw = result.getValue(colPct);
                            var porcentaje = parseFloat(pctRaw) || 0;
                            if (porcentaje > 1) {
                                porcentaje = porcentaje / 100;
                            }
                            comisionParamsCache.push({
                                min: minVal,
                                max: maxVal,
                                porcentaje: porcentaje
                            });
                        } catch (rowErr) { /* fila omitida */ }
                    }
                    start += pageSize;
                } while (results.length === pageSize);
                
                // Ordenar por margen mínimo descendente para que al buscar se tome el rango correcto
                if (comisionParamsCache.length > 0) {
                    comisionParamsCache.sort(function(a, b) {
                        return b.min - a.min;
                    });
                }
                
            } catch (e) {
                // Valores por defecto basados en el análisis del Excel
                comisionParamsCache = [
                    { min: 20, max: 100, porcentaje: 0.0050 }, // 0.50%
                    { min: 15, max: 20, porcentaje: 0.0047 },  // 0.47%
                    { min: 10, max: 15, porcentaje: 0.0027 },  // 0.27%
                    { min: 5, max: 10, porcentaje: 0.0020 },   // 0.20%
                    { min: 0, max: 5, porcentaje: 0.0012 },    // 0.12%
                    { min: -100, max: 0, porcentaje: 0 }       // 0% si hay pérdida
                ];
            }
            
            return comisionParamsCache;
        }
        
        /**
         * Cache global de registros "Descuento Proveedor" para consulta por línea.
         * Se carga una vez al generar el reporte.
         */
        var descuentoProveedorCache = null;
        
        /** Convierte valor a fecha solo (sin hora) en ms para comparar vigencia. */
        function toDateOnlyMs(value) {
            if (value == null || value === '') return null;
            var d = null;
            if (value instanceof Date) {
                d = value;
            } else if (typeof value === 'string') {
                try {
                    d = format.parse({ value: value, type: format.Type.DATE });
                } catch (e) {
                    d = new Date(value);
                }
            } else {
                d = new Date(value);
            }
            if (!d || isNaN(d.getTime())) return null;
            return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
        }
        
        /**
         * Cache global de comisiones de gerentes por Employee (Representante de Ventas).
         * Estructura: { employeeId: { rosario: 0.18, alhely: 0.25, ... } }
         * Se carga una vez al generar el reporte.
         */
        var comisionesGerentesCache = null;
        /** Periodo (fechaDesde|fechaHasta) con el que se construyó el cache; si cambia, se reconstruye. */
        var comisionesGerentesCachePeriodKey = null;
        
        /**
         * Carga todos los registros del Custom Record "Descuento Proveedor" para consulta por línea.
         * Ajusta el recordType y los nombres de campos según tu configuración en NetSuite.
         */
        function loadDescuentoProveedorCache() {
            if (descuentoProveedorCache) {
                return descuentoProveedorCache;
            }
            descuentoProveedorCache = [];
            try {
                //log.audit('ReporteRentabilidad', 'DescuentoProveedor: iniciando búsqueda customrecord_descuento_proveedor');
                var colDpArticulo = search.createColumn({ name: 'custrecord_dp_articulo' });
                var descuentoSearch = search.create({
                    type: 'customrecord_descuento_proveedor',
                    filters: [],
                    columns: [
                        colDpArticulo,
                        search.createColumn({ name: 'custrecord_dp_cliente' }),
                        search.createColumn({ name: 'custrecord_dp_proveedor' }),
                        search.createColumn({ name: 'custrecord_dp_factor' }),
                        search.createColumn({ name: 'custrecord_dp_fecha_inicio' }),
                        search.createColumn({ name: 'custrecord_dp_fecha_fin' })
                    ]
                });
                descuentoSearch.run().each(function(r) {
                    // search.Result en NetSuite solo tiene getValue(), no getValues(). Multiselect devuelve el primer valor o a veces string con comas.
                    var articuloVal = r.getValue(colDpArticulo);
                    var articulos = [];
                    if (articuloVal != null && articuloVal !== '') {
                        if (Array.isArray(articuloVal)) {
                            articulos = articuloVal.map(function(id) { return String(id); });
                        } else if (typeof articuloVal === 'string' && articuloVal.indexOf(',') >= 0) {
                            articulos = articuloVal.split(',').map(function(s) { return String(s).trim(); }).filter(Boolean);
                        } else {
                            articulos = [String(articuloVal)];
                        }
                    }
                    descuentoProveedorCache.push({
                        articulos: articulos,
                        cliente: r.getValue('custrecord_dp_cliente') != null ? String(r.getValue('custrecord_dp_cliente')) : '',
                        proveedor: r.getValue('custrecord_dp_proveedor') != null ? String(r.getValue('custrecord_dp_proveedor')).trim() : '',
                        factor: parseFloat(r.getValue('custrecord_dp_factor') || 0),
                        fechaInicio: r.getValue('custrecord_dp_fecha_inicio'),
                        fechaFin: r.getValue('custrecord_dp_fecha_fin')
                    });
                    return true;
                });
                // Log de lo cargado para revisar datos del Descuento Proveedor (mismo título para ver en la misma lista)
                //log.audit('ReporteRentabilidad', 'DescuentoProveedor: registros cargados=' + descuentoProveedorCache.length);
                for (var idx = 0; idx < descuentoProveedorCache.length; idx++) {
                    var reg = descuentoProveedorCache[idx];
                    //log.audit('ReporteRentabilidad', 'DescuentoProveedor [' + (idx + 1) + '] articulos=' + JSON.stringify(reg.articulos) +
                       // ' | cliente=' + (reg.cliente || '') + ' | proveedor=' + (reg.proveedor || '') +
                       // ' | factor=' + reg.factor + ' | fechaInicio=' + (reg.fechaInicio || '') + ' | fechaFin=' + (reg.fechaFin || ''));
                }
            } catch (e) {
                log.audit('ReporteRentabilidad', 'DescuentoProveedor error: ' + (e.message || String(e)));
            }
            return descuentoProveedorCache;
        }
        
        /**
         * Obtiene el factor de descuento (nota crédito proveedor) para una línea.
         * Busca en el cache registros que coincidan: Artículo, Cliente y vigencia de fechas; si el
         * registro tiene proveedor, debe coincidir con el de la línea; si custrecord_dp_proveedor
         * está vacío en el registro, no se filtra por proveedor (aplica a todos).
         * Si hay más de uno (p. ej. periodos solapados o un registro antiguo sin fecha fin),
         * se usa el registro con fecha inicio más reciente (misma idea que comisiones de gerentes).
         * @param {Object} row - Fila con articuloId, clienteId, proveedorId, fecha
         * @returns {number} Factor (ej. 0.05) o 0 si no hay coincidencia
         */
        var _logFactorDescuentoCount = 0;
        function getFactorDescuentoProveedor(row) {
            if (!row || !descuentoProveedorCache || descuentoProveedorCache.length === 0) {
                return 0;
            }
            var articuloId = row.articuloId != null ? String(row.articuloId) : '';
            var clienteId = (row.clienteId != null && row.clienteId !== '') ? String(row.clienteId) : '';
            var proveedorId = (row.proveedorId != null && row.proveedorId !== '') ? String(row.proveedorId).trim() : '';
            var fecha = row.fecha || '';
            if (!articuloId || !clienteId || !fecha) {
                if (_logFactorDescuentoCount < 3) {
                    //log.audit('ReporteRentabilidad', 'DescuentoProveedor fila sin match (falta dato): articuloId=' + articuloId + ' clienteId=' + clienteId + ' fecha=' + (fecha || '(vacío)'));
                    _logFactorDescuentoCount++;
                }
                return 0;
            }
            var fTime = toDateOnlyMs(fecha);
            if (fTime == null) {
                if (_logFactorDescuentoCount < 3) {
                  //  log.audit('ReporteRentabilidad', 'DescuentoProveedor fila sin match (fecha no parseable): fecha=' + (fecha || '') + ' articuloId=' + articuloId);
                    _logFactorDescuentoCount++;
                }
                return 0;
            }
            if (_logFactorDescuentoCount < 5) {
                //log.audit('ReporteRentabilidad', 'DescuentoProveedor fila a buscar: articuloId=' + articuloId + ' clienteId=' + clienteId + ' proveedorId=' + proveedorId + ' fecha=' + fecha + ' fTime=' + fTime);
                _logFactorDescuentoCount++;
            }
            /** Si varios registros cubren la fecha, usar el de fecha inicio más reciente. */
            var DP_FIN_ABIERTO_MS = 9999999999999;
            var mejorFactor = 0;
            var mejorInicioMs = null;
            for (var i = 0; i < descuentoProveedorCache.length; i++) {
                var reg = descuentoProveedorCache[i];
                var articulos = reg.articulos || [];
                if (articulos.indexOf(articuloId) === -1) {
                    continue;
                }
                if (String(reg.cliente || '') !== clienteId) {
                    continue;
                }
                var regProveedor = String(reg.proveedor || '').trim();
                if (regProveedor !== '' && (proveedorId === '' || regProveedor !== proveedorId)) {
                    continue;
                }
                var inicioMs = (reg.fechaInicio != null && reg.fechaInicio !== '') ? toDateOnlyMs(reg.fechaInicio) : 0;
                if (inicioMs == null) {
                    inicioMs = 0;
                }
                var finMs;
                if (reg.fechaFin != null && reg.fechaFin !== '') {
                    finMs = toDateOnlyMs(reg.fechaFin);
                    if (finMs == null) {
                        finMs = DP_FIN_ABIERTO_MS;
                    }
                } else {
                    finMs = DP_FIN_ABIERTO_MS;
                }
                if (fTime < inicioMs || fTime > finMs) {
                    continue;
                }
                if (mejorInicioMs === null || inicioMs > mejorInicioMs) {
                    mejorInicioMs = inicioMs;
                    mejorFactor = reg.factor;
                }
            }
            return mejorFactor;
        }
        
        /**
         * Carga comisiones desde el custom record customrecord_comisiones_empleado.
         * Solo se incluyen registros cuya vigencia se solapa con el periodo del reporte:
         * fecha_inicio <= fechaHasta del reporte Y (sin fecha_fin O fecha_fin >= fechaDesde del reporte).
         * Para cada empleado se toma el registro con fecha_inicio más reciente entre los que cumplen vigencia.
         * @param {string} [fechaDesde] - Inicio periodo reporte (YYYY-MM-DD)
         * @param {string} [fechaHasta] - Fin periodo reporte (YYYY-MM-DD)
         */
        function loadComisionesGerentesCache(fechaDesde, fechaHasta) {
            var periodKey = (fechaDesde || '') + '|' + (fechaHasta || '');
            if (comisionesGerentesCache && comisionesGerentesCachePeriodKey === periodKey) {
                return comisionesGerentesCache;
            }
            comisionesGerentesCache = {};
            comisionesGerentesCachePeriodKey = periodKey;
            try {
                log.audit('ReporteRentabilidad', 'ComisionesGerentes: iniciando búsqueda customrecord_comisiones_empleado periodo=' + periodKey);
                var searchFilters = [];
                if (fechaHasta) {
                    searchFilters.push(['custrecord_fecha_inicio', 'onorbefore', fechaHasta]);
                }
                var employeeSearch = search.create({
                    type: 'customrecord_comisiones_empleado',
                    filters: searchFilters,
                    columns: [
                        search.createColumn({ name: 'custrecord_nombre_empleado' }),
                        search.createColumn({ name: 'custrecord_fecha_inicio', sort: search.Sort.DESC }),
                        search.createColumn({ name: 'custrecord_fecha_fin' }),
                        search.createColumn({ name: 'custrecord_comision_rosario' }),
                        search.createColumn({ name: 'custrecord_comision_alhely' }),
                        search.createColumn({ name: 'custrecord_comision_gabriela' }),
                        search.createColumn({ name: 'custrecord_comision_mineria' }),
                        search.createColumn({ name: 'custrecord_comision_agro' }),
                        search.createColumn({ name: 'custrecord_comision_prieto' }),
                        search.createColumn({ name: 'custrecord_comision_total' })
                    ]
                });
                var desdeMs = fechaDesde ? toDateOnlyMs(fechaDesde) : null;
                var hastaMs = fechaHasta ? toDateOnlyMs(fechaHasta) : null;
                var rawByEmployee = {};
                employeeSearch.run().each(function(result) {
                    var employeeId = String(result.getValue('custrecord_nombre_empleado') || '');
                    if (!employeeId) return true;
                    var fechaFinVal = result.getValue('custrecord_fecha_fin');
                    var fechaFinMs = fechaFinVal ? toDateOnlyMs(fechaFinVal) : null;
                    if (desdeMs != null && fechaFinMs != null && fechaFinMs < desdeMs) return true;
                    function getPercentValue(columnName) {
                        var value = result.getValue(columnName);
                        if (value === null || value === undefined || value === '') return 0;
                        var num = parseFloat(value);
                        return isNaN(num) ? 0 : num;
                    }
                    var fechaInicioVal = result.getValue('custrecord_fecha_inicio');
                    var fechaInicioMs = toDateOnlyMs(fechaInicioVal);
                    if (!rawByEmployee[employeeId] || (fechaInicioMs != null && (rawByEmployee[employeeId].fechaInicioMs == null || fechaInicioMs > rawByEmployee[employeeId].fechaInicioMs))) {
                        var rosario = getPercentValue('custrecord_comision_rosario');
                        var alhely = getPercentValue('custrecord_comision_alhely');
                        var gabriela = getPercentValue('custrecord_comision_gabriela');
                        var mineria = getPercentValue('custrecord_comision_mineria');
                        var agro = getPercentValue('custrecord_comision_agro');
                        var prieto = getPercentValue('custrecord_comision_prieto');
                        var totalVal = getPercentValue('custrecord_comision_total');
                        var total = totalVal > 0 ? totalVal : (rosario + alhely + gabriela + mineria + agro + prieto);
                        rawByEmployee[employeeId] = {
                            fechaInicioMs: fechaInicioMs,
                            rosario: rosario,
                            alhely: alhely,
                            gabriela: gabriela,
                            mineria: mineria,
                            agro: agro,
                            prieto: prieto,
                            otros: 0,
                            total: total
                        };
                    }
                    return true;
                });
                Object.keys(rawByEmployee).forEach(function(employeeId) {
                    var r = rawByEmployee[employeeId];
                    comisionesGerentesCache[employeeId] = {
                        rosario: r.rosario,
                        alhely: r.alhely,
                        gabriela: r.gabriela,
                        mineria: r.mineria,
                        agro: r.agro,
                        prieto: r.prieto,
                        otros: r.otros,
                        total: r.total
                    };
                });
                var count = Object.keys(comisionesGerentesCache).length;
                log.audit('ReporteRentabilidad', 'ComisionesGerentes: registros cargados=' + count + ' (periodo ' + (fechaDesde || '') + ' a ' + (fechaHasta || '') + ')');
                if (count === 0) {
                    log.audit('ReporteRentabilidad', 'ComisionesGerentes: cache vacío. Revise customrecord_comisiones_empleado, custrecord_nombre_empleado y vigencia custrecord_fecha_inicio/fin.');
                } else {
                    var keys = Object.keys(comisionesGerentesCache);
                    for (var k = 0; k < Math.min(keys.length, 15); k++) {
                        var eid = keys[k];
                        var c = comisionesGerentesCache[eid];
                        log.audit('ReporteRentabilidad', 'ComisionesGerentes [' + (k + 1) + '] employeeId=' + eid +
                            ' | rosario=' + c.rosario + ' alhely=' + c.alhely + ' gabriela=' + c.gabriela +
                            ' | mineria=' + c.mineria + ' agro=' + c.agro + ' prieto=' + c.prieto + ' otros=' + c.otros + ' total=' + c.total);
                    }
                    if (keys.length > 15) log.audit('ReporteRentabilidad', 'ComisionesGerentes: ... y ' + (keys.length - 15) + ' más.');
                }
            } catch (e) {
                log.error('ReporteRentabilidad loadComisionesGerentesCache', (e.message || String(e)));
            }
            return comisionesGerentesCache;
        }
        
        /**
         * Obtiene los porcentajes de comisión de gerentes para un Employee específico.
         * @param {string} employeeId - ID del Employee (Representante de Ventas)
         * @returns {Object} Objeto con los porcentajes: { rosario: 0.18, alhely: 0.25, ... } o null si no existe
         */
        function getComisionesGerentes(employeeId) {
            if (!employeeId) {
                return null;
            }
            // Usar el cache ya cargado para el periodo del reporte.
            // No volver a llamar loadComisionesGerentesCache sin fechas, para no perder el filtro por vigencia.
            if (!comisionesGerentesCache) {
                return null;
            }
            return comisionesGerentesCache[employeeId] || null;
        }

        /**
         * Record type "Compensación Cliente-Artículo": determina % Otros por coincidencia cliente + ítem + vigencia.
         * Campos: custrecord_cliente (Customer), custrecord_articulo (Item multi-select),
         * custrecord_porcentajecomision, custrecord_fecha_desde, custrecord_fecha_hasta.
         * Ajustar RECORD_TYPE_OTROS si en tu cuenta el ID es distinto (ej. customrecord_comisiones_otros).
         */
        // IMPORTANTE: usar el ID REAL del custom record de compensación Cliente-Artículo.
        // En tu cuenta el tipo es customrecord_comisiones_otros (según los logs y la captura),
        // por eso ajustamos aquí el ID del record.
        var RECORD_TYPE_OTROS = 'customrecord_comisiones_otros';
        /** Cache por cliente: [ { articuloIds[], ubicacionIds[], desdeMs, hastaMs, pct, costoFijoTon }, ... ]. Solo registros con cliente y (pct>0 o costoFijoTon>0). Multiselect normalizado a array. */
        var otrosCompensacionPorClienteCache = null;
        /** Cache de lookup por fila: key = "clienteId|articuloId|ubicacionId|fechaStr", value = { tipo, valor } */
        var porcentajeOtrosClienteArticuloCache = {};

        /**
         * Precarga registros de Compensación Cliente-Artículo (custrecord_comisiones_otros).
         * Flujo: solo registros que tengan cliente y al menos uno de (Monto fijo por tonelada o % comisión); si no tiene ninguno se omite.
         * Índice por cliente. Cada ítem guarda articuloId y ubicacionId (vacío = aplica a todos los ítems / todas las ubicaciones).
         */
        function loadOtrosCompensacionCache() {
            if (otrosCompensacionPorClienteCache !== null) return otrosCompensacionPorClienteCache;
            otrosCompensacionPorClienteCache = {};
            try {
                var searchOtros = search.create({
                    type: RECORD_TYPE_OTROS,
                    filters: [],
                    columns: [
                        search.createColumn({ name: 'custrecord_cliente' }),
                        search.createColumn({ name: 'custrecord_articulo' }),
                        search.createColumn({ name: 'custrecord_ubicacion' }),
                        search.createColumn({ name: 'custrecord_fecha_desde' }),
                        search.createColumn({ name: 'custrecord_fecha_hasta' }),
                        search.createColumn({ name: 'custrecord_porcentajecomision' }),
                        search.createColumn({ name: 'custrecord_costo_fijo_ton' })
                    ]
                });
                var start = 0;
                var pageSize = 500;
                var chunk;
                do {
                    chunk = searchOtros.run().getRange({ start: start, end: start + pageSize });
                    for (var i = 0; i < chunk.length; i++) {
                        var r = chunk[i];
                        var clienteId = String(r.getValue('custrecord_cliente') || '');
                        if (!clienteId) continue;
                        var articuloVal = r.getValue('custrecord_articulo');
                        var articuloIds = _normalizeMultiselectToArray(articuloVal);
                        var ubicacionVal = r.getValue('custrecord_ubicacion');
                        var ubicacionIds = _normalizeMultiselectToArray(ubicacionVal);
                        var desdeVal = r.getValue('custrecord_fecha_desde');
                        var hastaVal = r.getValue('custrecord_fecha_hasta');
                        var desdeMs = toDateOnlyMs(desdeVal);
                        var hastaMs = hastaVal ? toDateOnlyMs(hastaVal) : null;
                        var pctVal = r.getValue('custrecord_porcentajecomision');
                        var pct = (pctVal != null && pctVal !== '') ? (parseFloat(pctVal) || 0) : 0;
                        var costoFijoVal = r.getValue('custrecord_costo_fijo_ton');
                        var costoFijoTon = (costoFijoVal != null && costoFijoVal !== '') ? (parseFloat(costoFijoVal) || 0) : 0;
                        if (pct <= 0 && costoFijoTon <= 0) continue;
                        var item = { articuloIds: articuloIds, ubicacionIds: ubicacionIds, desdeMs: desdeMs, hastaMs: hastaMs, pct: pct, costoFijoTon: costoFijoTon };
                        if (!otrosCompensacionPorClienteCache[clienteId]) otrosCompensacionPorClienteCache[clienteId] = [];
                        otrosCompensacionPorClienteCache[clienteId].push(item);
                    }
                    start += pageSize;
                } while (chunk.length === pageSize);
                var nClientes = Object.keys(otrosCompensacionPorClienteCache).length;
                var nRegs = 0;
                for (var cid in otrosCompensacionPorClienteCache) { nRegs += otrosCompensacionPorClienteCache[cid].length; }
                log.audit('ReporteRentabilidad', 'Otros compensación: precarga OK clientes=' + nClientes + ' totalRegistros=' + nRegs);
            } catch (e) {
                log.error('ReporteRentabilidad loadOtrosCompensacionCache', (e.message || String(e)));
            }
            return otrosCompensacionPorClienteCache;
        }

        /** Normaliza valor de campo multiselect de búsqueda: puede ser array, string con comas o un solo valor. Devuelve array de strings (vacío = aplica a todos). */
        function _normalizeMultiselectToArray(val) {
            if (val == null || val === '') return [];
            if (Array.isArray(val)) return val.map(function(id) { return String(id).trim(); }).filter(Boolean);
            if (typeof val === 'string' && val.indexOf(',') >= 0) return val.split(',').map(function(s) { return String(s).trim(); }).filter(Boolean);
            return [String(val).trim()].filter(Boolean);
        }

        /**
         * De una lista de registros Otros del mismo cliente, devuelve el que aplica a la línea.
         * Regla: si el registro tiene artículo → la línea debe tener ese artículo; si no tiene artículo, basta con que coincida el cliente.
         * Igual con ubicación: si el registro tiene ubicación → debe coincidir; si no tiene, basta el cliente.
         * Vigencia obligatoria (fecha de la línea entre fecha_desde y fecha_hasta).
         * Si varios coinciden, se toma el de fecha_desde más reciente.
         */
        function _eligeOtrosPorCliente(list, fechaMs, articuloIdLinea, ubicacionIdLinea) {
            if (!list || list.length === 0) return null;
            var best = null;
            var bestDesdeMs = null;
            for (var j = 0; j < list.length; j++) {
                var item = list[j];
                if (fechaMs != null && item.desdeMs != null && fechaMs < item.desdeMs) continue;
                if (fechaMs != null && item.hastaMs != null && fechaMs > item.hastaMs) continue;
                if (item.articuloIds && item.articuloIds.length > 0 && (articuloIdLinea === '' || item.articuloIds.indexOf(articuloIdLinea) === -1)) continue;
                if (item.ubicacionIds && item.ubicacionIds.length > 0 && (ubicacionIdLinea === '' || item.ubicacionIds.indexOf(ubicacionIdLinea) === -1)) continue;
                if (best === null || (item.desdeMs != null && (bestDesdeMs == null || item.desdeMs > bestDesdeMs))) {
                    best = item;
                    bestDesdeMs = item.desdeMs;
                }
            }
            return best;
        }

        /**
         * Obtiene el valor Otros para una línea según el flujo:
         * 1) Solo registros con el cliente de la línea y que tengan Monto fijo por tonelada o % comisión (al menos uno).
         * 2) Si el registro tiene ítem → validar por ítem; si tiene ubicación → validar por ubicación; si tiene ambos, debe cumplir ambos.
         * 3) Si no tiene ítem aplica a todos los ítems; si no tiene ubicación aplica a todas las ubicaciones.
         * @returns {{ tipo: 'porcentaje'|'costo_fijo', valor: number }}
         */
        function getPorcentajeOtrosCompensacionClienteArticulo(row) {
            var clienteId = row.clienteId != null && row.clienteId !== '' ? String(row.clienteId) : '';
            var articuloId = row.articuloId != null && row.articuloId !== '' ? String(row.articuloId) : '';
            var ubicacionId = (row.ubicacionId != null && row.ubicacionId !== '') ? String(row.ubicacionId) : ((row.ubicacion != null && row.ubicacion !== '') ? String(row.ubicacion) : '');
            var fecha = row.fecha || null;
            var cero = { tipo: 'porcentaje', valor: 0 };
            if (!clienteId || !fecha) return cero;
            var fechaStr = (fecha && (fecha instanceof Date)) ? format.format({ value: fecha, type: format.Type.DATE }) : (typeof fecha === 'string' ? String(fecha).substring(0, 10) : '');
            if (!fechaStr) return cero;
            var cacheKey = clienteId + '|' + articuloId + '|' + ubicacionId + '|' + fechaStr;
            if (porcentajeOtrosClienteArticuloCache.hasOwnProperty(cacheKey)) {
                return porcentajeOtrosClienteArticuloCache[cacheKey];
            }
            if (otrosCompensacionPorClienteCache === null) loadOtrosCompensacionCache();
            var fechaMs = toDateOnlyMs(fechaStr);
            var list = otrosCompensacionPorClienteCache && otrosCompensacionPorClienteCache[clienteId];
            var listLen = list ? list.length : 0;
            var result = _eligeOtrosPorCliente(list, fechaMs, articuloId, ubicacionId);
            var out;
            if (result) {
                if (result.pct != null && result.pct !== '' && parseFloat(result.pct) > 0) {
                    out = { tipo: 'porcentaje', valor: parseFloat(result.pct) };
                } else if (result.costoFijoTon != null && result.costoFijoTon > 0) {
                    out = { tipo: 'costo_fijo', valor: result.costoFijoTon };
                } else {
                    out = cero;
                }
            } else {
                out = cero;
            }
            porcentajeOtrosClienteArticuloCache[cacheKey] = out;
            return out;
        }

        /**
         * Obtiene el % Comisión según el margen, consultando el arreglo de parámetros (customrecord_parametros_comision).
         * Regla: margen (ej. 8.85%) se valida contra margen_minimo y margen_maximo; si min <= margen <= max, se usa ese porcentaje.
         * Ejemplo: margen 8.85% está entre 7.51 y 10 → 0.75%.
         */
        function getComisionPorMargen(margen) {
            var params = loadComisionParams();
            if (!params || params.length === 0) {
                return 0;
            }
            // Margen en decimal (0.0885 = 8.85%); convertir a puntos para comparar con min/max del registro (7.51, 10)
            var margenPuntos = (margen == null || isNaN(margen)) ? 0 : (parseFloat(margen) * 100);
            
            // Parámetros ordenados por min descendente; tomar el primer rango donde min <= margen <= max
            for (var i = 0; i < params.length; i++) {
                if (margenPuntos >= params[i].min && margenPuntos <= params[i].max) {
                    return params[i].porcentaje;
                }
            }
            return 0;
        }

        function findPrecacheFileIdInFolder(folderId, name) {
            var out = '';
            try {
                var fs = search.create({
                    type: 'file',
                    filters: [['folder', 'anyof', String(folderId)], 'AND', ['name', 'is', name]],
                    columns: [search.createColumn({ name: 'internalid' })]
                });
                fs.run().each(function(r) {
                    out = r.getValue({ name: 'internalid' }) || r.id || '';
                    return false;
                });
            } catch (e) {
                log.error('findPrecacheFileIdInFolder', e.message || e);
            }
            return out ? String(out) : '';
        }

        function precacheFileNameForPeriodKey(periodKey) {
            return REPORT_PRECACHE_FILE_PREFIX + String(periodKey) + '.json';
        }

        /**
         * Meses calendario desde curStart (inicio de mes) hasta limit (día inclusive).
         */
        function buildMonthPeriodsFromStartToLimit(curStart, limit) {
            var periods = [];
            var cur = new Date(curStart.getFullYear(), curStart.getMonth(), 1);
            while (cur <= limit) {
                var y = cur.getFullYear();
                var m = cur.getMonth();
                var periodStart = new Date(y, m, 1);
                var periodEnd = new Date(y, m + 1, 0);
                if (periodEnd > limit) {
                    periodEnd = limit;
                }
                if (periodStart <= periodEnd) {
                    var monthNum = m + 1;
                    var mm = monthNum < 10 ? '0' + monthNum : String(monthNum);
                    periods.push({
                        periodKey: y + '-' + mm,
                        fechaDesde: format.format({ value: periodStart, type: format.Type.DATE }),
                        fechaHasta: format.format({ value: periodEnd, type: format.Type.DATE })
                    });
                }
                cur = new Date(y, m + 1, 1);
            }
            return periods;
        }

        /** MR programado (FULL): ~2 años móviles hasta hoy; sin tope en 2025. */
        function getPrecacheMonthPeriodsRollingTwoYears() {
            var todayEnd = new Date();
            var limit = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate());
            var curStart = new Date(limit.getFullYear() - 2, limit.getMonth(), 1);
            return buildMonthPeriodsFromStartToLimit(curStart, limit);
        }

        /** Un solo mes (calendario en curso): encolado Suitelet con LAST_MONTH. */
        function getPrecacheMonthPeriodsCurrentMonthOnly() {
            var todayEnd = new Date();
            var limit = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate());
            var y = limit.getFullYear();
            var m = limit.getMonth();
            var periodStart = new Date(y, m, 1);
            var periodEnd = new Date(y, m + 1, 0);
            if (periodEnd > limit) {
                periodEnd = limit;
            }
            var monthNum = m + 1;
            var mm = monthNum < 10 ? '0' + monthNum : String(monthNum);
            return [{
                periodKey: y + '-' + mm,
                fechaDesde: format.format({ value: periodStart, type: format.Type.DATE }),
                fechaHasta: format.format({ value: periodEnd, type: format.Type.DATE })
            }];
        }

        /**
         * Meses cuyos JSON puede intentar leer el Suitelet (2010 → hoy).
         * No afecta cuántos maps corre el MR programado.
         */
        function getPrecacheMonthPeriodsForReadKeys() {
            var todayEnd = new Date();
            var limit = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate());
            var curStart = new Date(PRECACHE_READ_EARLIEST_YEAR, 0, 1);
            return buildMonthPeriodsFromStartToLimit(curStart, limit);
        }

        function parseMrParamDate(paramName) {
            try {
                var v = runtime.getCurrentScript().getParameter({ name: paramName });
                if (v == null || v === '') return null;
                if (v instanceof Date) return v;
                var s = String(v).trim();
                if (!s) return null;
                return format.parse({ value: s, type: format.Type.DATE });
            } catch (e) {
                return null;
            }
        }

        function getPrecacheScopeFromMrScript() {
            try {
                var p = runtime.getCurrentScript().getParameter({ name: MR_PRECACHE_SCOPE_PARAM });
                if (p != null && String(p).trim() !== '') {
                    var v = String(p).trim().toUpperCase();
                    if (v === 'LAST_MONTH' || v === '1' || v === 'INCREMENTAL') {
                        return 'LAST_MONTH';
                    }
                }
            } catch (e1) { /* */ }
            try {
                if (MR_PRECACHE_DEPLOY_LAST_MONTH_ID && String(runtime.getCurrentScript().deploymentId || '') === MR_PRECACHE_DEPLOY_LAST_MONTH_ID) {
                    return 'LAST_MONTH';
                }
            } catch (e2) { /* */ }
            return 'FULL';
        }

        function getPrecachePeriodKeysForFilters(fechaDesde, fechaHasta) {
            var all = getPrecacheMonthPeriodsForReadKeys();
            var keys = [];
            if (!fechaDesde && !fechaHasta) {
                for (var i = 0; i < all.length; i++) keys.push(all[i].periodKey);
                return keys;
            }
            var fromMs = fechaDesde ? toDateOnlyMs(fechaDesde) : null;
            var toMs = fechaHasta ? toDateOnlyMs(fechaHasta) : null;
            for (var j = 0; j < all.length; j++) {
                var p = all[j];
                var bs = toDateOnlyMs(p.fechaDesde);
                var be = toDateOnlyMs(p.fechaHasta);
                if (fromMs != null && be != null && be < fromMs) continue;
                if (toMs != null && bs != null && bs > toMs) continue;
                keys.push(p.periodKey);
            }
            return keys;
        }

        function savePrecacheFileOverwrite(contents, fileName) {
            var folderId = getReportExportFolderId();
            var name = fileName || (REPORT_PRECACHE_FILE_PREFIX + 'legacy.json');
            var existingId = findPrecacheFileIdInFolder(folderId, name);
            if (existingId) {
                try {
                    file.delete({ id: existingId });
                } catch (delE) {
                    log.error('savePrecacheFileOverwrite delete', delE.message || delE);
                }
            }
            var f = file.create({
                name: name,
                fileType: file.Type.PLAINTEXT,
                contents: contents
            });
            f.folder = folderId;
            var newId = f.save();
            log.audit('ReporteRentabilidad', 'savePrecacheFileOverwrite OK name=' + name + ' fileId=' + newId);
            return String(newId);
        }

        function readPrecacheFileByName(fileName) {
            try {
                var folderId = getReportExportFolderId();
                var fileId = findPrecacheFileIdInFolder(folderId, fileName);
                if (!fileId) return null;
                var f = file.load({ id: fileId });
                var contents = f.getContents();
                if (!contents) return null;
                return JSON.parse(contents);
            } catch (e) {
                log.error('readPrecacheFileByName ' + fileName, e.message || e);
                return null;
            }
        }

        /**
         * Lee y concatena archivos por mes que intersectan el rango de filtros; si no hay trozos, intenta el JSON monolítico legado.
         */
        function readPrecacheMergedForFilters(filters) {
            var keys = getPrecachePeriodKeysForFilters(filters.fechaDesde, filters.fechaHasta);
            var rows = [];
            var meta = [];
            var i;
            for (i = 0; i < keys.length; i++) {
                var fname = precacheFileNameForPeriodKey(keys[i]);
                var data = readPrecacheFileByName(fname);
                if (data && data.rows && data.rows.length) {
                    rows = rows.concat(data.rows);
                    meta.push({ periodKey: keys[i], file: fname, generatedAt: data.generatedAt, n: data.rows.length });
                }
            }
            if (rows.length === 0) {
                var legacy = readPrecacheFileByName(REPORT_PRECACHE_LEGACY_FILE);
                if (legacy && legacy.rows && legacy.rows.length) {
                    return {
                        rows: legacy.rows,
                        meta: [{ periodKey: 'legacy', file: REPORT_PRECACHE_LEGACY_FILE, generatedAt: legacy.generatedAt, n: legacy.rows.length }],
                        keysTried: keys,
                        usedLegacy: true
                    };
                }
            }
            return { rows: rows, meta: meta, keysTried: keys, usedLegacy: false };
        }

        function submitPrecacheMrTask() {
            if (MR_PRECACHE_SCRIPT_ID == null || MR_PRECACHE_DEPLOY_ID == null) {
                log.audit('ReporteRentabilidad', 'submitPrecacheMrTask: configure MR_PRECACHE_SCRIPT_ID y MR_PRECACHE_DEPLOY_ID');
                return '';
            }
            try {
                var deployId = MR_PRECACHE_DEPLOY_LAST_MONTH_ID || MR_PRECACHE_DEPLOY_ID;
                var taskOpts = {
                    taskType: task.TaskType.MAP_REDUCE,
                    scriptId: MR_PRECACHE_SCRIPT_ID,
                    deploymentId: deployId
                };
                if (!MR_PRECACHE_DEPLOY_LAST_MONTH_ID && MR_PRECACHE_SCOPE_PARAM) {
                    var paramObj = {};
                    paramObj[MR_PRECACHE_SCOPE_PARAM] = 'LAST_MONTH';
                    taskOpts.params = paramObj;
                }
                var t = task.create(taskOpts);
                var id = t.submit();
                log.audit('ReporteRentabilidad', 'submitPrecacheMrTask deploy=' + deployId + ' taskId=' + id + (taskOpts.params ? ' scope=LAST_MONTH' : ''));
                return String(id);
            } catch (e) {
                log.error('submitPrecacheMrTask', e.message || e);
                return '';
            }
        }

        function rowDateMs(row) {
            var v = row && row.fecha;
            if (v == null || v === '') return null;
            if (v instanceof Date) return v.getTime();
            if (typeof v === 'string') return toDateOnlyMs(v.substring(0, 10));
            return toDateOnlyMs(v);
        }

        function filterPrecacheRows(rows, filters) {
            if (!rows || !rows.length) return [];
            var out = [];
            var desdeMs = filters.fechaDesde ? toDateOnlyMs(filters.fechaDesde) : null;
            var hastaMs = filters.fechaHasta ? toDateOnlyMs(filters.fechaHasta) : null;
            var wantId = (filters.invoiceId || filters.creditMemoId) ? String(filters.creditMemoId || filters.invoiceId || '') : '';
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                var ms = rowDateMs(row);
                if (desdeMs != null && ms != null && ms < desdeMs) continue;
                if (hastaMs != null && ms != null && ms > hastaMs) continue;
                if (filters.periodo) {
                    if (String(row.postingPeriodId || '') !== String(filters.periodo)) continue;
                }
                if (filters.tipo === 'CustInvc') {
                    if (row.type && String(row.type).indexOf('Nota') >= 0) continue;
                }
                if (filters.tipo === 'CustCred') {
                    if (!row.type || String(row.type).indexOf('Nota') < 0) continue;
                }
                if (filters.clase) {
                    if (String(row.claseId || '') !== String(filters.clase)) continue;
                }
                if (filters.ubicacion) {
                    if (String(row.ubicacionId || '') !== String(filters.ubicacion)) continue;
                }
                if (filters.cliente) {
                    if (String(row.clienteId || '') !== String(filters.cliente)) continue;
                }
                if (filters.giroIndustrial) {
                    if (String(row.giroIndustrialId || '') !== String(filters.giroIndustrial)) continue;
                }
                if (filters.representanteVentas) {
                    if (String(row.representanteVentaId || '') !== String(filters.representanteVentas)) continue;
                }
                if (filters.articulo) {
                    if (String(row.articuloId || '') !== String(filters.articulo)) continue;
                }
                if (wantId) {
                    if (String(row.invoiceId || '') !== wantId) continue;
                }
                out.push(row);
            }
            return out;
        }

        function applyGerenteComisionesToRow(row) {
            var employeeIdStr = String(row.representanteVentaId || '');
            var comisionesGerentes = getComisionesGerentes(employeeIdStr);
            if (comisionesGerentes) {
                row.porcentajeComisionRosario = comisionesGerentes.rosario || 0;
                row.porcentajeComisionAlhely = comisionesGerentes.alhely || 0;
                row.porcentajeComisionGabriela = comisionesGerentes.gabriela || 0;
                row.porcentajeComisionMineria = comisionesGerentes.mineria || 0;
                row.porcentajeComisionAgro = comisionesGerentes.agro || 0;
                row.porcentajeComisionPrieto = comisionesGerentes.prieto || 0;
                var otrosResult = getPorcentajeOtrosCompensacionClienteArticulo(row);
                row.porcentajeComisionOtros = (otrosResult.tipo === 'porcentaje') ? otrosResult.valor : 0;
                row.otrosCostoFijoTon = (otrosResult.tipo === 'costo_fijo') ? otrosResult.valor : null;
                row.porcentajeComisionTotal = (row.porcentajeComisionRosario || 0) + (row.porcentajeComisionAlhely || 0) + (row.porcentajeComisionGabriela || 0) + (row.porcentajeComisionMineria || 0) + (row.porcentajeComisionAgro || 0) + (row.porcentajeComisionPrieto || 0) + (row.porcentajeComisionOtros || 0);
            } else {
                row.porcentajeComisionRosario = 0;
                row.porcentajeComisionAlhely = 0;
                row.porcentajeComisionGabriela = 0;
                row.porcentajeComisionMineria = 0;
                row.porcentajeComisionAgro = 0;
                row.porcentajeComisionPrieto = 0;
                var otrosResultElse = getPorcentajeOtrosCompensacionClienteArticulo(row);
                row.porcentajeComisionOtros = (otrosResultElse.tipo === 'porcentaje') ? otrosResultElse.valor : 0;
                row.otrosCostoFijoTon = (otrosResultElse.tipo === 'costo_fijo') ? otrosResultElse.valor : null;
                row.porcentajeComisionTotal = row.porcentajeComisionOtros || 0;
            }
        }

        function refreshRowForUserFilters(row, filters) {
            applyGerenteComisionesToRow(row);
            var factor = getFactorDescuentoProveedor(row);
            row.factorDescuento = factor != null ? factor : 0;
            row.notaCreditoProveedor = (row.tipoCambio || 0) * (row.cantidad || 0) * (row.factorDescuento || 0);
            row.transporte = (row.cantidad || 0) * (row.costoTransporteCreated || 0);
            row.costoTotal = (row.costo || 0) + (row.transporte || 0) - (row.notaCreditoProveedor || 0);
            row.utilidadBruta = (row.importe || 0) - (row.costoTotal || 0);
            row.margenMN = (row.importe > 0) ? ((row.utilidadBruta || 0) / row.importe) : 0;
            var tipoCambio = row.tipoCambio || 0;
            if (tipoCambio > 0) {
                row.ingresoUSD = (row.importe || 0) / tipoCambio;
                row.costoUSD = (row.costo || 0) / tipoCambio;
                row.transporteUSD = (row.transporte || 0) / tipoCambio;
                row.notaCreditoProveedorUSD = (row.notaCreditoProveedor || 0) / tipoCambio;
                row.costoTotalUSD = (row.costoTotal || 0) / tipoCambio;
                row.utilidadBrutaUSD = (row.utilidadBruta || 0) / tipoCambio;
            } else {
                row.ingresoUSD = 0;
                row.costoUSD = 0;
                row.transporteUSD = 0;
                row.notaCreditoProveedorUSD = 0;
                row.costoTotalUSD = 0;
                row.utilidadBrutaUSD = 0;
            }
            var tipoCambioInterno = filters.tipoCambioInterno || 18;
            row.tipoCambioInterno = tipoCambioInterno;
            row.ingresoCasa = (row.ingresoUSD || 0) * tipoCambioInterno;
            calculateExcelFormulas(row);
        }

        /**
         * Un map del MR por mes: búsqueda solo en ese rango y un JSON bajo el límite de 10 MB por archivo.
         * @param {{ periodKey: string, fechaDesde: string, fechaHasta: string }} period
         */
        function runPrecacheJobForPeriod(period) {
            if (!period || !period.periodKey) {
                log.error('runPrecacheJobForPeriod', 'period inválido');
                return;
            }
            log.audit('ReporteRentabilidad', 'runPrecacheJobForPeriod inicio ' + period.periodKey);
            _timings = null;
            _t('precache_' + period.periodKey);
            var filters = {
                invoiceId: '',
                creditMemoId: '',
                fechaDesde: period.fechaDesde,
                fechaHasta: period.fechaHasta,
                periodo: '',
                tipo: '',
                clase: '',
                ubicacion: '',
                cliente: '',
                giroIndustrial: '',
                representanteVentas: '',
                articulo: '',
                tipoCambioInterno: 18
            };
            loadComisionParams();
            loadComisionesGerentesCache(filters.fechaDesde, filters.fechaHasta);
            loadDescuentoProveedorCache();
            loadOtrosCompensacionCache();
            porcentajeOtrosClienteArticuloCache = {};
            var searchOut = executeInvoiceSearch(filters, null, 0, { bypassViewCap: true });
            var results = (searchOut && searchOut.results) ? searchOut.results : [];
            results.forEach(function(row) {
                calculateExcelFormulas(row);
            });
            _t('precache_search_' + period.periodKey);
            var payload = {
                generatedAt: new Date().toISOString(),
                periodKey: period.periodKey,
                fechaDesde: period.fechaDesde,
                fechaHasta: period.fechaHasta,
                tipoCambioInterno: 18,
                rows: results
            };
            var jsonStr = JSON.stringify(payload);
            var fname = precacheFileNameForPeriodKey(period.periodKey);
            savePrecacheFileOverwrite(jsonStr, fname);
            log.audit('ReporteRentabilidad', 'runPrecacheJobForPeriod fin ' + period.periodKey + ' rows=' + results.length);
            _logTimings('precache_' + period.periodKey, results.length);
        }

        function getPrecacheMapInputData() {
            var scope = getPrecacheScopeFromMrScript();
            if (scope === 'LAST_MONTH') {
                log.audit('ReporteRentabilidad', 'getPrecacheMapInputData mode=LAST_MONTH maps=1 (prioridad sobre hist)');
                return getPrecacheMonthPeriodsCurrentMonthOnly();
            }
            var ds = parseMrParamDate(MR_PRECACHE_HIST_START_PARAM);
            var de = parseMrParamDate(MR_PRECACHE_HIST_END_PARAM);
            if (ds && de) {
                if (ds.getTime() <= de.getTime()) {
                    var todayEnd = new Date();
                    var limit = new Date(todayEnd.getFullYear(), todayEnd.getMonth(), todayEnd.getDate());
                    var endCap = de.getTime() < limit.getTime() ? de : limit;
                    var curStart = new Date(ds.getFullYear(), ds.getMonth(), 1);
                    var endDate = new Date(endCap.getFullYear(), endCap.getMonth(), endCap.getDate());
                    var histPeriods = buildMonthPeriodsFromStartToLimit(curStart, endDate);
                    log.audit('ReporteRentabilidad', 'getPrecacheMapInputData mode=HISTORY maps=' + histPeriods.length);
                    return histPeriods;
                }
                log.audit('ReporteRentabilidad', 'getPrecacheMapInputData: hist_start > hist_end; uso FULL 2 años');
            } else if (ds || de) {
                log.audit('ReporteRentabilidad', 'getPrecacheMapInputData: defina ambos hist_start e hist_end; uso FULL 2 años');
            }
            var fullPeriods = getPrecacheMonthPeriodsRollingTwoYears();
            log.audit('ReporteRentabilidad', 'getPrecacheMapInputData mode=FULL_2Y maps=' + fullPeriods.length);
            return fullPeriods;
        }
        
        /**
         * Muestra el reporte usando serverWidget
         */
        function showReport(context) {
            var params = context.request.parameters;
            var rawInvoiceId = (params.invoice_id || params.custpage_invoice_id || '').toString().trim();
            var rawCreditMemoId = (params.credit_memo_id || params.custpage_credit_memo_id || '').toString().trim();
            // Si el usuario ingresó un ID, usarlo para filtrar NC también (no depender de que tipo=CustCred llegue en el POST)
            var creditMemoIdVal = rawCreditMemoId || (rawInvoiceId ? rawInvoiceId : '');
            var filters = {
                invoiceId: rawInvoiceId,
                creditMemoId: creditMemoIdVal,
                fechaDesde: params.fecha_desde,
                fechaHasta: params.fecha_hasta,
                periodo: params.periodo || '',
                tipo: params.tipo || '',
                clase: params.clase || '',
                ubicacion: params.ubicacion || '',
                cliente: params.cliente || '',
                giroIndustrial: params.giro_industrial || '',
                representanteVentas: params.representante_ventas || '',
                articulo: params.articulo || '',
                tipoCambioInterno: params.tipo_cambio_interno ? parseFloat(params.tipo_cambio_interno) : 18
            };
            log.audit('ReporteRentabilidad', 'showReport params tipo=' + (params.tipo || '') + ' invoice_id=' + rawInvoiceId + ' creditMemoId=' + (creditMemoIdVal || '(vacío)'));
            _t('inicio');
            var usePrecache = (params.precache !== '0' && params.precache !== 'false');
            var results = [];
            var partialMessage = '';
            var precacheData = null;
            if (usePrecache) {
                precacheData = readPrecacheMergedForFilters(filters);
            }
            if (usePrecache && precacheData && precacheData.rows && precacheData.rows.length) {
                porcentajeOtrosClienteArticuloCache = {};
                loadComisionParams();
                _t('comisionParams');
                loadComisionesGerentesCache(filters.fechaDesde, filters.fechaHasta);
                _t('comisionGerentes');
                loadDescuentoProveedorCache();
                _t('descuentoProveedor');
                loadOtrosCompensacionCache();
                results = filterPrecacheRows(precacheData.rows, filters);
                if (precacheData.meta && precacheData.meta.length) {
                    log.audit('ReporteRentabilidad', 'showReport desde caché filtrado meta=' +
                        precacheData.meta.map(function(m) { return (m.periodKey || '') + '(' + (m.n || 0) + ')'; }).join(', ') +
                        ' results.length=' + results.length);
                } else {
                    log.audit('ReporteRentabilidad', 'showReport desde caché filtrado results.length=' + results.length);
                }
                _t('invoiceSearch');
                results.forEach(function(row) {
                    refreshRowForUserFilters(row, filters);
                });
            } else {
                if (usePrecache && (!precacheData || !precacheData.rows || !precacheData.rows.length)) {
                    partialMessage = 'Sin archivo de caché o vacío; ejecutando búsqueda en vivo. ';
                }
                loadComisionParams();
                _t('comisionParams');
                loadComisionesGerentesCache(filters.fechaDesde, filters.fechaHasta);
                _t('comisionGerentes');
                loadDescuentoProveedorCache();
                _t('descuentoProveedor');
                var searchOut = executeInvoiceSearch(filters);
                results = (searchOut && searchOut.results) ? searchOut.results : [];
                partialMessage += (searchOut && searchOut.partialMessage) ? searchOut.partialMessage : '';
                log.audit('ReporteRentabilidad', 'showReport executeInvoiceSearch listo results.length=' + (results ? results.length : 0));
                _t('invoiceSearch');
                results.forEach(function(row) {
                    calculateExcelFormulas(row);
                });
            }
            if (params.action === 'refresh_precache' || params.refresh_precache === '1') {
                var tidMr = submitPrecacheMrTask();
                if (tidMr) {
                    log.audit('ReporteRentabilidad', 'Precache MR encolado taskId=' + tidMr);
                } else {
                    log.error('ReporteRentabilidad', 'No se pudo encolar Map/Reduce de precache; revise MR_PRECACHE_SCRIPT_ID y MR_PRECACHE_DEPLOY_ID.');
                }
            }
            var nConCostoFijoOtros = 0;
            var nConPctOtros = 0;
            for (var ri = 0; ri < results.length; ri++) {
                var r = results[ri];
                if (Number(r.otrosCostoFijoTon) > 0 && Number(r.comisionOtros) > 0) nConCostoFijoOtros++;
                else if (Number(r.porcentajeComisionOtros) > 0 && Number(r.comisionOtros) > 0) nConPctOtros++;
            }
            if (nConCostoFijoOtros > 0 || nConPctOtros > 0) {
                log.audit('ReporteRentabilidad', 'Otros: ' + nConCostoFijoOtros + ' filas costo fijo, ' + nConPctOtros + ' filas porcentaje (de ' + results.length + ' total). Revisar todas las páginas del reporte.');
            }
            _t('formulas');
            var currentScript = runtime.getCurrentScript();
            var scriptId = currentScript.id;
            var deploymentId = currentScript.deploymentId;
            log.audit('ReporteRentabilidad', 'showReport vista inicio results.length=' + results.length);
            _t('createForm');
            _logTimings('showReport', results.length);
            var vista = (context.request.parameters && context.request.parameters.vista) ? context.request.parameters.vista : 'html';
            var exportFileId = (vista === 'form') ? saveReportDataToTempFile(results) : '';
            if (vista === 'form') {
                var form = createReportForm(results, scriptId, deploymentId, filters, exportFileId, partialMessage);
                log.audit('ReporteRentabilidad', 'showReport createReportForm fin');
                context.response.writePage(form);
            } else {
                var htmlPaginated = buildReportHTMLPaginated(results, scriptId, deploymentId, filters, exportFileId, partialMessage);
                log.audit('ReporteRentabilidad', 'showReport buildReportHTMLPaginated fin');
                context.response.write(htmlPaginated);
            }
        }
        
        /**
         * Vista HTML del reporte con paginación en el cliente (fluida, sin recargar al cambiar de página).
         * Los datos se envían una vez; JavaScript pinta solo la página actual (p. ej. 100 filas).
         */
        function buildReportHTMLPaginated(results, scriptId, deploymentId, filters, exportFileId, partialMessage) {
            exportFileId = exportFileId || '';
            partialMessage = partialMessage || '';
            var esc = function(v) { return (v != null && v !== '') ? String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; };
            var totalRows = results ? results.length : 0;
            var totalImporte = 0, totalCosto = 0, totalUtilidad = 0, totalComision = 0;
            results.forEach(function(row) {
                totalImporte += row.importe || 0;
                totalCosto += row.costoTotal || 0;
                totalUtilidad += row.utilidadBruta || 0;
                totalComision += row.comisionTotal || 0;
            });
            var suiteletUrl = '/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId;
            var exportSuiteletUrl = getExportSuiteletUrl() || '';
            var dataForClient = results.map(function(row) {
                var r = {};
                for (var key in row) if (row.hasOwnProperty(key)) r[key] = row[key];
                r.margenPctStr = (row.margenDespuesComisionesGerencia != null && !isNaN(row.margenDespuesComisionesGerencia))
                    ? (parseFloat(row.margenDespuesComisionesGerencia) * 100).toFixed(2) + '%'
                    : '0.00%';
                var pv = row.porcentajeComision != null ? parseFloat(row.porcentajeComision) : 0;
                r.pctComisionStr = (pv < 0.02) ? (pv * 100).toFixed(2) + '%' : (isNaN(pv) ? '0.00%' : pv.toFixed(2) + '%');
                return r;
            });
            // Mismo orden y nombres de columnas que el formulario NetSuite (sublist). g=grupo visual, num=celdas en 0 se resaltan
            var cols = [
                { k: 'customForm', l: 'Formulario', g: 'base', num: false }, { k: 'fecha', l: 'Fecha', g: 'base', num: false }, { k: 'periodo', l: 'Período', g: 'base', num: false }, { k: 'type', l: 'Tipo', g: 'base', num: false }, { k: 'clase', l: 'Clase', g: 'base', num: false }, { k: 'ubicacion', l: 'Ubicación', g: 'base', num: false },
                { k: 'numeroDocumento', l: 'FV', g: 'base', num: false }, { k: 'notaCreditoNumero', l: 'Nota de Crédito', g: 'base', num: false }, { k: 'returnAuthorizationTranId', l: 'Return Auth', g: 'base', num: false }, { k: 'itemReceiptTranId', l: 'Item Receipt', g: 'base', num: false }, { k: 'salesOrderTranId', l: 'OV', g: 'base', num: false }, { k: 'fulfillmentTranId', l: 'EPA', g: 'base', num: false }, { k: 'cliente', l: 'Cliente', g: 'base', num: false }, { k: 'giroIndustrial', l: 'GIRO INDUSTRIAL', g: 'base', num: false }, { k: 'representanteVenta', l: 'Representante de Ventas', g: 'base', num: false },
                { k: 'metodoEntrega', l: 'Método de Entrega', g: 'base', num: false }, { k: 'proveedor', l: 'Proveedor', g: 'base', num: false }, { k: 'terminos', l: 'Términos', g: 'base', num: false }, { k: 'fechaAjustadaVencimiento', l: 'Fecha Ajustada Vencimiento', g: 'base', num: false }, { k: 'objetoImpuesto', l: 'Objeto de Impuesto', g: 'base', num: false }, { k: 'articulo', l: 'Artículo', g: 'base', num: false }, { k: 'cantidad', l: 'Cantidad', g: 'mn', num: true }, { k: 'costoTransporteCreated', l: 'Costo Transporte', g: 'mn', num: true }, { k: 'taxCode', l: 'Código de Impuesto', g: 'base', num: false }, { k: 'importe', l: 'Ingreso', g: 'mn', num: true },
                { k: 'tipoCambio', l: 'Tipo de Cambio', g: 'mn', num: true }, { k: 'moneda', l: 'Moneda', g: 'base', num: false }, { k: 'factorDescuento', l: 'Factor Descuento', g: 'mn', num: true }, { k: 'notaCreditoProveedor', l: 'Nota Crédito Proveedor', g: 'mn', num: true }, { k: 'costo', l: 'COSTO', g: 'mn', num: true }, { k: 'transporte', l: 'Transporte', g: 'mn', num: true },
                { k: 'costoTotal', l: 'Costo Total', g: 'mn', num: true }, { k: 'utilidadBruta', l: 'Utilidad Bruta', g: 'mn', num: true }, { k: 'margenMN', l: 'Margen MN', g: 'mn', num: true }, { k: 'ingresoUSD', l: 'INGRESO USD', g: 'usd', num: true }, { k: 'costoUSD', l: 'COSTO USD', g: 'usd', num: true }, { k: 'transporteUSD', l: 'TRANSPORTE USD', g: 'usd', num: true },
                { k: 'notaCreditoProveedorUSD', l: 'NOTA CRÉDITO PROVEEDOR USD', g: 'usd', num: true }, { k: 'costoTotalUSD', l: 'COSTO TOTAL USD', g: 'usd', num: true }, { k: 'utilidadBrutaUSD', l: 'UTILIDAD BRUTA USD', g: 'usd', num: true }, { k: 'ingresoCasa', l: 'Ingreso Casa', g: 'usd', num: true },
                { k: 'porcentajeComisionRosario', l: 'ROSARIO %', g: 'comisiones', num: true }, { k: 'comisionRosario', l: 'ROSARIO compensación', g: 'comisiones', num: true }, { k: 'porcentajeComisionAlhely', l: 'ALHELY %', g: 'comisiones', num: true }, { k: 'comisionAlhely', l: 'ALHELY compensación', g: 'comisiones', num: true },
                { k: 'porcentajeComisionGabriela', l: 'GABRIELA %', g: 'comisiones', num: true }, { k: 'comisionGabriela', l: 'GABRIELA compensación', g: 'comisiones', num: true }, { k: 'porcentajeComisionMineria', l: 'MINERIA %', g: 'comisiones', num: true }, { k: 'comisionMineria', l: 'MINERIA compensación', g: 'comisiones', num: true },
                { k: 'porcentajeComisionAgro', l: 'AGRO %', g: 'comisiones', num: true }, { k: 'comisionAgro', l: 'AGRO compensación', g: 'comisiones', num: true }, { k: 'porcentajeComisionPrieto', l: 'PRIETO %', g: 'comisiones', num: true }, { k: 'comisionPrieto', l: 'PRIETO compensación', g: 'comisiones', num: true },
                { k: 'porcentajeComisionOtros', l: 'OTROS %', g: 'comisiones', num: true }, { k: 'comisionOtros', l: 'OTROS compensación', g: 'comisiones', num: true }, { k: 'porcentajeComisionTotal', l: 'Comisión Total %', g: 'comisiones', num: true }, { k: 'comisionTotalGerentes', l: 'Comisión Total compensación', g: 'comisiones', num: true },
                { k: 'utilidadDespuesComisionesGerencia', l: 'UTILIDAD DESPUÉS DE COMISIONES DE GERENCIA', g: 'final', num: true }, { k: 'margenPctStr', l: '% Margen', g: 'final', num: false }, { k: 'pctComisionStr', l: '% Comisión', g: 'final', num: false }, { k: 'comisionTotal', l: 'Comisión', g: 'final', num: true }
            ];
            var jsonStr = JSON.stringify(dataForClient).replace(/<\/script>/gi, '<\\/script>');
            var html = '<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Reporte de Rentabilidad</title><style>';
            html += 'body{font-family:Arial,sans-serif;margin:16px;background:#fafafa;}';
            html += 'h1{color:#333;}';
            html += '.toolbar{margin:16px 0;display:flex;align-items:center;gap:12px;flex-wrap:wrap;}';
            html += '.toolbar a,.toolbar button{display:inline-block;padding:8px 16px;background:#4CAF50;color:#fff;text-decoration:none;border-radius:4px;border:none;cursor:pointer;font-size:14px;}';
            html += '#btnExportExcel{margin-right:10px;}';
            html += '.toolbar a:hover,.toolbar button:hover{background:#45a049;}';
            html += '.summary{background:#e3f2fd;padding:12px 16px;border-radius:6px;margin:16px 0;}';
            html += '.pagination{margin:12px 0;font-size:14px;}';
            html += 'table{border-collapse:collapse;width:100%;font-size:11px;background:#fff;}';
            html += 'th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;}';
            html += 'th{background:#4CAF50;color:#fff;position:sticky;top:0;}';
            html += 'tr:nth-child(even){background:#f5f5f5;}';
            html += '#report-tbody tr:hover{background:#e8f5e9;}';
            html += 'th.col-g-base{background-color:#607d8b !important;color:#fff;}td.col-g-base{background-color:#eceff1;}tr:nth-child(even) td.col-g-base{background-color:#e2e6e9;}';
            html += 'th.col-g-mn{background-color:#689f38 !important;color:#fff;}td.col-g-mn{background-color:#f1f8e9;}tr:nth-child(even) td.col-g-mn{background-color:#dcedc8;}';
            html += 'th.col-g-usd{background-color:#1976d2 !important;color:#fff;}td.col-g-usd{background-color:#e3f2fd;}tr:nth-child(even) td.col-g-usd{background-color:#bbdefb;}';
            html += 'th.col-g-comisiones{background-color:#f57c00 !important;color:#fff;}td.col-g-comisiones{background-color:#fff3e0;}tr:nth-child(even) td.col-g-comisiones{background-color:#ffe0b2;}';
            html += 'th.col-g-final{background-color:#7b1fa2 !important;color:#fff;}td.col-g-final{background-color:#f3e5f5;}tr:nth-child(even) td.col-g-final{background-color:#e1bee7;}';
            html += 'td.cell-zero{background-color:#bdbdbd !important;color:#757575;}';
            html += 'tr:hover td.cell-zero{background-color:#9e9e9e !important;color:#fff;}';
            html += '</style></head><body>';
            html += '<h1>Reporte de Rentabilidad</h1>';
            html += '<div class="toolbar">';
            html += '<a href="' + suiteletUrl + '">Nueva consulta</a>';
            if (exportSuiteletUrl) {
                html += '<button type="button" id="btnExportExcel">Exportar a Excel</button>';
            }
            html += '<form method="POST" action="' + suiteletUrl + '" style="display:inline;"><input type="hidden" name="action" value="show"><input type="hidden" name="vista" value="form">';
            html += '<input type="hidden" name="fecha_desde" value="' + esc(filters.fechaDesde) + '"><input type="hidden" name="fecha_hasta" value="' + esc(filters.fechaHasta) + '">';
            html += '<input type="hidden" name="invoice_id" value="' + esc(filters.invoiceId) + '"><input type="hidden" name="tipo_cambio_interno" value="' + esc(filters.tipoCambioInterno) + '">';
            html += '<input type="hidden" name="periodo" value="' + esc(filters.periodo) + '"><input type="hidden" name="tipo" value="' + esc(filters.tipo) + '">';
            html += '<input type="hidden" name="clase" value="' + esc(filters.clase) + '"><input type="hidden" name="ubicacion" value="' + esc(filters.ubicacion) + '">';
            html += '<input type="hidden" name="cliente" value="' + esc(filters.cliente) + '"><input type="hidden" name="giro_industrial" value="' + esc(filters.giroIndustrial) + '">';
            html += '<input type="hidden" name="representante_ventas" value="' + esc(filters.representanteVentas) + '"><input type="hidden" name="articulo" value="' + esc(filters.articulo) + '">';
            html += '<button type="submit">Ver en formulario NetSuite</button></form>';
            html += '</div>';

            // Links generales para consultar los registros usados por el cálculo
            // (debajo de botones y arriba de la sección azul de totales).
            var urlDesc = buildCustomRecordListUrl('customrecord_descuento_proveedor');
            var urlEmp = buildCustomRecordListUrl('customrecord_comisiones_empleado');
            var urlOtros = buildCustomRecordListUrl('customrecord_comisiones_otros');
            var urlParams = buildCustomRecordListUrl('customrecord_parametros_comision');
            html += '<div class="links-panel" style="background:#ffffff;border:1px solid #bbdefb;border-radius:6px;padding:12px 16px;margin:16px 0;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">';
            html += '<strong>Consultar:</strong>';
            html += '<a href="' + urlDesc + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Descuento Proveedor</a>';
            html += '<a href="' + urlEmp + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Comisión Empleado</a>';
            html += '<a href="' + urlOtros + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Comisión Artículo/Cliente/Ubicación</a>';
            html += '<a href="' + urlParams + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Parámetros de Comisión</a>';
            html += '</div>';

            if (partialMessage) {
                html += '<div class="summary" style="background:#fff3e0;border:1px solid #ff9800;"><strong>⚠ ' + esc(partialMessage) + '</strong></div>';
            }
            html += '<div class="summary"><strong>Total registros:</strong> ' + totalRows + ' &nbsp;|&nbsp; <strong>Importe:</strong> ' + formatNumber(totalImporte) + ' &nbsp;|&nbsp; <strong>Costo total:</strong> ' + formatNumber(totalCosto) + ' &nbsp;|&nbsp; <strong>Utilidad bruta:</strong> ' + formatNumber(totalUtilidad) + ' &nbsp;|&nbsp; <strong>Comisión:</strong> ' + formatNumber(totalComision) + '</div>';
            html += '<div class="pagination">Página <span id="pageInfo">1</span> de <span id="totalPages">1</span> &nbsp; <button type="button" id="prevBtn">Anterior</button> <button type="button" id="nextBtn">Siguiente</button> &nbsp; <select id="pageSizeSelect"><option value="50">50 por página</option><option value="100" selected>100 por página</option><option value="200">200 por página</option><option value="500">500 por página</option></select></div>';
            html += '<div style="overflow-x:auto;"><table><thead><tr>';
            for (var c = 0; c < cols.length; c++) html += '<th class="col-g-' + (cols[c].g || 'base') + '">' + esc(cols[c].l) + '</th>';
            html += '</tr></thead><tbody id="report-tbody"></tbody></table></div>';
            html += '<script>var reportData=' + jsonStr + ';var cols=' + JSON.stringify(cols) + ';var pageSize=100;var currentPage=1;';
            html += 'var exportSuiteletUrl="' + String(exportSuiteletUrl).replace(/\\/g, '\\\\').replace(/"/g, '\\"') + '";';
            html += 'function renderPage(){var tbody=document.getElementById("report-tbody");var totalPages=Math.max(1,Math.ceil(reportData.length/pageSize));document.getElementById("totalPages").textContent=totalPages;currentPage=Math.min(Math.max(1,currentPage),totalPages);document.getElementById("pageInfo").textContent=currentPage;var start=(currentPage-1)*pageSize;var end=Math.min(start+pageSize,reportData.length);tbody.innerHTML="";for(var i=start;i<end;i++){var row=reportData[i];var tr=document.createElement("tr");for(var j=0;j<cols.length;j++){var td=document.createElement("td");var col=cols[j];var grp=col.g||"base";td.className="col-g-"+grp;var val=row[col.k];var valStr=(val===undefined||val===null)?"":String(val);td.textContent=valStr;if(col.num){var n=parseFloat(val);if(valStr===""||(!isNaN(n)&&n===0))td.className+=" cell-zero";}tr.appendChild(td);}tbody.appendChild(tr);}document.getElementById("prevBtn").disabled=currentPage<=1;document.getElementById("nextBtn").disabled=currentPage>=totalPages;}';
            html += 'document.getElementById("prevBtn").onclick=function(){currentPage--;renderPage();};document.getElementById("nextBtn").onclick=function(){currentPage++;renderPage();};';
            html += 'document.getElementById("pageSizeSelect").onchange=function(){pageSize=parseInt(this.value,10);currentPage=1;renderPage();};renderPage();';
            if (exportSuiteletUrl) {
                html += '(function(){var btn=document.getElementById("btnExportExcel");if(!btn)return;btn.onclick=function(){if(!exportSuiteletUrl||!reportData||!reportData.length){alert("No hay datos para exportar");return;}btn.disabled=true;btn.textContent="Generando CSV...";var CHUNK=800;var fileId="";var pos=0;function sendChunk(){if(pos>=reportData.length){btn.disabled=false;btn.textContent="Exportar a Excel";return;}var end=Math.min(pos+CHUNK,reportData.length);var chunk=reportData.slice(pos,end);var lastChunk=(end>=reportData.length);var fd=new FormData();fd.append("chunk",JSON.stringify(chunk));if(fileId)fd.append("fileId",fileId);fd.append("lastChunk",lastChunk?"1":"");var xhr=new XMLHttpRequest();xhr.open("POST",exportSuiteletUrl);xhr.onreadystatechange=function(){if(xhr.readyState!==4)return;var r;try{r=JSON.parse(xhr.responseText);}catch(e){btn.disabled=false;btn.textContent="Exportar a Excel";alert("Error: "+xhr.responseText);return;}if(r.error){btn.disabled=false;btn.textContent="Exportar a Excel";alert(r.error);return;}fileId=r.fileId;pos=end;if(r.done&&r.downloadUrl){window.location=r.downloadUrl;return;}sendChunk();};xhr.send(fd);}sendChunk();};})();';
            }
            html += '<\/script>';
            html += '</body></html>';
            return html;
        }
        
        /**
         * Crea un formulario usando serverWidget para mostrar el reporte (vista=form)
         */
        var MAX_ROWS_DISPLAY = 1000;
        
        function createReportForm(results, scriptId, deploymentId, filters, exportFileId, partialMessage) {
            exportFileId = exportFileId || '';
            partialMessage = partialMessage || '';
            log.audit('ReporteRentabilidad', 'createReportForm inicio results.length=' + (results ? results.length : 0));
            var totalRows = results ? results.length : 0;
            var displayResults = totalRows > MAX_ROWS_DISPLAY ? results.slice(0, MAX_ROWS_DISPLAY) : results;
            var form = serverWidget.createForm({
                title: 'Reporte de Rentabilidad'
            });
            
            if (partialMessage) {
                form.addField({
                    id: 'custpage_partial_warning',
                    type: serverWidget.FieldType.INLINEHTML,
                    label: 'Aviso'
                }).defaultValue = '<p style="background:#fff3e0;border:1px solid #ff9800;padding:10px;border-radius:4px;"><strong>⚠ ' + (partialMessage.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')) + '</strong></p>';
            }
            
            // Asegurar que al hacer clic en "Regenerar Reporte" se envíe action=show
            var actionField = form.addField({
                id: 'action',
                type: serverWidget.FieldType.TEXT,
                label: 'action'
            });
            actionField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });
            actionField.defaultValue = 'show';
            
            // Botones en la parte superior (mismo estilo ambos)
            var esc = function(v) { return (v != null && v !== '') ? String(v).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;') : ''; };
            var btnStyle = 'display:inline-block;background-color:#4CAF50;color:white;padding:10px 20px;font-size:14px;font-family:Arial,sans-serif;border-radius:4px;border:none;cursor:pointer;text-decoration:none;text-align:center;margin-right:10px;';
            var exportBtnStyle = 'display:inline-block;background-color:#4CAF50;color:white;padding:10px 20px;font-size:14px;font-family:Arial,sans-serif;border-radius:4px;border:none;cursor:pointer;text-align:center;';
            var suiteletUrl = '/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId;
            var exportLink = getExportSuiteletUrl() ? (getExportSuiteletUrl() + '&fileId=' + esc(exportFileId)) : (suiteletUrl + '&action=export&fileId=' + esc(exportFileId));
            var exportFormHtml = '<a href="' + exportLink + '" style="' + exportBtnStyle + 'text-decoration:none;">Exportar a Excel</a>';
            var htmlViewForm = '<form method="POST" action="' + suiteletUrl + '" style="display:inline;margin:0;">';
            htmlViewForm += '<input type="hidden" name="action" value="show"><input type="hidden" name="vista" value="html">';
            htmlViewForm += '<input type="hidden" name="invoice_id" value="' + esc(filters.invoiceId) + '">';
            htmlViewForm += '<input type="hidden" name="fecha_desde" value="' + esc(filters.fechaDesde) + '"><input type="hidden" name="fecha_hasta" value="' + esc(filters.fechaHasta) + '">';
            htmlViewForm += '<input type="hidden" name="tipo_cambio_interno" value="' + esc(filters.tipoCambioInterno) + '"><input type="hidden" name="periodo" value="' + esc(filters.periodo) + '"><input type="hidden" name="tipo" value="' + esc(filters.tipo) + '">';
            htmlViewForm += '<input type="hidden" name="clase" value="' + esc(filters.clase) + '"><input type="hidden" name="ubicacion" value="' + esc(filters.ubicacion) + '">';
            htmlViewForm += '<input type="hidden" name="cliente" value="' + esc(filters.cliente) + '"><input type="hidden" name="giro_industrial" value="' + esc(filters.giroIndustrial) + '">';
            htmlViewForm += '<input type="hidden" name="representante_ventas" value="' + esc(filters.representanteVentas) + '"><input type="hidden" name="articulo" value="' + esc(filters.articulo) + '">';
            htmlViewForm += '<button type="submit" style="' + exportBtnStyle + '">Ver en HTML (paginado)</button></form>';
            var accionesGroup = form.addFieldGroup({ id: 'acciones_group', label: 'Acciones' });
            form.addField({
                id: 'custpage_acciones_buttons',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Acciones',
                container: 'acciones_group'
            }).defaultValue = '<a href="' + suiteletUrl + '" style="' + btnStyle + '">Nueva consulta</a>' + exportFormHtml + htmlViewForm;
            
            // Grupo de filtros principales (siempre visible)
            var filterGroupMain = form.addFieldGroup({
                id: 'filtergroup_main',
                label: 'Filtros Principales'
            });
            
            // Campo de ID de Invoice
            var invoiceIdField = form.addField({
                id: 'invoice_id',
                type: serverWidget.FieldType.TEXT,
                label: 'ID de Invoice',
                container: 'filtergroup_main'
            });
            invoiceIdField.defaultValue = filters.invoiceId || '';
            
            // Campo de fecha desde
            var fechaDesdeField = form.addField({
                id: 'fecha_desde',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha Desde',
                container: 'filtergroup_main'
            });
            if (filters.fechaDesde) {
                fechaDesdeField.defaultValue = filters.fechaDesde;
            }
            
            // Campo de fecha hasta
            var fechaHastaField = form.addField({
                id: 'fecha_hasta',
                type: serverWidget.FieldType.DATE,
                label: 'Fecha Hasta',
                container: 'filtergroup_main'
            });
            if (filters.fechaHasta) {
                fechaHastaField.defaultValue = filters.fechaHasta;
            }
            
            // Campo de Tipo de cambio Interno (modificable, default 18)
            var tipoCambioInternoField = form.addField({
                id: 'tipo_cambio_interno',
                type: serverWidget.FieldType.FLOAT,
                label: 'Tipo de cambio Interno',
                container: 'filtergroup_main'
            });
            tipoCambioInternoField.defaultValue = filters.tipoCambioInterno || 18;
            
            // Grupo de filtros secundarios (colapsable)
            var filterGroupSec = form.addFieldGroup({
                id: 'filtergroup_sec',
                label: 'Filtros Adicionales (Opcional)'
            });
            filterGroupSec.isCollapsible = true;
            filterGroupSec.isCollapsed = true;
            
            // Campo de período como texto (evita loadAccountingPeriodOptions y ahorra unidades de gobierno)
            var periodoField = form.addField({
                id: 'periodo',
                type: serverWidget.FieldType.TEXT,
                label: 'Período',
                container: 'filtergroup_sec'
            });
            periodoField.defaultValue = filters.periodo || '';
            
            // Campo de tipo
            var tipoField = form.addField({
                id: 'tipo',
                type: serverWidget.FieldType.SELECT,
                label: 'Tipo',
                container: 'filtergroup_sec'
            });
            tipoField.addSelectOption({ value: '', text: '-- Todos --' });
            tipoField.addSelectOption({ value: 'CustInvc', text: 'Factura de Venta' });
            tipoField.addSelectOption({ value: 'CustCred', text: 'Nota de Crédito' });
            if (filters.tipo) {
                tipoField.defaultValue = filters.tipo;
            }
            
            // Campo de clase
            var claseField = form.addField({
                id: 'clase',
                type: serverWidget.FieldType.SELECT,
                label: 'Clase',
                container: 'filtergroup_sec',
                source: 'classification'
            });
            if (filters.clase) {
                claseField.defaultValue = filters.clase;
            }
            
            // Campo de ubicación
            var ubicacionField = form.addField({
                id: 'ubicacion',
                type: serverWidget.FieldType.SELECT,
                label: 'Ubicación',
                container: 'filtergroup_sec',
                source: 'location'
            });
            if (filters.ubicacion) {
                ubicacionField.defaultValue = filters.ubicacion;
            }
            
            // Campo de cliente
            var clienteField = form.addField({
                id: 'cliente',
                type: serverWidget.FieldType.SELECT,
                label: 'Cliente',
                container: 'filtergroup_sec',
                source: 'customer'
            });
            if (filters.cliente) {
                clienteField.defaultValue = filters.cliente;
            }
            
            // Campo de GIRO INDUSTRIAL
            var giroField = form.addField({
                id: 'giro_industrial',
                type: serverWidget.FieldType.SELECT,
                label: 'GIRO INDUSTRIAL',
                container: 'filtergroup_sec',
                source: 'custcategory'
            });
            if (filters.giroIndustrial) {
                giroField.defaultValue = filters.giroIndustrial;
            }
            
            // Campo de representante de ventas
            var repVentasField = form.addField({
                id: 'representante_ventas',
                type: serverWidget.FieldType.SELECT,
                label: 'Representante de Ventas',
                container: 'filtergroup_sec',
                source: 'employee'
            });
            if (filters.representanteVentas) {
                repVentasField.defaultValue = filters.representanteVentas;
            }
            
            // Campo de artículo
            var articuloField = form.addField({
                id: 'articulo',
                type: serverWidget.FieldType.SELECT,
                label: 'Artículo',
                container: 'filtergroup_sec',
                source: 'item'
            });
            if (filters.articulo) {
                articuloField.defaultValue = filters.articulo;
            }

            // Links generales (debajo de botones, arriba de la sección azul de totales)
            var linksGroup = form.addFieldGroup({
                id: 'links_group',
                label: 'Consultar registros del cálculo'
            });
            var urlDescForm = buildCustomRecordListUrl('customrecord_descuento_proveedor');
            var urlEmpForm = buildCustomRecordListUrl('customrecord_comisiones_empleado');
            var urlOtrosForm = buildCustomRecordListUrl('customrecord_comisiones_otros');
            var urlParamsForm = buildCustomRecordListUrl('customrecord_parametros_comision');
            form.addField({
                id: 'custpage_url_links_general',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ' ,
                container: 'links_group'
            }).defaultValue =
                '<div style="background:#ffffff;border:1px solid #bbdefb;border-radius:6px;padding:12px 16px;margin-top:8px;display:flex;gap:12px;flex-wrap:wrap;align-items:center;">' +
                '<strong>Consultar:</strong>' +
                '<a href="' + urlDescForm + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Descuento Proveedor</a>' +
                '<a href="' + urlEmpForm + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Comisión Empleado</a>' +
                '<a href="' + urlOtrosForm + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Comisión Artículo/Cliente/Ubicación</a>' +
                '<a href="' + urlParamsForm + '" target="_blank" style="background:#e3f2fd;color:#0d47a1;text-decoration:none;padding:6px 10px;border-radius:4px;">Parámetros de Comisión</a>' +
                '</div>';
            
            // Grupo de resumen (totales de interés)
            var totalIngreso = 0, totalCosto = 0, totalUtilidad = 0, totalComision = 0, totalImporte = 0;
            results.forEach(function(row) {
                totalIngreso += row.montoBase || 0;
                totalCosto += row.costoTotal || 0;
                totalUtilidad += row.utilidadBruta || 0;
                totalComision += row.comisionTotal || 0;
                totalImporte += row.importe || 0;
            });
            var margenPct = totalIngreso > 0 ? (totalUtilidad / totalIngreso) * 100 : 0;
            
            var summaryGroup = form.addFieldGroup({
                id: 'summary_group',
                label: 'Resumen'
            });
            
            form.addField({
                id: 'total_registros',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Total de Registros',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Total de Registros:</strong> ' + results.length + '</p>';
            
            form.addField({
                id: 'total_importe',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Importe Total',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Importe Total:</strong> $' + formatNumber(totalImporte) + '</p>';
            
            form.addField({
                id: 'total_ingreso',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Ingreso Total',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Ingreso Total:</strong> $' + formatNumber(totalIngreso) + '</p>';
            
            form.addField({
                id: 'total_costo',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Costo Total',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Costo Total:</strong> $' + formatNumber(totalCosto) + '</p>';
            
            form.addField({
                id: 'total_utilidad',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Utilidad Bruta',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Utilidad Bruta:</strong> $' + formatNumber(totalUtilidad) + '</p>';
            
            form.addField({
                id: 'total_comision',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Comisión Total',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Comisión Total:</strong> $' + formatNumber(totalComision) + '</p>';
            
            form.addField({
                id: 'margen_promedio',
                type: serverWidget.FieldType.INLINEHTML,
                label: 'Margen Promedio',
                container: 'summary_group'
            }).defaultValue = '<p><strong>Margen Promedio:</strong> ' + (margenPct.toFixed(2)) + '%</p>';
            
            // Sublist para mostrar los resultados
            var resultsSublist = form.addSublist({
                id: 'results_sublist',
                type: serverWidget.SublistType.LIST,
                label: 'Resultados del Reporte'
            });
            
            // Agregar columnas a la sublist (todos los IDs deben tener prefijo custpage_)
            var field1 = resultsSublist.addField({
                id: 'custpage_customform',
                type: serverWidget.FieldType.TEXT,
                label: 'Formulario'
            });
            field1.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field2 = resultsSublist.addField({
                id: 'custpage_fecha',
                type: serverWidget.FieldType.TEXT,
                label: 'Fecha'
            });
            field2.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field3 = resultsSublist.addField({
                id: 'custpage_periodo',
                type: serverWidget.FieldType.TEXT,
                label: 'Período'
            });
            field3.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field4 = resultsSublist.addField({
                id: 'custpage_type',
                type: serverWidget.FieldType.TEXT,
                label: 'Tipo'
            });
            field4.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field5 = resultsSublist.addField({
                id: 'custpage_clase',
                type: serverWidget.FieldType.TEXT,
                label: 'Clase'
            });
            field5.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field6 = resultsSublist.addField({
                id: 'custpage_ubicacion',
                type: serverWidget.FieldType.TEXT,
                label: 'Ubicación'
            });
            field6.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field7 = resultsSublist.addField({
                id: 'custpage_numero_documento',
                type: serverWidget.FieldType.TEXT,
                label: 'FV'
            });
            field7.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field7nc = resultsSublist.addField({
                id: 'custpage_nota_credito_numero',
                type: serverWidget.FieldType.TEXT,
                label: 'Nota de Crédito'
            });
            field7nc.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field7ra = resultsSublist.addField({
                id: 'custpage_return_auth_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'Return Auth'
            });
            field7ra.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field7ir = resultsSublist.addField({
                id: 'custpage_item_receipt_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'Item Receipt'
            });
            field7ir.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field18 = resultsSublist.addField({
                id: 'custpage_sales_order_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'OV'
            });
            field18.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field19 = resultsSublist.addField({
                id: 'custpage_fulfillment_tranid',
                type: serverWidget.FieldType.TEXT,
                label: 'EPA'
            });
            field19.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field8 = resultsSublist.addField({
                id: 'custpage_cliente',
                type: serverWidget.FieldType.TEXT,
                label: 'Cliente'
            });
            field8.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field9 = resultsSublist.addField({
                id: 'custpage_giro_industrial',
                type: serverWidget.FieldType.TEXT,
                label: 'GIRO INDUSTRIAL'
            });
            field9.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field11 = resultsSublist.addField({
                id: 'custpage_representante_venta',
                type: serverWidget.FieldType.TEXT,
                label: 'Representante de Ventas'
            });
            field11.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field14 = resultsSublist.addField({
                id: 'custpage_metodo_entrega',
                type: serverWidget.FieldType.TEXT,
                label: 'Método de Entrega'
            });
            field14.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            resultsSublist.addField({ id: 'custpage_proveedor', type: serverWidget.FieldType.TEXT, label: 'Proveedor' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            resultsSublist.addField({ id: 'custpage_terminos', type: serverWidget.FieldType.TEXT, label: 'Términos' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            resultsSublist.addField({ id: 'custpage_fecha_ajustada_venc', type: serverWidget.FieldType.DATE, label: 'Fecha Ajustada Vencimiento' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            resultsSublist.addField({ id: 'custpage_objeto_impuesto', type: serverWidget.FieldType.TEXT, label: 'Objeto de Impuesto' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field10 = resultsSublist.addField({
                id: 'custpage_articulo',
                type: serverWidget.FieldType.TEXT,
                label: 'Artículo'
            });
            field10.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field12 = resultsSublist.addField({
                id: 'custpage_cantidad',
                type: serverWidget.FieldType.FLOAT,
                label: 'Cantidad'
            });
            field12.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field15 = resultsSublist.addField({
                id: 'custpage_costo_transporte',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Costo Transporte'
            });
            field15.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field20 = resultsSublist.addField({
                id: 'custpage_tax_code',
                type: serverWidget.FieldType.TEXT,
                label: 'Código de Impuesto'
            });
            field20.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field13 = resultsSublist.addField({
                id: 'custpage_importe',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Ingreso'
            });
            field13.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field16 = resultsSublist.addField({
                id: 'custpage_tipo_cambio',
                type: serverWidget.FieldType.FLOAT,
                label: 'Tipo de Cambio'
            });
            field16.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field17 = resultsSublist.addField({
                id: 'custpage_moneda',
                type: serverWidget.FieldType.TEXT,
                label: 'Moneda'
            });
            field17.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field23 = resultsSublist.addField({
                id: 'custpage_factor_descuento',
                type: serverWidget.FieldType.FLOAT,
                label: 'Factor Descuento'
            });
            field23.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field24 = resultsSublist.addField({
                id: 'custpage_nota_credito_proveedor',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Nota Crédito Proveedor'
            });
            field24.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field22 = resultsSublist.addField({
                id: 'custpage_costo',
                type: serverWidget.FieldType.CURRENCY,
                label: 'COSTO'
            });
            field22.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field25 = resultsSublist.addField({
                id: 'custpage_transporte',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Transporte'
            });
            field25.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field26 = resultsSublist.addField({
                id: 'custpage_costo_total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Costo Total'
            });
            field26.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field27 = resultsSublist.addField({
                id: 'custpage_utilidad_bruta',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Utilidad Bruta'
            });
            field27.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field28 = resultsSublist.addField({
                id: 'custpage_margen_mn',
                type: serverWidget.FieldType.FLOAT,
                label: 'Margen MN'
            });
            field28.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field29 = resultsSublist.addField({
                id: 'custpage_ingreso_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'INGRESO USD'
            });
            field29.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field30 = resultsSublist.addField({
                id: 'custpage_costo_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'COSTO USD'
            });
            field30.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field31 = resultsSublist.addField({
                id: 'custpage_transporte_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'TRANSPORTE USD'
            });
            field31.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field32 = resultsSublist.addField({
                id: 'custpage_nota_credito_proveedor_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'NOTA CRÉDITO PROVEEDOR USD'
            });
            field32.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field33 = resultsSublist.addField({
                id: 'custpage_costo_total_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'COSTO TOTAL USD'
            });
            field33.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field34 = resultsSublist.addField({
                id: 'custpage_utilidad_bruta_usd',
                type: serverWidget.FieldType.CURRENCY,
                label: 'UTILIDAD BRUTA USD'
            });
            field34.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field35 = resultsSublist.addField({
                id: 'custpage_ingreso_casa',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Ingreso Casa'
            });
            field35.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            // Columnas de comisión por gerente: intercaladas % y compensación (monto) para cada uno
            // ROSARIO % → ROSARIO compensación → ALHELY % → ALHELY compensación → ...
            var field36 = resultsSublist.addField({
                id: 'custpage_porcentaje_rosario',
                type: serverWidget.FieldType.PERCENT,
                label: 'ROSARIO %'
            });
            field36.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field37 = resultsSublist.addField({
                id: 'custpage_comision_rosario',
                type: serverWidget.FieldType.CURRENCY,
                label: 'ROSARIO compensación'
            });
            field37.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field38 = resultsSublist.addField({
                id: 'custpage_porcentaje_alhely',
                type: serverWidget.FieldType.PERCENT,
                label: 'ALHELY %'
            });
            field38.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field39 = resultsSublist.addField({
                id: 'custpage_comision_alhely',
                type: serverWidget.FieldType.CURRENCY,
                label: 'ALHELY compensación'
            });
            field39.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field40 = resultsSublist.addField({
                id: 'custpage_porcentaje_gabriela',
                type: serverWidget.FieldType.PERCENT,
                label: 'GABRIELA %'
            });
            field40.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field41 = resultsSublist.addField({
                id: 'custpage_comision_gabriela',
                type: serverWidget.FieldType.CURRENCY,
                label: 'GABRIELA compensación'
            });
            field41.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field42 = resultsSublist.addField({
                id: 'custpage_porcentaje_mineria',
                type: serverWidget.FieldType.PERCENT,
                label: 'MINERIA %'
            });
            field42.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field43 = resultsSublist.addField({
                id: 'custpage_comision_mineria',
                type: serverWidget.FieldType.CURRENCY,
                label: 'MINERIA compensación'
            });
            field43.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field44 = resultsSublist.addField({
                id: 'custpage_porcentaje_agro',
                type: serverWidget.FieldType.PERCENT,
                label: 'AGRO %'
            });
            field44.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field45 = resultsSublist.addField({
                id: 'custpage_comision_agro',
                type: serverWidget.FieldType.CURRENCY,
                label: 'AGRO compensación'
            });
            field45.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field46 = resultsSublist.addField({
                id: 'custpage_porcentaje_prieto',
                type: serverWidget.FieldType.PERCENT,
                label: 'PRIETO %'
            });
            field46.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field47 = resultsSublist.addField({
                id: 'custpage_comision_prieto',
                type: serverWidget.FieldType.CURRENCY,
                label: 'PRIETO compensación'
            });
            field47.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field48 = resultsSublist.addField({
                id: 'custpage_porcentaje_otros',
                type: serverWidget.FieldType.PERCENT,
                label: 'OTROS %'
            });
            field48.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field49 = resultsSublist.addField({
                id: 'custpage_comision_otros',
                type: serverWidget.FieldType.CURRENCY,
                label: 'OTROS compensación'
            });
            field49.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            var field50 = resultsSublist.addField({
                id: 'custpage_porcentaje_total',
                type: serverWidget.FieldType.PERCENT,
                label: 'Comisión Total %'
            });
            field50.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field51 = resultsSublist.addField({
                id: 'custpage_comision_total_gerentes',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Comisión Total compensación'
            });
            field51.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field52 = resultsSublist.addField({
                id: 'custpage_utilidad_despues_comisiones_gerencia',
                type: serverWidget.FieldType.CURRENCY,
                label: 'UTILIDAD DESPUÉS DE COMISIONES DE GERENCIA'
            });
            field52.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field53 = resultsSublist.addField({
                id: 'custpage_margen_despues_comisiones_gerencia',
                type: serverWidget.FieldType.TEXT,
                label: '% Margen'
            });
            field53.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            // % Comisión (custom record por margen) y Comisión (monto USD) al final del orden
            var field54 = resultsSublist.addField({
                id: 'custpage_porcentaje_comision',
                type: serverWidget.FieldType.TEXT,
                label: '% Comisión'
            });
            field54.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            var field55 = resultsSublist.addField({
                id: 'custpage_comision_total',
                type: serverWidget.FieldType.CURRENCY,
                label: 'Comisión'
            });
            field55.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
            
            // serverWidget.Sublist.setSublistValue en Suitelets solo acepta value tipo STRING
            var safeStr = function(v) {
                if (v === undefined || v === null) return '';
                var s = String(v);
                return (s === 'undefined' || s === 'null') ? '' : s;
            };
            var safeNum = function(v) {
                if (v === undefined || v === null) return 0;
                var n = Number(v);
                return (n !== n) ? 0 : n;
            };
            function setCell(id, line, val, isNum) {
                var v;
                if (isNum) {
                    v = (val === undefined || val === null) ? '0' : ('' + (Number(val) || 0));
                } else {
                    try { v = (val === undefined || val === null) ? '' : ('' + val); } catch (e) { v = ''; }
                    if (v === '' || v === undefined || v === null) v = '\u00A0';
                }
                resultsSublist.setSublistValue({ id: id, line: line, value: v });
            }
            log.audit('ReporteRentabilidad', 'createReportForm llenando sublist filas=' + results.length);
            for (var index = 0; index < results.length; index++) {
                var row = results[index];
                var lastFieldId = '';
                try {
                    lastFieldId = 'custpage_customform'; setCell('custpage_customform', index, row.customForm, false);
                    lastFieldId = 'custpage_fecha'; setCell('custpage_fecha', index, row.fecha, false);
                    lastFieldId = 'custpage_periodo'; setCell('custpage_periodo', index, row.periodo, false);
                    lastFieldId = 'custpage_type'; setCell('custpage_type', index, row.type, false);
                    lastFieldId = 'custpage_clase'; setCell('custpage_clase', index, row.clase, false);
                    lastFieldId = 'custpage_ubicacion'; setCell('custpage_ubicacion', index, row.ubicacion, false);
                    lastFieldId = 'custpage_numero_documento'; setCell('custpage_numero_documento', index, row.numeroDocumento, false);
                    lastFieldId = 'custpage_nota_credito_numero'; setCell('custpage_nota_credito_numero', index, row.notaCreditoNumero != null ? row.notaCreditoNumero : '', false);
                    lastFieldId = 'custpage_return_auth_tranid'; setCell('custpage_return_auth_tranid', index, row.returnAuthorizationTranId != null ? row.returnAuthorizationTranId : '', false);
                    lastFieldId = 'custpage_item_receipt_tranid'; setCell('custpage_item_receipt_tranid', index, row.itemReceiptTranId != null ? row.itemReceiptTranId : '', false);
                    lastFieldId = 'custpage_sales_order_tranid'; setCell('custpage_sales_order_tranid', index, row.salesOrderTranId, false);
                    lastFieldId = 'custpage_fulfillment_tranid'; setCell('custpage_fulfillment_tranid', index, row.fulfillmentTranId, false);
                    lastFieldId = 'custpage_cliente'; setCell('custpage_cliente', index, row.cliente, false);
                    lastFieldId = 'custpage_giro_industrial'; setCell('custpage_giro_industrial', index, row.giroIndustrial, false);
                    lastFieldId = 'custpage_representante_venta'; setCell('custpage_representante_venta', index, row.representanteVenta, false);
                    lastFieldId = 'custpage_metodo_entrega'; setCell('custpage_metodo_entrega', index, row.metodoEntrega, false);
                    lastFieldId = 'custpage_proveedor'; setCell('custpage_proveedor', index, row.proveedor, false);
                    lastFieldId = 'custpage_terminos'; setCell('custpage_terminos', index, row.terminos, false);
                    lastFieldId = 'custpage_fecha_ajustada_venc'; setCell('custpage_fecha_ajustada_venc', index, row.fechaAjustadaVencimiento, false);
                    lastFieldId = 'custpage_objeto_impuesto'; setCell('custpage_objeto_impuesto', index, row.objetoImpuesto, false);
                    lastFieldId = 'custpage_articulo'; setCell('custpage_articulo', index, row.articulo, false);
                    var cantidadValue = safeNum(row.cantidad);
                    cantidadValue = Math.round(cantidadValue);
                    if (cantidadValue !== cantidadValue) cantidadValue = 0;
                    lastFieldId = 'custpage_cantidad'; setCell('custpage_cantidad', index, cantidadValue, true);
                
                    lastFieldId = 'custpage_costo_transporte'; setCell('custpage_costo_transporte', index, row.costoTransporteCreated, true);
                    lastFieldId = 'custpage_tax_code'; setCell('custpage_tax_code', index, row.taxCode, false);
                    lastFieldId = 'custpage_importe'; setCell('custpage_importe', index, row.importe, true);
                    lastFieldId = 'custpage_tipo_cambio'; setCell('custpage_tipo_cambio', index, row.tipoCambio, true);
                    lastFieldId = 'custpage_moneda'; setCell('custpage_moneda', index, row.moneda, false);
                
                    lastFieldId = 'custpage_factor_descuento'; setCell('custpage_factor_descuento', index, row.factorDescuento, true);
                    lastFieldId = 'custpage_nota_credito_proveedor'; setCell('custpage_nota_credito_proveedor', index, row.notaCreditoProveedor, true);
                    lastFieldId = 'custpage_costo'; setCell('custpage_costo', index, row.costo, true);
                    lastFieldId = 'custpage_transporte'; setCell('custpage_transporte', index, row.transporte, true);
                    lastFieldId = 'custpage_costo_total'; setCell('custpage_costo_total', index, row.costoTotal, true);
                    lastFieldId = 'custpage_utilidad_bruta'; setCell('custpage_utilidad_bruta', index, row.utilidadBruta, true);
                    lastFieldId = 'custpage_margen_mn'; setCell('custpage_margen_mn', index, row.margenMN, true);
                    lastFieldId = 'custpage_ingreso_usd'; setCell('custpage_ingreso_usd', index, row.ingresoUSD, true);
                    lastFieldId = 'custpage_costo_usd'; setCell('custpage_costo_usd', index, row.costoUSD, true);
                    lastFieldId = 'custpage_transporte_usd'; setCell('custpage_transporte_usd', index, row.transporteUSD, true);
                    lastFieldId = 'custpage_nota_credito_proveedor_usd'; setCell('custpage_nota_credito_proveedor_usd', index, row.notaCreditoProveedorUSD, true);
                    lastFieldId = 'custpage_costo_total_usd'; setCell('custpage_costo_total_usd', index, row.costoTotalUSD, true);
                    lastFieldId = 'custpage_utilidad_bruta_usd'; setCell('custpage_utilidad_bruta_usd', index, row.utilidadBrutaUSD, true);
                    lastFieldId = 'custpage_ingreso_casa'; setCell('custpage_ingreso_casa', index, row.ingresoCasa, true);
                    lastFieldId = 'custpage_porcentaje_rosario'; setCell('custpage_porcentaje_rosario', index, row.porcentajeComisionRosario, true);
                    lastFieldId = 'custpage_porcentaje_alhely'; setCell('custpage_porcentaje_alhely', index, row.porcentajeComisionAlhely, true);
                    lastFieldId = 'custpage_porcentaje_gabriela'; setCell('custpage_porcentaje_gabriela', index, row.porcentajeComisionGabriela, true);
                    lastFieldId = 'custpage_porcentaje_mineria'; setCell('custpage_porcentaje_mineria', index, row.porcentajeComisionMineria, true);
                    lastFieldId = 'custpage_porcentaje_agro'; setCell('custpage_porcentaje_agro', index, row.porcentajeComisionAgro, true);
                    lastFieldId = 'custpage_porcentaje_prieto'; setCell('custpage_porcentaje_prieto', index, row.porcentajeComisionPrieto, true);
                    lastFieldId = 'custpage_porcentaje_otros'; setCell('custpage_porcentaje_otros', index, row.porcentajeComisionOtros, true);
                    lastFieldId = 'custpage_porcentaje_total'; setCell('custpage_porcentaje_total', index, row.porcentajeComisionTotal, true);
                    lastFieldId = 'custpage_comision_rosario'; setCell('custpage_comision_rosario', index, row.comisionRosario, true);
                    lastFieldId = 'custpage_comision_alhely'; setCell('custpage_comision_alhely', index, row.comisionAlhely, true);
                    lastFieldId = 'custpage_comision_gabriela'; setCell('custpage_comision_gabriela', index, row.comisionGabriela, true);
                    lastFieldId = 'custpage_comision_mineria'; setCell('custpage_comision_mineria', index, row.comisionMineria, true);
                    lastFieldId = 'custpage_comision_agro'; setCell('custpage_comision_agro', index, row.comisionAgro, true);
                    lastFieldId = 'custpage_comision_prieto'; setCell('custpage_comision_prieto', index, row.comisionPrieto, true);
                    lastFieldId = 'custpage_comision_otros'; setCell('custpage_comision_otros', index, row.comisionOtros, true);
                    lastFieldId = 'custpage_comision_total_gerentes'; setCell('custpage_comision_total_gerentes', index, row.comisionTotalGerentes, true);
                    lastFieldId = 'custpage_utilidad_despues_comisiones_gerencia'; setCell('custpage_utilidad_despues_comisiones_gerencia', index, row.utilidadDespuesComisionesGerencia, true);
                    var margenPctStr = (row.margenDespuesComisionesGerencia != null && !isNaN(row.margenDespuesComisionesGerencia))
                        ? (parseFloat(row.margenDespuesComisionesGerencia) * 100).toFixed(2) + '%'
                        : '0.00%';
                    lastFieldId = 'custpage_margen_despues_comisiones_gerencia'; setCell('custpage_margen_despues_comisiones_gerencia', index, margenPctStr || '0.00%', false);
                    var pctVal = row.porcentajeComision != null ? parseFloat(row.porcentajeComision) : 0;
                    var pctComisionStr = (pctVal < 0.02)
                        ? (pctVal * 100).toFixed(2) + '%'
                        : (isNaN(pctVal) ? '0.00%' : pctVal.toFixed(2) + '%');
                    lastFieldId = 'custpage_porcentaje_comision'; setCell('custpage_porcentaje_comision', index, pctComisionStr || '0.00%', false);
                    lastFieldId = 'custpage_comision_total'; setCell('custpage_comision_total', index, row.comisionTotal, true);
                } catch (e) {
                    log.error('ReporteRentabilidad setSublistValue', 'line=' + index + ' field=' + lastFieldId + ' error=' + (e.message || e.name));
                    throw e;
                }
            }
            log.audit('ReporteRentabilidad', 'createReportForm sublist listo total=' + results.length);
            
            return form;
        }
        
        /**
         * Genera el HTML del reporte
         */
        function generateReportHTML(results, scriptId, deploymentId, filters) {
            var html = '<!DOCTYPE html><html><head>';
            html += '<meta charset="UTF-8">';
            html += '<title>Reporte de Rentabilidad</title>';
            html += '<style>';
            html += 'body { font-family: Arial, sans-serif; margin: 20px; }';
            html += 'h1 { color: #333; }';
            html += 'table { border-collapse: collapse; width: 100%; font-size: 11px; }';
            html += 'th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }';
            html += 'th { background-color: #4CAF50; color: white; position: sticky; top: 0; }';
            html += 'tr:nth-child(even) { background-color: #f2f2f2; }';
            html += '.report-btn { display:inline-block; background-color:#4CAF50; color:white; padding:10px 20px; font-size:14px; font-family:Arial,sans-serif; border-radius:4px; border:none; cursor:pointer; text-decoration:none; text-align:center; margin-right:10px; }';
            html += '.report-btn:hover { background-color:#45a049; }';
            html += '.summary { background-color: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 5px; }';
            html += '</style>';
            html += '</head><body>';
            
            html += '<h1>Reporte de Rentabilidad</h1>';
            html += '<p>Total de registros: ' + results.length + '</p>';
            
            // Formulario de filtros visible (para regenerar reporte)
            html += '<div class="filters-panel" style="background-color: #f5f5f5; padding: 15px; margin: 20px 0; border-radius: 5px;">';
            html += '<h3>Filtros de Búsqueda</h3>';
            html += '<form method="POST" action="/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId + '" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px;">';
            
            // Filtros principales
            html += '<div><label>ID de Invoice:</label><br><input type="text" name="invoice_id" value="' + (filters.invoiceId || '') + '" placeholder="Opcional" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Fecha Desde:</label><br><input type="date" name="fecha_desde" value="' + (filters.fechaDesde || '') + '" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Fecha Hasta:</label><br><input type="date" name="fecha_hasta" value="' + (filters.fechaHasta || '') + '" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Período:</label><br><input type="text" name="periodo" value="' + (filters.periodo || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Tipo:</label><br><select name="tipo" style="width: 100%; padding: 5px;"><option value="">-- Todos --</option><option value="CustInvc"' + (filters.tipo === 'CustInvc' ? ' selected' : '') + '>Factura de Venta</option><option value="CustCred"' + (filters.tipo === 'CustCred' ? ' selected' : '') + '>Nota de Crédito</option></select></div>';
            html += '<div><label>Clase:</label><br><input type="text" name="clase" value="' + (filters.clase || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Ubicación:</label><br><input type="text" name="ubicacion" value="' + (filters.ubicacion || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Cliente:</label><br><input type="text" name="cliente" value="' + (filters.cliente || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>GIRO INDUSTRIAL:</label><br><input type="text" name="giro_industrial" value="' + (filters.giroIndustrial || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Representante de Ventas:</label><br><input type="text" name="representante_ventas" value="' + (filters.representanteVentas || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            html += '<div><label>Artículo:</label><br><input type="text" name="articulo" value="' + (filters.articulo || '') + '" placeholder="ID o nombre" style="width: 100%; padding: 5px;"></div>';
            
            html += '<div style="grid-column: span 3; text-align: right; margin-top: 10px;">';
            var suiteletUrlHtml = '/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId;
            html += '<a href="' + suiteletUrlHtml + '" class="report-btn">Nueva consulta</a>';
            html += '</div>';
            html += '</form>';
            html += '</div>';
            
            // Resumen
            var totalIngreso = 0;
            var totalCosto = 0;
            var totalUtilidad = 0;
            var totalComision = 0;
            
            results.forEach(function(row) {
                totalIngreso += row.montoBase || 0;
                totalCosto += row.costoTotal || 0;
                totalUtilidad += row.utilidadBruta || 0;
                totalComision += row.comisionTotal || 0;
            });
            
            html += '<div class="summary">';
            html += '<h3>Resumen</h3>';
            html += '<p><strong>Ingreso Total:</strong> $' + formatNumber(totalIngreso) + '</p>';
            html += '<p><strong>Costo Total:</strong> $' + formatNumber(totalCosto) + '</p>';
            html += '<p><strong>Utilidad Bruta:</strong> $' + formatNumber(totalUtilidad) + '</p>';
            html += '<p><strong>Comisión Total:</strong> $' + formatNumber(totalComision) + '</p>';
            html += '<p><strong>Margen Promedio:</strong> ' + (totalIngreso > 0 ? formatPercent(totalUtilidad / totalIngreso) : '0%') + '</p>';
            html += '</div>';
            
            // Tabla de resultados - Campos obligatorios primero
            html += '<div style="overflow-x: auto;">';
            html += '<table>';
            html += '<thead><tr>';
            // Campos obligatorios (en el orden especificado)
            html += '<th>ID Interno</th>';
            html += '<th>Formulario Personalizado</th>';
            html += '<th>Fecha</th>';
            html += '<th>Período</th>';
            html += '<th>Tipo</th>';
            html += '<th>Clase</th>';
            html += '<th>Ubicación</th>';
            html += '<th>Número de Documento</th>';
            html += '<th>Cliente</th>';
            html += '<th>GIRO INDUSTRIAL</th>';
            html += '<th>Artículo</th>';
            html += '<th>Representante de Ventas</th>';
            // Campos de datos base
            html += '<th>Cantidad</th>';
            html += '<th>Importe</th>';
            html += '<th>Método de Entrega</th>';
            html += '<th>Costo Transporte Created From</th>';
            html += '<th>Costo Transporte</th>';
            html += '<th>Costo Transporte por Producto</th>';
            html += '<th>Costo por Línea de la Transacción V2</th>';
            html += '<th>Costo por Línea de la Transacción</th>';
            html += '<th>Utilidad Bruta por Item</th>';
            html += '<th>Utilidad Est. Item Pesos</th>';
            html += '<th>Utilidad Est. Item USD</th>';
            html += '<th>Tipo de Cambio</th>';
            html += '<th>Monto USD</th>';
            html += '<th>Porcentaje</th>';
            html += '<th>Términos</th>';
            html += '<th>Fecha Ajustada de Vencimiento</th>';
            html += '<th>Artículo de Impuesto sobre las Ventas</th>';
            html += '<th>Proveedor Preferido</th>';
            html += '<th>Objeto de Impuesto</th>';
            // Campos calculados
            html += '<th>Ingreso</th>';
            html += '<th>Costo Total</th>';
            html += '<th>Utilidad Bruta</th>';
            html += '<th>Utilidad USD</th>';
            html += '<th>Margen</th>';
            html += '<th>Utilidad Después Comisiones</th>';
            html += '<th>Margen Final</th>';
            // Columnas de comisión por gerente: intercaladas % y compensación
            html += '<th>ROSARIO %</th><th>ROSARIO compensación</th>';
            html += '<th>ALHELY %</th><th>ALHELY compensación</th>';
            html += '<th>GABRIELA %</th><th>GABRIELA compensación</th>';
            html += '<th>MINERIA %</th><th>MINERIA compensación</th>';
            html += '<th>AGRO %</th><th>AGRO compensación</th>';
            html += '<th>PRIETO %</th><th>PRIETO compensación</th>';
            html += '<th>OTROS %</th><th>OTROS compensación</th>';
            html += '<th>Comisión Total %</th><th>Comisión Total compensación</th>';
            html += '<th>UTILIDAD DESPUÉS DE COMISIONES DE GERENCIA</th>';
            html += '<th>% Margen</th>';
            html += '<th>% Comisión</th>';
            html += '<th>Comisión</th>';
            html += '</tr></thead><tbody>';
            
            results.forEach(function(row) {
                html += '<tr>';
                // Campos obligatorios (en el orden especificado)
                html += '<td>' + (row.internalId || '') + '</td>';
                html += '<td>' + (row.customForm || '') + '</td>';
                html += '<td>' + (row.tranDate || '') + '</td>';
                html += '<td>' + (row.period || '') + '</td>';
                html += '<td>' + (row.type || '') + '</td>';
                html += '<td>' + (row.itemClassification || '') + '</td>';
                html += '<td>' + (row.location || '') + '</td>';
                html += '<td>' + (row.tranId || '') + '</td>';
                html += '<td>' + (row.entity || '') + '</td>';
                html += '<td>' + (row.customerMainGIROINDUSTRIAL || '') + '</td>';
                html += '<td>' + (row.item || '') + '</td>';
                html += '<td>' + (row.salesRep || '') + '</td>';
                // Campos de datos base
                html += '<td>' + formatNumber(row.quantity || 0) + '</td>';
                html += '<td>$' + formatNumber(row.amount || 0) + '</td>';
                html += '<td>' + (row.metodoDeEntrega || '') + '</td>';
                html += '<td>' + formatNumber(row.createdFromCostoTransporte || 0) + '</td>';
                html += '<td>' + formatNumber(row.costoTransporte || 0) + '</td>';
                html += '<td>' + formatNumber(row.costoTransportePorProducto || 0) + '</td>';
                html += '<td>$' + formatNumber(row.costoPorLineaV2 || 0) + '</td>';
                html += '<td>$' + formatNumber(row.costoPorLinea || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadBrutaPorItem || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadEstItemPesos || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadEstItemUSD || 0) + '</td>';
                html += '<td>' + formatNumber(row.tipoDeCambio || 0) + '</td>';
                html += '<td>$' + formatNumber(row.montoUSD || 0) + '</td>';
                // El porcentaje viene como decimal (0.2088 = 20.88%), no como porcentaje ya multiplicado
                var porcentajeValue = row.porcentaje || 0;
                // Si el valor es mayor que 1, probablemente ya está en formato porcentaje, sino está en decimal
                if (porcentajeValue > 1) {
                    html += '<td>' + formatPercent(porcentajeValue / 100) + '</td>';
                } else {
                    html += '<td>' + formatPercent(porcentajeValue) + '</td>';
                }
                html += '<td>' + (row.customerMainTerms || '') + '</td>';
                html += '<td>' + (row.fechaAjustadaDeVencimiento || '') + '</td>';
                html += '<td>' + (row.taxItem || '') + '</td>';
                html += '<td>' + (row.itemPreferredVendor || '') + '</td>';
                html += '<td>' + (row.taxObject || '') + '</td>';
                // Campos calculados
                html += '<td>$' + formatNumber(row.montoBase || 0) + '</td>';
                html += '<td>$' + formatNumber(row.costoTotal || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadBruta || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadUSD || 0) + '</td>';
                html += '<td>' + formatPercent(row.margen || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadDespuesComisiones || 0) + '</td>';
                html += '<td>' + formatPercent(row.margenFinal || 0) + '</td>';
                // Comisión por gerente: intercalados % y compensación
                html += '<td>' + formatPercent(row.porcentajeComisionRosario || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionRosario || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionAlhely || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionAlhely || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionGabriela || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionGabriela || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionMineria || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionMineria || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionAgro || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionAgro || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionPrieto || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionPrieto || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionOtros || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionOtros || 0) + '</td>';
                html += '<td>' + formatPercent(row.porcentajeComisionTotal || 0) + '</td>';
                html += '<td>$' + formatNumber(row.comisionTotalGerentes || 0) + '</td>';
                html += '<td>$' + formatNumber(row.utilidadDespuesComisionesGerencia || 0) + '</td>';
                html += '<td>' + formatPercent(row.margenDespuesComisionesGerencia || 0) + '</td>';
                html += '<td>' + formatPercentComision(row.porcentajeComision) + '</td>';
                html += '<td>$' + formatNumber(row.comisionTotal || 0) + '</td>';
                html += '</tr>';
            });
            
            html += '</tbody></table>';
            html += '</div>';
            html += '</body></html>';
            
            return html;
        }
        
        /** ID de carpeta del File Cabinet para archivos temporales (JSON), exportación y precarga ReporteRentabilidad_precache.json. */
        var REPORT_EXPORT_FOLDER_ID = 1044573;
        function getReportExportFolderId() {
            return REPORT_EXPORT_FOLDER_ID;
        }
        
        /**
         * Formatea un número con separadores de miles
         */
        function formatNumber(num) {
            if (num == null || isNaN(num)) return '0.00';
            return parseFloat(num).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        }
        
        /**
         * Formatea un porcentaje (valor decimal 0.05 = 5%)
         */
        function formatPercent(num) {
            if (num == null || isNaN(num)) return '0.00%';
            return (parseFloat(num) * 100).toFixed(2) + '%';
        }
        
        /**
         * Formatea % Comisión del custom record: puede venir en decimal (0.0075) o en puntos (0.75 = 0.75%). Siempre mostrar como 0.75%.
         */
        function formatPercentComision(val) {
            if (val == null || isNaN(val)) return '0.00%';
            var n = parseFloat(val);
            return (n < 0.02) ? (n * 100).toFixed(2) + '%' : n.toFixed(2) + '%';
        }
        
        /**
         * Escapa caracteres XML
         */
        function escapeXml(text) {
            if (!text) return '';
            return String(text)
                .replace(/&/g, '&amp;')
                .replace(/</g, '&lt;')
                .replace(/>/g, '&gt;')
                .replace(/"/g, '&quot;')
                .replace(/'/g, '&apos;');
        }
        
        return {
            onRequest: onRequest,
            getPrecacheMapInputData: getPrecacheMapInputData,
            runPrecacheJobForPeriod: runPrecacheJobForPeriod
        };
    });
    
    //estable antes de inventory detail