'use strict';
/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 */
define([
    'N/ui/serverWidget',
    'N/search',
    'N/record',
    'N/runtime',
    'N/file',
    'N/render'
], function (serverWidget, search, record, runtime, file, render) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        // Detectar si se solicita descarga
        var descargar = request.parameters.descargar;
        log.debug('request.parameters',request.parameters)
        log.debug('descargar',descargar)
        var presupuesto, encargado, fechaInicio, fechaFin, aprobador, allTrans = [];
        var nombreCampania = '';

        // Obtener el valor de campaña antes de crear el select
        var campaniaId = request.parameters.custpage_campania;
        if (!campaniaId && request.parameters.custpage_nombrecampania) {
            campaniaId = request.parameters.custpage_nombrecampania;
        }

        var form = serverWidget.createForm({ title: 'Reporte de Campañas' });

        // Dropdown de campañas (fuera de las subtabs)
        var campaniaField = form.addField({
            id: 'custpage_campania',
            type: serverWidget.FieldType.SELECT,
            label: 'Campaña',
            source: 'customrecord_camp_vw'
        });
        campaniaField.isMandatory = true;
        if (campaniaId) {
            campaniaField.defaultValue = campaniaId;
            form.addField({
                id: 'custpage_set_select_value',
                type: serverWidget.FieldType.INLINEHTML,
                label: ' ',
                container: null
            }).defaultValue = "<script>document.addEventListener('DOMContentLoaded',function(){var s=document.getElementById('custpage_campania');if(s){s.value='" + campaniaId + "';}});</script>";
        }

        // Crear subtabs
        form.addSubtab({ id: 'custpage_subtab_detalle', label: 'Detalle' });
        form.addSubtab({ id: 'custpage_subtab_resumen', label: 'Resumen' });
        form.addSubtab({ id: 'custpage_subtab_resultados', label: 'Transacciones Asociadas' });

        if (campaniaId) {
            // Cargar datos de la campaña
            var campaniaRec = record.load({
                type: 'customrecord_camp_vw',
                id: campaniaId
            });
            var idCampania = campaniaId;
            presupuesto = parseFloat(campaniaRec.getValue('custrecord_camp_presupuesto')) || 0;
            encargado = campaniaRec.getText('custrecord_camp_encargado') || '';
            fechaInicio = campaniaRec.getValue('custrecord_camp_fechainicio') || '';
            fechaFin = campaniaRec.getValue('custrecord_camp_fechafin') || '';
            aprobador = campaniaRec.getText('custrecord_camp_aprobador') || '';

            // Obtener el nombre de la campaña para el PDF
            try {
                nombreCampania = campaniaRec.getText ? (campaniaRec.getText('name') || campaniaRec.getValue('name') || campaniaId) : (campaniaRec.getValue ? campaniaRec.getValue('name') : campaniaId);
            } catch (e) {
                nombreCampania = campaniaId || '';
            }

            // Función para generar prefijo del nombre de la campaña
            function generarPrefijoCampania(nombre) {
                if (!nombre) return 'CAMP';
                
                // Limpiar el nombre y tomar las primeras letras
                var nombreLimpio = nombre.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                if (nombreLimpio.length >= 4) {
                    return nombreLimpio.substring(0, 4);
                } else if (nombreLimpio.length > 0) {
                    return nombreLimpio + 'CAMP'.substring(nombreLimpio.length);
                } else {
                    return 'CAMP';
                }
            }

            // Función para rellenar números con ceros a la izquierda
            function padLeft(num, size) {
                var str = num.toString();
                while (str.length < size) {
                    str = '0' + str;
                }
                return str;
            }

            var prefijoCampania = generarPrefijoCampania(nombreCampania);
            var contadorGrupo = 1;

            // Buscar y agrupar todas las transacciones relacionadas
            var requisiciones = [];
            var purchaseOrders = {};
            var bills = {};
            var itemReceipts = {};
            var salesOrders = [];
            var grupos = []; // Array para almacenar los grupos de transacciones

            // Buscar Requisitions
            var requisitionSearch = search.create({
                type: 'purchaserequisition',
                filters: [
                    ['custbody_camp', 'anyof', campaniaId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'internalid',
                    'tranid',
                    'entity',
                    'trandate',
                    'total',
                    'currency'
                ]
            });
            requisitionSearch.run().each(function (result) {
                // Cargar la requisición para obtener el campo de PO relacionada
                log.debug('result',result)
                log.debug('requisiciones',requisiciones)
                var poId = '';
                try {
                    var rec = record.load({
                        type: 'purchaserequisition',
                        id: result.getValue('internalid')
                    });
                    var linkLineCount = rec.getLineCount({ sublistId: 'links' });
                    for (var i = 0; i < linkLineCount; i++) {
                        var linkId = rec.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i });
                        if (linkId) {
                            poId = linkId;
                            break;
                        }
                    }
                } catch (e) {
                    log.error('Error loading requisition ' + result.getValue('internalid') + ': ' + e.message);
                    // Si no se puede cargar la requisición, continuar sin el poId
                    // Las relaciones se procesarán después de cargar todas las transacciones
                    poId = '';
                }
                requisiciones.push({
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0,
                    currency: result.getText('currency'),
                    poId: poId
                });
                return true;
            });

            // Buscar Purchase Orders
            var poSearch = search.create({
                type: 'purchaseorder',
                filters: [
                    ['custbody_camp', 'anyof', campaniaId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'internalid',
                    'tranid',
                    'entity',
                    'trandate',
                    'total',
                    'currency'
                ]
            });
            poSearch.run().each(function (result) {
                purchaseOrders[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0,
                    currency: result.getText('currency') || ''
                };
                return true;
            });

            // Buscar Bills
            var billSearch = search.create({
                type: 'vendorbill',
                filters: [
                    ['custbody_camp', 'anyof', campaniaId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'internalid',
                    'tranid',
                    'entity',
                    'trandate',
                    'total',
                    'taxtotal',
                    'currency'
                ]
            });
            billSearch.run().each(function (result) {
                var total = parseFloat(result.getValue('total')) || 0;
                var taxtotal = parseFloat(result.getValue('taxtotal')) || 0;
                log.debug('total', total);
                log.debug('taxtotal', taxtotal);
                log.debug('taxtotal raw value', result.getValue('taxtotal'));
                // El subtotal siempre es total - taxtotal
                // Si taxtotal es negativo (crédito), esto efectivamente suma el valor absoluto
                // Si taxtotal es positivo (impuestos), esto resta el valor
                var subtotal = total - taxtotal;
                log.debug('subtotal calculated', subtotal);
                
                bills[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: total,
                    subtotal: subtotal,
                    currency: result.getText('currency') || ''
                };
                return true;
            });

            // Buscar Item Receipts
            var itemReceiptSearch = search.create({
                type: 'itemreceipt',
                filters: [
                    ['custbody_camp', 'anyof', campaniaId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'internalid',
                    'tranid',
                    'entity',
                    'trandate',
                    'total',
                    'currency'
                ]
            });
            itemReceiptSearch.run().each(function (result) {
                itemReceipts[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0,
                    currency: result.getText('currency') || ''
                };
                return true;
            });

            // Buscar Sales Orders
            var soSearch = search.create({
                type: 'salesorder',
                filters: [
                    ['custbody_camp', 'anyof', campaniaId],
                    'AND',
                    ['mainline', 'is', 'T']
                ],
                columns: [
                    'internalid',
                    'tranid',
                    'entity',
                    'trandate',
                    'total',
                    'currency'
                ]
            });
            soSearch.run().each(function (result) {
                salesOrders.push({
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0,
                    currency: result.getText('currency') || ''
                });
                return true;
            });

            // Crear grupos de transacciones relacionadas
            var transaccionesProcesadas = {};

            // Función para obtener transacciones relacionadas a una PO
            function obtenerTransaccionesRelacionadas(poId) {
                var relacionadas = [];
                if (purchaseOrders[poId]) {
                    relacionadas.push({
                        tipo: 'Purchase Order',
                        data: purchaseOrders[poId]
                    });
                    
                    // Buscar Bills e Item Receipts relacionados
                    try {
                        var poRec = record.load({
                            type: 'purchaseorder',
                            id: poId
                        });
                        var linkLineCount = poRec.getLineCount({ sublistId: 'links' });
                        for (var i = 0; i < linkLineCount; i++) {
                            var linkId = poRec.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i });
                            if (linkId && bills[linkId] && !transaccionesProcesadas['bill_' + linkId]) {
                                relacionadas.push({
                                    tipo: 'Bill',
                                    data: bills[linkId]
                                });
                                transaccionesProcesadas['bill_' + linkId] = true;
                            }
                            if (linkId && itemReceipts[linkId] && !transaccionesProcesadas['ir_' + linkId]) {
                                relacionadas.push({
                                    tipo: 'Item Receipt',
                                    data: itemReceipts[linkId]
                                });
                                transaccionesProcesadas['ir_' + linkId] = true;
                            }
                        }
                    } catch (e) {
                        log.error('Error loading purchase order ' + poId + ': ' + e.message);
                        // Si no se puede cargar la PO, continuar sin los links relacionados
                    }
                }
                return relacionadas;
            }

            // Procesar grupos basados en requisiciones
            requisiciones.forEach(function (req) {
                if (!transaccionesProcesadas['req_' + req.internalid]) {
                    var grupo = {
                        nombre: 'Requisition ' + req.tranid,
                        idDinamico: prefijoCampania + '-' + padLeft(contadorGrupo, 3),
                        transacciones: [{
                            tipo: 'Requisition',
                            data: req
                        }]
                    };
                    transaccionesProcesadas['req_' + req.internalid] = true;

                    // Agregar PO relacionada si existe
                    if (req.poId && purchaseOrders[req.poId] && !transaccionesProcesadas['po_' + req.poId]) {
                        var poRelacionadas = obtenerTransaccionesRelacionadas(req.poId);
                        grupo.transacciones = grupo.transacciones.concat(poRelacionadas);
                        grupo.nombre += ' + PO ' + purchaseOrders[req.poId].tranid;
                        transaccionesProcesadas['po_' + req.poId] = true;
                        
                        // Log adicional si la PO fue encontrada por requisición bloqueada
                        if (req.poId && req.poId !== '') {
                            log.debug('Added PO ' + purchaseOrders[req.poId].tranid + ' to group for requisition ' + req.tranid);
                        }
                    }
                    grupos.push(grupo);
                    contadorGrupo++;
                }
            });

            // Crear un mapeo de requisiciones por ID para facilitar la búsqueda
            var requisicionesPorId = {};
            requisiciones.forEach(function(req) {
                requisicionesPorId[req.internalid] = req;
            });

            // Procesar POs que no están relacionadas a requisiciones
            Object.keys(purchaseOrders).forEach(function (poId) {
                if (!transaccionesProcesadas['po_' + poId]) {
                    var requisicionEncontrada = null;
                    
                    // Revisar el campo linkedorder en la sublista expense de la PO
                    try {
                        var poRec = record.load({
                            type: 'purchaseorder',
                            id: poId
                        });
                        var expenseCount = poRec.getLineCount({ sublistId: 'expense' });
                        
                        // Buscar en cada línea de expense por el campo linkedorder
                        for (var i = 0; i < expenseCount; i++) {
                            var linkedOrderId = poRec.getSublistValue({ sublistId: 'expense', fieldId: 'linkedorder', line: i });
                            if (linkedOrderId && requisicionesPorId[linkedOrderId]) {
                                requisicionEncontrada = requisicionesPorId[linkedOrderId];
                                log.debug('Found PO ' + purchaseOrders[poId].tranid + ' linked to requisition ' + requisicionEncontrada.tranid + ' via linkedorder field');
                                break;
                            }
                        }
                    } catch (e) {
                        log.error('Error loading purchase order ' + poId + ' for linkedorder check: ' + e.message);
                    }
                    
                    // Si se encontró una requisición relacionada, agregar la PO a ese grupo
                    if (requisicionEncontrada) {
                        // Buscar el grupo de la requisición
                        var grupoRequisicion = null;
                        for (var g = 0; g < grupos.length; g++) {
                            var grupo = grupos[g];
                            for (var t = 0; t < grupo.transacciones.length; t++) {
                                var trans = grupo.transacciones[t];
                                if (trans.tipo === 'Requisition' && trans.data.internalid === requisicionEncontrada.internalid) {
                                    grupoRequisicion = grupo;
                                    break;
                                }
                            }
                            if (grupoRequisicion) break;
                        }
                        
                        if (grupoRequisicion) {
                            var poRelacionadas = obtenerTransaccionesRelacionadas(poId);
                            grupoRequisicion.transacciones = grupoRequisicion.transacciones.concat(poRelacionadas);
                            grupoRequisicion.nombre += ' + PO ' + purchaseOrders[poId].tranid;
                            transaccionesProcesadas['po_' + poId] = true;
                            log.debug('Added PO ' + purchaseOrders[poId].tranid + ' to existing requisition group ' + grupoRequisicion.idDinamico);
                        }
                    } else {
                        // Si no se encontró relación, crear un grupo independiente para la PO
                        var poRelacionadas = obtenerTransaccionesRelacionadas(poId);
                        if (poRelacionadas.length > 0) {
                            var grupo = {
                                nombre: 'PO ' + purchaseOrders[poId].tranid,
                                idDinamico: prefijoCampania + '-' + padLeft(contadorGrupo, 3),
                                transacciones: poRelacionadas
                            };
                            transaccionesProcesadas['po_' + poId] = true;
                            grupos.push(grupo);
                            contadorGrupo++;
                        }
                    }
                }
            });

            // Procesar Bills que no están relacionadas a POs
            Object.keys(bills).forEach(function (billId) {
                if (!transaccionesProcesadas['bill_' + billId]) {
                    var grupo = {
                        nombre: 'Bill ' + bills[billId].tranid,
                        idDinamico: prefijoCampania + '-' + padLeft(contadorGrupo, 3),
                        transacciones: [{
                            tipo: 'Bill',
                            data: bills[billId]
                        }]
                    };
                    transaccionesProcesadas['bill_' + billId] = true;
                    grupos.push(grupo);
                    contadorGrupo++;
                }
            });

            // Procesar Item Receipts que no están relacionados a POs
            Object.keys(itemReceipts).forEach(function (irId) {
                if (!transaccionesProcesadas['ir_' + irId]) {
                    var grupo = {
                        nombre: 'Item Receipt ' + itemReceipts[irId].tranid,
                        idDinamico: prefijoCampania + '-' + padLeft(contadorGrupo, 3),
                        transacciones: [{
                            tipo: 'Item Receipt',
                            data: itemReceipts[irId]
                        }]
                    };
                    transaccionesProcesadas['ir_' + irId] = true;
                    grupos.push(grupo);
                    contadorGrupo++;
                }
            });

            // Calcular el total gastado solo con las Bill
            var totalGastado = 0;
            var totalSinImpuestos = 0;
            Object.keys(bills).forEach(function(billId) {
                var bill = bills[billId];
                log.debug('bill', bill);
                // Convertir el total a pesos usando la tasa de cambio
                var totalEnPesos = bill.total
                totalGastado += totalEnPesos;
                // Sumar el subtotal (sin impuestos)
                totalSinImpuestos += bill.subtotal;
            });

            // Mostrar datos de la campaña en subtab Detalle
            form.addField({ id: 'custpage_presupuesto', type: serverWidget.FieldType.CURRENCY, label: 'Presupuesto', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = presupuesto;
            form.addField({ id: 'custpage_encargado', type: serverWidget.FieldType.TEXT, label: 'Encargado', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = encargado;
            form.addField({ id: 'custpage_fechainicio', type: serverWidget.FieldType.DATE, label: 'Fecha de Inicio', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = fechaInicio;
            form.addField({ id: 'custpage_fechafin', type: serverWidget.FieldType.DATE, label: 'Fecha de Fin', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = fechaFin;
            form.addField({ id: 'custpage_aprobador', type: serverWidget.FieldType.TEXT, label: 'Aprobador/Revisor', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = aprobador;
            form.addField({ id: 'custpage_nombrecampania', type: serverWidget.FieldType.TEXT, label: 'Campaña Seleccionada', container: 'custpage_subtab_detalle' })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE })
                .defaultValue = idCampania;

            // Campo para Total Gastado (sin impuestos)
            form.addField({ id: 'custpage_totalsinimpuestos', type: serverWidget.FieldType.CURRENCY, label: 'Total Gastado (sin impuestos)', container: 'custpage_subtab_detalle' })
                .updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE })
                .defaultValue = totalSinImpuestos;

            var color = (totalGastado <= presupuesto) ? 'green' : 'red';
            var totalGastadoHtml = '<div style="text-align:center; margin-bottom:10px;">'
                + '<span style="font-weight:bold; font-size:1.5em; display:block;">TOTAL GASTADO (Convertido a Pesos)</span>'
                + '<span style="color:' + color + '; font-weight:bold; font-size:2em;">' + addCommas(totalGastado.toFixed(2)) + '</span>'
                + '<span style="font-size:0.8em; display:block; margin-top:5px;">* Convertido usando tasas de cambio de cada Bill</span>'
                + '</div>';
            form.addField({ id: 'custpage_totalgastado_html', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'custpage_subtab_detalle' })
                .updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE })
                .defaultValue = totalGastadoHtml;

            // Mostrar cada Bill con su encabezado y detalles (artículos/gastos) uno debajo del otro en el subtab Resumen
            var sublistExpenseCounter = 0;
            var sublistItemCounter = 0;
            Object.keys(bills).forEach(function(billId) {
                var bill = bills[billId];
                if (!bill || !bill.internalid) return;
                try {
                    var billRec = record.load({ type: 'vendorbill', id: billId });
                    var itemCount = billRec.getLineCount({ sublistId: 'item' });
                    var expenseCount = billRec.getLineCount({ sublistId: 'expense' });
                    log.debug('bill', bill);
                } catch (e) {
                    log.error('Error loading bill ' + billId + ': ' + e.message);
                    // Si no se puede cargar el bill, continuar con el siguiente
                    return;
                }

                // Sublista de artículos (si hay)
                if (itemCount > 0) {
                    var sublistIdItem = 'custpage_item_bill_' + sublistItemCounter + '_' + Math.floor(Math.random()*100000);
                    sublistItemCounter++;
                    var resumenItemSublist = form.addSublist({
                        id: sublistIdItem,
                        label: 'Artículos Bill ' + (bill.tranid || billId),
                        type: serverWidget.SublistType.LIST,
                        tab: 'custpage_subtab_resumen'
                    });
                    resumenItemSublist.addField({ id: 'col_bill_tranid', type: serverWidget.FieldType.TEXT, label: 'Bill' });
                    resumenItemSublist.addField({ id: 'col_bill_entity', type: serverWidget.FieldType.TEXT, label: 'Proveedor' });
                    resumenItemSublist.addField({ id: 'col_bill_trandate', type: serverWidget.FieldType.DATE, label: 'Fecha' });
                    resumenItemSublist.addField({ id: 'col_bill_item', type: serverWidget.FieldType.TEXT, label: 'Artículo' });
                    resumenItemSublist.addField({ id: 'col_bill_desc', type: serverWidget.FieldType.TEXT, label: 'Descripción' });
                    resumenItemSublist.addField({ id: 'col_bill_qty', type: serverWidget.FieldType.TEXT, label: 'Cantidad' });
                    resumenItemSublist.addField({ id: 'col_bill_rate', type: serverWidget.FieldType.CURRENCY, label: 'Precio Unitario' });
                    resumenItemSublist.addField({ id: 'col_bill_amount', type: serverWidget.FieldType.CURRENCY, label: 'Monto' });
                    resumenItemSublist.addField({ id: 'col_bill_currency', type: serverWidget.FieldType.TEXT, label: 'Moneda' });
                    resumenItemSublist.addField({ id: 'col_bill_total_line', type: serverWidget.FieldType.CURRENCY, label: 'Total' });
                    resumenItemSublist.addField({ id: 'col_bill_total', type: serverWidget.FieldType.CURRENCY, label: 'Total Bill (Pesos)' });
                    var resumenItemLine = 0;
                    for (var i = 0; i < itemCount; i++) {
                        var item = billRec.getSublistValue({ sublistId: 'item', fieldId: 'item', line: i }) || '';
                        var desc = billRec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) || '';
                        var qty = billRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                        var rate = billRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                        var amount = billRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_tranid', line: resumenItemLine, value: bill.tranid || '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_entity', line: resumenItemLine, value: bill.entity || '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_trandate', line: resumenItemLine, value: bill.trandate || '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_item', line: resumenItemLine, value: item });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_desc', line: resumenItemLine, value: desc });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_qty', line: resumenItemLine, value: qty ? qty.toString() : '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_rate', line: resumenItemLine, value: rate ? rate.toString() : '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_amount', line: resumenItemLine, value: amount ? amount.toString() : '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_currency', line: resumenItemLine, value: bill.currency || '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_total_line', line: resumenItemLine, value: amount ? amount.toString() : '' });
                        resumenItemSublist.setSublistValue({ id: 'col_bill_total', line: resumenItemLine, value: bill.total ? bill.total.toString() : '0' });
                        resumenItemLine++;
                    }
                }

                // Sublista de gastos (si hay)
                if (expenseCount > 0) {
                    var sublistIdExpense = 'custpage_expense_bill_' + sublistExpenseCounter + '_' + Math.floor(Math.random()*100000);
                    sublistExpenseCounter++;
                    var resumenExpenseSublist = form.addSublist({
                        id: sublistIdExpense,
                        label: 'Gastos Bill ' + (bill.tranid || billId),
                        type: serverWidget.SublistType.LIST,
                        tab: 'custpage_subtab_resumen'
                    });
                    resumenExpenseSublist.addField({ id: 'col_bill_tranid', type: serverWidget.FieldType.TEXT, label: 'Bill' });
                    resumenExpenseSublist.addField({ id: 'col_bill_entity', type: serverWidget.FieldType.TEXT, label: 'Proveedor' });
                    resumenExpenseSublist.addField({ id: 'col_bill_trandate', type: serverWidget.FieldType.DATE, label: 'Fecha' });
                    resumenExpenseSublist.addField({ id: 'col_bill_account', type: serverWidget.FieldType.TEXT, label: 'Cuenta' });
                    resumenExpenseSublist.addField({ id: 'col_bill_desc', type: serverWidget.FieldType.TEXT, label: 'Descripción' });
                    resumenExpenseSublist.addField({ id: 'col_bill_amount', type: serverWidget.FieldType.CURRENCY, label: 'Monto' });
                    resumenExpenseSublist.addField({ id: 'col_bill_currency', type: serverWidget.FieldType.TEXT, label: 'Moneda' });
                    resumenExpenseSublist.addField({ id: 'col_bill_grossamt', type: serverWidget.FieldType.CURRENCY, label: 'Total' });
                    resumenExpenseSublist.addField({ id: 'col_bill_tax1amt', type: serverWidget.FieldType.CURRENCY, label: 'Monto Tax' });
                    resumenExpenseSublist.addField({ id: 'col_bill_taxcode', type: serverWidget.FieldType.TEXT, label: 'Tax Code' });
                    resumenExpenseSublist.addField({ id: 'col_bill_total', type: serverWidget.FieldType.CURRENCY, label: 'Total Bill (Pesos)' });
                    var resumenExpenseLine = 0;
                    for (var j = 0; j < expenseCount; j++) {
                        // Mostrar el nombre de la cuenta en vez del internalid
                        var account = billRec.getSublistText ? billRec.getSublistText({ sublistId: 'expense', fieldId: 'account', line: j }) : '';
                        account = (account !== undefined && account !== null) ? account.toString() : '';
                        var amount = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: j });
                        amount = (amount !== undefined && amount !== null) ? amount.toString() : '0';
                        var grossamt = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'grossamt', line: j });
                        grossamt = (grossamt !== undefined && grossamt !== null) ? grossamt.toString() : '0';
                        var tax1amt = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', line: j });
                        tax1amt = (tax1amt !== undefined && tax1amt !== null) ? tax1amt.toString() : '0';
                        var taxcode = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'taxcode_display', line: j });
                        taxcode = (taxcode !== undefined && taxcode !== null) ? taxcode.toString() : '';
                        var descExp = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'memo', line: j });
                        descExp = (descExp !== undefined && descExp !== null && descExp !== '') ? descExp.toString() : '-';
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_tranid', line: resumenExpenseLine, value: bill.tranid || '' });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_entity', line: resumenExpenseLine, value: bill.entity || '' });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_trandate', line: resumenExpenseLine, value: bill.trandate || '' });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_account', line: resumenExpenseLine, value: account });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_desc', line: resumenExpenseLine, value: descExp });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_amount', line: resumenExpenseLine, value: amount });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_currency', line: resumenExpenseLine, value: bill.currency || '' });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_grossamt', line: resumenExpenseLine, value: grossamt });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_tax1amt', line: resumenExpenseLine, value: tax1amt });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_taxcode', line: resumenExpenseLine, value: taxcode });
                        resumenExpenseSublist.setSublistValue({ id: 'col_bill_total', line: resumenExpenseLine, value: bill.total ? bill.total.toString() : '0' });
                        resumenExpenseLine++;
                    }
                }
            });

            // Mostrar cada grupo (Requisition + PO + Bill/Item Receipt) en una sublist diferente
            grupos.forEach(function (grupo, idx) {
                var sublist = form.addSublist({
                    id: 'custpage_sublist_grupo_' + idx,
                    label: grupo.nombre,
                    type: serverWidget.SublistType.LIST,
                    tab: 'custpage_subtab_resultados'
                });
                sublist.addField({ id: 'col_tipo', type: serverWidget.FieldType.TEXT, label: 'Tipo' });
                var linkField = sublist.addField({ id: 'col_link', type: serverWidget.FieldType.URL, label: 'Ver' });
                linkField.linkText = 'Ver';
                sublist.addField({ id: 'col_tranid', type: serverWidget.FieldType.TEXT, label: 'Transacción' });
                sublist.addField({ id: 'col_entity', type: serverWidget.FieldType.TEXT, label: 'Entidad' });
                sublist.addField({ id: 'col_trandate', type: serverWidget.FieldType.DATE, label: 'Fecha' });
                sublist.addField({ id: 'col_considerado', type: serverWidget.FieldType.TEXT, label: 'GL Impact' });
                sublist.addField({ id: 'col_total', type: serverWidget.FieldType.CURRENCY, label: 'Total' });
                sublist.addField({ id: 'col_currency', type: serverWidget.FieldType.TEXT, label: 'Moneda' });

                var line = 0;
                // Procesar cada transacción en el grupo
                grupo.transacciones.forEach(function(transaccion) {
                    var considerado = transaccion.tipo === 'Bill' ? 'Sí' : 'No';
                    
                    // Calcular el total en pesos para Bills usando la tasa de cambio
                    var totalEnPesos = transaccion.data.total;
                    if (transaccion.tipo === 'Bill') {
                        try {
                            var billRec = record.load({
                                type: 'vendorbill',
                                id: transaccion.data.internalid
                            });
                            var exchangeRate = billRec.getValue('exchangerate') || 1;
                            totalEnPesos = transaccion.data.total * exchangeRate;
                        } catch (e) {
                            log.error('Error loading bill ' + transaccion.data.internalid + ' for exchange rate: ' + e.message);
                            // Si no se puede cargar el bill, usar el total original
                            totalEnPesos = transaccion.data.total;
                        }
                    }
                    
                    sublist.setSublistValue({ id: 'col_tipo', line: line, value: transaccion.tipo || '' });
                    sublist.setSublistValue({ id: 'col_tranid', line: line, value: transaccion.data.tranid || '' });
                    sublist.setSublistValue({ id: 'col_entity', line: line, value: transaccion.data.entity || '' });
                    sublist.setSublistValue({ id: 'col_trandate', line: line, value: transaccion.data.trandate || '' });
                    sublist.setSublistValue({ id: 'col_considerado', line: line, value: considerado });
                    sublist.setSublistValue({ id: 'col_total', line: line, value: transaccion.data.total ? transaccion.data.total.toString() : '0' });
                    sublist.setSublistValue({ id: 'col_currency', line: line, value: transaccion.data.currency || '' });
                    sublist.setSublistValue({ id: 'col_link', line: line, value: '/app/accounting/transactions/' + (transaccion.tipo === 'Purchase Order' ? 'po.nl' : (transaccion.tipo === 'Bill' ? 'vendbill.nl' : (transaccion.tipo === 'Item Receipt' ? 'itemrcpt.nl' : 'purchreq.nl'))) + '?id=' + (transaccion.data.internalid || '') });
                    line++;
                });
            });

            // Mostrar todas las Sales Orders en una sublist al final
            if (salesOrders.length > 0) {
                var soSublist = form.addSublist({
                    id: 'custpage_sublist_salesorders',
                    label: 'Sales Orders',
                    type: serverWidget.SublistType.LIST,
                    tab: 'custpage_subtab_resultados'
                });
                soSublist.addField({ id: 'col_tipo', type: serverWidget.FieldType.TEXT, label: 'Tipo' });
                var soLinkField = soSublist.addField({ id: 'col_link', type: serverWidget.FieldType.URL, label: 'Ver' });
                soLinkField.linkText = 'Ver';
                soSublist.addField({ id: 'col_tranid', type: serverWidget.FieldType.TEXT, label: 'Transacción' });
                soSublist.addField({ id: 'col_entity', type: serverWidget.FieldType.TEXT, label: 'Entidad' });
                soSublist.addField({ id: 'col_trandate', type: serverWidget.FieldType.DATE, label: 'Fecha' });
                soSublist.addField({ id: 'col_considerado', type: serverWidget.FieldType.TEXT, label: 'GL Impact' });
                soSublist.addField({ id: 'col_total', type: serverWidget.FieldType.CURRENCY, label: 'Total' });
                soSublist.addField({ id: 'col_currency', type: serverWidget.FieldType.TEXT, label: 'Moneda' });
                salesOrders.forEach(function(so, i) {
                    soSublist.setSublistValue({ id: 'col_tipo', line: i, value: 'Sales Order' });
                    soSublist.setSublistValue({ id: 'col_tranid', line: i, value: so.tranid || '' });
                    soSublist.setSublistValue({ id: 'col_entity', line: i, value: so.entity || '' });
                    soSublist.setSublistValue({ id: 'col_trandate', line: i, value: so.trandate || '' });
                    soSublist.setSublistValue({ id: 'col_considerado', line: i, value: 'No' });
                    soSublist.setSublistValue({ id: 'col_total', line: i, value: so.total ? so.total.toString() : '0' });
                    soSublist.setSublistValue({ id: 'col_currency', line: i, value: so.currency || '' });
                    soSublist.setSublistValue({ id: 'col_link', line: i, value: '/app/accounting/transactions/salesord.nl?id=' + (so.internalid || '') });
                });
            }

            // Si se solicita Excel
            if (descargar === 'excel') {
                exportarExcel({
                    idCampania: idCampania,
                    grupos: grupos,
                    salesOrders: salesOrders,
                    totalGastado: totalGastado,
                    totalSinImpuestos: totalSinImpuestos,
                    presupuesto: presupuesto,
                    encargado: encargado,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    aprobador: aprobador,
                    response: response
                });
                return;
            }
            // Si se solicita PDF
            if (descargar === 'pdf') {
                exportarPDF({
                    idCampania: idCampania,
                    nombreCampania: nombreCampania,
                    grupos: grupos,
                    salesOrders: salesOrders,
                    totalGastado: totalGastado,
                    totalSinImpuestos: totalSinImpuestos,
                    presupuesto: presupuesto,
                    encargado: encargado,
                    fechaInicio: fechaInicio,
                    fechaFin: fechaFin,
                    aprobador: aprobador,
                    response: response
                });
                return;
            }
        }

        // Refuerzo: si nombreCampania sigue vacío, usa campaniaId
        if (!nombreCampania) {
            nombreCampania = campaniaId || '';
        }

        // Agregar client script para los botones
        form.clientScriptModulePath = './campania_report_client.js';
        form.addButton({
            id: 'custpage_btn_excel',
            label: 'Excel',
            functionName: 'descargarExcel'
        });
        form.addButton({
            id: 'custpage_btn_pdf',
            label: 'PDF',
            functionName: 'descargarPDF'
        });
        form.addSubmitButton('Buscar');
        // Campo oculto con la URL base para exportar correctamente (con script, deploy y compid)
        var scriptId = runtime.getCurrentScript().id;
        var deploymentId = runtime.getCurrentScript().deploymentId;
        var compId = runtime.accountId;
        var urlBase = '/app/site/hosting/scriptlet.nl?script=' + scriptId + '&deploy=' + deploymentId + '&compid=' + compId;
        form.addField({
            id: 'custpage_urlbase',
            type: serverWidget.FieldType.INLINEHTML,
            label: ' '
        }).defaultValue = "<input type='hidden' id='custpage_urlbase' value='" + urlBase + "' />";
        response.writePage(form);
    }

    // --- Agregar función para formatear números con comas ---
    function addCommas(nStr) {
        nStr += '';
        var x = nStr.split('.');
        var x1 = x[0];
        var x2 = x.length > 1 ? '.' + x[1] : '';
        var rgx = /(\d+)(\d{3})/;
        while (rgx.test(x1)) {
            x1 = x1.replace(rgx, '$1' + ',' + '$2');
        }
        return x1 + x2;
    }

    // --- Función para obtener la imagen del logo (tomada del script Vorwerk) ---
    function getImage() {
        try {
            var host;
            var idImg;

            if (runtime.envType == "SANDBOX") {
                host = "https://3367613-sb1.app.netsuite.com";
                idImg = '2576941';
                //id imagen vorwerk tm s green sandbox  
            } else {
                host = "https://3367613.app.netsuite.com";
                idImg = '2576941';
                //id imagen vorwerk tm s green prod
            }

            //obtiene imagen de check false
            var fileObj = file.load({
                id: idImg
            });
            var url_img = fileObj.url;
            url_img = stringToArray(url_img, 38);
            url_img = url_img.join('&amp;');
            url_img = host + url_img;

            return url_img;
        } catch (err) {
            log.error("error getImage", err);
            // Si hay error, usar la URL por defecto
            return "https://3367613.app.netsuite.com/core/media/media.nl?id=142592&amp;c=3367613&amp;h=Kf3ZX3KIRSgbOA_MYAW2Cr9n4gZ0Ae--DjrfM6N2isf8kA5g";
        }
    }

    // --- Función auxiliar stringToArray (tomada del script Vorwerk) ---
    function stringToArray(str, base) {
        var multiSelectStringArray = str.split(String.fromCharCode(base));
        return multiSelectStringArray;
    }

    // --- Nueva función: exportarExcel ---
    function exportarExcel(params) {
        var grupos = params.grupos;
        var response = params.response;
        var totalSinImpuestos = params.totalSinImpuestos || 0;

        if (grupos.length === 0) {
            throw new Error('No hay datos para exportar a Excel');
        }
        var csv = '';
        var totalGastado = 0;
        // Encabezado
        csv += 'Grupo,Tipo,Transacción,Entidad,Fecha,GL Impact,Total,Moneda,Total Bill (Pesos)\n';
        // Exportar cada grupo
        grupos.forEach(function (grupo) {
            grupo.transacciones.forEach(function(transaccion) {
                var considerado = transaccion.tipo === 'Bill' ? 'Sí' : 'No';
                if (transaccion.tipo === 'Bill') {
                    totalGastado += Number(transaccion.data.total) || 0;
                }
                csv += [
                    grupo.idDinamico,
                    transaccion.tipo,
                    transaccion.data.tranid,
                    transaccion.data.entity,
                    transaccion.data.trandate,
                    considerado,
                    Number(transaccion.data.total).toFixed(2),
                    transaccion.data.currency || '',
                    Number(transaccion.data.total).toFixed(2)
                ].join(',') + '\n';
            });
        });
        // Total gastado
        csv += '\nTOTAL GASTADO (Convertido a Pesos),' + totalGastado.toFixed(2) + '\n';
        csv += 'TOTAL GASTADO (sin impuestos),' + totalSinImpuestos.toFixed(2) + '\n';
        csv += 'Nota: Solo suma los Bill. Convertido usando tasas de cambio de cada Bill\n';

        if (!csv.trim()) {
            throw new Error('No hay datos para exportar a Excel');
        }
        var csvFile = file.create({
            name: 'reporte_campania.csv',
            fileType: file.Type.CSV,
            contents: csv
        });
        response.writeFile({ file: csvFile, isInline: false });
    }

    // --- Nueva función: exportarPDF ---
    function exportarPDF(params) {
        var grupos = params.grupos;
        var salesOrders = params.salesOrders;
        var totalGastado = params.totalGastado;
        var totalSinImpuestos = params.totalSinImpuestos || 0;
        var presupuesto = params.presupuesto;
        var encargado = params.encargado;
        var fechaInicio = params.fechaInicio;
        var fechaFin = params.fechaFin;
        var aprobador = params.aprobador;
        var response = params.response;
        var nombreCampania = params.nombreCampania || params.idCampania || '';

        if (grupos.length === 0 && salesOrders.length === 0) {
            throw new Error('No hay datos para exportar a PDF');
        }
        var html = '<?xml version="1.0"?>';
        html += '<!DOCTYPE pdf PUBLIC "-//big.faceless.org//report" "report-1.1.dtd">';
        html += '<pdf>';
        html += '<head><style type="text/css">'
            + 'body { font-family: Helvetica, Arial, sans-serif; font-size: 8pt; text-align: left; }'
            + 'table { width: 100%; border-collapse: collapse; font-family: Helvetica, Arial, sans-serif; font-size: 8pt; text-align: left; }'
            + 'th, td { border: 0.5px solid #000; padding: 4px; font-size: 8pt; text-align: left; white-space: normal; }'
            + 'th { font-weight: bold; font-size: 8pt; background: none; color: #000; text-align: left; }'
            + 'img.logo { display: block; margin: 0 auto 18px auto; max-width: 440px; height: auto; }'
            + '.detalle-campania { font-size: 8pt; margin-bottom: 18px; text-align: left; }'
            + '.detalle-campania span.label { font-weight: bold; color: #000; min-width: 120px; display: inline-block; text-align: left; }'
            + '.total-gastado { font-size: 8pt; color: #000; font-weight: bold; margin-bottom: 18px; text-align: left; }'
            + '.titulo-campania { text-align: center; font-size: 12pt; font-weight: bold; margin-bottom: 2px; color: #000; }'
            + '.nombre-campania { text-align: center; font-size: 8pt; font-weight: bold; margin-bottom: 18px; color: #000; }'
            + 'ul { text-align: left; margin-left: 0; padding-left: 18px; }'
            + 'li { text-align: left; }'
            + '</style></head>';
        html += '<body>';
        html += '<p align="center"><img width="100%" height="100%" src="' + getImage() + '" style="max-width:440px; height:auto; margin-bottom:8px;" alt="Logo" /></p>';
        html += '<p align="center" font-family="Helvetica" font-size="12"><b>REPORTE DE CAMPANIA</b></p>';
        html += '<p align="center" font-family="Helvetica" font-size="12"><b>' + nombreCampania + '</b></p>';
        html += '<p font-family="Helvetica" font-size="10" align="center"><b>DETALLE DE LA CAMPANIA</b></p>';
        html += '<table border="0" style="margin-bottom:18px; font-size:12pt; width:100%; border:none;"><tr>'
            + '<td style="border:none;"><b>Presupuesto:</b> ' + addCommas(presupuesto.toFixed(2)) + '</td>'
            + '<td style="border:none;"><b>Encargado:</b> ' + encargado + '</td>'
            + '<td style="border:none;"><b>Fecha Inicio:</b> ' + fechaInicio + '</td>'
            + '</tr><tr>'
            + '<td style="border:none;"><b>Fecha Fin:</b> ' + fechaFin + '</td>'
            + '<td style="border:none;"><b>Aprobador/Revisor:</b> ' + aprobador + '</td>'
            + '<td style="border:none;"><b>Total Gastado (sin impuestos):</b> ' + addCommas(totalSinImpuestos.toFixed(2)) + '</td>'
            + '</tr></table>';

        // --- Sección Resumen por Bill ---
        html += '<p font-family="Helvetica" font-size="10" align="center"><b>Resumen</b></p>';
        var billSearch = search.create({
            type: 'vendorbill',
            filters: [
                ['custbody_camp', 'anyof', params.idCampania],
                'AND',
                ['mainline', 'is', 'T']
            ],
            columns: [
                'internalid', 'tranid', 'entity', 'trandate', 'total', 'currency'
            ]
        });
        var billIds = [];
        var billData = {};
        billSearch.run().each(function(result) {
            var id = result.getValue('internalid');
            billIds.push(id);
            billData[id] = {
                tranid: result.getValue('tranid'),
                entity: result.getText('entity'),
                trandate: result.getValue('trandate'),
                total: result.getValue('total'),
                currency: result.getText('currency')
            };
            return true;
        });
        for (var b = 0; b < billIds.length; b++) {
            var billId = billIds[b];
            var bill = billData[billId];
            try {
                var billRec = record.load({ type: 'vendorbill', id: billId });
                var itemCount = billRec.getLineCount({ sublistId: 'item' });
                var expenseCount = billRec.getLineCount({ sublistId: 'expense' });
            } catch (e) {
                log.error('Error loading bill ' + billId + ' in PDF export: ' + e.message);
                // Si no se puede cargar el bill, continuar con el siguiente
                continue;
            }
            // Lista de datos generales antes de cada tabla de artículos
            if (itemCount > 0) {
                html += '<table style="margin-bottom:2px; font-size:12pt; width:100%; border:none;"><tr>'
                    + '<td style="border:none;"><b>Bill:</b> ' + (bill.tranid || '') + '</td>'
                    + '<td style="border:none;"><b>Proveedor:</b> ' + (bill.entity || '') + '</td>'
                    + '</tr><tr>'
                    + '<td style="border:none;"><b>Fecha:</b> ' + (bill.trandate || '') + '</td>'
                    + '<td style="border:none;"><b>Total Bill:</b> ' + addCommas((bill.total || 0).toString()) + '</td>'
                    + '</tr></table>';
                html += '<table width="670px"><tr>';
                html += '<td border="0.5" width="200px" align="left"><b>Artículo</b></td>';
                html += '<td border="0.5" width="200px" align="left"><b>Descripción</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Cantidad</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Precio Unitario</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Monto</b></td>';
                html += '<td border="0.5" width="70px" align="left"><b>Total</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Moneda</b></td>';
                html += '<td border="0.5" width="100px" align="left"><b>Total Bill (Pesos)</b></td>';
                html += '</tr>';
                for (var i = 0; i < itemCount; i++) {
                    var item = billRec.getSublistText ? billRec.getSublistText({ sublistId: 'item', fieldId: 'item', line: i }) : '';
                    var desc = billRec.getSublistValue({ sublistId: 'item', fieldId: 'description', line: i }) || '';
                    var qty = billRec.getSublistValue({ sublistId: 'item', fieldId: 'quantity', line: i });
                    var rate = billRec.getSublistValue({ sublistId: 'item', fieldId: 'rate', line: i });
                    var amount = billRec.getSublistValue({ sublistId: 'item', fieldId: 'amount', line: i });
                    html += '<tr>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (item || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (desc || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (qty !== undefined && qty !== null ? qty : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + (rate !== undefined && rate !== null ? addCommas(Number(rate).toFixed(2)) : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + (amount !== undefined && amount !== null ? addCommas(Number(amount).toFixed(2)) : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas((bill.total || 0).toString()) + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (bill.currency || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas((bill.total || 0).toString()) + '</td>';
                    html += '</tr>';
                }
                html += '</table><br/>';
            }
            // Lista de datos generales antes de cada tabla de gastos
            if (expenseCount > 0) {
                html += '<table border="0" style="margin-bottom:2px; font-size:12pt; width:100%; border:none;"><tr>'
                    + '<td style="border:none;"><b>Bill:</b> ' + (bill.tranid || '') + '</td>'
                    + '<td style="border:none;"><b>Proveedor:</b> ' + (bill.entity || '') + '</td>'
                    + '</tr><tr>'
                    + '<td style="border:none;"><b>Fecha:</b> ' + (bill.trandate || '') + '</td>'
                    + '<td style="border:none;"><b>Total Bill:</b> ' + addCommas((bill.total || 0).toString()) + '</td>'
                    + '</tr></table>';
                html += '<table width="670px"><tr>';
                html += '<td border="0.5" width="150px" align="left"><b>Cuenta</b></td>';
                html += '<td border="0.5" width="200px" align="left"><b>Descripción</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Monto</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Total</b></td>';
                html += '<td border="0.5" width="70px" align="left"><b>Monto Tax</b></td>';
                html += '<td border="0.5" width="90px" align="left"><b>TaxCode</b></td>';
                html += '<td border="0.5" width="70px" align="left"><b>Total Bill</b></td>';
                html += '<td border="0.5" width="80px" align="left"><b>Moneda</b></td>';
                html += '<td border="0.5" width="90px" align="left"><b>Total Bill (Pesos)</b></td>';
                html += '</tr>';
                for (var j = 0; j < expenseCount; j++) {
                    var account = billRec.getSublistText ? billRec.getSublistText({ sublistId: 'expense', fieldId: 'account', line: j }) : '';
                    var descExp = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'memo', line: j });
                    descExp = (descExp !== undefined && descExp !== null && descExp !== '') ? descExp.toString() : '-';
                    var amount = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'amount', line: j });
                    var grossamt = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'grossamt', line: j });
                    var tax1amt = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'tax1amt', line: j });
                    var taxcode = billRec.getSublistValue({ sublistId: 'expense', fieldId: 'taxcode_display', line: j });
                    html += '<tr>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (account || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (descExp || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + (amount !== undefined && amount !== null ? addCommas(Number(amount).toFixed(2)) : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + (grossamt !== undefined && grossamt !== null ? addCommas(Number(grossamt).toFixed(2)) : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + (tax1amt !== undefined && tax1amt !== null ? addCommas(Number(tax1amt).toFixed(2)) : '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (taxcode || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas((bill.total || 0).toString()) + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow">' + (bill.currency || '') + '</td>';
                    html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas((bill.total || 0).toString()) + '</td>';
                    html += '</tr>';
                }
                html += '</table><br/>';
            }
        }

        html += '<p font-family="Helvetica" font-size="10" align="center"><b>Transacciones Asociadas</b></p>';

        // Exportar cada grupo
        grupos.forEach(function (grupo) {
            html += '<p font-family="Helvetica" font-size="8" align="center"><b>Grupo: ' + grupo.idDinamico + '</b></p>';
            html += '<table width="670px"><tr>';
            html += '<td border="0.5" width="100px" align="left"><b>Tipo</b></td>';
            html += '<td border="0.5" width="120px" align="left"><b>Transacción</b></td>';
            html += '<td border="0.5" width="150px" align="left"><b>Entidad</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Fecha</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>GL Impact</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Total</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Moneda</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Total Bill (Pesos)</b></td>';
            html += '</tr>';
            
            grupo.transacciones.forEach(function(transaccion) {
                var considerado = transaccion.tipo === 'Bill' ? 'Sí' : 'No';
                html += '<tr>';
                html += '<td border="0.5" border-style="dotted-narrow">' + transaccion.tipo + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + transaccion.data.tranid + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + transaccion.data.entity + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + transaccion.data.trandate + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + considerado + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas(transaccion.data.total.toFixed(2)) + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + (transaccion.data.currency || '') + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas(transaccion.data.total.toFixed(2)) + '</td>';
                html += '</tr>';
            });
            html += '</table><br/>';
        });
        
        // Sales Orders
        if (salesOrders.length > 0) {
            html += '<p font-family="Helvetica" font-size="8" align="center"><b>Sales Orders</b></p>';
            html += '<table width="670px"><tr>';
            html += '<td border="0.5" width="100px" align="left"><b>Tipo</b></td>';
            html += '<td border="0.5" width="120px" align="left"><b>Transacción</b></td>';
            html += '<td border="0.5" width="150px" align="left"><b>Entidad</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Fecha</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>GL Impact</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Total</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Moneda</b></td>';
            html += '<td border="0.5" width="80px" align="left"><b>Total Bill (Pesos)</b></td>';
            html += '</tr>';
            salesOrders.forEach(function(so) {
                html += '<tr>';
                html += '<td border="0.5" border-style="dotted-narrow">Sales Order</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + so.tranid + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + so.entity + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + so.trandate + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">No</td>';
                html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas(so.total.toFixed(2)) + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow">' + (so.currency || '') + '</td>';
                html += '<td border="0.5" border-style="dotted-narrow" align="right">' + addCommas(so.total.toFixed(2)) + '</td>';
                html += '</tr>';
            });
            html += '</table><br/>';
        }
        html += '</body></pdf>';
        if (!html.trim()) {
            throw new Error('No hay datos para exportar a PDF');
        }
        var pdfFile = render.xmlToPdf({ xmlString: html });
        response.writeFile({ file: pdfFile, isInline: false });
    }

    return { onRequest: onRequest };
}); 