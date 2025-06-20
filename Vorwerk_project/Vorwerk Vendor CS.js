/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 * @NModuleScope SameAccount
 */
define(['N/currentRecord', 'N/record', 'N/ui/dialog'],
    function(currentRecord, record, dialog) {

        function approveVendor() {
            var rec = currentRecord.get();
            try {
                record.submitFields({
                    type: rec.type,
                    id: rec.id,
                    values: {
                        'custentity_status_prov': 1 // 1 = Aprobado
                    }
                });
                dialog.alert({
                    title: 'Éxito',
                    message: 'Proveedor Aprobado'
                }).then(function() {
                    window.location.reload();
                });
            } catch (e) {
                console.error('Error approving vendor', e);
                dialog.alert({
                    title: 'Error',
                    message: 'Error al aprobar proveedor: ' + e.message
                });
            }
        }

        function rejectVendor() {
            var rec = currentRecord.get();
             try {
                record.submitFields({
                    type: rec.type,
                    id: rec.id,
                    values: {
                        'custentity_status_prov': 2 // Kept as Pendiente
                    }
                });
                dialog.alert({
                    title: 'Éxito',
                    message: 'Proveedor Rechazado'
                }).then(function(){
                    window.location.reload();
                });
            } catch (e) {
                console.error('Error rejecting vendor', e);
                dialog.alert({
                    title: 'Error',
                    message: 'Error al rechazar proveedor: ' + e.message
                });
            }
        }

        return {
            approveVendor: approveVendor,
            rejectVendor: rejectVendor
        };
    }); 