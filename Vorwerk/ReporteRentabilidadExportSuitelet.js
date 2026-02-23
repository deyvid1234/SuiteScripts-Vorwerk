/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Solo recibe datos (JSON o fileId) y genera el CSV para descarga. No hace búsquedas ni cálculos.
 */
define(['N/file', 'N/search', 'N/log', 'N/https'],
function(file, search, log, https) {

    var CSV_HEADERS = [
        'Formulario', 'Fecha', 'Período', 'Tipo', 'Clase', 'Ubicación', 'FV', 'Nota de Crédito', 'Return Auth', 'Item Receipt', 'OV', 'EPA',
        'Cliente', 'GIRO INDUSTRIAL', 'Representante de Ventas', 'Método de Entrega', 'Proveedor', 'Términos', 'Fecha Ajustada Vencimiento', 'Objeto de Impuesto', 'Artículo',
        'Cantidad', 'Costo Transporte', 'Código de Impuesto', 'Ingreso', 'Tipo de Cambio', 'Moneda',
        'Factor Descuento', 'Nota Crédito Proveedor', 'COSTO', 'Transporte', 'Costo Total', 'Utilidad Bruta', 'Margen MN',
        'INGRESO USD', 'COSTO USD', 'TRANSPORTE USD', 'NOTA CRÉDITO PROVEEDOR USD', 'COSTO TOTAL USD', 'UTILIDAD BRUTA USD', 'Ingreso Casa',
        'ROSARIO %', 'ROSARIO compensación', 'ALHELY %', 'ALHELY compensación', 'GABRIELA %', 'GABRIELA compensación',
        'MINERIA %', 'MINERIA compensación', 'AGRO %', 'AGRO compensación', 'PRIETO %', 'PRIETO compensación',
        'OTROS %', 'OTROS compensación', 'Comisión Total %', 'Comisión Total compensación',
        'UTILIDAD DESPUÉS DE COMISIONES DE GERENCIA', '% Margen', '% Comisión', 'Comisión'
    ];

    function formatFechaForExport(val) {
        if (val == null || val === '') return '';
        var d;
        if (typeof val === 'string') {
            if (/^\d{4}-\d{2}-\d{2}/.test(val)) {
                d = new Date(val);
                if (isNaN(d.getTime())) return val;
            } else {
                return val;
            }
        } else if (val instanceof Date) {
            d = val;
        } else {
            return String(val);
        }
        var day = ('0' + d.getDate()).slice(-2);
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();
        return day + '/' + month + '/' + year;
    }

    function formatPercentComision(val) {
        if (val == null || isNaN(val)) return '0.00%';
        var n = parseFloat(val);
        return (n < 0.02) ? (n * 100).toFixed(2) + '%' : n.toFixed(2) + '%';
    }

    function escapeCsv(val) {
        var s = (val === undefined || val === null) ? '' : String(val);
        if (s.indexOf('"') >= 0 || s.indexOf(',') >= 0 || s.indexOf('\n') >= 0 || s.indexOf('\r') >= 0) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    function pctToStr(v) {
        if (v == null || isNaN(v)) return '0.00%';
        var n = parseFloat(v);
        return (n < 0.02) ? (n * 100).toFixed(2) + '%' : n.toFixed(2) + '%';
    }

    function rowToCsvValues(row) {
        return [
            row.customForm || '', formatFechaForExport(row.fecha), row.periodo || '', row.type || '', row.clase || '', row.ubicacion || '',
            row.numeroDocumento || '', (row.notaCreditoNumero != null ? row.notaCreditoNumero : '') || '', (row.returnAuthorizationTranId != null ? row.returnAuthorizationTranId : '') || '', (row.itemReceiptTranId != null ? row.itemReceiptTranId : '') || '', row.salesOrderTranId || '', row.fulfillmentTranId || '', row.cliente || '', row.giroIndustrial || '', row.representanteVenta || '',
            row.metodoEntrega || '', row.proveedor || '', row.terminos || '', formatFechaForExport(row.fechaAjustadaVencimiento) || '', row.objetoImpuesto || '', row.articulo || '',
            row.cantidad != null ? row.cantidad : 0, row.costoTransporteCreated != null ? row.costoTransporteCreated : 0, row.taxCode || '', row.importe != null ? row.importe : 0, row.tipoCambio != null ? row.tipoCambio : 0, row.moneda || '',
            row.factorDescuento != null ? row.factorDescuento : 0, row.notaCreditoProveedor != null ? row.notaCreditoProveedor : 0, row.costo != null ? row.costo : 0, row.transporte != null ? row.transporte : 0, row.costoTotal != null ? row.costoTotal : 0, row.utilidadBruta != null ? row.utilidadBruta : 0, row.margenMN != null ? row.margenMN : 0,
            row.ingresoUSD != null ? row.ingresoUSD : 0, row.costoUSD != null ? row.costoUSD : 0, row.transporteUSD != null ? row.transporteUSD : 0, row.notaCreditoProveedorUSD != null ? row.notaCreditoProveedorUSD : 0, row.costoTotalUSD != null ? row.costoTotalUSD : 0, row.utilidadBrutaUSD != null ? row.utilidadBrutaUSD : 0, row.ingresoCasa != null ? row.ingresoCasa : 0,
            pctToStr(row.porcentajeComisionRosario), row.comisionRosario != null ? row.comisionRosario : 0, pctToStr(row.porcentajeComisionAlhely), row.comisionAlhely != null ? row.comisionAlhely : 0, pctToStr(row.porcentajeComisionGabriela), row.comisionGabriela != null ? row.comisionGabriela : 0,
            pctToStr(row.porcentajeComisionMineria), row.comisionMineria != null ? row.comisionMineria : 0, pctToStr(row.porcentajeComisionAgro), row.comisionAgro != null ? row.comisionAgro : 0, pctToStr(row.porcentajeComisionPrieto), row.comisionPrieto != null ? row.comisionPrieto : 0,
            pctToStr(row.porcentajeComisionOtros), row.comisionOtros != null ? row.comisionOtros : 0, pctToStr(row.porcentajeComisionTotal), row.comisionTotalGerentes != null ? row.comisionTotalGerentes : 0,
            row.utilidadDespuesComisionesGerencia != null ? row.utilidadDespuesComisionesGerencia : 0,
            (row.margenDespuesComisionesGerencia != null && !isNaN(row.margenDespuesComisionesGerencia)) ? (parseFloat(row.margenDespuesComisionesGerencia) * 100).toFixed(2) + '%' : '0.00%',
            formatPercentComision(row.porcentajeComision), row.comisionTotal != null ? row.comisionTotal : 0
        ].map(function(v) { return escapeCsv(v); }).join(',');
    }

    /** ID de carpeta del File Cabinet donde se guarda el CSV. */
    var EXPORT_FOLDER_ID = 1028436;
    /** URL base de este Suitelet para devolver downloadUrl al cliente (script=2504&deploy=1). */
    var EXPORT_BASE_URL = '/app/site/hosting/scriptlet.nl?script=2504&deploy=1';
    function getReportExportFolderId() {
        return EXPORT_FOLDER_ID;
    }

    function dataToCsv(rows) {
        var lines = [];
        lines.push(CSV_HEADERS.map(escapeCsv).join(','));
        for (var i = 0; i < rows.length; i++) {
            lines.push(rowToCsvValues(rows[i]));
        }
        return '\uFEFF' + lines.join('\r\n');
    }

    function sendError(context, message) {
        try {
            var safeMsg = String(message || 'Error inesperado.').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            context.response.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
            context.response.write('<html><head><meta charset="UTF-8"><title>Error exportación</title></head><body style="font-family:sans-serif;padding:20px;">');
            context.response.write('<h2>Error al exportar</h2><p>' + safeMsg + '</p>');
            context.response.write('<p><a href="javascript:history.back()">Volver</a></p></body></html>');
        } catch (err) {
            log.error('ReporteRentabilidadExport', err.message || err);
        }
    }

    function writeJsonResponse(context, obj) {
        context.response.setHeader({ name: 'Content-Type', value: 'application/json; charset=UTF-8' });
        context.response.write(JSON.stringify(obj));
    }

    function onRequest(context) {
        var request = context.request;
        var params = request.parameters;
        var fileId = params.fileId || params.file_id || '';
        var dataJson = params.data || '';
        var chunkJson = params.chunk || '';
        var lastChunk = params.lastChunk === '1' || params.lastChunk === 'true';
        var download = params.download === '1' || params.download === 'true';

        if (request.method === 'GET' && fileId && download) {
            try {
                context.response.sendRedirect({ type: https.RedirectType.MEDIA_ITEM, identifier: fileId });
            } catch (e) {
                sendError(context, 'No se pudo descargar el archivo.');
            }
            return;
        }

        if (request.method === 'POST' && chunkJson) {
            try {
                var chunkRows = JSON.parse(chunkJson);
                if (!Array.isArray(chunkRows)) chunkRows = [];
                var csvFileId = fileId || '';
                var csvFile;
                if (csvFileId) {
                    csvFile = file.load({ id: csvFileId });
                    for (var ci = 0; ci < chunkRows.length; ci++) {
                        csvFile.appendLine({ value: rowToCsvValues(chunkRows[ci]) });
                    }
                } else {
                    var headerLine = '\uFEFF' + CSV_HEADERS.map(escapeCsv).join(',');
                    var bodyLines = [];
                    for (var bi = 0; bi < chunkRows.length; bi++) {
                        bodyLines.push(rowToCsvValues(chunkRows[bi]));
                    }
                    var fullContent = headerLine + '\r\n' + bodyLines.join('\r\n');
                    csvFile = file.create({ name: 'Reporte_Rentabilidad_' + (new Date().getTime()) + '.csv', fileType: file.Type.CSV, contents: fullContent });
                    csvFile.folder = getReportExportFolderId();
                }
                csvFileId = csvFile.save();
                var resp = { fileId: String(csvFileId), done: lastChunk };
                if (lastChunk) {
                    resp.downloadUrl = EXPORT_BASE_URL + '&fileId=' + encodeURIComponent(csvFileId) + '&download=1';
                }
                writeJsonResponse(context, resp);
            } catch (e) {
                log.error('ReporteRentabilidadExport chunk', e.message || String(e));
                writeJsonResponse(context, { error: e.message || String(e) });
            }
            return;
        }

        var rows = null;

        if (fileId && !chunkJson) {
            try {
                var f = file.load({ id: fileId });
                var contents = f.getContents();
                if (!contents) {
                    sendError(context, 'El archivo de datos está vacío o no existe.');
                    return;
                }
                var parsed = JSON.parse(contents);
                if (Array.isArray(parsed) && parsed.length > 0 && (typeof parsed[0] === 'string' || typeof parsed[0] === 'number')) {
                    rows = [];
                    for (var i = 0; i < parsed.length; i++) {
                        var chunkFileId = String(parsed[i]);
                        var cf = file.load({ id: chunkFileId });
                        var chunkContents = cf.getContents();
                        if (chunkContents) {
                            var chunkRows = JSON.parse(chunkContents);
                            if (Array.isArray(chunkRows)) {
                                for (var j = 0; j < chunkRows.length; j++) rows.push(chunkRows[j]);
                            }
                        }
                    }
                } else {
                    rows = parsed;
                }
            } catch (e) {
                log.error('ReporteRentabilidadExport', e.message || String(e));
                sendError(context, 'No se pudo cargar el archivo de datos: ' + (e.message || e.toString()));
                return;
            }
        } else if (dataJson) {
            try {
                rows = JSON.parse(dataJson);
            } catch (e) {
                log.error('ReporteRentabilidadExport', e.message || String(e));
                sendError(context, 'Datos inválidos: ' + (e.message || e.toString()));
                return;
            }
        } else {
            sendError(context, 'Indique fileId o data (JSON) para generar el CSV.');
            return;
        }

        if (!Array.isArray(rows) || rows.length === 0) {
            sendError(context, 'No hay datos para exportar.');
            return;
        }

        try {
            var csvStr = dataToCsv(rows);
            var baseName = 'Reporte_Rentabilidad_' + (new Date().getTime());
            var csvFile = file.create({ name: baseName + '.csv', fileType: file.Type.CSV, contents: csvStr });
            csvFile.folder = getReportExportFolderId();
            var savedId = csvFile.save();
            log.audit('ReporteRentabilidadExport', 'CSV generado: ' + rows.length + ' filas, fileId=' + savedId);
            context.response.sendRedirect({ type: https.RedirectType.MEDIA_ITEM, identifier: savedId });
        } catch (e) {
            log.error('ReporteRentabilidadExport', e.message || String(e));
            sendError(context, (e.message || e.toString()) + '. Revise el log del script.');
        }
    }

    return { onRequest: onRequest };
});
