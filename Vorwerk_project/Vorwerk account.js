/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 */
define(['N/ui/serverWidget', 'N/search', 'N/file', 'N/log'], function(serverWidget, search, file, log) {
    
    // Función helper para procesar búsquedas en lotes
    function processSearchInBatches(searchObj, batchSize) {
        var results = [];
        var startIndex = 0;
        var hasMoreResults = true;
        
        // Asegurar que el batchSize no exceda el límite de getRange()
        var maxBatchSize = Math.min(batchSize, 1000);
        
        while (hasMoreResults) {
            try {
                var resultSet = searchObj.run();
                var batch = resultSet.getRange({ start: startIndex, end: startIndex + maxBatchSize });
                
                if (batch.length === 0) {
                    hasMoreResults = false;
                    break;
                }
                
                for (var i = 0; i < batch.length; i++) {
                    results.push(batch[i]);
                }
                
                startIndex += maxBatchSize;
                
                // Si obtenemos menos resultados que el tamaño del lote, hemos terminado
                if (batch.length < maxBatchSize) {
                    hasMoreResults = false;
                }
                
                log.debug('Procesando lote', 'Lote procesado: ' + startIndex + ' registros totales: ' + results.length);
                
            } catch (error) {
                log.error('Error procesando lote', error);
                hasMoreResults = false;
            }
        }
        
        return results;
    }
    
    function onRequest(context) {
        // Si el usuario solicita la descarga del CSV
        if (context.request.parameters.custpage_download === 'csv') {
            var customReportId = 'customsearch_account_2120';
            var reportSearch = search.load({ id: customReportId });
            var searchResult = [];
            reportSearch.run().each(function(result) {
                searchResult.push(result);
                return true;
            });
            var accountId = '';
            var accountBalance = 0;
            if (searchResult.length > 0) {
                accountId = searchResult[0].id;
                accountBalance = parseFloat(searchResult[0].getValue({ name: 'balance' })) || 0;
            }
            var fechaInicio = context.request.parameters.custpage_fecha_inicio;
            var fechaFin = context.request.parameters.custpage_fecha_fin;
            // Obtener saldo inicial como en la lógica principal
            var saldoInicial = 0;
            if (fechaInicio) {
                try {
                    var customSearch2387 = search.load({ id: 'customsearch2387' });
                    var filters = [];
                    customSearch2387.filters.forEach(function(f) { filters.push(f); });
                    filters.push(search.createFilter({
                        name: 'trandate',
                        operator: search.Operator.BEFORE,
                        values: fechaInicio
                    }));
                    customSearch2387.filters = filters;
                    var saldoInicialResults = customSearch2387.run().getRange({ start: 0, end: 1 });
                    if (saldoInicialResults.length > 0) {
                        var columns = customSearch2387.columns;
                        var amountCol = null;
                        for (var i = 0; i < columns.length; i++) {
                            if (columns[i].name === 'amount') {
                                amountCol = columns[i];
                                break;
                            }
                        }
                        if (amountCol) {
                            saldoInicial = parseFloat(saldoInicialResults[0].getValue(amountCol)) || 0;
                        } else {
                            saldoInicial = 0;
                        }
                    } else {
                        saldoInicial = 0;
                    }
                } catch (error) {
                    saldoInicial = 0;
                }
            } else {
                saldoInicial = 0;
            }
            // Buscar transacciones
            var filters = [
                ['account', 'anyof', accountId],
                'AND',
                ['posting', 'is', 'T']
            ];
            if (fechaInicio) {
                filters.push('AND');
                filters.push(['trandate', 'onorafter', fechaInicio]);
            }
            if (fechaFin) {
                filters.push('AND');
                filters.push(['trandate', 'onorbefore', fechaFin]);
            }
            var transactionSearch = search.create({
                type: search.Type.TRANSACTION,
                filters: filters,
                columns: [
                    search.createColumn({ name: 'entity', sort: search.Sort.ASC }),
                    'trandate',
                    'type',
                    'tranid',
                    'internalid',
                    'amount',
                    'status'
                ]
            });
            var transactionResults = [];
            // Procesar transacciones en lotes para evitar el límite de 1000 resultados
            transactionResults = processSearchInBatches(transactionSearch, 1000);
            // Agrupación y totales por proveedor
            var grouped = {};
            var runningBalance = 0;
            for (var j = 0; j < transactionResults.length; j++) {
                var t = transactionResults[j];
                var status = t.getText({ name: 'status' }) || '';
                //if (status === 'Pending Approval') continue;
                var typeId = t.getValue({ name: 'type' });
                var type = t.getText({ name: 'type' }) || '';
                var proveedor = (typeId === 'fxreval') ? 'Unassigned' : (t.getText({ name: 'entity' }) || 'Sin proveedor');
                var amount = parseFloat(t.getValue({ name: 'amount' })) || 0;
                var trandate = t.getValue({ name: 'trandate' }) || '';
                var tranid = t.getValue({ name: 'tranid' }) || '';
                var internalid = t.getValue({ name: 'internalid' }) || '';
                if (!grouped[proveedor]) grouped[proveedor] = { total: 0, trans: [], lastBalance: 0 };
                grouped[proveedor].total += amount;
                runningBalance += amount;
                grouped[proveedor].lastBalance = runningBalance;
                grouped[proveedor].trans.push({
                    trandate: trandate,
                    type: type,
                    tranid: tranid,
                    internalid: internalid,
                    amount: amount,
                    balance: runningBalance
                });
            }
            // Preparar CSV replicando la tabla HTML
            var csvContent = 'Proveedor,Total,Amount,Balance,Fecha,Tipo,ID Transacción,Monto,Detalle del monto\n';
            // Fila de saldo inicial
            csvContent += ',,,"' + saldoInicial.toFixed(2) + '",,,,,\n';
            var provKeys = Object.keys(grouped);
            var unassignedIndex = provKeys.indexOf('Unassigned');
            var provKeysOrdered = provKeys;
            if (unassignedIndex !== -1) {
                provKeysOrdered = provKeys.filter(function(p) { return p !== 'Unassigned'; });
                provKeysOrdered.push('Unassigned');
            }
            var balance = saldoInicial;
            var totalAmount = 0;
            var amountAcumulado = 0;
            for (var idx = 0; idx < provKeysOrdered.length; idx++) {
                var prov = provKeysOrdered[idx];
                var provId = 'prov_' + idx;
                var totalProveedor = grouped[prov].total;
                totalAmount += totalProveedor;
                amountAcumulado += totalProveedor;
                // Fila del proveedor
                csvContent += '"' + prov + '","' + totalProveedor.toFixed(2) + '","' + amountAcumulado.toFixed(2) + '","' + balance.toFixed(2) + '",,,,,\n';
                // Filas de transacciones
                grouped[prov].trans.sort(function(a, b) { return (a.trandate > b.trandate ? 1 : (a.trandate < b.trandate ? -1 : 0)); });
                for (var k = 0; k < grouped[prov].trans.length; k++) {
                    var tr = grouped[prov].trans[k];
                    var monto = parseFloat(tr.amount) || 0;
                    balance = balance + monto;
                    csvContent += ',,,,,"' + tr.trandate + '","' + tr.type + '","' + tr.tranid + '","' + (tr.amount ? tr.amount.toFixed(2) : '') + '","' + (balance ? balance.toFixed(2) : '') + '"\n';
                }
            }
            // Fila de total al final
            csvContent += 'Total Amount,,"' + totalAmount.toFixed(2) + '","' + balance.toFixed(2) + '",,,,,\n';
            var fileObj = file.create({
                name: 'reporte.csv',
                fileType: file.Type.CSV,
                contents: csvContent
            });
            context.response.writeFile(fileObj, true);
            return;
        }
        var form = serverWidget.createForm({
            title: 'Cargar Reporte Personalizado'
        });

        // Cargar el reporte personalizado usando una búsqueda guardada
        var customReportId = 'customsearch_account_2120';
        var reportSearch = search.load({
            id: customReportId
        });

        var searchResult = [];
        reportSearch.run().each(function(result) {
            searchResult.push(result);
            return true;
        });

        var sublist = form.addSublist({
            id: 'custpage_report_sublist',
            type: serverWidget.SublistType.LIST,
            label: 'Resultados del Reporte'
        });

        // Suponiendo que el reporte tiene columnas estándar
        sublist.addField({
            id: 'name',
            type: serverWidget.FieldType.TEXT,
            label: 'Name'
        });
        sublist.addField({
            id: 'displayname',
            type: serverWidget.FieldType.TEXT,
            label: 'Display Name'
        });
        sublist.addField({
            id: 'type',
            type: serverWidget.FieldType.TEXT,
            label: 'Type'
        });
        sublist.addField({
            id: 'description',
            type: serverWidget.FieldType.TEXT,
            label: 'Description'
        });
        sublist.addField({
            id: 'balance',
            type: serverWidget.FieldType.TEXT,
            label: 'Balance'
        });

        for (var i = 0; i < searchResult.length; i++) {
            var result = searchResult[i];
            // Log para depuración de columnas
            log.debug('Columns', JSON.stringify(result.columns && result.columns.map ? result.columns.map(function(col){ return col.name; }) : []));

            var name = result.getValue({ name: 'name' });
            var displayname = result.getValue({ name: 'displayname' });
            var type = result.getText({ name: 'type' });
            var description = result.getValue({ name: 'description' });
            var balance = result.getValue({ name: 'balance' });

            if (name !== undefined) {
                sublist.setSublistValue({
                    id: 'name',
                    line: i,
                    value: name || ''
                });
            }
            if (displayname !== undefined) {
                sublist.setSublistValue({
                    id: 'displayname',
                    line: i,
                    value: displayname || ''
                });
            }
            if (type !== undefined) {
                sublist.setSublistValue({
                    id: 'type',
                    line: i,
                    value: type || ''
                });
            }
            /*if (description !== undefined) {
                sublist.setSublistValue({
                    id: 'description',
                    line: i,
                    value: description || ''
                });
            }*/
            if (balance !== undefined) {
                sublist.setSublistValue({
                    id: 'balance',
                    line: i,
                    value: balance || ''
                });
            }
        }

        // Agregar campos de fecha para el rango de búsqueda
        var fechaInicioField = form.addField({
            id: 'custpage_fecha_inicio',
            type: serverWidget.FieldType.DATE,
            label: 'Fecha Inicio'
        });
        var fechaFinField = form.addField({
            id: 'custpage_fecha_fin',
            type: serverWidget.FieldType.DATE,
            label: 'Fecha Fin'
        });

        // Agregar nuevo campo para balance a fecha específica
        var balanceFechaField = form.addField({
            id: 'custpage_balance_fecha',
            type: serverWidget.FieldType.DATE,
            label: 'Balance a la fecha seleccionada'
        });

        // Si el request es POST, tomar los valores ingresados
        var fechaInicio = context.request.parameters.custpage_fecha_inicio;
        var fechaFin = context.request.parameters.custpage_fecha_fin;
        var balanceFecha = context.request.parameters.custpage_balance_fecha;
        if (fechaInicio) form.getField({id: 'custpage_fecha_inicio'}).defaultValue = fechaInicio;
        if (fechaFin) form.getField({id: 'custpage_fecha_fin'}).defaultValue = fechaFin;
        if (balanceFecha) form.getField({id: 'custpage_balance_fecha'}).defaultValue = balanceFecha;

        // Agregar botón de consultar
        form.addSubmitButton({ label: 'Consultar' });
        form.addButton({
            id: 'custpage_download_csv',
            label: 'Descargar CSV',
            functionName: 'descargarCSV'
        });
        
        // Agregar nuevo botón para consultar balance a fecha específica
        form.addButton({
            id: 'custpage_consultar_balance_fecha',
            label: 'Consultar balance de fecha especifica',
            functionName: 'consultarBalanceFecha'
        });
        
        form.clientScriptModulePath = 'SuiteScripts/Vorwerk_project/vorwerk_account_client.js';

        // Agregar campo oculto para controlar la descarga de CSV
        var downloadField = form.addField({
            id: 'custpage_download',
            type: serverWidget.FieldType.TEXT,
            label: 'Download'
        });
        downloadField.updateDisplayType({ displayType: serverWidget.FieldDisplayType.HIDDEN });

        // Solo ejecutar la lógica de búsqueda y mostrar el sublist si es POST
        if (context.request.method === 'POST') {
            // ID de la cuenta a consultar (puedes obtenerlo dinámicamente si lo deseas)
            var accountId = '';
            // Por ahora, tomaremos la primera cuenta del resultado anterior si existe
            if (searchResult.length > 0) {
                accountId = searchResult[0].id;
            }

            if (accountId) {
                // Obtener el balance de la cuenta seleccionada
                var accountBalance = 0;
                if (searchResult.length > 0) {
                    accountBalance = parseFloat(searchResult[0].getValue({ name: 'balance' })) || 0;
                }
                
                // Solo ejecutar la búsqueda de transacciones si hay al menos una fecha de inicio o fin especificada
                if (fechaInicio || fechaFin) {
                    // Cargar la búsqueda personalizada para obtener el saldo inicial
                    var saldoInicial = 0;
                    if (fechaInicio) {
                        try {
                            log.debug('Cargando búsqueda customsearch2387', 'Iniciando carga de búsqueda personalizada');
                            
                            var customSearch2387 = search.load({
                                id: 'customsearch2387'
                            });
                            
                            log.debug('Búsqueda cargada', 'customsearch2387 cargada exitosamente');
                            
                            // Agregar filtro de fecha antes de la fecha de inicio usando search.createFilter
                            var filters = [];
                            customSearch2387.filters.forEach(function(f) { filters.push(f); });
                            filters.push(search.createFilter({
                                name: 'trandate',
                                operator: search.Operator.BEFORE,
                                values: fechaInicio
                            }));
                            customSearch2387.filters = filters;
                            
                            log.debug('Filtro agregado', 'Filtro de fecha antes de: ' + fechaInicio);
                            
                            var saldoInicialResults = customSearch2387.run().getRange({
                                start: 0,
                                end: 1
                            });
                            
                            log.debug('Resultados obtenidos', 'Cantidad de resultados: ' + saldoInicialResults.length);
                            
                            if (saldoInicialResults.length > 0) {
                                // Obtener la columna de amount de la búsqueda
                                var columns = customSearch2387.columns;
                                var amountCol = null;
                                for (var i = 0; i < columns.length; i++) {
                                    if (columns[i].name === 'amount') {
                                        amountCol = columns[i];
                                        break;
                                    }
                                }
                                if (amountCol) {
                                    saldoInicial = parseFloat(saldoInicialResults[0].getValue(amountCol)) || 0;
                                    log.debug('Saldo inicial obtenido', 'Valor: ' + saldoInicial);
                                } else {
                                    log.debug('Columna amount no encontrada en la búsqueda customsearch2387');
                                    saldoInicial = 0;
                                }
                            } else {
                                log.debug('Sin resultados', 'No se encontraron transacciones antes de la fecha de inicio');
                                saldoInicial = 0;
                            }
                            
                        } catch (error) {
                            log.error('Error al cargar búsqueda customsearch2387', error);
                            saldoInicial = 0;
                        }
                    } else {
                        log.debug('Sin fecha de inicio', 'No se puede calcular saldo inicial sin fecha de inicio');
                        saldoInicial = 0;
                    }
                    
                    log.debug('Saldo inicial final', 'Valor calculado: ' + saldoInicial);
                    
                    var filters = [
                        ['account', 'anyof', accountId],
                        'AND',
                        ['posting', 'is', 'T']
                    ];
                    if (fechaInicio) {
                        filters.push('AND');
                        filters.push(['trandate', 'onorafter', fechaInicio]);
                    }
                    if (fechaFin) {
                        filters.push('AND');
                        filters.push(['trandate', 'onorbefore', fechaFin]);
                    }
                    var transactionSearch = search.create({
                        type: search.Type.TRANSACTION,
                        filters: filters,
                        columns: [
                            search.createColumn({ name: 'entity', sort: search.Sort.ASC }),
                            'trandate',
                            'type',
                            'tranid',
                            'internalid',
                            'amount',
                            'status'
                        ]
                    });

                    var transactionResults = [];
                    // Procesar transacciones en lotes para evitar el límite de 1000 resultados
                    transactionResults = processSearchInBatches(transactionSearch, 1000);

                    // Agrupación y totales por proveedor para HTML con balance ajustado
                    var grouped = {};
                    var runningBalance = 0;
                    for (var j = 0; j < transactionResults.length; j++) {
                        var t = transactionResults[j];
                        var status = t.getText({ name: 'status' }) || '';
                        //if (status === 'Pending Approval') continue;
                        var typeId = t.getValue({ name: 'type' });
                        var type = t.getText({ name: 'type' }) || '';
                        var proveedor = (typeId === 'fxreval') ? 'Unassigned' : (t.getText({ name: 'entity' }) || 'Sin proveedor');
                        var amount = parseFloat(t.getValue({ name: 'amount' })) || 0;
                        var trandate = t.getValue({ name: 'trandate' }) || '';
                        var tranid = t.getValue({ name: 'tranid' }) || '';
                        var internalid = t.getValue({ name: 'internalid' }) || '';
                        if (!grouped[proveedor]) grouped[proveedor] = { total: 0, trans: [], lastBalance: 0 };
                        grouped[proveedor].total += amount;
                        // Usar directamente el signo de la cantidad para el cálculo del balance
                        runningBalance += amount;
                        grouped[proveedor].lastBalance = runningBalance;
                        grouped[proveedor].trans.push({
                            trandate: trandate,
                            type: type,
                            tranid: tranid,
                            internalid: internalid,
                            amount: amount,
                            balance: runningBalance
                        });
                    }
                    // Generar HTML acordeón con balance ajustado
                    var html = '<style>\n'
                        + '.prov-row { font-weight:bold; background:#f0f0f0; cursor:pointer; }\n'
                        + '.trans-row { display:none; background:#fff; }\n'
                        + '.prov-row.open + .trans-row { display:table-row; }\n'
                        + '</style>';
                    html += '<table border="1" width="100%" cellpadding="4" cellspacing="0">';
                    html += '<tr><th>Proveedor</th><th>Total</th><th>Amount</th><th>Balance</th><th>Fecha</th><th>Tipo</th><th>ID Transacción</th><th>Monto</th><th>Detalle del monto</th></tr>';
                    var provIndex = 0;
                    var provKeys = Object.keys(grouped);
                    // Si existe el grupo 'Unassigned', lo quitamos del array y lo agregamos al final
                    var unassignedIndex = provKeys.indexOf('Unassigned');
                    var provKeysOrdered = provKeys;
                    if (unassignedIndex !== -1) {
                        provKeysOrdered = provKeys.filter(function(p) { return p !== 'Unassigned'; });
                        provKeysOrdered.push('Unassigned');
                    }
                    var balanceGlobal = 0;
                    // Calcular el totalAmount sumando todas las transacciones
                    var totalAmount = 0;
                    for (var provKey in grouped) {
                        if (grouped.hasOwnProperty(provKey)) {
                            totalAmount += grouped[provKey].total;
                        }
                    }
                    // Calcular la suma de todas las transacciones del periodo
                    var sumaTransacciones = 0;
                    for (var provKey in grouped) {
                        if (grouped.hasOwnProperty(provKey)) {
                            sumaTransacciones += grouped[provKey].total;
                        }
                    }
                    // Usar el saldo inicial obtenido de la búsqueda personalizada
                    log.debug('accountBalance',accountBalance)
                    log.debug('sumaTransacciones',sumaTransacciones)
                    log.debug('saldoInicial',saldoInicial)
                    // Fila de saldo inicial
                    html += '<tr style="font-weight:bold; background:#f8f8f8;">'
                        + '<td></td>' // Proveedor vacío
                        + '<td></td>' // Total vacío
                        + '<td>0.00</td>' // Amount inicial
                        + '<td>' + saldoInicial.toFixed(2) + '</td>' // Balance
                        + '<td colspan="5"></td>'
                        + '</tr>';
                    var balance = saldoInicial;
                    log.debug('balance',balance)
                    var totalAmount = 0;
                    var amountAcumulado = 0;
                    for (var idx = 0; idx < provKeysOrdered.length; idx++) {
                        var prov = provKeysOrdered[idx];
                        var provId = 'prov_' + idx;
                        var totalProveedor = grouped[prov].total;
                        totalAmount += totalProveedor;
                        amountAcumulado += totalProveedor;
                        // Fila del proveedor (expandible) muestra el amount progresivo
                        html += '<tr class="prov-row" id="' + provId + '" onclick="toggleTrans(\'' + provId + '\')">'
                            + '<td>' + prov + '</td>'
                            + '<td>' + totalProveedor.toFixed(2) + '</td>'
                            + '<td>' + amountAcumulado.toFixed(2) + '</td>' // Amount progresivo
                            + '<td>' + balance.toFixed(2) + '</td>'
                            + '<td colspan="5"></td>'
                            + '</tr>';
                        // Filas de transacciones
                        grouped[prov].trans.sort(function(a, b) { return (a.trandate > b.trandate ? 1 : (a.trandate < b.trandate ? -1 : 0)); });
                        for (var k = 0; k < grouped[prov].trans.length; k++) {
                            var tr = grouped[prov].trans[k];
                            var monto = parseFloat(tr.amount) || 0;
                            balance = balance + monto;
                            html += '<tr class="trans-row trans-' + provId + '">'
                                + '<td></td>'
                                + '<td></td>'
                                + '<td></td>' // Amount vacío en transacción
                                + '<td>' + balance.toFixed(2) + '</td>'
                                + '<td>' + tr.trandate + '</td>'
                                + '<td>' + tr.type + '</td>'
                                + '<td><a href="/app/accounting/transactions/transaction.nl?id=' + tr.internalid + '" target="_blank">' + tr.tranid + '</a></td>'
                                + '<td>' + (tr.amount ? tr.amount.toFixed(2) : '') + '</td>'
                                + '<td>' + (balance ? balance.toFixed(2) : '') + '</td>'
                                + '</tr>';
                        }
                    }
                    // Agregar fila de total al final
                    html += '<tr style="font-weight:bold; background:#e0e0e0;">'
                        + '<td>Total Amount</td>'
                        + '<td></td>'
                        + '<td>' + totalAmount.toFixed(2) + '</td>' // Amount total
                        + '<td>' + balance.toFixed(2) + '</td>'
                        + '<td colspan="5"></td>'
                        + '</tr>';
                    html += '</table>';
                    html += '<script>\n'
                        + 'function toggleTrans(provId) {'
                        + '  var rows = document.getElementsByClassName("trans-" + provId);'
                        + '  var provRow = document.getElementById(provId);'
                        + '  var open = provRow.classList.contains("open");'
                        + '  for (var i = 0; i < rows.length; i++) rows[i].style.display = open ? "none" : "table-row";'
                        + '  if (open) provRow.classList.remove("open"); else provRow.classList.add("open");'
                        + '}\n'
                        + '</script>';
                    form.addField({
                        id: 'custpage_transacciones_html',
                        type: serverWidget.FieldType.INLINEHTML,
                        label: 'Transacciones agrupadas'
                    }).defaultValue = html;
                }
            }
        }

        // Nueva funcionalidad: Consultar balance a fecha específica
        if (context.request.method === 'POST' && balanceFecha) {
            try {
                log.debug('Consultando balance a fecha específica', 'Fecha: ' + balanceFecha);
                
                // Cargar la búsqueda personalizada customsearch2387
                var customSearch2387 = search.load({
                    id: 'customsearch2387'
                });
                
                log.debug('Búsqueda customsearch2387 cargada', 'Agregando filtro de fecha');
                
                // Agregar filtro de fecha antes de la fecha seleccionada
                var filters = [];
                customSearch2387.filters.forEach(function(f) { filters.push(f); });
                filters.push(search.createFilter({
                    name: 'trandate',
                    operator: search.Operator.BEFORE,
                    values: balanceFecha
                }));
                customSearch2387.filters = filters;
                
                log.debug('Filtro agregado', 'Filtro de fecha antes de: ' + balanceFecha);
                
                var balanceResults = customSearch2387.run().getRange({
                    start: 0,
                    end: 1
                });
                
                log.debug('Resultados obtenidos', 'Cantidad de resultados: ' + balanceResults.length);
                
                var balanceAFecha = 0;
                if (balanceResults.length > 0) {
                    // Obtener la columna de amount de la búsqueda
                    var columns = customSearch2387.columns;
                    var amountCol = null;
                    for (var i = 0; i < columns.length; i++) {
                        if (columns[i].name === 'amount') {
                            amountCol = columns[i];
                            break;
                        }
                    }
                    if (amountCol) {
                        balanceAFecha = parseFloat(balanceResults[0].getValue(amountCol)) || 0;
                        log.debug('Balance a fecha obtenido', 'Valor: ' + balanceAFecha);
                    } else {
                        log.debug('Columna amount no encontrada en la búsqueda customsearch2387');
                        balanceAFecha = 0;
                    }
                } else {
                    log.debug('Sin resultados', 'No se encontraron transacciones antes de la fecha seleccionada');
                    balanceAFecha = 0;
                }
                
                // Crear nueva sublist para mostrar el balance a fecha específica
                var balanceSublist = form.addSublist({
                    id: 'custpage_balance_fecha_sublist',
                    type: serverWidget.SublistType.LIST,
                    label: 'Balance a fecha específica'
                });
                
                balanceSublist.addField({
                    id: 'fecha_balance',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Fecha'
                });
                
                balanceSublist.addField({
                    id: 'balance_valor',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Balance'
                });
                
                balanceSublist.addField({
                    id: 'cuenta',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Cuenta'
                });
                
                // Llenar la sublist con los datos
                balanceSublist.setSublistValue({
                    id: 'fecha_balance',
                    line: 0,
                    value: balanceFecha
                });
                
                balanceSublist.setSublistValue({
                    id: 'balance_valor',
                    line: 0,
                    value: balanceAFecha.toFixed(2)
                });
                
                // Obtener nombre de la cuenta si está disponible
                var nombreCuenta = 'Cuenta no especificada';
                if (searchResult.length > 0) {
                    nombreCuenta = searchResult[0].getValue({ name: 'displayname' }) || searchResult[0].getValue({ name: 'name' }) || 'Cuenta no especificada';
                }
                
                balanceSublist.setSublistValue({
                    id: 'cuenta',
                    line: 0,
                    value: nombreCuenta
                });
                
                log.debug('Sublist de balance a fecha creada', 'Balance: ' + balanceAFecha.toFixed(2) + ' para fecha: ' + balanceFecha);
                
            } catch (error) {
                log.error('Error al consultar balance a fecha específica', error);
                
                // Crear sublist de error
                var errorSublist = form.addSublist({
                    id: 'custpage_balance_fecha_error',
                    type: serverWidget.SublistType.LIST,
                    label: 'Error en consulta de balance'
                });
                
                errorSublist.addField({
                    id: 'error_message',
                    type: serverWidget.FieldType.TEXT,
                    label: 'Error'
                });
                
                errorSublist.setSublistValue({
                    id: 'error_message',
                    line: 0,
                    value: 'Error al consultar balance: ' + error.message
                });
            }
        }

        context.response.writePage(form);
    }
    return {
        onRequest: onRequest
    };
});