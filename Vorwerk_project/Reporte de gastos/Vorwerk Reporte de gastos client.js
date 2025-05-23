/**
 * @NApiVersion 2.1
 * @NScriptType ClientScript
 */
define(['N/url', 'N/email', 'N/https'],
    function(url, email, https) {
        function pageInit(context) {
            console.log('Script de cliente inicializado');
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
            console.log('Función generateCode iniciada');
            
            var emailField = document.getElementById('custpage_employee_email');
            var email = emailField.value;
            
            console.log('Email capturado:', email);

            if (!email) {
                console.log('Email vacío');
                alert('Por favor ingrese su correo electrónico');
                return;
            }

            // URL del Suitelet
            var suiteletUrl = 'https://3367613.extforms.netsuite.com/app/site/hosting/scriptlet.nl?script=1709&deploy=1&compid=3367613&ns-at=AAEJ7tMQ8KXxkUIGS1s8DbvutodcMzXFIYzHLl0aGjJUUaauqDc';
            
            // Realizar el request
            var response = https.post({
                url: suiteletUrl,
                body: JSON.stringify({
                    action: 'generateCode',
                    email: email
                }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            console.log('Respuesta recibida:', response);
            alert('Se ha enviado un código de validación a su correo electrónico');
        }
    
        return {
            pageInit: pageInit,
            fieldChanged: fieldChanged,
            generateCode: generateCode
        };
    });