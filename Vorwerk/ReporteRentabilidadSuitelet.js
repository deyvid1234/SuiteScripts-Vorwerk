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
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/encode', 'N/log', 'N/record'],
function(serverWidget, search, file, encode, log, record) {
    
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
        
        // Campo de período
        var periodoField = form.addField({
            id: 'periodo',
            type: serverWidget.FieldType.SELECT,
            label: 'Período',
            container: 'filtergroup_sec',
            source: 'accountingperiod'
        });
        // No se puede agregar opción vacía a campos con source
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
        tipoField.addSelectOption({
            value: '',
            text: '-- Todos --'
        });
        tipoField.addSelectOption({
            value: 'CustInvc',
            text: 'Factura de Venta'
        });
        tipoField.addSelectOption({
            value: 'CustCred',
            text: 'Nota de Crédito'
        });
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
        // No se puede agregar opción vacía a campos con source
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
        // No se puede agregar opción vacía a campos con source
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
        // No se puede agregar opción vacía a campos con source
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
        // No se puede agregar opción vacía a campos con source
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
        // No se puede agregar opción vacía a campos con source
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
        // No se puede agregar opción vacía a campos con source
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
     * Ejecuta la búsqueda principal de Invoice
     * Esta búsqueda trae Invoice y su createdfrom (Sales Order)
     */
    function executeInvoiceSearch(filters) {
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
        // Nota: preferredvendor no está disponible como columna en búsqueda de transaction; el match de descuento proveedor se hace por Artículo + Cliente + vigencia
        var invoiceSearchColSalesRep = search.createColumn({ name: 'salesrep' });
        // Campos de comisiones de gerentes del Employee (Representante de Ventas)
        var invoiceSearchColComisionRosario = search.createColumn({ name: 'custentity_comision_rosario', join: 'salesrep' });
        var invoiceSearchColComisionAlhely = search.createColumn({ name: 'custentity_comision_alhely', join: 'salesrep' });
        var invoiceSearchColComisionGabriela = search.createColumn({ name: 'custentity_comision_gabriela', join: 'salesrep' });
        var invoiceSearchColComisionMineria = search.createColumn({ name: 'custentity_comision_mineria', join: 'salesrep' });
        var invoiceSearchColComisionAgro = search.createColumn({ name: 'custentity_comision_agro', join: 'salesrep' });
        var invoiceSearchColComisionPrieto = search.createColumn({ name: 'custentity_comision_prieto', join: 'salesrep' });
        var invoiceSearchColComisionOtros = search.createColumn({ name: 'custentity_comision_otros', join: 'salesrep' });
        var invoiceSearchColQuantity = search.createColumn({ name: 'quantity' });
        var invoiceSearchColAmount = search.createColumn({ name: 'amount' });
        var invoiceSearchColMetodoDeEntrega = search.createColumn({ name: 'custbodykop_metodo_entrega_ov' });
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
                invoiceSearchColTipoCambio,
                invoiceSearchColCurrency,
                invoiceSearchColTaxCode,
                invoiceSearchColTaxItem,
                invoiceSearchColCreatedFrom,
                invoiceSearchColCreatedFromCostoTransporte,
                invoiceSearchColCreatedFromTranId,
                // Campos de comisiones de gerentes del Employee
                invoiceSearchColComisionRosario,
                invoiceSearchColComisionAlhely,
                invoiceSearchColComisionGabriela,
                invoiceSearchColComisionMineria,
                invoiceSearchColComisionAgro,
                invoiceSearchColComisionPrieto,
                invoiceSearchColComisionOtros
            ]
        });
        
        var results = [];
        var invoiceSearchPagedData = invoiceSearch.runPaged({ pageSize: 1000 });
        
        for (var i = 0; i < invoiceSearchPagedData.pageRanges.length; i++) {
            var invoiceSearchPage = invoiceSearchPagedData.fetch({ index: i });
            invoiceSearchPage.data.forEach(function(result) {
                var invoiceId = result.getValue(invoiceSearchColInternalId);
                var salesOrderId = result.getValue(invoiceSearchColCreatedFrom);
                
                // Obtener Item Fulfillments relacionados con el Sales Order
                var fulfillments = getItemFulfillmentsBySalesOrder(salesOrderId);
                
                // Una línea por línea de invoice: usar solo el primer fulfillment para costo y EPA
                // (sumar todos los fulfillments triplicaba el costo; cada fulfillment devuelve el total de la transacción)
                var costoFulfillment = 0;
                var fulfillmentTranId = '';
                
                if (fulfillments.length > 0) {
                    var primerFulfillment = fulfillments[0];
                    costoFulfillment = getFulfillmentAccountingImpact(primerFulfillment.id, invoiceId) || 0;
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
                        // Porcentajes de comisión por gerente del Employee
                        porcentajeComisionRosario: parseFloat(result.getValue(invoiceSearchColComisionRosario) || 0),
                        porcentajeComisionAlhely: parseFloat(result.getValue(invoiceSearchColComisionAlhely) || 0),
                        porcentajeComisionGabriela: parseFloat(result.getValue(invoiceSearchColComisionGabriela) || 0),
                        porcentajeComisionMineria: parseFloat(result.getValue(invoiceSearchColComisionMineria) || 0),
                        porcentajeComisionAgro: parseFloat(result.getValue(invoiceSearchColComisionAgro) || 0),
                        porcentajeComisionPrieto: parseFloat(result.getValue(invoiceSearchColComisionPrieto) || 0),
                        porcentajeComisionOtros: parseFloat(result.getValue(invoiceSearchColComisionOtros) || 0),
                        cantidad: parseFloat(result.getValue(invoiceSearchColQuantity) || 0),
                        importe: parseFloat(result.getValue(invoiceSearchColAmount) || 0),
                        metodoEntrega: result.getText(invoiceSearchColMetodoDeEntrega) || result.getValue(invoiceSearchColMetodoDeEntrega),
                        tipoCambio: parseFloat(result.getValue(invoiceSearchColTipoCambio) || 0),
                        moneda: result.getText(invoiceSearchColCurrency) || result.getValue(invoiceSearchColCurrency),
                        taxCode: result.getText(invoiceSearchColTaxCode) || result.getValue(invoiceSearchColTaxCode),
                        taxItem: result.getText(invoiceSearchColTaxItem) || result.getValue(invoiceSearchColTaxItem),
                        costoTransporteCreated: parseFloat(result.getValue(invoiceSearchColCreatedFromCostoTransporte) || 0),
                        salesOrderTranId: result.getValue(invoiceSearchColCreatedFromTranId) || '',
                        fulfillmentTranId: fulfillmentTranId || '',
                        costo: costoFulfillment || 0, // Costo del primer fulfillment (cuenta 5100 Materia Prima)
                        
                        // IDs para lookup de Nota Crédito Proveedor (proveedorId no disponible en búsqueda transaction; match por Artículo + Cliente + vigencia)
                        articuloId: result.getValue(invoiceSearchColItem) || '',
                        clienteId: result.getValue(invoiceSearchColEntity) || '',
                        proveedorId: '',
                        
                        // IDs para referencias
                        invoiceId: invoiceId,
                        salesOrderId: salesOrderId,
                        fulfillmentId: fulfillments.length > 0 ? fulfillments[0].id : '',
                        
                        // Impacto contable del fulfillment
                        accountingImpact: costoFulfillment
                    };
                    
                    // Cargar cache de descuento proveedor una sola vez
                    loadDescuentoProveedorCache();
                    var factor = getFactorDescuentoProveedor(row);
                    row.factorDescuento = factor != null ? factor : 0;
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
        
        return results;
    }
    
    /**
     * Obtiene los Item Fulfillments relacionados con un Sales Order
     */
    function getItemFulfillmentsBySalesOrder(salesOrderId) {
        if (!salesOrderId) {
            return [];
        }
        
        var fulfillments = [];
        
        try {
            var fulfillmentSearch = search.create({
                type: 'itemfulfillment',
                filters: [
                    ['createdfrom', 'anyof', salesOrderId]
                ],
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
            log.error('Error obteniendo fulfillments para Sales Order ' + salesOrderId, e);
        }
        
        return fulfillments;
    }
    
    /**
     * Obtiene el impacto contable de un Item Fulfillment por línea
     * Busca en accounting posting la cuenta 5100 (Materia Prima) relacionada con el fulfillment
     */
    function getFulfillmentAccountingImpact(fulfillmentId, invoiceId) {
        if (!fulfillmentId) {
            return 0;
        }
        
        try {
            // Buscar accounting postings relacionados con el fulfillment
            // Filtrar por la cuenta 5100 (Materia Prima)
            // Buscar la cuenta por número usando el campo 'number'
            var accountSearch = search.create({
                type: 'account',
                filters: [
                    ['number', 'is', '5100']
                ],
                columns: [
                    search.createColumn({ name: 'internalid' })
                ]
            });
            
            var accountId = null;
            accountSearch.run().each(function(result) {
                accountId = result.getValue('internalid');
                return false; // Solo necesitamos el primer resultado
            });
            
            if (!accountId) {
                log.debug('No se encontró la cuenta 5100');
                return 0;
            }
            
            // Buscar accounting postings del fulfillment para la cuenta 5100
            // Buscar en las líneas de transacción del fulfillment
            var postingSearch = search.create({
                type: 'transaction',
                filters: [
                    ['internalid', 'anyof', fulfillmentId],
                    'AND',
                    ['account', 'anyof', accountId],
                    'AND',
                    ['posting', 'is', 'T'],
                    'AND',
                    ['mainline', 'is', 'F'] // Solo líneas, no la línea principal
                ],
                columns: [
                    search.createColumn({ name: 'amount' }),
                    search.createColumn({ name: 'item' }),
                    search.createColumn({ name: 'quantity' })
                ]
            });
            
            var totalCosto = 0;
            postingSearch.run().each(function(result) {
                var amount = parseFloat(result.getValue('amount') || 0);
                // El amount puede ser negativo dependiendo del tipo de transacción
                // Sumamos el valor absoluto para obtener el costo total
                totalCosto += Math.abs(amount);
                return true;
            });
            
            return totalCosto;
        } catch (e) {
            log.error('Error obteniendo impacto contable para Fulfillment ' + fulfillmentId, e);
            return 0;
        }
    }
    
    /**
     * Calcula todas las fórmulas del Excel para cada fila
     */
    function calculateExcelFormulas(row) {
        // Según el Excel:
        // INGRESO = Importe (columna O)
        row.montoBase = row.amount;
        
        // COSTO = Costo por línea (fulfillment cuenta 5100) o costo por línea de transacción
        row.costoBase = row.costo != null ? row.costo : (row.costoPorLinea || 0);
        
        // TRANSPORTE = Costo transporte por producto (columna AK)
        row.costoTransporteCalculado = row.costoTransportePorProducto != null ? row.costoTransportePorProducto : (row.costoTransporteCreated || 0);
        
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
        
        // BJ = AZ * BI (comisión total) - donde AZ = AX (utilidad USD)
        row.comisionTotal = row.utilidadUSD * row.porcentajeComision;
        
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
        
        // Campos de distribución de comisiones por gerente
        // Las comisiones se calculan multiplicando la comisión total por el porcentaje de cada gerente
        // Los porcentajes vienen del Employee (Representante de Ventas) y están en formato decimal (0.18 = 18%)
        var comisionTotal = row.comisionTotal || 0;
        row.comisionRosario = comisionTotal * (row.porcentajeComisionRosario || 0);
        row.comisionAlhely = comisionTotal * (row.porcentajeComisionAlhely || 0);
        row.comisionGabriela = comisionTotal * (row.porcentajeComisionGabriela || 0);
        row.comisionMineria = comisionTotal * (row.porcentajeComisionMineria || 0);
        row.comisionAgro = comisionTotal * (row.porcentajeComisionAgro || 0);
        row.comisionPrieto = comisionTotal * (row.porcentajeComisionPrieto || 0);
        row.comisionOtros = comisionTotal * (row.porcentajeComisionOtros || 0);
        
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
            // Buscar Custom Record de tipo "customrecord_parametros_comision" o similar
            // Ajusta el recordType según tu configuración en NetSuite
            var paramSearch = search.create({
                type: 'customrecord_parametros_comision',
                filters: [],
                columns: [
                    search.createColumn({ name: 'custrecord_margen_minimo' }),
                    search.createColumn({ name: 'custrecord_margen_maximo' }),
                    search.createColumn({ name: 'custrecord_porcentaje_comision' })
                ]
            });
            
            paramSearch.run().each(function(result) {
                comisionParamsCache.push({
                    min: parseFloat(result.getValue('custrecord_margen_minimo') || 0),
                    max: parseFloat(result.getValue('custrecord_margen_maximo') || 100),
                    porcentaje: parseFloat(result.getValue('custrecord_porcentaje_comision') || 0)
                });
                return true;
            });
            
            // Ordenar por margen mínimo descendente
            comisionParamsCache.sort(function(a, b) {
                return b.min - a.min;
            });
            
        } catch (e) {
            log.debug('No se encontró Custom Record de parámetros, usando valores por defecto', e);
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
        } catch (e) {
            log.debug('No se encontró Custom Record Descuento Proveedor o no está configurado', e);
        }
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
     * Obtiene el porcentaje de comisión según el margen
     * Busca en los parámetros cargados o usa valores por defecto
     */
    function getComisionPorMargen(margen) {
        // Convertir margen a porcentaje (0.05 = 5%)
        var margenPorcentaje = margen * 100;
        
        var params = loadComisionParams();
        
        // Buscar el rango que corresponde al margen
        for (var i = 0; i < params.length; i++) {
            if (margenPorcentaje >= params[i].min && margenPorcentaje < params[i].max) {
                var porcentaje = params[i].porcentaje;
                // Asegurar que el porcentaje esté en formato decimal (0.0050 = 0.50%)
                // Si viene como 50.0 (50%), convertir a 0.50 (0.50%)
                if (porcentaje > 1) {
                    porcentaje = porcentaje / 100;
                }
                return porcentaje;
            }
        }
        
        // Si no encuentra, retornar 0
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
        
        var results = executeInvoiceSearch(filters);
        
        var form = createReportForm(results, context.request.scriptId, context.request.deploymentId, filters);
        
        context.response.writePage(form);
    }
    
    /**
     * Crea un formulario usando serverWidget para mostrar el reporte
     */
    function createReportForm(results, scriptId, deploymentId, filters) {
        var form = serverWidget.createForm({
            title: 'Reporte de Rentabilidad'
        });
        
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
        
        // Campo de período
        var periodoField = form.addField({
            id: 'periodo',
            type: serverWidget.FieldType.SELECT,
            label: 'Período',
            container: 'filtergroup_sec',
            source: 'accountingperiod'
        });
        if (filters.periodo) {
            periodoField.defaultValue = filters.periodo;
        }
        
        // Campo de tipo
        var tipoField = form.addField({
            id: 'tipo',
            type: serverWidget.FieldType.SELECT,
            label: 'Tipo',
            container: 'filtergroup_sec'
        });
        tipoField.addSelectOption({
            value: '',
            text: '-- Todos --'
        });
        tipoField.addSelectOption({
            value: 'CustInvc',
            text: 'Factura de Venta'
        });
        tipoField.addSelectOption({
            value: 'CustCred',
            text: 'Nota de Crédito'
        });
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
        
        // Botón de regenerar reporte
        form.addSubmitButton({
            label: 'Regenerar Reporte'
        });
        
        // Grupo de resumen
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
        
        // Calcular totales
        var totalImporte = 0;
        results.forEach(function(row) {
            totalImporte += row.importe || 0;
        });
        
        form.addField({
            id: 'total_importe',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Importe Total',
            container: 'summary_group'
        }).defaultValue = '<p><strong>Importe Total:</strong> $' + formatNumber(totalImporte) + '</p>';
        
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
        
        // Columnas de comisiones por gerente
        var field36 = resultsSublist.addField({
            id: 'custpage_comision_rosario',
            type: serverWidget.FieldType.CURRENCY,
            label: 'ROSARIO'
        });
        field36.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field37 = resultsSublist.addField({
            id: 'custpage_comision_alhely',
            type: serverWidget.FieldType.CURRENCY,
            label: 'ALHELY'
        });
        field37.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field38 = resultsSublist.addField({
            id: 'custpage_comision_gabriela',
            type: serverWidget.FieldType.CURRENCY,
            label: 'GABRIELA'
        });
        field38.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field39 = resultsSublist.addField({
            id: 'custpage_comision_mineria',
            type: serverWidget.FieldType.CURRENCY,
            label: 'MINERIA'
        });
        field39.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field40 = resultsSublist.addField({
            id: 'custpage_comision_agro',
            type: serverWidget.FieldType.CURRENCY,
            label: 'AGRO'
        });
        field40.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field41 = resultsSublist.addField({
            id: 'custpage_comision_prieto',
            type: serverWidget.FieldType.CURRENCY,
            label: 'PRIETO'
        });
        field41.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        var field42 = resultsSublist.addField({
            id: 'custpage_comision_otros',
            type: serverWidget.FieldType.CURRENCY,
            label: 'OTROS'
        });
        field42.updateDisplayType({ displayType: serverWidget.FieldDisplayType.READONLY });
        
        // Llenar la sublist con los resultados (asegurar que value nunca sea undefined ni NaN)
        results.forEach(function(row, index) {
            var safeStr = function(v) { return (v != null && v !== '') ? String(v) : ''; };
            var safeNum = function(v) { var n = Number(v); return (n !== n || v == null) ? 0 : n; };
            
            resultsSublist.setSublistValue({
                id: 'custpage_customform',
                line: index,
                value: safeStr(row.customForm)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_fecha',
                line: index,
                value: safeStr(row.fecha)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_periodo',
                line: index,
                value: safeStr(row.periodo)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_type',
                line: index,
                value: safeStr(row.type)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_clase',
                line: index,
                value: safeStr(row.clase)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_ubicacion',
                line: index,
                value: safeStr(row.ubicacion)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_numero_documento',
                line: index,
                value: safeStr(row.numeroDocumento)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_sales_order_tranid',
                line: index,
                value: safeStr(row.salesOrderTranId)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_fulfillment_tranid',
                line: index,
                value: safeStr(row.fulfillmentTranId)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_cliente',
                line: index,
                value: safeStr(row.cliente)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_giro_industrial',
                line: index,
                value: safeStr(row.giroIndustrial)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_representante_venta',
                line: index,
                value: safeStr(row.representanteVenta)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_metodo_entrega',
                line: index,
                value: safeStr(row.metodoEntrega)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_articulo',
                line: index,
                value: safeStr(row.articulo)
            });
            
            var cantidadValue = safeNum(row.cantidad);
            cantidadValue = Math.round(cantidadValue);
            if (cantidadValue !== cantidadValue) { cantidadValue = 0; } // NaN -> 0
            
            resultsSublist.setSublistValue({
                id: 'custpage_cantidad',
                line: index,
                value: cantidadValue
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_costo_transporte',
                line: index,
                value: safeNum(row.costoTransporteCreated)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_tax_code',
                line: index,
                value: safeStr(row.taxCode)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_importe',
                line: index,
                value: safeNum(row.importe)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_tipo_cambio',
                line: index,
                value: safeNum(row.tipoCambio)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_moneda',
                line: index,
                value: safeStr(row.moneda)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_factor_descuento',
                line: index,
                value: safeNum(row.factorDescuento)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_nota_credito_proveedor',
                line: index,
                value: safeNum(row.notaCreditoProveedor)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_costo',
                line: index,
                value: safeNum(row.costo)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_transporte',
                line: index,
                value: safeNum(row.transporte)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_costo_total',
                line: index,
                value: safeNum(row.costoTotal)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_utilidad_bruta',
                line: index,
                value: safeNum(row.utilidadBruta)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_margen_mn',
                line: index,
                value: safeNum(row.margenMN)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_ingreso_usd',
                line: index,
                value: safeNum(row.ingresoUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_costo_usd',
                line: index,
                value: safeNum(row.costoUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_transporte_usd',
                line: index,
                value: safeNum(row.transporteUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_nota_credito_proveedor_usd',
                line: index,
                value: safeNum(row.notaCreditoProveedorUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_costo_total_usd',
                line: index,
                value: safeNum(row.costoTotalUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_utilidad_bruta_usd',
                line: index,
                value: safeNum(row.utilidadBrutaUSD)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_ingreso_casa',
                line: index,
                value: safeNum(row.ingresoCasa)
            });
            
            // Comisiones por gerente
            resultsSublist.setSublistValue({
                id: 'custpage_comision_rosario',
                line: index,
                value: safeNum(row.comisionRosario)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_alhely',
                line: index,
                value: safeNum(row.comisionAlhely)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_gabriela',
                line: index,
                value: safeNum(row.comisionGabriela)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_mineria',
                line: index,
                value: safeNum(row.comisionMineria)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_agro',
                line: index,
                value: safeNum(row.comisionAgro)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_prieto',
                line: index,
                value: safeNum(row.comisionPrieto)
            });
            
            resultsSublist.setSublistValue({
                id: 'custpage_comision_otros',
                line: index,
                value: safeNum(row.comisionOtros)
            });
        });
        
        // Botón de exportación a Excel usando HTML inline
        var exportButtonHtml = '<form method="POST" action="/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId + '" style="margin: 10px 0;">';
        exportButtonHtml += '<input type="hidden" name="action" value="export">';
        exportButtonHtml += '<input type="hidden" name="data" value=\'' + JSON.stringify(results).replace(/'/g, "&#39;") + '\'>';
        exportButtonHtml += '<button type="submit" style="background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer;">Exportar a Excel</button>';
        exportButtonHtml += '</form>';
        
        form.addField({
            id: 'export_button',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Exportar',
            container: 'summary_group'
        }).defaultValue = exportButtonHtml;
        
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
        html += '.export-btn { background-color: #4CAF50; color: white; padding: 10px 20px; border: none; cursor: pointer; margin: 10px 0; }';
        html += '.export-btn:hover { background-color: #45a049; }';
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
        html += '<button type="submit" class="export-btn" style="margin-right: 10px;">Regenerar Reporte</button>';
        html += '</div>';
        html += '</form>';
        html += '</div>';
        
        // Botón de exportación
        html += '<form method="POST" action="/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId + '" style="margin: 10px 0;">';
        html += '<input type="hidden" name="action" value="export">';
        html += '<input type="hidden" name="data" value=\'' + JSON.stringify(results).replace(/'/g, "&#39;") + '\'>';
        html += '<button type="submit" class="export-btn">Exportar a Excel</button>';
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
        html += '<th>% Comisión</th>';
        html += '<th>Comisión</th>';
        html += '<th>Utilidad Después Comisiones</th>';
        html += '<th>Margen Final</th>';
        // Columnas de comisiones por gerente
        html += '<th>ROSARIO</th>';
        html += '<th>ALHELY</th>';
        html += '<th>GABRIELA</th>';
        html += '<th>MINERIA</th>';
        html += '<th>AGRO</th>';
        html += '<th>PRIETO</th>';
        html += '<th>OTROS</th>';
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
            html += '<td>' + formatPercent(row.porcentajeComision || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionTotal || 0) + '</td>';
            html += '<td>$' + formatNumber(row.utilidadDespuesComisiones || 0) + '</td>';
            html += '<td>' + formatPercent(row.margenFinal || 0) + '</td>';
            // Comisiones por gerente
            html += '<td>$' + formatNumber(row.comisionRosario || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionAlhely || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionGabriela || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionMineria || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionAgro || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionPrieto || 0) + '</td>';
            html += '<td>$' + formatNumber(row.comisionOtros || 0) + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table>';
        html += '</div>';
        html += '</body></html>';
        
        return html;
    }
    
    /**
     * Exporta los resultados a Excel
     */
    function exportToExcel(context) {
        try {
            var params = context.request.parameters;
            var results = JSON.parse(params.data);
            
            var xmlStr = '<?xml version="1.0"?><?mso-application progid="Excel.Sheet"?>';
            xmlStr += '<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:o="urn:schemas-microsoft-com:office:office" ';
            xmlStr += 'xmlns:x="urn:schemas-microsoft-com:office:excel" ';
            xmlStr += 'xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet" ';
            xmlStr += 'xmlns:html="http://www.w3.org/TR/REC-html40">';
            
            xmlStr += '<Worksheet ss:Name="Rentabilidad">';
            xmlStr += '<Table>';
            
            // Encabezados
            xmlStr += '<Row>';
            var headers = [
                'ID Interno', 'Formulario', 'Fecha', 'Período', 'Tipo', 'Clase', 'Ubicación',
                'FV', 'OV', 'EPA', 'Cliente', 'GIRO INDUSTRIAL', 'Artículo', 'Representante de Ventas',
                'Cantidad', 'Importe', 'Método de Entrega', 'Costo Transporte',
                'Tipo de Cambio', 'Moneda', 'Tax Code', 'Objeto de Impuesto', 'COSTO', 'Factor Descuento', 'Nota Crédito Proveedor',
                'Transporte', 'Costo Total', 'Utilidad Bruta', 'Margen MN',
                'INGRESO USD', 'COSTO USD', 'TRANSPORTE USD', 'NOTA CRÉDITO PROVEEDOR USD', 'COSTO TOTAL USD', 'UTILIDAD BRUTA USD', 'Ingreso Casa',
                'Costo Transporte por Producto', 'Costo por Línea V2',
                'Costo por Línea', 'Utilidad Bruta por Item', 'Utilidad Est. Item Pesos',
                'Utilidad Est. Item USD', 'Monto USD', 'Porcentaje',
                'Términos', 'Fecha Ajustada Vencimiento', 'Proveedor Preferido',
                'Monto Base', 'Costo Base', 'Monto Base USD', 'Costo Base USD',
                'Costo Base por Cantidad', 'Costo Transporte Calculado', 'Costo Total',
                'Utilidad Bruta', 'Costo Base por Cantidad USD', 'Costo Transporte USD',
                'Costo Total USD', 'Utilidad USD', 'Margen', '% Comisión', 'Comisión Total',
                '% Comisión Tipo A', 'Comisión Tipo A', '% Comisión Tipo B', 'Comisión Tipo B',
                '% Comisión Tipo C', 'Comisión Tipo C', '% Comisión Adicional', 'Comisión Adicional',
                'Suma % Comisiones', 'Comisión Total Porcentajes', 'Utilidad Después Comisiones',
                'Margen Final',
                'ROSARIO', 'ALHELY', 'GABRIELA', 'MINERIA', 'AGRO', 'PRIETO', 'OTROS'
            ];
            
            headers.forEach(function(header) {
                xmlStr += '<Cell><Data ss:Type="String">' + escapeXml(header) + '</Data></Cell>';
            });
            xmlStr += '</Row>';
            
            // Datos
            results.forEach(function(row) {
                xmlStr += '<Row>';
                var values = [
                    row.internalId || '',
                    row.customForm || '',
                    row.tranDate || '',
                    row.period || '',
                    row.type || '',
                    row.itemClassification || '',
                    row.location || '',
                    row.numeroDocumento || '',
                    row.salesOrderTranId || '',
                    row.fulfillmentTranId || '',
                    row.cliente || '',
                    row.giroIndustrial || '',
                    row.articulo || '',
                    row.representanteVenta || '',
                    row.cantidad || 0,
                    row.importe || 0,
                    row.metodoEntrega || '',
                    row.costoTransporteCreated || 0,
                    row.tipoCambio || 0,
                    row.moneda || '',
                    row.taxCode || '',
                    row.taxItem || '',
                    row.costo || 0,
                    row.factorDescuento != null ? row.factorDescuento : 0,
                    row.notaCreditoProveedor || 0,
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
                    row.costoTransportePorProducto || 0,
                    row.costoPorLineaV2 || 0,
                    row.costoPorLinea || 0,
                    row.utilidadBrutaPorItem || 0,
                    row.utilidadEstItemPesos || 0,
                    row.utilidadEstItemUSD || 0,
                    row.montoUSD || 0,
                    // El porcentaje viene como decimal, convertir correctamente para Excel
                    (row.porcentaje || 0) > 1 ? (row.porcentaje / 100) : (row.porcentaje || 0),
                    row.customerMainTerms || '',
                    row.fechaAjustadaDeVencimiento || '',
                    row.itemPreferredVendor || '',
                    row.montoBase || 0,
                    row.costoBase || 0,
                    row.montoBaseUSD || 0,
                    row.costoBaseUSD || 0,
                    row.costoBasePorCantidad || 0,
                    row.costoTransporteCalculado || 0,
                    row.costoTotal || 0,
                    row.utilidadBruta || 0,
                    row.costoBasePorCantidadUSD || 0,
                    row.costoTransporteUSD || 0,
                    row.costoTotalUSD || 0,
                    row.utilidadUSD || 0,
                    row.margen || 0,
                    row.porcentajeComision || 0,
                    row.comisionTotal || 0,
                    row.porcentajeComisionTipoA || 0,
                    row.comisionTipoA || 0,
                    row.porcentajeComisionTipoB || 0,
                    row.comisionTipoB || 0,
                    row.porcentajeComisionTipoC || 0,
                    row.comisionTipoC || 0,
                    row.porcentajeComisionAdicional || 0,
                    row.comisionAdicional || 0,
                    row.sumaPorcentajesComision || 0,
                    row.comisionTotalPorcentajes || 0,
                    row.utilidadDespuesComisiones || 0,
                    row.margenFinal || 0,
                    row.comisionRosario || 0,
                    row.comisionAlhely || 0,
                    row.comisionGabriela || 0,
                    row.comisionMineria || 0,
                    row.comisionAgro || 0,
                    row.comisionPrieto || 0,
                    row.comisionOtros || 0
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
            
            var strXmlEncoded = encode.convert({
                string: xmlStr,
                inputEncoding: encode.Encoding.UTF_8,
                outputEncoding: encode.Encoding.BASE_64
            });
            
            var objXlsFile = file.create({
                name: 'Reporte_Rentabilidad_' + new Date().getTime() + '.xls',
                fileType: file.Type.EXCEL,
                contents: strXmlEncoded
            });
            
            var intFileId = objXlsFile.save();
            
            context.response.write(JSON.stringify({ success: true, fileId: intFileId }));
            
        } catch (e) {
            log.error('Error al exportar a Excel', e);
            context.response.write(JSON.stringify({ success: false, error: e.toString() }));
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
     * Formatea un porcentaje
     */
    function formatPercent(num) {
        if (num == null || isNaN(num)) return '0.00%';
        return (parseFloat(num) * 100).toFixed(2) + '%';
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

