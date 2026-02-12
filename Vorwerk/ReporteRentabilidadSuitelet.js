/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Suitelet para generar reporte de rentabilidad con cálculos de ganancias, comisiones, etc.
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
 *      * custrecord_dp_articulo (List/Record - Item) - Artículo
 *      * custrecord_dp_cliente (List/Record - Customer) - Cliente
 *      * custrecord_dp_proveedor (List/Record - Vendor) - Proveedor
 *      * custrecord_dp_factor (Decimal) - Factor Descuento (ej. 0.05 = 5% sobre el costo)
 *      * custrecord_dp_fecha_inicio (Date) - Fecha Inicio Vigencia
 *      * custrecord_dp_fecha_fin (Date) - Fecha Fin Vigencia
 *    - Lógica: Por cada línea del reporte se busca un registro donde Artículo, Cliente y Proveedor
 *      coincidan y la fecha de la factura esté entre Fecha Inicio y Fecha Fin. Si existe, se aplica
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
 *      * custentity_comision_otros - Porcentaje de comisión para OTROS
 *      * custentity_comision_total - Suma de todos los porcentajes (para validación, debe ser 100%)
 *    - Lógica: Por cada línea del reporte se obtiene el Representante de Ventas (salesrep) y se
 *      leen los porcentajes de comisión de ese Employee. Se calcula: Comisión Gerente = Comisión Total × Porcentaje del Gerente.
 *      Las comisiones se muestran en columnas separadas por cada gerente en el reporte.
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/encode', 'N/log', 'N/record', 'N/https', 'N/runtime'],
function(serverWidget, search, file, encode, log, record, https, runtime) {
    
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
        
        if (request.method === 'GET') {
            // Mostrar formulario de filtros
            showFilterForm(context);
        } else if (request.method === 'POST') {
            var params = request.parameters;
            
            if (params.action === 'export') {
                // Exportar a Excel
                exportToExcel(context);
            } else {
                // Mostrar reporte
                showReport(context);
            }
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
        
        // Campo de ID de Invoice (filtro adicional)
        var invoiceIdField = form.addField({
            id: 'invoice_id',
            type: serverWidget.FieldType.TEXT,
            label: 'ID de Invoice (Filtro Adicional)',
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
     * Orden de búsquedas globales (base = facturas por fecha y filtros usuario):
     * 1. Invoice: filtros de fechas + resto de filtros del Suitelet. Base del reporte; createdfrom = Sales Order ID (no hacemos búsqueda de SO).
     * 2. Con el arreglo de IDs de órdenes (createdfrom de las facturas), búsqueda de Item Fulfillment filtrada SOLO por createdfrom anyof [ids]. Sin más filtros.
     * 3. Con los fulfillments en cache, una pasada sobre resultados de factura: lookup fulfillments e impacto contable.
     */
    function executeInvoiceSearch(filters) {
        // --- Paso 1: Búsqueda de Facturas (base: fechas + filtros usuario) ---
        // Filtros base para Invoice
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
        
        if (filters.tipo) {
            invoiceSearchFilters.push('AND');
            invoiceSearchFilters.push(['type', 'anyof', filters.tipo]);
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
        // Createdfrom (Sales Order) - Costo Transporte y tranid
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
        
        loadComisionesGerentesCache();
        fulfillmentsBySOCache = {};
        fulfillmentImpactCache = {};
        var account5100Id = getAccount5100Id();
        
        var invoiceSearchPagedData = invoiceSearch.runPaged({ pageSize: 1000 });
        
        // --- Paso 2: Recolectar IDs de Sales Order (createdfrom de facturas); búsqueda global de Fulfillments por esos IDs ---
        var soIdsMap = {};
        for (var p = 0; p < invoiceSearchPagedData.pageRanges.length; p++) {
            var pageSo = invoiceSearchPagedData.fetch({ index: p });
            pageSo.data.forEach(function(r) {
                var soId = r.getValue(invoiceSearchColCreatedFrom);
                if (soId) soIdsMap[soId] = true;
            });
        }
        var soIdList = Object.keys(soIdsMap);
        log.audit('ReporteRentabilidad', 'Paso 1 Invoice listo; SOs únicos=' + soIdList.length);
        preloadFulfillmentsBySalesOrders(soIdList);
        log.audit('ReporteRentabilidad', 'Paso 2 Fulfillments precargados');
        
        var results = [];
        for (var i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
            var invoiceSearchPage = invoiceSearchPagedData.fetch({ index: i });
            invoiceSearchPage.data.forEach(function(result) {
                var invoiceId = result.getValue(invoiceSearchColInternalId);
                var salesOrderId = result.getValue(invoiceSearchColCreatedFrom);
                // Fulfillments ya cargados por búsqueda global; solo lectura del cache
                var fulfillments = getItemFulfillmentsBySalesOrder(salesOrderId);
                
                var costoFulfillment = 0;
                var fulfillmentTranId = '';
                var invoiceLineItemId = result.getValue(invoiceSearchColItem) || '';
                
                if (fulfillments.length > 0) {
                    var primerFulfillment = fulfillments[0];
                    // Costo por ítem: impacto contable (5100) del fulfillment solo para este ítem, no el total
                    costoFulfillment = getFulfillmentAccountingImpactByItem(primerFulfillment.id, invoiceLineItemId, account5100Id) || 0;
                    fulfillmentTranId = primerFulfillment.tranid || '';
                }
                
                // Crear una sola línea por línea de invoice
                var row = {
                        // Campos de Invoice (según especificación)
                        customForm: result.getText(invoiceSearchColCustomForm) || result.getValue(invoiceSearchColCustomForm),
                        fecha: result.getValue(invoiceSearchColTranDate),
                        periodo: result.getText(invoiceSearchColPeriod) || result.getValue(invoiceSearchColPeriod),
                        type: mapTransactionTypeToSpanish(result.getValue(invoiceSearchColType), result.getText(invoiceSearchColType)),
                        clase: result.getText(invoiceSearchColItemClassification) || result.getValue(invoiceSearchColItemClassification),
                        ubicacion: result.getText(invoiceSearchColLocation) || result.getValue(invoiceSearchColLocation),
                        numeroDocumento: result.getValue(invoiceSearchColTranId),
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
                        costo: costoFulfillment || 0, // Costo del primer fulfillment (cuenta 5100 Materia Prima)
                        
                        articuloId: result.getValue(invoiceSearchColItem) || '',
                        clienteId: result.getValue(invoiceSearchColEntity) || '',
                        proveedorId: result.getValue(invoiceSearchColVendor) || '',
                        
                        // IDs para referencias
                        invoiceId: invoiceId,
                        salesOrderId: salesOrderId,
                        fulfillmentId: fulfillments.length > 0 ? fulfillments[0].id : '',
                        
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
                        // Asignar valores TAL CUAL del registro Employee, sin conversiones
                        row.porcentajeComisionRosario = comisionesGerentes.rosario || 0;
                        row.porcentajeComisionAlhely = comisionesGerentes.alhely || 0;
                        row.porcentajeComisionGabriela = comisionesGerentes.gabriela || 0;
                        row.porcentajeComisionMineria = comisionesGerentes.mineria || 0;
                        row.porcentajeComisionAgro = comisionesGerentes.agro || 0;
                        row.porcentajeComisionPrieto = comisionesGerentes.prieto || 0;
                        row.porcentajeComisionOtros = comisionesGerentes.otros || 0;
                        row.porcentajeComisionTotal = comisionesGerentes.total || 0;
                        
                    } else {
                        // Si no existe el Employee en el cache, todos los porcentajes son 0
                        row.porcentajeComisionRosario = 0;
                        row.porcentajeComisionAlhely = 0;
                        row.porcentajeComisionGabriela = 0;
                        row.porcentajeComisionMineria = 0;
                        row.porcentajeComisionAgro = 0;
                        row.porcentajeComisionPrieto = 0;
                        row.porcentajeComisionOtros = 0;
                        row.porcentajeComisionTotal = 0;
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
                    row.ingresoCasa = (row.ingresoUSD || 0) * tipoCambioInterno;
                    
                    results.push(row);
            });
        }
        log.audit('ReporteRentabilidad', 'Paso 3 results.length=' + results.length);
        return results;
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
    
    /**
     * Precarga Item Fulfillments para una lista de Sales Order IDs (una o pocas búsquedas globales).
     * Filtro único: createdfrom anyof [ids]. Sin filtro de fecha; los IDs vienen de la búsqueda de facturas.
     */
    function preloadFulfillmentsBySalesOrders(salesOrderIds) {
        if (!salesOrderIds || salesOrderIds.length === 0) return;
        if (!fulfillmentsBySOCache) fulfillmentsBySOCache = {};
        var BATCH = 500;
        for (var b = 0; b < salesOrderIds.length; b += BATCH) {
            var batch = salesOrderIds.slice(b, b + BATCH);
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
                fulfillmentSearch.run().each(function(res) {
                    var soId = res.getValue('createdfrom');
                    if (!soId) return true;
                    if (!fulfillmentsBySOCache[soId]) fulfillmentsBySOCache[soId] = [];
                    fulfillmentsBySOCache[soId].push({
                        id: res.getValue('internalid'),
                        tranid: res.getValue('tranid')
                    });
                    return true;
                });
            } catch (e) {
                // Si falla un lote, ese lote queda sin fulfillments en cache
            }
        }
    }
    
    /** Cache del internalid de la cuenta 5100 (una búsqueda por request) */
    var account5100IdCache = null;
    /** Cache de costo por fulfillment (evita repetir búsqueda de posting para el mismo fulfillment) */
    var fulfillmentImpactCache = null;
    
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
            var totalCosto = 0;
            postingSearch.run().each(function(result) {
                var amount = parseFloat(result.getValue('amount') || 0);
                var absAmount = Math.abs(amount);
                var itemId = result.getValue('item');
                if (itemId != null && itemId !== '') {
                    var key = String(itemId);
                    byItem[key] = (byItem[key] || 0) + absAmount;
                }
                totalCosto += absAmount;
                return true;
            });
            fulfillmentImpactCache[fulfillmentId] = { byItem: byItem, total: totalCosto };
            return fulfillmentImpactCache[fulfillmentId];
        } catch (e) {
            fulfillmentImpactCache[fulfillmentId] = { byItem: {}, total: 0 };
            return fulfillmentImpactCache[fulfillmentId];
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
        row.comisionOtros = (pct(row.porcentajeComisionOtros) / 100) * ingresoCasa;
        row.comisionTotalGerentes = (pct(row.porcentajeComisionTotal) / 100) * ingresoCasa;
        
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
    
    /**
     * Cache global de comisiones de gerentes por Employee (Representante de Ventas).
     * Estructura: { employeeId: { rosario: 0.18, alhely: 0.25, ... } }
     * Se carga una vez al generar el reporte.
     */
    var comisionesGerentesCache = null;
    
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
            var descuentoSearch = search.create({
                type: 'customrecord_descuento_proveedor',
                filters: [],
                columns: [
                    search.createColumn({ name: 'custrecord_dp_articulo' }),
                    search.createColumn({ name: 'custrecord_dp_cliente' }),
                    search.createColumn({ name: 'custrecord_dp_proveedor' }),
                    search.createColumn({ name: 'custrecord_dp_factor' }),
                    search.createColumn({ name: 'custrecord_dp_fecha_inicio' }),
                    search.createColumn({ name: 'custrecord_dp_fecha_fin' })
                ]
            });
            descuentoSearch.run().each(function(r) {
                descuentoProveedorCache.push({
                    articulo: r.getValue('custrecord_dp_articulo'),
                    cliente: r.getValue('custrecord_dp_cliente'),
                    proveedor: r.getValue('custrecord_dp_proveedor'),
                    factor: parseFloat(r.getValue('custrecord_dp_factor') || 0),
                    fechaInicio: r.getValue('custrecord_dp_fecha_inicio'),
                    fechaFin: r.getValue('custrecord_dp_fecha_fin')
                });
                return true;
            });
        } catch (e) { /* Descuento Proveedor no configurado */ }
        return descuentoProveedorCache;
    }
    
    /**
     * Obtiene el factor de descuento (nota crédito proveedor) para una línea.
     * Busca en el cache un registro que coincida: Artículo, Cliente, Proveedor y que la fecha
     * de la factura esté dentro de la vigencia (fechaInicio <= fecha <= fechaFin).
     * @param {Object} row - Fila con articuloId, clienteId, proveedorId, fecha
     * @returns {number} Factor (ej. 0.05) o 0 si no hay coincidencia
     */
    function getFactorDescuentoProveedor(row) {
        if (!row || !descuentoProveedorCache || descuentoProveedorCache.length === 0) {
            return 0;
        }
        var articuloId = row.articuloId || '';
        var clienteId = row.clienteId || '';
        var proveedorId = row.proveedorId || '';
        var fecha = row.fecha || '';
        if (!articuloId || !clienteId || !fecha) {
            return 0;
        }
        for (var i = 0; i < descuentoProveedorCache.length; i++) {
            var reg = descuentoProveedorCache[i];
            if (reg.articulo !== articuloId || reg.cliente !== clienteId) {
                continue;
            }
            if (proveedorId && reg.proveedor !== proveedorId) {
                continue;
            }
            var inicio = reg.fechaInicio ? new Date(reg.fechaInicio).getTime() : 0;
            var fin = reg.fechaFin ? new Date(reg.fechaFin).getTime() : 9999999999999;
            var f = fecha ? new Date(fecha).getTime() : 0;
            if (f >= inicio && f <= fin) {
                return reg.factor;
            }
        }
        return 0;
    }
    
    /**
     * Carga todos los Employees que tengan al menos uno de los campos de comisión configurado.
     * Crea un objeto cache donde la clave es el ID del Employee y el valor es un objeto con los porcentajes.
     * Se carga una vez al generar el reporte.
     */
    function loadComisionesGerentesCache() {
        if (comisionesGerentesCache) {
            return comisionesGerentesCache;
        }
        comisionesGerentesCache = {};
        try {
            // Buscar Employees que tengan al menos uno de los campos de comisión configurado
            // Usamos OR para encontrar cualquier Employee con al menos un campo
            // Nota: 'isnotempty' funciona con campos que tienen valor (no null, no vacío, no 0)
            var employeeSearch = search.create({
                type: 'employee',
                filters: [
                    ['custentity_comision_rosario', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_alhely', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_gabriela', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_mineria', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_agro', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_prieto', 'isnotempty', ''],
                    'OR',
                    ['custentity_comision_otros', 'isnotempty', '']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' }),
                    search.createColumn({ name: 'custentity_comision_rosario' }),
                    search.createColumn({ name: 'custentity_comision_alhely' }),
                    search.createColumn({ name: 'custentity_comision_gabriela' }),
                    search.createColumn({ name: 'custentity_comision_mineria' }),
                    search.createColumn({ name: 'custentity_comision_agro' }),
                    search.createColumn({ name: 'custentity_comision_prieto' }),
                    search.createColumn({ name: 'custentity_comision_otros' }),
                    search.createColumn({ name: 'custentity_comision_total' })
                ]
            });
            
            employeeSearch.run().each(function(result) {
                // Convertir el ID a string para asegurar consistencia en las claves del cache
                var employeeId = String(result.getValue('internalid') || '');
                
                // Obtener valores TAL CUAL del registro Employee, sin conversiones
                // Para campos Percent en NetSuite:
                // - getValue() retorna el valor como decimal (0.0018 para 0.18%, 0.007 para 0.7%)
                // - getText() retorna el valor como string con formato ("0.18%", "0.7%")
                // IMPORTANTE: Los campos Percent en serverWidget esperan valores entre 0 y 1 (decimal)
                // donde 0.0018 representa 0.18% y 0.007 representa 0.7%
                // Por lo tanto, usamos getValue() directamente sin conversiones
                function getPercentValue(columnName) {
                    var value = result.getValue(columnName);
                    if (value === null || value === undefined || value === '') {
                        return 0;
                    }
                    // Retornar el valor tal cual de getValue()
                    // Para campos Percent: 0.18% se almacena como 0.0018, 0.7% se almacena como 0.007
                    var num = parseFloat(value);
                    return isNaN(num) ? 0 : num;
                }
                
                var rosario = getPercentValue('custentity_comision_rosario');
                var alhely = getPercentValue('custentity_comision_alhely');
                var gabriela = getPercentValue('custentity_comision_gabriela');
                var mineria = getPercentValue('custentity_comision_mineria');
                var agro = getPercentValue('custentity_comision_agro');
                var prieto = getPercentValue('custentity_comision_prieto');
                var otros = getPercentValue('custentity_comision_otros');
                var total = getPercentValue('custentity_comision_total');
                
                comisionesGerentesCache[employeeId] = {
                    rosario: rosario,
                    alhely: alhely,
                    gabriela: gabriela,
                    mineria: mineria,
                    agro: agro,
                    prieto: prieto,
                    otros: otros,
                    total: total
                };
                return true;
            });
        } catch (e) {
            /* comisiones gerentes: usar valores por defecto en silencio */
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
        var cache = loadComisionesGerentesCache();
        return cache[employeeId] || null;
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
    
    /**
     * Muestra el reporte usando serverWidget
     */
    function showReport(context) {
        var params = context.request.parameters;
        var filters = {
            invoiceId: params.invoice_id || '',
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
        _t('inicio');
        loadComisionParams();
        _t('comisionParams');
        loadComisionesGerentesCache();
        _t('comisionGerentes');
        loadDescuentoProveedorCache();
        _t('descuentoProveedor');
        var results = executeInvoiceSearch(filters);
        log.audit('ReporteRentabilidad', 'showReport executeInvoiceSearch listo results.length=' + (results ? results.length : 0));
        _t('invoiceSearch');
        results.forEach(function(row) {
            calculateExcelFormulas(row);
        });
        _t('formulas');
        var currentScript = runtime.getCurrentScript();
        var scriptId = currentScript.id;
        var deploymentId = currentScript.deploymentId;
        log.audit('ReporteRentabilidad', 'showReport vista inicio results.length=' + results.length);
        _t('createForm');
        _logTimings('showReport', results.length);
        var vista = (context.request.parameters && context.request.parameters.vista) ? context.request.parameters.vista : 'html';
        if (vista === 'form') {
            var form = createReportForm(results, scriptId, deploymentId, filters);
            log.audit('ReporteRentabilidad', 'showReport createReportForm fin');
            context.response.writePage(form);
        } else {
            var htmlPaginated = buildReportHTMLPaginated(results, scriptId, deploymentId, filters);
            log.audit('ReporteRentabilidad', 'showReport buildReportHTMLPaginated fin');
            context.response.write(htmlPaginated);
        }
    }
    
    /**
     * Vista HTML del reporte con paginación en el cliente (fluida, sin recargar al cambiar de página).
     * Los datos se envían una vez; JavaScript pinta solo la página actual (p. ej. 100 filas).
     */
    function buildReportHTMLPaginated(results, scriptId, deploymentId, filters) {
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
            { k: 'numeroDocumento', l: 'FV', g: 'base', num: false }, { k: 'salesOrderTranId', l: 'OV', g: 'base', num: false }, { k: 'fulfillmentTranId', l: 'EPA', g: 'base', num: false }, { k: 'cliente', l: 'Cliente', g: 'base', num: false }, { k: 'giroIndustrial', l: 'GIRO INDUSTRIAL', g: 'base', num: false }, { k: 'representanteVenta', l: 'Representante de Ventas', g: 'base', num: false },
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
        html += '<form method="POST" action="' + suiteletUrl + '" style="display:inline;">';
        html += '<input type="hidden" name="action" value="export">';
        html += '<input type="hidden" name="fecha_desde" value="' + esc(filters.fechaDesde) + '"><input type="hidden" name="fecha_hasta" value="' + esc(filters.fechaHasta) + '">';
        html += '<input type="hidden" name="invoice_id" value="' + esc(filters.invoiceId) + '"><input type="hidden" name="tipo_cambio_interno" value="' + esc(filters.tipoCambioInterno) + '">';
        html += '<input type="hidden" name="periodo" value="' + esc(filters.periodo) + '"><input type="hidden" name="tipo" value="' + esc(filters.tipo) + '">';
        html += '<input type="hidden" name="clase" value="' + esc(filters.clase) + '"><input type="hidden" name="ubicacion" value="' + esc(filters.ubicacion) + '">';
        html += '<input type="hidden" name="cliente" value="' + esc(filters.cliente) + '"><input type="hidden" name="giro_industrial" value="' + esc(filters.giroIndustrial) + '">';
        html += '<input type="hidden" name="representante_ventas" value="' + esc(filters.representanteVentas) + '"><input type="hidden" name="articulo" value="' + esc(filters.articulo) + '">';
        html += '<button type="submit">Exportar a Excel</button></form>';
        html += '<form method="POST" action="' + suiteletUrl + '" style="display:inline;"><input type="hidden" name="action" value="show"><input type="hidden" name="vista" value="form">';
        html += '<input type="hidden" name="fecha_desde" value="' + esc(filters.fechaDesde) + '"><input type="hidden" name="fecha_hasta" value="' + esc(filters.fechaHasta) + '">';
        html += '<input type="hidden" name="invoice_id" value="' + esc(filters.invoiceId) + '"><input type="hidden" name="tipo_cambio_interno" value="' + esc(filters.tipoCambioInterno) + '">';
        html += '<input type="hidden" name="periodo" value="' + esc(filters.periodo) + '"><input type="hidden" name="tipo" value="' + esc(filters.tipo) + '">';
        html += '<input type="hidden" name="clase" value="' + esc(filters.clase) + '"><input type="hidden" name="ubicacion" value="' + esc(filters.ubicacion) + '">';
        html += '<input type="hidden" name="cliente" value="' + esc(filters.cliente) + '"><input type="hidden" name="giro_industrial" value="' + esc(filters.giroIndustrial) + '">';
        html += '<input type="hidden" name="representante_ventas" value="' + esc(filters.representanteVentas) + '"><input type="hidden" name="articulo" value="' + esc(filters.articulo) + '">';
        html += '<button type="submit">Ver en formulario NetSuite</button></form>';
        html += '</div>';
        html += '<div class="summary"><strong>Total registros:</strong> ' + totalRows + ' &nbsp;|&nbsp; <strong>Importe:</strong> ' + formatNumber(totalImporte) + ' &nbsp;|&nbsp; <strong>Costo total:</strong> ' + formatNumber(totalCosto) + ' &nbsp;|&nbsp; <strong>Utilidad bruta:</strong> ' + formatNumber(totalUtilidad) + ' &nbsp;|&nbsp; <strong>Comisión:</strong> ' + formatNumber(totalComision) + '</div>';
        html += '<div class="pagination">Página <span id="pageInfo">1</span> de <span id="totalPages">1</span> &nbsp; <button type="button" id="prevBtn">Anterior</button> <button type="button" id="nextBtn">Siguiente</button> &nbsp; <select id="pageSizeSelect"><option value="50">50 por página</option><option value="100" selected>100 por página</option><option value="200">200 por página</option><option value="500">500 por página</option></select></div>';
        html += '<div style="overflow-x:auto;"><table><thead><tr>';
        for (var c = 0; c < cols.length; c++) html += '<th class="col-g-' + (cols[c].g || 'base') + '">' + esc(cols[c].l) + '</th>';
        html += '</tr></thead><tbody id="report-tbody"></tbody></table></div>';
        html += '<script>var reportData=' + jsonStr + ';var cols=' + JSON.stringify(cols) + ';var pageSize=100;var currentPage=1;';
        html += 'function renderPage(){var tbody=document.getElementById("report-tbody");var totalPages=Math.max(1,Math.ceil(reportData.length/pageSize));document.getElementById("totalPages").textContent=totalPages;currentPage=Math.min(Math.max(1,currentPage),totalPages);document.getElementById("pageInfo").textContent=currentPage;var start=(currentPage-1)*pageSize;var end=Math.min(start+pageSize,reportData.length);tbody.innerHTML="";for(var i=start;i<end;i++){var row=reportData[i];var tr=document.createElement("tr");for(var j=0;j<cols.length;j++){var td=document.createElement("td");var col=cols[j];var grp=col.g||"base";td.className="col-g-"+grp;var val=row[col.k];var valStr=(val===undefined||val===null)?"":String(val);td.textContent=valStr;if(col.num){var n=parseFloat(val);if(valStr===""||(!isNaN(n)&&n===0))td.className+=" cell-zero";}tr.appendChild(td);}tbody.appendChild(tr);}document.getElementById("prevBtn").disabled=currentPage<=1;document.getElementById("nextBtn").disabled=currentPage>=totalPages;}';
        html += 'document.getElementById("prevBtn").onclick=function(){currentPage--;renderPage();};document.getElementById("nextBtn").onclick=function(){currentPage++;renderPage();};';
        html += 'document.getElementById("pageSizeSelect").onchange=function(){pageSize=parseInt(this.value,10);currentPage=1;renderPage();};renderPage();<\/script>';
        html += '</body></html>';
        return html;
    }
    
    /**
     * Crea un formulario usando serverWidget para mostrar el reporte (vista=form)
     */
    var MAX_ROWS_DISPLAY = 1000;
    
    function createReportForm(results, scriptId, deploymentId, filters) {
        log.audit('ReporteRentabilidad', 'createReportForm inicio results.length=' + (results ? results.length : 0));
        var totalRows = results ? results.length : 0;
        var displayResults = totalRows > MAX_ROWS_DISPLAY ? results.slice(0, MAX_ROWS_DISPLAY) : results;
        var form = serverWidget.createForm({
            title: 'Reporte de Rentabilidad'
        });
        
        // Asegurar que al hacer clic en "Regenerar Reporte" se envíe action=show y no se confunda con export
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
        var exportFormHtml = '<form method="POST" action="' + suiteletUrl + '" style="display:inline;margin:0;">';
        exportFormHtml += '<input type="hidden" name="action" value="export">';
        exportFormHtml += '<input type="hidden" name="invoice_id" value="' + esc(filters.invoiceId) + '">';
        exportFormHtml += '<input type="hidden" name="fecha_desde" value="' + esc(filters.fechaDesde) + '">';
        exportFormHtml += '<input type="hidden" name="fecha_hasta" value="' + esc(filters.fechaHasta) + '">';
        exportFormHtml += '<input type="hidden" name="tipo_cambio_interno" value="' + esc(filters.tipoCambioInterno) + '">';
        exportFormHtml += '<input type="hidden" name="periodo" value="' + esc(filters.periodo) + '">';
        exportFormHtml += '<input type="hidden" name="tipo" value="' + esc(filters.tipo) + '">';
        exportFormHtml += '<input type="hidden" name="clase" value="' + esc(filters.clase) + '">';
        exportFormHtml += '<input type="hidden" name="ubicacion" value="' + esc(filters.ubicacion) + '">';
        exportFormHtml += '<input type="hidden" name="cliente" value="' + esc(filters.cliente) + '">';
        exportFormHtml += '<input type="hidden" name="giro_industrial" value="' + esc(filters.giroIndustrial) + '">';
        exportFormHtml += '<input type="hidden" name="representante_ventas" value="' + esc(filters.representanteVentas) + '">';
        exportFormHtml += '<input type="hidden" name="articulo" value="' + esc(filters.articulo) + '">';
        exportFormHtml += '<button type="submit" style="' + exportBtnStyle + '">Exportar a Excel</button></form>';
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
        
        // Exportar a Excel (mismo estilo que Nueva consulta)
        html += '<form method="POST" action="/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId + '" style="display:inline;margin:10px 0;">';
        html += '<input type="hidden" name="action" value="export">';
        html += '<input type="hidden" name="data" value=\'' + JSON.stringify(results).replace(/'/g, "&#39;") + '\'>';
        html += '<button type="submit" class="report-btn">Exportar a Excel</button>';
        html += '</form>';
        
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
    
    /**
     * Obtiene el ID de carpeta del File Cabinet donde guardar el Excel exportado.
     * NetSuite requiere folder en file.save(). Busca "SuiteScripts" o "Reports", sino usa -15.
     */
    function getReportExportFolderId() {
        try {
            var colId = search.createColumn({ name: 'internalid' });
            var folderSearch = search.create({
                type: 'folder',
                filters: [['name', 'is', 'SuiteScripts']],
                columns: [colId]
            });
            var results = folderSearch.run().getRange({ start: 0, end: 1 });
            if (results.length > 0) {
                return results[0].getValue(colId);
            }
        } catch (e) { }
        return -15;
    }
    
    /**
     * Formatea fecha para Excel (row.fecha puede ser objeto Date, string ISO o string ya formateado)
     */
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
    
    /**
     * Exporta los resultados a Excel. Usa los mismos filtros del POST (no envía datos en el request para evitar error 500 por tamaño).
     * Vuelve a ejecutar la búsqueda y genera el Excel. Descarga directa.
     */
    function exportToExcel(context) {
        var headersSent = false;
        try {
            var params = context.request.parameters;
            var filters = {
                invoiceId: params.invoice_id || '',
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
            _t('inicio');
            loadComisionParams();
            _t('comisionParams');
            loadComisionesGerentesCache();
            _t('comisionGerentes');
            loadDescuentoProveedorCache();
            _t('descuentoProveedor');
            var results = executeInvoiceSearch(filters);
            _t('invoiceSearch');
            results.forEach(function(row) {
                calculateExcelFormulas(row);
            });
            _t('formulas');
            var xmlStr = '<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?>';
            xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
            xmlStr += '<Worksheet ss:Name="Rentabilidad"><Table>';
            
            // Encabezados: mismo orden que el Suitelet
            var headers = [
                'Formulario', 'Fecha', 'Período', 'Tipo', 'Clase', 'Ubicación', 'FV', 'OV', 'EPA',
                'Cliente', 'GIRO INDUSTRIAL', 'Representante de Ventas', 'Método de Entrega', 'Proveedor', 'Términos', 'Fecha Ajustada Vencimiento', 'Objeto de Impuesto', 'Artículo',
                'Cantidad', 'Costo Transporte', 'Código de Impuesto', 'Ingreso', 'Tipo de Cambio', 'Moneda',
                'Factor Descuento', 'Nota Crédito Proveedor', 'COSTO', 'Transporte', 'Costo Total', 'Utilidad Bruta', 'Margen MN',
                'INGRESO USD', 'COSTO USD', 'TRANSPORTE USD', 'NOTA CRÉDITO PROVEEDOR USD', 'COSTO TOTAL USD', 'UTILIDAD BRUTA USD', 'Ingreso Casa',
                'ROSARIO %', 'ROSARIO compensación', 'ALHELY %', 'ALHELY compensación', 'GABRIELA %', 'GABRIELA compensación',
                'MINERIA %', 'MINERIA compensación', 'AGRO %', 'AGRO compensación', 'PRIETO %', 'PRIETO compensación',
                'OTROS %', 'OTROS compensación', 'Comisión Total %', 'Comisión Total compensación',
                'UTILIDAD DESPUÉS DE COMISIONES DE GERENCIA', '% Margen', '% Comisión', 'Comisión'
            ];
            xmlStr += '<Row>';
            headers.forEach(function(header) {
                xmlStr += '<Cell><Data ss:Type="String">' + escapeXml(header) + '</Data></Cell>';
            });
            xmlStr += '</Row>';
            
            // Porcentaje como texto para columnas %
            function pctToStr(v) {
                if (v == null || isNaN(v)) return '0.00%';
                var n = parseFloat(v);
                return (n < 0.02) ? (n * 100).toFixed(2) + '%' : n.toFixed(2) + '%';
            }
            
            results.forEach(function(row) {
                xmlStr += '<Row>';
                var values = [
                    row.customForm || '',
                    formatFechaForExport(row.fecha),
                    row.periodo || '',
                    row.type || '',
                    row.clase || '',
                    row.ubicacion || '',
                    row.numeroDocumento || '',
                    row.salesOrderTranId || '',
                    row.fulfillmentTranId || '',
                    row.cliente || '',
                    row.giroIndustrial || '',
                    row.representanteVenta || '',
                    row.metodoEntrega || '',
                    row.proveedor || '',
                    row.terminos || '',
                    formatFechaForExport(row.fechaAjustadaVencimiento) || '',
                    row.objetoImpuesto || '',
                    row.articulo || '',
                    row.cantidad != null ? row.cantidad : 0,
                    row.costoTransporteCreated != null ? row.costoTransporteCreated : 0,
                    row.taxCode || '',
                    row.importe != null ? row.importe : 0,
                    row.tipoCambio != null ? row.tipoCambio : 0,
                    row.moneda || '',
                    row.factorDescuento != null ? row.factorDescuento : 0,
                    row.notaCreditoProveedor != null ? row.notaCreditoProveedor : 0,
                    row.costo != null ? row.costo : 0,
                    row.transporte != null ? row.transporte : 0,
                    row.costoTotal != null ? row.costoTotal : 0,
                    row.utilidadBruta != null ? row.utilidadBruta : 0,
                    row.margenMN != null ? row.margenMN : 0,
                    row.ingresoUSD != null ? row.ingresoUSD : 0,
                    row.costoUSD != null ? row.costoUSD : 0,
                    row.transporteUSD != null ? row.transporteUSD : 0,
                    row.notaCreditoProveedorUSD != null ? row.notaCreditoProveedorUSD : 0,
                    row.costoTotalUSD != null ? row.costoTotalUSD : 0,
                    row.utilidadBrutaUSD != null ? row.utilidadBrutaUSD : 0,
                    row.ingresoCasa != null ? row.ingresoCasa : 0,
                    pctToStr(row.porcentajeComisionRosario),
                    row.comisionRosario != null ? row.comisionRosario : 0,
                    pctToStr(row.porcentajeComisionAlhely),
                    row.comisionAlhely != null ? row.comisionAlhely : 0,
                    pctToStr(row.porcentajeComisionGabriela),
                    row.comisionGabriela != null ? row.comisionGabriela : 0,
                    pctToStr(row.porcentajeComisionMineria),
                    row.comisionMineria != null ? row.comisionMineria : 0,
                    pctToStr(row.porcentajeComisionAgro),
                    row.comisionAgro != null ? row.comisionAgro : 0,
                    pctToStr(row.porcentajeComisionPrieto),
                    row.comisionPrieto != null ? row.comisionPrieto : 0,
                    pctToStr(row.porcentajeComisionOtros),
                    row.comisionOtros != null ? row.comisionOtros : 0,
                    pctToStr(row.porcentajeComisionTotal),
                    row.comisionTotalGerentes != null ? row.comisionTotalGerentes : 0,
                    row.utilidadDespuesComisionesGerencia != null ? row.utilidadDespuesComisionesGerencia : 0,
                    (row.margenDespuesComisionesGerencia != null && !isNaN(row.margenDespuesComisionesGerencia))
                        ? (parseFloat(row.margenDespuesComisionesGerencia) * 100).toFixed(2) + '%'
                        : '0.00%',
                    formatPercentComision(row.porcentajeComision),
                    row.comisionTotal != null ? row.comisionTotal : 0
                ];
                values.forEach(function(value) {
                    if (typeof value === 'number') {
                        xmlStr += '<Cell><Data ss:Type="Number">' + value + '</Data></Cell>';
                    } else {
                        xmlStr += '<Cell><Data ss:Type="String">' + escapeXml(String(value)) + '</Data></Cell>';
                    }
                });
                xmlStr += '</Row>';
            });
            
            xmlStr += '</Table></Worksheet></Workbook>';
            
            // Guardar en File Cabinet y redirigir a descarga (evita límites de respuesta y "Error inesperado")
            var strXmlEncoded = encode.convert({
                string: xmlStr,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            var filename = 'Reporte_Rentabilidad_' + (new Date().getTime()) + '.xls';
            var objXlsFile = file.create({
                name: filename,
                fileType: file.Type.EXCEL,
                contents: strXmlEncoded
            });
            _t('excelBuild');
            objXlsFile.folder = getReportExportFolderId();
            var fileId = objXlsFile.save();
            _t('fileSave');
            _logTimings('exportToExcel', results.length);
            headersSent = true;
            context.response.sendRedirect({
                type: https.RedirectType.MEDIA_ITEM,
                identifier: fileId
            });
            
        } catch (e) {
            log.error('Export Excel', e.message || e.name || String(e));
            if (!headersSent) {
                sendExportErrorPage(context, (e.message || e.toString()) + '. Revise el log de ejecución del script para más detalles.');
            }
        }
    }
    
    /**
     * Escribe una página de error HTML cuando falla la exportación (para que el usuario vea el mensaje y no "Error inesperado").
     */
    function sendExportErrorPage(context, message) {
        try {
            var safeMsg = String(message || 'Error inesperado.').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
            context.response.setHeader({ name: 'Content-Type', value: 'text/html; charset=UTF-8' });
            context.response.write('<html><head><meta charset="UTF-8"><title>Error exportación</title></head><body style="font-family:sans-serif;padding:20px;">');
            context.response.write('<h2>Error al exportar a Excel</h2><p>' + safeMsg + '</p>');
            context.response.write('<p><a href="javascript:history.back()">Volver al reporte</a></p></body></html>');
        } catch (err) {
            log.error('ReporteRentabilidad sendExportErrorPage', err.message || err);
        }
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
        onRequest: onRequest
    };
});

