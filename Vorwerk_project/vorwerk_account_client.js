define([], function() {
    function descargarCSV() {
        var field = document.getElementById('custpage_download');
        if (field) field.value = 'csv';
        document.forms[0].submit();
    }
    return { descargarCSV: descargarCSV };
}); 