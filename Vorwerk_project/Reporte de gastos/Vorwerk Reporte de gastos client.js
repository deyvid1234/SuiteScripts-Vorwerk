/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/currentRecord'],
function(url, currentRecord) {
    function pageInit(scriptContext) {
        
        return true;
    }

    /**
     * Function to be executed when field is changed.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     * @param {number} scriptContext.lineNum - Line number. Will be undefined if not a sublist or matrix field
     * @param {number} scriptContext.columnNum - Line number. Will be undefined if not a matrix field
     *
     * @since 2015.2
     */
    function fieldChanged(scriptContext) {
        return true;
    }

    /**
     * Function to be executed when field is slaved.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.currentRecord - Current form record
     * @param {string} scriptContext.sublistId - Sublist name
     * @param {string} scriptContext.fieldId - Field name
     *
     * @since 2015.2
     */
    
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
        pageInit: pageInit,
        fieldChanged: fieldChanged,
        generateCode: generateCode
    };
});