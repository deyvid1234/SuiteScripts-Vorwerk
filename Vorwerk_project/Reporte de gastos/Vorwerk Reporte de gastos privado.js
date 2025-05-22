/**
 * @NApiVersion 2.1
 * @NScriptType Suitelet
 */
define(['N/search', 'N/record', 'N/email'],
function(search, record, email) {
    
    function onRequest(context) {
        if (context.request.method === 'POST') {
            var email = context.request.parameters.email;
            
            try {
                // Buscar el empleado
                var employeeSearch = search.create({
                    type: search.Type.EMPLOYEE,
                    filters: [
                        ['email', 'is', email],
                        ['isinactive', 'is', 'F']
                    ],
                    columns: ['internalid']
                });

                var employeeResult = employeeSearch.run().getRange({start: 0, end: 1})[0];
                
                if (!employeeResult) {
                    throw new Error('Empleado no encontrado o inactivo');
                }

                // Generar código de 6 dígitos
                var code = Math.floor(100000 + Math.random() * 900000).toString();
                
                // Actualizar el empleado
                record.submitFields({
                    type: record.Type.EMPLOYEE,
                    id: employeeResult.id,
                    values: {
                        custentity_expense_validation_code: code,
                        custentity_expense_code_date: new Date()
                    }
                });

                // Enviar el código por email
                email.send({
                    author: -5,
                    recipients: email,
                    subject: 'Código de Validación - Reporte de Gastos',
                    body: 'Su código de validación es: ' + code + '\n\nEste código expirará al final del día.'
                });

                context.response.write(JSON.stringify({
                    success: true,
                    message: 'Código enviado exitosamente'
                }));

            } catch (e) {
                context.response.write(JSON.stringify({
                    success: false,
                    message: e.message
                }));
            }
        }
    }

    return {
        onRequest: onRequest
    };
})