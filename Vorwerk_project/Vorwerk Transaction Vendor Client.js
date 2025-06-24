/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/ui/dialog'], function(dialog) {

    function saveRecord(context) {
        // Permite el guardado, el User Event hará la validación real
        return true;
    }

    function pageInit(context) {
        window.addEventListener('error', function(event) {
            if (event && event.message && event.message.indexOf('[VENDOR_PENDING]') !== -1) {
                dialog.alert({
                    title: 'Proveedor pendiente de aprobación',
                    message: 'No se puede guardar la transacción porque uno o más proveedores están pendientes de aprobación.\nPor favor, revisa el estatus del proveedor antes de continuar.'
                });
                event.preventDefault();
            }
        }, true);
    }

    return {
        saveRecord: saveRecord,
        pageInit: pageInit
    };
});