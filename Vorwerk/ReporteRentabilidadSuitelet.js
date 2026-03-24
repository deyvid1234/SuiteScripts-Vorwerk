/**
 * @NApiVersion 2.x
 * @NScriptType Suitelet
 * @NModuleScope SameAccount
 * @description Punto de entrada del Suitelet: delega en ReporteRentabilidadShared.js (lógica compartida con Map/Reduce).
 */
define(['./ReporteRentabilidadShared.js'], function (shared) {
    return {
        onRequest: shared.onRequest
    };
});
