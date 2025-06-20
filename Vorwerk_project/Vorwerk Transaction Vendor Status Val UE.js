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
            var vendorId = transaction.getValue({
                fieldId: 'entity'
            });

            // If no vendor is on the transaction, there's nothing to validate
            if (!vendorId) {
                return;
            }

            try {
                var vendorStatusLookup = search.lookupFields({
                    type: search.Type.VENDOR,
                    id: vendorId,
                    columns: ['custentity_status_prov']
                }).custentity_status_prov;
                
                // The status is returned as an array, get the first element's value
                var statusValue = (vendorStatusLookup && vendorStatusLookup.length > 0) ? vendorStatusLookup[0].value : null;

                log.debug('Vendor Validation', 'Vendor ID: ' + vendorId + ', Status: ' + statusValue);

                // 2 = 'Pendiente de Aprobacion'
                if (statusValue == 2) {
                    var validationError = error.create({
                        name: 'VENDOR_NOT_APPROVED',
                        message: 'No se pueden crear transacciones para este proveedor porque está pendiente de aprobación.',
                        notifyOff: false
                    });

                    // Throwing the error prevents the record from being saved
                    throw validationError;
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