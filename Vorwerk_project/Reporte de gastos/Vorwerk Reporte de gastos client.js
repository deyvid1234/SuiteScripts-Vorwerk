/**
 * @NApiVersion 2.x
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'],
function(url, currentRecord) {
    
    function generateCode() {
        var email = currentRecord.getValue('custpage_employee_email');
        
        if (!email) {
            alert('Por favor ingrese su correo electrónico');
            return;
        }

        // Llamar al Suitelet de generación de código
        var suiteletUrl = url.resolveScript({
            scriptId: 'customscript_expense_validation_suitelet',
            deploymentId: 'customdeploy_expense_validation_suitelet',
            returnExternalUrl: false
        });

        fetch(suiteletUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: 'email=' + encodeURIComponent(email)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('Se ha enviado un código de validación a su correo electrónico');
            } else {
                alert('Error: ' + data.message);
            }
        })
        .catch(error => {
            alert('Error al generar el código: ' + error);
        });
    }

    return {
        generateCode: generateCode
    };
});