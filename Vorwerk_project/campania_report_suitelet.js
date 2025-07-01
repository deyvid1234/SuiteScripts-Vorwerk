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
    'N/runtime'
], function (serverWidget, search, record, runtime) {
    function onRequest(context) {
        var request = context.request;
        var response = context.response;

        var form = serverWidget.createForm({ title: 'Reporte de Campañas' });

        // Dropdown de campañas (fuera de las subtabs)
        var campaniaField = form.addField({
            id: 'custpage_campania',
            type: serverWidget.FieldType.SELECT,
            label: 'Campaña',
            source: 'customrecord_camp_vw'
        });
        campaniaField.isMandatory = true;

        // Crear subtabs
        form.addSubtab({ id: 'custpage_subtab_detalle', label: 'Detalle' });
        form.addSubtab({ id: 'custpage_subtab_resultados', label: 'Transacciones Asociadas' });

        // Si ya seleccionó campaña
        var campaniaId = request.parameters.custpage_campania;
        if (campaniaId) {
            // Cargar datos de la campaña
            var campaniaRec = record.load({
                type: 'customrecord_camp_vw',
                id: campaniaId
            });
            var presupuesto = parseFloat(campaniaRec.getValue('custrecord_camp_presupuesto')) || 0;
            var encargado = campaniaRec.getText('custrecord_camp_encargado') || '';
            var fechaInicio = campaniaRec.getValue('custrecord_camp_fechainicio') || '';
            var fechaFin = campaniaRec.getValue('custrecord_camp_fechafin') || '';
            var aprobador = campaniaRec.getText('custrecord_camp_aprobador') || '';

            // Mostrar datos de la campaña en subtab Detalle
            form.addField({ id: 'custpage_presupuesto', type: serverWidget.FieldType.CURRENCY, label: 'Presupuesto', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = presupuesto;
            form.addField({ id: 'custpage_encargado', type: serverWidget.FieldType.TEXT, label: 'Encargado', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = encargado;
            form.addField({ id: 'custpage_fechainicio', type: serverWidget.FieldType.DATE, label: 'Fecha de Inicio', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = fechaInicio;
            form.addField({ id: 'custpage_fechafin', type: serverWidget.FieldType.DATE, label: 'Fecha de Fin', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = fechaFin;
            form.addField({ id: 'custpage_aprobador', type: serverWidget.FieldType.TEXT, label: 'Aprobador/Revisor', container: 'custpage_subtab_detalle' }).updateDisplayType({ displayType: serverWidget.FieldDisplayType.INLINE }).defaultValue = aprobador;

            // Buscar y agrupar Requisitions y sus Purchase Orders relacionadas
            var requisiciones = [];
            var purchaseOrders = {};

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
                    'total'
                ]
            });
            requisitionSearch.run().each(function (result) {
                // Cargar la requisición para obtener el campo de PO relacionada
                var rec = record.load({
                    type: 'purchaserequisition',
                    id: result.getValue('internalid')
                });
                var poId = '';
                try {
                    var linkLineCount = rec.getLineCount({ sublistId: 'links' });
                    for (var i = 0; i < linkLineCount; i++) {
                        var linkId = rec.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i });
                        if (linkId) {
                            poId = linkId;
                            break;
                        }
                    }
                } catch (e) {}
                requisiciones.push({
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0,
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
                    'total'
                ]
            });
            poSearch.run().each(function (result) {
                purchaseOrders[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0
                };
                return true;
            });

            // Buscar Bills e Item Receipts
            var bills = {};
            var itemReceipts = {};

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
                    'total'
                ]
            });
            billSearch.run().each(function (result) {
                bills[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0
                };
                return true;
            });

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
                    'total'
                ]
            });
            itemReceiptSearch.run().each(function (result) {
                itemReceipts[result.getValue('internalid')] = {
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0
                };
                return true;
            });

            // Mostrar cada grupo (Requisition + PO + Bill/Item Receipt) en una sublist diferente
            requisiciones.forEach(function (req, idx) {
                var sublist = form.addSublist({
                    id: 'custpage_sublist_grupo_' + idx,
                    label: 'Requisition ' + req.tranid + (req.poId && purchaseOrders[req.poId] ? ' + PO ' + purchaseOrders[req.poId].tranid : ''),
                    type: serverWidget.SublistType.LIST,
                    tab: 'custpage_subtab_resultados'
                });
                sublist.addField({ id: 'col_tipo', type: serverWidget.FieldType.TEXT, label: 'Tipo' });
                var linkField = sublist.addField({ id: 'col_link', type: serverWidget.FieldType.URL, label: 'Ver' });
                linkField.linkText = 'Ver';
                sublist.addField({ id: 'col_tranid', type: serverWidget.FieldType.TEXT, label: 'Transacción' });
                sublist.addField({ id: 'col_entity', type: serverWidget.FieldType.TEXT, label: 'Entidad' });
                sublist.addField({ id: 'col_trandate', type: serverWidget.FieldType.DATE, label: 'Fecha' });
                sublist.addField({ id: 'col_total', type: serverWidget.FieldType.CURRENCY, label: 'Total' });

                var line = 0;
                // Requisition
                sublist.setSublistValue({ id: 'col_tipo', line: line, value: 'Requisition' });
                sublist.setSublistValue({ id: 'col_tranid', line: line, value: req.tranid });
                sublist.setSublistValue({ id: 'col_entity', line: line, value: req.entity });
                sublist.setSublistValue({ id: 'col_trandate', line: line, value: req.trandate });
                sublist.setSublistValue({ id: 'col_total', line: line, value: req.total.toString() });
                sublist.setSublistValue({ id: 'col_link', line: line, value: '/app/accounting/transactions/purchreq.nl?id=' + req.internalid });
                line++;

                // PO (si existe)
                if (req.poId && purchaseOrders[req.poId]) {
                    var po = purchaseOrders[req.poId];
                    sublist.setSublistValue({ id: 'col_tipo', line: line, value: 'Purchase Order' });
                    sublist.setSublistValue({ id: 'col_tranid', line: line, value: po.tranid });
                    sublist.setSublistValue({ id: 'col_entity', line: line, value: po.entity });
                    sublist.setSublistValue({ id: 'col_trandate', line: line, value: po.trandate });
                    sublist.setSublistValue({ id: 'col_total', line: line, value: po.total.toString() });
                    sublist.setSublistValue({ id: 'col_link', line: line, value: '/app/accounting/transactions/po.nl?id=' + po.internalid });
                    line++;

                    // Buscar Bills e Item Receipts relacionados a la PO (en sublista Links)
                    var poRec = record.load({
                        type: 'purchaseorder',
                        id: po.internalid
                    });
                    var linkLineCount = poRec.getLineCount({ sublistId: 'links' });
                    for (var i = 0; i < linkLineCount; i++) {
                        var linkId = poRec.getSublistValue({ sublistId: 'links', fieldId: 'id', line: i });
                        if (linkId && bills[linkId]) {
                            var bill = bills[linkId];
                            sublist.setSublistValue({ id: 'col_tipo', line: line, value: 'Bill' });
                            sublist.setSublistValue({ id: 'col_tranid', line: line, value: bill.tranid });
                            sublist.setSublistValue({ id: 'col_entity', line: line, value: bill.entity });
                            sublist.setSublistValue({ id: 'col_trandate', line: line, value: bill.trandate });
                            sublist.setSublistValue({ id: 'col_total', line: line, value: bill.total.toString() });
                            sublist.setSublistValue({ id: 'col_link', line: line, value: '/app/accounting/transactions/vendbill.nl?id=' + bill.internalid });
                            line++;
                        }
                        if (linkId && itemReceipts[linkId]) {
                            var ir = itemReceipts[linkId];
                            sublist.setSublistValue({ id: 'col_tipo', line: line, value: 'Item Receipt' });
                            sublist.setSublistValue({ id: 'col_tranid', line: line, value: ir.tranid });
                            sublist.setSublistValue({ id: 'col_entity', line: line, value: ir.entity });
                            sublist.setSublistValue({ id: 'col_trandate', line: line, value: ir.trandate });
                            sublist.setSublistValue({ id: 'col_total', line: line, value: ir.total.toString() });
                            sublist.setSublistValue({ id: 'col_link', line: line, value: '/app/accounting/transactions/itemrcpt.nl?id=' + ir.internalid });
                            line++;
                        }
                    }
                }
            });

            // Calcular el total gastado solo con las Bill
            var totalGastado = 0;
            Object.keys(bills).forEach(function(billId) {
                totalGastado += bills[billId].total;
            });
            var color = (totalGastado <= presupuesto) ? 'green' : 'red';
            var totalGastadoHtml = '<div style="text-align:center; margin-bottom:10px;">'
                + '<span style="font-weight:bold; font-size:1.5em; display:block;">TOTAL GASTADO</span>'
                + '<span style="color:' + color + '; font-weight:bold; font-size:2em;">' + addCommas(totalGastado.toFixed(2)) + '</span>'
                + '</div>';
            form.addField({ id: 'custpage_totalgastado_html', type: serverWidget.FieldType.INLINEHTML, label: ' ', container: 'custpage_subtab_detalle' })
                .updateLayoutType({ layoutType: serverWidget.FieldLayoutType.OUTSIDEABOVE })
                .defaultValue = totalGastadoHtml;

            // Buscar Sales Orders
            var salesOrders = [];
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
                    'total'
                ]
            });
            soSearch.run().each(function (result) {
                salesOrders.push({
                    internalid: result.getValue('internalid'),
                    tranid: result.getValue('tranid'),
                    entity: result.getText('entity'),
                    trandate: result.getValue('trandate'),
                    total: parseFloat(result.getValue('total')) || 0
                });
                return true;
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
                soSublist.addField({ id: 'col_total', type: serverWidget.FieldType.CURRENCY, label: 'Total' });
                salesOrders.forEach(function(so, i) {
                    soSublist.setSublistValue({ id: 'col_tipo', line: i, value: 'Sales Order' });
                    soSublist.setSublistValue({ id: 'col_tranid', line: i, value: so.tranid });
                    soSublist.setSublistValue({ id: 'col_entity', line: i, value: so.entity });
                    soSublist.setSublistValue({ id: 'col_trandate', line: i, value: so.trandate });
                    soSublist.setSublistValue({ id: 'col_total', line: i, value: so.total.toString() });
                    soSublist.setSublistValue({ id: 'col_link', line: i, value: '/app/accounting/transactions/salesord.nl?id=' + so.internalid });
                });
            }
        }

        form.addSubmitButton('Buscar');
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

    return { onRequest: onRequest };
}); 