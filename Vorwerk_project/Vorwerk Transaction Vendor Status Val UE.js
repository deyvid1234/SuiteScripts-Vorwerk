/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/search', 'N/log', 'N/error'],
    function(search, log, error) {

        /**
         * Function definition to be triggered before a record is submitted.
         * This function will prevent the creation of transactions for unapproved vendors.
         *
         * @param {Object} scriptContext
         * @param {Record} scriptContext.newRecord - New record
         * @param {string} scriptContext.type - Trigger type
         * @Since 2015.2
         */
        function beforeSubmit(scriptContext) {
            // Run validation only on 'create' events
            if (scriptContext.type !== scriptContext.UserEventType.CREATE) {
                return;
            }

            var transaction = scriptContext.newRecord;
            var vendorIds = [];
            var vendorNames = [];
            var tranType = transaction.type || transaction.getValue({ fieldId: 'type' });
            log.debug({ title: 'Transaction Type', details: tranType });
            var typesWithHeaderVendor = ['vendorbill', 'purchaseorder', 'vendorcredit'];
            if (typesWithHeaderVendor.indexOf(tranType) !== -1) {
                // Validar encabezado y sublistas
                var vendorId = transaction.getValue({ fieldId: 'entity' });
                if (vendorId) {
                    vendorIds = [vendorId];
                }
                // Buscar en sublista item (por nombre)
                var itemLineCount = transaction.getLineCount({ sublistId: 'item' });
                for (var i = 0; i < itemLineCount; i++) {
                    var lineVendorName = transaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'vendorname',
                        line: i
                    });
                    if (lineVendorName && vendorNames.indexOf(lineVendorName) === -1) {
                        vendorNames.push(lineVendorName);
                    }
                }
                log.debug({ title: 'Vendor Names from item sublist', details: JSON.stringify(vendorNames) });
                // Buscar en sublista expense (por ID)
                var expenseLineCount = transaction.getLineCount({ sublistId: 'expense' });
                for (var j = 0; j < expenseLineCount; j++) {
                    var expenseVendorId = transaction.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'povendor',
                        line: j
                    });
                    if (expenseVendorId && vendorIds.indexOf(expenseVendorId) === -1) {
                        vendorIds.push(expenseVendorId);
                    }
                }
                log.debug({ title: 'Vendor IDs from expense sublist', details: JSON.stringify(vendorIds) });
                if (vendorNames.length === 0 && vendorIds.length === 0) {
                    return;
                }
            } else {
                // Solo validar proveedores a nivel de línea
                // Buscar en sublista item (por nombre)
                var itemLineCount = transaction.getLineCount({ sublistId: 'item' });
                for (var i = 0; i < itemLineCount; i++) {
                    var lineVendorName = transaction.getSublistValue({
                        sublistId: 'item',
                        fieldId: 'vendorname',
                        line: i
                    });
                    if (lineVendorName && vendorNames.indexOf(lineVendorName) === -1) {
                        vendorNames.push(lineVendorName);
                    }
                }
                log.debug({ title: 'Vendor Names from item sublist', details: JSON.stringify(vendorNames) });
                // Buscar en sublista expense (por ID)
                var expenseLineCount = transaction.getLineCount({ sublistId: 'expense' });
                for (var j = 0; j < expenseLineCount; j++) {
                    var expenseVendorId = transaction.getSublistValue({
                        sublistId: 'expense',
                        fieldId: 'povendor',
                        line: j
                    });
                    if (expenseVendorId && vendorIds.indexOf(expenseVendorId) === -1) {
                        vendorIds.push(expenseVendorId);
                    }
                }
                log.debug({ title: 'Vendor IDs from expense sublist', details: JSON.stringify(vendorIds) });
                if (vendorNames.length === 0 && vendorIds.length === 0) {
                    return;
                }
            }

            try {
                // Primero, buscar IDs por nombre para los de item
                for (var n = 0; n < vendorNames.length; n++) {
                    var vendorSearch = search.create({
                        type: search.Type.VENDOR,
                        filters: [['entityid', 'is', vendorNames[n]]],
                        columns: ['internalid']
                    });
                    var searchResult = vendorSearch.run().getRange({ start: 0, end: 1 });
                    if (searchResult && searchResult.length > 0) {
                        var foundId = searchResult[0].getValue({ name: 'internalid' });
                        if (foundId && vendorIds.indexOf(foundId) === -1) {
                            vendorIds.push(foundId);
                        }
                    }
                }
                log.debug({ title: 'Final Vendor IDs to validate', details: JSON.stringify(vendorIds) });
                // Validar todos los IDs únicos
                for (var v = 0; v < vendorIds.length; v++) {
                    var vendorStatusLookup = search.lookupFields({
                        type: search.Type.VENDOR,
                        id: vendorIds[v],
                        columns: ['custentity_status_prov']
                    }).custentity_status_prov;
                    var statusValue = (vendorStatusLookup && vendorStatusLookup.length > 0) ? vendorStatusLookup[0].value : null;
                    log.debug('Vendor Validation', 'Vendor ID: ' + vendorIds[v] + ', Status: ' + statusValue);
                    // 2 = 'Pendiente de Aprobacion'
                    if (statusValue == 2) {
                        var validationError = error.create({
                            name: 'VENDOR_NOT_APPROVED',
                            message: '[VENDOR_PENDING] No se puede guardar la transacción porque uno o más proveedores están pendientes de aprobación. Por favor, revisa el estatus del proveedor antes de continuar.',
                            notifyOff: false
                        });
                        throw validationError;
                    }
                }

            } catch (e) {
                // Re-throw the specific validation error to ensure it's shown to the user
                if (e.name === 'VENDOR_NOT_APPROVED') {
                    throw e;
                }
                
                log.error({
                    title: 'Error During Vendor Status Validation',
                    details: 'Vendor ID: ' + vendorId + ' | Error: ' + e.message
                });
                
                // Throw a generic error for any other unexpected issues
                throw error.create({
                    name: 'VALIDATION_SCRIPT_ERROR',
                    message: 'Ocurrió un error inesperado al validar el estado del proveedor. Detalles: ' + e.message
                });
            }
        }

        return {
            beforeSubmit: beforeSubmit
        };
    }); 