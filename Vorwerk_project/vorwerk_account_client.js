define([], function() {
    function descargarCSV() {
        var field = document.getElementById('custpage_download');
        if (field) field.value = 'csv';
        document.forms[0].submit();
    }
    
    function consultarBalanceFecha() {
        var balanceFechaField = document.getElementById('custpage_balance_fecha');
        if (balanceFechaField && balanceFechaField.value) {
            // Limpiar el campo de descarga CSV para evitar conflictos
            var downloadField = document.getElementById('custpage_download');
            if (downloadField) downloadField.value = '';
            
            // Enviar el formulario
            document.forms[0].submit();
        } else {
            alert('Por favor seleccione una fecha para consultar el balance.');
        }
    }
    
    return { 
        descargarCSV: descargarCSV,
        consultarBalanceFecha: consultarBalanceFecha
    };
}); 