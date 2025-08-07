// version estable de sales order reporte
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope Public
 * @description Suitelet para buscar Sales Orders con filtros de pagos usando HTML acordeón
 * @author Assistant
 */

define(['N/ui/serverWidget', 'N/search', 'N/format', 'N/record', 'N/log', 'N/runtime'],
    function (serverWidget, search, format, record, log, runtime) {

    /**
     * Función principal que se ejecuta cuando se hace una petición al Suitelet
     * @param {Object} context - Contexto de la petición
     */
    function onRequest(context) {
        if (context.request.method === 'GET') {
            createSearchForm(context);
        } else if (context.request.method === 'POST') {
            handleSearchRequest(context);
        }
    }

    /**
     * Crea el formulario de búsqueda
     * @param {Object} context - Contexto de la petición
     */
    function createSearchForm(context) {
        var form = serverWidget.createForm({
            title: 'Búsqueda de Sales Orders con Pagos',
            hideNavBar: false
        });

        // Campo de fecha "Desde"
        var startDateField = form.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'Desde',
            container: 'parameters'
        });
        startDateField.isMandatory = true;

        // Campo de fecha "Hasta"
        var endDateField = form.addField({
            id: 'custpage_end_date',
            type: serverWidget.FieldType.DATE,
            label: 'Hasta',
            container: 'parameters'
        });
        endDateField.isMandatory = true;

        // Campo select "Filtros"
        var filterField = form.addField({
            id: 'custpage_filter_type',
            type: serverWidget.FieldType.SELECT,
            label: 'Filtros',
            container: 'parameters'
        });
        filterField.isMandatory = true;
        filterField.addSelectOption({
            value: 'with_payments',
            text: 'Pedidos con pagos'
        });
        filterField.addSelectOption({
            value: 'without_payments',
            text: 'Pedidos sin pago'
        });
        filterField.addSelectOption({
            value: 'all_orders',
            text: 'Todos los pedidos'
        });

        // Botón de consultar
        form.addSubmitButton({
            label: 'Consultar'
        });

        // Campo HTML para mostrar resultados con acordeón
        var resultsField = form.addField({
            id: 'custpage_results_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Resultados'
        });
        resultsField.defaultValue = '<div style="padding: 20px; text-align: center; color: #6c757d;">Ingrese los criterios de búsqueda y haga clic en Consultar</div>';

        context.response.writePage(form);
    }

    /**
     * Maneja la petición POST del formulario y ejecuta la búsqueda
     * @param {Object} context - Contexto de la petición
     */
    function handleSearchRequest(context) {
        var startDate = context.request.parameters.custpage_start_date;
        var endDate = context.request.parameters.custpage_end_date;
        var filterType = context.request.parameters.custpage_filter_type;

        if (!startDate || !endDate) {
            throw new Error('Las fechas son obligatorias');
        }

        var parsedStartDate = format.parse({
            value: startDate,
            type: format.Type.DATE
        });
        var parsedEndDate = format.parse({
            value: endDate,
            type: format.Type.DATE
        });
        
        // Crear el formulario nuevamente
        var form = serverWidget.createForm({
            title: 'Reporte de pedidos',
            hideNavBar: false
        });

        // Agregar los campos del formulario
        var startDateField = form.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'Desde',
            container: 'parameters'
        });
        startDateField.isMandatory = true;
        startDateField.defaultValue = startDate;

        var endDateField = form.addField({
            id: 'custpage_end_date',
            type: serverWidget.FieldType.DATE,
            label: 'Hasta',
            container: 'parameters'
        });
        endDateField.isMandatory = true;
        endDateField.defaultValue = endDate;

        var filterField = form.addField({
            id: 'custpage_filter_type',
            type: serverWidget.FieldType.SELECT,
            label: 'Filtros',
            container: 'parameters'
        });
        filterField.isMandatory = true;
        filterField.addSelectOption({
            value: 'with_payments',
            text: 'Pedidos con pagos'
        });
        filterField.addSelectOption({
            value: 'without_payments',
            text: 'Pedidos sin pago'
        });
        filterField.addSelectOption({
            value: 'all_orders',
            text: 'Todos los pedidos'
        });
        filterField.defaultValue = filterType;

        form.addSubmitButton({
            label: 'Consultar'
        });

        // Campo HTML para mostrar resultados con acordeón
        var resultsField = form.addField({
            id: 'custpage_results_html',
            type: serverWidget.FieldType.INLINEHTML,
            label: 'Resultados'
        });

        // Ejecutar la búsqueda y generar HTML acordeón
        var searchResults = executeSalesOrderSearch(parsedStartDate, parsedEndDate, filterType);
        var accordionHTML = generateAccordionHTML(searchResults.results, searchResults.pagination, searchResults.statistics);
        resultsField.defaultValue = accordionHTML;

        context.response.writePage(form);
    }

    /**
     * Procesa una búsqueda en lotes para evitar límites
     * @param {Object} searchObj - Objeto de búsqueda
     * @param {number} batchSize - Tamaño del lote
     * @returns {Array} Array con todos los resultados
     */
    function processSearchInBatches(searchObj, batchSize) {
        var allResults = [];
        var searchResultIndex = 0;
        var batchCount = 0;

        do {
            var searchResult = searchObj.run().getRange({
                start: searchResultIndex,
                end: searchResultIndex + batchSize - 1
            });

            if (searchResult.length === 0) {
                break;
            }

            for (var i = 0; i < searchResult.length; i++) {
                allResults.push(searchResult[i]);
            }

            searchResultIndex += batchSize;
            batchCount++;

            // Log de progreso cada 5 lotes
            if (batchCount % 5 === 0) {
                log.debug('Progreso de procesamiento en lotes', {
                    batchCount: batchCount,
                    totalProcessed: allResults.length
                });
            }

        } while (searchResult.length > 0);

        log.debug('Procesamiento en lotes completado', {
            totalBatches: batchCount,
            totalResults: allResults.length
        });

        return allResults;
    }

    /**
     * Ejecuta la búsqueda de Sales Orders según los criterios especificados
     * @param {Date} startDate - Fecha de inicio
     * @param {Date} endDate - Fecha de fin
     * @param {string} filterType - Tipo de filtro
     * @returns {Object} Objeto con resultados, paginación y estadísticas
     */
    function executeSalesOrderSearch(startDate, endDate, filterType) {
        // Formatear las fechas para la búsqueda
        var formattedStartDate = format.format({
            value: startDate,
            type: format.Type.DATE
        });
        var formattedEndDate = format.format({
            value: endDate,
            type: format.Type.DATE
        });

        var maxResultsPerPage = 10000; // Para mostrar todos los resultados

        log.debug('Búsqueda iniciada', {
            startDate: startDate,
            endDate: endDate,
            formattedStartDate: formattedStartDate,
            formattedEndDate: formattedEndDate,
            filterType: filterType
        });

        // Optimización: Usar lotes pequeños pero procesar todos los registros
        var batchSize = 100; // Mantener en 100 para mayor eficiencia

        var searchObj = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ['trandate', 'within', [formattedStartDate, formattedEndDate]],
                'AND',
                ['mainline', 'is', 'T']
            ],
            columns: [
                search.createColumn({
                    name: 'tranid',
                    label: 'Número de Documento'
                }),
                search.createColumn({
                    name: 'trandate',
                    label: 'Fecha',
                    sort: search.Sort.DESC
                }),
                search.createColumn({
                    name: 'entity',
                    label: 'Cliente'
                }),
                search.createColumn({
                    name: 'total',
                    label: 'Total'
                }),
                search.createColumn({
                    name: 'formulanumeric',
                    formula: 'CASE WHEN {appliedtotransaction} IS NOT NULL THEN 1 ELSE 0 END',
                    label: 'Tiene Pagos'
                })
            ]
        });

        // Procesar TODOS los resultados en lotes pequeños
        var allSearchResults = processSearchInBatches(searchObj, batchSize);
        var totalFound = allSearchResults.length;

        log.debug('Búsqueda inicial completada', {
            totalFound: totalFound,
            filterType: filterType,
            batchSize: batchSize,
            startDate: formattedStartDate,
            endDate: formattedEndDate
        });

        // Verificar la distribución de hasPayments en los primeros registros
        var hasPaymentsCount = 0;
        var noPaymentsCount = 0;
        for (var k = 0; k < Math.min(10, totalFound); k++) {
            var testResult = allSearchResults[k];
            var testHasPayments = testResult.getValue({
                name: 'formulanumeric',
                summary: search.Summary.NONE
            });
            if (testHasPayments == 1) {
                hasPaymentsCount++;
            } else {
                noPaymentsCount++;
            }
        }
        
        log.debug('Distribución de hasPayments en primeros 10 registros', {
            hasPayments: hasPaymentsCount,
            noPayments: noPaymentsCount,
            total: Math.min(10, totalFound)
        });

        // Calcular índices de paginación
        var startIndex = 0; // Siempre empezar desde el primer registro
        var endIndex = totalFound; // Siempre procesar hasta el último registro
        
        var filteredResults = [];
        var withPayments = 0;
        var withoutPayments = 0;
        var processedCount = 0;

        // Procesar todos los registros para estadísticas y mostrar todos
        for (var i = 0; i < totalFound; i++) {
            var result = allSearchResults[i];
            
            var hasPayments = result.getValue({
                name: 'formulanumeric',
                summary: search.Summary.NONE
            });

            var salesOrderId = result.id;
            var soTotal = parseFloat(result.getValue({
                name: 'total',
                summary: search.Summary.NONE
            }));

            // Log de debug para los primeros 5 registros
            if (i < 5) {
                log.debug('Debug registro ' + i, {
                    salesOrderId: salesOrderId,
                    hasPayments: hasPayments,
                    filterType: filterType,
                    soTotal: soTotal
                });
            }

            // Cargar información de pagos solo si es necesario
            var paymentInfo;
            
            // Para "Pedidos sin pago", usar la información de la búsqueda inicial
            if (filterType === 'without_payments') {
                // Si hasPayments es 0, significa que no tiene pagos según la búsqueda inicial
                if (hasPayments == 0) {
                    paymentInfo = {
                        count: 0,
                        total: 0,
                        balance: soTotal,
                        payments: []
                    };
                } else {
                    // Si hasPayments es 1, verificar con búsqueda detallada
                    paymentInfo = getPaymentInformationOptimized(salesOrderId, soTotal);
                }
            } else if (filterType === 'with_payments') {
                // Para "Pedidos con pagos", verificar con búsqueda detallada
                paymentInfo = getPaymentInformationOptimized(salesOrderId, soTotal);
            } else {
                // Para "Todos los pedidos", verificar con búsqueda detallada
                paymentInfo = getPaymentInformationOptimized(salesOrderId, soTotal);
            }
            
            // Log de debug para los primeros 5 registros
            if (i < 5) {
                log.debug('Debug paymentInfo registro ' + i, {
                    salesOrderId: salesOrderId,
                    hasPayments: hasPayments,
                    paymentCount: paymentInfo.count,
                    paymentTotal: paymentInfo.total,
                    balance: paymentInfo.balance,
                    filterType: filterType
                });
            }

            // Contar para estadísticas
            if (paymentInfo.count > 0) {
                withPayments++;
            } else {
                withoutPayments++;
            }

            // Aplicar filtros según el tipo seleccionado
            if (filterType === 'with_payments' && paymentInfo.count === 0) {
                continue;
            }
            if (filterType === 'without_payments' && paymentInfo.count > 0) {
                continue;
            }

            // Agregar a resultados
            var trandateValue = result.getValue({
                name: 'trandate',
                summary: search.Summary.NONE
            });
            
            filteredResults.push({
                id: salesOrderId,
                number: result.getValue({
                    name: 'tranid',
                    summary: search.Summary.NONE
                }),
                date: trandateValue,
                customer: result.getText({
                    name: 'entity',
                    summary: search.Summary.NONE
                }),
                total: soTotal,
                paymentCount: paymentInfo.count,
                paymentTotal: paymentInfo.total,
                balance: paymentInfo.balance,
                payments: paymentInfo.payments
            });

            processedCount++;

            // Log de progreso cada 100 registros
            if (processedCount % 100 === 0) {
                log.debug('Progreso de procesamiento', {
                    processed: processedCount,
                    total: totalFound,
                    percentage: Math.round((processedCount / totalFound) * 100),
                    resultsReturned: filteredResults.length,
                    withPayments: withPayments,
                    withoutPayments: withoutPayments
                });
            }
        }

        // Log final de estadísticas
        log.debug('Procesamiento completado', {
            totalFound: totalFound,
            processed: processedCount,
            filteredResults: filteredResults.length,
            withPayments: withPayments,
            withoutPayments: withoutPayments,
            filterType: filterType
        });

        // Agregar información de paginación al resultado
        return {
            results: filteredResults,
            pagination: {
                totalRecords: totalFound,
                currentPage: 1,
                totalPages: 1,
                recordsPerPage: totalFound,
                startIndex: 0,
                endIndex: totalFound,
                startDate: formattedStartDate,
                endDate: formattedEndDate,
                note: 'Todos los resultados en una sola página',
                filterType: filterType // Agregar el filtro al objeto de paginación
            },
            statistics: {
                withPayments: withPayments,
                withoutPayments: withoutPayments,
                processed: processedCount
            }
        };
    }

    /**
     * Versión optimizada para obtener información de pagos
     * @param {number} salesOrderId - ID del Sales Order
     * @param {number} soTotal - Total del Sales Order (para evitar cargar el registro)
     * @returns {Object} Objeto con información de pagos
     */
    function getPaymentInformationOptimized(salesOrderId, soTotal) {
        try {
            // Búsqueda optimizada de pagos aplicados a este Sales Order
            // Usar búsqueda estándar de pagos aplicados en lugar de campo personalizado
            var paymentSearch = search.create({
                type: 'customerpayment',
                filters: [
                    ['custbody_mp_orden_venta_relacionada', 'is', salesOrderId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    search.createColumn({
                        name: 'amount',
                        label: 'Monto'
                    }),
                    search.createColumn({
                        name: 'tranid',
                        label: 'Número de Pago'
                    }),
                    search.createColumn({
                        name: 'trandate',
                        label: 'Fecha de Pago'
                    }),
                    search.createColumn({
                        name: 'memo',
                        label: 'Memo'
                    })
                ]
            });

            // Procesar búsqueda de pagos en lotes más pequeños
            var paymentResults = processSearchInBatches(paymentSearch, 10);
            
            var paymentCount = paymentResults.length;
            var paymentTotal = 0;
            var payments = [];

            // Procesar todos los pagos encontrados
            for (var i = 0; i < paymentResults.length; i++) {
                var result = paymentResults[i];
                var amount = parseFloat(result.getValue({
                    name: 'amount',
                    summary: search.Summary.NONE
                }));
                paymentTotal += amount;

                var paymentDate = result.getValue({
                    name: 'trandate',
                    summary: search.Summary.NONE
                });

                var paymentId = result.id;
                var paymentNumber = result.getValue({
                    name: 'tranid',
                    summary: search.Summary.NONE
                });

                payments.push({
                    id: paymentId,
                    number: paymentNumber,
                    date: paymentDate,
                    amount: amount,
                    memo: result.getValue({
                        name: 'memo',
                        summary: search.Summary.NONE
                    })
                });
            }

            // Optimización: Usar el total proporcionado en lugar de cargar el registro
            var balance = soTotal - paymentTotal;

            return {
                count: paymentCount,
                total: paymentTotal,
                balance: balance,
                payments: payments
            };
        } catch (error) {
            log.error('Error obteniendo pagos para SO: ' + salesOrderId, error);
            // Si hay error, devolver información básica
            return {
                count: 0,
                total: 0,
                balance: soTotal, // Usar el total proporcionado
                payments: []
            };
        }
    }

    /**
     * Formatea una fecha para mostrar
     * @param {string|number} dateString - String o número de fecha
     * @returns {string} Fecha formateada
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            // Si es un string con formato DD/MM/YYYY, formatearlo directamente
            if (typeof dateString === 'string' && dateString.includes('/')) {
                var parts = dateString.split('/');
                if (parts.length === 3) {
                    var day = parseInt(parts[0]);
                    var month = parseInt(parts[1]);
                    var year = parseInt(parts[2]);
                    
                    // Validar que los valores sean razonables
                    if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
                        // Formatear como DD/MM/YYYY con ceros a la izquierda
                        var dayStr = day < 10 ? '0' + day : day.toString();
                        var monthStr = month < 10 ? '0' + month : month.toString();
                        
                        var result = dayStr + '/' + monthStr + '/' + year;
                        
                        return result;
                    }
                }
            }
            
            // Fallback: usar el módulo format de NetSuite
            var formattedDate = format.format({
                value: dateString,
                type: format.Type.DATE
            });
            
            return formattedDate;
        } catch (error) {
            log.error('Error formateando fecha: ' + dateString, error);
            return dateString.toString(); // Devolver el string original si hay error
        }
    }

    /**
     * Formatea un número como moneda
     * @param {number} amount - Cantidad a formatear
     * @returns {string} Cantidad formateada
     */
    function formatCurrency(amount) {
        return parseFloat(amount).toFixed(2);
    }

    /**
     * Obtiene la información de pagos asociados a un Sales Order
     * @param {number} salesOrderId - ID del Sales Order
     * @returns {Object} Objeto con información de pagos
     */
    function getPaymentInformation(salesOrderId) {
        try {
            // Búsqueda más específica de pagos aplicados a este Sales Order
            var paymentSearch = search.create({
                type: 'customerpayment',
                filters: [
                    ['custbody_mp_orden_venta_relacionada', 'is', salesOrderId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    search.createColumn({
                        name: 'amount',
                        label: 'Monto'
                    }),
                    search.createColumn({
                        name: 'tranid',
                        label: 'Número de Pago'
                    }),
                    search.createColumn({
                        name: 'trandate',
                        label: 'Fecha de Pago'
                    }),
                    search.createColumn({
                        name: 'memo',
                        label: 'Memo'
                    })
                ]
            });

            // Procesar búsqueda de pagos en lotes
            var paymentResults = processSearchInBatches(paymentSearch, 500);
            
            var paymentCount = paymentResults.length;
            var paymentTotal = 0;
            var payments = [];

            // Procesar todos los pagos encontrados
            for (var i = 0; i < paymentResults.length; i++) {
                var result = paymentResults[i];
                var amount = parseFloat(result.getValue({
                    name: 'amount',
                    summary: search.Summary.NONE
                }));
                paymentTotal += amount;

                var paymentDate = result.getValue({
                    name: 'trandate',
                    summary: search.Summary.NONE
                });

                var paymentId = result.id;
                var paymentNumber = result.getValue({
                    name: 'tranid',
                    summary: search.Summary.NONE
                });

                payments.push({
                    id: paymentId, // Agregar el ID del pago
                    number: paymentNumber,
                    date: paymentDate,
                    amount: amount,
                    memo: result.getValue({
                        name: 'memo',
                        summary: search.Summary.NONE
                    })
                });
            }

            // Obtener el total del Sales Order para calcular el saldo
            var soRecord = record.load({
                type: record.Type.SALES_ORDER,
                id: salesOrderId
            });
            var soTotal = soRecord.getValue('total');

            return {
                count: paymentCount,
                total: paymentTotal,
                balance: soTotal - paymentTotal,
                payments: payments
            };
        } catch (error) {
            log.error('Error obteniendo pagos para SO: ' + salesOrderId, error);
            // Si hay error, devolver información básica
            return {
                count: 0,
                total: 0,
                balance: 0,
                payments: []
            };
        }
    }

    /**
     * Genera el HTML del acordeón con los resultados
     * @param {Array} results - Resultados de la búsqueda
     * @param {Object} pagination - Información de paginación
     * @param {Object} statistics - Estadísticas de la búsqueda
     * @returns {string} HTML del acordeón
     */
    function generateAccordionHTML(results, pagination, statistics) {
        if (results.length === 0) {
            return '<div style="padding: 20px; text-align: center; color: #6c757d;">' +
                'No se encontraron resultados para los criterios especificados.<br>' +
                'Esto puede deberse a que no hay Sales Orders con la fecha especificada o que no cumplen con el filtro seleccionado.<br>' +
                '<strong>Sugerencia:</strong> Intente con una fecha más reciente o use el filtro "Todos los pedidos".' +
                '</div>';
        }

        var html = '<style>' +
            '.accordion-container { margin: 20px 0; }' +
            '.accordion-item { border: 1px solid #ddd; margin-bottom: 10px; border-radius: 5px; }' +
            '.accordion-header { background-color: #f8f9fa; padding: 15px; cursor: pointer; border-bottom: 1px solid #ddd; }' +
            '.accordion-header:hover { background-color: #e9ecef; }' +
            '.accordion-header h4 { margin: 0; color: #495057; }' +
            '.accordion-content { padding: 15px; background-color: white; display: none; }' +
            '.accordion-content.show { display: block; }' +
            '.payment-details { background-color: #f8f9fa; border-left: 3px solid #007bff; padding: 10px; margin: 10px 0; }' +
            '.payment-row { display: flex; justify-content: space-between; align-items: center; padding: 5px 0; border-bottom: 1px solid #dee2e6; }' +
            '.payment-row:last-child { border-bottom: none; }' +
            '.payment-checkbox { margin-right: 10px; transform: scale(1.1); }' +
            '.expand-icon { float: right; font-weight: bold; color: #007bff; }' +
            '.sales-order-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 10px; }' +
            '.info-item { padding: 5px 0; }' +
            '.info-label { font-weight: bold; color: #495057; }' +
            '.info-value { color: #6c757d; }' +
            '.debug-info { background-color: #e3f2fd; border: 1px solid #2196f3; color: #1976d2; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; }' +
            '.transaction-link { color: #007bff; text-decoration: none; font-weight: bold; }' +
            '.transaction-link:hover { text-decoration: underline; }' +
            '.selection-controls { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin-bottom: 20px; }' +
            '.checkbox-container { display: flex; align-items: center; margin: 10px 0; }' +
            '.checkbox-container input[type="checkbox"] { margin-right: 10px; transform: scale(1.2); }' +
            '.checkbox-container label { font-weight: bold; color: #495057; cursor: pointer; }' +
            '.action-buttons { text-align: center; margin: 20px 0; }' +
            '.btn { padding: 10px 20px; margin: 0 5px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; }' +
            '.btn-primary { background-color: #007bff; color: white; }' +
            '.btn-primary:hover { background-color: #0056b3; }' +
            '.btn-success { background-color: #28a745; color: white; }' +
            '.btn-success:hover { background-color: #1e7e34; }' +
            '.btn-secondary { background-color: #6c757d; color: white; }' +
            '.btn-secondary:hover { background-color: #545b62; }' +
            '.btn-warning { background-color: #ffc107; color: #212529; }' +
            '.btn-warning:hover { background-color: #e0a800; }' +
            '.selected-count { background-color: #d4edda; border: 1px solid #c3e6cb; color: #155724; padding: 10px; border-radius: 5px; margin: 10px 0; text-align: center; }' +
            '.warning-info { background-color: #fff3cd; border: 1px solid #ffeaa7; color: #856404; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; }' +
            '.pagination-info { background-color: #f8f9fa; border: 1px solid #dee2e6; padding: 15px; border-radius: 5px; margin-bottom: 20px; text-align: center; }' +
            '.pagination-controls { display: flex; justify-content: center; align-items: center; gap: 10px; margin: 15px 0; }' +
            '.pagination-btn { padding: 8px 15px; border: 1px solid #007bff; background-color: white; color: #007bff; border-radius: 3px; cursor: pointer; text-decoration: none; }' +
            '.pagination-btn:hover { background-color: #007bff; color: white; }' +
            '.pagination-btn:disabled { border-color: #6c757d; color: #6c757d; cursor: not-allowed; }' +
            '.pagination-btn.active { background-color: #007bff; color: white; }' +
            '.lazy-load-indicator { background-color: #e3f2fd; border: 1px solid #2196f3; color: #1976d2; padding: 8px; border-radius: 3px; font-size: 12px; margin-left: 10px; }' +
            '.payment-selection-info { background-color: #e7f3ff; border: 1px solid #b3d9ff; color: #0056b3; padding: 8px; border-radius: 3px; margin: 5px 0; font-size: 12px; }' +
            '</style>';

        // Información de debug con estadísticas específicas al filtro
        var filterType = pagination ? pagination.filterType : 'all_orders';
        var filterDescription = '';
        var filteredCount = results.length;
        
        switch(filterType) {
            case 'with_payments':
                filterDescription = 'Pedidos con pagos';
                break;
            case 'without_payments':
                filterDescription = 'Pedidos sin pagos';
                break;
            case 'all_orders':
                filterDescription = 'Todos los pedidos';
                break;
            default:
                filterDescription = 'Todos los pedidos';
        }
        
        html += '<div class="debug-info">' +
            '<strong>Resumen:</strong><br>' +
            '• Filtro aplicado: ' + filterDescription + '<br>' +
            '• Sales Orders mostrados: ' + filteredCount + '<br>';
        
        // Mostrar estadísticas específicas según el filtro
        if (filterType === 'with_payments') {
            html += '• Sales Orders con pagos: ' + filteredCount + '<br>';
        } else if (filterType === 'without_payments') {
            html += '• Sales Orders sin pagos: ' + filteredCount + '<br>';
        } else {
            // Para "Todos los pedidos", mostrar ambas estadísticas
            var withPaymentsCount = results.filter(function(r) { return r.paymentCount > 0; }).length;
            var withoutPaymentsCount = results.filter(function(r) { return r.paymentCount === 0; }).length;
            html += '• Sales Orders con pagos: ' + withPaymentsCount + '<br>' +
                   '• Sales Orders sin pagos: ' + withoutPaymentsCount + '<br>';
        }
        
        html += '• Rango de fechas: Desde ' + (pagination ? pagination.startDate : 'N/A') + ' hasta ' + (pagination ? pagination.endDate : 'N/A') + '<br>' +
            '</div>';

        // Controles de selección
        html += '<div class="selection-controls">' +
            '<h4 style="margin-top: 0; color: #856404;">Selección de Transacciones</h4>' +
            '<div class="checkbox-container">' +
            '<input type="checkbox" id="select-all" onchange="toggleAllSelections()">' +
            '<label for="select-all">Seleccionar todos los Sales Orders</label>' +
            '</div>' +
            '<div class="checkbox-container">' +
            '<input type="checkbox" id="select-with-payments" onchange="togglePaymentsSelection()">' +
            '<label for="select-with-payments">Seleccionar solo Sales Orders con pagos</label>' +
            '</div>' +
            '<div class="checkbox-container">' +
            '<input type="checkbox" id="select-without-payments" onchange="toggleNoPaymentsSelection()">' +
            '<label for="select-without-payments">Seleccionar solo Sales Orders sin pagos</label>' +
            '</div>' +
            '<div class="checkbox-container">' +
            '<input type="checkbox" id="select-all-payments" onchange="toggleAllPaymentsSelection()">' +
            '<label for="select-all-payments">Seleccionar todos los pagos</label>' +
            '</div>' +
            '<div id="selected-count" class="selected-count" style="display: none;">' +
            'Sales Orders seleccionados: <span id="so-count-display">0</span> | Pagos seleccionados: <span id="payment-count-display">0</span>' +
            '</div>' +
            '<div class="action-buttons">' +
            '<button class="btn btn-secondary" onclick="clearAllSelections()">Limpiar Selección</button>' +
            '<button class="btn btn-success" onclick="exportSelectedData()">Exportar Seleccionados</button>' +
            '</div>' +
            '</div>';

        html += '<div class="accordion-container">';

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var accordionId = 'accordion-' + i;
            var checkboxId = 'checkbox-' + i;
            
            // Generar enlace al Sales Order
            var soLink = generateTransactionLink('salesorder', result.id, result.number);
            
            html += '<div class="accordion-item">';
            html += '<div class="accordion-header" onclick="toggleAccordion(\'' + accordionId + '\')">';
            html += '<div style="display: flex; align-items: center; justify-content: space-between; width: 100%;">';
            html += '<h4>Sales Order: ' + soLink + ' - Cliente: ' + result.customer;
            html += '</h4>';
            html += '<div style="display: flex; align-items: center;">';
            html += '<input type="checkbox" id="' + checkboxId + '" value="' + result.id + '" data-number="' + result.number + '" data-customer="' + result.customer + '" data-total="' + result.total + '" data-payment-count="' + result.paymentCount + '" onchange="updateSelectionCount()" style="margin-right: 15px; transform: scale(1.2);" onclick="event.stopPropagation();">';
            html += '<span class="expand-icon" id="icon-' + accordionId + '">+</span>';
            html += '</div>';
            html += '</div>';
            html += '</div>';
            
            html += '<div class="accordion-content" id="' + accordionId + '">';
            
            // Información del Sales Order
            html += '<div class="sales-order-info">';
            html += '<div class="info-item"><span class="info-label">Número:</span> <span class="info-value">' + soLink + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Fecha:</span> <span class="info-value">' + formatDate(result.date) + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Cliente:</span> <span class="info-value">' + result.customer + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Total:</span> <span class="info-value">$' + formatCurrency(result.total) + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Cantidad de Pagos:</span> <span class="info-value">' + result.paymentCount + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Total Pagado:</span> <span class="info-value">$' + formatCurrency(result.paymentTotal) + '</span></div>';
            html += '<div class="info-item"><span class="info-label">Saldo Pendiente:</span> <span class="info-value">$' + formatCurrency(result.balance) + '</span></div>';
            html += '</div>';
            
            // Detalles de pagos
            if (result.payments && result.payments.length > 0) {
                html += '<div class="payment-details">';
                html += '<h5 style="margin-bottom: 10px; color: #007bff;">Pagos Asociados:</h5>';
                
                for (var j = 0; j < result.payments.length; j++) {
                    var payment = result.payments[j];
                    var paymentCheckboxId = 'payment-checkbox-' + i + '-' + j;
                    
                    // Generar enlace al pago
                    var paymentLink = generateTransactionLink('customerpayment', payment.id, payment.number);
                    
                    html += '<div class="payment-row">';
                    html += '<div style="display: flex; align-items: center; flex: 1;">';
                    html += '<input type="checkbox" id="' + paymentCheckboxId + '" class="payment-checkbox" value="' + payment.id + '" data-payment-number="' + payment.number + '" data-payment-amount="' + payment.amount + '" data-payment-date="' + payment.date + '" data-so-id="' + result.id + '" data-so-number="' + result.number + '" data-customer="' + result.customer + '" onchange="updateSelectionCount()" onclick="event.stopPropagation();">';
                    html += '<div style="flex: 1;">';
                    html += '<strong>Pago:</strong> ' + paymentLink + '<br>';
                    html += '<small>Fecha: ' + formatDate(payment.date) + '</small>';
                    if (payment.memo) {
                        html += '<br><small>Memo: ' + payment.memo + '</small>';
                    }
                    html += '</div>';
                    html += '</div>';
                    html += '<div style="text-align: right;">';
                    html += '<strong style="color: #28a745;">$' + formatCurrency(payment.amount) + '</strong>';
                    html += '</div>';
                    html += '</div>';
                }
                
                html += '</div>';
            } else {
                html += '<div class="payment-details">';
                html += '<p style="color: #6c757d; margin: 0;">No hay pagos asociados</p>';
                html += '</div>';
            }
            
            html += '</div>'; // accordion-content
            html += '</div>'; // accordion-item
        }

        html += '</div>'; // accordion-container

        // JavaScript para el acordeón, selección y paginación
        html += '<script>' +
            'function formatDate(dateString) {' +
                'if (!dateString) return "";' +
                'try {' +
                    'if (typeof dateString === "string" && dateString.includes("/")) {' +
                        'var parts = dateString.split("/");' +
                        'if (parts.length === 3) {' +
                            'var day = parseInt(parts[0]);' +
                            'var month = parseInt(parts[1]);' +
                            'var year = parseInt(parts[2]);' +
                            'if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {' +
                                'var dayStr = day < 10 ? "0" + day : day.toString();' +
                                'var monthStr = month < 10 ? "0" + month : month.toString();' +
                                'return dayStr + "/" + monthStr + "/" + year;' +
                            '}' +
                        '}' +
                    '}' +
                    'return dateString.toString();' +
                '} catch (error) {' +
                    'return dateString.toString();' +
                '}' +
            '}' +
            'function toggleAccordion(id) {' +
                'var content = document.getElementById(id);' +
                'var icon = document.getElementById("icon-" + id);' +
                'if (content.classList.contains("show")) {' +
                    'content.classList.remove("show");' +
                    'icon.textContent = "+";' +
                '} else {' +
                    'content.classList.add("show");' +
                    'icon.textContent = "-";' +
                '}' +
            '}' +
            'function toggleAllSelections() {' +
                'var selectAll = document.getElementById("select-all");' +
                'var checkboxes = document.querySelectorAll("input[type=\'checkbox\']:not(#select-all):not(#select-with-payments):not(#select-without-payments):not(#select-all-payments):not([id^=\'payment-checkbox-\'])");' +
                'checkboxes.forEach(function(checkbox) {' +
                    'checkbox.checked = selectAll.checked;' +
                '});' +
                'updateSelectionCount();' +
            '}' +
            'function togglePaymentsSelection() {' +
                'var selectWithPayments = document.getElementById("select-with-payments");' +
                'var checkboxes = document.querySelectorAll("input[type=\'checkbox\']:not(#select-all):not(#select-with-payments):not(#select-without-payments):not(#select-all-payments):not([id^=\'payment-checkbox-\'])");' +
                'checkboxes.forEach(function(checkbox) {' +
                    'var paymentCount = parseInt(checkbox.getAttribute("data-payment-count"));' +
                    'checkbox.checked = selectWithPayments.checked && paymentCount > 0;' +
                '});' +
                'updateSelectionCount();' +
            '}' +
            'function toggleNoPaymentsSelection() {' +
                'var selectWithoutPayments = document.getElementById("select-without-payments");' +
                'var selectWithPayments = document.getElementById("select-with-payments");' +
                'var checkboxes = document.querySelectorAll("input[type=\'checkbox\']:not(#select-all):not(#select-with-payments):not(#select-without-payments):not(#select-all-payments):not([id^=\'payment-checkbox-\'])");' +
                'checkboxes.forEach(function(checkbox) {' +
                    'var paymentCount = parseInt(checkbox.getAttribute("data-payment-count"));' +
                    'checkbox.checked = selectWithoutPayments.checked && paymentCount === 0;' +
                '});' +
                'updateSelectionCount();' +
            '}' +
            'function toggleAllPaymentsSelection() {' +
                'var selectAllPayments = document.getElementById("select-all-payments");' +
                'var paymentCheckboxes = document.querySelectorAll("input[id^=\'payment-checkbox-\']");' +
                'paymentCheckboxes.forEach(function(checkbox) {' +
                    'checkbox.checked = selectAllPayments.checked;' +
                '});' +
                'updateSelectionCount();' +
            '}' +
            'function updateSelectionCount() {' +
                'var soCheckboxes = document.querySelectorAll("input[type=\'checkbox\']:not(#select-all):not(#select-with-payments):not(#select-without-payments):not(#select-all-payments):not([id^=\'payment-checkbox-\'])");' +
                'var paymentCheckboxes = document.querySelectorAll("input[id^=\'payment-checkbox-\']");' +
                'var selectedSOCount = 0;' +
                'var selectedPaymentCount = 0;' +
                'soCheckboxes.forEach(function(checkbox) {' +
                    'if (checkbox.checked) selectedSOCount++;' +
                '});' +
                'paymentCheckboxes.forEach(function(checkbox) {' +
                    'if (checkbox.checked) selectedPaymentCount++;' +
                '});' +
                'var soCountDisplay = document.getElementById("so-count-display");' +
                'var paymentCountDisplay = document.getElementById("payment-count-display");' +
                'var selectedCountDiv = document.getElementById("selected-count");' +
                'if (soCountDisplay) soCountDisplay.textContent = selectedSOCount;' +
                'if (paymentCountDisplay) paymentCountDisplay.textContent = selectedPaymentCount;' +
                'if (selectedCountDiv) {' +
                    'if (selectedSOCount > 0 || selectedPaymentCount > 0) {' +
                        'selectedCountDiv.style.display = "block";' +
                    '} else {' +
                        'selectedCountDiv.style.display = "none";' +
                    '}' +
                '}' +
            '}' +
            'function clearAllSelections() {' +
                'var checkboxes = document.querySelectorAll("input[type=\'checkbox\']");' +
                'checkboxes.forEach(function(checkbox) {' +
                    'checkbox.checked = false;' +
                '});' +
                'updateSelectionCount();' +
            '}' +
            'function exportSelectedData() {' +
                'var selectedTransactions = getSelectedTransactions();' +
                'var selectedPayments = getSelectedPayments();' +
                'if (selectedTransactions.length === 0 && selectedPayments.length === 0) {' +
                    'alert("Por favor seleccione al menos una transacción o pago para exportar.");' +
                    'return;' +
                '}' +
                'var csvContent = "data:text/csv;charset=utf-8,";' +
                'csvContent += "Tipo,ID,Número,Cliente,Total,Cantidad Pagos,Total Pagado,Saldo,Fecha,Monto,Sales Order Asociado\\n";' +
                'var selectedSOMap = {};' +
                'selectedTransactions.forEach(function(so) {' +
                    'selectedSOMap[so.number] = so;' +
                '});' +
                'var paymentsBySO = {};' +
                'var independentPayments = [];' +
                'selectedPayments.forEach(function(payment) {' +
                    'if (selectedSOMap[payment.soNumber]) {' +
                        'if (!paymentsBySO[payment.soNumber]) {' +
                            'paymentsBySO[payment.soNumber] = [];' +
                        '}' +
                        'paymentsBySO[payment.soNumber].push(payment);' +
                    '} else {' +
                        'independentPayments.push(payment);' +
                    '}' +
                '});' +
                'selectedTransactions.forEach(function(so) {' +
                    'var soPayments = paymentsBySO[so.number] || [];' +
                    'csvContent += "Sales Order," + so.id + "," + so.number + "," + so.customer + "," + so.total + "," + so.paymentCount + "," + (so.total - so.balance) + "," + so.balance + ",,,,\\n";' +
                    'soPayments.forEach(function(payment) {' +
                        'csvContent += "Pago," + payment.id + "," + payment.number + "," + payment.customer + ",,,," + formatDate(payment.date) + "," + payment.amount + "," + payment.soNumber + "\\n";' +
                    '});' +
                '});' +
                'independentPayments.forEach(function(payment) {' +
                    'csvContent += "Pago," + payment.id + "," + payment.number + "," + payment.customer + ",,,," + formatDate(payment.date) + "," + payment.amount + "," + payment.soNumber + "\\n";' +
                '});' +
                'var encodedUri = encodeURI(csvContent);' +
                'var link = document.createElement("a");' +
                'link.setAttribute("href", encodedUri);' +
                'link.setAttribute("download", "transacciones_y_pagos_seleccionados.csv");' +
                'document.body.appendChild(link);' +
                'link.click();' +
                'document.body.removeChild(link);' +
            '}' +
            'function getSelectedTransactions() {' +
                'var selectedTransactions = [];' +
                'var checkboxes = document.querySelectorAll("input[type=\'checkbox\']:not(#select-all):not(#select-with-payments):not(#select-without-payments):not(#select-all-payments):not([id^=\'payment-checkbox-\'])");' +
                'checkboxes.forEach(function(checkbox) {' +
                    'if (checkbox.checked) {' +
                        'selectedTransactions.push({' +
                            'id: checkbox.value,' +
                            'number: checkbox.getAttribute("data-number"),' +
                            'customer: checkbox.getAttribute("data-customer"),' +
                            'total: parseFloat(checkbox.getAttribute("data-total")),' +
                            'paymentCount: parseInt(checkbox.getAttribute("data-payment-count")),' +
                            'balance: parseFloat(checkbox.getAttribute("data-total")) - (parseFloat(checkbox.getAttribute("data-total")) * (parseInt(checkbox.getAttribute("data-payment-count")) > 0 ? 1 : 0))' +
                        '});' +
                    '}' +
                '});' +
                'return selectedTransactions;' +
            '}' +
            'function getSelectedPayments() {' +
                'var selectedPayments = [];' +
                'var paymentCheckboxes = document.querySelectorAll("input[id^=\'payment-checkbox-\']");' +
                'paymentCheckboxes.forEach(function(checkbox) {' +
                    'if (checkbox.checked) {' +
                        'selectedPayments.push({' +
                            'id: checkbox.value,' +
                            'number: checkbox.getAttribute("data-payment-number"),' +
                            'amount: parseFloat(checkbox.getAttribute("data-payment-amount")),' +
                            'date: checkbox.getAttribute("data-payment-date"),' +
                            'soId: checkbox.getAttribute("data-so-id"),' +
                            'soNumber: checkbox.getAttribute("data-so-number"),' +
                            'customer: checkbox.getAttribute("data-customer")' +
                        '});' +
                    '}' +
                '});' +
                'return selectedPayments;' +
            '}' +
            '</script>';

        return html;
    }

    /**
     * Genera un enlace a una transacción de NetSuite
     * @param {string} recordType - Tipo de registro (salesorder, customerpayment, etc.)
     * @param {number} recordId - ID interno del registro
     * @param {string} displayText - Texto a mostrar
     * @returns {string} HTML del enlace
     */
    function generateTransactionLink(recordType, recordId, displayText) {
        if (!recordId) {
            return displayText;
        }
        
        // Construir la URL de NetSuite según el tipo de transacción
        var url = '';
        switch (recordType) {
            case 'salesorder':
                url = '/app/accounting/transactions/salesord.nl?id=' + recordId + '&whence=';
                break;
            case 'customerpayment':
                url = '/app/accounting/transactions/custpymt.nl?id=' + recordId + '&whence=';
                break;
            default:
                url = '/app/accounting/transactions/translist.nl?id=' + recordId + '&whence=';
        }
        
        // Usar JavaScript para abrir la transacción
        var onclickScript = 'try { ' +
            'console.log(\'Abriendo transacción:\', \'' + displayText + '\', \'ID:\', \'' + recordId + '\'); ' +
            'window.open(\'' + url + '\', \'_blank\'); ' +
            '} catch(e) { ' +
            'alert(\'Error al abrir la transacción: ' + displayText + '\'); ' +
            'console.error(\'Error:\', e); ' +
            '} return false;';
        
        return '<a href="#" onclick="' + onclickScript + '" class="transaction-link" title="Ver transacción ' + displayText + ' en NetSuite">' + displayText + '</a>';
    }

    return {
        onRequest: onRequest
    };
}); 