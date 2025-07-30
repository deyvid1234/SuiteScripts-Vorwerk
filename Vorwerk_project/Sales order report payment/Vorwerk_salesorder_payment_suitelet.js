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

        // Campo de fecha "A partir de la fecha"
        var dateField = form.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'A partir de la fecha',
            container: 'parameters'
        });
        dateField.isMandatory = true;

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
        var filterType = context.request.parameters.custpage_filter_type;

        if (!startDate) {
            throw new Error('La fecha es obligatoria');
        }

        var parsedDate = format.parse({
            value: startDate,
            type: format.Type.DATE
        });

        // Crear el formulario nuevamente
        var form = serverWidget.createForm({
            title: 'Reporte de pedidos',
            hideNavBar: false
        });

        // Agregar los campos del formulario
        var dateField = form.addField({
            id: 'custpage_start_date',
            type: serverWidget.FieldType.DATE,
            label: 'A partir de la fecha',
            container: 'parameters'
        });
        dateField.isMandatory = true;
        dateField.defaultValue = startDate;

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
        var searchResults = executeSalesOrderSearch(parsedDate, filterType);
        var accordionHTML = generateAccordionHTML(searchResults);
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

            log.debug('Procesando lote', {
                batchNumber: batchCount,
                resultsInBatch: searchResult.length,
                totalResults: allResults.length
            });

        } while (searchResult.length === batchSize);

        log.debug('Procesamiento en lotes completado', {
            totalBatches: batchCount,
            totalResults: allResults.length
        });

        return allResults;
    }

    /**
     * Función de prueba para verificar si hay pagos en el sistema
     * @param {Date} startDate - Fecha de inicio
     */
    function testPaymentSearch(startDate) {
        var formattedDate = format.format({
            value: startDate,
            type: format.Type.DATE
        });

        log.debug('Prueba de búsqueda de pagos', {
            startDate: startDate,
            formattedDate: formattedDate
        });

        // Buscar pagos directamente
        var paymentTestSearch = search.create({
            type: 'customerpayment',
            filters: [
                ['trandate', 'onorafter', formattedDate]
            ],
            columns: [
                search.createColumn({
                    name: 'tranid',
                    label: 'Número de Pago'
                }),
                search.createColumn({
                    name: 'trandate',
                    label: 'Fecha de Pago'
                }),
                search.createColumn({
                    name: 'amount',
                    label: 'Monto'
                }),
                search.createColumn({
                    name: 'custbody_mp_orden_venta_relacionada',
                    label: 'Orden de Venta Relacionada'
                })
            ]
        });

        var paymentTestResults = processSearchInBatches(paymentTestSearch, 100);
        
        log.debug('Resultados de prueba de pagos', {
            totalPaymentsFound: paymentTestResults.length,
            samplePayments: paymentTestResults.slice(0, 5).map(function(p) {
                var paymentDate = p.getValue({ name: 'trandate', summary: search.Summary.NONE });
                return {
                    number: p.getValue({ name: 'tranid', summary: search.Summary.NONE }),
                    date: paymentDate,
                    formattedDate: formatDate(paymentDate),
                    amount: p.getValue({ name: 'amount', summary: search.Summary.NONE }),
                    relatedSO: p.getValue({ name: 'custbody_mp_orden_venta_relacionada', summary: search.Summary.NONE })
                };
            })
        });

        return paymentTestResults.length;
    }

    /**
     * Ejecuta la búsqueda de Sales Orders según los criterios especificados
     * @param {Date} startDate - Fecha de inicio
     * @param {string} filterType - Tipo de filtro
     * @returns {Array} Array con los resultados de la búsqueda
     */
    function executeSalesOrderSearch(startDate, filterType) {
        // Formatear la fecha para la búsqueda
        var formattedDate = format.format({
            value: startDate,
            type: format.Type.DATE
        });

        log.debug('Búsqueda iniciada', {
            startDate: startDate,
            formattedDate: formattedDate,
            filterType: filterType
        });

        // Ejecutar prueba de pagos
        var totalPaymentsInSystem = testPaymentSearch(startDate);

        var searchObj = search.create({
            type: search.Type.SALES_ORDER,
            filters: [
                ['trandate', 'onorafter', formattedDate],
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
                    label: 'Fecha'
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

        // Procesar búsqueda en lotes
        var searchResults = processSearchInBatches(searchObj, 1000);
        var filteredResults = [];
        var totalFound = searchResults.length;
        var withPayments = 0;
        var withoutPayments = 0;

        log.debug('Procesando resultados', {
            totalFound: totalFound,
            totalPaymentsInSystem: totalPaymentsInSystem,
            filterType: filterType
        });

        // Procesar cada resultado
        for (var i = 0; i < searchResults.length; i++) {
            var result = searchResults[i];
            
            var hasPayments = result.getValue({
                name: 'formulanumeric',
                summary: search.Summary.NONE
            });

            var salesOrderId = result.id;
            var soTotal = parseFloat(result.getValue({
                name: 'total',
                summary: search.Summary.NONE
            }));

            // Obtener información de pagos para todos los Sales Orders
            var paymentInfo = getPaymentInformation(salesOrderId);

            // Contar para estadísticas basándose en los pagos reales
            if (paymentInfo.count > 0) {
                withPayments++;
            } else {
                withoutPayments++;
            }

            // Aplicar filtros según el tipo seleccionado DESPUÉS de obtener los pagos reales
            if (filterType === 'with_payments' && paymentInfo.count === 0) {
                continue; // Saltar este resultado
            }
            if (filterType === 'without_payments' && paymentInfo.count > 0) {
                continue; // Saltar este resultado
            }

            filteredResults.push({
                id: salesOrderId,
                number: result.getValue({
                    name: 'tranid',
                    summary: search.Summary.NONE
                }),
                date: result.getValue({
                    name: 'trandate',
                    summary: search.Summary.NONE
                }),
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
        }

        log.debug('Búsqueda completada', {
            totalFound: totalFound,
            withPayments: withPayments,
            withoutPayments: withoutPayments,
            resultsReturned: filteredResults.length,
            filterType: filterType,
            totalPaymentsInSystem: totalPaymentsInSystem
        });

        return filteredResults;
    }

    /**
     * Formatea una fecha para mostrar
     * @param {string} dateString - String de fecha
     * @returns {string} Fecha formateada
     */
    function formatDate(dateString) {
        if (!dateString) return '';
        
        try {
            // Si es un string de fecha de NetSuite, parsearlo correctamente
            var date = new Date(dateString);
            
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                return dateString; // Devolver el string original si no se puede parsear
            }
            
            // Formatear como DD/MM/YYYY sin usar padStart
            var day = date.getDate();
            var month = date.getMonth() + 1;
            var year = date.getFullYear();
            
            // Agregar cero al inicio si es necesario
            var dayStr = day < 10 ? '0' + day : day.toString();
            var monthStr = month < 10 ? '0' + month : month.toString();
            
            return dayStr + '/' + monthStr + '/' + year;
        } catch (error) {
            log.error('Error formateando fecha: ' + dateString, error);
            return dateString; // Devolver el string original si hay error
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

                log.debug('Procesando pago', {
                    paymentId: paymentId,
                    paymentNumber: paymentNumber,
                    amount: amount,
                    date: paymentDate
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

            log.debug('Pagos encontrados para SO: ' + salesOrderId, {
                paymentCount: paymentCount,
                paymentTotal: paymentTotal,
                soTotal: soTotal,
                payments: payments.map(function(p) {
                    return {
                        number: p.number,
                        date: p.date,
                        formattedDate: formatDate(p.date),
                        amount: p.amount
                    };
                })
            });

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
     * @returns {string} HTML del acordeón
     */
    function generateAccordionHTML(results) {
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
            '.expand-icon { float: right; font-weight: bold; color: #007bff; }' +
            '.sales-order-info { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 10px; margin-bottom: 10px; }' +
            '.info-item { padding: 5px 0; }' +
            '.info-label { font-weight: bold; color: #495057; }' +
            '.info-value { color: #6c757d; }' +
            '.debug-info { background-color: #e3f2fd; border: 1px solid #2196f3; color: #1976d2; padding: 10px; border-radius: 5px; margin-bottom: 15px; font-size: 14px; }' +
            '.transaction-link { color: #007bff; text-decoration: none; font-weight: bold; }' +
            '.transaction-link:hover { text-decoration: underline; }' +
            '</style>';

        // Información de debug
        html += '<div class="debug-info">' +
            '<strong>Información de búsqueda:</strong><br>' +
            '• Total de Sales Orders encontrados: ' + results.length + '<br>' +
            '• Sales Orders con pagos: ' + results.filter(function(r) { return r.paymentCount > 0; }).length + '<br>' +
            '• Sales Orders sin pagos: ' + results.filter(function(r) { return r.paymentCount === 0; }).length + '<br>' +
            '</div>';

        html += '<div class="accordion-container">';

        for (var i = 0; i < results.length; i++) {
            var result = results[i];
            var accordionId = 'accordion-' + i;
            
            // Generar enlace al Sales Order
            var soLink = generateTransactionLink('salesorder', result.id, result.number);
            
            html += '<div class="accordion-item">';
            html += '<div class="accordion-header" onclick="toggleAccordion(\'' + accordionId + '\')">';
            html += '<h4>Sales Order: ' + soLink + ' - Cliente: ' + result.customer + '</h4>';
            html += '<span class="expand-icon" id="icon-' + accordionId + '">+</span>';
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
                    
                    // Generar enlace al pago
                    var paymentLink = generateTransactionLink('customerpayment', payment.id, payment.number);
                    
                    html += '<div class="payment-row">';
                    html += '<div style="flex: 1;">';
                    html += '<strong>Pago:</strong> ' + paymentLink + '<br>';
                    html += '<small>Fecha: ' + formatDate(payment.date) + '</small>';
                    if (payment.memo) {
                        html += '<br><small>Memo: ' + payment.memo + '</small>';
                    }
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

        // JavaScript para el acordeón
        html += '<script>' +
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
        log.debug('Generando enlace', {
            recordType: recordType,
            recordId: recordId,
            displayText: displayText
        });
        
        if (!recordId) {
            log.debug('No hay recordId, devolviendo texto sin enlace');
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
        
        log.debug('URL generada', { url: url });
        
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