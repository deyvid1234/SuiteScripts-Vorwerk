/**
 * @NApiVersion 2.x
 * @NModuleScope Public
 */
define([], function() {
    function descargarExcel() {
        navegarConParametro('descargar', 'excel');
    }
    function descargarPDF() {
        navegarConParametro('descargar', 'pdf');
    }
    function navegarConParametro(param, valor) {
        var urlBaseInput = document.getElementById('custpage_urlbase');
        var url = urlBaseInput ? urlBaseInput.value : window.location.href;

        // Quitar solo los parámetros de campaña y descarga, pero NO el resto
        url = url.replace(new RegExp('([&?])custpage_campania=[^&]*', 'g'), '$1');
        url = url.replace(new RegExp('([&?])' + param + '=[^&]*', 'g'), '$1');

        // Eliminar & o ? sobrantes al final
        url = url.replace(/[&?]+$/, '');

        // Obtener el valor seleccionado de campaña
        var campania = document.getElementById('custpage_nombrecampania');
        log.debug('campania',campania)
        var campaniaId = campania ? campania.value : '';

        if (!campaniaId) {
            alert('Debe seleccionar una campaña antes de exportar.');
            return;
        }

        // Armar la nueva URL
        if (url.indexOf('?') === -1) {
            url += '?';
        } else if (!url.endsWith('?') && !url.endsWith('&')) {
            url += '&';
        }
        url += 'custpage_campania=' + encodeURIComponent(campaniaId) + '&' + param + '=' + valor;

        log.debug('URL final para exportar:', url);
        window.location.href = url;
    }
    return {
        descargarExcel: descargarExcel,
        descargarPDF: descargarPDF
    };
}); 