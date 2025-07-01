/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 */
define(['N/ui/serverWidget', 'N/url', 'N/runtime'], function(serverWidget, url, runtime) {
    function beforeLoad(context) {
        if (context.type === context.UserEventType.VIEW) {
            var form = context.form;
            var record = context.newRecord;
            var campaniaId = record.id;

            // Construye la URL del Suitelet
            var suiteletUrl = url.resolveScript({
                scriptId: 'customscript_camapana_suit', // Cambia por el ID de tu Suitelet
                deploymentId: 'customdeploy1', // Cambia por el deployment ID
                params: {
                    custpage_campania: campaniaId
                }
            });

            // Agrega el botón
            form.addButton({
                id: 'custpage_btn_reporte_campania',
                label: 'Ver Reporte de Campaña',
                functionName: "window.open('" + suiteletUrl + "', '_blank')"
            });
        }
    }

    return {
        beforeLoad: beforeLoad
    };
});