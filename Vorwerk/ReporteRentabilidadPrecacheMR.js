/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 * @NModuleScope SameAccount
 * @description Precarga por mes → ReporteRentabilidad_precache_AAAA-MM.json en REPORT_EXPORT_FOLDER_ID.
 * Modos (ver ReporteRentabilidadShared.js): FULL ~2 años móviles (programado); LAST_MONTH (Suitelet);
 * HISTORY con custscript_reporte_precache_hist_start / _hist_end (carga histórica semi-manual).
 * Parámetros: crear en el registro del script en NetSuite.
 */
define(['./ReporteRentabilidadShared.js', 'N/log'], function (shared, log) {
    function getInputData() {
        return shared.getPrecacheMapInputData();
    }

    function map(context) {
        var period = JSON.parse(context.value);
        try {
            shared.runPrecacheJobForPeriod(period);
        } catch (e) {
            log.error('ReporteRentabilidadPrecacheMR map ' + (period && period.periodKey), e.message || e);
            throw e;
        }
        try {
            context.write({
                key: period.periodKey || 'ok',
                value: '1'
            });
        } catch (w) {
            log.error('ReporteRentabilidadPrecacheMR write', w.message || w);
        }
    }

    function reduce(context) {
        context.values.forEach(function () {});
    }

    function summarize(summary) {
        log.audit('ReporteRentabilidadPrecacheMR summarize', JSON.stringify({
            inputSummary: summary.inputSummary,
            mapSummary: summary.mapSummary,
            reduceSummary: summary.reduceSummary,
            usage: summary.usage
        }));
    }

    return {
        getInputData: getInputData,
        map: map,
        reduce: reduce,
        summarize: summarize
    };
});
